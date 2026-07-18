import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { api, ApiError } from '../api/client.js'
import Button from '../ui/Button.jsx'

const TOOLBAR_BUTTON =
  'rounded-control px-2.5 py-1 text-sm font-medium text-ink hover:bg-surface-hover'
const TOOLBAR_BUTTON_ACTIVE = 'bg-primary-100 text-primary-700'

function ToolbarButton({ editor, isActive, onClick, label, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`${TOOLBAR_BUTTON} ${isActive(editor) ? TOOLBAR_BUTTON_ACTIVE : ''}`}
    >
      {label}
    </button>
  )
}

/**
 * Lightweight rich-text/wiki note editor - the Odoo Text (Knowledge app)
 * equivalent, not a Word clone: no formulas, no page layout/pagination,
 * just headings/bold/italic/lists (see the CEO plan's explicit
 * boundary - 2026-07-18-office-suite-editor.md). Same checkout/release
 * lock as every other Document, content stored as HTML in `file`
 * (content_type=text/html is the discriminator DocumentsPanel uses to
 * offer this editor instead of the plain upload/download flow).
 */
export default function NoteEditor({ document: doc, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(doc.status === 'checked_out')

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editable: true,
    onCreate: async ({ editor: instance }) => {
      try {
        if (doc.status !== 'checked_out') {
          await api.post(`/api/collab/documents/${doc.id}/checkout/`, {})
        }
        const res = await fetch(doc.file, { credentials: 'include' })
        const html = res.ok ? await res.text() : '<p></p>'
        instance.commands.setContent(html)
        setReady(true)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Erreur lors du chargement de la note.')
        setReady(true)
      }
    },
  })

  const currentHtmlFile = () => {
    const blob = new Blob([editor.getHTML()], { type: 'text/html' })
    return new File([blob], `${doc.title}.html`, { type: 'text/html' })
  }

  const save = async ({ close }) => {
    setSaving(true)
    setError(null)
    try {
      const data = new FormData()
      data.append('file', currentHtmlFile())
      await api.postForm(`/api/collab/documents/${doc.id}/release/`, data)
      if (!close) {
        await api.post(`/api/collab/documents/${doc.id}/checkout/`, {})
      }
      onSaved?.()
      if (close) onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors de l’enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  const closeWithoutSaving = async () => {
    setSaving(true)
    try {
      await api.post(`/api/collab/documents/${doc.id}/release/`, {})
    } catch {
      // best-effort - the lock also auto-releases via release_stale_document_locks
    } finally {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface-raised px-4 py-2">
        <p className="truncate text-sm font-semibold text-ink">{doc.title}</p>
        <div className="flex items-center gap-2">
          {error && <p className="text-sm text-danger-600">{error}</p>}
          <Button size="sm" variant="ghost" onClick={closeWithoutSaving} disabled={saving}>
            Fermer sans enregistrer
          </Button>
          <Button size="sm" variant="secondary" onClick={() => save({ close: false })} disabled={saving || !ready}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          <Button size="sm" onClick={() => save({ close: true })} disabled={saving || !ready}>
            Enregistrer et fermer
          </Button>
        </div>
      </div>
      {editor && (
        <div className="flex shrink-0 flex-wrap gap-1 border-b border-border bg-surface-raised px-3 py-1.5">
          <ToolbarButton editor={editor} title="Titre 1" label="H1" isActive={(e) => e.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
          <ToolbarButton editor={editor} title="Titre 2" label="H2" isActive={(e) => e.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
          <ToolbarButton editor={editor} title="Gras" label="Gras" isActive={(e) => e.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
          <ToolbarButton editor={editor} title="Italique" label="Italique" isActive={(e) => e.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
          <ToolbarButton editor={editor} title="Liste a puces" label="Liste" isActive={(e) => e.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
          <ToolbarButton editor={editor} title="Liste numerotee" label="1. 2. 3." isActive={(e) => e.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
          <ToolbarButton editor={editor} title="Citation" label="Citation" isActive={(e) => e.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <EditorContent editor={editor} className="prose mx-auto max-w-3xl text-ink" />
      </div>
    </div>
  )
}
