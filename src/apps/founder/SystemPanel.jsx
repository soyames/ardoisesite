import { useEffect } from 'react'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'
import ActivityList from '../../shared/ui/ActivityList.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import Icon from '../../shared/ui/Icon.jsx'

const ROLE_LABELS = {
  director: 'Directeur', censeur: 'Censeur', surveillant: 'Surveillant', comptable: 'Comptable',
  secretary: 'Secretaire', cashier: 'Caissier', hr: 'RH', teacher: 'Enseignant',
  canteen: 'Cantine', librarian: 'Bibliothecaire', auditor: 'Auditeur',
}

const AUDIT_ICON_BY_ACTION = {
  create: 'add_circle', update: 'edit_document', delete_attempt: 'block',
  reversal: 'undo', login: 'login', export: 'file_download',
}

function formatSize(bytes) {
  if (!bytes) return '0 o'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`
}

/**
 * Honest analog of the Stitch erp_system_core screen - that mockup shows
 * "99.98% Operational", "AWS Virginia", auto-backup timers and IP-address
 * login-attempt alerts, none of which exist here: this app is a single
 * school's self-hosted install (see core/models.py:School's own docstring
 * - "not a tenant key, this database never holds more than one school's
 * data"), not a multi-tenant SaaS with infrastructure to report on.
 * What's real and shown instead: actual staff/role counts, actual
 * document storage usage, and the real audit log - the same data source
 * AnalyticsDashboard.jsx already uses for "Activite recente", computed
 * client-side the same way (fine at this product's single-school scale).
 */
export default function SystemPanel() {
  const school = useApiGet('/api/auth/school/')
  const academicYears = useApiGet('/api/auth/academic-years/')
  const staff = useApiGet('/api/collab/staff-directory/')
  const documents = useApiGet('/api/collab/documents/')
  const auditLogs = useApiGet('/api/audit/logs/')
  const backupStatus = useApiGet('/api/backup/status/')

  const loading = school.loading || academicYears.loading || staff.loading || documents.loading || auditLogs.loading || backupStatus.loading

  const currentYear = academicYears.data?.find((y) => y.isCurrent) || academicYears.data?.[0]

  const roleCounts = (staff.data || []).reduce((acc, s) => {
    acc[s.role] = (acc[s.role] || 0) + 1
    return acc
  }, {})

  const totalStorage = (documents.data || []).reduce((sum, d) => sum + (d.fileSize || 0), 0)

  const activityItems = (auditLogs.data || []).slice(0, 8).map((log) => ({
    id: log.id,
    icon: AUDIT_ICON_BY_ACTION[log.action] || 'history',
    title: log.summary,
    subtitle: log.actorName,
    timestamp: new Date(log.occurredAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Systeme</h1>
        <p className="mt-1 text-sm text-ink-muted">Configuration de l'ecole, comptes, stockage et journal d'audit.</p>
      </div>

      {loading && <div className="flex justify-center py-10"><Spinner /></div>}

      {!loading && (
        <>
          {school.data && (
            <Card>
              <CardHeader title={school.data.name} subtitle={school.data.shortCode} />
              <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Adresse</p>
                  <p className="mt-1 text-sm text-ink">{school.data.address || '-'}</p>
                  <p className="text-sm text-ink">{school.data.commune}{school.data.arrondissement && `, ${school.data.arrondissement}`}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Contact</p>
                  <p className="mt-1 text-sm text-ink">{school.data.phone || '-'}</p>
                  <p className="text-sm text-ink">IFU: {school.data.ifu || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Annee academique</p>
                  <p className="mt-1 text-sm text-ink">{currentYear?.label || 'Non definie'}</p>
                </div>
              </CardBody>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="group" label="Comptes du personnel" value={staff.data?.length || 0} />
            <StatCard icon="description" label="Documents stockes" value={documents.data?.length || 0} />
            <StatCard icon="folder" label="Espace utilise" value={formatSize(totalStorage)} />
            <StatCard icon="history" label="Evenements audites" value={auditLogs.data?.length || 0} />
          </div>

          <Card>
            <CardHeader title="Repartition du personnel par role" />
            <CardBody className="flex flex-wrap gap-2">
              {Object.keys(roleCounts).length === 0 && (
                <p className="text-sm text-ink-muted">Aucun compte de personnel pour le moment.</p>
              )}
              {Object.entries(roleCounts).map(([role, count]) => (
                <div key={role} className="flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2">
                  <Icon name="person" className="text-accent-700" />
                  <span className="text-sm text-ink">{ROLE_LABELS[role] || role}</span>
                  <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">{count}</span>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Sauvegarde Cloud (Google Drive)" subtitle="Sauvegarde automatique de la base de donnees et des documents" />
            <CardBody>
              {!backupStatus.data?.isConfigured ? (
                <div className="flex flex-col items-start gap-4">
                  <p className="text-sm text-ink-muted">Connectez votre compte Google Drive pour activer la sauvegarde automatique de cette instance Ardoise. Vos donnees restent ainsi entierement sous votre controle.</p>
                  <button onClick={() => {
                    fetch('/api/backup/oauth/init/')
                      .then(res => res.json())
                      .then(data => {
                        if (data.authUrl) window.location.href = data.authUrl;
                        else alert('Erreur: ' + data.error);
                      });
                  }} className="rounded-control bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                    Connecter Google Drive
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Icon name="check_circle" className="text-green-500" />
                    Connecte. Les sauvegardes sont {backupStatus.data.isEnabled ? 'activees' : 'desactivees'}.
                  </div>
                  {backupStatus.data.lastBackup ? (
                    <div className="text-sm text-ink-muted">
                      Derniere sauvegarde : {new Date(backupStatus.data.lastBackup.date).toLocaleString('fr-FR')}
                      ({backupStatus.data.lastBackup.status})
                    </div>
                  ) : (
                    <div className="text-sm text-ink-muted">Aucune sauvegarde effectuee pour le moment.</div>
                  )}
                  <button onClick={() => {
                    fetch('/api/backup/trigger/', { method: 'POST', headers: { 'X-CSRFToken': document.cookie.split('csrftoken=')[1]?.split(';')[0] } })
                      .then(res => res.json())
                      .then(data => {
                        if (data.success) {
                          alert('Sauvegarde terminee avec succes.')
                          window.location.reload()
                        } else {
                          alert('Erreur: ' + data.error)
                        }
                      })
                  }} className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-surface-hover">
                    Sauvegarder Maintenant
                  </button>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Journal d'audit" subtitle="Dernieres actions tracees sur cette instance." />
            <CardBody>
              <ActivityList items={activityItems} emptyLabel="Aucune activite recente." />
            </CardBody>
          </Card>
        </>
      )}
    </div>
  )
}
