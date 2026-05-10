import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronUp } from 'lucide-react'

const NAVY = '#002060'
const MUTED = '#666666'
const BORDER = '#e0e0e0'

function safeJsonObject(text, fallback) {
  try {
    const v = JSON.parse(text || 'null')
    return v && typeof v === 'object' && !Array.isArray(v) ? v : fallback
  } catch {
    return fallback
  }
}

function defaultLinkColumns(companyName) {
  const brand = companyName || 'Công ty'
  return [
    {
      title: 'Về chúng tôi',
      links: [
        { label: 'Giới thiệu công ty', href: '/' },
        { label: 'Tham quan văn phòng', href: '/' },
        { label: 'Thông tin liên hệ', href: '/' },
        { label: 'Câu hỏi thường gặp', href: '/' },
      ],
    },
    {
      title: `Life at ${brand}`,
      links: [
        { label: 'Hoạt động', href: '/' },
        { label: 'Văn hoá đặc sắc', href: '/#culture' },
        { label: 'Phát triển sự nghiệp', href: '/careers' },
        { label: 'Phúc lợi', href: '/benefits' },
      ],
    },
    {
      title: 'Tin tức & Sự kiện',
      links: [
        { label: 'Tin tức', href: '/' },
        { label: 'Sự kiện', href: '/' },
      ],
    },
  ]
}

function normalizeLinkColumns(raw, companyName) {
  if (!Array.isArray(raw) || !raw.length) return defaultLinkColumns(companyName)
  return raw.map((col) => ({
    title: String(col?.title || '').trim() || '—',
    links: Array.isArray(col?.links)
      ? col.links
          .map((l) => ({
            label: String(l?.label || '').trim(),
            href: String(l?.href || '').trim(),
          }))
          .filter((l) => l.label)
      : [],
  }))
}

