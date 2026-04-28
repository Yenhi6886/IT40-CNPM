const KEY = 'it40_admin_token'

export function getToken() {
  return localStorage.getItem(KEY) || ''
}

export function setToken(token) {
  if (!token) localStorage.removeItem(KEY)
  else localStorage.setItem(KEY, token)
}

