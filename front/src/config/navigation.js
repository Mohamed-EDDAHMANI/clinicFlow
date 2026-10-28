export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Tableau de bord', shortLabel: 'Accueil', icon: 'dashboard' },
]

export const hasAppNavigation = (pathname) => NAV_ITEMS.some((item) => pathname.startsWith(item.to))
