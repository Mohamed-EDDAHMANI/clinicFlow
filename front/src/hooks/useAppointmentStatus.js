import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { updateAppointmentStatus } from '../api/appointmentService'
import { dataChanged } from '../features/refreshSlice'
import { useNotify } from './useNotify'

const STATUS_MESSAGES = {
  confirmed: 'Rendez-vous confirmé.',
  cancelled: 'Rendez-vous annulé, le créneau est libéré.',
}

export const useAppointmentStatus = (onUpdated) => {
  const notify = useNotify()
  const dispatch = useDispatch()
  const [busyIds, setBusyIds] = useState(() => new Set())

  const setBusy = (id, busy) =>
    setBusyIds((current) => {
      const next = new Set(current)
      if (busy) next.add(id)
      else next.delete(id)
      return next
    })

  const changeStatus = async (appointment, status) => {
    if (busyIds.has(appointment.id)) return

    setBusy(appointment.id, true)
    try {
      const updated = await updateAppointmentStatus(appointment.id, status)
      notify.success(STATUS_MESSAGES[status])
      dispatch(dataChanged())
      onUpdated?.(updated)
    } catch (error) {
      notify.error(error)
    } finally {
      setBusy(appointment.id, false)
    }
  }

  return { busyIds, changeStatus }
}
