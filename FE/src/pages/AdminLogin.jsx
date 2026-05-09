import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/lib/api'
import { setRole, setToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function AdminLogin() {
  const nav = useNavigate()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.login(username, password)
      setToken(res.token)
      setRole(res.role || '')
      nav('/admin', { replace: true })
    } catch (err) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-md flex-col px-4 py-14">
        <Card>
          <CardHeader>
            <CardTitle>Đăng nhập quản trị</CardTitle>
            <CardDescription>
              Design: <b>admin</b> / <b>admin123</b> — Tuyển dụng (HR): <b>hr</b> / <b>hr123</b> (cấu hình trên BE).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <div className="text-sm font-medium">Username</div>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Password</div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              {error ? <div className="text-sm text-destructive">{error}</div> : null}
              <Button className="w-full" disabled={loading} type="submit">
                {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
              </Button>
              <Button className="w-full" variant="outline" type="button" asChild>
                <a href="/">Về trang người dùng</a>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

