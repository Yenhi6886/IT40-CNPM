import { useEffect, useMemo, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import { publicApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { useLocation, useNavigate } from 'react-router-dom'
import Toast from '@/components/Toast'

function safeJsonArray(text) {
  try {
    const v = JSON.parse(text || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function safeJsonObject(text, fallback) {
  try {
    const v = JSON.parse(text || 'null')
    return v && typeof v === 'object' && !Array.isArray(v) ? v : fallback
  } catch {
    return fallback
  }
}

function LogoMark({ logoUrl, companyName }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={companyName || 'Logo'}
        className="h-10 w-10 rounded-md object-cover"
      />
    )
  }
  const letter = (companyName || 'S').trim().slice(0, 1).toUpperCase()
  return (
    <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
      {letter}
    </div>
  )
}

function renderJobDescription(value) {
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

function normalizeNavHref(href) {
  const raw = String(href || '').trim()
  if (!raw) return '/'
  if (raw.startsWith('#')) {
    const lower = raw.toLowerCase()
    if (lower === '#home') return '/'
    if (lower === '#careers') return '/careers'
    return `/${raw}`
  }
  return raw
}

function isItJob(job) {
  const explicit = String(job?.jobType || '').toUpperCase()
  if (explicit === 'IT') return true
  if (explicit === 'NON_IT' || explicit === 'NON-IT') return false

  const title = String(job?.title || '').toLowerCase()
  const itKeywords = [
    'developer',
    'devops',
    'qa',
    'tester',
    'engineer',
    'backend',
    'frontend',
    'fullstack',
    'mobile',
    'flutter',
    'react',
    'java',
    'node',
    'data',
    'security',
    'ui/ux',
    'ux',
    'ui',
    'product engineer',
    'sre',
  ]
  return itKeywords.some((k) => title.includes(k))
}

function paginate(items, page, pageSize) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    page: safePage,
    totalPages,
    items: items.slice(start, start + pageSize),
  }
}

export default function CareersPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [site, setSite] = useState(null)
  const [jobs, setJobs] = useState([])
  const [error, setError] = useState(null)
  const [itPage, setItPage] = useState(1)
  const [nonItPage, setNonItPage] = useState(1)
  const [regionOpen, setRegionOpen] = useState(false)
  const [regionValue, setRegionValue] = useState('')
  const [applyName, setApplyName] = useState('')
  const [applyEmail, setApplyEmail] = useState('')
  const [applyPhone, setApplyPhone] = useState('')
  const [applyJobId, setApplyJobId] = useState('')
  const [applyCvFile, setApplyCvFile] = useState(null)
  const [applySource, setApplySource] = useState('')
  const [toast, setToast] = useState({ open: false })
  const [selectedJobId, setSelectedJobId] = useState(null)
  const detailRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([publicApi.site(), publicApi.jobs()])
      .then(([s, j]) => {
        if (cancelled) return
        setSite(s)
        setJobs(j || [])
      })
      .catch((e) => {
        if (cancelled) return
        setError(e?.message || 'Failed to load')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search || '')
    const raw = params.get('jobId')
    const id = raw ? Number(raw) : null
    if (id && Number.isFinite(id)) setSelectedJobId(id)
  }, [location.search])

  useEffect(() => {
    if (!selectedJobId) return
    const t = setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    return () => clearTimeout(t)
  }, [selectedJobId])

  useEffect(() => {
    if (String(location?.hash || '') !== '#apply') return
    const t = setTimeout(() => {
      const el = document.getElementById('apply')
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => clearTimeout(t)
  }, [location?.hash])

  const selectedJob = useMemo(
    () => (selectedJobId ? (jobs || []).find((j) => Number(j?.id) === Number(selectedJobId)) : null),
    [jobs, selectedJobId],
  )

  const companyName = site?.companyName || 'Savytech'

  const itJobs = useMemo(() => (jobs || []).filter(isItJob), [jobs])
  const nonItJobs = useMemo(() => (jobs || []).filter((j) => !isItJob(j)), [jobs])

  const itPaged = useMemo(() => paginate(itJobs, itPage, 6), [itJobs, itPage])
  const nonItPaged = useMemo(() => paginate(nonItJobs, nonItPage, 6), [nonItJobs, nonItPage])

  useEffect(() => {
    function onDocClick(e) {
      const target = e.target
      if (!(target instanceof HTMLElement)) return
      if (target.closest?.('[data-region-dropdown]')) return
      setRegionOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  function JobCard({ job }) {
    return (
      <Link to={`/careers/${job.id}`} className="block rounded-xl border bg-white shadow-sm transition hover:shadow-md">
        <div className="flex items-stretch gap-4 p-5">
          <div className="flex shrink-0 items-center">
            <LogoMark logoUrl={site?.logoUrl} companyName={companyName} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-semibold text-[#1f6f9e]">{job.title}</div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {formatApplyRange(job) ? <div>🕒 {formatApplyRange(job)}</div> : null}
              {job.address ? <div>📍 {job.address}</div> : null}
              <div>💼 {job.salary || 'Thỏa thuận'}</div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  function Pagination({ page, totalPages, onChange }) {
    if (totalPages <= 1) return null
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    return (
      <div className="mt-8 flex items-center justify-center gap-2 text-sm">
        <button
          type="button"
          className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted/30 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          ‹
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`rounded-md px-3 py-1 ${p === page ? 'bg-primary/10 text-primary' : 'hover:bg-muted/30'}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted/30 disabled:opacity-40"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          ›
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toast toast={toast} onClose={() => setToast({ open: false })} />
      <SiteHeader site={site} />

      <main>
        {/* Hero giống trang chủ */}
        <section
          className="relative"
          style={
            site?.careersHeroBackgroundUrl
              ? {
                  backgroundImage: `url(${site?.careersHeroBackgroundUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-background" />
          <div className="relative mx-auto flex min-h-[calc(100vh-56px)] max-w-6xl items-center px-4 py-10 md:min-h-[calc(100vh-64px)]">
            <div className="mx-auto max-w-3xl text-center text-white">
              {site?.careersHeroTitle ? (
                <h1 className="text-balance text-5xl font-bold tracking-tight md:text-7xl">
                  {site?.careersHeroTitle}
                </h1>
              ) : null}
              {site?.careersHeroSubtitle ? (
                <p className="mt-4 text-balance text-lg text-white/80 md:text-xl">
                  <span
                    className="block"
                    dangerouslySetInnerHTML={{
                      __html: renderRichHtml(site?.careersHeroSubtitle),
                    }}
                  />
                </p>
              ) : null}
          
         
              <div className="mx-auto mt-8 flex max-w-3xl items-center gap-3 rounded-full bg-white/95 p-3 shadow-lg">
                <div className="flex flex-1 items-center gap-2 px-4 text-sm text-muted-foreground">
                  <span className="hidden sm:inline">Công việc:</span>
                  <input
                    className="w-full bg-transparent text-foreground outline-none"
                    placeholder="Tìm công việc"
                    aria-label="Tìm công việc"
                  />
                </div>
                <div className="h-8 w-px bg-border/70" />
                <div className="relative flex flex-1 items-center gap-2 px-4 text-sm text-muted-foreground" data-region-dropdown>
                  <span className="hidden sm:inline">Khu vực:</span>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 bg-transparent text-left text-foreground outline-none"
                    onClick={() => setRegionOpen((v) => !v)}
                    aria-label="Chọn khu vực"
                  >
                    <span className={`${regionValue ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {regionValue || 'Tìm theo khu vực'}
                    </span>
                    <span className="text-muted-foreground">▾</span>
                  </button>
                  {regionOpen ? (
                    <div
                      className="absolute left-0 top-[calc(100%+10px)] z-50 w-full max-h-80 overflow-y-auto overscroll-contain rounded-xl border bg-white shadow-xl"
                      style={{ maxHeight: 'min(22rem, calc(100vh - 180px))' }}
                      onWheelCapture={(e) => e.stopPropagation()}
                    >
                      {['Hà Nội', 'TP HCM', 'Hải Phòng', 'Tokyo', 'Osaka', 'Đà Nẵng'].map((x) => (
                        <button
                          key={x}
                          type="button"
                          className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-muted/40"
                          onClick={() => {
                            setRegionValue(x)
                            setRegionOpen(false)
                          }}
                        >
                          {x}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <Button className="h-11 w-11 rounded-full p-0" aria-label="Search">
                  🔍
                </Button>
              </div>

              {error ? <p className="mt-4 text-sm text-red-200">Lỗi: {error}</p> : null}
            </div>
          </div>
        </section>

        {selectedJob ? (
          <section ref={detailRef} className="border-t bg-white">
            <div className="mx-auto max-w-6xl px-4 py-10">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-2xl font-bold">{selectedJob.title}</div>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {formatApplyRange(selectedJob) ? <span>🕒 {formatApplyRange(selectedJob)}</span> : null}
                    {selectedJob.address ? <span>📍 {selectedJob.address}</span> : null}
                    <span>💼 {selectedJob.salary || 'Thỏa thuận'}</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedJobId(null)
                    navigate('/careers', { replace: true })
                  }}
                >
                  Đóng
                </Button>
              </div>

              {selectedJob.description ? (
                <div
                  className="ql-editor job-rich-content mt-6"
                  dangerouslySetInnerHTML={{ __html: renderJobDescription(selectedJob.description) }}
                />
              ) : (
                <div className="mt-4 text-sm text-muted-foreground">Chưa có mô tả.</div>
              )}
            </div>
          </section>
        ) : null}

        {/* Vị trí IT */}
        <section id="jobs" className="border-t bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-center text-4xl font-extrabold tracking-tight">
              <span className="text-foreground">VỊ TRÍ</span> <span className="text-primary">IT</span>
            </h2>

            {itJobs.length ? (
              <>
                <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {itPaged.items.map((j) => (
                    <JobCard key={j.id} job={j} />
                  ))}
                </div>
                <Pagination page={itPaged.page} totalPages={itPaged.totalPages} onChange={setItPage} />
              </>
            ) : (
              <div className="mt-8 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                Chưa có job IT.
              </div>
            )}
          </div>
        </section>

        {/* Vị trí Non-IT */}
        <section className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-center text-4xl font-extrabold tracking-tight">
              <span className="text-foreground">VỊ TRÍ</span> <span className="text-primary">NON-IT</span>
            </h2>

            {nonItJobs.length ? (
              <>
                <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {nonItPaged.items.map((j) => (
                    <JobCard key={j.id} job={j} />
                  ))}
                </div>
                <Pagination page={nonItPaged.page} totalPages={nonItPaged.totalPages} onChange={setNonItPage} />
              </>
            ) : (
              <div className="mt-8 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                Chưa có job Non-IT.
              </div>
            )}
          </div>
        </section>

        {/* Ứng tuyển ngay */}
        <section id="apply" className="border-t bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-center text-4xl font-extrabold tracking-tight">
              <span className="text-primary">Ứng</span> tuyển ngay
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border bg-muted/20">
                {site?.heroBackgroundUrl ? (
                  <img src={site.heroBackgroundUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid aspect-[4/3] place-items-center text-sm text-muted-foreground">
                    Ảnh (admin thêm ở Hero)
                  </div>
                )}
              </div>

              <form
                className="rounded-2xl border bg-white p-6 shadow-sm"
                onSubmit={async (e) => {
                  e.preventDefault()
                  try {
                    if (!applyCvFile) throw new Error('Vui lòng chọn CV')
                    if (!applyJobId) throw new Error('Vui lòng chọn vị trí')
                    const form = new FormData()
                    form.append('jobId', String(applyJobId))
                    form.append('fullName', applyName)
                    form.append('email', applyEmail)
                    form.append('phone', applyPhone)
                    if (applySource) form.append('source', applySource)
                    form.append('cv', applyCvFile)
                    await publicApi.apply(form)
                    setToast({
                      open: true,
                      type: 'success',
                      title: 'Gửi ứng tuyển thành công',
                      message: 'CV của bạn đã được gửi. Chúng tôi sẽ liên hệ sớm nhất.',
                    })
                    setApplyName('')
                    setApplyEmail('')
                    setApplyPhone('')
                    setApplyJobId('')
                    setApplyCvFile(null)
                    setApplySource('')
                  } catch (err) {
                    setToast({
                      open: true,
                      type: 'error',
                      title: 'Gửi ứng tuyển thất bại',
                      message: String(err?.message || 'Vui lòng thử lại.'),
                    })
                  }
                }}
              >
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium">Họ và tên *</div>
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      value={applyName}
                      onChange={(e) => setApplyName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Email *</div>
                    <input
                      type="email"
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      value={applyEmail}
                      onChange={(e) => setApplyEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Số điện thoại *</div>
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      value={applyPhone}
                      onChange={(e) => setApplyPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Vị trí *</div>
                    <select
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      value={applyJobId}
                      onChange={(e) => setApplyJobId(e.target.value)}
                      required
                    >
                      <option value="">Chọn vị trí</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={String(j.id)}>
                          {j.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-sm font-medium">CV ứng tuyển *</div>
                    <div className="mt-1 rounded-md border bg-muted/10 p-4 text-center">
                      <div className="text-sm text-muted-foreground">
                        Kéo thả hoặc tải lên CV của bạn
                      </div>
                      <div className="mt-3">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setApplyCvFile(e.target.files?.[0] || null)}
                          required
                        />
                        {applyCvFile ? (
                          <div className="mt-2 text-xs text-muted-foreground">{applyCvFile.name}</div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Bạn biết đến thông tin tuyển dụng qua đâu?</div>
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      value={applySource}
                      onChange={(e) => setApplySource(e.target.value)}
                      placeholder="Facebook, LinkedIn, bạn bè..."
                    />
                  </div>

                  <Button type="submit" className="w-full bg-primary">
                    Gửi ứng tuyển
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>

      </main>

      <SiteFooter site={site} />
    </div>
  )
}

