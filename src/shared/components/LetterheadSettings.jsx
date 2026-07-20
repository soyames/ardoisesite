import { useState } from 'react'
import { api, ApiError } from '../api/client.js'
import { useApiGet } from '../hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import Spinner from '../ui/Spinner.jsx'
import EmptyState from '../ui/EmptyState.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

const PURPOSES = [
  { value: 'generic', label: 'Document generique' },
  { value: 'invoice', label: 'Facture' },
  { value: 'enrollment_certificate', label: 'Certificat de scolarite' },
  { value: 'discipline_notice', label: 'Notification disciplinaire' },
  { value: 'bulletin', label: 'Bulletin de notes' },
]

const EMPTY_FORM = { name: '', purpose: 'generic', headerHtml: '', footerHtml: '' }

const SAMPLE_TEMPLATES = {
  header: `<div style="text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px;">
  <h1 style="margin: 0; color: #2c3e50;">[Nom de l'Ecole]</h1>
  <p style="margin: 5px 0 0; color: #7f8c8d;">[Adresse complete de l'ecole] | Tel: [Numero] | Email: [Email]</p>
</div>`,
  footer: `<div style="text-align: center; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 30px; font-size: 12px; color: #95a5a6;">
  <p style="margin: 0;">[Nom de l'Ecole] - Agree par le Ministere de l'Education Nationale</p>
  <p style="margin: 0;">Site Web: [Site Web] | RCCM: [Numero d'immatriculation]</p>
</div>`
}


/**
 * Reusable across Founder/Director/Censeur/Secretary - see
 * core/permissions.py for who holds add/change_documenttemplate.
 * Every generated document (invoices today, bulletins once PDF
 * rendering is built) is wrapped in whichever template matches its
 * purpose - see collab/services.py:render_templated_document.
 */
export default function LetterheadSettings() {
  const templates = useApiGet('/api/collab/document-templates/')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const startCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const startEdit = (t) => {
    setEditingId(t.id)
    setForm({ name: t.name, purpose: t.purpose, headerHtml: t.headerHtml, footerHtml: t.footerHtml })
    setShowForm(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (editingId) {
        await api.patch(`/api/collab/document-templates/${editingId}/`, form)
      } else {
        await api.post('/api/collab/document-templates/', form)
      }
      setShowForm(false)
      setForm(EMPTY_FORM)
      setEditingId(null)
      templates.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Lettre a en-tete"
        subtitle="Configurez l'en-tete et le pied de page appliques a vos documents generes (factures, bulletins, certificats)."
        action={<Button size="sm" onClick={startCreate}>{showForm && !editingId ? 'Fermer' : '+ Nouveau modele'}</Button>}
      />
      <CardBody className="space-y-4">
        {showForm && (
          <form onSubmit={submit} className="space-y-3 rounded-control border border-border p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input required className={INPUT_CLASS} placeholder="Nom du modele" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <select className={INPUT_CLASS} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
                {PURPOSES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-medium text-ink-muted">En-tete (HTML)</label>
                <button type="button" onClick={() => setForm({ ...form, headerHtml: SAMPLE_TEMPLATES.header })} className="text-xs text-primary-600 hover:underline">
                  + Inserer modele
                </button>
              </div>
              <textarea rows={4} className={INPUT_CLASS} placeholder="<h1>Nom de l'ecole</h1><p>Adresse, telephone...</p>" value={form.headerHtml} onChange={(e) => setForm({ ...form, headerHtml: e.target.value })} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-medium text-ink-muted">Pied de page (HTML)</label>
                <button type="button" onClick={() => setForm({ ...form, footerHtml: SAMPLE_TEMPLATES.footer })} className="text-xs text-primary-600 hover:underline">
                  + Inserer modele
                </button>
              </div>
              <textarea rows={3} className={INPUT_CLASS} placeholder="<p>Document genere par Ardoise</p>" value={form.footerHtml} onChange={(e) => setForm({ ...form, footerHtml: e.target.value })} />
            </div>
            {error && <p className="text-sm text-danger-600">{error}</p>}
            <Button type="submit" size="sm" disabled={submitting}>{submitting ? 'Enregistrement...' : editingId ? 'Mettre a jour' : 'Creer'}</Button>
          </form>
        )}

        {templates.loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {!templates.loading && templates.data?.length === 0 && (
          <EmptyState title="Aucun modele de lettre a en-tete" description="Creez-en un pour habiller vos factures et bulletins." />
        )}
        <ul className="space-y-2">
          {templates.data?.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-control border border-border p-3">
              <div>
                <p className="text-sm font-medium text-ink">{t.name}</p>
                <Badge tone="neutral">{PURPOSES.find((p) => p.value === t.purpose)?.label || t.purpose}</Badge>
              </div>
              <button onClick={() => startEdit(t)} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Modifier
              </button>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}
