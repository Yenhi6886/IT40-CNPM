const KEY = 'it40_admin_token'
const ROLE_KEY = 'it40_admin_role'

export function getToken() {
  return localStorage.getItem(KEY) || ''
}

function decodeJwtPayload(token) {
  try {
    const part = String(token || '').split('.')[1]
    if (!part) return null
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

export function getRole() {
  const payload = decodeJwtPayload(getToken())
  const fromJwt = payload?.role != null ? String(payload.role).trim() : ''
  const stored = localStorage.getItem(ROLE_KEY) || ''
  /** JWT là nguồn đúng; tránh UI HR + token DESIGN → 403 */
  if (fromJwt && fromJwt !== stored) {
    localStorage.setItem(ROLE_KEY, fromJwt)
  }
  return fromJwt || stored
}

/** ADMIN (JWT/DB cũ) hiển thị như DESIGN. */
export function normalizeAdminRole(role) {
  const r = String(role || '').toUpperCase()
  if (r === 'HR') return 'HR'
  if (r === 'DESIGN' || r === 'ADMIN') return 'DESIGN'
  return 'DESIGN'
}

export function setRole(role) {
  if (!role) localStorage.removeItem(ROLE_KEY)
  else localStorage.setItem(ROLE_KEY, role)
}

export function setToken(token) {
  if (!token) {
    localStorage.removeItem(KEY)
    localStorage.removeItem(ROLE_KEY)
  } else {
    localStorage.setItem(KEY, token)
    const r = decodeJwtPayload(token)?.role
    if (r) localStorage.setItem(ROLE_KEY, String(r))
  }
}

