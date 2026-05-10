import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { publicApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Gift, Sparkles } from 'lucide-react'

function safeJsonArray(text) {
  try {
    const v = JSON.parse(text || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
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

const NAVY = '#2b4a8c'
const PAGE_BG = '#f5f6f8'

export default function BenefitsPage() {
  const navigate = useNavigate()
  const [site, setSite] = useState(null)
  const [error, setError] = useState(null)
  const [regionOpen, setRegionOpen] = useState(false)
  const [regionValue, setRegionValue] = useState('')
  const [jobKeyword, setJobKeyword] = useState('')
  const [heroReady, setHeroReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    publicApi
      .site()
      .then((s) => {
        if (cancelled) return
        setSite(s)
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
    function onDocClick(e) {
      const target = e.target
      if (!(target instanceof HTMLElement)) return
      if (target.closest?.('[data-region-dropdown]')) return
      setRegionOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const heroBackgroundUrl = String(site?.benefitsHeroBackgroundUrl || '').trim()
  const companyName = site?.companyName || 'Savytech'
  const perks = useMemo(() => safeJsonArray(site?.benefitsJson), [site?.benefitsJson])
  const cards = useMemo(() => safeJsonArray(site?.benefitsPageJson), [site?.benefitsPageJson])
  const benefitsSectionTitle = String(site?.benefitsTitle || '').trim() || 'Quyền lợi nổi bật'

  useEffect(() => {
    if (!heroBackgroundUrl) {
      setHeroReady(false)
      return
    }

    let cancelled = false
    setHeroReady(false)
    const img = new Image()
    img.src = heroBackgroundUrl
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
  }, [heroBackgroundUrl])

  function goToCareersWithFilters() {
    const params = new URLSearchParams()
    if (jobKeyword.trim()) params.set('keyword', jobKeyword.trim())
    if (regionValue.trim()) params.set('region', regionValue.trim())
    const query = params.toString()
    navigate(query ? `/careers?${query}` : '/careers')
  }

  const heroTitle =
    String(site?.benefitsHeroTitle || '').trim() || `Quyền lợi tại ${companyName}`

  return (
    <div className="min-h-screen bg-[var(--benefits-page-bg)] text-foreground [--benefits-page-bg:#f5f6f8]">
      <SiteHeader site={site} />

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-[#0c1929]">
          {heroBackgroundUrl ? (
            <img
              src={heroBackgroundUrl}
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
              className="absolute inset-0 opacity-90"
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
          <div
            className="pointer-events-none absolute -left-16 bottom-0 h-72 w-72 rounded-full opacity-25 blur-3xl"
            style={{ background: 'radial-gradient(circle, #38bdf8 0%, transparent 65%)' }}
          />

          <div className="relative mx-auto flex min-h-[calc(100vh-56px)] max-w-6xl flex-col justify-center px-4 py-16 md:min-h-[calc(100vh-64px)] md:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/90 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
                Trải nghiệm nhân viên
              </div>
              <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white drop-shadow-sm md:text-6xl md:leading-[1.08]">
                {heroTitle}
              </h1>
              {site?.benefitsHeroSubtitle ? (
                <div className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-white/85 md:text-lg">
                  <span
                    className="benefits-hero-sub [&_a]:text-sky-200 [&_a]:underline [&_a]:underline-offset-2 [&_p]:m-0 [&_p+p]:mt-3"
                    dangerouslySetInnerHTML={{
                      __html: renderRichHtml(site.benefitsHeroSubtitle),
                    }}
                  />
                </div>
              ) : (
                <p className="mx-auto mt-5 max-w-xl text-balance text-base text-white/80 md:text-lg">
                  Đầu tư cho con người — môi trường minh bạch, phúc lợi rõ ràng và lộ trình phát triển bền vững.
                </p>
              )}

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
                      {['Hà Nội', 'TP HCM', 'Hải Phòng', 'Tokyo', 'Osaka', 'Đà Nẵng'].map((x) => (
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

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
                <Link
                  to="/careers"
                  className="inline-flex items-center gap-2 font-semibold text-white/95 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  Xem tất cả vị trí
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <span className="hidden text-white/40 sm:inline">·</span>
                <Link to="/" className="text-white/75 transition-colors hover:text-white">
                  Về trang chủ
                </Link>
              </div>

              {error ? <p className="mt-4 text-sm text-red-300">Lỗi: {error}</p> : null}
            </div>
          </div>

          <div className="relative h-16 w-full overflow-hidden md:h-20">
            <svg
              className="absolute bottom-0 left-0 w-full text-[var(--benefits-page-bg)]"
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

        {/* Chips từ CMS */}
        {perks.length ? (
          <section className="relative border-b border-[#e4e8ef] bg-white py-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2b4a8c]/20 to-transparent" />
            <div className="mx-auto max-w-[1200px] px-4">
              <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-[#2b4a8c]/80">
                {benefitsSectionTitle}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2.5 md:gap-3">
                {perks.map((p, i) => (
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

        {/* Nội dung chi tiết */}
        <section className="border-t border-transparent py-14 md:py-20" style={{ backgroundColor: PAGE_BG }}>
          <div className="mx-auto max-w-[1200px] px-4">
            <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#212529] md:text-4xl">
                Chi tiết <span style={{ color: NAVY }}>quyền lợi</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                Mỗi hạng mục được cập nhật trực tiếp từ đội ngũ nhân sự — cuộn để khám phá lợi ích dành cho bạn.
              </p>
            </div>

            {cards?.length ? (
              <div className="flex flex-col gap-12 md:gap-16 lg:gap-20">
                {cards.map((c, idx) => {
                  const n = String(idx + 1).padStart(2, '0')
                  const reverse = idx % 2 === 1
                  return (
                    <article
                      key={idx}
                      className="group relative overflow-hidden rounded-3xl border border-[#e0e0e0] bg-white shadow-[0_8px_40px_rgba(15,23,42,0.06)] transition-shadow duration-300 hover:shadow-[0_16px_48px_rgba(43,74,140,0.12)]"
                    >
                      <div
                        className={`flex flex-col md:flex-row ${reverse ? 'md:flex-row-reverse' : ''}`}
                      >
                        <div className="relative min-h-[240px] w-full overflow-hidden bg-gradient-to-br from-muted/40 to-muted/15 md:min-h-[320px] md:w-1/2 md:max-w-[50%] md:flex-shrink-0">
                          <div className="absolute left-0 top-0 z-10 flex items-center gap-2 rounded-br-3xl bg-[#2b4a8c] px-5 py-2.5 text-sm font-bold tracking-wide text-white shadow-md">
                            <span className="opacity-70">#</span>
                            {n}
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-tr from-[#2b4a8c]/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          {c?.imageUrl ? (
                            <img
                              src={c.imageUrl}
                              alt={c?.title || 'Quyền lợi'}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground md:min-h-[320px]">
                              <Gift className="h-12 w-12 opacity-25" aria-hidden />
                              <span className="text-sm">Ảnh minh họa (admin upload)</span>
                            </div>
                          )}
                        </div>
                        <div className="flex w-full flex-col justify-center p-6 md:w-1/2 md:max-w-[50%] md:flex-shrink-0 md:p-10 lg:p-12">
                          <div className="mb-3 inline-flex w-fit rounded-full bg-[#e8f0fe] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#2b4a8c]">
                            Quyền lợi
                          </div>
                          <h3 className="text-2xl font-bold leading-tight tracking-tight text-[#2b4a8c] md:text-3xl">
                            {c?.title || 'Tiêu đề'}
                          </h3>
                          <div className="mt-2 h-1 w-14 rounded-full bg-gradient-to-r from-[#2b4a8c] to-sky-400/80" />
                          <div className="mt-6 max-w-prose">
                            {c?.body ? (
                              <div
                                className="ql-editor job-rich-content benefits-detail-rich text-[15px] leading-[1.75] text-foreground/85 [&_p]:m-0 [&_p+p]:mt-4 [&_ul]:my-4 [&_li]:my-1"
                                dangerouslySetInnerHTML={{ __html: renderRichHtml(c.body) }}
                              />
                            ) : (
                              <p className="text-sm text-muted-foreground">Nội dung đang được cập nhật.</p>
                            )}
                          </div>
                          <div className="mt-8">
                            <Link
                              to="/careers"
                              className="inline-flex items-center gap-2 text-sm font-semibold text-[#2b4a8c] transition-colors hover:text-[#1e3a6e]"
                            >
                              Khám phá cơ hội nghề nghiệp
                              <ArrowRight className="h-4 w-4" aria-hidden />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="mx-auto max-w-lg rounded-3xl border-2 border-dashed border-[#cfd8e6] bg-white px-8 py-16 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f0fe] text-[#2b4a8c]">
                  <Gift className="h-8 w-8 opacity-90" aria-hidden />
                </div>
                <p className="text-base font-semibold text-[#2b4a8c]">Chưa có nội dung chi tiết</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Vào trang quản trị để thêm các mục “Quyền lợi” (ảnh + tiêu đề + nội dung).
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter site={site} />
    </div>
  )
}
