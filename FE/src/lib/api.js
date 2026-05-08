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

async function upload(path, { token, file } = {}) {
  if (!file) throw new Error('No file selected')
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(path, { method: 'POST', headers, body: form })
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

async function uploadForm(path, { token, form } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(path, { method: 'POST', headers, body: form })
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

async function downloadBlob(path, { token } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(path, { method: 'GET', headers })
  if (!res.ok) {
    const isJson = (res.headers.get('content-type') || '').includes('application/json')
    const payload = isJson ? await res.json().catch(() => null) : await res.text()
    const message =
      (payload && typeof payload === 'object' && payload.message) ||
      (typeof payload === 'string' ? payload : null) ||
      `Request failed (${res.status})`
    throw new Error(message)
  }
  const blob = await res.blob()
  const disposition = res.headers.get('content-disposition') || ''
  const match = disposition.match(/filename=\"?([^\";]+)\"?/i)
  const filename = match?.[1] || 'cv'
  return { blob, filename }
}

export const publicApi = {
  site: () => request('/api/public/site'),
  jobs: () => request('/api/public/jobs'),
  job: (id) => request(`/api/public/jobs/${id}`),
  apply: (form) => uploadForm('/api/public/apply', { form }),
}

export const authApi = {
  login: (username, password) =>
    request('/api/auth/login', { method: 'POST', body: { username, password } }),
}

export const adminApi = {
  site: (token) => request('/api/admin/site', { token }),
  upsertSite: (token, dto) => request('/api/admin/site', { method: 'PUT', token, body: dto }),
  uploadImage: (token, file) => upload('/api/admin/upload', { token, file }),
  jobs: (token) => request('/api/admin/jobs', { token }),
  job: (token, id) => request(`/api/admin/jobs/${id}`, { token }),
  createJob: (token, dto) => request('/api/admin/jobs', { method: 'POST', token, body: dto }),
  updateJob: (token, id, dto) =>
    request(`/api/admin/jobs/${id}`, { method: 'PUT', token, body: dto }),
  deleteJob: (token, id) => request(`/api/admin/jobs/${id}`, { method: 'DELETE', token }),
  cvs: (token) => request('/api/admin/cv', { token }),
  cv: (token, id) => request(`/api/admin/cv/${id}`, { token }),
  updateCvStatus: (token, id, status) =>
    request(`/api/admin/cv/${id}/status`, { method: 'PUT', token, body: { status } }),
  cvDownloadUrl: (id) => `/api/admin/cv/${id}/download`,
  downloadCv: (token, id) => downloadBlob(`/api/admin/cv/${id}/download`, { token }),
}

