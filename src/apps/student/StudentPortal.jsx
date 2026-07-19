import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'
import ActivityList from '../../shared/ui/ActivityList.jsx'

/**
 * Read-only self-view for a Role.STUDENT account - own bulletins and
 * attendance only, same shape as ParentPortal's ChildDetail but for
 * exactly one student (themselves) and without the payment/discipline
 * tabs Role.STUDENT holds no permission for (see core/permissions.py).
 */
export default function StudentPortal() {
  const me = useApiGet('/api/students/my-enrollment/')
  const enrollmentId = me.data?.current_enrollment?.id

  const bulletins = useApiGet(`/api/academics/bulletins/?enrollment=${enrollmentId}`, { skip: !enrollmentId })
  const attendance = useApiGet(`/api/academics/attendance/?enrollment=${enrollmentId}`, { skip: !enrollmentId })

  const absenceCount = attendance.data?.filter((a) => a.state.startsWith('absent')).length ?? 0

  if (me.loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    )
  }

  if (!me.data?.id) {
    return (
      <EmptyState
        title="Aucun profil eleve lie a ce compte"
        description="Si vous pensez que c'est une erreur, contactez le secretariat de l'ecole."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">Mon espace</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">{me.data.firstName} {me.data.lastName}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {me.data.current_enrollment?.classroom_name} · {me.data.current_enrollment?.academic_year_label} · Matricule {me.data.matricule}
        </p>
      </div>

      {!enrollmentId && (
        <EmptyState title="Aucune inscription active" description="Vos bulletins et votre presence apparaitront ici une fois inscrit." />
      )}

      {enrollmentId && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard icon="fact_check" label="Bulletins publies" value={bulletins.data?.length || 0} />
            <StatCard icon="event_busy" label="Absences enregistrees" value={absenceCount} tone={absenceCount > 0 ? 'warning' : 'success'} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Bulletins" subtitle="Publies par l'ecole" />
              {bulletins.loading && <div className="flex justify-center py-8"><Spinner /></div>}
              {!bulletins.loading && (
                <ActivityList
                  emptyLabel="Aucun bulletin publie pour l'instant."
                  items={(bulletins.data || []).map((b) => ({
                    id: b.id, icon: 'fact_check', iconTone: 'success',
                    title: b.exam_period_label, subtitle: `Moyenne ${b.average} - Rang ${b.class_rank}/${b.class_size}`,
                    badge: 'Publie', badgeTone: 'success',
                  }))}
                />
              )}
            </Card>

            <Card>
              <CardHeader title="Presence" subtitle={`${absenceCount} absence(s) enregistree(s)`} />
              {attendance.loading && <div className="flex justify-center py-8"><Spinner /></div>}
              {!attendance.loading && (
                <div className="max-h-64 overflow-y-auto">
                  <ActivityList
                    emptyLabel="Aucun enregistrement de presence."
                    items={(attendance.data || []).slice(0, 20).map((a) => ({
                      id: a.id, icon: a.state === 'present' ? 'check_circle' : a.state.startsWith('absent') ? 'cancel' : 'schedule',
                      iconTone: a.state === 'present' ? 'success' : a.state.startsWith('absent') ? 'danger' : 'warning',
                      title: a.date,
                      badge: a.state, badgeTone: a.state === 'present' ? 'success' : a.state.startsWith('absent') ? 'danger' : 'warning',
                    }))}
                  />
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
