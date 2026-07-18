import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'

/**
 * Founder Command Center analytics - a read-only aggregation pulling
 * from already-existing list/report endpoints, no new backend data
 * model (see the 2026-07-16 ERP-gap CEO plan's "Analytics dashboard"
 * expansion). Counts are computed client-side from each endpoint's
 * response - fine at this product's scale (one school), not built to
 * scale past that.
 */
export default function AnalyticsDashboard({ onNavigate }) {
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  const todayStr = today.toISOString().slice(0, 10)

  const enrollments = useApiGet('/api/students/enrollments/')
  const income = useApiGet(`/api/finance/reports/income-statement/?start=${monthStart}&end=${todayStr}`)
  const pendingBulletins = useApiGet('/api/academics/bulletins/pending-approval/')
  const pendingDiscipline = useApiGet('/api/academics/discipline/pending-approval/')
  const pendingLeave = useApiGet('/api/hr/leave-requests/pending-approval/')
  const payrollRuns = useApiGet('/api/hr/payroll-runs/')
  const staff = useApiGet('/api/hr/staff/')
  const auditLogs = useApiGet('/api/audit/logs/')

  const loading = enrollments.loading || income.loading || pendingBulletins.loading
    || pendingDiscipline.loading || pendingLeave.loading || payrollRuns.loading
    || staff.loading || auditLogs.loading

  const activeEnrollments = (enrollments.data || []).filter((e) => e.is_active).length
  const pendingPayroll = (payrollRuns.data || []).filter((p) => p.status === 'draft').length
  const totalPending = (pendingBulletins.data?.length || 0) + (pendingDiscipline.data?.length || 0)
    + (pendingLeave.data?.length || 0) + pendingPayroll

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Tableau de bord analytique</h1>
        <p className="mt-1 text-sm text-ink-muted">Vue d'ensemble en lecture seule - inscriptions, finances, et approbations en attente.</p>
      </div>

      {onNavigate && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button onClick={() => onNavigate('departments')} className="rounded-card border border-border bg-primary-950 p-4 text-left text-white transition hover:bg-primary-900">
            <p className="text-sm font-semibold">Departements</p>
            <p className="mt-1 text-xs text-white/70">Superviser chaque service</p>
          </button>
          <button onClick={() => onNavigate('overview')} className="rounded-card border border-border bg-accent-600 p-4 text-left text-white transition hover:bg-accent-700">
            <p className="text-sm font-semibold">Inscriptions</p>
            <p className="mt-1 text-xs text-white/70">Vue d'ensemble des admissions</p>
          </button>
          <button onClick={() => onNavigate('recruitment')} className="rounded-card border border-border bg-surface-raised p-4 text-left text-ink transition hover:bg-surface-hover">
            <p className="text-sm font-semibold">Recrutement</p>
            <p className="mt-1 text-xs text-ink-muted">Postes ouverts et candidatures</p>
          </button>
        </div>
      )}

      {loading && <div className="flex justify-center py-10"><Spinner /></div>}

      {!loading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Inscriptions actives" value={activeEnrollments} />
            <StatCard label="Revenu du mois" value={`${Number(income.data?.total_revenue || 0).toLocaleString()} FCFA`} />
            <StatCard label="Resultat net du mois" value={`${Number(income.data?.net_income || 0).toLocaleString()} FCFA`} />
            <StatCard label="Approbations en attente" value={totalPending} tone={totalPending > 0 ? 'warning' : 'success'} />
          </div>

          <Card>
            <CardHeader title="Detail des approbations en attente" />
            <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <PendingRow label="Bulletins" count={pendingBulletins.data?.length || 0} />
              <PendingRow label="Discipline" count={pendingDiscipline.data?.length || 0} />
              <PendingRow label="Conges" count={pendingLeave.data?.length || 0} />
              <PendingRow label="Cycles de paie" count={pendingPayroll} />
            </CardBody>
          </Card>

          {onNavigate && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button onClick={() => onNavigate('settings')} className="rounded-card border border-border bg-surface-raised p-4 text-left transition hover:bg-surface-hover">
                <p className="text-sm font-semibold text-ink">Configuration scolaire</p>
                <p className="mt-1 text-xs text-ink-muted">Informations de l'ecole, lettre a en-tete</p>
              </button>
              <button onClick={() => onNavigate('departments')} className="rounded-card border border-border bg-surface-raised p-4 text-left transition hover:bg-surface-hover">
                <p className="text-sm font-semibold text-ink">Utilisateurs & roles</p>
                <p className="mt-1 text-xs text-ink-muted">{staff.data?.filter((s) => s.is_active).length || 0} membre(s) du personnel actif(s)</p>
              </button>
            </div>
          )}

          <Card>
            <CardHeader title="Journaux recents" />
            <CardBody className="p-0">
              {(auditLogs.data || []).length === 0 && <div className="p-4"><EmptyState title="Aucune activite recente" /></div>}
              <ul className="divide-y divide-border">
                {(auditLogs.data || []).slice(0, 6).map((log) => (
                  <li key={log.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm text-ink">{log.summary}</p>
                      <p className="text-xs text-ink-muted">{log.actor_name}</p>
                    </div>
                    <p className="text-xs text-ink-muted">{new Date(log.occurred_at).toLocaleString('fr-FR')}</p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  )
}

function PendingRow({ label, count }) {
  return (
    <div className="flex items-center justify-between rounded-control border border-border p-3">
      <span className="text-sm text-ink">{label}</span>
      <span className={`text-lg font-semibold ${count > 0 ? 'text-warning-600' : 'text-success-600'}`}>{count}</span>
    </div>
  )
}
