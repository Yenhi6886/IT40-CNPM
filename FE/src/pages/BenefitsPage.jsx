import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { publicApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { useNavigate } from 'react-router-dom'

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

export default function BenefitsPage() {
  const navigate = useNavigate()
  const [site, setSite] = useState(null)
  const [error, setError] = useState(null)
  const [regionOpen, setRegionOpen] = useState(false)
  const [regionValue, setRegionValue] = useState('')
  const [jobKeyword, setJobKeyword] = useState('')

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

  const cards = useMemo(() => safeJsonArray(site?.benefitsPageJson), [site?.benefitsPageJson])

  function goToCareersWithFilters() {
    const params = new URLSearchParams()
    if (jobKeyword.trim()) params.set('keyword', jobKeyword.trim())
    if (regionValue.trim()) params.set('region', regionValue.trim())
    const query = params.toString()
    navigate(query ? `/careers?${query}` : '/careers')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader site={site} />

      <main>
        <section
          className="relative"
          style={
            site?.benefitsHeroBackgroundUrl
              ? {
                  backgroundImage: `url(${site.benefitsHeroBackgroundUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-background" />
          <div className="relative mx-auto flex min-h-[calc(100vh-56px)] max-w-6xl items-center px-4 py-10 md:min-h-[calc(100vh-64px)]">
            <div className="mx-auto max-w-3xl text-center text-white">
              {site?.benefitsHeroTitle ? (
                <h1 className="text-balance text-5xl font-bold tracking-tight md:text-7xl">{site.benefitsHeroTitle}</h1>
              ) : null}
              {site?.benefitsHeroSubtitle ? (
                <p className="mt-4 text-balance text-lg text-white/80 md:text-xl">
                  <span
                    className="block"
                    dangerouslySetInnerHTML={{
                      __html: renderRichHtml(site?.benefitsHeroSubtitle),
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
                <Button className="h-11 rounded-lg px-5" aria-label="Search" onClick={goToCareersWithFilters}>
                  Tìm kiếm
                </Button>
              </div>
              {error ? <p className="mt-4 text-sm text-red-200">Lỗi: {error}</p> : null}
            </div>
          </div>
        </section>

        <section className="border-t bg-white">
          <div className="mx-auto max-w-4xl px-4 py-14">
            {cards?.length ? (
              <div className="space-y-8">
                {cards.map((c, idx) => (
                  <Card key={idx} className="overflow-hidden border-border/70">
                    <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
                      <div className="bg-muted/20">
                        {c?.imageUrl ? (
                          <img
                            src={c.imageUrl}
                            alt={c?.title || 'Bài viết quyền lợi'}
                            className="h-full min-h-56 w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full min-h-56 place-items-center text-sm text-muted-foreground">
                            Ảnh (admin upload)
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xl tracking-tight md:text-2xl">
                            {c?.title || 'Tiêu đề'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {c?.body ? (
                            <div
                              className="ql-editor job-rich-content p-0 text-sm leading-7 text-foreground/85"
                              dangerouslySetInnerHTML={{ __html: renderRichHtml(c.body) }}
                            />
                          ) : (
                            <div className="text-sm text-muted-foreground">Nội dung đang được cập nhật.</div>
                          )}
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                Chưa có nội dung “Quyền lợi”. Vào admin để thêm.
              </div>
            )}
          </div>
        </section>

        <section className="border-t bg-[#0b2d3a]">
          <div
            className="relative overflow-hidden"
            style={
              site?.benefitsCtaBackgroundUrl
                ? {
                    backgroundImage: `url(${site?.benefitsCtaBackgroundUrl})`,
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

      <SiteFooter site={site} />
    </div>
  )
}

