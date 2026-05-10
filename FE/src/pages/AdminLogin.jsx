import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/lib/api'
import { setRole, setToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Lock, Shield } from 'lucide-react'

const HR_NAVY = '#2b4a8c'

/** Kiểm tra client trước khi gọi API — thông báo tiếng Việt chuẩn chỉnh */
function validateFields(usernameRaw, passwordRaw) {
  const errors = { username: '', password: '' }
  const username = String(usernameRaw ?? '').trim()
  const password = String(passwordRaw ?? '')

  if (!username) {
    errors.username = 'Vui lòng nhập tên đăng nhập.'
  } else if (username.length < 2) {
    errors.username = 'Tên đăng nhập phải có ít nhất 2 ký tự.'
  } else if (username.length > 64) {
    errors.username = 'Tên đăng nhập không được vượt quá 64 ký tự.'
  } else if (/\s/.test(username)) {
    errors.username = 'Tên đăng nhập không được chứa khoảng trắng.'
  }

  if (!password) {
    errors.password = 'Vui lòng nhập mật khẩu.'
  } else if (password.length > 128) {
    errors.password = 'Mật khẩu không được vượt quá 128 ký tự.'
  }

  const hasErrors = Boolean(errors.username || errors.password)
  return { username, password, errors, hasErrors }
}

/** Chuẩn hóa lỗi từ máy chủ / mạng sang tiếng Việt */
function mapServerError(message) {
  const m = String(message || '').trim()
  if (!m) return 'Đăng nhập thất bại. Vui lòng thử lại.'
  const lower = m.toLowerCase()
  if (
    lower.includes('invalid username') ||
    lower.includes('invalid username or password') ||
    lower === 'unauthorized' ||
    m === '401'
  ) {
    return 'Sai tên đăng nhập hoặc mật khẩu.'
  }
  if (lower === 'forbidden' || m === '403') {
    return 'Tài khoản không có quyền truy cập khu vực này.'
  }
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('load failed')) {
    return 'Không kết nối được máy chủ. Kiểm tra backend và thử lại.'
  }
  if (/^\d{3}$/.test(m)) {
    return `Lỗi máy chủ (${m}). Vui lòng thử lại sau.`
  }
  return m
}

export default function AdminLogin() {
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({ username: false, password: false })
  const [fieldErrors, setFieldErrors] = useState({ username: '', password: '' })
  const [serverError, setServerError] = useState(null)

  const runValidation = (u = username, p = password) => {
    const { errors } = validateFields(u, p)
    setFieldErrors(errors)
    return errors
  }

  async function onSubmit(e) {
    e.preventDefault()
    setTouched({ username: true, password: true })
    setServerError(null)

    const { username: u, password: pw, errors, hasErrors } = validateFields(username, password)
    setFieldErrors(errors)
    if (hasErrors) return

    setLoading(true)
    try {
      const res = await authApi.login(u, pw)
      setToken(res.token)
      setRole(res.role || '')
      nav('/admin', { replace: true })
    } catch (err) {
      setServerError(mapServerError(err?.message))
    } finally {
      setLoading(false)
    }
  }

  const displayUsernameError = touched.username && fieldErrors.username
  const displayPasswordError = touched.password && fieldErrors.password

  return (
    <div
      className="relative min-h-screen overflow-x-hidden text-foreground"
      style={{ backgroundColor: '#F5F6F8' }}
    >
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:p-10">
          <div className="mb-8 text-center">
            <div
              className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg shadow-[#2b4a8c]/30"
              style={{ background: `linear-gradient(145deg, ${HR_NAVY} 0%, #1e3a6e 100%)` }}
            >
              <Shield className="h-7 w-7" strokeWidth={1.75} aria-hidden />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1a2744] sm:text-[1.65rem]">
              Đăng nhập Admin
            </h1>

          </div>

          {serverError ? (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200/90 bg-red-50/95 px-4 py-3 text-sm text-red-900"
            >
              {serverError}
            </div>
          ) : null}

          <form className="space-y-5" onSubmit={onSubmit} noValidate>
            <div className="space-y-2">
              <label htmlFor="admin-username" className="text-sm font-semibold text-[#334155]">
                Tên đăng nhập
              </label>
              <Input
                id="admin-username"
                name="username"
                autoComplete="username"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  if (touched.username) runValidation(e.target.value, password)
                }}
                onBlur={() => {
                  setTouched((t) => ({ ...t, username: true }))
                  runValidation()
                }}
                aria-invalid={displayUsernameError ? 'true' : 'false'}
                aria-describedby={displayUsernameError ? 'admin-username-error' : undefined}
                className={cn(
                  'h-11 rounded-xl border-[#e2e8f0] bg-white transition-shadow placeholder:text-muted-foreground/70',
                  displayUsernameError && 'border-destructive focus-visible:ring-destructive/30',
                )}
              />
              {displayUsernameError ? (
                <p id="admin-username-error" className="text-xs font-medium text-destructive">
                  {fieldErrors.username}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password" className="text-sm font-semibold text-[#334155]">
                Mật khẩu
              </label>
              <div className="relative">
                <Input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (touched.password) runValidation(username, e.target.value)
                  }}
                  onBlur={() => {
                    setTouched((t) => ({ ...t, password: true }))
                    runValidation()
                  }}
                  aria-invalid={displayPasswordError ? 'true' : 'false'}
                  aria-describedby={displayPasswordError ? 'admin-password-error' : undefined}
                  className={cn(
                    'h-11 rounded-xl border-[#e2e8f0] bg-white pr-11 transition-shadow placeholder:text-muted-foreground/70',
                    displayPasswordError && 'border-destructive focus-visible:ring-destructive/30',
                  )}
                />
                <button
                  type="button"
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {displayPasswordError ? (
                <p id="admin-password-error" className="text-xs font-medium text-destructive">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl font-semibold text-white shadow-md transition-all hover:opacity-[0.96]"
              style={{ backgroundColor: HR_NAVY, boxShadow: '0 8px 24px rgba(43, 74, 140, 0.35)' }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Đang đăng nhập…
                </span>
              ) : (
                <span className="inline-flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4 opacity-90" aria-hidden />
                  Đăng nhập
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <a
              href="/"
              className="text-sm font-medium text-[#2b4a8c] underline-offset-4 transition-colors hover:text-[#223d73] hover:underline"
            >
              Về trang chủ công khai
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
