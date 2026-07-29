import { useRegisterSW } from 'virtual:pwa-register/react'
import Icon from './Icon.jsx'

export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex max-w-sm animate-in fade-in slide-in-from-top-4 items-center gap-4 rounded-card bg-primary-900 px-4 py-3 text-white shadow-elevated ring-1 ring-primary-700">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-bold">Mise à jour disponible</span>
        <span className="text-xs text-primary-200">Une nouvelle version de l'application est prête.</span>
      </div>
      <button
        onClick={() => updateServiceWorker(true)}
        className="flex shrink-0 items-center gap-1.5 rounded-control bg-white px-3 py-1.5 text-sm font-bold text-primary-900 shadow-sm transition hover:bg-primary-50"
      >
        <Icon name="update" className="h-4 w-4" />
        Mettre à jour
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary-800 text-white shadow-sm ring-1 ring-white/20 transition hover:bg-primary-700"
        aria-label="Fermer"
      >
        <Icon name="close" className="h-3 w-3" />
      </button>
    </div>
  )
}
