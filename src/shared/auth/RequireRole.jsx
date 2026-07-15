import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

/**
 * Route guard. `roles` is optional -- omit it to require "any logged
 * in user", or pass an array to restrict to specific core.Role values
 * (see ardoise/apps/core/models.py:Role for the full list; the string
 * values here must match those exactly since they come straight
 * through MeSerializer's `role` field, no re-mapping).
 */
export default function RequireRole({ roles, children }) {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
