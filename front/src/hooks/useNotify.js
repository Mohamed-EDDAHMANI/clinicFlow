import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { notify } from '../features/notificationsSlice'
import { errorMessage } from '../api/apiError'

export const useNotify = () => {
  const dispatch = useDispatch()

  return useMemo(() => ({
    success: (message) => dispatch(notify({ type: 'success', message })),
    info: (message) => dispatch(notify({ type: 'info', message })),
    error: (errorOrMessage) =>
      dispatch(notify({
        type: 'error',
        message: typeof errorOrMessage === 'string' ? errorOrMessage : errorMessage(errorOrMessage),
      })),
  }), [dispatch])
}
