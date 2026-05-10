import { useEffect, useMemo, useState } from 'react'
import { ChevronUp } from 'lucide-react'

const FOOTER_BG = '#3c4148'
const FOOTER_TEXT = '#c8cbd0'
const FOOTER_HEADING = '#ffffff'
const FOOTER_LABEL = 'rgba(255,255,255,0.55)'

function safeJsonObject(text, fallback) {
  try {
    const v = JSON.parse(text || 'null')
    return v && typeof v === 'object' && !Array.isArray(v) ? v : fallback
  } catch {
    return fallback
  }
}

const HN_ADDRESS =
  'Hà Nội Tầng 3, tòa CT1, tòa nhà Bắc Hà C14, phố Tố Hữu, phường Đại Mỗ, thành phố Hà Nội, Việt Nam'

/** Ba văn phòng. Trụ sở = địa chỉ Hà Nội + Tel + Email; hai VP còn lại chỉ địa chỉ. */
const DEFAULT_OFFICES = [
  {
    title: 'Trụ sở chính',
    address: HN_ADDRESS,
    tel: '0793313076',
    hotline: '',
    email: 'hrsavytech@gmail.com',
  },
  {
    title: 'Văn phòng Hà Nội',
    address: HN_ADDRESS,
    tel: '',
    hotline: '',
    email: '',
  },
  {
    title: 'Văn phòng Đà Nẵng',
    address:
      'Tầng 10, Tòa nhà SHB Đà Nẵng, số 06 Nguyễn Văn Linh, phường Hải Châu, thành phố Đà Nẵng, Việt Nam',
    tel: '',
    hotline: '',
    email: '',
  },
]

