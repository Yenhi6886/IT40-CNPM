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
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
        <div className="mb-8 flex flex-col gap-3 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-lg font-semibold tracking-tight">{companyName}</div>
            <div className="mt-1 text-sm text-slate-300">Kết nối nhân tài với cơ hội phù hợp.</div>
          </div>
          <div className="flex gap-5 text-sm text-slate-300">
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
              <div key={idx} className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                <div className="font-semibold text-white">{o.title || 'Văn phòng'}</div>
                {o.address ? <div className="leading-6 text-slate-300">{o.address}</div> : null}
                {o.phone ? <div className="text-slate-300">Tel: {o.phone}</div> : null}
                {o.email ? <div className="text-slate-300">{o.email}</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-300">Thông tin văn phòng đang được cập nhật.</div>
        )}

        <div className="mt-8 border-t border-white/10 pt-5 text-xs text-slate-400">
          © {year} {companyName}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

