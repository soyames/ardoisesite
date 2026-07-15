import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, ApiError, primeCsrf } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // loading | authenticated | anonymous

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      await primeCsrf()
      try {
        const me = await api.get('/api/auth/me/')
        if (!cancelled) {
          setUser(me)
          setStatus('authenticated')
        }
      } catch (err) {
        // 403 here just means "no active session yet" (see MeView's
        // docstring on the backend for why it's 403 not 401) -- not
        // an error worth surfacing, just "show the login screen".
        if (!cancelled) setStatus('anonymous')
      }
    }
    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (username, password) => {
    const me = await api.post('/api/auth/login/', { username, password })
    setUser(me)
    setStatus('authenticated')
    return me
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout/')
    } finally {
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { ApiError }
