import { useState } from 'react'
import { Link, Outlet, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { isSaasHost } from '../auth/domainRedirect.js'
import EmailVerificationBanner from '../auth/EmailVerificationBanner.jsx'
import { usePwaInstall } from '../hooks/usePwaInstall.js'
import Icon from '../ui/Icon.jsx'
import { OFFICIAL_RESOURCES } from '../constants/officialResources.js'

export default function PublicLayout() {
  const { user, logout } = useAuth()
  const { promptInstall, isIOS, canOfferInstall } = usePwaInstall()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showIosInstructions, setShowIosInstructions] = useState(false)
  const [searchParams] = useSearchParams()

  const isSaas = isSaasHost()
  
  const urlCountry = searchParams.get('country')
  const activeCountryCode = isSaas ? (user?.school?.country || 'BEN') : (urlCountry || 'BEN')
  const countryResources = OFFICIAL_RESOURCES[activeCountryCode] || OFFICIAL_RESOURCES['BEN']

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
          {!isSaas && (
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
          )}
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

      <EmailVerificationBanner />

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
            {!isSaas && (
              <>
                <Link to="/schools" className="text-base font-semibold text-ink" onClick={() => setMobileMenuOpen(false)}>Écoles</Link>
                <Link to="/teachers" className="text-base font-semibold text-ink" onClick={() => setMobileMenuOpen(false)}>Tuteurs à domicile</Link>
                <Link to="/jobs" className="text-base font-semibold text-ink" onClick={() => setMobileMenuOpen(false)}>Recrutement</Link>
                <Link to="/how-it-works" className="text-base font-semibold text-ink" onClick={() => setMobileMenuOpen(false)}>Comment ça marche</Link>
                <hr className="border-border" />
              </>
            )}

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

      <footer className="mt-auto border-t border-border bg-surface-raised">
        <div className="mx-auto max-w-[1600px] px-6 py-16 lg:px-12">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <Link to="/" className="inline-flex items-center gap-2">
                <img src="/images/ardoise_lockup_horizontal.png" alt="Ardoise" className="h-9 w-auto mix-blend-multiply" />
              </Link>
              <p className="mt-4 max-w-xs text-sm text-ink-muted">
                La plateforme qui connecte les familles beninoises aux meilleures ecoles et aux tuteurs qualifies, avec des classements transparents et un annuaire par region.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Plateforme</h3>
              <ul className="mt-4 space-y-3">
                <li><Link to="/schools" className="text-sm text-ink-muted hover:text-ink">Écoles</Link></li>
                <li><Link to="/teachers" className="text-sm text-ink-muted hover:text-ink">Tuteurs à domicile</Link></li>
                <li><Link to="/jobs" className="text-sm text-ink-muted hover:text-ink">Recrutement</Link></li>
                <li><Link to="/how-it-works" className="text-sm text-ink-muted hover:text-ink">Comment ça marche</Link></li>
                <li><Link to="/install" className="text-sm text-ink-muted hover:text-ink">Pour les Écoles (Installation)</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Ressources officielles</h3>
              <ul className="mt-4 space-y-3">
                {countryResources.map((r) => (
                  <li key={r.href}>
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group inline-flex items-start gap-1 text-sm text-ink-muted hover:text-ink"
                    >
                      <span>
                        {r.label}
                        <span className="block text-xs text-ink-muted/70">{r.description}</span>
                      </span>
                      <svg className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Légal &amp; Support</h3>
              <ul className="mt-4 space-y-3">
                <li><Link to="/contact" className="text-sm text-ink-muted hover:text-ink">Contact / Support</Link></li>
                <li><Link to="/privacy" className="text-sm text-ink-muted hover:text-ink">Confidentialité</Link></li>
                <li><Link to="/cookies" className="text-sm text-ink-muted hover:text-ink">Cookies</Link></li>
                <li><Link to="/terms" className="text-sm text-ink-muted hover:text-ink">Conditions d'Utilisation</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-border">
          <div className="mx-auto max-w-[1600px] px-6 py-6 lg:px-12">
            <p className="text-sm text-ink-muted">© 2026 Ardoise Platform. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
