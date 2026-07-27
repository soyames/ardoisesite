import { useState } from 'react'
import { api, ApiError } from '../api/client.js'
import { useApiGet } from '../hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import Spinner from '../ui/Spinner.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import Icon from '../ui/Icon.jsx'

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

function ImageDropzone({ value, onChange, label }) {
  const [dragActive, setDragActive] = useState(false)

  // Extract base64 src from img tag if value is an img tag
  const extractSrc = (html) => {
    if (!html) return null
    const match = html.match(/src="([^"]+)"/)
    return match ? match[1] : null
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      // Wraps the base64 image in a clean img tag that looks good on PDF
      const html = `<img src="${reader.result}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" alt="${label}" />`
      onChange(html)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const imgSrc = extractSrc(value)

  return (
    <div 
      className={`relative mt-2 flex justify-center rounded-lg border border-dashed px-6 py-10 transition-colors ${
        dragActive ? 'border-primary-500 bg-primary-50' : 'border-border bg-surface-raised'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="text-center w-full">
        {imgSrc ? (
          <div className="mb-4 relative w-full flex justify-center">
            <img src={imgSrc} alt="Previsualisation" className="max-h-48 object-contain border border-border shadow-sm rounded-md" />
            <button 
              type="button" 
              onClick={(e) => { e.preventDefault(); onChange('') }}
              className="absolute -top-3 -right-3 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
            >
              <Icon name="close" className="text-[16px]" />
            </button>
          </div>
        ) : (
          <Icon name="photo_camera" className="mx-auto h-12 w-12 text-ink-muted/50" />
        )}
        <div className="mt-4 flex text-sm leading-6 text-ink-muted justify-center">
          <label
            className="relative cursor-pointer rounded-md bg-transparent font-semibold text-primary-600 focus-within:outline-none hover:text-primary-500"
          >
            <span>Cliquez pour sélectionner un fichier</span>
            <input type="file" accept="image/*" className="sr-only" onChange={handleChange} />
          </label>
          <p className="pl-1">ou glissez-déposez l'image ici</p>
        </div>
        <p className="text-xs leading-5 text-ink-muted">PNG, JPG ou JPEG (idéalement largeur de 800px)</p>
      </div>
    </div>
  )
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
              <label className="block text-sm font-medium text-ink">Image d'En-tête (Logo + Nom)</label>
              <ImageDropzone value={form.headerHtml} onChange={(html) => setForm({ ...form, headerHtml: html })} label="En-tête" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mt-4">Image de Pied de page</label>
              <ImageDropzone value={form.footerHtml} onChange={(html) => setForm({ ...form, footerHtml: html })} label="Pied de page" />
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
