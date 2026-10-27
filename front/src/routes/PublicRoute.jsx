import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router'
import { getRole, getDashboardRoute } from './getDashboardRoute'

const PublicRoute = () => {
  const user = useSelector((state) => state.auth.user)
  const role = getRole(user)

  if (user) return <Navigate to={getDashboardRoute(role)} replace />

  return <Outlet />
}

export default PublicRoute
