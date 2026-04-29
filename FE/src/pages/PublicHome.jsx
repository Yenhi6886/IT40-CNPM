import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { publicApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

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
  // If already HTML -> sanitize; else treat as plain text with paragraphs.
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
  const [site, setSite] = useState(null)
  const [jobs, setJobs] = useState([])
  const [error, setError] = useState(null)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [activeCulture, setActiveCulture] = useState(0)
  const [regionOpen, setRegionOpen] = useState(false)
  const [regionValue, setRegionValue] = useState('')

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
  // footer rendering moved to shared SiteFooter

  useEffect(() => {
    if (!tItems.length) return
    const id = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % tItems.length)
    }, 4500)
    return () => clearInterval(id)
  }, [tItems.length])

  useEffect(() => {
    if (!cTabs.length) return
    const id = setInterval(() => {
      setActiveCulture((prev) => (prev + 1) % cTabs.length)
    }, 5500)
    return () => clearInterval(id)
  }, [cTabs.length])

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
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-background" />
            <div className="relative mx-auto flex min-h-[calc(100vh-56px)] max-w-6xl items-center px-4 py-10 md:min-h-[calc(100vh-64px)]">
              <div className="mx-auto max-w-3xl text-center text-white">
                {site?.heroTitle ? (
                  <h1 className="text-balance text-5xl font-bold tracking-tight md:text-7xl">{site.heroTitle}</h1>
                ) : null}
                {site?.heroSubtitle ? (
                  <p className="mt-4 text-balance text-lg text-white/80 md:text-xl">
                    <span
                      className="block"
                      dangerouslySetInnerHTML={{
                        __html: renderRichHtml(site?.heroSubtitle),
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
                  <Button className="h-11 w-11 rounded-full p-0" aria-label="Search">
                    🔍
                  </Button>
                </div>

                {error ? <p className="mt-4 text-sm text-red-200">Lỗi: {error}</p> : null}
              </div>
            </div>
          </section>
        ) : null}

        {/* Đã bỏ mục "Về chúng tôi" khỏi trang chủ theo yêu cầu */}

        {sections?.join !== false ? (
          <section id="join" className="border-t bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-center text-3xl font-extrabold tracking-tight">
              <span className="text-foreground">{joinTitle.split(' ').slice(0, 2).join(' ')}</span>{' '}
              <span className="text-primary">{joinTitle.split(' ').slice(2).join(' ')}</span>
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {(joinCards.length ? joinCards : [1, 2, 3]).map((card, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted/30">
                    {card?.imageUrl ? (
                      <img src={card.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-muted-foreground">
                        Ảnh (admin thêm)
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-foreground">{card?.title || 'Tiêu đề'}</div>
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
                  <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Cơ hội nghề nghiệp</h2>
                  <p className="mt-2 text-muted-foreground">Xem nhanh một số vị trí nổi bật.</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild>
                    <a href="/careers">Xem thêm</a>
                  </Button>
                </div>
              </div>

              {jobs?.length ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {jobs.slice(0, 4).map((j) => (
                    <Link key={j.id} to={`/careers/${j.id}`} className="block">
                      <Card className="overflow-hidden bg-white shadow-sm transition hover:shadow-md hover:bg-[#e9f4ff]">
                        <div className="flex items-stretch gap-4 p-5">
                          <div className="flex shrink-0 items-center">
                            <LogoMark logoUrl={site?.logoUrl} companyName={companyName} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-lg font-semibold text-[#1f6f9e]">{j.title}</div>
                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                              {formatApplyRange(j) ? <div>🕒 {formatApplyRange(j)}</div> : null}
                              {j.address ? <div>📍 {j.address}</div> : null}
                              {j.salary ? <div>💼 {j.salary}</div> : <div>💼 Thỏa thuận</div>}
                            </div>
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
              <h2 className="text-center text-3xl font-extrabold tracking-tight">
                <span className="text-foreground">{tTitle.split(' ').slice(0, 2).join(' ')}</span>{' '}
                <span className="text-primary">{tTitle.split(' ').slice(2).join(' ')}</span>
              </h2>

              {tItems.length ? (
                <div className="mt-10 overflow-hidden rounded-2xl border bg-white shadow-sm kaopiz-slide-in" key={activeTestimonial}>
                  <div className="relative aspect-[16/7]">
                    {tItems[activeTestimonial]?.imageUrl ? (
                      <img
                        src={tItems[activeTestimonial].imageUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-muted/30" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />

                    <div className="absolute bottom-0 left-0 max-w-4xl p-6 text-white md:p-10">
                      <div className="text-5xl leading-none opacity-90">“</div>
                      <p className="mt-3 text-balance text-sm leading-6 text-white/90 md:text-base md:leading-7">
                        <span
                          className="block ql-editor p-0 text-white/90"
                          dangerouslySetInnerHTML={{ __html: renderRichHtml(tItems[activeTestimonial]?.quote) }}
                        />
                      </p>
                      <div className="mt-5 text-sm font-semibold md:text-base">
                        {tItems[activeTestimonial]?.role}
                      </div>

                      <div className="mt-6 flex gap-2">
                        {tItems.map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-2 w-2 rounded-full ${
                              idx === activeTestimonial ? 'bg-white' : 'bg-white/40'
                            }`}
                          />
                        ))}
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
            <h2 className="text-center text-3xl font-extrabold tracking-tight">
              <span className="text-foreground">{cTitle.split(' ').slice(0, 1).join(' ')}</span>{' '}
              <span className="text-primary">{cTitle.split(' ').slice(1).join(' ')}</span>
            </h2>

            {cTabs.length ? (
              <div className="mt-10 culture-carousel">
                <div className="culture-track">
                  {(() => {
                    const total = cTabs.length
                    if (total === 1) {
                      const slide = cTabs[0] || {}
                      return (
                        <div className="culture-card culture-card--main kaopiz-slide-in" key="only">
                          {slide.imageUrl ? (
                            <img src={slide.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
                              Ảnh (admin thêm)
                            </div>
                          )}
                          <div className="culture-overlay" />
                          <div
                            className="culture-caption ql-editor p-0"
                            dangerouslySetInnerHTML={{ __html: renderRichHtml(slide.body || slide.label || '') }}
                          />
                        </div>
                      )
                    }
                    const prev = (activeCulture - 1 + total) % total
                    const next = (activeCulture + 1) % total
                    const order = total === 2 ? [activeCulture, next] : [prev, activeCulture, next]
                    return order.map((idx, pos) => {
                      const slide = cTabs[idx] || {}
                      const isMain = total === 2 ? pos === 0 : pos === 1
                      return (
                        <div
                          key={`${idx}-${isMain ? 'main' : 'side'}`}
                          className={`culture-card ${isMain ? 'culture-card--main kaopiz-slide-in' : 'culture-card--side'}`}
                        >
                          {slide.imageUrl ? (
                            <img src={slide.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
                              Ảnh (admin thêm)
                            </div>
                          )}
                          <div className="culture-overlay" />
                          <div
                            className="culture-caption ql-editor p-0"
                            dangerouslySetInnerHTML={{ __html: renderRichHtml(slide.body || slide.label || '') }}
                          />
                        </div>
                      )
                    })
                  })()}
                </div>
                <div className="mt-6 flex justify-center gap-2">
                  {cTabs.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 w-2 rounded-full ${idx === activeCulture ? 'bg-primary' : 'bg-muted'}`}
                    />
                  ))}
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

        {/* CTA sau Văn hoá - Sự kiện (link tới "Ứng tuyển ngay") */}
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
            <div className="absolute inset-0 bg-black/45" />
            <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-14 text-center text-white">
              <div className="text-3xl font-extrabold tracking-tight md:text-5xl">KEEP INNOVATING</div>
              <Button asChild className="bg-primary">
                <a href="/careers#apply">Ứng tuyển ngay</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {sections?.footer !== false ? <SiteFooter site={site} /> : null}
    </div>
  )
}

