import { useState } from 'react'
import { api } from '../../shared/api/client.js'
import { useApiGet } from '../../shared/hooks/useApi.js'
import StatCard from '../../shared/ui/StatCard.jsx'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Button from '../../shared/ui/Button.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'

/**
 * The one screen a Founder/Director actually needs first: everything
 * currently waiting on their (or a delegate's) sign-off, across the
 * four approval chains the backend enforces server-side (see
 * ardoise/ROLES_AND_PERMISSIONS.md, "Approval workflows") -- bulletins,
 * serious discipline measures, payroll runs, and salary advances. This
 * is a dashboard over real pending-approval endpoints, not a mockup:
 * every action button below calls the same POST the backend's
 * functional smoke tests exercised.
 */
export default function FounderDashboard() {
  const bulletins = useApiGet('/api/academics/bulletins/pending-approval/')
  const discipline = useApiGet('/api/academics/discipline/pending-approval/')
  const payroll = useApiGet('/api/hr/payroll-runs/pending-validation/')
  const advances = useApiGet('/api/hr/salary-advances/pending-approval/')

  const counts = {
    bulletins: bulletins.data?.length ?? '—',
    discipline: discipline.data?.length ?? '—',
    payroll: payroll.data?.length ?? '—',
    advances: advances.data?.length ?? '—',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Tableau de bord</h1>
        <p className="mt-1 text-sm text-ink-muted">Ce qui attend votre validation aujourd'hui.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Bulletins a approuver" value={counts.bulletins} tone="primary" />
        <StatCard label="Mesures disciplinaires" value={counts.discipline} tone="warning" />
        <StatCard label="Paies a valider" value={counts.payroll} tone="accent" />
        <StatCard label="Avances sur salaire" value={counts.advances} tone="danger" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PendingBulletins query={bulletins} />
        <PendingDiscipline query={discipline} />
        <PendingPayroll query={payroll} />
        <PendingAdvances query={advances} />
      </div>
    </div>
  )
}

function SectionShell({ title, subtitle, query, children }) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <CardBody>
        {query.loading && (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        )}
        {query.error && (
          <p className="text-sm text-danger-600">Impossible de charger cette liste.</p>
        )}
        {!query.loading && !query.error && (!query.data || query.data.length === 0) && (
          <EmptyState title="Rien en attente" description="Cette liste est a jour." />
        )}
        {!query.loading && !query.error && query.data?.length > 0 && (
          <ul className="space-y-3">{children}</ul>
        )}
      </CardBody>
    </Card>
  )
}

function ActionRow({ title, subtitle, badge, actions }) {
  return (
    <li className="flex flex-col gap-2 rounded-control border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-xs text-ink-muted">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {badge}
        {actions}
      </div>
    </li>
  )
}

function useRowAction(refetch) {
  const [pendingId, setPendingId] = useState(null)
  const [errorId, setErrorId] = useState(null)

  async function run(id, fn) {
    setPendingId(id)
    setErrorId(null)
    try {
      await fn()
      refetch()
    } catch (err) {
      setErrorId(id)
    } finally {
      setPendingId(null)
    }
  }

  return { pendingId, errorId, run }
}

function PendingBulletins({ query }) {
  const { pendingId, run } = useRowAction(query.refetch)
  return (
    <SectionShell title="Bulletins" subtitle="En attente de visa du Censeur" query={query}>
      {query.data?.map((b) => (
        <ActionRow
          key={b.id}
          title={`${b.student_name} — ${b.exam_period_label}`}
          subtitle={`Moyenne ${b.average} · rang ${b.class_rank}/${b.class_size}`}
          badge={<Badge tone="neutral">{b.student_matricule}</Badge>}
          actions={
            <Button
              size="sm"
              disabled={pendingId === b.id}
              onClick={() => run(b.id, () => api.post(`/api/academics/bulletins/${b.id}/approve/`))}
            >
              Approuver
            </Button>
          }
        />
      ))}
    </SectionShell>
  )
}

function PendingDiscipline({ query }) {
  const { pendingId, run } = useRowAction(query.refetch)
  return (
    <SectionShell title="Discipline" subtitle="Suspensions / exclusions en attente" query={query}>
      {query.data?.map((d) => (
        <ActionRow
          key={d.id}
          title={`${d.student_name} — ${d.measure}`}
          subtitle={d.reason}
          badge={<Badge tone="warning">{d.status}</Badge>}
          actions={
            <>
              <Button
                size="sm"
                variant="secondary"
                disabled={pendingId === d.id}
                onClick={() =>
                  run(d.id, () => api.post(`/api/academics/discipline/${d.id}/reject/`, { reason: '' }))
                }
              >
                Rejeter
              </Button>
              <Button
                size="sm"
                disabled={pendingId === d.id}
                onClick={() => run(d.id, () => api.post(`/api/academics/discipline/${d.id}/approve/`))}
              >
                Approuver
              </Button>
            </>
          }
        />
      ))}
    </SectionShell>
  )
}

function PendingPayroll({ query }) {
  const { pendingId, run } = useRowAction(query.refetch)
  return (
    <SectionShell title="Paie" subtitle="Cycles de paie a valider" query={query}>
      {query.data?.map((p) => (
        <ActionRow
          key={p.id}
          title={`${p.period_start} — ${p.period_end}`}
          subtitle={`Statut: ${p.status}`}
          badge={<Badge tone="neutral">{p.status}</Badge>}
          actions={
            <Button
              size="sm"
              disabled={pendingId === p.id}
              onClick={() => run(p.id, () => api.post(`/api/hr/payroll-runs/${p.id}/validate/`))}
            >
              Valider
            </Button>
          }
        />
      ))}
    </SectionShell>
  )
}

function PendingAdvances({ query }) {
  const { pendingId, run } = useRowAction(query.refetch)
  return (
    <SectionShell title="Avances sur salaire" subtitle="Demandes en attente" query={query}>
      {query.data?.map((a) => (
        <ActionRow
          key={a.id}
          title={`${a.staff_name} — ${a.amount} FCFA`}
          subtitle={a.reason || 'Sans motif precise'}
          badge={<Badge tone="warning">{a.status}</Badge>}
          actions={
            <>
              <Button
                size="sm"
                variant="secondary"
                disabled={pendingId === a.id}
                onClick={() => run(a.id, () => api.post(`/api/hr/salary-advances/${a.id}/reject/`))}
              >
                Rejeter
              </Button>
              <Button
                size="sm"
                disabled={pendingId === a.id}
                onClick={() => run(a.id, () => api.post(`/api/hr/salary-advances/${a.id}/approve/`))}
              >
                Approuver
              </Button>
            </>
          }
        />
      ))}
    </SectionShell>
  )
}
