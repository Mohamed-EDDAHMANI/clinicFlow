export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Tableau de bord', shortLabel: 'Accueil', icon: 'dashboard' },
  { to: '/patients', label: 'Patients', shortLabel: 'Patients', icon: 'group' },
  { to: '/appointments', label: 'Rendez-vous', shortLabel: 'RDV', icon: 'calendar_month' },
]

export const hasAppNavigation = (pathname) => NAV_ITEMS.some((item) => pathname.startsWith(item.to))
