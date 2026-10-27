import { store } from '../app/store'
import { setUser, logout } from '../features/authSlice'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

function buildRequest({ auth, ...options }) {
  const accessToken = store.getState().auth.accessToken
  const withToken = auth && accessToken

  return {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(withToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  }
}

let refreshPromise = null

function refreshSession() {
  refreshPromise ??= fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then(async (res) => {
      if (!res.ok) {
        store.dispatch(logout())
        throw new Error('Session expired')
      }

      const { data } = await res.json()
      store.dispatch(setUser(data))
      return data
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export async function apiFetch(path, { auth = true, ...options } = {}) {
  let res = await fetch(`${BASE_URL}${path}`, buildRequest({ auth, ...options }))

  if (auth && res.status === 401) {
    await refreshSession()
    res = await fetch(`${BASE_URL}${path}`, buildRequest({ auth, ...options }))
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}
