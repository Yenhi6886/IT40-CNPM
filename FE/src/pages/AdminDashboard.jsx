import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { adminApi } from '@/lib/api'
import { getToken, setToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import RichTextEditor from '@/components/RichTextEditor'
import { Textarea } from '@/components/ui/textarea'

const PAGE_SIZE = 2

function clampPage(page, totalItems) {
  const totalPages = Math.max(1, Math.ceil((totalItems || 0) / PAGE_SIZE))
  const p = Number(page || 1)
  return Math.min(Math.max(1, p), totalPages)
}

function PaginationBar({ page, totalItems, onChange }) {
  const totalPages = Math.max(1, Math.ceil((totalItems || 0) / PAGE_SIZE))
  if (totalPages <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-center gap-2 text-sm">
      <Button
        type="button"
        variant="outline"
        disabled={page <= 1}
        onClick={() => onChange?.(page - 1)}
      >
        ‹
      </Button>
      <div className="px-2 text-muted-foreground">
        Trang <b className="text-foreground">{page}</b> / {totalPages}
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={page >= totalPages}
        onClick={() => onChange?.(page + 1)}
      >
        ›
      </Button>
    </div>
  )
}

function safeJson(value, fallback) {
  try {
    const v = JSON.parse(value || '')
    return v ?? fallback
  } catch {
    return fallback
  }
}

function listFromJsonArray(text) {
  const v = safeJson(text, [])
  return Array.isArray(v) ? v.map((x) => String(x ?? '')).filter(Boolean) : []
}

function jsonArrayFromList(list) {
  const arr = (list || []).map((x) => String(x || '').trim()).filter(Boolean)
  return JSON.stringify(arr)
}

function UploadField({ value, onChange, onUpload, uploading, placeholder }) {
  const fileRef = useRef(null)
  return (
    <div className="flex gap-2">
      <Input value={value || ''} readOnly disabled placeholder={placeholder} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onUpload?.(e.target.files?.[0] || null)}
      />
      <Button
        type="button"
        variant="outline"
        disabled={!!uploading}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? 'Đang up…' : 'Upload'}
      </Button>
      <Button
        type="button"
        variant="destructive"
        disabled={!!uploading || !value}
        onClick={() => onChange?.('')}
      >
        Xóa
      </Button>
    </div>
  )
}

function defaultJob() {
  return {
    id: null,
    title: '',
    applyStartDate: '',
    applyEndDate: '',
    address: '',
    jobType: 'IT',
    salary: '',
    imageUrl: '',
    description: '',
    published: false,
    sortOrder: 0,
  }
}

