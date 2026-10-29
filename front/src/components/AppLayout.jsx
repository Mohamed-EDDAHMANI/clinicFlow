import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { Activity, ChevronDown, LogOut, Moon, PanelLeft, ShieldCheck, Sun, X } from 'lucide-react'
import { logout as logoutRequest } from '../api/authService'
import { getDashboardStats } from '../api/dashboardService'
import { logout } from '../features/authSlice'
import { useApi } from '../hooks/useApi'
import { useNotify } from '../hooks/useNotify'
import { useOverlay } from '../hooks/useOverlay'
import { useTheme } from '../hooks/useTheme'
import { ROLE_LABELS } from '../config/roles'
import { NAV_ITEMS } from '../config/navigation'
import Avatar from './Avatar'
import GlobalSearch from './GlobalSearch'
import PatientDrawer from './PatientDrawer'
import PatientModal from './PatientModal'
import AppointmentModal from './AppointmentModal'

const navClass = ({ isActive }) => `nav-item ${isActive ? 'active' : ''}`

const UserMenu = ({ user, onLogout, signingOut }) => {
  const [open, setOpen] = useState(false)
  const roleLabel = ROLE_LABELS[user?.role] ?? user?.role

  return (
    <div
      className="menu-wrap"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
    >
      <button type="button" className="user-chip" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-haspopup="menu">
        <Avatar name={user?.full_name} seed={user?.id} />
        <span className="user-name">{user?.full_name}</span>
        <ChevronDown aria-hidden="true" />
      </button>
      {open && (
        <div className="pop" role="menu">
          <div className="pop-head">
            <b>{user?.full_name}</b>
            <small>{user?.email}</small>
            <span className="chip chip-brand">{roleLabel}</span>
          </div>
          <button type="button" role="menuitem" className="pop-item danger" onClick={onLogout} disabled={signingOut}>
            <LogOut aria-hidden="true" />
            {signingOut ? 'Déconnexion…' : 'Déconnexion'}
          </button>
        </div>
      )}
    </div>
  )
}

const Overlays = () => {
  const { modal, modalId, modalDate, modalTime, patientId, close } = useOverlay()

  return (
    <>
      {patientId && <PatientDrawer key={patientId} patientId={patientId} />}
      {modal === 'new-appointment' && (
        <AppointmentModal patientId={modalId} date={modalDate} time={modalTime} onClose={() => close()} />
      )}
      {(modal === 'new-patient' || modal === 'edit-patient') && (
        <PatientModal
          id={modal === 'edit-patient' ? modalId : null}
          onClose={() => close()}
          onSaved={(saved, editing) => close(editing ? {} : { fiche: saved.id })}
        />
      )}
    </>
  )
}

const AppLayout = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const notify = useNotify()
  const { theme, toggle } = useTheme()
  const { openPatient } = useOverlay()
  const user = useSelector((state) => state.auth.user)
  const [signingOut, setSigningOut] = useState(false)
  const [sideOpen, setSideOpen] = useState(false)
  const stats = useApi(getDashboardStats)

  const handleLogout = async () => {
    setSigningOut(true)
    await logoutRequest().catch(() => null)
    dispatch(logout())
    notify.success('Déconnexion réussie.')
    navigate('/login', { replace: true })
  }

  const badgeValue = (badge) => (badge === 'today' ? stats.data?.today_appointments : undefined)

  return (
    <div className={`app ${sideOpen ? 'side-open' : ''}`}>
      <aside className="sidebar" aria-label="Menu principal">
        <div className="side-top">
          <span className="logo-tile"><Activity aria-hidden="true" /></span>
          <span className="logo-text">ClinicFlow</span>
          <button type="button" className="icon-btn side-close" onClick={() => setSideOpen(false)} aria-label="Fermer le menu">
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="side-label">Navigation</div>
        <nav className="side-nav" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => {
            const NavIcon = item.icon
            const badge = badgeValue(item.badge)
            return (
              <NavLink key={item.to} to={item.to} className={navClass} onClick={() => setSideOpen(false)}>
                <NavIcon aria-hidden="true" />
                <span>{item.label}</span>
                {typeof badge === 'number' && (
                  <span className="nav-badge" title="Rendez-vous aujourd'hui">{badge}</span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="side-spacer" />

        <div className="side-card">
          <ShieldCheck aria-hidden="true" />
          <div>
            <b>Règle des 30 minutes</b>
            <small>Deux rendez-vous confirmés d’un même patient ne peuvent pas se chevaucher.</small>
          </div>
        </div>
      </aside>

      {sideOpen && <div className="scrim" onClick={() => setSideOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn menu-btn" onClick={() => setSideOpen(true)} aria-label="Ouvrir le menu">
            <PanelLeft aria-hidden="true" />
          </button>
          <GlobalSearch onSelect={(patient) => openPatient(patient.id)} />
          <div className="tb-spacer" />
          <button
            type="button"
            className="icon-btn"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
            title={theme === 'dark' ? 'Thème clair' : 'Thème sombre'}
          >
            {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </button>
          <UserMenu user={user} onLogout={handleLogout} signingOut={signingOut} />
        </header>

        <main className="content">
          <div key={pathname} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      <Overlays />
    </div>
  )
}

export default AppLayout
