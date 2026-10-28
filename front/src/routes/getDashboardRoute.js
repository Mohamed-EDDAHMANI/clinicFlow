import { ROLES } from '../config/roles'

export const getDashboardRoute = (role) =>
  Object.values(ROLES).includes(role) ? '/dashboard' : '/login'

export const getRole = (user) => {
  if (!user?.role) return null
  return user.role.toLowerCase()
}
