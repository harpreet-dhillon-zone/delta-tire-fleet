import { NavLink, Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'

const NAV: { to: string; label: string; icon: ReactNode; end?: boolean }[] = [
  {
    to: '/', label: 'Attention', end: true,
    icon: <path d="M12 3 2 21h20zM12 10v4M12 18h.01" />,
  },
  {
    to: '/units', label: 'Units',
    icon: <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
  },
  {
    to: '/settings', label: 'Settings',
    icon: <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4" />,
  },
]

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  )
}

export function AppShell() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Desktop top bar */}
      <header className="sticky top-0 z-30 hidden border-b border-slate-800 bg-slate-900 text-white md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-6">
          <span className="py-4 text-lg font-bold">Delta Tire Fleet</span>
          <nav className="flex gap-1" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => `flex min-h-12 items-center gap-2 rounded-lg px-4 font-semibold
                  ${isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                <NavIcon>{n.icon}</NavIcon>
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-4 md:px-6 md:pb-10 md:pt-6">
        <Outlet />
      </main>

      {/* Phone bottom tab bar: big targets, reachable with a thumb */}
      <nav aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-slate-300 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => `flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm font-semibold
              ${isActive ? 'text-blue-700' : 'text-slate-600'}`}>
            <NavIcon>{n.icon}</NavIcon>
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