function officeTitleFold(rawTitle) {
  return String(rawTitle || '')
    .trim()
    .replace(/đ/gi, 'd')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** CMS cũ: NHẬT BẢN, SINGAPORE, Peru; hoặc «Thu hút NL» để HN/ĐN sai cột 0–1. */
function isLegacyRemovedOfficeTitle(rawTitle) {
  const t = String(rawTitle || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
  if (t === 'NHẬT BẢN' || t === 'SINGAPORE') return true
  const f = officeTitleFold(rawTitle)
  return (
    f === 'NHAT BAN' ||
    f === 'SINGAPORE' ||
    f === 'VAN PHONG PERU' ||
    f === 'PERU'
  )
}

/** Bỏ merge CMS nếu tiêu đề không khớp vị trí (dữ liệu footerJson cũ). */
function shouldUseDefaultOfficeOnly(defIndex, cmsTitle) {
  if (isLegacyRemovedOfficeTitle(cmsTitle)) return true
  const f = officeTitleFold(cmsTitle)
  if (defIndex === 0 && (f === 'HA NOI' || f === 'HANOI')) return true
  if (defIndex === 1 && (f === 'DA NANG' || f === 'DANANG')) return true
  return false
}

function normalizeOffices(raw) {
  return DEFAULT_OFFICES.map((def, i) => {
    const o = Array.isArray(raw) ? raw[i] : null
    if (!o || typeof o !== 'object') return applyOfficeContactRules(def, i)
    if (shouldUseDefaultOfficeOnly(i, o.title)) return applyOfficeContactRules(def, i)
    const merged = {
      title: String(o.title || def.title).trim(),
      address: String(o.address || def.address).trim(),
      tel: String(o.tel ?? o.phone ?? def.tel ?? '').trim(),
      hotline: String(o.hotline || def.hotline).trim(),
      email: String(o.email ?? def.email ?? '').trim(),
    }
    return applyOfficeContactRules(merged, i)
  })
}

/** Chỉ trụ sở (0) hiển thị Tel / Email; hai VP kia không hiển thị liên hệ. */
function applyOfficeContactRules(block, index) {
  if (index === 0) {
    return {
      ...block,
      tel: String(block.tel || '').trim(),
      hotline: '',
      email: String(block.email || '').trim(),
    }
  }
  return {
    ...block,
    tel: '',
    hotline: '',
    email: '',
  }
}

function telHref(tel) {
  const digits = String(tel || '').replace(/[^\d+]/g, '')
  if (!digits) return null
  return digits.startsWith('+') ? digits : `tel:${digits}`
}

function OfficeBlock({ title, address, tel, hotline, email }) {
  const telLink = tel ? telHref(tel) : null
  const hotFirst = String(hotline || '')
    .split(/\s*-\s*/)[0]
    ?.replace(/[^\d+]/g, '')
  const hotLink = hotFirst && hotFirst.length >= 8 ? `tel:${hotFirst}` : null
  const em = String(email || '').trim()

  return (
    <div>
      <h3 className="text-[15px] font-bold leading-snug" style={{ color: FOOTER_HEADING }}>
        {title}
      </h3>
      <div className="mt-4 space-y-3 text-sm leading-relaxed" style={{ color: FOOTER_TEXT }}>
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: FOOTER_LABEL }}>
            Địa chỉ
          </div>
          <p className="m-0 mt-1 break-words">{address}</p>
        </div>
        {tel ? (
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: FOOTER_LABEL }}>
              Tel
            </div>
            {telLink ? (
              <a
                href={telLink}
                className="m-0 mt-1 block text-inherit underline-offset-2 transition-colors hover:text-white hover:underline"
              >
                {tel}
              </a>
            ) : (
              <p className="m-0 mt-1">{tel}</p>
            )}
          </div>
        ) : null}
        {em ? (
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: FOOTER_LABEL }}>
              Email
            </div>
            <a
              href={`mailto:${em}`}
              className="m-0 mt-1 block break-all text-inherit underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              {em}
            </a>
          </div>
        ) : null}
        {hotline ? (
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: FOOTER_LABEL }}>
              Hotline
            </div>
            {hotLink ? (
              <a
                href={hotLink}
                className="m-0 mt-1 block text-inherit underline-offset-2 transition-colors hover:text-white hover:underline"
              >
                {hotline}
              </a>
            ) : (
              <p className="m-0 mt-1">{hotline}</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function SiteFooter({ site }) {
  const companyName = site?.companyName || 'Savytech'
  const footer = safeJsonObject(site?.footerJson, null)
  const year = new Date().getFullYear()
  const [showScrollTop, setShowScrollTop] = useState(false)

  const brandName = String(footer?.brandName || 'SAVYTECH').trim()
  const brandLogoSrc =
    String(footer?.brandLogoUrl || '/footer-brand-mark.png').trim() || '/footer-brand-mark.png'
  const tagline = String(footer?.tagline || 'The Foundation of Success').trim()
  const companyLegalName =
    String(
      footer?.companyLegalName ||
        'CÔNG TY TNHH SAVYTECH',
    ).trim()

  const offices = useMemo(() => normalizeOffices(footer?.offices), [footer?.offices])

  const copyright =
    String(footer?.copyright || '').trim() ||
    `Copyright © ${year}. ${companyName}.`

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

  const [hq, hanoi, danang] = offices

  return (
    <footer className="font-sans" style={{ backgroundColor: FOOTER_BG, color: FOOTER_TEXT }}>
      <div className="mx-auto max-w-6xl px-4 py-12 lg:max-w-[1200px] lg:py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Cột 1 — Thương hiệu */}
          <div className="min-w-0 lg:pr-4">
            <div className="flex flex-wrap items-center gap-3">
              <img
                src={brandLogoSrc}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 rounded-[10px] object-contain"
                decoding="async"
              />
              <span className="min-w-0 break-words text-[1.35rem] font-bold tracking-wide text-white">
                {brandName}
              </span>
            </div>
            <p className="mt-2 text-sm text-white/90">{tagline}</p>
            <p className="mt-5 break-words text-[11px] font-medium uppercase leading-relaxed tracking-wide text-white/75">
              {companyLegalName}
            </p>
          </div>

          <OfficeBlock {...hq} />
          <OfficeBlock {...hanoi} />
          <OfficeBlock {...danang} />
        </div>

        <div
          className="mt-12 border-t border-white/10 pt-8 text-center text-xs leading-relaxed text-white/45 md:text-left"
        >
          {copyright}
        </div>
      </div>

      <button
        type="button"
        aria-label="Về đầu trang"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed z-50 grid h-11 w-11 touch-manipulation place-items-center rounded-full border border-white/20 bg-[#2b4a8c] text-white shadow-lg transition-all duration-200 hover:bg-[#223d73] max-[380px]:bottom-4 max-[380px]:right-4 bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] right-[max(1.5rem,env(safe-area-inset-right,0px))] ${
          showScrollTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
        }`}
      >
        <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </footer>
  )
}
