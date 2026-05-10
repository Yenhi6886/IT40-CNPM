import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { publicApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link, useNavigate } from 'react-router-dom'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Gift,
  MapPin,
} from 'lucide-react'

const NAVY = '#2b4a8c'
const PAGE_BG = '#f5f6f8'

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
        className="h-8 w-8 rounded-md object-cover"
      />
    )
  }
  const letter = (companyName || 'S').trim().slice(0, 1).toUpperCase()
  return (
    <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
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

export default function PublicHome() {
  const navigate = useNavigate()
  const [site, setSite] = useState(null)
  const [jobs, setJobs] = useState([])
  const [error, setError] = useState(null)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  /** Chỉ số thẻ đầu tiên trong “cửa sổ” hiển thị (next/prev dịch từng bước, không cuộn). */
  const [cultureWindowStart, setCultureWindowStart] = useState(0)
  const [cultureColsVisible, setCultureColsVisible] = useState(3)
  const [regionOpen, setRegionOpen] = useState(false)
  const [regionValue, setRegionValue] = useState('')
  const [jobKeyword, setJobKeyword] = useState('')
  const [heroReady, setHeroReady] = useState(false)

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

  const heroBgUrl = String(site?.heroBackgroundUrl || '').trim()

  useEffect(() => {
    if (!heroBgUrl) {
      setHeroReady(false)
      return
    }
    let cancelled = false
    setHeroReady(false)
    const img = new Image()
    img.src = heroBgUrl
    img.decoding = 'async'
    img.onload = () => {
      if (!cancelled) setHeroReady(true)
    }
    img.onerror = () => {
      if (!cancelled) setHeroReady(true)
    }
    return () => {
      cancelled = true
    }
  }, [heroBgUrl])

  const benefits = useMemo(() => safeJsonArray(site?.benefitsJson), [site?.benefitsJson])
  const join = useMemo(() => safeJsonObject(site?.joinKaopizerJson, null), [site?.joinKaopizerJson])
  const testimonials = useMemo(
    () => safeJsonObject(site?.testimonialsJson, null),
    [site?.testimonialsJson],
  )
  const culture = useMemo(
    () => safeJsonObject(site?.cultureEventsJson, null),
    [site?.cultureEventsJson],
  )
  const sections = useMemo(
    () =>
      safeJsonObject(site?.sectionsJson, {
        hero: true,
        about: false,
        join: true,
        careers: true,
        testimonials: true,
        culture: true,
        benefits: true,
        footer: true,
      }),
    [site?.sectionsJson],
  )

  const companyName = site?.companyName || 'Savytech'

  const joinTitle = join?.title || 'TRỞ THÀNH SAVYTECH NGAY HÔM NAY'
  const joinCards = Array.isArray(join?.cards) ? join.cards : []
  const tTitle = testimonials?.title || 'NGƯỜI SAVYTECH NÓI GÌ'
  const tItemsRaw = Array.isArray(testimonials?.items)
    ? testimonials.items
    : Array.isArray(testimonials?.tabs)
      ? testimonials.tabs
      : []
  const tItems = tItemsRaw.map((x) => ({
    imageUrl: x?.imageUrl || x?.avatarUrl || '',
    quote: x?.quote || '',
    role: x?.role || '',
  }))
  const cTitle = culture?.title || 'VĂN HÓA - SỰ KIỆN'
  const cTabs = Array.isArray(culture?.tabs) ? culture.tabs : []

  useEffect(() => {
    function updateCols() {
      const w = window.innerWidth
      if (w < 640) setCultureColsVisible(1)
      else if (w < 1024) setCultureColsVisible(2)
      else setCultureColsVisible(3)
    }
    updateCols()
    window.addEventListener('resize', updateCols)
    return () => window.removeEventListener('resize', updateCols)
  }, [])

  const cultureVisibleCount = Math.min(cultureColsVisible, cTabs.length || 0)
  const cultureVisibleIndexes = useMemo(() => {
    if (!cTabs.length || !cultureVisibleCount) return []
    return Array.from(
      { length: cultureVisibleCount },
      (_, i) => (cultureWindowStart + i) % cTabs.length,
    )
  }, [cTabs.length, cultureWindowStart, cultureVisibleCount])

  useEffect(() => {
    if (!cTabs.length) {
      setCultureWindowStart(0)
      return
    }
    setCultureWindowStart((prev) => prev % cTabs.length)
  }, [cTabs.length])

  function handleCulturePrev() {
    if (!cTabs.length) return
    setCultureWindowStart((s) => (s - 1 + cTabs.length) % cTabs.length)
  }

  function handleCultureNext() {
    if (!cTabs.length) return
    setCultureWindowStart((s) => (s + 1) % cTabs.length)
  }

  function goToCareersWithFilters() {
    const params = new URLSearchParams()
    if (jobKeyword.trim()) params.set('keyword', jobKeyword.trim())
    if (regionValue.trim()) params.set('region', regionValue.trim())
    const query = params.toString()
    navigate(query ? `/careers?${query}` : '/careers')
  }

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

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-foreground [--home-page-bg:#f5f6f8]">
      <SiteHeader site={site} />

      <main>
        {sections?.hero !== false ? (
          <section id="home" className="relative isolate overflow-hidden bg-[#0c1929]">
            {heroBgUrl ? (
              <img
                src={heroBgUrl}
                alt=""
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                  heroReady ? 'opacity-100' : 'opacity-0'
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
                {site?.heroTitle ? (
                  <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white drop-shadow-sm md:text-6xl md:leading-[1.08]">
                    {site.heroTitle}
                  </h1>
                ) : null}
                {site?.heroSubtitle ? (
                  <div className="mx-auto mt-5 max-w-3xl text-balance text-base leading-relaxed text-white/85 md:text-lg">
                    <span
                      className="home-hero-sub [&_a]:text-sky-200 [&_a]:underline [&_a]:underline-offset-2 [&_p]:m-0 [&_p+p]:mt-3"
                      dangerouslySetInnerHTML={{
                        __html: renderRichHtml(site?.heroSubtitle),
                      }}
                    />
                  </div>
                ) : null}

                <div className="mx-auto mt-10 grid w-full max-w-5xl grid-cols-1 gap-3 rounded-2xl border border-white/25 bg-white/[0.12] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl md:grid-cols-[1.5fr_1.25fr_auto]">
                  <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/95 px-3 text-sm text-muted-foreground shadow-sm">
                    <span className="hidden whitespace-nowrap sm:inline">Công việc</span>
                    <input
                      className="h-11 w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground/80"
                      placeholder="Tìm công việc phù hợp…"
                      aria-label="Tìm công việc"
                      value={jobKeyword}
                      onChange={(e) => setJobKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') goToCareersWithFilters()
                      }}
                    />
                  </div>
                  <div
                    className="relative flex items-center gap-2 rounded-xl border border-white/20 bg-white/95 px-3 text-sm text-muted-foreground shadow-sm"
                    data-region-dropdown
                  >
                    <span className="hidden whitespace-nowrap sm:inline">Khu vực</span>
                    <button
                      type="button"
                      className="flex h-11 w-full items-center justify-between gap-2 bg-transparent text-left text-foreground outline-none"
                      onClick={() => setRegionOpen((v) => !v)}
                      aria-label="Chọn khu vực"
                    >
                      <span
                        className={`whitespace-nowrap ${regionValue ? 'text-foreground' : 'text-muted-foreground'}`}
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
                    onClick={goToCareersWithFilters}
                  >
                    Tìm kiếm
                  </Button>
                </div>

                {error ? <p className="mt-4 text-sm text-red-300">Lỗi: {error}</p> : null}
              </div>
            </div>

            <div className="relative h-16 w-full overflow-hidden md:h-20">
              <svg
                className="absolute bottom-0 left-0 w-full text-[var(--home-page-bg)]"
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
        ) : null}

        {benefits.length ? (
          <section className="relative border-b border-[#e4e8ef] bg-white py-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2b4a8c]/20 to-transparent" />
            <div className="mx-auto max-w-[1200px] px-4">
              <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-[#2b4a8c]/80">
                {String(site?.benefitsTitle || '').trim() || 'Quyền lợi nổi bật'}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2.5 md:gap-3">
                {benefits.map((p, i) => (
                  <span
                    key={`${p}-${i}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#cfd8e6] bg-[#f5f8fc] px-4 py-2 text-sm font-medium text-[#2b4a8c] shadow-sm transition-colors hover:border-[#2b4a8c]/35 hover:bg-[#e8f0fe]"
                  >
                    <Gift className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {sections?.join !== false ? (
          <section id="join" className="border-t border-transparent py-14 md:py-20" style={{ backgroundColor: PAGE_BG }}>
            <div className="mx-auto max-w-[1200px] px-4">
              <div className="mx-auto mb-12 flex flex-col items-center md:mb-14">
                <h2
                  className="inline-block max-w-full whitespace-nowrap text-center font-extrabold leading-tight tracking-tight text-[#212529]"
                  style={{ fontSize: 'clamp(0.8rem, 3.4vw, 2.25rem)' }}
                >
                  <span>{joinTitle.split(' ').slice(0, 2).join(' ')}</span>{' '}
                  <span style={{ color: NAVY }}>{joinTitle.split(' ').slice(2).join(' ')}</span>
                </h2>
                <div className="mx-auto mt-4 h-1 w-14 shrink-0 rounded-full bg-gradient-to-r from-[#2b4a8c] to-sky-400/80" />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
                {(joinCards.length ? joinCards : [1, 2, 3]).map((card, idx) => (
                  <div
                    key={idx}
                    className="group overflow-hidden rounded-3xl border border-[#e0e0e0] bg-white p-5 shadow-[0_8px_40px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(43,74,140,0.12)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted/30">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#2b4a8c]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      {card?.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-xs text-muted-foreground">
                          Ảnh (admin thêm)
                        </div>
                      )}
                    </div>
                    <div className="mt-4 text-lg font-bold text-[#2b4a8c]">{card?.title || 'Tiêu đề'}</div>
                    <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      <div
                        className="ql-editor job-rich-preview p-0 [&_p]:m-0 [&_p+p]:mt-2"
                        dangerouslySetInnerHTML={{ __html: renderRichHtml(card?.body || 'Nội dung mô tả...') }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {sections?.careers !== false ? (
          <section id="careers" className="border-t border-[#e8edf3] bg-white py-14 md:py-20">
            <div className="mx-auto max-w-[1200px] px-4">
              <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between md:mb-12">
                <div className="max-w-xl">
                  <h2 className="text-3xl font-extrabold tracking-tight text-[#212529] md:text-4xl">
                    Cơ hội <span style={{ color: NAVY }}>nghề nghiệp</span>
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                    Một vài vị trí đang mở — xem đầy đủ bộ lọc và ứng tuyển trên trang tuyển dụng.
                  </p>
                  <div className="mt-4 h-1 w-14 rounded-full bg-gradient-to-r from-[#2b4a8c] to-sky-400/80" />
                </div>
                <Button
                  asChild
                  className="h-11 shrink-0 rounded-xl bg-[#2b4a8c] px-6 font-semibold text-white shadow-md hover:bg-[#223d73]"
                >
                  <a href="/careers#jobs" className="inline-flex items-center gap-2">
                    Xem tất cả
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                </Button>
              </div>

              {jobs?.length ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
                  {jobs.slice(0, 4).map((j) => (
                    <Link key={j.id} to={`/careers/${j.id}`} className="group block">
                      <Card className="h-full overflow-hidden rounded-3xl border border-[#e0e0e0] bg-white shadow-[0_8px_40px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2b4a8c]/35 hover:shadow-[0_16px_48px_rgba(43,74,140,0.12)]">
                        <div className="grid h-full grid-cols-1 md:grid-cols-[180px_1fr]">
                          <div className="relative h-full overflow-hidden border-b border-[#eef1f5] bg-muted/20 md:border-b-0 md:border-r md:border-[#eef1f5]">
                            {j.imageUrl || site?.logoUrl ? (
                              <img
                                src={j.imageUrl || site?.logoUrl}
                                alt={j.title || companyName}
                                className="relative z-0 h-full min-h-28 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] md:min-h-40"
                              />
                            ) : (
                              <div className="relative z-0 grid h-full min-h-28 place-items-center md:min-h-40">
                                <LogoMark logoUrl={site?.logoUrl} companyName={companyName} />
                              </div>
                            )}
                            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-tr from-[#2b4a8c]/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                          <div className="min-w-0">
                            <CardHeader className="p-4 pb-2 md:p-6 md:pb-2">
                              <div className="flex items-start justify-between gap-3">
                                <CardTitle className="line-clamp-2 text-left text-sm font-bold text-[#2b4a8c] md:text-lg">
                                  {j.title}
                                </CardTitle>
                                <span className="hidden shrink-0 rounded-full border border-[#cfd8e6] bg-[#e8f0fe] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#2b4a8c] md:inline-flex">
                                  Tuyển
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2 p-4 pt-0 text-xs text-muted-foreground md:p-6 md:pt-0 md:text-sm">
                              {formatApplyRange(j) ? (
                                <div className="flex items-start gap-2">
                                  <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80 md:h-4 md:w-4" />
                                  <span className="leading-5">{formatApplyRange(j)}</span>
                                </div>
                              ) : null}
                              {j.address ? (
                                <div className="flex items-start gap-2">
                                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80 md:h-4 md:w-4" />
                                  <span className="line-clamp-2 leading-5">{j.address}</span>
                                </div>
                              ) : null}
                              <div className="flex items-start gap-2">
                                <BriefcaseBusiness className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80 md:h-4 md:w-4" />
                                <span className="leading-5">{j.salary || 'Thỏa thuận'}</span>
                              </div>
                            </CardContent>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border-2 border-dashed border-[#cfd8e6] bg-[#fafbfc] px-8 py-14 text-center">
                  <p className="text-base font-semibold text-[#2b4a8c]">Chưa có vị trí nào</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Vào admin để thêm tin tuyển dụng và hiển thị tại đây.
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {sections?.testimonials !== false ? (
          <section id="testimonials" className="border-t border-transparent py-14 md:py-20" style={{ backgroundColor: PAGE_BG }}>
            <div className="mx-auto max-w-[1200px] px-4">
              <div className="mx-auto mb-12 max-w-2xl text-center md:mb-14">
                <h2 className="text-3xl font-extrabold tracking-tight text-[#212529] md:text-4xl">
                  <span>{tTitle.split(' ').slice(0, 2).join(' ')}</span>{' '}
                  <span style={{ color: NAVY }}>{tTitle.split(' ').slice(2).join(' ')}</span>
                </h2>
                <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-gradient-to-r from-[#2b4a8c] to-sky-400/80" />
              </div>

              {tItems.length ? (
                <div
                  className="overflow-hidden rounded-3xl border border-[#e0e0e0] bg-white shadow-[0_8px_40px_rgba(15,23,42,0.06)]"
                  key={activeTestimonial}
                >
                  <div className="grid grid-cols-1 md:grid-cols-[1.05fr_1fr]">
                    <div className="relative min-h-72 overflow-hidden bg-muted/25">
                      {tItems[activeTestimonial]?.imageUrl ? (
                        <img
                          src={tItems[activeTestimonial].imageUrl}
                          alt={tItems[activeTestimonial]?.role || 'Nhân sự'}
                          className="relative z-0 h-full min-h-72 w-full object-cover"
                        />
                      ) : (
                        <div className="relative z-0 grid min-h-72 place-items-center text-sm text-muted-foreground">
                          Ảnh (admin thêm)
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-tr from-[#2b4a8c]/20 to-transparent" />
                    </div>

                    <div className="flex flex-col justify-between p-6 md:p-10">
                      <div>
                        <div className="text-5xl font-serif leading-none text-[#2b4a8c]/35">“</div>
                        <div
                          className="ql-editor mt-2 p-0 text-[15px] leading-[1.75] text-foreground/85"
                          dangerouslySetInnerHTML={{ __html: renderRichHtml(tItems[activeTestimonial]?.quote) }}
                        />
                      </div>

                      <div className="mt-8 border-t border-[#e8edf3] pt-6">
                        <div className="text-sm font-bold text-[#2b4a8c]">
                          {tItems[activeTestimonial]?.role || 'Nhân sự'}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {tItems.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveTestimonial(idx)}
                              aria-label={`Xem cảm nhận ${idx + 1}`}
                              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                                idx === activeTestimonial
                                  ? 'bg-[#2b4a8c]'
                                  : 'bg-muted-foreground/30 hover:bg-[#2b4a8c]/40'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border-2 border-dashed border-[#cfd8e6] bg-white px-8 py-14 text-center text-sm text-muted-foreground">
                  Chưa có dữ liệu “Người Savytech nói gì”.
                </div>
              )}
            </div>
          </section>
        ) : null}

        {sections?.culture !== false ? (
          <section id="culture" className="border-t border-[#e8edf3] bg-white py-14 md:py-20">
            <div className="mx-auto max-w-[1200px] px-4">
              <div className="mx-auto mb-12 max-w-2xl text-center md:mb-14">
                <h2 className="text-3xl font-extrabold tracking-tight text-[#212529] md:text-4xl">
                  <span>{cTitle.split(' ').slice(0, 1).join(' ')}</span>{' '}
                  <span style={{ color: NAVY }}>{cTitle.split(' ').slice(1).join(' ')}</span>
                </h2>
                <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-gradient-to-r from-[#2b4a8c] to-sky-400/80" />
              </div>

              {cTabs.length ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                    {cultureVisibleIndexes.map((idx) => {
                      const slide = cTabs[idx]
                      const isLead = idx === cultureWindowStart
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCultureWindowStart(idx)}
                          className="text-left"
                          aria-label={`Mục ${idx + 1}: ${slide?.label || ''}`}
                          aria-current={isLead ? 'true' : undefined}
                        >
                          <div
                            className={`group flex min-h-[260px] flex-col overflow-hidden rounded-3xl border bg-white shadow-[0_8px_40px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2b4a8c]/35 hover:shadow-[0_16px_48px_rgba(43,74,140,0.1)] ${
                              isLead
                                ? 'border-[#2b4a8c] shadow-[0_0_0_3px_rgba(43,74,140,0.1)]'
                                : 'border-[#e0e0e0]'
                            }`}
                          >
                            <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-muted/25">
                              <div className="absolute inset-0 z-[1] bg-gradient-to-tr from-[#2b4a8c]/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                              {slide?.imageUrl ? (
                                <img
                                  src={slide.imageUrl}
                                  alt={slide?.label || 'Văn hóa - sự kiện'}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                />
                              ) : (
                                <div className="grid h-full place-items-center text-xs text-muted-foreground">
                                  Ảnh (admin thêm)
                                </div>
                              )}
                            </div>
                            <div className="flex flex-1 flex-col p-4 pb-5">
                              <div className="line-clamp-3 text-sm font-bold leading-snug text-[#2b4a8c] md:text-[15px]">
                                {slide?.label || `Mục ${idx + 1}`}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex items-center justify-center gap-4 pt-2">
                    <button
                      type="button"
                      className="rounded-full border border-[#e0e0e0] bg-white p-2.5 text-muted-foreground shadow-sm transition-colors hover:bg-[#e8f0fe] disabled:opacity-35"
                      disabled={cTabs.length <= 1}
                      onClick={handleCulturePrev}
                      aria-label="Slide trước"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="min-w-[4rem] text-center text-xs tabular-nums text-muted-foreground">
                      {cultureWindowStart + 1} / {cTabs.length}
                    </span>
                    <button
                      type="button"
                      className="rounded-full border border-[#e0e0e0] bg-white p-2.5 text-muted-foreground shadow-sm transition-colors hover:bg-[#e8f0fe] disabled:opacity-35"
                      disabled={cTabs.length <= 1}
                      onClick={handleCultureNext}
                      aria-label="Slide tiếp"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border-2 border-dashed border-[#cfd8e6] bg-[#fafbfc] p-10 text-center text-sm text-muted-foreground">
                  Chưa có dữ liệu “Văn hoá - Sự kiện”.
                </div>
              )}
            </div>
          </section>
        ) : null}
      </main>

      {sections?.footer !== false ? <SiteFooter site={site} /> : null}
    </div>
  )
}

