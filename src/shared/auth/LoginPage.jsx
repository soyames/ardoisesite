import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { roleMatchesCurrentDomain, redirectToCorrectDomain } from './domainRedirect.js'

export default function LoginPage() {
  const { login, status, user } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated') {
    const path = user?.role === 'teacher' ? '/teacher-dashboard' : '/portal'
    // Redirect cross-origin immediately rather than routing to /portal
    // first and letting RequireRole catch it a render later - avoids
    // flashing the wrong domain's portal shell (and firing its own API
    // calls against a school that isn't this user's) before bouncing.
    if (!roleMatchesCurrentDomain(user.role)) {
      redirectToCorrectDomain(user.role, path)
      return null
    }
    return <Navigate to={path} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      let loginId = username.trim();
      if (!loginId.includes('@')) {
        loginId = `${loginId}@student.ardoise.local`;
      }
      await login(loginId, password)
    } catch (err) {
      // Firebase throws specific errors
      if (err.code === 'auth/invalid-credential') {
        setError('Identifiants incorrects.')
      } else {
        setError(err.message || 'Connexion impossible.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-ink">Connexion</h1>
          <p className="mt-1 text-sm text-ink-muted">Accédez à votre espace</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-card border border-border bg-surface-raised p-6 shadow-card"
        >
          <Link to="/" className="mx-auto mb-6 flex justify-center">
            <img src="/images/ardoise_lockup_horizontal_white.png" alt="Ardoise Logo" className="h-12 w-auto" />
          </Link>

          <div className="mb-4">
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-ink">
              Identifiant ou Email
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-control border border-border bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="mb-5">
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-control border border-border bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {error && (
            <p className="mb-4 rounded-card bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-500/20">
              {error}
            </p>
          )}

          <div className="mb-4 flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-control bg-primary-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-60"
          >
            {submitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-muted">
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500 transition">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  )
}
