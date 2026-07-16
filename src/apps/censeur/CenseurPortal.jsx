import { useState } from 'react'
import { api, ApiError } from '../../shared/api/client.js'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

const TABS = [
  { key: 'bulletins', label: 'Bulletins' },
  { key: 'discipline', label: 'Discipline' },
  { key: 'timelogs', label: 'Heures vacataires' },
  { key: 'exams', label: 'Epreuves' },
]

export default function CenseurPortal() {
  const [tab, setTab] = useState('bulletins')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Censorat</h1>
        <p className="mt-1 text-sm text-ink-muted">Approbation des bulletins, discipline, heures vacataires et epreuves.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === t.key ? 'border-b-2 border-primary-600 text-primary-700' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'bulletins' && <BulletinsTab />}
      {tab === 'discipline' && <DisciplineTab />}
      {tab === 'timelogs' && <TimeLogsTab />}
      {tab === 'exams' && <ExamsTab />}
    </div>
  )
}

function BulletinsTab() {
  const pending = useApiGet('/api/academics/bulletins/pending-approval/')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const approve = async (id) => {
    setBusy(id)
    setError(null)
    try {
      await api.post(`/api/academics/bulletins/${id}/approve/`, {})
      pending.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-danger-600">{error}</p>}
      {pending.loading && <div className="flex justify-center py-8"><Spinner /></div>}
      {!pending.loading && pending.data?.length === 0 && <EmptyState title="Aucun bulletin en attente" />}
      {pending.data?.map((b) => (
        <Card key={b.id}>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">{b.student_name} - {b.exam_period_label}</p>
              <p className="text-xs text-ink-muted">Moyenne {b.average} - Rang {b.class_rank}/{b.class_size}</p>
            </div>
            <Button size="sm" onClick={() => approve(b.id)} disabled={busy === b.id}>
              {busy === b.id ? 'Validation...' : 'Approuver'}
            </Button>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

function DisciplineTab() {
  const pending = useApiGet('/api/academics/discipline/pending-approval/')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [rejectReason, setRejectReason] = useState({})

  const approve = async (id) => {
    setBusy(id)
    setError(null)
    try {
      await api.post(`/api/academics/discipline/${id}/approve/`, {})
      pending.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(null)
    }
  }

  const reject = async (id) => {
    setBusy(id)
    setError(null)
    try {
      await api.post(`/api/academics/discipline/${id}/reject/`, { reason: rejectReason[id] || '' })
      pending.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-danger-600">{error}</p>}
      {pending.loading && <div className="flex justify-center py-8"><Spinner /></div>}
      {!pending.loading && pending.data?.length === 0 && <EmptyState title="Aucune mesure en attente" />}
      {pending.data?.map((d) => (
        <Card key={d.id}>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{d.student_name}</p>
                <p className="text-xs text-ink-muted">{d.date} - {d.measure} - {d.reason}</p>
                <p className="text-xs text-ink-muted">Signale par {d.issued_by_name}</p>
              </div>
              <Badge tone="warning">{d.measure}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <input
                className={INPUT_CLASS}
                placeholder="Motif du rejet (optionnel)"
                value={rejectReason[d.id] || ''}
                onChange={(e) => setRejectReason({ ...rejectReason, [d.id]: e.target.value })}
              />
              <Button size="sm" variant="danger" onClick={() => reject(d.id)} disabled={busy === d.id}>Rejeter</Button>
              <Button size="sm" onClick={() => approve(d.id)} disabled={busy === d.id}>Approuver</Button>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

function TimeLogsTab() {
  const pending = useApiGet('/api/hr/time-logs/?is_confirmed=false')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const confirm = async (id) => {
    setBusy(id)
    setError(null)
    try {
      await api.post(`/api/hr/time-logs/${id}/confirm/`, {})
      pending.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-muted">Heures declarees par les vacataires, a rapprocher de l'emploi du temps avant paie.</p>
      {error && <p className="text-sm text-danger-600">{error}</p>}
      {pending.loading && <div className="flex justify-center py-8"><Spinner /></div>}
      {!pending.loading && pending.data?.length === 0 && <EmptyState title="Aucune heure en attente de confirmation" />}
      {pending.data?.map((t) => (
        <Card key={t.id}>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">{t.staff_name} - {t.class_subject_label}</p>
              <p className="text-xs text-ink-muted">{t.date} - {t.hours} h</p>
            </div>
            <Button size="sm" onClick={() => confirm(t.id)} disabled={busy === t.id}>
              {busy === t.id ? 'Confirmation...' : 'Confirmer'}
            </Button>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

function ExamsTab() {
  const exams = useApiGet('/api/academics/exam-papers/')

  return (
    <Card>
      <CardHeader title="Epreuves" subtitle="Suivi de redaction et de saisie, lecture seule." />
      <CardBody className="p-0">
        {exams.loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {!exams.loading && exams.data?.length === 0 && <div className="p-4"><EmptyState title="Aucune epreuve" /></div>}
        <ul className="divide-y divide-border">
          {exams.data?.map((e) => (
            <li key={e.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-ink">{e.class_label} - {e.subject_name}</p>
                <p className="text-xs text-ink-muted">{e.exam_period_label} - Redige par {e.drafted_by_name || '-'}</p>
              </div>
              <Badge tone={e.status === 'TYPED' ? 'success' : e.status === 'SUBMITTED' ? 'warning' : 'neutral'}>{e.status}</Badge>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}
