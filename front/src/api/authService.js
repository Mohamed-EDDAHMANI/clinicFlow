import { apiFetch } from './client'

// Public routes => auth: false (no access token, no refresh on 401).
export const login = (email, password) =>
  apiFetch('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  })

export const register = (payload) =>
  apiFetch('/auth/register', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(payload),
  })

export const refresh = () =>
  apiFetch('/auth/refresh', { method: 'POST', auth: false })

// Protected route => auth: true (default).
export const logout = () =>
  apiFetch('/auth/logout', { method: 'POST' })
