import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Navigate } from 'react-router'
import { logout } from '../features/authSlice'

// Dev helper: clears the auth state then redirects home.
const ResetRedux = () => {
  const dispatch = useDispatch()
  useEffect(() => { dispatch(logout()) }, [dispatch])
  return <Navigate to="/" />
}

export default ResetRedux
