import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { publicApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import Toast from '@/components/Toast'

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
  const [error, setError] = useState(null)

  // Apply form (demo)
  const [applyName, setApplyName] = useState('')
  const [applyEmail, setApplyEmail] = useState('')
  const [applyPhone, setApplyPhone] = useState('')
  const [applyCvFile, setApplyCvFile] = useState(null)
  const [applySource, setApplySource] = useState('')
  const [toast, setToast] = useState({ open: false })

  useEffect(() => {
    let cancelled = false
    setError(null)
    Promise.all([publicApi.site(), Number.isFinite(jobId) ? publicApi.job(jobId) : Promise.reject(new Error('Job not found'))])
      .then(([s, j]) => {
        if (cancelled) return
        setSite(s)
        setJob(j)
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toast toast={toast} onClose={() => setToast({ open: false })} />
      <SiteHeader site={site} />

      <main>
        <section className="border-b bg-muted/10">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                <Link className="hover:text-primary" to="/careers">
                  Cơ hội nghề nghiệp
                </Link>{' '}
                / <span className="text-foreground">{job?.title || 'Chi tiết'}</span>
              </div>
              <Button asChild variant="outline">
                <a href="#apply">Ứng tuyển ngay</a>
              </Button>
            </div>
            {error ? <div className="mt-4 text-sm text-destructive">Lỗi: {error}</div> : null}
          </div>
        </section>

        {job ? (
          <section className="bg-white">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 lg:grid-cols-[1fr_360px]">
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
                </div>

                <Button asChild className="mt-6 w-full bg-primary">
                  <a href="#apply">Ứng tuyển ngay</a>
                </Button>
              </aside>
            </div>
          </section>
        ) : null}

        {/* Apply section (demo giống /careers) */}
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

