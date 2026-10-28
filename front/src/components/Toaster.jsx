import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { dismiss } from '../features/notificationsSlice'
import Icon from './Icon'

const DURATION_MS = 5000

const VARIANTS = {
  success: { icon: 'check_circle', className: 'text-secondary' },
  error: { icon: 'error', className: 'text-error' },
  info: { icon: 'info', className: 'text-primary' },
}

const Toast = ({ id, type, message }) => {
  const dispatch = useDispatch()
  const { icon, className } = VARIANTS[type]

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismiss(id)), DURATION_MS)
    return () => clearTimeout(timer)
  }, [dispatch, id])

  return (
    <li
      role={type === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto flex w-full items-start gap-3 rounded-xl bg-surface-container-lowest p-3 shadow-lg ring-1 ring-outline-variant/60 motion-safe:animate-[toast-in_200ms_ease-out]"
    >
      <Icon name={icon} filled className={`text-[20px] ${className}`} />
      <p className="flex-1 pt-px text-body-md text-on-surface">{message}</p>
      <button
        type="button"
        onClick={() => dispatch(dismiss(id))}
        aria-label="Fermer la notification"
        className="flex size-7 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Icon name="close" className="text-[18px]" />
      </button>
    </li>
  )
}

const Toaster = () => {
  const items = useSelector((state) => state.notifications.items)

  return (
    <ol
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:bottom-auto sm:top-20 sm:w-96"
    >
      {items.map((item) => (
        <Toast key={item.id} {...item} />
      ))}
    </ol>
  )
}

export default Toaster
