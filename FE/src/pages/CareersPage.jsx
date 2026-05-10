import { useEffect, useMemo, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import { publicApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { useLocation, useNavigate } from 'react-router-dom'
import Toast from '@/components/Toast'
import {
  BriefcaseBusiness,
  CircleDollarSign,
  Clock,
  MapPin,
  RotateCcw,
  Zap,
} from 'lucide-react'

const WORK_ARRANGEMENT_LABELS = {
  ALL: 'Tất cả',
  FULL_TIME: 'Toàn thời gian',
  PART_TIME: 'Bán thời gian',
  INTERN: 'Thực tập',
  COLLABORATOR: 'Cộng tác viên',
}

const SALARY_BUCKETS = [
  { id: 'negotiable', label: 'Thỏa thuận / không rõ' },
  { id: '0-10', label: '0 – 10 triệu' },
  { id: '10-15', label: '10 – 15 triệu' },
  { id: '15-20', label: '15 – 20 triệu' },
  { id: '20-25', label: '20 – 25 triệu' },
  { id: '25-30', label: '25 – 30 triệu' },
  { id: '30+', label: 'Trên 30 triệu' },
]

/** Khoảng lương (triệu/tháng, hai đầu gồm) để lọc theo giao với khoảng tin tuyển dụng. */
const SALARY_FILTER_RANGES = {
  '0-10': [0, 10],
  '10-15': [10, 15],
  '15-20': [15, 20],
  '20-25': [20, 25],
  '25-30': [25, 30],
  '30+': [30, 500],
}

const PAGE_SIZE = 9

function intervalsOverlapMillion(aLo, aHi, bLo, bHi) {
  return aLo <= bHi && aHi >= bLo
}

const JOB_SECTOR_FILTERS = [
  { id: 'IT', label: 'IT' },
  { id: 'NON_IT', label: 'Non-IT' },
]

const WORK_TYPE_FILTERS = [
  { id: 'FULL_TIME', label: 'Toàn thời gian' },
  { id: 'PART_TIME', label: 'Bán thời gian' },
  { id: 'INTERN', label: 'Thực tập' },
  { id: 'COLLABORATOR', label: 'Cộng tác viên' },
]

const NAVY = '#2b4a8c'

function workArrangementLabel(code) {
  const k = String(code || '').toUpperCase()
  return WORK_ARRANGEMENT_LABELS[k] || '—'
}

function formatCvDeadlineShort(iso) {
  const s = String(iso || '').trim()
  if (!s) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  return s.replaceAll('-', '/')
}

function shortLocation(address) {
  const s = String(address || '').trim()
  if (!s) return '—'
  const parts = s.split(',').map((x) => x.trim()).filter(Boolean)
  if (parts.length >= 2) return parts[parts.length - 1]
  return s.length > 36 ? `${s.slice(0, 33)}…` : s
}

/** Gán một bucket “đại diện” (hiển thị / tin cũ): ưu tiên cấu trúc, sau đó heuristic chuỗi. */
function getSalaryBucket(job) {
  if (job?.salaryNegotiable === true) return 'negotiable'
  const smin = job?.salaryMinMillion
  const smax = job?.salaryMaxMillion
  if (smin != null && smax != null) {
    const a = Number(smin)
    const b = Number(smax)
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const mid = (a + b) / 2
      if (mid <= 10) return '0-10'
      if (mid <= 15) return '10-15'
      if (mid <= 20) return '15-20'
      if (mid <= 25) return '20-25'
      if (mid <= 30) return '25-30'
      return '30+'
    }
  }
  const raw = String(job?.salary || '').trim().toLowerCase()
  if (!raw || /thỏa thuận|thương lượng|negotiat|deal|lương\s*cạnh/.test(raw)) return 'negotiable'
  const nums = []
  const re = /(\d+)\s*(?:triệu|tr\b|m\b)?/gi
  let mm
  while ((mm = re.exec(raw)) !== null) {
    const n = Number(mm[1])
    if (n >= 1 && n <= 500) nums.push(n)
  }
  if (!nums.length) {
    const plain = raw.match(/\d+/g)?.map(Number).filter((n) => n >= 5 && n <= 500) || []
    nums.push(...plain)
  }
  if (!nums.length) return 'negotiable'
  const mid = (Math.min(...nums) + Math.max(...nums)) / 2
  if (mid <= 10) return '0-10'
  if (mid <= 15) return '10-15'
  if (mid <= 20) return '15-20'
  if (mid <= 25) return '20-25'
  if (mid <= 30) return '25-30'
  return '30+'
}

/** Tin có khớp một mức lọc lương không (theo giao khoảng khi có min/max). */
function jobMatchesSalaryFilterBucket(job, bucketId) {
  if (bucketId === 'negotiable') {
    if (job?.salaryNegotiable === true) return true
    const smin = job?.salaryMinMillion
    const smax = job?.salaryMaxMillion
    if (smin != null && smax != null) {
      const a = Number(smin)
      const b = Number(smax)
      if (Number.isFinite(a) && Number.isFinite(b)) return false
    }
    const raw = String(job?.salary || '').trim().toLowerCase()
    if (!raw || /thỏa thuận|thương lượng|negotiat|deal|lương\s*cạnh/.test(raw)) return true
    return getSalaryBucket(job) === 'negotiable'
  }
  const range = SALARY_FILTER_RANGES[bucketId]
  if (!range) return false
  const [bLo, bHi] = range
  const smin = job?.salaryMinMillion
  const smax = job?.salaryMaxMillion
  if (smin != null && smax != null) {
    const a = Number(smin)
    const b = Number(smax)
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const jLo = Math.min(a, b)
      const jHi = Math.max(a, b)
      return intervalsOverlapMillion(jLo, jHi, bLo, bHi)
    }
  }
  return getSalaryBucket(job) === bucketId
}

