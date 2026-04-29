import { Link } from 'react-router-dom'

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

  return (
    <footer className="border-t bg-[#0b2d3a] text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        {offices.length ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {offices.map((o, idx) => (
              <div key={idx} className="space-y-3 text-sm text-white/80">
                <div className="font-semibold text-white">{o.title || 'Văn phòng'}</div>
                {o.address ? <div>{o.address}</div> : null}
                {o.phone ? <div>{o.phone}</div> : null}
                {o.email ? <div>{o.email}</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-white/80">© {new Date().getFullYear()} {companyName}</div>
        )}

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} {companyName}</div>
          <div className="flex gap-4">
            <Link className="hover:text-white" to="/">
              Trang chủ
            </Link>
            <Link className="hover:text-white" to="/careers">
              Cơ hội nghề nghiệp
            </Link>
            <Link className="hover:text-white" to="/benefits">
              Quyền lợi
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

