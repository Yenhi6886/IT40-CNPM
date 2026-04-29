import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { adminApi } from '@/lib/api'
import { getToken, setToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'

function renderRichHtml(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  const html = /<\/?[a-z][\s\S]*>/i.test(text)
    ? text
    : text
        .split(/\n{2,}/)
        .map((block) => `<p>${block.replace(/\n/g, '<br />')}</p>`)
        .join('')
  return DOMPurify.sanitize(html)
}

function formatApplyRange(job) {
  const s = String(job?.applyStartDate || '').trim()
  const e = String(job?.applyEndDate || '').trim()
  if (!s && !e) return ''
  if (s && e) return `${s.replaceAll('-', '/')} - ${e.replaceAll('-', '/')}`
  return (s || e).replaceAll('-', '/')
}

export default function AdminJobDetailPage() {
  const { id } = useParams()
  const jobId = Number(id)
  const nav = useNavigate()
  const token = useMemo(() => getToken(), [])
  const [site, setSite] = useState(null)
  const [job, setJob] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) nav('/admin/login', { replace: true })
  }, [token, nav])

  useEffect(() => {
    let cancelled = false
    setError(null)
    Promise.all([
      adminApi.site(token),
      Number.isFinite(jobId) ? adminApi.job(token, jobId) : Promise.reject(new Error('Job not found')),
    ])
      .then(([s, j]) => {
        if (cancelled) return
        setSite(s)
        setJob(j)
      })
      .catch((e) => {
        if (cancelled) return
        const msg = e?.message || 'Failed to load'
        setError(msg)
        if (String(msg).toLowerCase().includes('401')) {
          setToken('')
          nav('/admin/login', { replace: true })
        }
      })
    return () => {
      cancelled = true
    }
  }, [token, jobId, nav])

  const companyName = site?.companyName || 'Savytech'
  const descriptionHtml = useMemo(() => renderRichHtml(job?.description), [job?.description])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <div className="text-sm text-muted-foreground">Admin</div>
            <div className="text-lg font-semibold">{companyName}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin/jobs">Quay lại</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 text-sm text-muted-foreground">
          Admin / Tuyển dụng / <span className="text-foreground">{job?.title || 'Chi tiết'}</span>
        </div>
        {error ? (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {job ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
            <div className="rounded-2xl border bg-white p-6">
              {descriptionHtml ? (
                <div className="ql-editor job-rich-content p-0" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
              ) : (
                <div className="text-sm text-muted-foreground">Chưa có mô tả.</div>
              )}
            </div>

            <aside className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-center rounded-xl bg-muted/20 p-6">
                {site?.logoUrl ? (
                  <img src={site.logoUrl} alt={companyName} className="h-20 object-contain" />
                ) : (
                  <div className="text-2xl font-bold text-primary">{companyName}</div>
                )}
              </div>

              <div className="mt-6 text-lg font-semibold">{job.title}</div>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                {formatApplyRange(job) ? <div>🕒 {formatApplyRange(job)}</div> : null}
                {job.address ? <div>📍 {job.address}</div> : null}
                <div>💼 {job.salary || 'Thỏa thuận'}</div>
                <div>👁 {job.published ? 'Published' : 'Draft'}</div>
              </div>

              <Button variant="outline" className="mt-6 w-full" asChild>
                <a href={`/careers/${job.id}`} target="_blank" rel="noreferrer">
                  Xem trên giao diện người dùng
                </a>
              </Button>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  )
}

