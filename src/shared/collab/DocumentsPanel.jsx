import { useState } from 'react'
import { api, ApiError } from '../api/client.js'
import { useApiGet } from '../hooks/useApi.js'
import { Card, CardBody } from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import Spinner from '../ui/Spinner.jsx'
import EmptyState from '../ui/EmptyState.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

const STATUS_TONE = { draft: 'neutral', checked_out: 'warning', signed: 'success' }
const STATUS_LABEL = { draft: 'Brouillon', checked_out: 'En cours de modification', signed: 'Signe' }

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function UploadForm({ onUploaded, onCancel }) {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!file) return
    setSubmitting(true)
    setError(null)
    try {
      const data = new FormData()
      data.append('title', title.trim() || file.name)
      data.append('file', file)
      await api.postForm('/api/collab/documents/', data)
      onUploaded()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardBody className="space-y-3">
        <p className="text-sm font-semibold text-ink">Deposer un document</p>
        <form onSubmit={submit} className="space-y-3">
          <input className={INPUT_CLASS} placeholder="Titre (optionnel)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input type="file" required onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-ink-muted file:mr-4 file:rounded file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100" />
          {error && <p className="text-sm text-danger-600">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" type="submit" disabled={submitting || !file}>{submitting ? 'Envoi...' : 'Deposer'}</Button>
            <Button size="sm" variant="ghost" type="button" onClick={onCancel}>Annuler</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

/**
 * Shared document library - freeform uploads + WeasyPrint-generated
 * templated documents (invoices, bulletins once wired) - see
 * collab/models.py:Document. Presented as a flat, searchable list
 * rather than the "folder cards with file counts" the Stitch mockup
 * showed - Document has no category/folder field, only kind and an
 * optional template purpose, so a folder grid would be decorative,
 * not real grouping. checked_out/signed status and lock actions are
 * exactly what the backend's state machine already enforces.
 */
export default function DocumentsPanel() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const documents = useApiGet('/api/collab/documents/')

  const filtered = (documents.data || []).filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  )

  const act = async (id, action) => {
    setBusy(id)
    setError(null)
    try {
      await api.post(`/api/collab/documents/${id}/${action}/`, {})
      documents.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(null)
    }
  }

  const releaseWithFile = async (id, file) => {
    setBusy(id)
    setError(null)
    try {
      const data = new FormData()
      if (file) data.append('file', file)
      await api.postForm(`/api/collab/documents/${id}/release/`, data)
      documents.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          className={`max-w-xs ${INPUT_CLASS}`}
          placeholder="Rechercher un document..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>{showForm ? 'Fermer' : '+ Deposer un document'}</Button>
      </div>

      {showForm && (
        <UploadForm onCancel={() => setShowForm(false)} onUploaded={() => { setShowForm(false); documents.refetch() }} />
      )}

      {error && <p className="text-sm text-danger-600">{error}</p>}
      {documents.loading && <div className="flex justify-center py-8"><Spinner /></div>}
      {!documents.loading && filtered.length === 0 && (
        <EmptyState title="Aucun document" description="Deposez un fichier pour commencer." />
      )}

      <div className="space-y-2">
        {filtered.map((doc) => (
          <Card key={doc.id}>
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{doc.title}</p>
                <p className="text-xs text-ink-muted">
                  {doc.uploaded_by?.full_name} - {formatSize(doc.file_size)}
                  {doc.document_template_name && ` - ${doc.document_template_name}`}
                  {doc.status === 'checked_out' && doc.checked_out_by && ` - Verrouille par ${doc.checked_out_by.full_name}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Badge tone={STATUS_TONE[doc.status] || 'neutral'}>{STATUS_LABEL[doc.status] || doc.status}</Badge>
                <a href={doc.file} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-control bg-surface-raised px-3 py-1.5 text-xs font-medium text-ink ring-1 ring-inset ring-border hover:bg-surface-hover">
                  Telecharger
                </a>
                {doc.status === 'draft' && (
                  <Button size="sm" variant="secondary" onClick={() => act(doc.id, 'checkout')} disabled={busy === doc.id}>
                    Modifier (Word/Excel)
                  </Button>
                )}
                {doc.status === 'checked_out' && (
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-control bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700">
                    Reteleverser la version modifiee
                    <input
                      type="file"
                      className="hidden"
                      disabled={busy === doc.id}
                      onChange={(e) => e.target.files?.[0] && releaseWithFile(doc.id, e.target.files[0])}
                    />
                  </label>
                )}
                {doc.status === 'checked_out' && (
                  <Button size="sm" variant="ghost" onClick={() => releaseWithFile(doc.id, null)} disabled={busy === doc.id}>
                    Annuler sans modifier
                  </Button>
                )}
                {doc.kind === 'templated' && doc.status !== 'signed' && (
                  <Button size="sm" onClick={() => act(doc.id, 'sign')} disabled={busy === doc.id}>
                    Signer
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      <p className="text-xs text-ink-muted">
        Modifier ouvre le fichier telecharge dans Word/Excel (ou LibreOffice) deja installe sur cet ordinateur -
        aucun editeur en ligne requis. Reteleversez la version modifiee pour l'enregistrer et deverrouiller le document.
      </p>
    </div>
  )
}
