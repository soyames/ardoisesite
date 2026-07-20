import { useApiGet } from '../../shared/hooks/useApi.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { toLocalDateString } from '../../shared/utils/date.js'
import { Card, CardHeader } from '../../shared/ui/Card.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'
import ActivityList from '../../shared/ui/ActivityList.jsx'
import QuickActionButton from '../../shared/ui/QuickActionButton.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const AUDIT_ICON_BY_ACTION = {
  create: 'add_circle',
  update: 'edit_document',
  delete: 'delete',
  approve: 'check_circle',
  reject: 'cancel',
}

export default function AnalyticsDashboard({ onNavigate }) {
  const { user } = useAuth()
  const today = new Date()
  const monthStart = toLocalDateString(new Date(today.getFullYear(), today.getMonth(), 1))
  const todayStr = toLocalDateString(today)

  const analytics = useApiGet('/api/analytics/dashboard/')
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
    || staff.loading || auditLogs.loading || analytics.loading

  const activeEnrollments = (enrollments.data || []).filter((e) => e.isActive).length
  const pendingPayroll = (payrollRuns.data || []).filter((p) => p.status === 'draft').length
  const totalPending = (pendingBulletins.data?.length || 0) + (pendingDiscipline.data?.length || 0)
    + (pendingLeave.data?.length || 0) + pendingPayroll
  const activeStaffCount = staff.data?.filter((s) => s.isActive).length || 0

  const activityItems = (auditLogs.data || []).slice(0, 8).map((log) => ({
    id: log.id,
    icon: AUDIT_ICON_BY_ACTION[log.action] || 'history',
    title: log.summary,
    subtitle: log.actorName,
    timestamp: new Date(log.occurredAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
  }))

  // Transform analytics data for Recharts
  const enrollmentTrends = Object.entries(analytics.data?.metrics?.enrollment_trends || {}).map(([year, count]) => ({
    name: year,
    Eleves: count
  }))
  
  const subjectPerformance = Object.entries(analytics.data?.metrics?.subject_performance || {}).map(([subject, score]) => ({
    name: subject,
    Moyenne: score
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">Business Intelligence</p>
        <h1 className="mt-1 text-3xl font-extrabold text-ink tracking-tight">Bonjour, {user?.firstName || 'Fondateur'}</h1>
        <p className="mt-1 text-sm text-ink-muted">Voici la sante globale de votre etablissement aujourd'hui.</p>
      </div>

      {loading && <div className="flex justify-center py-20"><Spinner /></div>}

      {!loading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon="school"
              label="Inscriptions actives"
              value={activeEnrollments}
              linkLabel="Voir les inscriptions"
              onLinkClick={() => onNavigate?.('overview')}
            />
            <StatCard
              icon="payments"
              label="Revenu du mois"
              value={`${Number(income.data?.total_revenue || 0).toLocaleString()} FCFA`}
            />
            <StatCard
              icon="account_balance"
              label="Resultat net du mois"
              value={`${Number(income.data?.net_income || 0).toLocaleString()} FCFA`}
              tone={Number(income.data?.net_income || 0) >= 0 ? 'success' : 'danger'}
            />
            <StatCard
              icon="pending_actions"
              label="Approbations en attente"
              value={totalPending}
              badge={totalPending > 0 ? 'A traiter' : undefined}
              tone={totalPending > 0 ? 'warning' : 'success'}
              linkLabel="Voir les departements"
              onLinkClick={() => onNavigate?.('departments')}
            />
          </div>

          {/* Premium BI Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Performance Academique Globale" />
              <div className="p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 20]} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Bar dataKey="Moyenne" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title="Evolution des Inscriptions" />
              <div className="p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={enrollmentTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Area type="monotone" dataKey="Eleves" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorEnroll)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader
                  title="Activite recente"
                  action={<span className="text-xs text-ink-muted">{activityItems.length} evenement(s)</span>}
                />
                <ActivityList items={activityItems} emptyLabel="Aucune activite recente." />
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader title="En attente d'approbation" />
                <div className="grid grid-cols-2 gap-3 p-4">
                  <PendingRow label="Bulletins" count={pendingBulletins.data?.length || 0} />
                  <PendingRow label="Discipline" count={pendingDiscipline.data?.length || 0} />
                  <PendingRow label="Conges" count={pendingLeave.data?.length || 0} />
                  <PendingRow label="Cycles de paie" count={pendingPayroll} />
                </div>
              </Card>
              <Card>
                <CardHeader title="Personnel" />
                <div className="p-4">
                  <p className="text-2xl font-semibold text-ink">{activeStaffCount}</p>
                  <p className="text-xs text-ink-muted">membre(s) du personnel actif(s)</p>
                </div>
              </Card>
            </div>
          </div>

          {onNavigate && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-ink">Actions rapides</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <QuickActionButton
                  icon="apartment"
                  title="Departements"
                  description="Superviser chaque service"
                  onClick={() => onNavigate('departments')}
                />
                <QuickActionButton
                  icon="person_add"
                  title="Recrutement"
                  description="Postes ouverts et candidatures"
                  onClick={() => onNavigate('recruitment')}
                />
                <QuickActionButton
                  icon="settings"
                  title="Configuration scolaire"
                  description="Informations de l'ecole, lettre a en-tete"
                  onClick={() => onNavigate('settings')}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PendingRow({ label, count }) {
  return (
    <div className="rounded-control border border-border p-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${count > 0 ? 'text-warning-600' : 'text-success-600'}`}>{count}</p>
    </div>
  )
}
