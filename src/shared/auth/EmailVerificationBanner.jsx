import { useState } from 'react'
import { sendEmailVerification } from 'firebase/auth'
import { auth } from '../api/firebase.js'
import { useAuth } from './AuthContext.jsx'

/**
 * Shown whenever AuthContext flags needsEmailVerification - i.e.
 * FirebaseLoginView refused to establish a real ERP session
 * (403 error="email_not_verified") because the link from
 * sendEmailVerification() at signup hasn't been clicked yet. Without
 * this the user just silently had no real access with nothing
 * explaining why (see AuthContext.jsx's own comment on the catch
 * block this flag comes from).
 */
export default function EmailVerificationBanner() {
  const { user } = useAuth()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  if (!user?.needsEmailVerification) return null

  const handleResend = async () => {
    setSending(true)
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser)
        setSent(true)
      }
    } catch (err) {
      console.error('Failed to resend verification email:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-b border-warning-500/30 bg-warning-50 px-4 py-3">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <p className="text-sm font-medium text-warning-700">
          Verifiez votre adresse email ({user.email}) pour acceder a votre espace. Consultez votre boite de reception (et vos spams).
        </p>
        <button
          onClick={handleResend}
          disabled={sending || sent}
          className="shrink-0 rounded-control bg-warning-500/20 px-3 py-1.5 text-xs font-bold text-warning-700 transition hover:bg-warning-500/30 disabled:opacity-60"
        >
          {sent ? 'Email renvoye !' : sending ? 'Envoi...' : "Renvoyer l'email"}
        </button>
      </div>
    </div>
  )
}
