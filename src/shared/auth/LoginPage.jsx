import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

export default function LoginPage() {
  const { login, status, user } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resetMessage, setResetMessage] = useState('')

  if (status === 'authenticated') {
    if (user?.role === 'teacher') return <Navigate to="/teacher-dashboard" replace />
    return <Navigate to="/portal" replace />
  }

  async function handleResetPassword() {
    if (!username) {
      setError('Veuillez entrer votre adresse email ci-dessus pour réinitialiser le mot de passe.')
      return
    }
    try {
      await resetPassword(username)
      setResetMessage('Un email de réinitialisation vous a été envoyé.')
      setError('')
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi de l\'email de réinitialisation.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setResetMessage('')
    setSubmitting(true)
    
    try {
      await login(username, password)
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
    <div className="min-h-svh flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="mx-auto mb-4 flex justify-center">
            <img src="/images/ardoise_lockup_horizontal.png" alt="Ardoise Logo" className="h-12 w-auto invert mix-blend-screen" />
          </Link>
          <h1 className="text-2xl font-semibold text-white">Connexion</h1>
          <p className="mt-1 text-sm text-slate-400">Accédez à votre espace</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200"
        >
          <div className="mb-4">
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700">
              Identifiant ou Email
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="mb-5">
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {error && (
            <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </p>
          )}

          {resetMessage && (
            <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 ring-1 ring-green-200">
              {resetMessage}
            </p>
          )}

          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Mot de passe oublié ?
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {submitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-semibold text-white hover:text-indigo-400 transition">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  )
}
