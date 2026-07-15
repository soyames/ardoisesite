import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../api/firebase.js'
import { api, primeCsrf } from '../api/client.js'

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

          // 2. Establish Django session using the Firebase ID token and role
          const token = await firebaseUser.getIdToken()
          await primeCsrf()
          await api.post('/api/auth/firebase-login/', { token, role, schoolId })
          
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
          console.error("Error fetching user profile:", error)
          // Fallback to mock DB if Firestore rules block access during testing
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

