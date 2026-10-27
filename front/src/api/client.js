import { store } from '../app/store'
import { setUser, logout } from '../features/authSlice'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Build the request: headers + credentials, access token only on protected routes.
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

// Call /auth/refresh to get a fresh access token + user (uses the refresh cookie).
// The refresh token is single-use, so parallel calls share the same request.
let refreshPromise = null

function refreshSession() {
  refreshPromise ??= fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then(async (res) => {
      if (!res.ok) {
        store.dispatch(logout())
        throw new Error('Session expired')
      }

      const data = await res.json()
      store.dispatch(setUser(data))
      return data
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

// auth = true (default): protected route => attach token, refresh on 401.
// auth = false: public route (login/register/refresh) => no token, no refresh.
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
