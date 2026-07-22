import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import { api } from '../../shared/api/client.js'
import { DetailedTeacherEvaluationForm } from '../../shared/ui/DetailedTeacherEvaluationForm.jsx'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

export default function TeacherDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [teacher, setTeacher] = useState(undefined) // undefined = loading, null = not found
  const [rating, setRating] = useState(null)
  const [evaluationAggregates, setEvaluationAggregates] = useState(null)
  const [showEvaluationForm, setShowEvaluationForm] = useState(false)

  useEffect(() => {
    let cancelled = false
    getDoc(doc(db, 'users', id)).then((snap) => {
      if (cancelled) return
      if (!snap.exists() || snap.data().role !== 'teacher') {
        setTeacher(null)
        return
      }
      const data = snap.data()
      setTeacher({
        id: snap.id,
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
        subject: data.subject || '',
        city: data.city || '',
        price: data.price || null,
        description: data.bio || '',
        image: data.image || null,
      })

      // Fetch rating and detailed aggregates from backend
      api.get(`/api/hr/teacher-ratings/${snap.id}/`)
        .then(res => {
          if (!cancelled) {
            if (res?.average_rating !== undefined) setRating(res.average_rating)
            if (res?.evaluation_aggregates) setEvaluationAggregates(res.evaluation_aggregates)
          }
        })
        .catch(err => console.error("Failed to fetch rating/evaluations", err))
        
    }).catch(() => { if (!cancelled) setTeacher(null) })
    return () => { cancelled = true }
  }, [id])

  if (teacher === undefined) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    )
  }

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
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            {teacher.image ? (
              <img src={teacher.image} alt={teacher.name} className="h-48 w-48 rounded-full object-cover ring-4 ring-accent-500/30 shadow-elevated" />
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-full bg-primary-900 text-6xl ring-4 ring-accent-500/30 shadow-elevated">👤</div>
            )}
            <div className="text-center md:text-left flex-1 mt-4 md:mt-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                {teacher.subject && <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">{teacher.subject}</span>}
                {teacher.city && <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">{teacher.city}</span>}
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{teacher.name}</h1>
              {rating !== null && (
                <div className="mt-3 flex items-center justify-center md:justify-start gap-1 text-warning-400">
                  <span className="material-symbols-outlined font-variation-fill text-xl">star</span>
                  <span className="text-lg font-bold">{Number(rating).toFixed(1)}</span>
                  <span className="text-sm text-primary-300 ml-1">/ 5.0</span>
                </div>
              )}
              {teacher.description && <p className="mt-4 text-lg text-primary-300 max-w-2xl">{teacher.description}</p>}
            </div>

            <div className="bg-surface-raised rounded-card p-6 shadow-elevated text-center md:text-left min-w-[280px]">
              <p className="text-sm font-medium text-ink-muted">Tarif indicatif</p>
              <p className="mt-1 text-3xl font-bold text-ink">
                {teacher.price ? <>{Number(teacher.price).toLocaleString()} F <span className="text-lg font-normal text-ink-muted">/ mois</span></> : 'Sur demande'}
              </p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => navigate(`/teachers/${teacher.id}/book`)}
                  className="w-full rounded-control bg-accent-500 px-4 py-3 text-sm font-bold text-primary-950 shadow-card transition hover:bg-accent-400 hover:scale-[1.02]"
                >
                  Réserver et proposer un contrat
                </button>
                <button
                  onClick={() => setShowEvaluationForm(true)}
                  className="w-full rounded-control bg-white/10 px-4 py-3 text-sm font-bold text-ink border border-border shadow-card transition hover:bg-white hover:scale-[1.02]"
                >
                  Évaluer l'enseignant
                </button>
              </div>
              <p className="mt-4 text-xs text-ink-muted">Le tarif final et les conditions seront convenus ensemble dans le contrat.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 lg:px-12 -mt-16 sm:-mt-24 space-y-8">
        {evaluationAggregates && evaluationAggregates.pedagogy_avg !== null && (
          <div className="rounded-card border border-border bg-surface-raised p-8">
            <h3 className="text-xl font-bold text-ink mb-6">Profil d'évaluation détaillé</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-80 w-full max-w-4xl mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  data={[
                    { subject: 'Pédagogie', A: evaluationAggregates.pedagogy_avg, fullMark: 5 },
                    { subject: 'Maîtrise', A: evaluationAggregates.subject_mastery_avg, fullMark: 5 },
                    { subject: 'Ponctualité', A: evaluationAggregates.punctuality_avg, fullMark: 5 },
                    { subject: 'Engagement', A: evaluationAggregates.engagement_avg, fullMark: 5 },
                    { subject: 'Communication', A: evaluationAggregates.communication_avg, fullMark: 5 },
                  ]}
                >
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 13 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#94a3b8' }} />
                  <Radar
                    name="Notes"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pédagogie', value: evaluationAggregates.pedagogy_avg },
                      { name: 'Maîtrise', value: evaluationAggregates.subject_mastery_avg },
                      { name: 'Ponctualité', value: evaluationAggregates.punctuality_avg },
                      { name: 'Engagement', value: evaluationAggregates.engagement_avg },
                      { name: 'Communication', value: evaluationAggregates.communication_avg },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    innerRadius="40%"
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={false}
                  >
                    {[
                      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
                    ].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => Number(value).toFixed(2)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="rounded-card border border-border bg-surface-raised p-8">
          <h3 className="text-xl font-bold text-ink mb-4">Modalités d'engagement</h3>
          <ul className="list-disc pl-5 text-ink-muted space-y-2">
            <li>Engagement minimum de 6 mois pour garantir le suivi de l'élève.</li>
            <li>Le paiement s'effectue via la plateforme (protection des deux parties).</li>
            <li>Prix négociable selon le volume horaire convenu.</li>
          </ul>
        </div>
      </div>
      
      {showEvaluationForm && (
        <DetailedTeacherEvaluationForm
          teacherId={teacher.id}
          evaluatorRole="parent"
          onClose={() => setShowEvaluationForm(false)}
          onSubmitSuccess={() => {
            alert('Évaluation soumise avec succès !');
          }}
          apiSubmit={api.post}
        />
      )}
    </div>
  )
}
