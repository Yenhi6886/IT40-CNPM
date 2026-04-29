import { Link } from 'react-router-dom'

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
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          {site?.logoUrl ? (
            <img src={site.logoUrl} alt={companyName} className="h-8 w-8 rounded-md object-cover" />
          ) : (
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              {(companyName || 'S').trim().slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="leading-tight">
            <div className="text-sm font-semibold">{companyName}</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          {headerNavItems.map((item, idx) => (
            <Link key={idx} className="hover:text-primary" to={item.href || '/'}>
              {item.label || 'Menu'}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/careers#apply"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Ứng tuyển ngay
          </Link>
        </div>
      </div>
    </header>
  )
}

