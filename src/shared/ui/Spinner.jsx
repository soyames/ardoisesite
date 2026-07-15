export default function Spinner({ className = '' }) {
  return (
    <div
      className={`h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600 ${className}`}
      role="status"
      aria-label="Chargement"
    />
  )
}
