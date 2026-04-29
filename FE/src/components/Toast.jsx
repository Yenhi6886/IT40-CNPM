import { useEffect, useRef } from 'react'

export default function Toast({ toast, onClose }) {
  const ref = useRef(null)
  const open = Boolean(toast?.open)

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => onClose?.(), Number(toast?.durationMs || 3200))
    return () => window.clearTimeout(t)
  }, [open, toast?.durationMs, onClose])

  useEffect(() => {
    if (!open) return
    function onAnyPointerDown(e) {
      const el = ref.current
      if (!el) {
        onClose?.()
        return
      }
      if (!el.contains(e.target)) onClose?.()
    }
    window.addEventListener('pointerdown', onAnyPointerDown, true)
    return () => window.removeEventListener('pointerdown', onAnyPointerDown, true)
  }, [open, onClose])

  if (!open) return null

  const type = toast?.type === 'error' ? 'error' : 'success'
  const title = String(toast?.title || (type === 'success' ? 'Thành công' : 'Thất bại'))
  const message = String(toast?.message || '')

  return (
    <div className="pointer-events-none fixed left-0 top-4 z-[100] w-full px-4">
      <div
        ref={ref}
        className={`pointer-events-auto mx-auto flex w-full max-w-xl items-start gap-3 rounded-xl border bg-white p-4 shadow-lg ${
          type === 'success' ? 'border-emerald-200' : 'border-destructive/30'
        }`}
        role="status"
        aria-live="polite"
      >
        <div
          className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
            type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive'
          }`}
        >
          {type === 'success' ? '✓' : '!'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{title}</div>
          {message ? <div className="mt-0.5 text-sm text-muted-foreground">{message}</div> : null}
        </div>
        <button
          type="button"
          onClick={() => onClose?.()}
          className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted/30"
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

