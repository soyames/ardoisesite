import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Icon from '../../shared/ui/Icon.jsx'

export default function DeveloperPortal() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Espace Developpeur</h1>
        <p className="mt-1 text-sm text-ink-muted">Gerez vos cles API et vos integrations webhooks avec Ardoise.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader title="Cles API" subtitle="Authentifiez vos requetes vers l'API Ardoise." />
          <CardBody>
            <div className="rounded-card bg-surface-raised border border-border p-4 text-center">
              <Icon name="key" className="text-4xl text-ink-muted mb-2" />
              <p className="text-sm font-medium text-ink">Fonctionnalite en cours de developpement</p>
              <p className="text-xs text-ink-muted mt-1">La generation de cles API sera bientot disponible.</p>
              <div className="mt-4">
                <Button size="sm" variant="secondary" disabled>Generer une cle</Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Documentation" subtitle="Consultez nos guides et la reference API." />
          <CardBody>
            <div className="rounded-card bg-surface-raised border border-border p-4">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Icon name="book" className="text-primary-600" />
                  <a href="#" className="font-medium text-primary-600 hover:underline">Guide de demarrage rapide</a>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="api" className="text-primary-600" />
                  <a href="#" className="font-medium text-primary-600 hover:underline">Reference de l'API REST</a>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="webhook" className="text-primary-600" />
                  <a href="#" className="font-medium text-primary-600 hover:underline">Documentation Webhooks</a>
                </li>
              </ul>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
