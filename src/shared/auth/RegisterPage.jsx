import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { doc, setDoc, addDoc, collection } from 'firebase/firestore'
import { auth, db } from '../api/firebase.js'
import { useAuth } from './AuthContext.jsx'
import { isSaasHost } from './domainRedirect.js'

import { FRANCOPHONE_AFRICA_DATA as WEST_AFRICA_DATA } from '../constants/locations.js'

const INPUT_CLASS = "relative block w-full rounded-control border-0 bg-surface-raised py-2.5 px-3 text-ink ring-1 ring-inset ring-border placeholder:text-ink-muted focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"

export default function RegisterPage() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  // Only schools register here on the SaaS domain; parents and
  // teachers register on the marketplace (see domainRedirect.js) - the
  // role picker below only ever offers the one choice that's actually
  // valid on the current domain, rather than letting someone create a
  // founder account on the marketplace or a parent account on saas.*
  // and never see the right dashboard.
  const isSaas = isSaasHost()
  const [role, setRole] = useState(isSaas ? 'founder' : 'parent')
  const [country, setCountry] = useState('Benin')
  const [city, setCity] = useState(WEST_AFRICA_DATA['Benin'][0])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.target)
    const email = formData.get('email')
    const password = formData.get('password')
    const name = formData.get('name')
    const phone = formData.get('phone')

    try {
      // 1. Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 2. Setup School if founder
      // No backendUrl here - there is nothing real to put yet.
      // Ardoise never hosts a school's own data; backendUrl is
      // reported by the school's own self-hosted Django instance once
      // deployed, authenticated via its activation code (see
      // ardoise-api's POST /api/marketplace/backend-url and
      // apps/core/marketplace_client.report_backend_url on the Django
      // side). Writing a fake placeholder here used to make this
      // account look immediately usable when it wasn't - see
      // handleRegister's post-registration messaging below.
      let schoolId = null;
      const searchParams = new URLSearchParams(window.location.search);
      const referrerId = searchParams.get('ref') || null;

      if (role === 'founder') {
        const schoolName = formData.get('schoolName') || 'Mon École';
        const schoolDocRef = await addDoc(collection(db, 'schools'), {
          name: schoolName,
          city,
          country,
          isFull: false,
          referrerId, // Store who referred this school for commissions
          createdAt: new Date().toISOString()
        });
        schoolId = schoolDocRef.id;
      }

      // 3. Save profile to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        name,
        phone,
        role,
        country,
        city,
        referrerId, // Keep it on the user doc as well
        ...(schoolId ? { schoolId } : {}),
        createdAt: new Date().toISOString()
      })

      // 3. Send email verification (non-blocking)
      await sendEmailVerification(user).catch(err => {
        console.warn("Failed to send verification email:", err)
      })

      // 4. Force auth context to fetch the new Firestore document
      await refreshUser()

      if (role === 'founder') {
        // Honest about what just happened: a founder account exists,
        // but there is no working ERP behind it yet - that only
        // happens once they deploy their own Ardoise instance and it
        // reports itself back (see the comment above). Sending them
        // to /portal here used to silently fail (AuthContext.jsx
        // catches the dead lookup and swallows it), leaving a founder
        // logged in with no visible next step.
        alert(
          "Compte créé ! Votre école n'est pas encore connectée : installez votre propre instance " +
          'Ardoise (voir le guide ci-dessous), puis reliez-la depuis votre tableau de bord une fois ' +
          'connecté.'
        )
        navigate('/install')
      } else if (role === 'teacher') {
        alert('Inscription réussie ! Un email de vérification vous a été envoyé (facultatif pour les tests).')
        navigate('/teacher-dashboard')
      } else {
        alert('Inscription réussie ! Un email de vérification vous a été envoyé (facultatif pour les tests).')
        navigate('/portal')
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Cet email est déjà utilisé.')
      } else if (err.code === 'auth/weak-password') {
        setError('Le mot de passe doit contenir au moins 6 caractères.')
      } else {
        setError(err.message || 'Erreur lors de l\'inscription.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink">
            {isSaas ? 'Inscrivez votre école' : 'Inscription'}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            {isSaas
              ? "Créez le compte fondateur de votre établissement pour installer Ardoise."
              : 'Rejoignez la plateforme éducative'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4 rounded-card shadow-card bg-surface-raised p-6">
            <Link to="/" className="mx-auto mb-6 flex justify-center">
              <img src="/images/ardoise_lockup_horizontal_white.png" alt="Ardoise Logo" className="h-12 w-auto" />
            </Link>

            {/* SaaS is for founders (ERP) and developers (API/Partner) */}
            {isSaas ? (
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Je souhaite créer un compte...</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="founder">Fondateur d'école (Lancer mon ERP)</option>
                  <option value="developer">Développeur (Intégration API & Partenaire)</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Je suis un(e)...</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="parent">Parent (Pour trouver un tuteur)</option>
                  <option value="teacher">Professeur (Pour donner des cours)</option>
                </select>
              </div>
            )}

            <div>
              <label htmlFor="name" className="sr-only">Nom complet</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className={INPUT_CLASS}
                placeholder="Nom complet"
              />
            </div>
            {role === 'founder' && (
              <div>
                <label htmlFor="schoolName" className="sr-only">Nom de l'école</label>
                <input
                  id="schoolName"
                  name="schoolName"
                  type="text"
                  required
                  className={INPUT_CLASS}
                  placeholder="Nom de l'école (ex: CS Bâtisseur)"
                />
              </div>
            )}
            <div>
              <label htmlFor="phone" className="sr-only">Numéro de téléphone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className={INPUT_CLASS}
                placeholder="Numéro de téléphone"
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Adresse Email</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={INPUT_CLASS}
                placeholder="Adresse Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={INPUT_CLASS}
                placeholder="Mot de passe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Pays</label>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value)
                  setCity(WEST_AFRICA_DATA[e.target.value][0])
                }}
                className={INPUT_CLASS}
              >
                {Object.keys(WEST_AFRICA_DATA).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">Ville</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={INPUT_CLASS}
              >
                {WEST_AFRICA_DATA[country].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="rounded-card bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-500/20">
              {error}
            </p>
          )}

          <div className="flex items-start gap-2">
            <input
              id="terms-accepted"
              name="termsAccepted"
              type="checkbox"
              required
              className="mt-0.5 h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="terms-accepted" className="text-sm text-ink-muted">
              J'accepte les{' '}
              <Link to="/terms" target="_blank" className="font-semibold text-primary-600 hover:text-primary-500">
                Conditions Générales d'Utilisation
              </Link>{' '}
              et la{' '}
              <Link to="/privacy" target="_blank" className="font-semibold text-primary-600 hover:text-primary-500">
                Politique de Confidentialité
              </Link>
              .
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-control bg-primary-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-60"
            >
              {loading ? "Inscription..." : "S'inscrire"}
            </button>
          </div>
        </form>

        <div className="flex flex-col items-center gap-3 mt-4">
          <p className="text-center text-sm text-ink-muted">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500 transition">
              Connectez-vous
            </Link>
          </p>
          <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-500 transition">
            Mot de passe oublié ?
          </Link>
        </div>
      </div>
    </div>
  )
}
