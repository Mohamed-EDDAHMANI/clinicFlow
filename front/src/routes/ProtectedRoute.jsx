import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router'
import { getRole, getDashboardRoute } from './getDashboardRoute'

// Protected route. Not logged in => /login.
// If allowedRoles is set and the role is not included => back to their dashboard.
const ProtectedRoute = ({ allowedRoles }) => {
  const user = useSelector((state) => state.auth.user)
  const role = getRole(user)

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={getDashboardRoute(role)} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
