import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router'
import { getRole, getDashboardRoute } from './getDashboardRoute'

const PublicRoute = () => {
  const user = useSelector((state) => state.auth.user)
  const home = getDashboardRoute(getRole(user))

  if (user && home !== '/login') return <Navigate to={home} replace />

  return <Outlet />
}

export default PublicRoute
