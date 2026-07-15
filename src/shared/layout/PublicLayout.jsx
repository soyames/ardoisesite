import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { usePwaInstall } from '../hooks/usePwaInstall.js'

export default function PublicLayout() {
  const { user, logout } = useAuth()
  const { isInstallable, promptInstall } = usePwaInstall()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-svh flex-col bg-slate-50 font-sans text-slate-900">
      {/* Modern, Premium Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200/50 bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/ardoise_lockup_horizontal.png" alt="Ardoise Logo" className="h-10 w-auto mix-blend-multiply" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-6">
            <Link to="/schools" className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600">
              Écoles
            </Link>
            <Link to="/teachers" className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600">
              Tuteurs à domicile
            </Link>
            <Link to="/jobs" className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600">
              Recrutement
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* PWA Install Button (Visible if prompt is available) */}
          {isInstallable && (
            <button
              onClick={promptInstall}
              className="hidden md:block rounded-lg bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 ring-1 ring-inset ring-indigo-200 transition hover:bg-indigo-100"
            >
              Installer l'App
            </button>
          )}

          {user ? (
            <div className="hidden md:flex items-center gap-4">
              {user.role === 'teacher' && (
                <Link
                  to="/teacher-dashboard"
                  className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
                >
                  Espace Tuteur
                </Link>
              )}
              <Link
                to="/portal"
                className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
              >
                Mon Portail
              </Link>
              <button
                onClick={logout}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/register"
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                S'inscrire
              </Link>
              <Link
                to="/login"
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 hover:shadow-lg"
              >
                Connexion
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button 
            type="button" 
            className="md:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-slate-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Ouvrir le menu</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-6 py-4 space-y-4 shadow-sm">
          {isInstallable && (
            <button
              onClick={promptInstall}
              className="w-full rounded-lg bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 ring-1 ring-inset ring-indigo-200 transition hover:bg-indigo-100"
            >
              Installer l'Application
            </button>
          )}
          
          <nav className="flex flex-col gap-4 pt-2">
            <Link to="/schools" className="text-base font-semibold text-slate-900" onClick={() => setMobileMenuOpen(false)}>Écoles</Link>
            <Link to="/teachers" className="text-base font-semibold text-slate-900" onClick={() => setMobileMenuOpen(false)}>Tuteurs à domicile</Link>
            <Link to="/jobs" className="text-base font-semibold text-slate-900" onClick={() => setMobileMenuOpen(false)}>Recrutement</Link>
            <hr className="border-slate-100" />
            
            {user ? (
              <>
                {user.role === 'teacher' && (
                  <Link to="/teacher-dashboard" className="text-base font-semibold text-indigo-600" onClick={() => setMobileMenuOpen(false)}>Espace Tuteur</Link>
                )}
                <Link to="/portal" className="text-base font-semibold text-indigo-600" onClick={() => setMobileMenuOpen(false)}>Mon Portail</Link>
                <button onClick={() => { logout(); setMobileMenuOpen(false) }} className="text-left text-base font-semibold text-slate-500">Déconnexion</button>
              </>
            ) : (
              <Link to="/login" className="text-base font-semibold text-indigo-600" onClick={() => setMobileMenuOpen(false)}>Connexion</Link>
            )}
          </nav>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col items-center gap-6">
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <Link to="/install" className="text-sm font-medium text-slate-500 hover:text-slate-900">
              Pour les Écoles (Installation)
            </Link>
            <Link to="/privacy" className="text-sm font-medium text-slate-500 hover:text-slate-900">
              Confidentialité
            </Link>
            <Link to="/terms" className="text-sm font-medium text-slate-500 hover:text-slate-900">
              Conditions d'Utilisation
            </Link>
          </nav>
          <p className="text-sm font-medium text-slate-400">
            © 2026 Ardoise Platform. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  )
}
