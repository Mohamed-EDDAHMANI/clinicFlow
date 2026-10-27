import { apiFetch } from './client'

export const getAllUsers = () =>
  apiFetch('/user/getAll')

export const createUser = (payload) =>
  apiFetch('/user/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
