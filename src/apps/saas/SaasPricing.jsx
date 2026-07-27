import React from 'react'
import { Link } from 'react-router-dom'
import { isSaasHost } from '../../shared/auth/domainRedirect.js'

export default function SaasPricing() {
  return (
    <div className="bg-surface py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Tarifs</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Des tarifs simples pour les écoles de toutes tailles
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-ink-muted">
          Installez Ardoise et rejoignez l'annuaire public gratuitement. La Licence Premium ouvre le logiciel de gestion complet - dossiers élèves, notes, finances, RH - pour vous et tout votre personnel.
        </p>

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-x-8 xl:gap-x-12">
          
          {/* Free Tier */}
          <div className="rounded-3xl p-8 ring-1 ring-border xl:p-10 bg-surface">
            <h3 className="text-lg font-semibold leading-8 text-ink">Version Locale (Gratuit)</h3>
            <p className="mt-4 text-sm leading-6 text-ink-muted">
              Installez votre serveur et faites-vous connaître, sans engagement.
            </p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold tracking-tight text-ink">0 FCFA</span>
              <span className="text-sm font-semibold leading-6 text-ink-muted">/ an</span>
            </p>
            <Link
              to={isSaasHost() ? "/register" : "/install"}
              className="mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 text-primary-700 ring-1 ring-inset ring-primary-200 hover:ring-primary-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Installer maintenant
            </Link>
            <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-ink-muted xl:mt-10">
              <li className="flex gap-x-3">
                <svg className="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                Installation serveur local illimitée
              </li>
              <li className="flex gap-x-3">
                <svg className="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                Présence et visibilité sur l'annuaire public Ardoise
              </li>
              <li className="flex gap-x-3">
                <svg className="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                Ajout et gestion du personnel (comptes et rôles)
              </li>
              <li className="flex gap-x-3">
                <svg className="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                Publication d'offres de recrutement
              </li>
              <li className="flex gap-x-3">
                <svg className="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                Tableau de bord analytique
              </li>
            </ul>
          </div>

          {/* Premium Tier */}
          <div className="rounded-3xl p-8 ring-2 ring-primary-600 xl:p-10 bg-surface-raised relative shadow-xl">
            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-full">Recommandé</div>
            <h3 className="text-lg font-semibold leading-8 text-ink">Licence Premium</h3>
            <p className="mt-4 text-sm leading-6 text-ink-muted">
              Le logiciel de gestion scolaire complet : dossiers élèves, notes, finances, RH, et plus.
            </p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold tracking-tight text-ink">50 000 FCFA</span>
              <span className="text-sm font-semibold leading-6 text-ink-muted">/ an</span>
            </p>
            <Link
              to={isSaasHost() ? "/register" : "/login"}
              className="mt-6 block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Créer mon école
            </Link>
            <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-ink-muted xl:mt-10">
              <li className="flex gap-x-3">
                <svg className="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                Tout le contenu de la Version Locale
              </li>
              <li className="flex gap-x-3 text-ink font-medium">
                <svg className="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                Dossiers élèves et inscriptions (gestion complète)
              </li>
              <li className="flex gap-x-3 text-ink font-medium">
                <svg className="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                Notes, bulletins, présences et discipline
              </li>
              <li className="flex gap-x-3 text-ink font-medium">
                <svg className="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                Comptabilité et finances complètes
              </li>
              <li className="flex gap-x-3 text-ink font-medium">
                <svg className="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                RH et paie complètes
              </li>
              <li className="flex gap-x-3 text-ink font-medium">
                <svg className="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                Accès complet au portail pour tout votre personnel
              </li>
              <li className="flex gap-x-3 text-ink font-medium">
                <svg className="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                Traitement des candidatures de recrutement
              </li>
              <li className="flex gap-x-3 text-ink font-medium">
                <svg className="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                Notifications WhatsApp
              </li>
              <li className="flex gap-x-3 text-ink font-medium">
                <svg className="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                Collecte des frais par Mobile Money
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  )
}
