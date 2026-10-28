import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { HeartPulse } from 'lucide-react'
import { logout as logoutRequest } from '../api/authService'
import { logout } from '../features/authSlice'
import { useNotify } from '../hooks/useNotify'
import { ROLE_LABELS } from '../config/roles'
import { NAV_ITEMS } from '../config/navigation'
import Icon from './Icon'

const sidebarLinkClass = ({ isActive }) =>
  'flex items-center gap-2 rounded-lg p-2 text-label-lg transition-colors focus-visible:outline-2 focus-visible:outline-primary ' +
  (isActive ? 'bg-primary-fixed text-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface')

const bottomLinkClass = ({ isActive }) =>
  'flex min-h-11 min-w-16 flex-col items-center justify-center rounded-lg px-2 transition-colors focus-visible:outline-2 focus-visible:outline-primary ' +
  (isActive ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface')

const Logo = () => (
  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary shadow-md">
    <HeartPulse aria-hidden="true" size={20} strokeWidth={2.25} />
  </span>
)

const Avatar = ({ className = 'size-10' }) => (
  <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full bg-primary text-on-primary ${className}`}>
    <Icon name="person" className="text-[20px]" />
  </span>
)

const LogoutButton = ({ onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label="Se déconnecter"
    title="Se déconnecter"
    className="flex size-10 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-primary"
  >
    <Icon name="logout" className="text-[22px]" />
  </button>
)

const AppLayout = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const notify = useNotify()
  const user = useSelector((state) => state.auth.user)
  const [signingOut, setSigningOut] = useState(false)

  const pageTitle = NAV_ITEMS.find((item) => pathname.startsWith(item.to))?.label ?? 'ClinicFlow'
  const roleLabel = ROLE_LABELS[user?.role] ?? user?.role

  const handleLogout = async () => {
    setSigningOut(true)
    await logoutRequest().catch(() => null)
    dispatch(logout())
    notify.success('Vous êtes déconnecté.')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-surface">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-surface-container-lowest shadow-[1px_0_8px_rgba(0,0,0,0.04)] lg:flex">
        <div className="flex h-20 items-center gap-2 px-6">
          <Logo />
          <span className="text-headline-sm font-semibold text-primary">ClinicFlow</span>
        </div>

        <nav aria-label="Navigation principale" className="flex flex-1 flex-col gap-1 px-2 pt-4">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={sidebarLinkClass}>
              <Icon name={item.icon} className="text-[22px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="m-2 flex items-center gap-2 rounded-xl bg-surface-container-low p-2">
          <Avatar />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-label-lg font-semibold">{user?.full_name}</span>
            <span className="text-label-sm text-on-surface-variant">{roleLabel}</span>
          </div>
          <LogoutButton onClick={handleLogout} disabled={signingOut} />
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col lg:ml-64">
        <header className="sticky top-0 z-30 bg-surface/85 pt-[env(safe-area-inset-top)] shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex h-20 w-full items-center justify-between gap-2 px-4">
            <div className="flex min-w-0 items-center gap-2">
              <span className="lg:hidden">
                <Logo />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-label-lg font-semibold text-primary lg:hidden">ClinicFlow</span>
                <span className="truncate text-headline-sm font-semibold lg:text-headline-md">{pageTitle}</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden flex-col text-right sm:flex">
                <span className="text-label-md font-semibold">{user?.full_name}</span>
                <span className="text-label-sm text-on-surface-variant">{roleLabel}</span>
              </div>
              <Avatar className="size-8 lg:size-10" />
              <span className="lg:hidden">
                <LogoutButton onClick={handleLogout} disabled={signingOut} />
              </span>
            </div>
          </div>
        </header>

        <main className="w-full flex-1 px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-40 bg-surface/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:hidden"
      >
        <div className="flex h-16 items-center justify-around px-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={bottomLinkClass}>
              <Icon name={item.icon} className="text-[24px]" />
              <span className="mt-0.5 text-label-sm">{item.shortLabel}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default AppLayout
