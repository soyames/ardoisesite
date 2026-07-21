import { useEffect } from 'react'
import Icon from './Icon.jsx'

const TONE_CLASSES = {
  success: 'border-success-200 bg-success-50 text-success-700',
  danger: 'border-danger-200 bg-danger-50 text-danger-700',
}

const TONE_ICON = { success: 'check_circle', danger: 'error' }

// Floating in-app notification - replaces native alert()/window
// popups, which block the page and can't be dismissed by clicking
// elsewhere. Auto-dismisses after `duration`ms; pass duration={0} to
// require an explicit close (e.g. when the message includes something
// the user needs to copy, like a one-time password).
export default function Toast({ message, tone = 'success', onClose, duration = 5000 }) {
  useEffect(() => {
    if (!duration) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!message) return null

  return (
    <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md sm:left-auto sm:right-4">
      <div className={`flex items-start gap-2 rounded-control border px-4 py-3 text-sm shadow-lg ${TONE_CLASSES[tone]}`}>
        <Icon name={TONE_ICON[tone]} filled className="mt-0.5 shrink-0 text-[18px]" />
        <p className="flex-1">{message}</p>
        <button type="button" onClick={onClose} aria-label="Fermer" className="shrink-0 opacity-70 hover:opacity-100">
          <Icon name="close" className="text-[16px]" />
        </button>
      </div>
    </div>
  )
}
