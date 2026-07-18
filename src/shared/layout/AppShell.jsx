import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import Icon from '../ui/Icon.jsx'

/**
 * Shared chrome for every portal: a fixed horizontal TopAppBar with
 * text nav links (desktop) + a fixed icon+label BottomNavBar (mobile
 * only). This matches every Stitch mockup's own header/footer
 * structure exactly (see e.g. main_dashboard/code.html,
 * portail_du_censeur_directeur_acad_mique/code.html) - a vertical
 * dark sidebar was tried here earlier and does not appear in any of
 * the ~40 exported screens, so it was the real mismatch, not missing
 * icons. Nav items are passed in per portal (a Founder's nav and a
 * Teacher's nav have nothing in common); which portal renders inside
 * is App.jsx's routing, keyed off useAuth().user.role.
 */
export default function AppShell({ navItems, children }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-svh flex-col bg-surface">
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-border bg-surface px-4 py-2.5 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-950 text-sm font-bold text-white">
            A
          </div>
          <div className="min-w-0">
            <span className="text-lg font-bold text-ink">Ardoise</span>
            <p className="hidden truncate text-xs text-ink-muted md:block">{user?.school?.name}</p>
          </div>
        </div>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `text-xs uppercase tracking-wider transition ${
                  isActive ? 'font-bold text-ink' : 'font-semibold text-ink-muted hover:text-primary-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
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

      <main className="flex-1 px-4 pb-24 pt-20 md:px-10 md:pb-6 md:pt-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-surface-raised px-2 py-2 shadow-lg md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-full px-4 py-1 text-[11px] font-medium transition ${
                isActive ? 'bg-primary-100 text-primary-700' : 'text-ink-muted'
              }`
            }
          >
            {item.icon && <Icon name={item.icon} className="text-[22px]" />}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
