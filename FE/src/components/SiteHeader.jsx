import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

function safeJsonArray(text) {
  try {
    const v = JSON.parse(text || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function normalizeNavHref(href) {
  const raw = String(href || '').trim()
  if (!raw) return '/'
  if (raw.startsWith('#')) {
    const lower = raw.toLowerCase()
    if (lower === '#home') return '/'
    if (lower === '#careers') return '/careers'
    if (lower === '#benefits') return '/benefits'
    return `/${raw}`
  }
  return raw
}

export default function SiteHeader({ site }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const companyName = site?.companyName || 'Savytech'
  const nav = safeJsonArray(site?.navJson)
  const navItems = nav?.length
    ? nav
    : [
        { label: 'Trang chủ', href: '/' },
        { label: 'Cơ hội nghề nghiệp', href: '/careers' },
        { label: 'Quyền lợi', href: '/benefits' },
      ]

  const headerNavItems = (navItems || [])
    .filter((x) => {
      const href = String(x?.href || '').toLowerCase()
      return href !== '#about' && href !== '#culture'
    })
    .map((x) => ({ ...x, href: normalizeNavHref(x?.href) }))

  return (
    <header className="sticky top-0 z-40 border-b border-white/30 bg-white/60 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/45">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3">
        <Link to="/" className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 sm:flex-initial">
          {site?.logoUrl ? (
            <img
              src={site.logoUrl}
              alt={companyName}
              className="h-8 w-8 shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              {(companyName || 'S').trim().slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1 leading-tight sm:flex-initial">
            <div className="truncate bg-gradient-to-r from-sky-600 via-cyan-500 to-blue-600 bg-clip-text text-lg font-extrabold tracking-tight text-transparent sm:text-xl md:text-2xl">
              {companyName}
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-3 text-base md:flex">
          {headerNavItems.map((item, idx) => (
            <Link
              key={idx}
              className="rounded-md px-3 py-2 font-medium text-foreground/90 transition-colors hover:bg-muted hover:text-primary"
              to={item.href || '/'}
            >
              {item.label || 'Menu'}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            to="/careers#apply"
            className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#32a6e8] px-3 py-2.5 text-[13px] font-medium leading-none text-white shadow-[0_2px_10px_rgba(50,166,232,0.28)] transition-colors hover:bg-[#2d9cdd] min-[400px]:px-5 min-[400px]:text-[14px] md:px-7 md:py-3 md:text-[15px]"
          >
            <span className="min-[400px]:hidden">Ứng tuyển</span>
            <span className="hidden min-[400px]:inline">Ứng tuyển ngay</span>
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border bg-background/80 text-foreground touch-manipulation md:hidden"
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen ? (
        <div className="border-t border-white/30 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <nav className="flex flex-col gap-1">
            {headerNavItems.map((item, idx) => (
              <Link
                key={idx}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/90 transition-colors hover:bg-muted hover:text-primary"
                to={item.href || '/'}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label || 'Menu'}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  )
}

