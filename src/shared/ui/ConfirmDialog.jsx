import Button from './Button.jsx'

// In-app confirmation modal - replaces window.confirm(), which is a
// native browser popup outside the app's own theme/layout and (unlike
// this) can't be styled, tested, or automated reliably.
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmer', danger = false, onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-card bg-surface-raised p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <h3 id="confirm-dialog-title" className="text-base font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-ink-muted">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-control px-3 py-1.5 text-sm font-medium text-ink-muted hover:text-ink">
            Annuler
          </button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
