import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import { OHADA_COUNTRIES } from '../../shared/constants/locations.js'

// Certified-partner network (2026-07-28 Odoo-model pivot) -- schools find
// vetted third-party developers here for install/maintenance support,
// instead of Ardoise itself delivering that work. Mirrors SchoolList.jsx/
// TeacherList.jsx's public, unauthenticated marketplace pattern (direct
// Firestore read, firestore.rules already allows `read` on any
// certifiedPartners doc with status=='approved') rather than a new portal
// tab - a founder grants support access to one of these partners from
// their existing Activation & Installation tab (SubscriptionPanel.jsx).
export default function PartnerDirectory() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const country = searchParams.get('country') || ''

  useEffect(() => {
    const q = query(collection(db, 'certifiedPartners'), where('status', '==', 'approved'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rows = []
      snapshot.forEach((d) => {
        const data = d.data()
        rows.push({
          id: d.id,
          publicName: data.publicName || '',
          bio: data.bio || '',
          specialties: Array.isArray(data.specialties) ? data.specialties : [],
          country: data.country || '',
        })
      })
      setPartners(rows)
      setLoading(false)
    }, () => setLoading(false))
    return () => unsubscribe()
  }, [])

  const filteredPartners = useMemo(() => {
    if (!country) return partners
    const countryName = OHADA_COUNTRIES.find((c) => c.code === country)?.name
    return partners.filter((p) => p.country === countryName)
  }, [partners, country])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink tracking-tight">Partenaires Certifiés Ardoise</h1>
        <p className="mt-2 text-sm text-ink-muted max-w-2xl">
          Ces développeurs indépendants sont vérifiés par Ardoise pour l'installation et la maintenance de votre ERP.
          Contactez-en un directement, puis accordez-lui un accès support depuis l'onglet "Activation & Installation" de votre école.
        </p>

        <div className="mt-6 bg-surface p-4 rounded-card border border-primary-100 flex gap-3 text-sm text-ink-muted">
          <svg className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <p>
            <strong>Clause de non-responsabilité :</strong> Ardoise valide uniquement les compétences techniques des partenaires via l'Ardoise Academy. 
            Les partenaires agissent en tant qu'entités indépendantes. Ardoise ne peut être tenue responsable de leurs actions, 
            des contrats conclus avec eux, ou de la qualité de leurs prestations.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSearchParams((p) => { p.delete('country'); return p })}
          className={`rounded-full px-3 py-1 text-sm font-medium border ${!country ? 'bg-primary-600 text-white border-primary-600' : 'border-border text-ink-muted'}`}
        >
          Tous les pays
        </button>
        {OHADA_COUNTRIES.map((c) => (
          <button
            key={c.code}
            onClick={() => setSearchParams((p) => { p.set('country', c.code); return p })}
            className={`rounded-full px-3 py-1 text-sm font-medium border ${country === c.code ? 'bg-primary-600 text-white border-primary-600' : 'border-border text-ink-muted'}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filteredPartners.length === 0 ? (
        <EmptyState
          title="Aucun partenaire certifié pour ce pays"
          description="Revenez bientôt - le réseau de partenaires certifiés Ardoise grandit chaque mois."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredPartners.map((p) => (
            <div key={p.id} className="rounded-card border border-border bg-surface-raised p-5">
              <h3 className="font-semibold text-ink">{p.publicName}</h3>
              <p className="text-xs text-ink-muted mt-0.5">{p.country}</p>
              {p.bio && <p className="text-sm text-ink-muted mt-3">{p.bio}</p>}
              {p.specialties.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.specialties.map((s) => (
                    <span key={s} className="rounded-full bg-primary-100 text-primary-800 text-xs px-2 py-0.5">{s}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
