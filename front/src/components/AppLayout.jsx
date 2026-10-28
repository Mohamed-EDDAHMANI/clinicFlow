import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { logout as logoutRequest } from '../api/authService'
import { logout } from '../features/authSlice'
import { useNotify } from '../hooks/useNotify'
import { ROLE_LABELS } from '../config/roles'
import Icon from './Icon'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Tableau de bord', icon: 'dashboard' },
]

const navLinkClass = ({ isActive }) =>
  `flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-label-lg font-medium transition-colors ` +
  `focus-visible:outline-2 focus-visible:outline-primary ` +
  (isActive
    ? 'bg-surface-container-high text-primary'
    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface')

const AppLayout = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const notify = useNotify()
  const user = useSelector((state) => state.auth.user)
  const [signingOut, setSigningOut] = useState(false)

  const handleLogout = async () => {
    setSigningOut(true)
    await logoutRequest().catch(() => null)
    dispatch(logout())
    notify.success('Vous êtes déconnecté.')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-40 bg-surface-container-lowest shadow-sm pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-on-primary shadow-md">
              <Icon name="health_and_safety" className="text-[22px]" />
            </span>
            <span className="text-headline-sm font-semibold tracking-tight">ClinicFlow</span>
          </div>

          <nav aria-label="Navigation principale" className="hidden md:flex md:flex-1 md:items-center md:gap-1 md:pl-6">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                <Icon name={item.icon} className="text-[20px]" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-label-lg font-semibold">{user?.full_name}</p>
              <p className="text-label-md text-on-surface-variant">{ROLE_LABELS[user?.role] ?? user?.role}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              aria-label="Se déconnecter"
              className="flex h-10 items-center gap-2 rounded-lg px-3 text-label-lg font-medium text-on-surface-variant ring-1 ring-inset ring-outline-variant/70 hover:bg-surface-container-low hover:text-on-surface disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Icon name="logout" className="text-[20px]" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>

        <nav aria-label="Navigation principale" className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              <Icon name={item.icon} className="text-[20px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
