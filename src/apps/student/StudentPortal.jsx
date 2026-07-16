import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'

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
        <h1 className="text-xl font-semibold text-ink">Mon espace</h1>
        <p className="mt-1 text-sm text-ink-muted">Bulletins et presence.</p>
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">{me.data.first_name} {me.data.last_name}</p>
            <p className="text-xs text-ink-muted">
              {me.data.current_enrollment?.classroom_name} · {me.data.current_enrollment?.academic_year_label} · Matricule {me.data.matricule}
            </p>
          </div>
        </CardBody>
      </Card>

      {!enrollmentId && (
        <EmptyState title="Aucune inscription active" description="Vos bulletins et votre presence apparaitront ici une fois inscrit." />
      )}

      {enrollmentId && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Bulletins" subtitle="Publies par l'ecole" />
            <CardBody>
              {bulletins.loading && <Spinner />}
              {!bulletins.loading && (!bulletins.data || bulletins.data.length === 0) && (
                <EmptyState title="Aucun bulletin publie pour l'instant" />
              )}
              <ul className="space-y-2">
                {bulletins.data?.map((b) => (
                  <li key={b.id} className="flex items-center justify-between rounded-control border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{b.exam_period_label}</p>
                      <p className="text-xs text-ink-muted">
                        Moyenne {b.average} · Rang {b.class_rank}/{b.class_size}
                      </p>
                    </div>
                    <Badge tone="success">Publie</Badge>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Presence" subtitle={`${absenceCount} absence(s) enregistree(s)`} />
            <CardBody>
              {attendance.loading && <Spinner />}
              {!attendance.loading && (!attendance.data || attendance.data.length === 0) && (
                <EmptyState title="Aucun enregistrement de presence" />
              )}
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {attendance.data?.slice(0, 20).map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-control border border-border p-3">
                    <p className="text-sm text-ink">{a.date}</p>
                    <Badge tone={a.state === 'present' ? 'success' : a.state.startsWith('absent') ? 'danger' : 'warning'}>
                      {a.state}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
