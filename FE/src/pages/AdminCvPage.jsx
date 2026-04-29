import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '@/lib/api'
import { getToken, setToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function formatTime(v) {
  if (!v) return ''
  try {
    return new Date(v).toLocaleString()
  } catch {
    return String(v)
  }
}

export default function AdminCvPage() {
  const nav = useNavigate()
  const token = useMemo(() => getToken(), [])
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    if (!token) nav('/admin/login', { replace: true })
  }, [token, nav])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    adminApi
      .cvs(token)
      .then((rows) => {
        if (cancelled) return
        setItems(Array.isArray(rows) ? rows : [])
      })
      .catch((e) => {
        if (cancelled) return
        const msg = e?.message || 'Failed to load'
        setError(msg)
        if (String(msg).toLowerCase().includes('401')) {
          setToken('')
          nav('/admin/login', { replace: true })
        }
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, nav])

  const totalPages = Math.max(1, Math.ceil((items.length || 0) / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const view = items.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý CV</CardTitle>
        <CardDescription>Danh sách CV ứng tuyển người dùng gửi lên.</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {loading ? <div className="text-sm text-muted-foreground">Đang tải…</div> : null}

        <div className="space-y-3">
          {view.map((x) => (
            <div key={x.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {x.fullName} — {x.jobTitle}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {x.email} • {x.phone} {x.source ? `• ${x.source}` : ''} {x.createdAt ? `• ${formatTime(x.createdAt)}` : ''}
                </div>
                <div className="mt-1 text-xs text-muted-foreground truncate">{x.cvOriginalName}</div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button asChild variant="outline">
                  <a href={adminApi.cvDownloadUrl(x.id)} target="_blank" rel="noreferrer">
                    Tải CV
                  </a>
                </Button>
              </div>
            </div>
          ))}

          {!view.length && !loading ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Chưa có CV nào.</div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <Button type="button" variant="outline" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
            ‹
          </Button>
          <div className="px-2 text-muted-foreground">
            Trang <b className="text-foreground">{safePage}</b> / {totalPages}
          </div>
          <Button type="button" variant="outline" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
            ›
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

