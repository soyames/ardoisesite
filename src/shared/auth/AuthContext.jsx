import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
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
          
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
            if (userDoc.exists()) {
              userData = userDoc.data()
              role = userData.role || 'parent'
              schoolId = userData.schoolId || null
            } else {
              role = 'pending'
            }
          } catch (firestoreErr) {
            console.error("Error fetching user profile:", firestoreErr)
            // Fallback to mock DB if Firestore rules block access during testing
            const { mockDb } = await import('../api/mockDb.js')
            const mockUser = Object.values(mockDb.users).find(u => u.email === firebaseUser.email)
            if (mockUser) {
              userData = mockUser
              role = mockUser.role
              schoolId = mockUser.schoolId
            }
          }

          // 2. Point the API client at THIS school's own backend before
          // calling it -- must happen before primeCsrf/firebase-login,
          // not after, since those calls themselves need to land on
          // the right school's Django instance (only it has the
          // FIREBASE_SERVICE_ACCOUNT credential to verify this token).
          await resolveSchoolBackendUrl(schoolId)

          // 3. Establish Django session using the Firebase ID token and role
          const token = await firebaseUser.getIdToken()
          try {
            await primeCsrf()
            await api.post('/api/auth/firebase-login/', { token, role, schoolId })
          } catch (djangoErr) {
            console.warn("Django backend login failed (ignoring for frontend-only mode):", djangoErr)
          }
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            role,
            schoolId,
            ...(userData || {})
          })
          setStatus('authenticated')
        } catch (error) {
          console.error("Critical auth error:", error)
          // Fallback if everything completely fails
          const { mockDb } = await import('../api/mockDb.js')
          const mockUser = Object.values(mockDb.users).find(u => u.email === firebaseUser.email)
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            role: mockUser ? mockUser.role : 'parent',
            ...(mockUser || {})
          })
          setStatus('authenticated')
        }
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
        setUser(prev => ({ ...prev, ...userDoc.data() }))
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

