import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'

// Small (i) icon that reveals an explanation on click - for a key
// action or field whose purpose isn't obvious from its label alone
// (a webhook secret, an API key, a toggle with a real consequence).
// Click-to-reveal rather than hover-only so it works the same on
// touch devices, which is most of this project's audience.
export default function InfoTooltip({ text, label = "Plus d'informations", className = '' }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <span ref={containerRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={label}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-ink-muted hover:text-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      >
        <Icon name="info" className="text-[15px] leading-none" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-control bg-surface-raised p-3 text-xs leading-relaxed text-ink shadow-lg ring-1 ring-border"
        >
          {text}
        </span>
      )}
    </span>
  )
}
