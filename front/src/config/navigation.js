import { CalendarDays, LayoutGrid, Users } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/dashboard', label: "Vue d'ensemble", icon: LayoutGrid },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/appointments', label: 'Rendez-vous', icon: CalendarDays, badge: 'today' },
]
