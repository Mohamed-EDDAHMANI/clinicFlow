import { apiFetch } from './client'

export const getAppointments = async ({ date, status } = {}) => {
  const params = new URLSearchParams()
  if (date) params.set('date', date)
  if (status) params.set('status', status)

  const query = params.toString()
  return (await apiFetch(`/appointments${query ? `?${query}` : ''}`)).data
}

export const createAppointment = async (appointment) =>
  (await apiFetch('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointment),
  })).data

export const updateAppointmentStatus =async (id, status) =>
  (await apiFetch(`/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })).data
