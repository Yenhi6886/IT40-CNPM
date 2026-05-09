import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronUp } from 'lucide-react'

function safeJsonObject(text, fallback) {
  try {
    const v = JSON.parse(text || 'null')
    return v && typeof v === 'object' && !Array.isArray(v) ? v : fallback
  } catch {
    return fallback
  }
}

export default function SiteFooter({ site }) {
  const companyName = site?.companyName || 'Savytech'
  const footer = safeJsonObject(site?.footerJson, null)
  const offices = Array.isArray(footer?.offices) ? footer.offices : []
  const year = new Date().getFullYear()
  const [showScrollTop, setShowScrollTop] = useState(false)

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

  return (
    <footer className="border-t border-white/10 bg-[#01384b] font-sans text-[#d8edf6]">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
        <div className="mb-8 flex flex-col gap-3 border-b border-white/20 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[21px] font-semibold tracking-[0.01em] text-white">{companyName}</div>
            <div className="mt-1 text-[13px] leading-6 text-[#c3dfeb]">Kết nối nhân tài với cơ hội phù hợp.</div>
          </div>
          <div className="flex gap-5 text-[13px] text-[#c3dfeb]">
            <Link className="transition-colors hover:text-white" to="/">
              Trang chủ
            </Link>
            <Link className="transition-colors hover:text-white" to="/careers">
              Cơ hội nghề nghiệp
            </Link>
            <Link className="transition-colors hover:text-white" to="/benefits">
              Quyền lợi
            </Link>
          </div>
        </div>

        {offices.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {offices.map((o, idx) => (
              <div key={idx} className="space-y-2 rounded-xl border border-white/15 bg-white/[0.02] p-4 text-[13px] leading-6">
                <div className="text-base font-semibold text-white">{o.title || 'Văn phòng'}</div>
                {o.address ? <div className="text-[#c3dfeb]">{o.address}</div> : null}
                {o.phone ? <div className="text-[#c3dfeb]">Tel: {o.phone}</div> : null}
                {o.email ? <div className="text-[#c3dfeb]">{o.email}</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[13px] text-[#c3dfeb]">Thông tin văn phòng đang được cập nhật.</div>
        )}
      </div>
      <div className="border-t border-white/15 bg-[#042f40]">
        <div className="mx-auto max-w-6xl px-4 py-4 text-left text-[14px] text-[#c3dfeb] md:text-[15px]">
          © {year} {companyName}. All rights reserved.
        </div>
      </div>
      <button
        type="button"
        aria-label="Về đầu trang"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 z-50 grid h-11 w-11 place-items-center rounded-full border border-white/65 bg-white text-[#0a4259] shadow-lg transition-all duration-200 ${
          showScrollTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
        }`}
      >
        <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </footer>
  )
}

