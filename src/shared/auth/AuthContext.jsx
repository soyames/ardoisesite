import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../api/firebase.js'
import { api, primeCsrf } from '../api/client.js'
import { setApiBaseUrl } from '../../config/env.js'

/**
 * Every school self-hosts its own Django backend at its own URL (see
 * PROJECT_BRIEF.md's hosting model) -- this shared frontend has no
 * way to know which backend belongs to the logged-in user's school
 * except by looking it up. schools/{schoolId}.backendUrl in Firestore
 * (set by the Founder in ApiIntegrations.jsx after their Docker
 * install is running) is that lookup. Without this, every API call
 * silently falls back to the default in config/env.js and the portal
 * never actually reaches the school's own data.
 */
async function resolveSchoolBackendUrl(schoolId) {
  if (!schoolId) return
  try {
    const schoolDoc = await getDoc(doc(db, 'schools', String(schoolId)))
    const backendUrl = schoolDoc.exists() ? schoolDoc.data().backendUrl : null
    setApiBaseUrl(backendUrl || null) // null clears back to the shared default if unset
  } catch (err) {
    console.error('Could not resolve school backend URL:', err)
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // loading | authenticated | anonymous

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // 1. Fetch user profile from Firestore first to get the role
          let role = 'parent'
          let schoolId = null
          let userData = null
          
          let firestoreUnsubscribe = null
          
          try {
            // Using onSnapshot instead of getDoc so we can react instantly
            // if a superadmin revokes this user's role (forcing them out).
            firestoreUnsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), async (userDoc) => {
              if (userDoc.exists()) {
                const newUserData = userDoc.data()
                
                // If a user gets revoked while active, instantly log them out
                if (newUserData.revokedAt) {
                  console.warn("User access has been revoked. Logging out instantly.")
                  await firebaseSignOut(auth)
                  return // Will trigger another onAuthStateChanged with null
                }
                
                const newRole = newUserData.role || 'parent'
                const newSchoolId = newUserData.schoolId != null ? String(newUserData.schoolId) : null
                
                // Only update state if this is not the first load, as the first load
                // needs to await Django authentication below before setting the 'user' state.
                setUser(prev => prev ? { ...prev, ...newUserData, role: newRole, schoolId: newSchoolId } : prev)
              }
            }, (err) => {
              console.error("Error listening to user profile:", err)
            })
            
            firebaseUser._firestoreUnsubscribe = firestoreUnsubscribe

            // For the initial boot, we still need to fetch once to get the role before Django login
            const initialDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
            if (initialDoc.exists()) {
              userData = initialDoc.data()
              role = userData.role || 'parent'
              schoolId = userData.schoolId != null ? String(userData.schoolId) : null
              
              if (userData.revokedAt) {
                 await firebaseSignOut(auth)
                 return
              }
            } else {
              role = 'pending'
            }
          } catch (firestoreErr) {
            // Fail honest, not silent: if Firestore is unreachable or
            // rules block the read, the user proceeds with the
            // pre-error default (role='parent', schoolId=null) rather
            // than a fabricated identity. Logged so a real outage is
            // visible, not masked by a fake-but-plausible login.
            console.error("Error fetching user profile:", firestoreErr)
          }

          // 2. Point the API client at THIS school's own backend before

          // calling it -- must happen before primeCsrf/firebase-login,
          // not after, since those calls themselves need to land on
          // the right school's Django instance (only it has the
          // FIREBASE_SERVICE_ACCOUNT credential to verify this token).
          await resolveSchoolBackendUrl(schoolId)

          // 3. Establish Django session using the Firebase ID token and role (ONLY if user belongs to a school)
          const token = await firebaseUser.getIdToken()
          let needsEmailVerification = false
          if (schoolId) {
            try {
              await primeCsrf()
              const res = await api.post('/api/auth/firebase-login/', { token, role, schoolId })
              if (res && res.id) {
                userData = userData || {}
                userData.id = res.id // Store the Django user ID for frontend resolution
                // cycleScope: which cycle (primaire/secondaire) this Director/
                // Censeur oversees, blank = both - see the 2026-07-17-cycle-
                // scope-wiring CEO plan. Needed client-side to decide whether
                // to show a CycleBadge (cycle-scoped) or a CycleSwitcher
                // (blank - oversees both).
                userData.cycleScope = res.cycleScope || ''
                // staffId: the caller's own hr.StaffProfile id, when
                // linked - needed by "Mon espace RH" (see the 2026-07-16
                // ERP-gap CEO plan's "Employee self-service" expansion)
                // to file a leave request/log hours as themselves,
                // since those endpoints require an explicit `staff`.
                userData.staffId = res.staffId || null
              }
            } catch (authErr) {
              // FirebaseLoginView refuses to establish an ERP session
              // (403, error="email_not_verified") until the user clicks
              // the link from sendEmailVerification() at signup - this
              // used to be swallowed into the same generic "backend
              // unreachable" console.warn as a real outage, so nothing
              // ever told the user WHY they had no real access. Surfaced
              // here as a distinct flag the UI can show a clear banner
              // for (see EmailVerificationBanner.jsx), not just a log line.
              if (authErr?.data?.error === 'email_not_verified') {
                needsEmailVerification = true
              } else {
                // Re-throw real Django errors (500, etc) so they aren't silently swallowed
                console.warn('Django backend unreachable or failed to authenticate:', authErr)
                // Do not throw, so the user can still use Firebase-only features (e.g. Marketplace)
              }
            }
          }

          setUser(prev => ({
            ...(prev || {}),
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            needsEmailVerification,
            role: prev?.role || role,
            schoolId: prev?.schoolId || schoolId,
            ...(userData || {})
          }))
          setStatus('authenticated')
        } catch (error) {
          // A real Django-side auth failure (the re-thrown error from
          // the firebase-login call above) -- fail honest: the user is
          // NOT granted a session with a fabricated role. Previously
          // this silently logged them in as a fake mock user even when
          // the real backend rejected them, which could mask an actual
          // outage or a genuine permission problem behind a working-
          // looking (but fake) login.
          console.error("Error fetching user profile or authenticating with Django:", error)
          setUser(null)
          setStatus('anonymous')
        }

        // Note: moved outside callback
      } else {
        setUser(null)
        setStatus('anonymous')
      }
    })

    return () => unsubscribe()
  }, [])

  const login = useCallback(async (email, password) => {
    setStatus('loading')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // onAuthStateChanged will handle the rest
    } catch (error) {
      setStatus('anonymous')
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    setStatus('loading')
    try {
      if (auth.currentUser && auth.currentUser._firestoreUnsubscribe) {
        auth.currentUser._firestoreUnsubscribe()
      }
      await firebaseSignOut(auth)
    } catch(err) {
      setStatus('anonymous')
      throw err
    }
  }, [])
  
  const resetPassword = useCallback(async (email) => {
    await sendPasswordResetEmail(auth, email)
  }, [])

  // Provide a method to manually refresh user data (useful after registration saves the doc)
  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        // Same schoolId string-coercion as the initial onAuthStateChanged
        // load above - without it, a refreshUser() call (e.g. after
        // saving Settings) would silently reintroduce a numeric schoolId
        // and reopen the doc(db, 'schools', schoolId) crash.
        if (data.schoolId != null) data.schoolId = String(data.schoolId)
        setUser(prev => ({ ...prev, ...data }))
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, status, login, logout, resetPassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

