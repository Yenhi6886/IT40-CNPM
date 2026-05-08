import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { publicApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link, useNavigate } from 'react-router-dom'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { BriefcaseBusiness, CalendarDays, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'

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
  const [activeCulture, setActiveCulture] = useState(0)
  const [cultureStart, setCultureStart] = useState(0)
  const [regionOpen, setRegionOpen] = useState(false)
  const [regionValue, setRegionValue] = useState('')
  const [jobKeyword, setJobKeyword] = useState('')

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

  const benefits = useMemo(() => safeJsonArray(site?.benefitsJson), [site?.benefitsJson])
  const rights = useMemo(() => safeJsonArray(site?.rightsJson), [site?.rightsJson])
  const nav = useMemo(() => safeJsonArray(site?.navJson), [site?.navJson])
  const join = useMemo(() => safeJsonObject(site?.joinKaopizerJson, null), [site?.joinKaopizerJson])
  const testimonials = useMemo(
    () => safeJsonObject(site?.testimonialsJson, null),
    [site?.testimonialsJson],
  )
  const culture = useMemo(
    () => safeJsonObject(site?.cultureEventsJson, null),
    [site?.cultureEventsJson],
  )
  const footer = useMemo(() => safeJsonObject(site?.footerJson, null), [site?.footerJson])
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
  const visibleCultureCount = Math.min(3, cTabs.length || 0)
  const visibleCultureIndexes = useMemo(() => {
    if (!cTabs.length) return []
    return Array.from({ length: visibleCultureCount }, (_, i) => (cultureStart + i) % cTabs.length)
  }, [cTabs.length, cultureStart, visibleCultureCount])

  useEffect(() => {
    if (!cTabs.length) {
      setCultureStart(0)
      setActiveCulture(0)
      return
    }
    setCultureStart((prev) => prev % cTabs.length)
    setActiveCulture((prev) => prev % cTabs.length)
  }, [cTabs.length])

  useEffect(() => {
    if (cTabs.length <= 1) return
    const id = setInterval(() => {
      setCultureStart((prev) => {
        const next = (prev + 1) % cTabs.length
        setActiveCulture(next)
        return next
      })
    }, 4500)
    return () => clearInterval(id)
  }, [cTabs.length])

  function handleCulturePrev() {
    if (!cTabs.length) return
    setCultureStart((prev) => {
      const next = (prev - 1 + cTabs.length) % cTabs.length
      setActiveCulture(next)
      return next
    })
  }

  function handleCultureNext() {
    if (!cTabs.length) return
    setCultureStart((prev) => {
      const next = (prev + 1) % cTabs.length
      setActiveCulture(next)
      return next
    })
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
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader site={site} />

      <main>
        {sections?.hero !== false ? (
          <section
            id="home"
            className="relative"
            style={
              site?.heroBackgroundUrl
                ? {
                    backgroundImage: `url(${site.heroBackgroundUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          >
            <div className="absolute inset-0 bg-black/55" />
            <div className="relative mx-auto flex min-h-[calc(100vh-56px)] max-w-6xl items-center px-4 py-12 md:min-h-[calc(100vh-64px)]">
              <div className="mx-auto max-w-4xl text-center text-white">
                {site?.heroTitle ? (
                  <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">{site.heroTitle}</h1>
                ) : null}
                {site?.heroSubtitle ? (
                  <p className="mx-auto mt-5 max-w-3xl text-balance text-base text-white/85 md:text-lg">
                    <span
                      className="block"
                      dangerouslySetInnerHTML={{
                        __html: renderRichHtml(site?.heroSubtitle),
                      }}
                    />
                  </p>
                ) : null}

                <div className="mx-auto mt-8 grid w-full max-w-5xl grid-cols-1 gap-3 rounded-2xl border border-white/20 bg-white/95 p-4 md:grid-cols-[1.5fr_1.25fr_auto]">
                  <div className="flex items-center gap-2 rounded-lg border bg-white px-3 text-sm text-muted-foreground">
                    <span className="hidden whitespace-nowrap sm:inline">Công việc</span>
                    <input
                      className="h-11 w-full bg-transparent text-foreground outline-none"
                      placeholder="Tìm công việc"
                      aria-label="Tìm công việc"
                      value={jobKeyword}
                      onChange={(e) => setJobKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') goToCareersWithFilters()
                      }}
                    />
                  </div>
                <div className="relative flex items-center gap-2 rounded-lg border bg-white px-3 text-sm text-muted-foreground" data-region-dropdown>
                  <span className="hidden whitespace-nowrap sm:inline">Khu vực</span>
                  <button
                    type="button"
                    className="flex h-11 w-full items-center justify-between gap-2 bg-transparent text-left text-foreground outline-none"
                    onClick={() => setRegionOpen((v) => !v)}
                    aria-label="Chọn khu vực"
                  >
                    <span className={`whitespace-nowrap ${regionValue ? 'text-foreground' : 'text-muted-foreground'}`}>
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
                      {['Hà Nội', 'TP HCM', 'Hải Phòng', 'Tokyo', 'Osaka'].map((x) => (
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
                  <Button className="h-11 rounded-lg px-5" aria-label="Search" onClick={goToCareersWithFilters}>
                    Tìm kiếm
                  </Button>
                </div>

                {error ? <p className="mt-4 text-sm text-red-200">Lỗi: {error}</p> : null}
              </div>
            </div>
          </section>
        ) : null}


        {sections?.join !== false ? (
          <section id="join" className="border-t bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              <span className="text-foreground">{joinTitle.split(' ').slice(0, 2).join(' ')}</span>{' '}
              <span className="text-primary">{joinTitle.split(' ').slice(2).join(' ')}</span>
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {(joinCards.length ? joinCards : [1, 2, 3]).map((card, idx) => (
                <div key={idx} className="space-y-4 rounded-2xl border bg-white p-4">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted/30">
                    {card?.imageUrl ? (
                      <img src={card.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-muted-foreground">
                        Ảnh (admin thêm)
                      </div>
                    )}
                  </div>
                  <div className="text-base font-semibold text-foreground">{card?.title || 'Tiêu đề'}</div>
                  <div className="text-sm leading-6 text-muted-foreground">
                    <div
                      className="ql-editor job-rich-preview p-0"
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
          <section id="careers" className="border-t">
            <div className="mx-auto max-w-6xl px-4 py-14">
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Cơ hội nghề nghiệp</h2>
                  <p className="mt-2 text-muted-foreground">Xem nhanh một số vị trí nổi bật.</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild>
                    <a href="/careers">Xem thêm</a>
                  </Button>
                </div>
              </div>

              {jobs?.length ? (
                <div className="grid grid-cols-2 gap-3 md:gap-6">
                  {jobs.slice(0, 4).map((j) => (
                    <Link key={j.id} to={`/careers/${j.id}`} className="block">
                      <Card className="h-full overflow-hidden border border-border/70 bg-white transition-colors hover:border-primary/40 hover:bg-primary/[0.03]">
                        <div className="grid h-full grid-cols-1 md:grid-cols-[180px_1fr]">
                          <div className="h-full border-b bg-muted/20 md:border-b-0 md:border-r">
                            {j.imageUrl || site?.logoUrl ? (
                              <img
                                src={j.imageUrl || site?.logoUrl}
                                alt={j.title || companyName}
                                className="h-full min-h-24 w-full object-cover md:min-h-40"
                              />
                            ) : (
                              <div className="grid h-full min-h-24 place-items-center md:min-h-40">
                                <LogoMark logoUrl={site?.logoUrl} companyName={companyName} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <CardHeader className="p-3 pb-2 md:p-6 md:pb-2">
                              <div className="flex items-start justify-between gap-3">
                                <CardTitle className="truncate text-sm md:text-lg">{j.title}</CardTitle>
                                <span className="hidden shrink-0 rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-xs font-medium text-primary md:inline-flex">
                                  Tuyển dụng
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-1 p-3 pt-0 text-xs text-muted-foreground md:space-y-2 md:p-6 md:pt-0 md:text-sm">
                              {formatApplyRange(j) ? (
                                <div className="flex items-start gap-2">
                                  <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80 md:h-4 md:w-4" />
                                  <span className="leading-5">{formatApplyRange(j)}</span>
                                </div>
                              ) : null}
                              {j.address ? (
                                <div className="flex items-start gap-2">
                                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80 md:h-4 md:w-4" />
                                  <span className="line-clamp-2 leading-5">{j.address}</span>
                                </div>
                              ) : null}
                              <div className="flex items-start gap-2">
                                <BriefcaseBusiness className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80 md:h-4 md:w-4" />
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
                <Card>
                  <CardHeader>
                    <CardTitle>Chưa có vị trí nào</CardTitle>
                    <CardDescription>Hãy vào admin để thêm thủ công các vị trí tuyển dụng.</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </section>
        ) : null}

        {sections?.testimonials !== false ? (
          <section id="testimonials" className="border-t bg-white">
            <div className="mx-auto max-w-6xl px-4 py-14">
              <h2 className="text-center text-3xl font-bold tracking-tight">
                <span className="text-foreground">{tTitle.split(' ').slice(0, 2).join(' ')}</span>{' '}
                <span className="text-primary">{tTitle.split(' ').slice(2).join(' ')}</span>
              </h2>

              {tItems.length ? (
                <div
                  className="mt-10 overflow-hidden rounded-2xl border border-border/70 bg-white"
                  key={activeTestimonial}
                >
                  <div className="grid grid-cols-1 md:grid-cols-[1.05fr_1fr]">
                    <div className="relative min-h-72 bg-muted/20">
                      {tItems[activeTestimonial]?.imageUrl ? (
                        <img
                          src={tItems[activeTestimonial].imageUrl}
                          alt={tItems[activeTestimonial]?.role || 'Nhân sự'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-sm text-muted-foreground">
                          Ảnh (admin thêm)
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-between bg-white p-6 md:p-8">
                      <div>
                        <div className="text-4xl leading-none text-primary/70">“</div>
                        <div
                          className="ql-editor mt-3 p-0 text-[15px] leading-7 text-foreground/85"
                          dangerouslySetInnerHTML={{ __html: renderRichHtml(tItems[activeTestimonial]?.quote) }}
                        />
                      </div>

                      <div className="mt-6 border-t pt-4">
                        <div className="text-sm font-semibold text-foreground">
                          {tItems[activeTestimonial]?.role || 'Nhân sự'}
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          {tItems.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveTestimonial(idx)}
                              aria-label={`Xem cảm nhận ${idx + 1}`}
                              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                                idx === activeTestimonial ? 'bg-primary' : 'bg-muted-foreground/30 hover:bg-primary/40'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-8 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  Chưa có dữ liệu “Người Savytech nói gì”.
                </div>
              )}
            </div>
          </section>
        ) : null}

        {sections?.culture !== false ? (
          <section id="culture" className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              <span className="text-foreground">{cTitle.split(' ').slice(0, 1).join(' ')}</span>{' '}
              <span className="text-primary">{cTitle.split(' ').slice(1).join(' ')}</span>
            </h2>

            {cTabs.length ? (
              <div className="mt-10 space-y-5">
                <Card className="overflow-hidden border-border/70">
                  <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr]">
                    <div className="h-52 bg-muted/20 md:h-auto md:min-h-64">
                      {cTabs[activeCulture]?.imageUrl ? (
                        <img
                          src={cTabs[activeCulture].imageUrl}
                          alt={cTabs[activeCulture]?.label || 'Văn hóa - sự kiện'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-sm text-muted-foreground">
                          Ảnh (admin thêm)
                        </div>
                      )}
                    </div>
                    <div className="p-4 md:p-6">
                      <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {cTabs[activeCulture]?.label || 'Văn hóa - sự kiện'}
                      </div>
                      <div
                        className="ql-editor mt-2 p-0 text-[15px] leading-7 text-foreground/85"
                        dangerouslySetInnerHTML={{
                          __html: renderRichHtml(cTabs[activeCulture]?.body || cTabs[activeCulture]?.label || ''),
                        }}
                      />
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleCultureIndexes.map((idx) => {
                    const slide = cTabs[idx]
                    return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveCulture(idx)}
                      className="text-left"
                      aria-label={`Xem mục văn hóa sự kiện ${idx + 1}`}
                    >
                      <Card
                        className={`overflow-hidden transition-colors ${
                          idx === activeCulture
                            ? 'border-primary/60 bg-primary/[0.03]'
                            : 'border-border/70 hover:border-primary/40'
                        }`}
                      >
                        <div className="aspect-[16/9] bg-muted/20">
                          {slide?.imageUrl ? (
                            <img
                              src={slide.imageUrl}
                              alt={slide?.label || 'Văn hóa - sự kiện'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-xs text-muted-foreground">
                              Ảnh (admin thêm)
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <div className="truncate text-sm font-medium text-foreground">
                            {slide?.label || `Mục ${idx + 1}`}
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                    )
                  })}
                </div>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCulturePrev}
                    aria-label="Mục trước"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {cTabs.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveCulture(idx)
                        setCultureStart(idx)
                      }}
                      className={`h-2 w-2 rounded-full ${idx === activeCulture ? 'bg-primary' : 'bg-muted'}`}
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCultureNext}
                    aria-label="Mục tiếp theo"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                Chưa có dữ liệu “Văn hoá - Sự kiện”.
              </div>
            )}
          </div>
          </section>
        ) : null}

        <section className="border-t bg-[#0b2d3a]">
          <div
            className="relative overflow-hidden"
            style={
              (site?.ctaBackgroundUrl || site?.heroBackgroundUrl)
                ? {
                    backgroundImage: `url(${site.ctaBackgroundUrl || site.heroBackgroundUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-900/55 to-slate-950/60" />
            <div className="relative mx-auto max-w-6xl px-4 py-14 md:py-16">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-7 text-white backdrop-blur-sm md:p-10">
                <div className="max-w-3xl">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                    Career At Savytech
                  </div>
                  <h3 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">KEEP INNOVATING</h3>
                  <p className="mt-3 text-sm leading-6 text-white/85 md:text-base">
                    Đồng hành cùng đội ngũ giàu kinh nghiệm, phát triển sự nghiệp bền vững và tạo ra giá trị thực tế
                    mỗi ngày.
                  </p>
                  <div className="mt-6">
                    <Button asChild size="lg" className="h-11 rounded-md px-6">
                      <a href="/careers#apply">Ứng tuyển ngay</a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {sections?.footer !== false ? <SiteFooter site={site} /> : null}
    </div>
  )
}