/** Lucide không còn export icon thương hiệu — dùng SVG tối giản. */
function IconFacebook({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function IconYoutube({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function IconInstagram({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FooterNavLink({ href, children }) {
  const cls =
    'text-sm leading-relaxed text-[#666666] transition-colors hover:text-[#002060] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002060]/25 rounded-sm'
  const h = String(href || '').trim()
  if (!h || h === '#') {
    return <span className={`${cls} cursor-default`}>{children}</span>
  }
  if (/^https?:\/\//i.test(h)) {
    return (
      <a href={h} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }
  return (
    <Link to={h} className={cls}>
      {children}
    </Link>
  )
}

function SocialCircle({ type, href }) {
  const h = String(href || '').trim()
  const wrap =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#002060]/40'
  const inner = (() => {
    if (type === 'facebook')
      return (
        <span className={`${wrap} bg-[#1877f2]`} title="Facebook">
          <IconFacebook className="h-[18px] w-[18px] text-white" />
        </span>
      )
    if (type === 'youtube')
      return (
        <span className={`${wrap} bg-[#ff0000]`} title="YouTube">
          <IconYoutube className="h-[18px] w-[18px] text-white" />
        </span>
      )
    if (type === 'instagram')
      return (
        <span
          className={`${wrap} bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888]`}
          title="Instagram"
        >
          <IconInstagram className="h-[18px] w-[18px] text-white" />
        </span>
      )
    if (type === 'zalo')
      return (
        <span className={`${wrap} bg-[#0068ff]`} title="Zalo">
          <span className="text-[10px] font-bold leading-none tracking-tight">Zalo</span>
        </span>
      )
    return null
  })()

  if (!inner) return null

  if (!h || h === '#') {
    return (
      <span className="pointer-events-none opacity-40" aria-hidden>
        {inner}
      </span>
    )
  }

  return (
    <a href={h} className="inline-flex" target="_blank" rel="noopener noreferrer" aria-label={type}>
      {inner}
    </a>
  )
}

export default function SiteFooter({ site }) {
  const companyName = site?.companyName || 'Savytech'
  const footer = safeJsonObject(site?.footerJson, null)
  const offices = Array.isArray(footer?.offices) ? footer.offices : []
  const year = new Date().getFullYear()
  const [showScrollTop, setShowScrollTop] = useState(false)

  const contactHeading =
    String(footer?.contactHeading || '').trim() || 'Trung tâm Thu hút Nguồn nhân lực'

  const addresses = useMemo(() => {
    const fromField = Array.isArray(footer?.addresses)
      ? footer.addresses.map((x) => String(x || '').trim()).filter(Boolean)
      : []
    if (fromField.length) return fromField
    return offices.map((o) => String(o?.address || '').trim()).filter(Boolean)
  }, [footer?.addresses, offices])

  const contactEmail = useMemo(() => {
    const direct = String(footer?.contactEmail || '').trim()
    if (direct) return direct
    const fromOffice = offices.map((o) => String(o?.email || '').trim()).find(Boolean)
    return fromOffice || ''
  }, [footer?.contactEmail, offices])

  const contactPhone = useMemo(() => {
    const direct = String(footer?.contactPhone || '').trim()
    if (direct) return direct
    const fromOffice = offices.map((o) => String(o?.phone || '').trim()).find(Boolean)
    return fromOffice || ''
  }, [footer?.contactPhone, offices])

  const linkColumns = useMemo(
    () => normalizeLinkColumns(footer?.linkColumns, companyName),
    [footer?.linkColumns, companyName],
  )

  const socialBar = footer?.socialBar && typeof footer.socialBar === 'object' ? footer.socialBar : {}
  const socialTitle = String(socialBar.title || '').trim() || 'Theo dõi các kênh chính thức'
  const socialSubtitle =
    String(socialBar.subtitle || '').trim() || `của ${companyName}`
  const supportLabel = String(socialBar.supportLabel || '').trim() || 'Hỗ trợ Khách hàng'
  const supportEmail = String(socialBar.supportEmail || '').trim() || contactEmail
  const hotlineLabel = String(socialBar.hotlineLabel || '').trim() || 'Hotline'
  const hotline = String(socialBar.hotline || '').trim() || contactPhone

  const socialLinks = useMemo(() => {
    const raw = Array.isArray(socialBar.links) ? socialBar.links : []
    const byType = (t) => String(raw.find((x) => x?.type === t)?.href || '').trim()
    return [
      { type: 'facebook', href: byType('facebook') },
      { type: 'youtube', href: byType('youtube') },
      { type: 'instagram', href: byType('instagram') },
      { type: 'zalo', href: byType('zalo') },
    ]
  }, [socialBar.links])

  const copyright =
    String(footer?.copyright || '').trim() ||
    `Copyright © ${year}. Official Website Tuyển dụng của ${companyName}.`

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement
      const threshold = Math.max(320, (doc.scrollHeight - window.innerHeight) * 0.5)
      setShowScrollTop(window.scrollY >= threshold)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const linkCls = 'space-y-2.5'

  return (
    <footer className="border-t bg-white font-sans text-[#002060]">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12 lg:max-w-[1200px]">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Cột 1 — Liên hệ */}
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold leading-snug" style={{ color: NAVY }}>
              {contactHeading}
            </h3>
            <div className="mt-4 space-y-3 text-sm leading-relaxed" style={{ color: MUTED }}>
              {addresses.length ? (
                addresses.map((line, idx) => (
                  <p key={idx} className="m-0">
                    {line}
                  </p>
                ))
              ) : offices.length ? (
                offices.map((o, idx) => (
                  <div key={idx}>
                    {o.title ? (
                      <div className="font-semibold text-[#444444]">{o.title}</div>
                    ) : null}
                    {o.address ? <p className="m-0 mt-1">{o.address}</p> : null}
                  </div>
                ))
              ) : (
                <p className="m-0">Thông tin liên hệ đang được cập nhật.</p>
              )}
              {contactEmail ? (
                <p className="m-0">
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-[#444444] underline-offset-2 hover:text-[#002060] hover:underline"
                  >
                    {contactEmail}
                  </a>
                </p>
              ) : null}
              {contactPhone ? (
                <p className="m-0">
                  <a
                    href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                    className="text-[#444444] underline-offset-2 hover:text-[#002060] hover:underline"
                  >
                    {contactPhone}
                  </a>
                </p>
              ) : null}
            </div>
          </div>

          {linkColumns.map((col, i) => (
            <div key={`${col.title}-${i}`} className="min-w-0">
              <h3 className="text-[15px] font-bold leading-snug" style={{ color: NAVY }}>
                {col.title}
              </h3>
              <nav className={`mt-4 ${linkCls}`} aria-label={col.title}>
                {col.links.map((l, j) => (
                  <div key={`${l.label}-${j}`}>
                    <FooterNavLink href={l.href}>{l.label}</FooterNavLink>
                  </div>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Thanh social & hỗ trợ */}
        <div
          className="mt-10 flex flex-col gap-6 rounded-xl border bg-[#fafafa] px-5 py-5 md:px-6 md:py-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8"
          style={{ borderColor: BORDER }}
        >
          <div className="min-w-0 shrink-0 lg:max-w-md">
            <div className="text-[15px] font-bold leading-snug" style={{ color: NAVY }}>
              {socialTitle}
            </div>
            <div className="mt-1 text-sm" style={{ color: MUTED }}>
              {socialSubtitle}
            </div>
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:gap-8">
            <div className="text-sm">
              <div className="font-bold" style={{ color: NAVY }}>
                {supportLabel}
              </div>
              {supportEmail ? (
                <a
                  href={`mailto:${supportEmail}`}
                  className="mt-0.5 block text-[#444444] underline-offset-2 hover:text-[#002060] hover:underline"
                >
                  {supportEmail}
                </a>
              ) : (
                <span className="mt-0.5 block text-[#999999]">—</span>
              )}
            </div>
            <div className="text-sm">
              <div className="font-bold" style={{ color: NAVY }}>
                {hotlineLabel}
              </div>
              {hotline ? (
                <a
                  href={`tel:${hotline.replace(/\s+/g, '')}`}
                  className="mt-0.5 block text-[#444444] underline-offset-2 hover:text-[#002060] hover:underline"
                >
                  {hotline}
                </a>
              ) : (
                <span className="mt-0.5 block text-[#999999]">—</span>
              )}
            </div>
            <div className="flex items-center gap-3 sm:pl-2">
              {socialLinks.map((s) => (
                <SocialCircle key={s.type} type={s.type} href={s.href} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-xs leading-relaxed md:text-left" style={{ borderColor: BORDER, color: '#888888' }}>
          {copyright}
        </div>
      </div>

      <button
        type="button"
        aria-label="Về đầu trang"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 z-50 grid h-11 w-11 place-items-center rounded-full border border-[#002060]/20 bg-[#002060] text-white shadow-md transition-all duration-200 hover:bg-[#001547] ${
          showScrollTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
        }`}
      >
        <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </footer>
  )
}
