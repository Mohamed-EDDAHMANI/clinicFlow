import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router'
import { getRole, getDashboardRoute } from './getDashboardRoute'

// Public route (landing/login/register). Already logged in => back to dashboard.
const PublicRoute = () => {
  const user = useSelector((state) => state.auth.user)
  const role = getRole(user)

  if (user) return <Navigate to={getDashboardRoute(role)} replace />

  return <Outlet />
}

export default PublicRoute
