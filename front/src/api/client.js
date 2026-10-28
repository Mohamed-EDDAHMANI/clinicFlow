import { store } from '../app/store'
import { setUser, logout } from '../features/authSlice'
import { networkError, toApiError } from './apiError'

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

async function send(url, init) {
  try {
    return await fetch(url, init)
  } catch {
    throw networkError()
  }
}

async function readBody(res) {
  const text = await res.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

let refreshPromise = null

function refreshSession() {
  refreshPromise ??= send(`${BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then(async (res) => {
      const body = await readBody(res)

      if (!res.ok) {
        store.dispatch(logout())
        throw toApiError(401, body)
      }

      store.dispatch(setUser(body.data))
      return body.data
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export async function apiFetch(path, { auth = true, ...options } = {}) {
  let res = await send(`${BASE_URL}${path}`, buildRequest({ auth, ...options }))

  if (auth && res.status === 401) {
    await refreshSession()
    res = await send(`${BASE_URL}${path}`, buildRequest({ auth, ...options }))
  }

  const body = await readBody(res)
  if (!res.ok) throw toApiError(res.status, body)
  return body
}
