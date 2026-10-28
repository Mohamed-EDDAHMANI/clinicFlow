export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Tableau de bord', shortLabel: 'Accueil', icon: 'dashboard' },
  { to: '/patients', label: 'Patients', shortLabel: 'Patients', icon: 'group' },
]

export const hasAppNavigation = (pathname) => NAV_ITEMS.some((item) => pathname.startsWith(item.to))
