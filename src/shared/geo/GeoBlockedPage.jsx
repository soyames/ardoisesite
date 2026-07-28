import { OHADA_COUNTRIES } from '../constants/locations.js'

export default function GeoBlockedPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-surface px-6 py-16 text-center">
      <img src="/images/ardoise_lockup_horizontal.png" alt="Ardoise" className="mb-8 h-10 w-auto" />
      <h1 className="max-w-xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Ardoise n'est pas encore disponible dans votre pays
      </h1>
      <p className="mt-4 max-w-xl text-ink-muted">
        Ardoise est une plateforme de gestion scolaire et un annuaire d'écoles et de tuteurs, conçue
        exclusivement pour les 17 pays de l'espace OHADA. L'annuaire, la mise en relation avec des tuteurs et
        l'inscription ne sont donc accessibles que depuis l'un de ces pays.
      </p>
      <div className="mt-8 w-full max-w-2xl rounded-card border border-border bg-surface-raised p-6 text-left shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Pays couverts (espace OHADA)</p>
        <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-ink sm:grid-cols-3">
          {OHADA_COUNTRIES.map((c) => (
            <li key={c.code}>{c.name}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
