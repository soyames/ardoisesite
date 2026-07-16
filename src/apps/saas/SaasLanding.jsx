import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePwaInstall } from '../../shared/hooks/usePwaInstall.js'

export default function SaasLanding() {
  const { promptInstall, isIOS, canOfferInstall } = usePwaInstall()
  const [showIosInstructions, setShowIosInstructions] = useState(false)

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIosInstructions(true)
    } else {
      promptInstall()
    }
  }

  return (
    <div className="flex min-h-[calc(100svh-80px)] flex-col lg:flex-row items-center justify-center p-6 gap-12 bg-surface">
      
      {/* Left Column: Explanations */}
      <div className="flex-1 max-w-xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700 ring-1 ring-inset ring-primary-200 mb-6">
          <span className="flex h-2 w-2 rounded-full bg-primary-600"></span>
          L'Expérience Zéro Technique
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-ink tracking-tight mb-6">
          Votre ERP Scolaire, <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">sans installation complexe.</span>
        </h1>
        
        <p className="text-lg text-ink-muted mb-8 leading-relaxed">
          Oubliez les configurations informatiques fastidieuses. Ardoise ERP s'installe directement sur votre appareil d'un simple clic.
        </p>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-100 text-primary-700">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">Rapide et Léger</h3>
              <p className="text-ink-muted mt-1">S'installe instantanément sans prendre d'espace disque. Mises à jour automatiques en arrière-plan.</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-100 text-primary-700">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">Application Native</h3>
              <p className="text-ink-muted mt-1">Fonctionne dans sa propre fenêtre, indépendamment du navigateur. Icône sur votre bureau ou écran d'accueil.</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-100 text-primary-700">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">Sécurité Maximale</h3>
              <p className="text-ink-muted mt-1">Connexion sécurisée directe avec le conteneur cloud exclusif de votre établissement.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Install Card */}
      <div className="flex-1 w-full max-w-md">
        <div className="p-8 rounded-3xl bg-white shadow-2xl shadow-primary-900/10 ring-1 ring-border relative">
          <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary-200 to-primary-50 rounded-3xl -z-10 blur-md opacity-70"></div>
          
          <div className="flex justify-center mb-6">
            <img src="/icons/icon-192.png" alt="Ardoise ERP Logo" className="h-28 w-28 drop-shadow-lg rounded-2xl" />
          </div>
          
          <h2 className="text-2xl font-bold text-ink text-center mb-2">Ardoise ERP</h2>
          <p className="text-ink-muted text-center mb-8">Système de gestion scolaire</p>

          <div className="flex flex-col items-center gap-4">
            {canOfferInstall ? (
              <button
                onClick={handleInstallClick}
                className="w-full rounded-control bg-primary-600 px-8 py-4 text-lg font-bold text-white shadow-button transition hover:bg-primary-500 hover:shadow-button-hover active:translate-y-px active:shadow-button-active flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Installer sur cet appareil
              </button>
            ) : (
              <div className="w-full p-4 bg-surface-raised border-l-4 border-success-500 rounded-r-lg text-sm text-ink font-medium">
                ✅ L'application est installée ou votre navigateur ne supporte pas l'installation automatique.
              </div>
            )}

            {showIosInstructions && (
              <div className="mt-2 w-full text-left rounded-card bg-surface-raised p-5 text-sm text-ink-muted shadow-elevated ring-1 ring-border relative animate-fade-in">
                <h3 className="mb-3 font-bold text-ink text-base">Installation sur iPhone/iPad :</h3>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>Appuyez sur l'icône Partager <span className="inline-flex items-center justify-center border border-border rounded px-1.5 py-0.5 mx-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></span> en bas de Safari.</li>
                  <li>Faites défiler et choisissez <strong>« Sur l'écran d'accueil »</strong>.</li>
                  <li>Appuyez sur <strong>« Ajouter »</strong> en haut à droite.</li>
                </ol>
                <button
                  onClick={() => setShowIosInstructions(false)}
                  className="absolute top-3 right-3 text-ink-muted hover:text-ink"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-border pt-6 text-center">
            <p className="text-sm text-ink-muted mb-4">Vous utilisez déjà l'application ?</p>
            <Link
              to="/login"
              className="inline-flex w-full justify-center rounded-control bg-surface-raised px-8 py-3 text-base font-bold text-ink shadow-sm ring-1 ring-inset ring-border transition hover:bg-surface"
            >
              Accéder au portail
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}