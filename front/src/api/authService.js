import { apiFetch } from './client'

export const login = (email, password) =>
  apiFetch('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  })

export const logout = () =>
  apiFetch('/auth/logout', { method: 'POST', auth: false })
