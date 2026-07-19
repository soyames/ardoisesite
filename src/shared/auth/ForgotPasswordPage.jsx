import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      await resetPassword(email)
      setSuccess('Un email de réinitialisation vous a été envoyé. Vérifiez votre boîte de réception (et vos spams).')
      setEmail('')
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        // Obfuscate whether email exists for security
        setSuccess('Si cette adresse est enregistrée, un email de réinitialisation vous a été envoyé.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Adresse email invalide.')
      } else {
        setError(err.message || "Erreur lors de l'envoi de l'email.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="mx-auto mb-4 flex justify-center">
            <img src="/images/ardoise_lockup_horizontal.png" alt="Ardoise Logo" className="h-12 w-auto mix-blend-multiply" />
          </Link>
          <h1 className="text-2xl font-semibold text-ink">Mot de passe oublié</h1>
          <p className="mt-2 text-sm text-ink-muted">Entrez votre email pour réinitialiser votre mot de passe</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-card border border-border bg-surface-raised p-6 shadow-card"
        >
          <div className="mb-5">
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
              Adresse Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-control border border-border bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {error && (
            <p className="mb-4 rounded-card bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-500/20">
              {error}
            </p>
          )}

          {success && (
            <p className="mb-4 rounded-card bg-success-50 px-4 py-3 text-sm text-success-700 ring-1 ring-success-500/20">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-control bg-primary-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-60"
          >
            {submitting ? 'Envoi...' : 'Réinitialiser le mot de passe'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-muted">
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500 transition">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  )
}
