import { useParams, Link, useNavigate } from 'react-router-dom'
import EmptyState from '../../shared/ui/EmptyState.jsx'

export const TEACHER_DB = {
  1: { id: 1, name: 'Dr. Jean Dupont', subject: 'Mathématiques & Physique', city: 'Cotonou', rating: 4.9, defaultPrice: 15000, image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=800&q=80', description: 'Docteur en mathématiques appliquées, 10 ans d\'expérience dans l\'enseignement secondaire et supérieur. Spécialiste de la préparation aux concours et examens nationaux.', reviewsCount: 42, availability: 'Disponibilité soirs et week-ends' },
  2: { id: 2, name: 'Marie Mensah', subject: 'SVT & Chimie', city: 'Abomey-Calavi', rating: 4.8, defaultPrice: 12000, image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80', description: 'Professeur certifiée, excellente approche pédagogique basée sur la compréhension pratique des sciences de la vie.', reviewsCount: 28, availability: 'Mercredi après-midi et week-ends' },
}

export default function TeacherDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const teacher = TEACHER_DB[id]

  if (!teacher) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-32">
        <EmptyState title="Tuteur introuvable" />
        <Link to="/teachers" className="mt-4 inline-block text-primary-600 hover:underline">Retour à l'annuaire</Link>
      </div>
    )
  }

  return (
    <div className="bg-surface min-h-screen pb-20">
      <div className="bg-primary-950 pb-24 pt-16 sm:pb-32 sm:pt-24 lg:pb-40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <img src={teacher.image} alt={teacher.name} className="h-48 w-48 rounded-full object-cover ring-4 ring-accent-500/30 shadow-elevated" />
            <div className="text-center md:text-left flex-1 mt-4 md:mt-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">{teacher.subject}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">{teacher.city}</span>
                <span className="flex items-center gap-1 rounded-full bg-accent-500/20 px-3 py-1 text-sm font-semibold text-accent-300">
                  ★ {teacher.rating} ({teacher.reviewsCount} avis)
                </span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{teacher.name}</h1>
              <p className="mt-4 text-lg text-primary-300 max-w-2xl">{teacher.description}</p>
            </div>

            <div className="bg-surface-raised rounded-card p-6 shadow-elevated text-center md:text-left min-w-[280px]">
              <p className="text-sm font-medium text-ink-muted">Tarif indicatif</p>
              <p className="mt-1 text-3xl font-bold text-ink">{teacher.defaultPrice.toLocaleString()} F <span className="text-lg font-normal text-ink-muted">/ mois</span></p>
              <div className="mt-6">
                <button
                  onClick={() => navigate(`/teachers/${teacher.id}/book`)}
                  className="w-full rounded-control bg-accent-500 px-4 py-3 text-sm font-bold text-primary-950 shadow-card transition hover:bg-accent-400 hover:scale-[1.02]"
                >
                  Réserver et proposer un contrat
                </button>
              </div>
              <p className="mt-4 text-xs text-ink-muted">Le tarif final et les conditions seront convenus ensemble dans le contrat.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 -mt-16 sm:-mt-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-raised rounded-card shadow-card ring-1 ring-border p-8">
             <h3 className="text-xl font-bold text-ink mb-4">Disponibilité</h3>
             <p className="text-ink-muted">{teacher.availability}</p>
          </div>
          <div className="bg-surface-raised rounded-card shadow-card ring-1 ring-border p-8">
             <h3 className="text-xl font-bold text-ink mb-4">Modalités d'engagement</h3>
             <ul className="list-disc pl-5 text-ink-muted space-y-2">
               <li>Engagement minimum de 6 mois pour garantir le suivi de l'élève.</li>
               <li>Le paiement s'effectue via la plateforme (protection des deux parties).</li>
               <li>Prix négociable selon le volume horaire convenu.</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
