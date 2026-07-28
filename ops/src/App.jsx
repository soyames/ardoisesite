import { useState } from 'react'
import { AuthProvider, useAuth } from '../../src/shared/auth/AuthContext.jsx'
import SuperadminDashboard from '../../src/apps/superadmin/SuperadminDashboard.jsx'

// Mirrors ardoise-api/src/index.ts's TEAM_ROLES and
// domainRedirect.js's PLATFORM_ROLES - keep in sync. Anyone else
// (a school founder/staff, a marketplace parent/teacher) has no
// business on this domain at all.
const PLATFORM_ROLES = new Set([
  'superadmin', 'support_agent', 'school_onboarding', 'dev_onboarding', 'billing_agent', 'marketing_agent',
])

function ForgotPasswordForm({ onBack }) {
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
    <div className="flex min-h-svh items-center justify-center bg-surface px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-card border border-border bg-surface-raised p-6 shadow-card">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-ink">Mot de passe oublié</h1>
          <p className="mt-1 text-sm text-ink-muted">Entrez votre email pour réinitialiser votre mot de passe</p>
        </div>
        <div className="mb-5">
          <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-ink">Email</label>
          <input
            id="reset-email" type="email" autoComplete="username" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-control border border-border bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        {error && (
          <p className="mb-4 rounded-card bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-500/20">{error}</p>
        )}
        {success && (
          <p className="mb-4 rounded-card bg-success-50 px-4 py-3 text-sm text-success-700 ring-1 ring-success-500/20">{success}</p>
        )}
        <button
          type="submit" disabled={submitting}
          className="w-full rounded-control bg-primary-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-60"
        >
          {submitting ? 'Envoi...' : 'Réinitialiser le mot de passe'}
        </button>
        <button
          type="button" onClick={onBack}
          className="mt-4 w-full text-center text-sm font-semibold text-primary-600 hover:text-primary-500"
        >
          Retour à la connexion
        </button>
      </form>
    </div>
  )
}

function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.code === 'auth/invalid-credential' ? 'Identifiants incorrects.' : (err.message || 'Connexion impossible.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (showForgotPassword) {
    return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-surface px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-card border border-border bg-surface-raised p-6 shadow-card">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-ink">Ardoise Ops</h1>
          <p className="mt-1 text-sm text-ink-muted">Réservé à l'équipe Ardoise</p>
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">Email</label>
          <input
            id="email" type="email" autoComplete="username" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-control border border-border bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div className="mb-2">
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">Mot de passe</label>
          <input
            id="password" type="password" autoComplete="current-password" required
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-control border border-border bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div className="mb-5 text-right">
          <button
            type="button" onClick={() => setShowForgotPassword(true)}
            className="text-sm font-semibold text-primary-600 hover:text-primary-500"
          >
            Mot de passe oublié ?
          </button>
        </div>
        {error && (
          <p className="mb-4 rounded-card bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-500/20">{error}</p>
        )}
        <button
          type="submit" disabled={submitting}
          className="w-full rounded-control bg-primary-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-60"
        >
          {submitting ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}

function WrongAccount() {
  const { user, logout } = useAuth()
  return (
    <div className="flex min-h-svh items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface-raised p-6 text-center shadow-card">
        <h1 className="text-lg font-semibold text-ink">Accès non autorisé</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {user?.email} n'est pas un compte d'équipe Ardoise. Ce portail est réservé au personnel interne.
        </p>
        <button
          onClick={logout}
          className="mt-4 w-full rounded-control bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  )
}

function Gate() {
  const { status, user, logout } = useAuth()

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  if (status === 'anonymous') return <LoginForm />
  if (!PLATFORM_ROLES.has(user?.role)) return <WrongAccount />

  return (
    <div className="min-h-svh bg-surface">
      <header className="flex items-center justify-between border-b border-border bg-surface-raised px-6 py-3">
        <span className="text-sm font-semibold text-ink">Ardoise Ops</span>
        <button onClick={logout} className="text-sm text-ink-muted hover:text-ink">Déconnexion ({user.email})</button>
      </header>
      <main className="p-6">
        <SuperadminDashboard />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