export default function AdminDashboard() {
  const nav = useNavigate()
  const location = useLocation()
  const token = useMemo(() => getToken(), [])
  const [site, setSite] = useState(null)
  const [jobs, setJobs] = useState([])
  const [jobDraft, setJobDraft] = useState(defaultJob())
  const [savingSite, setSavingSite] = useState(false)
  const [savingJob, setSavingJob] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null) // { type: 'success' | 'error', message: string }
  const noticeRef = useRef(null)
  const [active, setActive] = useState('site')
  const [siteCategory, setSiteCategory] = useState('general') // general/home/careers/benefits
  const [homePanel, setHomePanel] = useState('hero') // dropdown: hero/menu/join/testimonials/culture/cta/footer
  const [careersPanel, setCareersPanel] = useState('hero') // dropdown: hero
  const [benefitsPanel, setBenefitsPanel] = useState('hero') // dropdown: hero/content/cta

  // Home page structured state (admin-friendly inputs; saved as JSON strings in BE)
  const [sections, setSections] = useState({
    hero: true,
    about: false,
    join: true,
    careers: true,
    testimonials: true,
    culture: true,
    benefits: false,
    footer: true,
  })
  const [navItems, setNavItems] = useState([
    { label: 'Trang chủ', href: '#home' },
    { label: 'Cơ hội nghề nghiệp', href: '/careers' },
    { label: 'Quyền lợi', href: '/benefits' },
  ])
  const [joinTitle, setJoinTitle] = useState('TRỞ THÀNH SAVYTECH NGAY HÔM NAY')
  const [joinCards, setJoinCards] = useState([
    { imageUrl: '', title: '', body: '' },
    { imageUrl: '', title: '', body: '' },
    { imageUrl: '', title: '', body: '' },
  ])
  const [testimonialsTitle, setTestimonialsTitle] = useState('NGƯỜI SAVYTECH NÓI GÌ')
  const [testimonialsItems, setTestimonialsItems] = useState([
    { imageUrl: '', quote: '', role: '' },
    { imageUrl: '', quote: '', role: '' },
    { imageUrl: '', quote: '', role: '' },
  ])
  const [cultureTitle, setCultureTitle] = useState('VĂN HÓA - SỰ KIỆN')
  const [cultureItems, setCultureItems] = useState([
    { label: 'Văn hoá', imageUrl: '', body: '' },
    { label: 'Sự kiện', imageUrl: '', body: '' },
  ])
  const [footerOffices, setFooterOffices] = useState([
    { title: 'HÀ NỘI', address: '', phone: '', email: '' },
    { title: 'ĐÀ NẴNG', address: '', phone: '', email: '' },
    { title: 'NHẬT BẢN', address: '', phone: '', email: '' },
    { title: 'SINGAPORE', address: '', phone: '', email: '' },
  ])
  const [benefitsList, setBenefitsList] = useState([])
  const [rightsList, setRightsList] = useState([])
  const [benefitsCards, setBenefitsCards] = useState([
    { title: 'Lộ trình phát triển rõ ràng', imageUrl: '', body: '' },
    { title: 'Thu nhập cạnh tranh', imageUrl: '', body: '' },
    { title: 'Trợ cấp không giới hạn', imageUrl: '', body: '' },
    { title: 'Môi trường làm việc năng động', imageUrl: '', body: '' },
  ])

  // Pagination state (2 items per page for repeatable sections)
  const [navPage, setNavPage] = useState(1)
  const [testimonialsPage, setTestimonialsPage] = useState(1)
  const [culturePage, setCulturePage] = useState(1)
  const [footerPage, setFooterPage] = useState(1)
  const [benefitsCardsPage, setBenefitsCardsPage] = useState(1)
  const [jobsPage, setJobsPage] = useState(1)
  const [cvs, setCvs] = useState([])
  const [loadingCvs, setLoadingCvs] = useState(false)
  const [cvsPage, setCvsPage] = useState(1)
  const [jobDeleteModal, setJobDeleteModal] = useState({ open: false, job: null })
  const [deletingJob, setDeletingJob] = useState(false)

  function notifySuccess(message) {
    setNotice({ type: 'success', message: String(message || 'Thành công') })
  }

  function notifyError(message) {
    setNotice({ type: 'error', message: String(message || 'Thất bại') })
  }

  function confirmDelete(message) {
    return window.confirm(message || 'Bạn chắc chắn muốn xóa?')
  }

  useEffect(() => {
    if (!token) nav('/admin/login', { replace: true })
  }, [token, nav])

  useEffect(() => {
    const p = String(location?.pathname || '')
    if (p.startsWith('/admin/jobs')) setActive('jobs')
    else if (p.startsWith('/admin/job-edit')) setActive('job-edit')
    else if (p.startsWith('/admin/site')) setActive('site')
    else if (p.startsWith('/admin/cv')) setActive('cv')
    else if (p === '/admin') setActive('site')
  }, [location?.pathname])

  useEffect(() => {
    if (!notice) return
    function onAnyPointerDown(e) {
      const el = noticeRef.current
      if (!el) {
        setNotice(null)
        return
      }
      if (!el.contains(e.target)) setNotice(null)
    }
    window.addEventListener('pointerdown', onAnyPointerDown, true)
    return () => window.removeEventListener('pointerdown', onAnyPointerDown, true)
  }, [notice])

  function uploadAndSet(setter) {
    return async (file) => {
      if (!file) return
      setUploading(true)
      setError(null)
      try {
        const res = await adminApi.uploadImage(token, file)
        const url = res?.url || ''
        if (!url) throw new Error('Upload failed')
        setter(url)
      } catch (e) {
        setError(e?.message || 'Upload failed')
      } finally {
        setUploading(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError(null)
      try {
        const [s, j] = await Promise.all([adminApi.site(token), adminApi.jobs(token)])
        if (cancelled) return
        setSite(s)
        setJobs(j || [])

        // hydrate structured state from BE json fields
        const sectionObj = safeJson(s?.sectionsJson, null)
        if (sectionObj && typeof sectionObj === 'object' && !Array.isArray(sectionObj)) {
          setSections((prev) => ({ ...prev, ...sectionObj }))
        }

        const navParsed = safeJson(s?.navJson, null)
        if (Array.isArray(navParsed) && navParsed.length) {
          setNavItems(
            navParsed.map((x) => ({
              label: String(x?.label || ''),
              href: String(x?.href || ''),
            })),
          )
        }

        const joinParsed = safeJson(s?.joinKaopizerJson, null)
        if (joinParsed && typeof joinParsed === 'object' && !Array.isArray(joinParsed)) {
          if (typeof joinParsed.title === 'string' && joinParsed.title.trim()) setJoinTitle(joinParsed.title)
          if (Array.isArray(joinParsed.cards) && joinParsed.cards.length) {
            const cards = joinParsed.cards.slice(0, 3).map((c) => ({
              imageUrl: String(c?.imageUrl || ''),
              title: String(c?.title || ''),
              body: String(c?.body || ''),
            }))
            while (cards.length < 3) cards.push({ imageUrl: '', title: '', body: '' })
            setJoinCards(cards)
          }
        }

        const tParsed = safeJson(s?.testimonialsJson, null)
        if (tParsed && typeof tParsed === 'object' && !Array.isArray(tParsed)) {
          if (typeof tParsed.title === 'string' && tParsed.title.trim()) setTestimonialsTitle(tParsed.title)
          const rawItems = Array.isArray(tParsed.items) ? tParsed.items : Array.isArray(tParsed.tabs) ? tParsed.tabs : []
          if (rawItems.length) {
            const items = rawItems.map((it) => ({
              imageUrl: String(it?.imageUrl || it?.avatarUrl || ''),
              quote: String(it?.quote || ''),
              role: String(it?.role || ''),
            }))
            while (items.length < 3) items.push({ imageUrl: '', quote: '', role: '' })
            setTestimonialsItems(items)
          }
        }

        const cParsed = safeJson(s?.cultureEventsJson, null)
        if (cParsed && typeof cParsed === 'object' && !Array.isArray(cParsed)) {
          if (typeof cParsed.title === 'string' && cParsed.title.trim()) setCultureTitle(cParsed.title)
          const raw = Array.isArray(cParsed.tabs) ? cParsed.tabs : Array.isArray(cParsed.items) ? cParsed.items : []
          if (raw.length) {
            setCultureItems(
              raw.map((it) => ({
                label: String(it?.label || ''),
                imageUrl: String(it?.imageUrl || ''),
                body: String(it?.body || ''),
              })),
            )
          }
        }

        const fParsed = safeJson(s?.footerJson, null)
        if (fParsed && typeof fParsed === 'object' && !Array.isArray(fParsed) && Array.isArray(fParsed.offices)) {
          setFooterOffices(
            fParsed.offices.map((o) => ({
              title: String(o?.title || ''),
              address: String(o?.address || ''),
              phone: String(o?.phone || ''),
              email: String(o?.email || ''),
            })),
          )
        }

        setBenefitsList(listFromJsonArray(s?.benefitsJson))
        setRightsList(listFromJsonArray(s?.rightsJson))

        const bParsed = safeJson(s?.benefitsPageJson, null)
        if (Array.isArray(bParsed) && bParsed.length) {
          setBenefitsCards(
            bParsed.map((it) => ({
              title: String(it?.title || ''),
              imageUrl: String(it?.imageUrl || ''),
              body: String(it?.body || ''),
            })),
          )
        }
      } catch (e) {
        if (cancelled) return
        setError(e?.message || 'Failed to load')
        if (String(e?.message || '').toLowerCase().includes('401')) {
          setToken('')
          nav('/admin/login', { replace: true })
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [token, nav])

  useEffect(() => {
    if (active !== 'cv') return
    let cancelled = false
    setLoadingCvs(true)
    setError(null)
    adminApi
      .cvs(token)
      .then((rows) => {
        if (cancelled) return
        setCvs(Array.isArray(rows) ? rows : [])
      })
      .catch((e) => {
        if (cancelled) return
        const msg = e?.message || 'Failed to load'
        setError(msg)
        notifyError(msg)
        if (String(msg).toLowerCase().includes('401')) {
          setToken('')
          nav('/admin/login', { replace: true })
        }
      })
      .finally(() => {
        if (cancelled) return
        setLoadingCvs(false)
      })
    return () => {
      cancelled = true
    }
  }, [active, token, nav])

  async function saveSite() {
    if (!site) return
    setSavingSite(true)
    setError(null)
    setNotice(null)
    try {
      // validations
      if (sections.testimonials) {
        const cleaned = (testimonialsItems || []).map((x) => ({
          imageUrl: String(x.imageUrl || '').trim(),
          quote: String(x.quote || '').trim(),
          role: String(x.role || '').trim(),
        }))

        const filled = cleaned.filter((x) => x.imageUrl || x.quote || x.role)
        if (filled.length < 3) {
          throw new Error('“Người Savytech nói gì”: Bắt buộc tối thiểu 3 mục (ảnh + chữ).')
        }
        const invalid = filled.find((x) => !x.imageUrl || !x.quote || !x.role)
        if (invalid) {
          throw new Error('“Người Savytech nói gì”: Mỗi mục bắt buộc nhập đủ Ảnh + Nội dung + Chức danh.')
        }
      }

      const payload = {
        ...site,
        sectionsJson: JSON.stringify({ ...sections, about: false, benefits: false }),
        navJson: JSON.stringify(
          (navItems || []).map((x) => ({
            label: String(x.label || '').trim(),
            href: String(x.href || '').trim(),
          })),
        ),
        joinKaopizerJson: JSON.stringify({
          title: String(joinTitle || '').trim(),
          cards: (joinCards || []).slice(0, 3).map((c) => ({
            imageUrl: String(c.imageUrl || '').trim(),
            title: String(c.title || '').trim(),
            body: String(c.body || '').trim(),
          })),
        }),
        testimonialsJson: JSON.stringify({
          title: String(testimonialsTitle || '').trim(),
          items: (testimonialsItems || []).map((it) => ({
            imageUrl: String(it.imageUrl || '').trim(),
            quote: String(it.quote || '').trim(),
            role: String(it.role || '').trim(),
          })),
        }),
        cultureEventsJson: JSON.stringify({
          title: String(cultureTitle || '').trim(),
          tabs: (cultureItems || []).map((it) => ({
            label: String(it.label || '').trim(),
            imageUrl: String(it.imageUrl || '').trim(),
            body: String(it.body || '').trim(),
          })),
        }),
        footerJson: JSON.stringify({
          offices: (footerOffices || []).map((o) => ({
            title: String(o.title || '').trim(),
            address: String(o.address || '').trim(),
            phone: String(o.phone || '').trim(),
            email: String(o.email || '').trim(),
          })),
        }),
        benefitsJson: jsonArrayFromList(benefitsList),
        rightsJson: jsonArrayFromList(rightsList),
        benefitsPageJson: JSON.stringify(
          (benefitsCards || []).map((it) => ({
            title: String(it.title || '').trim(),
            imageUrl: String(it.imageUrl || '').trim(),
            body: String(it.body || '').trim(),
          })),
        ),
      }

      const updated = await adminApi.upsertSite(token, payload)
      setSite(updated)
      notifySuccess('Đã lưu nội dung thành công.')
    } catch (e) {
      const msg = e?.message || 'Save failed'
      setError(msg)
      notifyError(msg)
    } finally {
      setSavingSite(false)
    }
  }

  async function saveJob() {
    setSavingJob(true)
    setError(null)
    setNotice(null)
    try {
      const dto = {
        ...jobDraft,
        imageUrl: jobDraft.imageUrl || null,
        applyStartDate: jobDraft.applyStartDate || null,
        applyEndDate: jobDraft.applyEndDate || null,
        address: jobDraft.address || null,
        jobType: jobDraft.jobType || null,
        salary: jobDraft.salary || null,
      }
      if (dto.id) {
        const updated = await adminApi.updateJob(token, dto.id, dto)
        setJobs((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
        notifySuccess('Đã lưu job thành công.')
      } else {
        const created = await adminApi.createJob(token, dto)
        setJobs((prev) => [created, ...prev])
        notifySuccess('Đã tạo job thành công.')
      }
      setJobDraft(defaultJob())
      nav('/admin/jobs')
    } catch (e) {
      const msg = e?.message || 'Save job failed'
      setError(msg)
      notifyError(msg)
    } finally {
      setSavingJob(false)
    }
  }

  function requestDeleteJob(job) {
    if (!job?.id) return
    setJobDeleteModal({ open: true, job: { id: job.id, title: String(job.title || '') } })
  }

  async function deleteJob(id) {
    if (!id) return
    setError(null)
    setNotice(null)
    setDeletingJob(true)
    try {
      await adminApi.deleteJob(token, id)
      setJobs((prev) => prev.filter((x) => x.id !== id))
      if (jobDraft.id === id) setJobDraft(defaultJob())
      notifySuccess('Đã xóa job.')
    } catch (e) {
      const msg = e?.message || 'Delete failed'
      setError(msg)
      notifyError(msg)
    } finally {
      setDeletingJob(false)
      setJobDeleteModal({ open: false, job: null })
    }
  }

  async function togglePublish(job) {
    if (!job?.id) return
    setError(null)
    setNotice(null)
    setSavingJob(true)
    try {
      const dto = {
        id: job.id,
        title: job.title || '',
        applyStartDate: job.applyStartDate || null,
        applyEndDate: job.applyEndDate || null,
        address: job.address || null,
        jobType: job.jobType || null,
        salary: job.salary || null,
        imageUrl: job.imageUrl || null,
        description: job.description || '',
        published: !job.published,
        sortOrder: Number(job.sortOrder || 0),
      }
      const updated = await adminApi.updateJob(token, job.id, dto)
      setJobs((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      if (jobDraft.id === updated.id) setJobDraft((prev) => ({ ...prev, published: updated.published }))
      notifySuccess(updated.published ? 'Đã hiển thị job (Published).' : 'Đã ẩn job (Draft).')
    } catch (e) {
      const msg = e?.message || 'Update failed'
      setError(msg)
      notifyError(msg)
    } finally {
      setSavingJob(false)
    }
  }

  function logout() {
    setToken('')
    nav('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <div className="text-sm text-muted-foreground">Admin</div>
            <div className="text-lg font-semibold">{site?.companyName || 'Savytech'}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <a href="/" target="_blank" rel="noreferrer">
                Xem trang user
              </a>
            </Button>
            <Button variant="destructive" onClick={logout}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {jobDeleteModal?.open ? (
          <div className="fixed inset-0 z-[80]">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => (deletingJob ? null : setJobDeleteModal({ open: false, job: null }))}
            />
            <div className="absolute inset-0 grid place-items-center p-4">
              <div className="w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-xl">
                <div className="border-b p-5">
                  <div className="text-base font-semibold">Xác nhận xoá job</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Bạn có chắc chắn muốn xoá job{' '}
                    <b className="text-foreground">{jobDeleteModal?.job?.title || '—'}</b>? Hành động này không thể
                    hoàn tác.
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-5">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={deletingJob}
                    onClick={() => setJobDeleteModal({ open: false, job: null })}
                  >
                    Huỷ
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deletingJob}
                    onClick={() => deleteJob(jobDeleteModal?.job?.id)}
                  >
                    {deletingJob ? 'Đang xoá...' : 'Xoá job'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={active === 'site' ? 'default' : 'outline'}
            onClick={() => nav('/admin/site')}
          >
            Nội dung trang
          </Button>
          <Button
            variant={active === 'jobs' ? 'default' : 'outline'}
            onClick={() => nav('/admin/jobs')}
          >
            Tuyển dụng
          </Button>
          <Button
            variant={active === 'job-edit' ? 'default' : 'outline'}
            onClick={() => nav('/admin/job-edit')}
          >
            Thêm/Sửa job
          </Button>
          <Button variant={active === 'cv' ? 'default' : 'outline'} onClick={() => nav('/admin/cv')}>
            Quản lý CV
          </Button>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div
            ref={noticeRef}
            className={`mb-6 rounded-lg border p-4 text-sm ${
              notice.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}
          >
            {notice.message}
          </div>
        ) : null}

        {active === 'site' ? (
          <Card>
            <CardHeader>
              <CardTitle>Nội dung trang người dùng</CardTitle>
              <CardDescription>
                Tất cả phần hiển thị ở trang user đều chỉnh được tại đây. Các trường ảnh có thể để trống.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {site ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
                  <aside className="space-y-3">
                    <div className="rounded-xl border bg-muted/10 p-3">
                      <div className="text-xs font-semibold text-muted-foreground">DANH MỤC</div>
                      <div className="mt-2 space-y-1">
                        {[
                          { id: 'general', label: 'Thông tin chung' },
                          { id: 'home', label: 'Trang chủ' },
                          { id: 'careers', label: 'Cơ hội nghề nghiệp' },
                          { id: 'benefits', label: 'Quyền lợi' },
                        ].map((x) => (
                          <button
                            key={x.id}
                            type="button"
                            className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                              siteCategory === x.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/30'
                            }`}
                            onClick={() => setSiteCategory(x.id)}
                          >
                            {x.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {siteCategory === 'home' ? (
                      <div className="rounded-xl border bg-background p-3">
                        <div className="text-xs font-semibold text-muted-foreground">TRANG CHỦ</div>
                        <div className="mt-2 space-y-1">
                          {[
                            { id: 'hero', label: 'Hero' },
                            { id: 'menu', label: 'Menu header' },
                            { id: 'join', label: 'Trở thành Savytech' },
                            { id: 'testimonials', label: 'Người Savytech nói gì' },
                            { id: 'culture', label: 'Văn hoá - Sự kiện' },
                            { id: 'cta', label: 'KEEP INNOVATING (CTA)' },
                            { id: 'footer', label: 'Footer' },
                          ].map((x) => (
                            <button
                              key={x.id}
                              type="button"
                              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                                homePanel === x.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/30'
                              }`}
                              onClick={() => setHomePanel(x.id)}
                            >
                              {x.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {siteCategory === 'careers' ? (
                      <div className="rounded-xl border bg-background p-3">
                        <div className="text-xs font-semibold text-muted-foreground">CƠ HỘI NGHỀ NGHIỆP</div>
                        <div className="mt-2 space-y-1">
                          {[{ id: 'hero', label: 'Hero' }].map((x) => (
                            <button
                              key={x.id}
                              type="button"
                              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                                careersPanel === x.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/30'
                              }`}
                              onClick={() => setCareersPanel(x.id)}
                            >
                              {x.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {siteCategory === 'benefits' ? (
                      <div className="rounded-xl border bg-background p-3">
                        <div className="text-xs font-semibold text-muted-foreground">QUYỀN LỢI</div>
                        <div className="mt-2 space-y-1">
                          {[
                            { id: 'hero', label: 'Hero' },
                            { id: 'content', label: 'Nội dung' },
                            { id: 'cta', label: 'KEEP INNOVATING (CTA)' },
                          ].map((x) => (
                            <button
                              key={x.id}
                              type="button"
                              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                                benefitsPanel === x.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/30'
                              }`}
                              onClick={() => setBenefitsPanel(x.id)}
                            >
                              {x.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </aside>

                  <div className="space-y-6">
                    {siteCategory === 'general' ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Thông tin chung</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Tên công ty</div>
                            <Input
                              value={site.companyName || ''}
                              onChange={(e) => setSite({ ...site, companyName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Logo</div>
                            <UploadField
                              value={site.logoUrl || ''}
                              placeholder="Chỉ upload file"
                              uploading={uploading}
                              onChange={(v) => setSite({ ...site, logoUrl: v })}
                              onUpload={uploadAndSet((url) => setSite((s) => ({ ...s, logoUrl: url })))}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}

                    {siteCategory === 'careers' && careersPanel === 'hero' ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Hero (Cơ hội nghề nghiệp)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Hero title</div>
                            <Input
                              value={site?.careersHeroTitle || ''}
                              onChange={(e) => setSite((s) => ({ ...s, careersHeroTitle: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Hero subtitle</div>
                            <RichTextEditor
                              value={site?.careersHeroSubtitle || ''}
                              onChange={(html) => setSite((s) => ({ ...s, careersHeroSubtitle: html }))}
                              placeholder="Nhập hero subtitle..."
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Ảnh nền</div>
                            <UploadField
                              value={site?.careersHeroBackgroundUrl || ''}
                              placeholder="Chỉ upload file"
                              uploading={uploading}
                              onChange={(v) => setSite((s) => ({ ...s, careersHeroBackgroundUrl: v }))}
                              onUpload={uploadAndSet((url) =>
                                setSite((s) => ({ ...s, careersHeroBackgroundUrl: url })),
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}

                    {siteCategory === 'benefits' ? (
                      <>
                        {benefitsPanel === 'hero' ? (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Hero (Quyền lợi)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <div className="text-sm font-medium">Hero title</div>
                                <Input
                                  value={site?.benefitsHeroTitle || ''}
                                  onChange={(e) => setSite((s) => ({ ...s, benefitsHeroTitle: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="text-sm font-medium">Hero subtitle</div>
                                <RichTextEditor
                            key={`benefits-hero-subtitle-${benefitsPanel}`}
                                  value={site?.benefitsHeroSubtitle || ''}
                                  onChange={(html) => setSite((s) => ({ ...s, benefitsHeroSubtitle: html }))}
                                  placeholder="Nhập hero subtitle..."
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="text-sm font-medium">Ảnh nền</div>
                                <UploadField
                                  value={site?.benefitsHeroBackgroundUrl || ''}
                                  placeholder="Chỉ upload file"
                                  uploading={uploading}
                                  onChange={(v) => setSite((s) => ({ ...s, benefitsHeroBackgroundUrl: v }))}
                                  onUpload={uploadAndSet((url) =>
                                    setSite((s) => ({ ...s, benefitsHeroBackgroundUrl: url })),
                                  )}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ) : null}

                        {benefitsPanel === 'content' ? (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Nội dung (Quyền lợi)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {benefitsCards
                                .slice(
                                  (clampPage(benefitsCardsPage, benefitsCards.length) - 1) * PAGE_SIZE,
                                  clampPage(benefitsCardsPage, benefitsCards.length) * PAGE_SIZE,
                                )
                                .map((c, localIdx) => {
                                  const idx =
                                    (clampPage(benefitsCardsPage, benefitsCards.length) - 1) * PAGE_SIZE + localIdx
                                  return (
                                    <div key={idx} className="rounded-xl border p-4 space-y-3">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm font-semibold">Mục {idx + 1}</div>
                                        <Button
                                          variant="destructive"
                                          type="button"
                                          disabled={benefitsCards.length <= 1}
                                          onClick={() =>
                                            setBenefitsCards((prev) => {
                                      if (!confirmDelete('Bạn chắc chắn muốn xóa mục này?')) return prev
                                              const next = prev.filter((_, i) => i !== idx)
                                              setBenefitsCardsPage((p) => clampPage(p, next.length))
                                              return next
                                            })
                                          }
                                        >
                                          Xóa
                                        </Button>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="text-xs font-medium text-muted-foreground">Tiêu đề</div>
                                        <Input
                                          value={c.title}
                                          onChange={(e) =>
                                            setBenefitsCards((prev) =>
                                              prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)),
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <div className="text-xs font-medium text-muted-foreground">Ảnh</div>
                                        <UploadField
                                          value={c.imageUrl}
                                          placeholder="Chỉ upload file"
                                          uploading={uploading}
                                          onChange={(v) =>
                                            setBenefitsCards((prev) =>
                                              prev.map((x, i) => (i === idx ? { ...x, imageUrl: v } : x)),
                                            )
                                          }
                                          onUpload={uploadAndSet((url) =>
                                            setBenefitsCards((prev) =>
                                              prev.map((x, i) => (i === idx ? { ...x, imageUrl: url } : x)),
                                            ),
                                          )}
                                        />
                                        {c.imageUrl ? (
                                          <img src={c.imageUrl} alt="" className="aspect-[16/7] w-full rounded-xl object-cover" />
                                        ) : null}
                                      </div>
                                      <div className="space-y-2">
                                        <div className="text-xs font-medium text-muted-foreground">Nội dung</div>
                                        <RichTextEditor
                                          value={c.body}
                                          onChange={(html) =>
                                            setBenefitsCards((prev) =>
                                              prev.map((x, i) => (i === idx ? { ...x, body: html } : x)),
                                            )
                                          }
                                          placeholder="Nhập nội dung..."
                                          className="min-h-24"
                                        />
                                      </div>
                                    </div>
                                  )
                                })}
                              <Button
                                variant="outline"
                                type="button"
                                onClick={() =>
                                  setBenefitsCards((prev) => {
                                    const next = [...prev, { title: '', imageUrl: '', body: '' }]
                                    setBenefitsCardsPage(clampPage(999, next.length))
                                    return next
                                  })
                                }
                              >
                                + Thêm mục
                              </Button>
                              <PaginationBar
                                page={clampPage(benefitsCardsPage, benefitsCards.length)}
                                totalItems={benefitsCards.length}
                                onChange={(p) => setBenefitsCardsPage(clampPage(p, benefitsCards.length))}
                              />
                            </CardContent>
                          </Card>
                        ) : null}

                        {benefitsPanel === 'cta' ? (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">KEEP INNOVATING (CTA) (Quyền lợi)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="space-y-2">
                                <div className="text-sm font-medium">Ảnh nền CTA</div>
                                <UploadField
                                  value={site?.benefitsCtaBackgroundUrl || ''}
                                  placeholder="Chỉ upload file"
                                  uploading={uploading}
                                  onChange={(v) => setSite((s) => ({ ...s, benefitsCtaBackgroundUrl: v }))}
                                  onUpload={uploadAndSet((url) =>
                                    setSite((s) => ({ ...s, benefitsCtaBackgroundUrl: url })),
                                  )}
                                />
                              </div>
                              {site?.benefitsCtaBackgroundUrl ? (
                                <img
                                  src={site.benefitsCtaBackgroundUrl}
                                  alt=""
                                  className="aspect-[16/6] w-full rounded-xl object-cover"
                                />
                              ) : null}
                            </CardContent>
                          </Card>
                        ) : null}
                      </>
                    ) : null}

                    {siteCategory === 'home' && homePanel === 'hero' ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Hero</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Hero title</div>
                            <Input
                              value={site.heroTitle || ''}
                              onChange={(e) => setSite({ ...site, heroTitle: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Hero subtitle</div>
                            <RichTextEditor
                              value={site.heroSubtitle || ''}
                              onChange={(html) => setSite((s) => ({ ...s, heroSubtitle: html }))}
                              placeholder="Nhập hero subtitle..."
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Ảnh nền</div>
                            <UploadField
                              value={site.heroBackgroundUrl || ''}
                              placeholder="Dán link hoặc upload file"
                              uploading={uploading}
                              onChange={(v) => setSite({ ...site, heroBackgroundUrl: v })}
                              onUpload={uploadAndSet((url) => setSite((s) => ({ ...s, heroBackgroundUrl: url })))}
                            />
                            {site.heroBackgroundUrl ? (
                              <img
                                src={site.heroBackgroundUrl}
                                alt=""
                                className="mt-2 aspect-[16/6] w-full rounded-xl object-cover"
                              />
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}

                    {siteCategory === 'home' && homePanel === 'menu' ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Menu header</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {navItems
                            .slice(
                              (clampPage(navPage, navItems.length) - 1) * PAGE_SIZE,
                              clampPage(navPage, navItems.length) * PAGE_SIZE,
                            )
                            .map((it, localIdx) => {
                              const idx = (clampPage(navPage, navItems.length) - 1) * PAGE_SIZE + localIdx
                              return (
                            <div
                              key={idx}
                              className="grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-[1fr_1fr_auto]"
                            >
                              <div className="space-y-1">
                                <div className="text-xs font-medium text-muted-foreground">Label</div>
                                <Input
                                  value={it.label}
                                  onChange={(e) =>
                                    setNavItems((prev) =>
                                      prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)),
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs font-medium text-muted-foreground">Href</div>
                                <Input
                                  value={it.href}
                                  onChange={(e) =>
                                    setNavItems((prev) =>
                                      prev.map((x, i) => (i === idx ? { ...x, href: e.target.value } : x)),
                                    )
                                  }
                                  placeholder="#home"
                                />
                              </div>
                              <div className="flex items-end">
                                <Button
                                  variant="destructive"
                                  type="button"
                                  onClick={() =>
                                    setNavItems((prev) => {
                                      if (!confirmDelete('Bạn chắc chắn muốn xóa menu này?')) return prev
                                      const next = prev.filter((_, i) => i !== idx)
                                      setNavPage((p) => clampPage(p, next.length))
                                      return next
                                    })
                                  }
                                  disabled={navItems.length <= 1}
                                >
                                  Xóa
                                </Button>
                              </div>
                            </div>
                              )
                            })}
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() =>
                              setNavItems((prev) => {
                                const next = [...prev, { label: '', href: '' }]
                                setNavPage(clampPage(999, next.length))
                                return next
                              })
                            }
                          >
                            + Thêm menu
                          </Button>
                          <PaginationBar
                            page={clampPage(navPage, navItems.length)}
                            totalItems={navItems.length}
                            onChange={(p) => setNavPage(clampPage(p, navItems.length))}
                          />
                        </CardContent>
                      </Card>
                    ) : null}

                    {siteCategory === 'home' && homePanel === 'join' ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Trở thành Savytech</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Tiêu đề khối</div>
                            <Input value={joinTitle} onChange={(e) => setJoinTitle(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {joinCards.map((c, idx) => (
                              <div key={idx} className="space-y-3 rounded-xl border p-4">
                                <div className="text-sm font-semibold">Card {idx + 1}</div>
                                <div className="space-y-2">
                                  <div className="text-xs font-medium text-muted-foreground">Ảnh</div>
                                  <UploadField
                                    value={c.imageUrl}
                                    placeholder="Dán link hoặc upload file"
                                    uploading={uploading}
                                    onChange={(v) =>
                                      setJoinCards((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, imageUrl: v } : x)),
                                      )
                                    }
                                    onUpload={uploadAndSet((url) =>
                                      setJoinCards((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, imageUrl: url } : x)),
                                      ),
                                    )}
                                  />
                                  {c.imageUrl ? (
                                    <img
                                      src={c.imageUrl}
                                      alt=""
                                      className="mt-2 aspect-[4/3] w-full rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="mt-2 aspect-[4/3] w-full rounded-lg border border-dashed bg-muted/20" />
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <div className="text-xs font-medium text-muted-foreground">Tiêu đề</div>
                                  <Input
                                    value={c.title}
                                    onChange={(e) =>
                                      setJoinCards((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)),
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="text-xs font-medium text-muted-foreground">Nội dung</div>
                                  <RichTextEditor
                                    value={c.body}
                                    onChange={(html) =>
                                      setJoinCards((prev) => prev.map((x, i) => (i === idx ? { ...x, body: html } : x)))
                                    }
                                    placeholder="Nhập nội dung..."
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}

                    {siteCategory === 'home' && homePanel === 'testimonials' ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Người Savytech nói gì</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Tiêu đề khối</div>
                            <Input
                              value={testimonialsTitle}
                              onChange={(e) => setTestimonialsTitle(e.target.value)}
                            />
                          </div>

                          <div className="space-y-4">
                            {testimonialsItems
                              .slice(
                                (clampPage(testimonialsPage, testimonialsItems.length) - 1) * PAGE_SIZE,
                                clampPage(testimonialsPage, testimonialsItems.length) * PAGE_SIZE,
                              )
                              .map((it, localIdx) => {
                                const idx =
                                  (clampPage(testimonialsPage, testimonialsItems.length) - 1) * PAGE_SIZE + localIdx
                                return (
                              <div
                                key={idx}
                                className="grid grid-cols-1 gap-4 rounded-xl border p-4 md:grid-cols-[240px_1fr]"
                              >
                                <div className="space-y-2">
                                  <div className="text-xs font-medium text-muted-foreground">Ảnh *</div>
                                  <UploadField
                                    value={it.imageUrl}
                                    placeholder="Dán link hoặc upload file"
                                    uploading={uploading}
                                    onChange={(v) =>
                                      setTestimonialsItems((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, imageUrl: v } : x)),
                                      )
                                    }
                                    onUpload={uploadAndSet((url) =>
                                      setTestimonialsItems((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, imageUrl: url } : x)),
                                      ),
                                    )}
                                  />
                                  {it.imageUrl ? (
                                    <img
                                      src={it.imageUrl}
                                      alt=""
                                      className="aspect-[4/3] w-full rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="aspect-[4/3] w-full rounded-lg border border-dashed bg-muted/20" />
                                  )}
                                  <Button
                                    variant="destructive"
                                    type="button"
                                    onClick={() =>
                                      setTestimonialsItems((prev) => {
                                        if (!confirmDelete('Bạn chắc chắn muốn xóa mục này?')) return prev
                                        const next = prev.filter((_, i) => i !== idx)
                                        setTestimonialsPage((p) => clampPage(p, next.length))
                                        return next
                                      })
                                    }
                                    disabled={testimonialsItems.length <= 3}
                                  >
                                    Xóa mục
                                  </Button>
                                </div>

                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground">Chức danh *</div>
                                    <Input
                                      value={it.role}
                                      onChange={(e) =>
                                        setTestimonialsItems((prev) =>
                                          prev.map((x, i) => (i === idx ? { ...x, role: e.target.value } : x)),
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground">Nội dung *</div>
                                    <RichTextEditor
                                      value={it.quote}
                                      onChange={(html) =>
                                        setTestimonialsItems((prev) =>
                                          prev.map((x, i) => (i === idx ? { ...x, quote: html } : x)),
                                        )
                                      }
                                      placeholder="Nhập nội dung..."
                                      className="min-h-28"
                                    />
                                  </div>

                                  <div className="rounded-xl border bg-muted/10 p-4">
                                    <div className="text-xs font-semibold text-muted-foreground">
                                      Preview (user)
                                    </div>
                                    <div className="mt-3 overflow-hidden rounded-xl">
                                      <div className="relative aspect-[16/7] bg-muted/30">
                                        {it.imageUrl ? (
                                          <img
                                            src={it.imageUrl}
                                            alt=""
                                            className="absolute inset-0 h-full w-full object-cover"
                                          />
                                        ) : null}
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
                                        <div className="absolute bottom-0 left-0 p-4 text-white">
                                          <div className="text-2xl leading-none">“</div>
                                          <div className="mt-1 max-w-xl text-sm text-white/90">
                                            {it.quote || 'Nội dung sẽ hiển thị ở đây...'}
                                          </div>
                                          <div className="mt-3 text-sm font-semibold">
                                            {it.role || 'Chức danh'}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                                )
                              })}

                            <Button
                              variant="outline"
                              type="button"
                              onClick={() =>
                                setTestimonialsItems((prev) => {
                                  const next = [...prev, { imageUrl: '', quote: '', role: '' }]
                                  setTestimonialsPage(clampPage(999, next.length))
                                  return next
                                })
                              }
                            >
                              + Thêm mục
                            </Button>
                            <PaginationBar
                              page={clampPage(testimonialsPage, testimonialsItems.length)}
                              totalItems={testimonialsItems.length}
                              onChange={(p) => setTestimonialsPage(clampPage(p, testimonialsItems.length))}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}

                    {siteCategory === 'home' && homePanel === 'culture' ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Văn hoá - Sự kiện</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Tiêu đề khối</div>
                            <Input value={cultureTitle} onChange={(e) => setCultureTitle(e.target.value)} />
                          </div>
                          <div className="space-y-4">
                            {cultureItems
                              .slice(
                                (clampPage(culturePage, cultureItems.length) - 1) * PAGE_SIZE,
                                clampPage(culturePage, cultureItems.length) * PAGE_SIZE,
                              )
                              .map((it, localIdx) => {
                                const idx = (clampPage(culturePage, cultureItems.length) - 1) * PAGE_SIZE + localIdx
                                return (
                              <div
                                key={idx}
                                className="grid grid-cols-1 gap-4 rounded-xl border p-4 md:grid-cols-[1fr_1fr_auto]"
                              >
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-muted-foreground">Tab</div>
                                  <Input
                                    value={it.label}
                                    onChange={(e) =>
                                      setCultureItems((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)),
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-muted-foreground">Ảnh</div>
                                  <UploadField
                                    value={it.imageUrl}
                                    placeholder="Dán link hoặc upload file"
                                    uploading={uploading}
                                    onChange={(v) =>
                                      setCultureItems((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, imageUrl: v } : x)),
                                      )
                                    }
                                    onUpload={uploadAndSet((url) =>
                                      setCultureItems((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, imageUrl: url } : x)),
                                      ),
                                    )}
                                  />
                                </div>
                                <div className="flex items-end">
                                  <Button
                                    variant="destructive"
                                    type="button"
                                    onClick={() =>
                                      setCultureItems((prev) => {
                                        if (!confirmDelete('Bạn chắc chắn muốn xóa tab này?')) return prev
                                        const next = prev.filter((_, i) => i !== idx)
                                        setCulturePage((p) => clampPage(p, next.length))
                                        return next
                                      })
                                    }
                                    disabled={cultureItems.length <= 1}
                                  >
                                    Xóa
                                  </Button>
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                  <div className="text-xs font-medium text-muted-foreground">Nội dung</div>
                                  <RichTextEditor
                                    value={it.body}
                                    onChange={(html) =>
                                      setCultureItems((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, body: html } : x)),
                                      )
                                    }
                                    placeholder="Nhập nội dung..."
                                    className="min-h-24"
                                  />
                                </div>
                              </div>
                                )
                              })}
                            <Button
                              variant="outline"
                              type="button"
                              onClick={() =>
                                setCultureItems((prev) => {
                                  const next = [...prev, { label: '', imageUrl: '', body: '' }]
                                  setCulturePage(clampPage(999, next.length))
                                  return next
                                })
                              }
                            >
                              + Thêm tab
                            </Button>
                            <PaginationBar
                              page={clampPage(culturePage, cultureItems.length)}
                              totalItems={cultureItems.length}
                              onChange={(p) => setCulturePage(clampPage(p, cultureItems.length))}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}

                    {siteCategory === 'home' && homePanel === 'cta' ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">KEEP INNOVATING (CTA)</CardTitle>
                          <CardDescription>
                            Khối này nằm sau “Văn hoá - Sự kiện”, có ảnh nền + nút “Ứng tuyển ngay”.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Ảnh nền</div>
                            <UploadField
                              value={site.ctaBackgroundUrl || ''}
                              placeholder="Dán link hoặc upload file"
                              uploading={uploading}
                              onChange={(v) => setSite({ ...site, ctaBackgroundUrl: v })}
                              onUpload={uploadAndSet((url) => setSite((s) => ({ ...s, ctaBackgroundUrl: url })))}
                            />
                          </div>
                          {site.ctaBackgroundUrl ? (
                            <img
                              src={site.ctaBackgroundUrl}
                              alt=""
                              className="aspect-[16/6] w-full rounded-xl object-cover"
                            />
                          ) : null}
                        </CardContent>
                      </Card>
                    ) : null}

                    {siteCategory === 'home' && homePanel === 'footer' ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Footer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {footerOffices
                              .slice(
                                (clampPage(footerPage, footerOffices.length) - 1) * PAGE_SIZE,
                                clampPage(footerPage, footerOffices.length) * PAGE_SIZE,
                              )
                              .map((o, localIdx) => {
                                const idx =
                                  (clampPage(footerPage, footerOffices.length) - 1) * PAGE_SIZE + localIdx
                                return (
                              <div key={idx} className="space-y-3 rounded-xl border p-4">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-sm font-semibold">{o.title || `Office ${idx + 1}`}</div>
                                  <Button
                                    variant="destructive"
                                    type="button"
                                    onClick={() =>
                                      setFooterOffices((prev) => {
                                        if (!confirmDelete('Bạn chắc chắn muốn xóa chi nhánh này?')) return prev
                                        const next = prev.filter((_, i) => i !== idx)
                                        setFooterPage((p) => clampPage(p, next.length))
                                        return next
                                      })
                                    }
                                    disabled={footerOffices.length <= 1}
                                  >
                                    Xóa
                                  </Button>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-muted-foreground">Tiêu đề</div>
                                  <Input
                                    value={o.title}
                                    onChange={(e) =>
                                      setFooterOffices((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)),
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-muted-foreground">Địa chỉ</div>
                                  <Textarea
                                    value={o.address}
                                    onChange={(e) =>
                                      setFooterOffices((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, address: e.target.value } : x)),
                                      )
                                    }
                                    className="min-h-20"
                                  />
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                  <div className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground">SĐT</div>
                                    <Input
                                      value={o.phone}
                                      onChange={(e) =>
                                        setFooterOffices((prev) =>
                                          prev.map((x, i) => (i === idx ? { ...x, phone: e.target.value } : x)),
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground">Email</div>
                                    <Input
                                      value={o.email}
                                      onChange={(e) =>
                                        setFooterOffices((prev) =>
                                          prev.map((x, i) => (i === idx ? { ...x, email: e.target.value } : x)),
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                                )
                              })}
                          </div>
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() =>
                              setFooterOffices((prev) => {
                                const next = [...prev, { title: '', address: '', phone: '', email: '' }]
                                setFooterPage(clampPage(999, next.length))
                                return next
                              })
                            }
                          >
                            + Thêm chi nhánh
                          </Button>
                          <PaginationBar
                            page={clampPage(footerPage, footerOffices.length)}
                            totalItems={footerOffices.length}
                            onChange={(p) => setFooterPage(clampPage(p, footerOffices.length))}
                          />
                        </CardContent>
                      </Card>
                    ) : null}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button onClick={saveSite} disabled={savingSite || uploading}>
                        {savingSite ? 'Đang lưu…' : uploading ? 'Đang upload…' : 'Lưu nội dung'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Đang tải…</div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {active === 'jobs' ? (
          <Card>
            <CardHeader>
              <CardTitle>Danh sách vị trí tuyển dụng</CardTitle>
              <CardDescription>Chỉ job có Published = true mới hiện ở trang user.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {jobs?.length ? (
                  jobs
                    .slice((clampPage(jobsPage, jobs.length) - 1) * 10, clampPage(jobsPage, jobs.length) * 10)
                    .map((j) => (
                    <div
                      key={j.id}
                      className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{j.title}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {[
                            j.applyStartDate && j.applyEndDate ? `${j.applyStartDate} - ${j.applyEndDate}` : null,
                            j.address || null,
                            j.salary || null,
                          ]
                            .filter(Boolean)
                            .join(' • ') || '—'}{' '}
                          {j.published ? (
                            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                              Published
                            </span>
                          ) : (
                            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              Draft
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button variant="secondary" type="button" onClick={() => nav(`/admin/jobs/${j.id}`)}>
                          Xem
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setJobDraft({
                              ...defaultJob(),
                              ...j,
                              imageUrl: j.imageUrl || '',
                              applyStartDate: j.applyStartDate || '',
                              applyEndDate: j.applyEndDate || '',
                              address: j.address || '',
                              jobType: j.jobType || 'IT',
                              salary: j.salary || '',
                              description: j.description || '',
                            })
                            setActive('job-edit')
                          }}
                        >
                          Sửa
                        </Button>
                        <Button
                          variant={j.published ? 'outline' : 'default'}
                          type="button"
                          disabled={savingJob}
                          onClick={() => togglePublish(j)}
                        >
                          {j.published ? 'Ẩn' : 'Hiện'}
                        </Button>
                        <Button variant="destructive" onClick={() => requestDeleteJob(j)}>
                          Xóa
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    Chưa có job nào. Chọn “Thêm/Sửa job” để tạo mới.
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <Button
                  type="button"
                  variant="outline"
                  disabled={clampPage(jobsPage, jobs.length) <= 1}
                  onClick={() => setJobsPage((p) => clampPage(p - 1, jobs.length))}
                >
                  ‹
                </Button>
                <div className="px-2 text-muted-foreground">
                  Trang <b className="text-foreground">{clampPage(jobsPage, jobs.length)}</b> /{' '}
                  {Math.max(1, Math.ceil((jobs.length || 0) / 10))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={clampPage(jobsPage, jobs.length) >= Math.max(1, Math.ceil((jobs.length || 0) / 10))}
                  onClick={() => setJobsPage((p) => clampPage(p + 1, jobs.length))}
                >
                  ›
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {active === 'job-edit' ? (
          <Card>
            <CardHeader>
              <CardTitle>{jobDraft.id ? 'Sửa job' : 'Tạo job mới'}</CardTitle>
              <CardDescription>
                Các trường ảnh có thể để trống. SortOrder nhỏ sẽ lên trước.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm font-medium">Tiêu đề</div>
                  <Input
                    value={jobDraft.title}
                    onChange={(e) => setJobDraft({ ...jobDraft, title: e.target.value })}
                    placeholder="Java Developer"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Thời gian ứng tuyển (từ ngày)</div>
                  <Input
                    type="date"
                    value={jobDraft.applyStartDate}
                    onChange={(e) => setJobDraft({ ...jobDraft, applyStartDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Thời gian ứng tuyển (đến ngày)</div>
                  <Input
                    type="date"
                    value={jobDraft.applyEndDate}
                    onChange={(e) => setJobDraft({ ...jobDraft, applyEndDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Địa chỉ cụ thể</div>
                  <Input
                    value={jobDraft.address}
                    onChange={(e) => setJobDraft({ ...jobDraft, address: e.target.value })}
                    placeholder="Tầng 10, Tòa nhà ABC, 123 Đường XYZ, Hà Nội"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Loại job</div>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={jobDraft.jobType || 'IT'}
                    onChange={(e) => setJobDraft({ ...jobDraft, jobType: e.target.value })}
                  >
                    <option value="IT">IT</option>
                    <option value="NON_IT">NON-IT</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Lương</div>
                  <Input
                    value={jobDraft.salary}
                    onChange={(e) => setJobDraft({ ...jobDraft, salary: e.target.value })}
                    placeholder="Thỏa thuận"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">SortOrder</div>
                  <Input
                    type="number"
                    value={String(jobDraft.sortOrder)}
                    onChange={(e) =>
                      setJobDraft({ ...jobDraft, sortOrder: Number(e.target.value || 0) })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm font-medium">Image URL (để trống nếu chưa có)</div>
                  <Input
                    value={jobDraft.imageUrl}
                    onChange={(e) => setJobDraft({ ...jobDraft, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm font-medium">Nội dung chi tiết job</div>
                  <div className="text-xs text-muted-foreground">
                    Có thể chỉnh gần như Word: font, cỡ chữ, đậm/nghiêng, căn lề, màu chữ,
                    bullet/number list, rồi hiển thị lại nguyên định dạng ở trang user.
                  </div>
                  <RichTextEditor
                    value={jobDraft.description}
                    onChange={(html) => setJobDraft((prev) => ({ ...prev, description: html }))}
                    placeholder="Nhập nội dung chi tiết job..."
                  />
                </div>
                <div className="md:col-span-2 flex items-center justify-between gap-2">
                  <label className="flex select-none items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[hsl(var(--primary))]"
                      checked={jobDraft.published}
                      onChange={(e) => setJobDraft({ ...jobDraft, published: e.target.checked })}
                    />
                    Published
                  </label>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setJobDraft(defaultJob())}
                      type="button"
                    >
                      Reset
                    </Button>
                    <Button onClick={saveJob} disabled={savingJob || !jobDraft.title.trim()}>
                      {savingJob ? 'Đang lưu…' : jobDraft.id ? 'Lưu job' : 'Tạo job'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {active === 'cv' ? (
          <Card>
            <CardHeader>
              <CardTitle>Quản lý CV</CardTitle>
              <CardDescription>Danh sách CV ứng tuyển người dùng gửi lên.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCvs ? <div className="text-sm text-muted-foreground">Đang tải…</div> : null}

              <div className="space-y-3">
                {cvs
                  .slice((Math.min(Math.max(1, cvsPage), Math.max(1, Math.ceil((cvs.length || 0) / 10))) - 1) * 10, Math.min(Math.max(1, cvsPage), Math.max(1, Math.ceil((cvs.length || 0) / 10))) * 10)
                  .map((x) => (
                    <div
                      key={x.id}
                      className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {x.fullName} — {x.jobTitle}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {x.email} • {x.phone} {x.source ? `• ${x.source}` : ''}{' '}
                          {x.createdAt ? `• ${new Date(x.createdAt).toLocaleString()}` : ''}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          <div className="truncate">
                            <b>File:</b> {x.cvOriginalName}
                          </div>
                          <div className="truncate">
                            <b>Path:</b> {x.cvStoredPath || '—'}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const { blob, filename } = await adminApi.downloadCv(token, x.id)
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = filename || x.cvOriginalName || 'cv'
                              document.body.appendChild(a)
                              a.click()
                              a.remove()
                              URL.revokeObjectURL(url)
                              notifySuccess('Đã tải CV.')
                            } catch (err) {
                              notifyError(err?.message || 'Tải CV thất bại')
                            }
                          }}
                        >
                          Tải CV
                        </Button>
                      </div>
                    </div>
                  ))}

                {!cvs.length && !loadingCvs ? (
                  <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    Chưa có CV nào.
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <Button
                  type="button"
                  variant="outline"
                  disabled={Math.min(Math.max(1, cvsPage), Math.max(1, Math.ceil((cvs.length || 0) / 10))) <= 1}
                  onClick={() => setCvsPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </Button>
                <div className="px-2 text-muted-foreground">
                  Trang <b className="text-foreground">{Math.min(Math.max(1, cvsPage), Math.max(1, Math.ceil((cvs.length || 0) / 10)))}</b> /{' '}
                  {Math.max(1, Math.ceil((cvs.length || 0) / 10))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    Math.min(Math.max(1, cvsPage), Math.max(1, Math.ceil((cvs.length || 0) / 10))) >=
                    Math.max(1, Math.ceil((cvs.length || 0) / 10))
                  }
                  onClick={() => setCvsPage((p) => p + 1)}
                >
                  ›
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  )
}

