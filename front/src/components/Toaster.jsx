import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { dismiss } from '../features/notificationsSlice'

const DURATION_MS = 4500

const ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
}

const Toast = ({ id, type, message }) => {
  const dispatch = useDispatch()
  const ToastIcon = ICONS[type]

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismiss(id)), DURATION_MS)
    return () => clearTimeout(timer)
  }, [dispatch, id])

  return (
    <li role={type === 'error' ? 'alert' : 'status'} className={`toast ${type}`}>
      <ToastIcon aria-hidden="true" className="t-icn" />
      <p>{message}</p>
      <button type="button" onClick={() => dispatch(dismiss(id))} aria-label="Fermer la notification">
        <X aria-hidden="true" />
      </button>
    </li>
  )
}

const Toaster = () => {
  const items = useSelector((state) => state.notifications.items)

  return (
    <ol aria-live="polite" className="toasts">
      {items.map((item) => (
        <Toast key={item.id} {...item} />
      ))}
    </ol>
  )
}

export default Toaster
