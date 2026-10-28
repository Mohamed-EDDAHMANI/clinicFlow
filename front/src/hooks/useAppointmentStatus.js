import { useState } from 'react'
import { updateAppointmentStatus } from '../api/appointmentService'
import { useNotify } from './useNotify'

const STATUS_MESSAGES = {
  confirmed: 'Rendez-vous confirmé.',
  cancelled: 'Rendez-vous annulé, le créneau est libéré.',
}

export const useAppointmentStatus = (onUpdated) => {
  const notify = useNotify()
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
      onUpdated(updated)
      notify.success(STATUS_MESSAGES[status])
    } catch (error) {
      notify.error(error)
    } finally {
      setBusy(appointment.id, false)
    }
  }

  return { busyIds, changeStatus }
}
