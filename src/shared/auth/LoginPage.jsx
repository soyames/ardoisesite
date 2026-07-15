import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { setApiBaseUrl } from '../../config/env.js'
import { primeCsrf } from '../api/client.js'

export default function LoginPage() {
  const { login, status } = useAuth()
  const [schoolCode, setSchoolCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    
    try {
      if (schoolCode.trim()) {
        // Construct the expected backend URL for this school
        // Ex: LALIBERTE -> https://api.laliberte.soyames.com
        const subdomain = schoolCode.trim().toLowerCase()
        setApiBaseUrl(`https://api.${subdomain}.soyames.com`)
        await primeCsrf() // Need to fetch CSRF from the new backend
      } else {
        // Clear it to use the default/platform URL
        setApiBaseUrl('')
        await primeCsrf()
      }
      
      await login(username, password)
    } catch (err) {
      setError(err.message || 'Connexion impossible. Vérifiez le Code École et vos identifiants.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white shadow-lg shadow-indigo-500/30">
            A
          </Link>
          <h1 className="text-2xl font-semibold text-white">Connexion Ardoise</h1>
          <p className="mt-1 text-sm text-slate-400">Accédez à votre espace</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200"
        >
          <div className="mb-4">
            <label htmlFor="schoolCode" className="mb-1.5 block text-sm font-medium text-slate-700">
              Code École <span className="text-slate-400 font-normal">(Optionnel pour tuteurs)</span>
            </label>
            <input
              id="schoolCode"
              type="text"
              placeholder="Ex: LALIBERTE"
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

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
