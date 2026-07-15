import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

/**
 * Shared chrome for every portal: sidebar nav (items passed in per
 * portal, since a Founder's nav and a Teacher's nav have nothing in
 * common) + a topbar showing who's logged in and a logout action.
 * Nothing here decides *which* portal renders inside -- that's
 * App.jsx's routing, keyed off useAuth().user.role.
 */
export default function AppShell({ navItems, children }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-svh bg-surface">
      <aside className="hidden w-60 shrink-0 flex-col bg-primary-950 md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-control bg-accent-500 text-sm font-bold text-primary-950">
            A
          </div>
          <span className="text-sm font-semibold text-white">Ardoise</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-control px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary-800 text-white'
                    : 'text-primary-200 hover:bg-primary-900 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-primary-800 px-3 py-3">
          <p className="truncate px-3 text-xs text-primary-300">{user?.school?.name}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface-raised px-4 py-3 md:px-6">
          <div className="md:hidden text-sm font-semibold text-ink">Ardoise</div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-ink">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-ink-muted">{user?.role_display}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-control px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-primary-50 hover:text-primary-700"
            >
              Deconnexion
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>

        <nav className="flex justify-around border-t border-border bg-surface-raised px-2 py-2 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-control px-3 py-1.5 text-xs font-medium ${
                  isActive ? 'text-primary-700' : 'text-ink-muted'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
