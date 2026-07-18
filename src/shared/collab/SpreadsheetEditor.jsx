import { useEffect, useRef, useState } from 'react'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import UniverPresetSheetsCoreFrFR from '@univerjs/preset-sheets-core/locales/fr-FR'
import '@univerjs/preset-sheets-core/lib/index.css'
import { api, ApiError } from '../api/client.js'
import Button from '../ui/Button.jsx'
import Spinner from '../ui/Spinner.jsx'

/**
 * Full formula-capable spreadsheet, built on Univer's Apache-2.0 core
 * (real formula engine, sort/filter, rich cell formatting - see
 * collab/models.py:Document.Kind.SPREADSHEET). Single editor at a time
 * via the same checkout/release lock every other Document already
 * uses - no real-time collaboration sync, that is Univer's separate
 * paid tier and deliberately not used here.
 */
export default function SpreadsheetEditor({ document: doc, onClose, onSaved }) {
  const containerRef = useRef(null)
  const univerApiRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let disposed = false
    let univerAPI = null

    async function init() {
      try {
        if (doc.status !== 'checked_out') {
          await api.post(`/api/collab/documents/${doc.id}/checkout/`, {})
        }
        const res = await fetch(doc.file, { credentials: 'include' })
        if (!res.ok) throw new Error('Impossible de charger la feuille de calcul.')
        const snapshot = await res.json()
        if (disposed) return

        const created = createUniver({
          locale: LocaleType.FR_FR,
          locales: { [LocaleType.FR_FR]: mergeLocales(UniverPresetSheetsCoreFrFR) },
          presets: [UniverSheetsCorePreset({ container: containerRef.current })],
        })
        univerAPI = created.univerAPI
        univerApiRef.current = univerAPI
        univerAPI.createWorkbook(snapshot)
        setLoading(false)
      } catch (err) {
        if (!disposed) {
          setError(err instanceof ApiError ? err.message : err.message || 'Erreur inattendue.')
          setLoading(false)
        }
      }
    }
    init()

    return () => {
      disposed = true
      univerApiRef.current?.dispose()
    }
  }, [doc.id])

  const currentSnapshotFile = () => {
    const snapshot = univerApiRef.current.getActiveWorkbook().save()
    const blob = new Blob([JSON.stringify(snapshot)], { type: 'application/json' })
    return new File([blob], `${doc.title}.univer.json`, { type: 'application/json' })
  }

  const save = async ({ close }) => {
    setSaving(true)
    setError(null)
    try {
      const data = new FormData()
      data.append('file', currentSnapshotFile())
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
          <Button size="sm" variant="secondary" onClick={() => save({ close: false })} disabled={saving || loading}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          <Button size="sm" onClick={() => save({ close: true })} disabled={saving || loading}>
            Enregistrer et fermer
          </Button>
        </div>
      </div>
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner />
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  )
}
