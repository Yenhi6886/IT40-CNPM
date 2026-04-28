import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '@/lib/api'
import { getToken, setToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

function defaultJob() {
  return {
    id: null,
    title: '',
    location: '',
    employmentType: '',
    salary: '',
    imageUrl: '',
    description: '',
    published: false,
    sortOrder: 0,
  }
}

export default function AdminDashboard() {
  const nav = useNavigate()
  const token = useMemo(() => getToken(), [])
  const [site, setSite] = useState(null)
  const [jobs, setJobs] = useState([])
  const [jobDraft, setJobDraft] = useState(defaultJob())
  const [savingSite, setSavingSite] = useState(false)
  const [savingJob, setSavingJob] = useState(false)
  const [error, setError] = useState(null)
  const [active, setActive] = useState('site')

  useEffect(() => {
    if (!token) nav('/admin/login', { replace: true })
  }, [token, nav])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError(null)
      try {
        const [s, j] = await Promise.all([adminApi.site(token), adminApi.jobs(token)])
        if (cancelled) return
        setSite(s)
        setJobs(j || [])
      } catch (e) {
        if (cancelled) return
        setError(e?.message || 'Failed to load')
        if (String(e?.message || '').toLowerCase().includes('401')) {
          setToken('')
          nav('/admin/login', { replace: true })
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [token, nav])

  async function saveSite() {
    if (!site) return
    setSavingSite(true)
    setError(null)
    try {
      const updated = await adminApi.upsertSite(token, site)
      setSite(updated)
    } catch (e) {
      setError(e?.message || 'Save failed')
    } finally {
      setSavingSite(false)
    }
  }

  async function saveJob() {
    setSavingJob(true)
    setError(null)
    try {
      const dto = {
        ...jobDraft,
        imageUrl: jobDraft.imageUrl || null,
        location: jobDraft.location || null,
        employmentType: jobDraft.employmentType || null,
        salary: jobDraft.salary || null,
      }
      if (dto.id) {
        const updated = await adminApi.updateJob(token, dto.id, dto)
        setJobs((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      } else {
        const created = await adminApi.createJob(token, dto)
        setJobs((prev) => [created, ...prev])
      }
      setJobDraft(defaultJob())
      setActive('jobs')
    } catch (e) {
      setError(e?.message || 'Save job failed')
    } finally {
      setSavingJob(false)
    }
  }

  async function deleteJob(id) {
    if (!id) return
    setError(null)
    try {
      await adminApi.deleteJob(token, id)
      setJobs((prev) => prev.filter((x) => x.id !== id))
      if (jobDraft.id === id) setJobDraft(defaultJob())
    } catch (e) {
      setError(e?.message || 'Delete failed')
    }
  }

  function logout() {
    setToken('')
    nav('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <div className="text-sm text-muted-foreground">Admin</div>
            <div className="text-lg font-semibold">{site?.companyName || 'Savytech'}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <a href="/" target="_blank" rel="noreferrer">
                Xem trang user
              </a>
            </Button>
            <Button variant="destructive" onClick={logout}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={active === 'site' ? 'default' : 'outline'}
            onClick={() => setActive('site')}
          >
            Nội dung trang
          </Button>
          <Button
            variant={active === 'jobs' ? 'default' : 'outline'}
            onClick={() => setActive('jobs')}
          >
            Tuyển dụng
          </Button>
          <Button
            variant={active === 'job-edit' ? 'default' : 'outline'}
            onClick={() => setActive('job-edit')}
          >
            Thêm/Sửa job
          </Button>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {active === 'site' ? (
          <Card>
            <CardHeader>
              <CardTitle>Nội dung trang người dùng</CardTitle>
              <CardDescription>
                Tất cả phần hiển thị ở trang user đều chỉnh được tại đây. Các trường ảnh có thể để trống.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {site ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Tên công ty</div>
                    <Input
                      value={site.companyName || ''}
                      onChange={(e) => setSite({ ...site, companyName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Logo URL (để trống nếu chưa có)</div>
                    <Input
                      value={site.logoUrl || ''}
                      onChange={(e) => setSite({ ...site, logoUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="text-sm font-medium">Hero title</div>
                    <Input
                      value={site.heroTitle || ''}
                      onChange={(e) => setSite({ ...site, heroTitle: e.target.value })}
                      placeholder="Vị trí IT"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <div className="text-sm font-medium">Hero subtitle</div>
                    <Textarea
                      value={site.heroSubtitle || ''}
                      onChange={(e) => setSite({ ...site, heroSubtitle: e.target.value })}
                      placeholder="..."
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="text-sm font-medium">Về chúng tôi - Tiêu đề</div>
                    <Input
                      value={site.aboutTitle || ''}
                      onChange={(e) => setSite({ ...site, aboutTitle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <div className="text-sm font-medium">Về chúng tôi - Nội dung</div>
                    <Textarea
                      value={site.aboutContent || ''}
                      onChange={(e) => setSite({ ...site, aboutContent: e.target.value })}
                      placeholder="Nội dung..."
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="text-sm font-medium">Quyền lợi - Tiêu đề</div>
                    <Input
                      value={site.benefitsTitle || ''}
                      onChange={(e) => setSite({ ...site, benefitsTitle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <div className="text-sm font-medium">
                      Quyền lợi - JSON array (ví dụ: ["A","B"])
                    </div>
                    <Textarea
                      value={site.benefitsJson || '[]'}
                      onChange={(e) => setSite({ ...site, benefitsJson: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="text-sm font-medium">Quyền lợi (khối 2) - Tiêu đề</div>
                    <Input
                      value={site.rightsTitle || ''}
                      onChange={(e) => setSite({ ...site, rightsTitle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <div className="text-sm font-medium">
                      Quyền lợi (khối 2) - JSON array
                    </div>
                    <Textarea
                      value={site.rightsJson || '[]'}
                      onChange={(e) => setSite({ ...site, rightsJson: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
                    <Button onClick={saveSite} disabled={savingSite}>
                      {savingSite ? 'Đang lưu…' : 'Lưu nội dung'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Đang tải…</div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {active === 'jobs' ? (
          <Card>
            <CardHeader>
              <CardTitle>Danh sách vị trí tuyển dụng</CardTitle>
              <CardDescription>Chỉ job có Published = true mới hiện ở trang user.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {jobs?.length ? (
                  jobs.map((j) => (
                    <div
                      key={j.id}
                      className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{j.title}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {(j.location || '—') + ' • ' + (j.employmentType || '—')}{' '}
                          {j.published ? (
                            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                              Published
                            </span>
                          ) : (
                            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              Draft
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setJobDraft({
                              ...defaultJob(),
                              ...j,
                              imageUrl: j.imageUrl || '',
                              location: j.location || '',
                              employmentType: j.employmentType || '',
                              salary: j.salary || '',
                              description: j.description || '',
                            })
                            setActive('job-edit')
                          }}
                        >
                          Sửa
                        </Button>
                        <Button variant="destructive" onClick={() => deleteJob(j.id)}>
                          Xóa
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    Chưa có job nào. Chọn “Thêm/Sửa job” để tạo mới.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {active === 'job-edit' ? (
          <Card>
            <CardHeader>
              <CardTitle>{jobDraft.id ? 'Sửa job' : 'Tạo job mới'}</CardTitle>
              <CardDescription>
                Các trường ảnh có thể để trống. SortOrder nhỏ sẽ lên trước.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm font-medium">Tiêu đề</div>
                  <Input
                    value={jobDraft.title}
                    onChange={(e) => setJobDraft({ ...jobDraft, title: e.target.value })}
                    placeholder="Java Developer"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Địa điểm</div>
                  <Input
                    value={jobDraft.location}
                    onChange={(e) => setJobDraft({ ...jobDraft, location: e.target.value })}
                    placeholder="Hà Nội"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Hình thức</div>
                  <Input
                    value={jobDraft.employmentType}
                    onChange={(e) =>
                      setJobDraft({ ...jobDraft, employmentType: e.target.value })
                    }
                    placeholder="Full-time"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Lương</div>
                  <Input
                    value={jobDraft.salary}
                    onChange={(e) => setJobDraft({ ...jobDraft, salary: e.target.value })}
                    placeholder="Thỏa thuận"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">SortOrder</div>
                  <Input
                    type="number"
                    value={String(jobDraft.sortOrder)}
                    onChange={(e) =>
                      setJobDraft({ ...jobDraft, sortOrder: Number(e.target.value || 0) })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm font-medium">Image URL (để trống nếu chưa có)</div>
                  <Input
                    value={jobDraft.imageUrl}
                    onChange={(e) => setJobDraft({ ...jobDraft, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm font-medium">Mô tả</div>
                  <Textarea
                    value={jobDraft.description}
                    onChange={(e) => setJobDraft({ ...jobDraft, description: e.target.value })}
                    placeholder="Mô tả công việc..."
                  />
                </div>
                <div className="md:col-span-2 flex items-center justify-between gap-2">
                  <label className="flex select-none items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[hsl(var(--primary))]"
                      checked={jobDraft.published}
                      onChange={(e) => setJobDraft({ ...jobDraft, published: e.target.checked })}
                    />
                    Published
                  </label>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setJobDraft(defaultJob())}
                      type="button"
                    >
                      Reset
                    </Button>
                    <Button onClick={saveJob} disabled={savingJob || !jobDraft.title.trim()}>
                      {savingJob ? 'Đang lưu…' : jobDraft.id ? 'Lưu job' : 'Tạo job'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  )
}

