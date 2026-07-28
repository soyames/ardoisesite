import { useGeo } from './GeoContext.jsx'
import GeoBlockedPage from './GeoBlockedPage.jsx'

export default function GeoGate({ children }) {
  const { status, isOhada } = useGeo()

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" aria-label="Chargement" />
      </div>
    )
  }

  if (!isOhada) return <GeoBlockedPage />

  return children
}
