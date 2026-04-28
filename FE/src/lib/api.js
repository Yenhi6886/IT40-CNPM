async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(path, {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body),
  })
  const isJson = (res.headers.get('content-type') || '').includes('application/json')
  const payload = isJson ? await res.json().catch(() => null) : await res.text()
  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && payload.message) ||
      (typeof payload === 'string' ? payload : null) ||
      `Request failed (${res.status})`
    throw new Error(message)
  }
  return payload
}

export const publicApi = {
  site: () => request('/api/public/site'),
  jobs: () => request('/api/public/jobs'),
}

export const authApi = {
  login: (username, password) =>
    request('/api/auth/login', { method: 'POST', body: { username, password } }),
}

export const adminApi = {
  site: (token) => request('/api/admin/site', { token }),
  upsertSite: (token, dto) => request('/api/admin/site', { method: 'PUT', token, body: dto }),
  jobs: (token) => request('/api/admin/jobs', { token }),
  createJob: (token, dto) => request('/api/admin/jobs', { method: 'POST', token, body: dto }),
  updateJob: (token, id, dto) =>
    request(`/api/admin/jobs/${id}`, { method: 'PUT', token, body: dto }),
  deleteJob: (token, id) => request(`/api/admin/jobs/${id}`, { method: 'DELETE', token }),
}

