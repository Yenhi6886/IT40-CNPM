import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { publicApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
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
  const [site, setSite] = useState(null)
  const [error, setError] = useState(null)
  const [regionOpen, setRegionOpen] = useState(false)
  const [regionValue, setRegionValue] = useState('')

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader site={site} />

      <main>
        {/* Hero riêng cho trang Quyền lợi (giống layout trang chủ) */}
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

        {/* Nội dung giữa giống layout ảnh */}
        <section className="border-t bg-white">
          <div className="mx-auto max-w-4xl px-4 py-14">
            {cards?.length ? (
              <div className="space-y-14">
                {cards.map((c, idx) => (
                  <div key={idx} className="text-center">
                    <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{c?.title || 'Tiêu đề'}</h2>
                    <div className="mt-5 overflow-hidden rounded-2xl border bg-muted/20">
                      {c?.imageUrl ? (
                        <img src={c.imageUrl} alt="" className="w-full object-cover" />
                      ) : (
                        <div className="grid aspect-[16/7] place-items-center text-sm text-muted-foreground">
                          Ảnh (admin upload)
                        </div>
                      )}
                    </div>
                    {c?.body ? (
                      <div
                        className="mx-auto mt-5 max-w-3xl ql-editor job-rich-content p-0 text-left text-sm leading-6 text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: renderRichHtml(c.body) }}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                Chưa có nội dung “Quyền lợi”. Vào admin để thêm.
              </div>
            )}
          </div>
        </section>

        {/* KEEP INNOVATING (CTA) riêng cho trang Quyền lợi */}
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

