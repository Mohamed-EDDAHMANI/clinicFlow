// The home route depending on the user's role.
export const getDashboardRoute = (role) => {
  if (role === 'admin') return '/dashboard'
  if (role === 'user') return '/home'
  return '/'
}

export const getRole = (user) => {
  if (!user?.role) return null
  return user.role.toLowerCase()
}
