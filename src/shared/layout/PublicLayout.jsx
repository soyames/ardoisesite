import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { usePwaInstall } from '../hooks/usePwaInstall.js'

export default function PublicLayout() {
  const { user, logout } = useAuth()
  const { promptInstall, isIOS, canOfferInstall } = usePwaInstall()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showIosInstructions, setShowIosInstructions] = useState(false)

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIosInstructions((v) => !v)
    } else {
      promptInstall()
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-surface font-sans text-ink">
      {/* Modern, Premium Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-surface-raised/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/ardoise_lockup_horizontal.png" alt="Ardoise Logo" className="h-10 w-auto mix-blend-multiply" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-6">
            <Link to="/schools" className="text-sm font-semibold text-ink-muted transition hover:text-primary-600">
              Écoles
            </Link>
            <Link to="/teachers" className="text-sm font-semibold text-ink-muted transition hover:text-primary-600">
              Tuteurs à domicile
            </Link>
            <Link to="/jobs" className="text-sm font-semibold text-ink-muted transition hover:text-primary-600">
              Recrutement
            </Link>
            <Link to="/how-it-works" className="text-sm font-semibold text-ink-muted transition hover:text-primary-600">
              Comment ça marche
            </Link>
          </nav>
        </div>

        <div className="relative flex items-center gap-4">
          {/* PWA Install Button -- native prompt on Chromium, tap-to-reveal instructions on iOS (which never fires beforeinstallprompt) */}
          {canOfferInstall && (
            <button
              onClick={handleInstallClick}
              className="hidden md:block rounded-control bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700 ring-1 ring-inset ring-primary-200 transition hover:bg-primary-100"
            >
              Installer l'App
            </button>
          )}
          {showIosInstructions && (
            <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-card bg-surface-raised p-4 text-sm text-ink-muted shadow-elevated ring-1 ring-border">
              <p className="mb-2 font-semibold text-ink">Installer sur iPhone/iPad</p>
              <ol className="list-decimal space-y-1 pl-4">
                <li>Appuyez sur l'icône Partager <span aria-hidden>⬆️</span> en bas de Safari</li>
                <li>Choisissez « Sur l'écran d'accueil »</li>
                <li>Appuyez sur « Ajouter »</li>
              </ol>
              <button
                onClick={() => setShowIosInstructions(false)}
                className="mt-3 text-xs font-semibold text-primary-600 hover:text-primary-500"
              >
                Fermer
              </button>
            </div>
          )}

          {user ? (
            <div className="hidden md:flex items-center gap-4">
              {user.role === 'teacher' && (
                <Link
                  to="/teacher-dashboard"
                  className="text-sm font-semibold text-ink-muted transition hover:text-primary-600"
                >
                  Espace Tuteur
                </Link>
              )}
              <Link
                to="/portal"
                className="text-sm font-semibold text-ink-muted transition hover:text-primary-600"
              >
                Mon Portail
              </Link>
              <button
                onClick={logout}
                className="rounded-control px-4 py-2 text-sm font-semibold text-ink-muted transition hover:bg-primary-50 hover:text-ink"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/register"
                className="rounded-control px-4 py-2.5 text-sm font-semibold text-ink-muted hover:bg-primary-50 transition"
              >
                S'inscrire
              </Link>
              <Link
                to="/login"
                className="rounded-control bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-primary-700 hover:shadow-elevated"
              >
                Connexion
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden -m-2.5 inline-flex items-center justify-center rounded-control p-2.5 text-ink-muted"
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
        <div className="md:hidden border-b border-border bg-surface-raised px-6 py-4 space-y-4 shadow-card">
          {canOfferInstall && !isIOS && (
            <button
              onClick={promptInstall}
              className="w-full rounded-control bg-primary-50 px-4 py-3 text-sm font-bold text-primary-700 ring-1 ring-inset ring-primary-200 transition hover:bg-primary-100"
            >
              Installer l'Application
            </button>
          )}
          {canOfferInstall && isIOS && (
            <div className="rounded-control bg-primary-50 p-3 text-xs text-primary-900 ring-1 ring-inset ring-primary-200">
              <p className="mb-1 font-bold">Installer sur iPhone/iPad :</p>
              <p>Appuyez sur Partager <span aria-hidden>⬆️</span> puis « Sur l'écran d'accueil ».</p>
            </div>
          )}

          <nav className="flex flex-col gap-4 pt-2">
            <Link to="/schools" className="text-base font-semibold text-ink" onClick={() => setMobileMenuOpen(false)}>Écoles</Link>
            <Link to="/teachers" className="text-base font-semibold text-ink" onClick={() => setMobileMenuOpen(false)}>Tuteurs à domicile</Link>
            <Link to="/jobs" className="text-base font-semibold text-ink" onClick={() => setMobileMenuOpen(false)}>Recrutement</Link>
            <Link to="/how-it-works" className="text-base font-semibold text-ink" onClick={() => setMobileMenuOpen(false)}>Comment ça marche</Link>
            <hr className="border-border" />

            {user ? (
              <>
                {user.role === 'teacher' && (
                  <Link to="/teacher-dashboard" className="text-base font-semibold text-primary-600" onClick={() => setMobileMenuOpen(false)}>Espace Tuteur</Link>
                )}
                <Link to="/portal" className="text-base font-semibold text-primary-600" onClick={() => setMobileMenuOpen(false)}>Mon Portail</Link>
                <button onClick={() => { logout(); setMobileMenuOpen(false) }} className="text-left text-base font-semibold text-ink-muted">Déconnexion</button>
              </>
            ) : (
              <Link to="/login" className="text-base font-semibold text-primary-600" onClick={() => setMobileMenuOpen(false)}>Connexion</Link>
            )}
          </nav>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-border bg-surface-raised py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col items-center gap-6">
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <Link to="/install" className="text-sm font-medium text-ink-muted hover:text-ink">
              Pour les Écoles (Installation)
            </Link>
            <Link to="/how-it-works" className="text-sm font-medium text-ink-muted hover:text-ink">
              Comment ça marche
            </Link>
            <Link to="/contact" className="text-sm font-medium text-ink-muted hover:text-ink">
              Contact / Support
            </Link>
            <Link to="/privacy" className="text-sm font-medium text-ink-muted hover:text-ink">
              Confidentialité
            </Link>
            <Link to="/terms" className="text-sm font-medium text-ink-muted hover:text-ink">
              Conditions d'Utilisation
            </Link>
          </nav>
          <p className="text-sm font-medium text-ink-muted">
            © 2026 Ardoise Platform. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  )
}
