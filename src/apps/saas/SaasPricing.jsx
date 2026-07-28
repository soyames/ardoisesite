import React from 'react'
import { Link } from 'react-router-dom'
import { isSaasHost } from '../../shared/auth/domainRedirect.js'

const CheckIcon = () => (
  <svg className="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
)

const FEATURES = [
  'Installation serveur local illimitée',
  'Présence et visibilité sur l\'annuaire public Ardoise',
  'Ajout et gestion du personnel (comptes et rôles)',
  'Dossiers élèves et inscriptions (gestion complète)',
  'Notes, bulletins, présences et discipline',
  'Comptabilité et finances complètes',
  'RH et paie complètes',
  'Accès complet au portail pour tout votre personnel',
  'Traitement des candidatures de recrutement et des demandes d\'inscription',
  'Notifications WhatsApp',
  'Tableau de bord analytique',
]

export default function SaasPricing() {
  return (
    <div className="bg-surface py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Tarifs</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Ardoise est gratuit
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-ink-muted">
          Installez votre serveur, gérez votre école, et rejoignez l'annuaire public - sans abonnement,
          sans engagement, pour tout votre personnel.
        </p>

        <div className="isolate mx-auto mt-16 max-w-xl">
          <div className="rounded-3xl p-8 ring-2 ring-primary-600 xl:p-10 bg-surface-raised shadow-xl">
            <h3 className="text-lg font-semibold leading-8 text-ink">Logiciel de gestion scolaire</h3>
            <p className="mt-4 text-sm leading-6 text-ink-muted">
              Le logiciel complet : dossiers élèves, notes, finances, RH, et plus - pour votre école entière.
            </p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold tracking-tight text-ink">0 FCFA</span>
            </p>
            <Link
              to={isSaasHost() ? "/register" : "/install"}
              className="mt-6 block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Créer mon école
            </Link>
            <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-ink-muted xl:mt-10">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-ink-muted">
          Pour les cours de soutien à domicile, la mise en relation entre parents et tuteurs est également
          gratuite - Ardoise ne prélève aucune commission. Consultez nos{' '}
          <Link to="/terms" className="underline text-primary-600">Conditions Générales d'Utilisation</Link>{' '}
          pour le détail complet, y compris la manière dont les frais d'inscription scolaire sont traités.
        </p>
      </div>
    </div>
  )
}