function jobMatchesSalaryFilters(job, selectedIds) {
  if (!selectedIds?.length) return true
  return selectedIds.some((id) => jobMatchesSalaryFilterBucket(job, id))
}

function countSalaryFilterMatches(jobs, bucketId) {
  let n = 0
  for (const j of jobs || []) {
    if (jobMatchesSalaryFilterBucket(j, bucketId)) n++
  }
  return n
}

function countByBucket(jobs, fnBucket) {
  const m = {}
  for (const j of jobs || []) {
    const k = fnBucket(j)
    m[k] = (m[k] || 0) + 1
  }
  return m
}

function safeJsonObject(text, fallback) {
  try {
    const v = JSON.parse(text || 'null')
    return v && typeof v === 'object' && !Array.isArray(v) ? v : fallback
  } catch {
    return fallback
  }
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

function getJobSectorBucket(job) {
  return isItJob(job) ? 'IT' : 'NON_IT'
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

export default function CareersPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [site, setSite] = useState(null)
  const [jobs, setJobs] = useState([])
  const [error, setError] = useState(null)
  const [listPage, setListPage] = useState(1)
  const [sortMode, setSortMode] = useState('newest') // newest | oldest | title
  const [salaryFilters, setSalaryFilters] = useState([])
  const [sectorFilters, setSectorFilters] = useState([])
  const [workFilters, setWorkFilters] = useState([])
  const [regionOpen, setRegionOpen] = useState(false)
  const [regionValue, setRegionValue] = useState('')
  const [jobTitleOpen, setJobTitleOpen] = useState(false)
  const [jobKeyword, setJobKeyword] = useState('')
  const [applyName, setApplyName] = useState('')
  const [applyEmail, setApplyEmail] = useState('')
  const [applyPhone, setApplyPhone] = useState('')
  const [applyJobId, setApplyJobId] = useState('')
  const [applyCustomJobTitle, setApplyCustomJobTitle] = useState('')
  const [applyCvFile, setApplyCvFile] = useState(null)
  const [applySource, setApplySource] = useState('')
  const [toast, setToast] = useState({ open: false })
  const [selectedJobId, setSelectedJobId] = useState(null)
  const detailRef = useRef(null)
  const applyCvInputRef = useRef(null)
  const [careersHeroReady, setCareersHeroReady] = useState(false)

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

  const careersHeroBgUrl = String(site?.careersHeroBackgroundUrl || '').trim()

  useEffect(() => {
    if (!careersHeroBgUrl) {
      setCareersHeroReady(false)
      return
    }
    let cancelled = false
    setCareersHeroReady(false)
    const img = new Image()
    img.src = careersHeroBgUrl
    img.decoding = 'async'
    img.onload = () => {
      if (!cancelled) setCareersHeroReady(true)
    }
    img.onerror = () => {
      if (!cancelled) setCareersHeroReady(true)
    }
    return () => {
      cancelled = true
    }
  }, [careersHeroBgUrl])

  useEffect(() => {
    const params = new URLSearchParams(location.search || '')
    const raw = params.get('jobId')
    const id = raw ? Number(raw) : null
    if (id && Number.isFinite(id)) setSelectedJobId(id)
    else setSelectedJobId(null)
    setJobKeyword(params.get('keyword') || '')
    setRegionValue(params.get('region') || '')
  }, [location.search])

  useEffect(() => {
    if (!selectedJobId) return
    const idStr = String(selectedJobId)
    if (jobs.some((j) => String(j?.id) === idStr)) {
      setApplyJobId(idStr)
      setApplyCustomJobTitle('')
    }
  }, [selectedJobId, jobs])

  useEffect(() => {
    if (!selectedJobId) return
    const t = setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    return () => clearTimeout(t)
  }, [selectedJobId])

  useEffect(() => {
    const h = String(location?.hash || '')
    if (h === '#apply') {
      const t = setTimeout(() => {
        document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
      return () => clearTimeout(t)
    }
    if (h === '#jobs') {
      const t = setTimeout(() => {
        document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
      return () => clearTimeout(t)
    }
  }, [location?.hash])

  const selectedJob = useMemo(
    () => (selectedJobId ? (jobs || []).find((j) => Number(j?.id) === Number(selectedJobId)) : null),
    [jobs, selectedJobId],
  )

  const jobTitleOptions = useMemo(() => {
    const s = new Set()
    for (const j of jobs || []) {
      const t = String(j?.title || '').trim()
      if (t) s.add(t)
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'vi'))
  }, [jobs])

  const filteredJobs = useMemo(() => {
    const keywordRaw = String(jobKeyword || '').trim()
    const keyword = keywordRaw.toLowerCase()
    const region = String(regionValue || '').trim().toLowerCase()
    const exactTitle = jobTitleOptions.includes(keywordRaw)
    return (jobs || []).filter((j) => {
      const title = String(j?.title || '').trim()
      const titleLc = title.toLowerCase()
      const address = String(j?.address || '').toLowerCase()
      const salary = String(j?.salary || '').toLowerCase()
      const description = String(j?.description || '').toLowerCase()
      let byKeyword = true
      if (keyword) {
        if (exactTitle) byKeyword = title === keywordRaw
        else byKeyword = [titleLc, address, salary, description].some((field) => field.includes(keyword))
      }
      const byRegion = !region || address.includes(region)
      return byKeyword && byRegion
    })
  }, [jobs, jobKeyword, regionValue, jobTitleOptions])

  const salaryCounts = useMemo(() => {
    const m = {}
    for (const b of SALARY_BUCKETS) {
      m[b.id] = countSalaryFilterMatches(filteredJobs, b.id)
    }
    return m
  }, [filteredJobs])
  const sectorCounts = useMemo(() => countByBucket(filteredJobs, getJobSectorBucket), [filteredJobs])
  const workCounts = useMemo(() => {
    const m = {}
    for (const j of filteredJobs || []) {
      const k = String(j?.workArrangement || '').toUpperCase()
      const key = !k || k === 'ALL' ? 'UNSPEC' : k
      m[key] = (m[key] || 0) + 1
    }
    return m
  }, [filteredJobs])

  const marketplaceJobs = useMemo(() => {
    let list = [...(filteredJobs || [])]

    if (salaryFilters.length) {
      list = list.filter((j) => jobMatchesSalaryFilters(j, salaryFilters))
    }
    if (sectorFilters.length) {
      list = list.filter((j) => sectorFilters.includes(getJobSectorBucket(j)))
    }
    if (workFilters.length) {
      list = list.filter((j) => {
        const w = String(j?.workArrangement || '').toUpperCase()
        if (!w || w === 'ALL') return true
        return workFilters.includes(w)
      })
    }

    list.sort((a, b) => {
      if (sortMode === 'title') {
        return String(a.title || '').localeCompare(String(b.title || ''), 'vi')
      }
      const sa = Number(a.sortOrder) || 0
      const sb = Number(b.sortOrder) || 0
      const ida = Number(a.id) || 0
      const idb = Number(b.id) || 0
      if (sortMode === 'oldest') {
        if (sa !== sb) return sa - sb
        return ida - idb
      }
      if (sa !== sb) return sb - sa
      return idb - ida
    })
    return list
  }, [filteredJobs, salaryFilters, sectorFilters, workFilters, sortMode])

  const listPaged = useMemo(
    () => paginate(marketplaceJobs, listPage, PAGE_SIZE),
    [marketplaceJobs, listPage],
  )

  useEffect(() => {
    setListPage(1)
  }, [jobKeyword, regionValue, salaryFilters, sectorFilters, workFilters, sortMode])

  function toggleFilter(arr, setArr, id) {
    setArr((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function resetAdvancedFilters() {
    setSalaryFilters([])
    setSectorFilters([])
    setWorkFilters([])
    setListPage(1)
  }

  function applySearchFilters(nextKeyword = jobKeyword, nextRegion = regionValue) {
    const params = new URLSearchParams(location.search || '')
    if (String(nextKeyword || '').trim()) params.set('keyword', String(nextKeyword || '').trim())
    else params.delete('keyword')
    if (String(nextRegion || '').trim()) params.set('region', String(nextRegion || '').trim())
    else params.delete('region')
    params.delete('jobId')
    const q = params.toString()
    navigate(q ? `/careers?${q}` : '/careers', { replace: true })
  }

  function closeJobDetail() {
    setSelectedJobId(null)
    const params = new URLSearchParams(location.search || '')
    params.delete('jobId')
    const q = params.toString()
    navigate(q ? `/careers?${q}` : '/careers', { replace: true })
    window.setTimeout(() => {
      document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  useEffect(() => {
    function onDocClick(e) {
      const target = e.target
      if (!(target instanceof HTMLElement)) return
      if (target.closest?.('[data-region-dropdown]')) return
      if (target.closest?.('[data-job-title-dropdown]')) return
      setRegionOpen(false)
      setJobTitleOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  function MarketplaceJobCard({ job }) {
    const it = isItJob(job)
    const salaryText = String(job?.salary || '').trim()
    const negotiable = !salaryText || /thỏa thuận|thương lượng/i.test(salaryText)
    const deadline = formatCvDeadlineShort(job.applyEndDate)

    const inner = (
      <>
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/careers/${job.id}`}
            className="line-clamp-2 min-w-0 flex-1 text-sm font-bold leading-snug text-[#2b4a8c] hover:underline md:text-[15px]"
          >
            {job.title}
          </Link>
          <Zap
            className={`mt-0.5 h-5 w-5 shrink-0 ${it ? 'text-amber-500' : 'text-emerald-600'}`}
            aria-hidden
          />
        </div>
        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            <span>{workArrangementLabel(job.workArrangement)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            <span className="line-clamp-1">{shortLocation(job.address)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            <span>Thời hạn: {deadline}</span>
          </div>
        </div>
        <div className="mt-auto mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#e8e8e8] pt-3">
          {negotiable ? (
            <span className="text-sm text-muted-foreground">Lương thỏa thuận</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2b4a8c]">
              <CircleDollarSign className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {salaryText}
            </span>
          )}
          <Link
            to={`/careers/${job.id}#apply`}
            className="rounded-full border border-[#cfd8e6] bg-white px-3 py-1.5 text-xs font-semibold text-[#2b4a8c] transition-colors hover:border-[#2b4a8c]/40 hover:bg-[#f0f5fc]"
            onClick={(e) => e.stopPropagation()}
          >
            Ứng Tuyển
          </Link>
        </div>
      </>
    )

    return (
      <div className="flex h-full flex-col rounded-xl border border-[#e0e0e0] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30">
        {inner}
      </div>
    )
  }

  function MarketplacePagination({ page, totalPages, onChange }) {
    if (totalPages <= 1) return null
    const pages = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      const start = Math.max(2, page - 2)
      const end = Math.min(totalPages - 1, page + 2)
      if (start > 2) pages.push('…')
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < totalPages - 1) pages.push('…')
      pages.push(totalPages)
    }

    return (
      <div className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          className="rounded-full p-2 text-muted-foreground hover:bg-[#e8f0fe] disabled:opacity-35"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Trang trước"
        >
          ‹
        </button>
        {pages.map((p, idx) =>
          p === '…' ? (
            <span key={`e-${idx}`} className="px-2 text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`min-w-[2.25rem] rounded-full px-2 py-1.5 text-sm font-medium ${
                p === page ? 'bg-[#e8f0fe] text-[#2b4a8c]' : 'text-foreground hover:bg-muted/50'
              }`}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className="rounded-full bg-[#e8f0fe] p-2 text-[#2b4a8c] hover:bg-[#dce8fc] disabled:opacity-35"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Trang sau"
        >
          ›
        </button>
      </div>
    )
  }

  function FilterCheckboxRow({ id, label, count, checked, onToggle }) {
    return (
      <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg py-1.5 text-sm hover:bg-muted/30">
        <span className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input accent-[#2b4a8c]"
            checked={checked}
            onChange={() => onToggle(id)}
          />
          <span className="text-foreground/90">{label}</span>
        </span>
        <span className="rounded-full bg-[#e8f0fe] px-2 py-0.5 text-xs font-medium text-[#2b4a8c]">{count}</span>
      </label>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-foreground [--careers-page-bg:#f5f6f8]">
      <Toast toast={toast} onClose={() => setToast({ open: false })} />
      <SiteHeader site={site} />

      <main>
        <section className="relative isolate overflow-hidden bg-[#0c1929]">
          {careersHeroBgUrl ? (
            <img
              src={careersHeroBgUrl}
              alt=""
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                careersHeroReady ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            <div
              className="absolute inset-0 opacity-95"
              style={{
                background: `linear-gradient(135deg, #0f2744 0%, ${NAVY} 45%, #1a5080 100%)`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-[#0c1929]/95" />
          <div
            className="pointer-events-none absolute -right-24 top-1/4 h-96 w-96 rounded-full opacity-30 blur-3xl"
            style={{ background: `radial-gradient(circle, ${NAVY} 0%, transparent 70%)` }}
          />
          <div className="pointer-events-none absolute -left-16 bottom-1/4 h-72 w-72 rounded-full opacity-25 blur-3xl bg-sky-400/40" />

          <div className="relative mx-auto flex min-h-[calc(100vh-56px)] max-w-6xl flex-col justify-center px-4 py-16 md:min-h-[calc(100vh-64px)] md:py-20">
            <div className="mx-auto max-w-4xl text-center">
              {String(site?.careersHeroTitle || '').trim() ? (
                <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white drop-shadow-sm md:text-6xl md:leading-[1.08]">
                  {site.careersHeroTitle}
                </h1>
              ) : (
                <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white drop-shadow-sm md:text-6xl md:leading-[1.08]">
                  Tham gia cùng chúng tôi — phát huy tiềm năng của bạn
                </h1>
              )}
              {site?.careersHeroSubtitle ? (
                <div className="mx-auto mt-5 max-w-3xl text-balance text-base leading-relaxed text-white/85 md:text-lg">
                  <span
                    className="careers-hero-sub [&_a]:text-sky-200 [&_a]:underline [&_a]:underline-offset-2 [&_p]:m-0 [&_p+p]:mt-3"
                    dangerouslySetInnerHTML={{
                      __html: renderRichHtml(site?.careersHeroSubtitle),
                    }}
                  />
                </div>
              ) : null}

              <div className="mx-auto mt-10 grid w-full max-w-5xl grid-cols-1 gap-3 rounded-2xl border border-white/25 bg-white/[0.12] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl md:grid-cols-[1.5fr_1.25fr_auto]">
                <div
                  className="relative flex items-center gap-2 rounded-xl border border-white/20 bg-white/95 px-3 text-sm text-muted-foreground shadow-sm"
                  data-job-title-dropdown
                >
                  <span className="hidden whitespace-nowrap sm:inline">Công việc</span>
                  <button
                    type="button"
                    className="flex h-11 min-w-0 w-full items-center justify-between gap-2 bg-transparent text-left text-foreground outline-none"
                    onClick={() => {
                      setJobTitleOpen((v) => !v)
                      setRegionOpen(false)
                    }}
                    aria-label="Chọn công việc"
                  >
                    <span
                      className={`min-w-0 truncate ${
                        jobKeyword ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {jobTitleOptions.includes(jobKeyword)
                        ? jobKeyword
                        : jobKeyword
                          ? `${jobKeyword} (từ liên kết)`
                          : 'Chọn công việc'}
                    </span>
                    <span className="shrink-0 text-muted-foreground">▾</span>
                  </button>
                  {jobTitleOpen ? (
                    <div
                      className="absolute left-0 top-[calc(100%+10px)] z-50 w-full max-h-[19rem] overflow-y-auto overscroll-contain rounded-xl border bg-white shadow-xl"
                      style={{ maxHeight: 'min(19rem, calc(100vh - 180px))' }}
                      onWheelCapture={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="w-full px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-[#e8f0fe]/80"
                        onClick={() => {
                          setJobKeyword('')
                          setJobTitleOpen(false)
                          applySearchFilters('', regionValue)
                        }}
                      >
                        Tất cả công việc
                      </button>
                      {jobTitleOptions.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-[#e8f0fe]/80"
                          onClick={() => {
                            setJobKeyword(t)
                            setJobTitleOpen(false)
                            applySearchFilters(t, regionValue)
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div
                  className="relative flex items-center gap-2 rounded-xl border border-white/20 bg-white/95 px-3 text-sm text-muted-foreground shadow-sm"
                  data-region-dropdown
                >
                  <span className="hidden whitespace-nowrap sm:inline">Khu vực</span>
                  <button
                    type="button"
                    className="flex h-11 min-w-0 w-full items-center justify-between gap-2 bg-transparent text-left text-foreground outline-none"
                    onClick={() => {
                      setRegionOpen((v) => !v)
                      setJobTitleOpen(false)
                    }}
                    aria-label="Chọn khu vực"
                  >
                    <span
                      className={`min-w-0 truncate ${regionValue ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
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
                      {['Hà Nội', 'Đà Nẵng'].map((x) => (
                        <button
                          key={x}
                          type="button"
                          className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-[#e8f0fe]/80"
                          onClick={() => {
                            setRegionValue(x)
                            setRegionOpen(false)
                            applySearchFilters(jobKeyword, x)
                          }}
                        >
                          {x}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <Button
                  className="h-11 rounded-xl bg-[#2b4a8c] px-6 font-semibold text-white shadow-lg shadow-[#2b4a8c]/25 hover:bg-[#223d73]"
                  aria-label="Tìm kiếm"
                  onClick={() => applySearchFilters(jobKeyword, regionValue)}
                >
                  Tìm kiếm
                </Button>
              </div>

              {error ? <p className="mt-4 text-sm text-red-300">Lỗi: {error}</p> : null}
            </div>
          </div>

          <div className="relative h-16 w-full overflow-hidden md:h-20">
            <svg
              className="absolute bottom-0 left-0 w-full text-[var(--careers-page-bg)]"
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                fill="currentColor"
                d="M0,64L60,58.7C120,53,240,43,360,48C480,53,600,75,720,74.7C840,75,960,53,1080,42.7C1200,32,1320,32,1380,32L1440,32L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"
              />
            </svg>
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
                <Button type="button" variant="outline" onClick={closeJobDetail}>
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

        <section id="jobs" className="border-t bg-[#f5f6f8]">
          <div className="mx-auto max-w-[1320px] px-4 py-10 lg:py-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              {/* Sidebar — bộ lọc nâng cao */}
              <aside className="w-full shrink-0 lg:w-[280px] xl:w-[300px]">
                <div className="sticky top-24 rounded-xl border border-[#e0e0e0] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-2 border-b border-[#e8e8e8] pb-4">
                    <h2 className="text-base font-bold text-[#2b4a8c]">Bộ lọc nâng cao</h2>
                    <button
                      type="button"
                      disabled={
                        salaryFilters.length === 0 &&
                        sectorFilters.length === 0 &&
                        workFilters.length === 0
                      }
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#c5d2ea] bg-[#f4f7fc] px-2.5 py-1.5 text-xs font-semibold text-[#2b4a8c] shadow-[0_1px_2px_rgba(43,74,140,0.06)] transition-colors hover:border-[#2b4a8c]/35 hover:bg-[#e8eef8] active:bg-[#dde6f4] disabled:pointer-events-none disabled:border-[#e8e8e8] disabled:bg-[#f8f9fb] disabled:text-[#9aa8c4] disabled:shadow-none"
                      onClick={resetAdvancedFilters}
                      aria-label="Đặt lại tất cả bộ lọc nâng cao"
                    >
                      <RotateCcw className="size-3.5 shrink-0 opacity-90" strokeWidth={2.25} aria-hidden />
                      Đặt lại
                    </button>
                  </div>

                  <div className="mt-5 space-y-6">
                    <div>
                      <div className="mb-3 text-sm font-bold text-[#2b4a8c]">Mức lương</div>
                      <div className="space-y-0.5">
                        {SALARY_BUCKETS.map((b) => (
                          <FilterCheckboxRow
                            key={b.id}
                            id={b.id}
                            label={b.label}
                            count={salaryCounts[b.id] ?? 0}
                            checked={salaryFilters.includes(b.id)}
                            onToggle={(id) => toggleFilter(salaryFilters, setSalaryFilters, id)}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 text-sm font-bold text-[#2b4a8c]">Lĩnh vực</div>
                      <div className="space-y-0.5">
                        {JOB_SECTOR_FILTERS.map((s) => (
                          <FilterCheckboxRow
                            key={s.id}
                            id={s.id}
                            label={s.label}
                            count={sectorCounts[s.id] ?? 0}
                            checked={sectorFilters.includes(s.id)}
                            onToggle={(id) => toggleFilter(sectorFilters, setSectorFilters, id)}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 text-sm font-bold text-[#2b4a8c]">Loại hình công việc</div>
                      <div className="space-y-0.5">
                        {WORK_TYPE_FILTERS.map((wt) => (
                          <FilterCheckboxRow
                            key={wt.id}
                            id={wt.id}
                            label={wt.label}
                            count={workCounts[wt.id] ?? 0}
                            checked={workFilters.includes(wt.id)}
                            onToggle={(id) => toggleFilter(workFilters, setWorkFilters, id)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main — danh sách */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-4 rounded-xl border border-[#e0e0e0] bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {marketplaceJobs.length ? (
                      <>
                        Vị trí{' '}
                        <span className="font-semibold text-foreground">
                          {(listPaged.page - 1) * PAGE_SIZE + 1} –{' '}
                          {Math.min(listPaged.page * PAGE_SIZE, marketplaceJobs.length)}
                        </span>{' '}
                        của <span className="font-semibold text-foreground">{marketplaceJobs.length}</span> việc làm
                      </>
                    ) : (
                      <span>Không có việc làm phù hợp.</span>
                    )}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Sắp xếp:</span>
                      <select
                        className="h-9 min-w-[9rem] rounded-md border border-input bg-background px-2 text-sm"
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value)}
                      >
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="title">Theo tên A–Z</option>
                      </select>
                    </label>
                  </div>
                </div>

                {listPaged.items.length ? (
                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {listPaged.items.map((j) => (
                      <MarketplaceJobCard key={j.id} job={j} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-8 rounded-xl border border-dashed border-[#e0e0e0] bg-white p-8 text-center text-sm text-muted-foreground">
                    Chưa có tin tuyển dụng phù hợp. Thử đổi bộ lọc hoặc từ khóa tìm kiếm.
                  </div>
                )}

                <MarketplacePagination
                  page={listPaged.page}
                  totalPages={listPaged.totalPages}
                  onChange={setListPage}
                />
              </div>
            </div>
          </div>
        </section>

        <section id="apply" className="border-t bg-white">
          <div className="mx-auto max-w-xl px-4 py-14">
            <h2 className="text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              <span className="text-primary">Ứng</span> tuyển ngay
            </h2>

            <form
              className="mt-8 space-y-5 rounded-xl border border-border bg-white p-6 shadow-sm md:p-8"
              onSubmit={async (e) => {
                  e.preventDefault()
                  try {
                    if (!applyName.trim()) throw new Error('Vui lòng nhập họ và tên')
                    if (!isValidEmail(applyEmail)) throw new Error('Email không hợp lệ')
                    if (!isValidPhone(applyPhone)) throw new Error('Số điện thoại không hợp lệ')
                    if (!applyCvFile) throw new Error('Vui lòng chọn CV')
                    if (!isValidCvFile(applyCvFile)) throw new Error('CV chỉ chấp nhận định dạng pdf/doc/docx')
                    if (applyCvFile.size > 10 * 1024 * 1024) throw new Error('CV tối đa 10MB')
                    if (!applyJobId) throw new Error('Vui lòng chọn vị trí')
                    const picked = Number(applyJobId)
                    if (picked === 0) {
                      if (!applyCustomJobTitle.trim()) throw new Error('Vui lòng nhập vị trí mong muốn')
                    } else if (!Number.isFinite(picked) || picked <= 0) {
                      throw new Error('Vị trí không hợp lệ')
                    }
                    const form = new FormData()
                    form.append('jobId', String(picked))
                    if (picked === 0) form.append('customJobTitle', applyCustomJobTitle.trim())
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
                    setApplyCustomJobTitle('')
                    if (selectedJobId && jobs.some((j) => String(j?.id) === String(selectedJobId))) {
                      setApplyJobId(String(selectedJobId))
                    } else {
                      setApplyJobId('')
                    }
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
              <div>
                <div className="text-sm font-medium text-muted-foreground">CV ứng tuyển *</div>
                <div
                  className="mx-auto mt-2 max-w-md cursor-pointer rounded-xl border-2 border-dashed border-primary/45 bg-muted/5 px-4 py-8 text-center transition-colors hover:bg-muted/10"
                  role="button"
                  tabIndex={0}
                  onClick={() => applyCvInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      applyCvInputRef.current?.click()
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const f = e.dataTransfer.files?.[0]
                    if (f && isValidCvFile(f)) setApplyCvFile(f)
                  }}
                >
                  <input
                    ref={applyCvInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="sr-only"
                    onChange={(e) => setApplyCvFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-sm font-semibold text-primary">Kéo thả hoặc tải lên CV của bạn</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">Chấp nhận file .pdf, .doc, .docx</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 border-primary/30 text-primary hover:bg-primary/5"
                    onClick={(e) => {
                      e.stopPropagation()
                      applyCvInputRef.current?.click()
                    }}
                  >
                    Chọn tệp
                  </Button>
                  {applyCvFile ? (
                    <p className="mt-3 text-xs font-medium text-foreground">{applyCvFile.name}</p>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">Chưa có tệp nào được chọn</p>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Họ và tên *</div>
                <input
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
                  value={applyName}
                  onChange={(e) => setApplyName(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Email *</div>
                <input
                  type="email"
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
                  value={applyEmail}
                  onChange={(e) => setApplyEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Số điện thoại *</div>
                <input
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
                  value={applyPhone}
                  onChange={(e) => setApplyPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Vị trí ứng tuyển *</div>
                <select
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
                  value={applyJobId}
                  onChange={(e) => {
                    setApplyJobId(e.target.value)
                    if (e.target.value !== '0') setApplyCustomJobTitle('')
                  }}
                  required
                >
                  <option value="">Chọn vị trí</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={String(j.id)}>
                      {j.title}
                    </option>
                  ))}
                  <option value="0">Khác</option>
                </select>
                {applyJobId === '0' ? (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-muted-foreground">Vị trí mong muốn *</div>
                    <input
                      className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
                      value={applyCustomJobTitle}
                      onChange={(e) => setApplyCustomJobTitle(e.target.value)}
                      placeholder="Nhập tên vị trí / công việc"
                      required
                    />
                  </div>
                ) : null}
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Bạn biết đến thông tin tuyển dụng qua đâu?
                </div>
                <input
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
                  value={applySource}
                  onChange={(e) => setApplySource(e.target.value)}
                  placeholder="Facebook, LinkedIn, bạn bè..."
                />
              </div>

              <Button type="submit" className="w-full rounded-lg bg-primary py-2.5 font-semibold shadow-sm">
                Gửi ứng tuyển
              </Button>
            </form>
          </div>
        </section>

      </main>

      <SiteFooter site={site} />
    </div>
  )
}

