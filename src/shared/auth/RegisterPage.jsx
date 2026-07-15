import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../api/firebase.js'
import { useAuth } from './AuthContext.jsx'

import { FRANCOPHONE_AFRICA_DATA as WEST_AFRICA_DATA } from '../constants/locations.js'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [role, setRole] = useState('parent')
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

      // 2. Save profile to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        name,
        phone,
        role,
        country,
        city,
        createdAt: new Date().toISOString()
      })

      // 3. Send email verification (non-blocking)
      await sendEmailVerification(user).catch(err => {
        console.warn("Failed to send verification email:", err)
      })

      // 4. Force auth context to fetch the new Firestore document
      await refreshUser()

      alert('Inscription réussie ! Un email de vérification vous a été envoyé (facultatif pour les tests).')

      if (role === 'founder') {
        navigate('/portal')
      } else if (role === 'teacher') {
        navigate('/teacher-dashboard')
      } else {
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="mb-8 text-center">
          <Link to="/" className="mx-auto mb-4 flex justify-center">
            <img src="/images/ardoise_lockup_horizontal.png" alt="Ardoise Logo" className="h-12 w-auto mix-blend-multiply" />
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Inscription
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Rejoignez la plateforme éducative
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4 rounded-md shadow-sm">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Je suis un(e)...</label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="parent">Parent (Pour trouver un tuteur)</option>
                <option value="teacher">Professeur (Pour donner des cours)</option>
                <option value="founder">Fondateur d'école (Pour installer Ardoise)</option>
              </select>
            </div>

            <div>
              <label htmlFor="name" className="sr-only">Nom complet</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Nom complet"
              />
            </div>
            <div>
              <label htmlFor="phone" className="sr-only">Numéro de téléphone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Mot de passe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pays</label>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value)
                  setCity(WEST_AFRICA_DATA[e.target.value][0])
                }}
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                {Object.keys(WEST_AFRICA_DATA).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                {WEST_AFRICA_DATA[country].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60"
            >
              {loading ? "Inscription..." : "S'inscrire"}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-slate-600">
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  )
}
