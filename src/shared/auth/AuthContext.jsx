import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../api/firebase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // loading | authenticated | anonymous

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              emailVerified: firebaseUser.emailVerified,
              ...userData
            })
          } else {
            // Document might not be created yet during registration flow
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              emailVerified: firebaseUser.emailVerified,
              role: 'pending'
            })
          }
          setStatus('authenticated')
        } catch (error) {
          console.error("Error fetching user profile:", error)
          setStatus('anonymous')
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

