import { apiFetch } from './client'

export const getPatients = async ({ search, page, limit } = {}) => {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (page) params.set('page', page)
  if (limit) params.set('limit', limit)

  const query = params.toString()
  const { data, meta } = await apiFetch(`/patients${query ? `?${query}` : ''}`)
  return { patients: data, meta }
}

export const getPatient = async (id) => (await apiFetch(`/patients/${id}`)).data

export const createPatient = async (patient) =>
  (await apiFetch('/patients', {
    method: 'POST',
    body: JSON.stringify(patient),
  })).data

export const updatePatient = async (id, patient) =>
  (await apiFetch(`/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patient),
  })).data

export const deletePatient = async (id) => {
  await apiFetch(`/patients/${id}`, { method: 'DELETE' })
}
