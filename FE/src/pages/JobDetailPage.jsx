import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { publicApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import Toast from '@/components/Toast'
import { BriefcaseBusiness, CalendarDays, CircleDollarSign, Clock, MapPin, Users } from 'lucide-react'

const JOB_INFO_TITLE = '#002b5c'
const JOB_INFO_LABEL = '#6c757d'
const JOB_INFO_VALUE = '#212529'
const JOB_INFO_BORDER = '#e0e0e0'

const WORK_ARRANGEMENT_LABELS = {
  ALL: 'Tất cả',
  FULL_TIME: 'Toàn thời gian',
  PART_TIME: 'Bán thời gian',
  INTERN: 'Thực tập',
  COLLABORATOR: 'Cộng tác viên',
}

function workArrangementLabel(code) {
  const k = String(code || '').toUpperCase()
  return WORK_ARRANGEMENT_LABELS[k] || '—'
}

function formatCvDeadline(iso) {
  const s = String(iso || '').trim()
  if (!s) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  return s.replaceAll('-', '/')
}

/** Gợi ý địa điểm hiển thị ngắn (vd. lấy phần sau cùng sau dấu phẩy). */
function shortLocation(address) {
  const s = String(address || '').trim()
  if (!s) return '—'
  const parts = s.split(',').map((x) => x.trim()).filter(Boolean)
  if (parts.length >= 2) return parts[parts.length - 1]
  return s.length > 48 ? `${s.slice(0, 45)}…` : s
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

function isValidPhone(phone) {
  return /^[0-9+()\-\s]{8,20}$/.test(String(phone || '').trim())
}

function isValidCvFile(file) {
  if (!file) return false
  const name = String(file.name || '').toLowerCase()
  return name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.docx')
}

export default function JobDetailPage() {
  const { id } = useParams()
  const jobId = Number(id)
  const [site, setSite] = useState(null)
  const [job, setJob] = useState(null)
  const [publicJobs, setPublicJobs] = useState([])
  const [error, setError] = useState(null)

  const [applyName, setApplyName] = useState('')
  const [applyEmail, setApplyEmail] = useState('')
  const [applyPhone, setApplyPhone] = useState('')
  const [applyCvFile, setApplyCvFile] = useState(null)
  const [applySource, setApplySource] = useState('')
  const [toast, setToast] = useState({ open: false })

  useEffect(() => {
    let cancelled = false
    setError(null)
    Promise.all([
      publicApi.site(),
      Number.isFinite(jobId) ? publicApi.job(jobId) : Promise.reject(new Error('Job not found')),
    ])
      .then(([s, j]) => {
        if (cancelled) return
        setSite(s)
        setJob(j)
        publicApi
          .jobs()
          .then((list) => {
            if (cancelled) return
            setPublicJobs(Array.isArray(list) ? list : [])
          })
          .catch(() => {
            if (!cancelled) setPublicJobs([])
          })
      })
      .catch((e) => {
        if (cancelled) return
        setError(e?.message || 'Failed to load')
      })
    return () => {
      cancelled = true
    }
  }, [jobId])

  const companyName = site?.companyName || 'Savytech'

  const descriptionHtml = useMemo(() => renderRichHtml(job?.description), [job?.description])

  const relatedJobs = useMemo(() => {
    if (!job?.id || !publicJobs.length) return []
    const currentId = Number(job.id)
    const myType = String(job.jobType || 'IT').toUpperCase()
    const others = publicJobs.filter((x) => Number(x?.id) !== currentId)
    const sameType = others.filter((x) => String(x?.jobType || 'IT').toUpperCase() === myType)
    const pool = sameType.length >= 2 ? sameType : others
    return pool.slice(0, 5)
  }, [job, publicJobs])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toast toast={toast} onClose={() => setToast({ open: false })} />
      <SiteHeader site={site} />

      <main>
        <section className="border-b border-border/60 bg-muted/10">
          <div className="mx-auto max-w-6xl px-4 py-2">
            <nav className="text-xs text-muted-foreground md:text-sm">
              <Link className="transition-colors hover:text-primary" to="/careers">
                Cơ hội nghề nghiệp
              </Link>
            </nav>
            {error ? <div className="mt-2 text-sm text-destructive">Lỗi: {error}</div> : null}
          </div>
        </section>

        {job ? (
          <section className="border-b border-border/60 bg-white">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:py-5">
              <h1 className="text-balance text-xl font-bold tracking-tight text-foreground md:text-2xl">
                {job.title}
              </h1>
              <Button asChild variant="outline" className="shrink-0">
                <a href="#apply">Ứng tuyển ngay</a>
              </Button>
            </div>
          </section>
        ) : null}

        {job ? (
          <section className="bg-white">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 lg:grid-cols-[1fr_360px]">
              <div className="rounded-2xl border bg-white p-6">
                <div
                  className="mb-8 overflow-hidden rounded-lg bg-white"
                  style={{ border: `1px solid ${JOB_INFO_BORDER}` }}
                >
                  <div className="px-6 pb-4 pt-6">
                    <h2
                      className="text-base font-bold tracking-tight"
                      style={{ color: JOB_INFO_TITLE }}
                    >
                      Thông tin công việc
                    </h2>
                  </div>
                  <div className="border-t" style={{ borderColor: JOB_INFO_BORDER }} />
                  <div className="grid grid-cols-1 gap-x-10 gap-y-8 px-6 py-6 sm:grid-cols-2">
                    {[
                      {
                        icon: Users,
                        label: 'Số lượng tuyển',
                        value:
                          job.recruitmentHeadcount != null && job.recruitmentHeadcount !== ''
                            ? String(job.recruitmentHeadcount)
                            : '—',
                      },
                      {
                        icon: CircleDollarSign,
                        label: 'Mức lương',
                        value: job.salary?.trim() ? job.salary : '—',
                      },
                      {
                        icon: BriefcaseBusiness,
                        label: 'Loại hình',
                        value: workArrangementLabel(job.workArrangement),
                      },
                      {
                        icon: MapPin,
                        label: 'Địa điểm',
                        value: job.address?.trim() ? shortLocation(job.address) : '—',
                      },
                      {
                        icon: CalendarDays,
                        label: 'Hạn nộp CV',
                        value: formatCvDeadline(job.applyEndDate),
                      },
                    ].map((row) => {
                      const RowIcon = row.icon
                      return (
                        <div key={row.label} className="flex gap-3">
                          <RowIcon
                            className="mt-0.5 h-5 w-5 shrink-0 opacity-70"
                            style={{ color: JOB_INFO_LABEL }}
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm leading-snug" style={{ color: JOB_INFO_LABEL }}>
                              {row.label}
                            </div>
                            <div
                              className="mt-1.5 text-sm font-semibold leading-snug"
                              style={{ color: JOB_INFO_VALUE }}
                            >
                              {row.value}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {descriptionHtml ? (
                  <div className="ql-editor job-rich-content p-0" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
                ) : (
                  <div className="text-sm text-muted-foreground">Chưa có mô tả.</div>
                )}
              </div>

              <aside className="space-y-6">
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-center rounded-xl bg-muted/20 p-6">
                    {site?.logoUrl ? (
                      <img src={site.logoUrl} alt={companyName} className="h-20 object-contain" />
                    ) : (
                      <div className="text-2xl font-bold text-primary">{companyName}</div>
                    )}
                  </div>

                  <div className="mt-6 text-lg font-semibold">{job.title}</div>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {formatApplyRange(job) ? (
                      <div className="flex items-start gap-2">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
                        <span>{formatApplyRange(job)}</span>
                      </div>
                    ) : null}
                    {job.address ? (
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
                        <span className="min-w-0">{job.address}</span>
                      </div>
                    ) : null}
                    <div className="flex items-start gap-2">
                      <CircleDollarSign className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
                      <span>{job.salary || 'Thỏa thuận'}</span>
                    </div>
                  </div>

                  <Button asChild className="mt-6 w-full bg-primary">
                    <a href="#apply">Ứng tuyển ngay</a>
                  </Button>
                </div>

                {relatedJobs.length ? (
                  <div className="rounded-2xl border border-border/80 bg-white shadow-sm">
                    <div className="border-b border-border/70 px-5 py-4">
                      <h2 className="text-base font-bold text-primary">Công việc liên quan</h2>
                    </div>
                    <ul className="divide-y divide-border/60 px-2 py-2">
                      {relatedJobs.map((rj) => (
                        <li key={rj.id} className="list-none">
                          <Link
                            to={`/careers/${rj.id}`}
                            className="group block cursor-pointer rounded-xl px-3 py-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                          >
                            <div className="line-clamp-2 text-sm font-bold leading-snug text-primary group-hover:underline">
                              {rj.title}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                                {workArrangementLabel(rj.workArrangement)}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                                {shortLocation(rj.address)}
                              </span>
                            </div>
                            <div className="mt-3 flex items-start justify-between gap-3">
                              <span className="text-sm font-semibold text-primary">
                                {rj.salary?.trim() ? rj.salary : 'Lương thỏa thuận'}
                              </span>
                              <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                                <span>Thời hạn: {formatCvDeadline(rj.applyEndDate)}</span>
                              </span>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </aside>
            </div>
          </section>
        ) : null}

        <section id="apply" className="border-t bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-center text-4xl font-extrabold tracking-tight">
              <span className="text-primary">Ứng</span> tuyển ngay
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border bg-muted/20">
                {site?.careersHeroBackgroundUrl ? (
                  <img src={site.careersHeroBackgroundUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid aspect-[4/3] place-items-center text-sm text-muted-foreground">
                    Ảnh (admin upload)
                  </div>
                )}
              </div>

              <form
                className="rounded-2xl border bg-white p-6 shadow-sm"
                onSubmit={async (e) => {
                  e.preventDefault()
                  try {
                    if (!applyName.trim()) throw new Error('Vui lòng nhập họ và tên')
                    if (!isValidEmail(applyEmail)) throw new Error('Email không hợp lệ')
                    if (!isValidPhone(applyPhone)) throw new Error('Số điện thoại không hợp lệ')
                    if (!applyCvFile) throw new Error('Vui lòng chọn CV')
                    if (!isValidCvFile(applyCvFile)) throw new Error('CV chỉ chấp nhận định dạng pdf/doc/docx')
                    if (applyCvFile.size > 10 * 1024 * 1024) throw new Error('CV tối đa 10MB')
                    if (!job?.id) throw new Error('Job không hợp lệ')
                    const form = new FormData()
                    form.append('jobId', String(job.id))
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
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      value={job?.title || ''}
                      readOnly
                      required
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium">CV ứng tuyển *</div>
                    <div className="mt-1 rounded-md border bg-muted/10 p-4 text-center">
                      <div className="text-sm text-muted-foreground">Kéo thả hoặc tải lên CV của bạn</div>
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

