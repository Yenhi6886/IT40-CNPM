import { useEffect, useMemo, useState } from 'react'
import { publicApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function safeJsonArray(text) {
  try {
    const v = JSON.parse(text || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function LogoMark({ logoUrl, companyName }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={companyName || 'Logo'}
        className="h-8 w-8 rounded-md object-cover"
      />
    )
  }
  const letter = (companyName || 'S').trim().slice(0, 1).toUpperCase()
  return (
    <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
      {letter}
    </div>
  )
}

export default function PublicHome() {
  const [site, setSite] = useState(null)
  const [jobs, setJobs] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([publicApi.site(), publicApi.jobs()])
      .then(([s, j]) => {
        if (cancelled) return
        setSite(s)
        setJobs(j || [])
      })
      .catch((e) => {
        if (cancelled) return
        setError(e?.message || 'Failed to load')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const benefits = useMemo(() => safeJsonArray(site?.benefitsJson), [site?.benefitsJson])
  const rights = useMemo(() => safeJsonArray(site?.rightsJson), [site?.rightsJson])

  const companyName = site?.companyName || 'Savytech'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="#home" className="flex items-center gap-3">
            <LogoMark logoUrl={site?.logoUrl} companyName={companyName} />
            <div className="leading-tight">
              <div className="text-sm font-semibold">{companyName}</div>
              <div className="text-xs text-muted-foreground">IT Careers</div>
            </div>
          </a>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a className="hover:text-primary" href="#home">
              Trang chủ
            </a>
            <a className="hover:text-primary" href="#about">
              Về chúng tôi
            </a>
            <a className="hover:text-primary" href="#careers">
              Cơ hội nghề nghiệp
            </a>
            <a className="hover:text-primary" href="#benefits">
              Quyền lợi
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="hidden md:inline-flex">
              <a href="/admin/login">Admin</a>
            </Button>
            <Button asChild className="bg-primary">
              <a href="#careers">Ứng tuyển ngay</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section id="home" className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-28 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Tuyển dụng IT • Nội dung do Admin quản lý
              </div>
              <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
                {site?.heroTitle || 'Vị trí IT'}
              </h1>
              <p className="max-w-prose text-muted-foreground">
                {site?.heroSubtitle || 'Khám phá các vị trí tuyển dụng tại Savytech.'}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <a href="#careers">Xem vị trí tuyển dụng</a>
                </Button>
                <Button asChild variant="outline">
                  <a href="#about">Tìm hiểu thêm</a>
                </Button>
              </div>
              {error ? (
                <p className="text-sm text-destructive">Lỗi: {error}</p>
              ) : null}
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="space-y-3">
                <div className="text-sm font-semibold">Màu chủ đạo</div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary" />
                  <div className="text-sm text-muted-foreground">
                    Giao diện lấy tone xanh giống ảnh mẫu.
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Ảnh</CardTitle>
                      <CardDescription>Để trống cho admin tự thêm</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-20 rounded-lg border border-dashed bg-muted/40" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Tuyển dụng</CardTitle>
                      <CardDescription>Admin quản lý danh sách</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold">{jobs?.length || 0}</div>
                      <div className="text-xs text-muted-foreground">Vị trí đang hiển thị</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                {site?.aboutTitle || 'Về chúng tôi'}
              </h2>
              <p className="mt-2 max-w-prose text-muted-foreground">
                {site?.aboutContent || 'Nội dung phần này sẽ do admin cập nhật.'}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {['Chất lượng', 'Chuyên nghiệp', 'Đồng hành'].map((t) => (
                <Card key={t}>
                  <CardHeader>
                    <CardTitle className="text-base">{t}</CardTitle>
                    <CardDescription>Khung nội dung mẫu</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-24 rounded-lg border border-dashed bg-muted/40" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="careers" className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Cơ hội nghề nghiệp</h2>
                <p className="mt-2 text-muted-foreground">
                  Các vị trí bên dưới lấy từ admin. Nếu đang trống, hãy thêm trong trang admin.
                </p>
              </div>
              <Button asChild variant="outline" className="hidden md:inline-flex">
                <a href="/admin/login">Quản trị</a>
              </Button>
            </div>

            {jobs?.length ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {jobs.map((j) => (
                  <Card key={j.id} className="overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-[160px_1fr]">
                      <div className="h-40 bg-muted/40 md:h-full">
                        {j.imageUrl ? (
                          <img
                            src={j.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                            Ảnh (admin thêm sau)
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-lg font-semibold">{j.title}</div>
                          {j.salary ? (
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                              {j.salary}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                          {j.location ? <span>{j.location}</span> : null}
                          {j.employmentType ? <span>• {j.employmentType}</span> : null}
                        </div>
                        {j.description ? (
                          <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                            {j.description}
                          </p>
                        ) : (
                          <p className="mt-3 text-sm text-muted-foreground">
                            Mô tả sẽ do admin cập nhật.
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Chưa có vị trí nào</CardTitle>
                  <CardDescription>
                    Hãy vào admin để thêm thủ công các vị trí tuyển dụng.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </section>

        <section id="benefits" className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                {site?.benefitsTitle || 'Quyền lợi'}
              </h2>
              <p className="mt-2 text-muted-foreground">
                Nội dung danh sách quyền lợi sẽ do admin cập nhật (có thể để trống).
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quyền lợi</CardTitle>
                  <CardDescription>Danh sách</CardDescription>
                </CardHeader>
                <CardContent>
                  {benefits.length ? (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {benefits.map((x, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                          <span>{String(x)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
                      Trống (admin thêm sau)
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{site?.rightsTitle || 'Quyền lợi'}</CardTitle>
                  <CardDescription>Danh sách</CardDescription>
                </CardHeader>
                <CardContent>
                  {rights.length ? (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {rights.map((x, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                          <span>{String(x)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
                      Trống (admin thêm sau)
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} {companyName}</div>
          <div className="flex gap-4">
            <a className="hover:text-primary" href="#home">
              Trang chủ
            </a>
            <a className="hover:text-primary" href="#careers">
              Cơ hội nghề nghiệp
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

