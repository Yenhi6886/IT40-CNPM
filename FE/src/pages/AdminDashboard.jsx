import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import {
  Briefcase,
  BriefcaseBusiness,
  CalendarCheck,
  Download,
  ExternalLink,
  FilePenLine,
  FileText,
  Files,
  Filter,
  ListChecks,
  Mail,
  Phone,
  RotateCcw,
} from 'lucide-react'
import { adminApi } from '@/lib/api'
import { getRole, getToken, normalizeAdminRole, setToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import RichTextEditor from '@/components/RichTextEditor'
import { Textarea } from '@/components/ui/textarea'

const PAGE_SIZE = 2
const ADMIN_UI_STATE_KEY = 'it40_admin_ui_state'
const HR_NAVY = '#2b4a8c'
const HR_PAGE_BG = '#f5f6f8'

const WORK_ARRANGEMENT_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'FULL_TIME', label: 'Toàn thời gian' },
  { value: 'PART_TIME', label: 'Bán thời gian' },
  { value: 'INTERN', label: 'Thực tập' },
  { value: 'COLLABORATOR', label: 'Cộng tác viên' },
]

/** Đồng bộ nhóm lọc CV với trang Careers (thêm UNSPEC cho bản ghi cũ / job ALL). */
const CV_WORK_FILTER_OPTIONS = [
  { id: 'FULL_TIME', label: 'Toàn thời gian' },
  { id: 'PART_TIME', label: 'Bán thời gian' },
  { id: 'INTERN', label: 'Thực tập' },
  { id: 'COLLABORATOR', label: 'Cộng tác viên' },
  { id: 'UNSPEC', label: 'Không xác định / Tất cả' },
]

function cvWorkCategoryKey(workArrangement) {
  const w = String(workArrangement || '').trim().toUpperCase()
  if (!w || w === 'ALL') return 'UNSPEC'
  if (['FULL_TIME', 'PART_TIME', 'INTERN', 'COLLABORATOR'].includes(w)) return w
  return 'UNSPEC'
}

function cvWorkArrangementLabel(workArrangement) {
  const k = cvWorkCategoryKey(workArrangement)
  if (k === 'UNSPEC') return 'Không xác định / Tất cả'
  const row = CV_WORK_FILTER_OPTIONS.find((o) => o.id === k)
  return row?.label || '—'
}

function clampPage(page, totalItems) {
  const totalPages = Math.max(1, Math.ceil((totalItems || 0) / PAGE_SIZE))
  const p = Number(page || 1)
  return Math.min(Math.max(1, p), totalPages)
}

function PaginationBar({ page, totalItems, onChange }) {
  const totalPages = Math.max(1, Math.ceil((totalItems || 0) / PAGE_SIZE))
  if (totalPages <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-center gap-2 text-sm">
      <Button
        type="button"
        variant="outline"
        disabled={page <= 1}
        onClick={() => onChange?.(page - 1)}
      >
        ‹
      </Button>
      <div className="px-2 text-muted-foreground">
        Trang <b className="text-foreground">{page}</b> / {totalPages}
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={page >= totalPages}
        onClick={() => onChange?.(page + 1)}
      >
        ›
      </Button>
    </div>
  )
}

function safeJson(value, fallback) {
  try {
    const v = JSON.parse(value || '')
    return v ?? fallback
  } catch {
    return fallback
  }
}

function listFromJsonArray(text) {
  const v = safeJson(text, [])
  return Array.isArray(v) ? v.map((x) => String(x ?? '')).filter(Boolean) : []
}

function jsonArrayFromList(list) {
  const arr = (list || []).map((x) => String(x || '').trim()).filter(Boolean)
  return JSON.stringify(arr)
}

function normalizeText(value) {
  return String(value || '').toLowerCase().trim()
}

function adminCvStatusLabel(status) {
  const key = String(status || 'XEM_XET').toUpperCase()
  if (key === 'PHONG_VAN') return 'Phỏng vấn'
  if (key === 'LOAI') return 'Loại'
  return 'Xem xét'
}

function adminCvStatusBadgeClass(status) {
  const key = String(status || 'XEM_XET').toUpperCase()
  if (key === 'PHONG_VAN') return 'border-[#c5d4eb] bg-[#e8f0fe] text-[#2b4a8c]'
  if (key === 'LOAI') return 'border-red-100 bg-red-50 text-red-800'
  return 'border-amber-100/90 bg-amber-50 text-amber-950'
}

function cvApplicantInitials(fullName) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function CvFilterCheckboxRow({ id, label, count, checked, onToggle, polished }) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between gap-2 text-sm transition-colors ${
        polished
          ? `rounded-xl border px-2.5 py-2 ${
              checked
                ? 'border-[#2b4a8c]/35 bg-[#e8f0fe]/55 shadow-[0_1px_0_rgba(43,74,140,0.06)]'
                : 'border-transparent hover:border-[#e8ecf2] hover:bg-[#f8fafc]'
            }`
          : 'rounded-lg py-1.5 hover:bg-muted/30'
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <input
          type="checkbox"
          className="h-4 w-4 shrink-0 rounded border-input accent-[#2b4a8c]"
          checked={checked}
          onChange={() => onToggle(id)}
        />
        <span className={polished ? 'font-medium text-[#334155]' : 'text-foreground/90'}>{label}</span>
      </span>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
          polished
            ? checked
              ? 'bg-white/80 text-[#2b4a8c] shadow-sm'
              : 'bg-[#e8f0fe] text-[#2b4a8c]'
            : 'bg-[#e8f0fe] font-medium text-[#2b4a8c]'
        }`}
      >
        {count}
      </span>
    </label>
  )
}

function AdminCvListRow({
  applicant: x,
  hrLayout,
  deletingCvId,
  token,
  notifySuccess,
  notifyError,
  onUpdateStatus,
  onDelete,
  hideFilePath,
}) {
  const st = String(x?.status || 'XEM_XET').toUpperCase()
  const [downloadDialog, setDownloadDialog] = useState(null)
  const [downloadRunning, setDownloadRunning] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(null)

  function openDownloadDialog() {
    const pathLabel = String(x?.cvStoredPath || '').trim() || '—'
    const fileLabel = String(x?.cvOriginalName || '').trim() || 'cv'
    setDownloadDialog({ fileLabel, pathLabel })
  }

  async function runConfirmedDownload() {
    if (!downloadDialog) return
    const { fileLabel } = downloadDialog
    setDownloadRunning(true)
    try {
      const { blob, filename } = await adminApi.downloadCv(token, x.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || x.cvOriginalName || 'cv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setDownloadDialog(null)
      notifySuccess?.(`Đã tải file “${fileLabel}” về máy thành công.`)
    } catch (err) {
      notifyError?.(err?.message || 'Tải CV thất bại')
    } finally {
      setDownloadRunning(false)
    }
  }

  const statusPillOnly = (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${adminCvStatusBadgeClass(x?.status)}`}
    >
      {adminCvStatusLabel(x?.status)}
    </span>
  )

  const statusBadgesRowFull = (
    <div className="flex flex-wrap items-center gap-2">
      {statusPillOnly}
      <span className="inline-flex items-center gap-1 rounded-full border border-[#e8ecf2] bg-[#f8fafc] px-2.5 py-0.5 text-xs font-medium text-[#475569]">
        <Briefcase className="h-3 w-3 text-[#2b4a8c]/80" aria-hidden />
        {cvWorkArrangementLabel(x?.workArrangement)}
      </span>
    </div>
  )

  const actionButtons = (
    <>
      <Button
        type="button"
        size="sm"
        className={
          hrLayout
            ? 'gap-1.5 bg-[#2b4a8c] font-semibold text-white shadow-sm hover:bg-[#223d73]'
            : 'gap-1.5'
        }
        variant={hrLayout ? 'default' : 'secondary'}
        onClick={openDownloadDialog}
      >
        <Download className="h-3.5 w-3.5" aria-hidden />
        Tải CV
      </Button>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={hrLayout ? 'border-[#cfd8e8] bg-white hover:bg-[#e8f0fe]' : undefined}
          disabled={st === 'XEM_XET'}
          onClick={() => onUpdateStatus(x.id, 'XEM_XET')}
        >
          Xem xét
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={hrLayout ? 'border-[#cfd8e8] bg-white hover:bg-[#e8f0fe]' : undefined}
          disabled={st === 'PHONG_VAN'}
          onClick={() => onUpdateStatus(x.id, 'PHONG_VAN')}
        >
          Phỏng vấn
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={st === 'LOAI'}
          onClick={() => onUpdateStatus(x.id, 'LOAI')}
        >
          Loại
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={
            hrLayout
              ? 'border-destructive/40 text-destructive hover:bg-destructive/10'
              : 'border-destructive/50 text-destructive'
          }
          disabled={deletingCvId === x.id}
          onClick={() =>
            setDeleteDialog({ id: x.id, fullName: String(x?.fullName || '').trim() || 'Ứng viên' })
          }
        >
          {deletingCvId === x.id ? 'Đang xóa…' : 'Xóa'}
        </Button>
      </div>
    </>
  )

  return (
    <>
    <div
      className={`group relative gap-0 overflow-hidden ${
        hrLayout
          ? 'flex flex-col rounded-2xl border border-[#e8ecf2] bg-white shadow-sm transition-[box-shadow,border-color] duration-200 hover:border-[#d0dae8] hover:shadow-md'
          : 'flex flex-col rounded-lg border md:flex-row md:items-stretch'
      }`}
    >
      {hrLayout ? (
        <div
          className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#2b4a8c] via-[#2b4a8c] to-sky-500/85"
          aria-hidden
        />
      ) : null}
      <div className={`flex min-w-0 flex-1 gap-4 p-4 md:p-5 ${hrLayout ? 'pl-5 md:pl-6' : ''}`}>
        <div
          className={`hidden h-14 w-14 shrink-0 place-items-center rounded-2xl text-sm font-bold tracking-tight sm:grid ${
            hrLayout
              ? 'bg-gradient-to-br from-[#e8f0fe] to-[#d4e4fc] text-[#2b4a8c] shadow-inner'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {cvApplicantInitials(x?.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className={`truncate text-base font-semibold ${hrLayout ? 'text-[#1a2744]' : ''}`}>
              {x?.fullName || '—'}
            </span>
            <span className={`hidden text-sm sm:inline ${hrLayout ? 'text-[#94a3b8]' : 'text-muted-foreground'}`}>
              ·
            </span>
            <span
              className={`min-w-0 truncate text-sm font-medium ${hrLayout ? 'text-[#2b4a8c]' : 'text-primary'}`}
              title={x?.jobTitle}
            >
              {x?.jobTitle || '—'}
            </span>
          </div>
          <div
            className={`mt-2.5 flex flex-col gap-1.5 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1 ${
              hrLayout ? 'text-[#64748b]' : 'text-muted-foreground'
            }`}
          >
            {x?.email ? (
              <span className="inline-flex items-center gap-1.5 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                <span className="truncate">{x.email}</span>
              </span>
            ) : null}
            {x?.phone ? (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                {x.phone}
              </span>
            ) : null}
          </div>
          {hrLayout ? (
            <div className="mt-1.5 flex min-h-[1.25rem] items-center justify-between gap-3">
              <span className="min-w-0 flex-1 text-xs sm:text-sm text-[#94a3b8]">
                {x?.createdAt ? new Date(x.createdAt).toLocaleString('vi-VN') : ''}
              </span>
              {statusPillOnly}
            </div>
          ) : x?.createdAt ? (
            <div className={`mt-1.5 text-xs sm:text-sm text-muted-foreground`}>
              {new Date(x.createdAt).toLocaleString('vi-VN')}
            </div>
          ) : null}
          {x?.source ? (
            <div className={`mt-1 text-xs ${hrLayout ? 'text-[#94a3b8]' : 'text-muted-foreground'}`}>
              Nguồn: {x.source}
            </div>
          ) : null}
          {!hrLayout ? (
            <>
              <div className="mt-3">{statusBadgesRowFull}</div>
              <div
                className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
                  'border-border bg-muted/20 text-muted-foreground'
                }`}
              >
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground/90">{x?.cvOriginalName || '—'}</div>
                  {!hideFilePath && x?.cvStoredPath ? (
                    <div className="mt-0.5 truncate font-mono text-[10px] opacity-80">{x.cvStoredPath}</div>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {hrLayout ? (
        <div className="flex flex-col gap-2 border-t border-[#f0f2f6] bg-[#fafbfd]/80 p-4 sm:flex-row sm:flex-wrap sm:items-center md:px-5 md:pl-6">
          {actionButtons}
        </div>
      ) : (
        <div
          className={`flex shrink-0 flex-col justify-center gap-2 border-t p-4 sm:flex-row sm:flex-wrap md:border-l md:border-t-0 md:max-w-md`}
        >
          {actionButtons}
        </div>
      )}
    </div>

    {downloadDialog ? (
      <div className="fixed inset-0 z-[90]">
        <button
          type="button"
          className="absolute inset-0 cursor-default bg-black/40"
          aria-label="Đóng"
          onClick={() => (downloadRunning ? null : setDownloadDialog(null))}
        />
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-4">
          <div
            className={`pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-xl ${
              hrLayout ? 'border-[#e4e8ef] shadow-[0_24px_64px_rgba(15,23,42,0.18)]' : ''
            }`}
          >
            <div className={`border-b p-5 ${hrLayout ? 'border-[#eef1f6] bg-[#fafbfd]' : ''}`}>
              <div className="flex items-start gap-3">
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    hrLayout ? 'bg-[#e8f0fe] text-[#2b4a8c]' : 'bg-primary/10 text-primary'
                  }`}
                >
                  <Download className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-base font-semibold ${hrLayout ? 'text-[#1a2744]' : ''}`}>
                    Tải CV về máy?
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    File:{' '}
                    <span className="font-medium text-foreground">{downloadDialog.fileLabel}</span>
                  </p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    Đường dẫn trên máy chủ:{' '}
                    <span className="font-mono text-[11px] text-foreground/80">{downloadDialog.pathLabel}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-5">
              <Button
                type="button"
                variant="outline"
                disabled={downloadRunning}
                onClick={() => setDownloadDialog(null)}
              >
                Huỷ
              </Button>
              <Button
                type="button"
                className={hrLayout ? 'bg-[#2b4a8c] font-semibold hover:bg-[#223d73]' : ''}
                disabled={downloadRunning}
                onClick={runConfirmedDownload}
              >
                {downloadRunning ? 'Đang tải…' : 'Tải xuống'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    ) : null}

    {deleteDialog ? (
      <div className="fixed inset-0 z-[90]">
        <button
          type="button"
          className="absolute inset-0 cursor-default bg-black/40"
          aria-label="Đóng"
          onClick={() => (deletingCvId === deleteDialog.id ? null : setDeleteDialog(null))}
        />
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-4">
          <div
            className={`pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-xl ${
              hrLayout ? 'border-[#e4e8ef] shadow-[0_24px_64px_rgba(15,23,42,0.18)]' : ''
            }`}
          >
            <div className={`border-b p-5 ${hrLayout ? 'border-[#eef1f6] bg-[#fafbfd]' : ''}`}>
              <div className={`text-base font-semibold ${hrLayout ? 'text-[#1a2744]' : ''}`}>
                Xác nhận xóa hồ sơ
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Bạn có chắc chắn muốn xóa hồ sơ của{' '}
                <b className="text-foreground">{deleteDialog.fullName}</b>? File CV sẽ bị xóa vĩnh viễn và không thể
                hoàn tác.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 p-5">
              <Button
                type="button"
                variant="outline"
                disabled={deletingCvId === deleteDialog.id}
                onClick={() => setDeleteDialog(null)}
              >
                Huỷ
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deletingCvId === deleteDialog.id}
                onClick={() => {
                  onDelete(deleteDialog.id)
                  setDeleteDialog(null)
                }}
              >
                {deletingCvId === deleteDialog.id ? 'Đang xóa…' : 'Xóa hồ sơ'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    ) : null}
    </>
  )
}

function UploadField({ value, onChange, onUpload, uploading, placeholder }) {
  const fileRef = useRef(null)
  return (
    <div className="flex gap-2">
      <Input value={value || ''} readOnly disabled placeholder={placeholder} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onUpload?.(e.target.files?.[0] || null)}
      />
      <Button
        type="button"
        variant="outline"
        disabled={!!uploading}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? 'Đang up…' : 'Upload'}
      </Button>
      <Button
        type="button"
        variant="destructive"
        disabled={!!uploading || !value}
        onClick={() => onChange?.('')}
      >
        Xóa
      </Button>
    </div>
  )
}

function defaultJob() {
  return {
    id: null,
    title: '',
    applyStartDate: '',
    applyEndDate: '',
    address: '',
    jobType: 'IT',
    recruitmentHeadcount: 1,
    workArrangement: 'ALL',
    salaryInputMode: 'RANGE', // RANGE | SPECIFIC | NEGOTIABLE
    salaryNegotiable: false,
    salaryMinMillion: '',
    salaryMaxMillion: '',
    salary: '',
    imageUrl: '',
    description: '',
    published: false,
    sortOrder: 0,
  }
}

/** Text hiển thị công khai — đồng bộ từ lựa chọn trên (HR có thể sửa tay sau). */
function buildSalaryDisplayFromStructure(inputMode, minStr, maxStr) {
  if (inputMode === 'NEGOTIABLE') return 'Thỏa thuận'
  const a = Number(minStr)
  const b = Number(maxStr)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return ''
  if (inputMode === 'SPECIFIC') {
    const n = Math.floor(Math.min(a, b))
    return `${n} triệu`
  }
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  if (lo >= hi) return ''
  return `Lên tới ${hi} triệu`
}

/** Gán min/max / thỏa thuận khi mở job (API mới hoặc chỉ có chuỗi salary cũ). */
function inferLegacySalaryFields(job) {
  if (!job || typeof job !== 'object') {
    return {
      salaryInputMode: 'RANGE',
      salaryNegotiable: false,
      salaryMinMillion: '',
      salaryMaxMillion: '',
      salary: '',
    }
  }
  if (job.salaryNegotiable === true) {
    return {
      salaryInputMode: 'NEGOTIABLE',
      salaryNegotiable: true,
      salaryMinMillion: '',
      salaryMaxMillion: '',
      salary: String(job.salary || '').trim() || 'Thỏa thuận',
    }
  }
  if (job.salaryMinMillion != null && job.salaryMaxMillion != null) {
    const minS = String(job.salaryMinMillion)
    const maxS = String(job.salaryMaxMillion)
    const mi = Number(minS)
    const ma = Number(maxS)
    const specific = Number.isFinite(mi) && Number.isFinite(ma) && mi === ma
    const mode = specific ? 'SPECIFIC' : 'RANGE'
    const display =
      String(job.salary || '').trim() || buildSalaryDisplayFromStructure(mode, minS, maxS)
    return {
      salaryInputMode: mode,
      salaryNegotiable: false,
      salaryMinMillion: minS,
      salaryMaxMillion: maxS,
      salary: display,
    }
  }
  const raw = String(job.salary || '').trim().toLowerCase()
  if (/thỏa thuận|thương lượng|negotiat|deal|lương\s*cạnh/.test(raw)) {
    return {
      salaryInputMode: 'NEGOTIABLE',
      salaryNegotiable: true,
      salaryMinMillion: '',
      salaryMaxMillion: '',
      salary: String(job.salary || '').trim() || 'Thỏa thuận',
    }
  }
  const text = String(job.salary || '')
  const nums = []
  const re = /(\d+)\s*(?:triệu|tr\b|m\b)?/gi
  let mm
  while ((mm = re.exec(text)) !== null) {
    const n = Number(mm[1])
    if (n >= 0 && n <= 500) nums.push(n)
  }
  if (nums.length >= 2) {
    const a = String(Math.min(...nums))
    const b = String(Math.max(...nums))
    return {
      salaryInputMode: 'RANGE',
      salaryNegotiable: false,
      salaryMinMillion: a,
      salaryMaxMillion: b,
      salary: String(job.salary || '').trim() || buildSalaryDisplayFromStructure('RANGE', a, b),
    }
  }
  if (nums.length === 1) {
    const n = String(nums[0])
    return {
      salaryInputMode: 'SPECIFIC',
      salaryNegotiable: false,
      salaryMinMillion: n,
      salaryMaxMillion: n,
      salary: String(job.salary || '').trim() || buildSalaryDisplayFromStructure('SPECIFIC', n, n),
    }
  }
  return {
    salaryInputMode: 'RANGE',
    salaryNegotiable: false,
    salaryMinMillion: '',
    salaryMaxMillion: '',
    salary: String(job.salary || '').trim(),
  }
}

function loadAdminUiState() {
  if (typeof window === 'undefined') {
    return { siteCategory: 'general', homePanel: 'hero', careersPanel: 'hero', benefitsPanel: 'hero' }
  }
  try {
    const raw = localStorage.getItem(ADMIN_UI_STATE_KEY)
    if (!raw) return { siteCategory: 'general', homePanel: 'hero', careersPanel: 'hero', benefitsPanel: 'hero' }
    const parsed = JSON.parse(raw)
    return {
      siteCategory: ['general', 'home', 'careers', 'benefits'].includes(parsed?.siteCategory)
        ? parsed.siteCategory
        : 'general',
      homePanel: (() => {
        const p = parsed?.homePanel
        if (p === 'menu') return 'hero'
        return ['hero', 'join', 'testimonials', 'culture', 'cta', 'footer'].includes(p) ? p : 'hero'
      })(),
      careersPanel: ['hero'].includes(parsed?.careersPanel) ? parsed.careersPanel : 'hero',
      benefitsPanel: ['hero', 'content', 'cta'].includes(parsed?.benefitsPanel)
        ? parsed.benefitsPanel
        : 'hero',
    }
  } catch {
    return { siteCategory: 'general', homePanel: 'hero', careersPanel: 'hero', benefitsPanel: 'hero' }
  }
}

export default function AdminDashboard() {
  const initialUiState = loadAdminUiState()
  const nav = useNavigate()
  const location = useLocation()
  const token = getToken()
  const [site, setSite] = useState(null)
  const [jobs, setJobs] = useState([])
  const [jobDraft, setJobDraft] = useState(defaultJob())
  const [savingSite, setSavingSite] = useState(false)
  const [savingJob, setSavingJob] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null) // { type: 'success' | 'error', message: string }
  const noticeRef = useRef(null)
  const [active, setActive] = useState('site')
  const [siteCategory, setSiteCategory] = useState(initialUiState.siteCategory) // general/home/careers/benefits
  const [homePanel, setHomePanel] = useState(initialUiState.homePanel) // dropdown: hero/join/…/footer
  const [careersPanel, setCareersPanel] = useState(initialUiState.careersPanel) // dropdown: hero
  const [benefitsPanel, setBenefitsPanel] = useState(initialUiState.benefitsPanel) // dropdown: hero/content/cta

  const [sections, setSections] = useState({
    hero: true,
    about: false,
    join: true,
    careers: true,
    testimonials: true,
    culture: true,
    benefits: false,
    footer: true,
  })
  const [navItems, setNavItems] = useState([
    { label: 'Trang chủ', href: '#home' },
    { label: 'Cơ hội nghề nghiệp', href: '/careers' },
    { label: 'Quyền lợi', href: '/benefits' },
  ])
  const [joinTitle, setJoinTitle] = useState('TRỞ THÀNH SAVYTECH NGAY HÔM NAY')
  const [joinCards, setJoinCards] = useState([
    { imageUrl: '', title: '', body: '' },
    { imageUrl: '', title: '', body: '' },
    { imageUrl: '', title: '', body: '' },
  ])
  const [testimonialsTitle, setTestimonialsTitle] = useState('NGƯỜI SAVYTECH NÓI GÌ')
  const [testimonialsItems, setTestimonialsItems] = useState([
    { imageUrl: '', quote: '', role: '' },
    { imageUrl: '', quote: '', role: '' },
    { imageUrl: '', quote: '', role: '' },
  ])
  const [cultureTitle, setCultureTitle] = useState('VĂN HÓA - SỰ KIỆN')
  const [cultureItems, setCultureItems] = useState([
    { label: 'Văn hoá', imageUrl: '', body: '' },
    { label: 'Sự kiện', imageUrl: '', body: '' },
  ])
  const [footerOffices, setFooterOffices] = useState([
    {
      title: 'Trụ sở chính',
      address:
        'Hà Nội Tầng 3, tòa CT1, tòa nhà Bắc Hà C14, phố Tố Hữu, phường Đại Mỗ, thành phố Hà Nội, Việt Nam',
      phone: '0793313076',
      email: 'hrsavytech@gmail.com',
    },
    {
      title: 'Văn phòng Hà Nội',
      address:
        'Hà Nội Tầng 3, tòa CT1, tòa nhà Bắc Hà C14, phố Tố Hữu, phường Đại Mỗ, thành phố Hà Nội, Việt Nam',
      phone: '',
      email: '',
    },
    {
      title: 'Văn phòng Đà Nẵng',
      address:
        'Tầng 10, Tòa nhà SHB Đà Nẵng, số 06 Nguyễn Văn Linh, phường Hải Châu, thành phố Đà Nẵng, Việt Nam',
      phone: '',
      email: '',
    },
  ])
  const [footerContactHeading, setFooterContactHeading] = useState('Trung tâm Thu hút Nguồn nhân lực')
  const [footerCopyright, setFooterCopyright] = useState('')
  const [footerSocialSubtitle, setFooterSocialSubtitle] = useState('')
  const [footerSupportEmail, setFooterSupportEmail] = useState('')
  const [footerHotline, setFooterHotline] = useState('')
  const [footerSocFacebook, setFooterSocFacebook] = useState('')
  const [footerSocYoutube, setFooterSocYoutube] = useState('')
  const [footerSocInstagram, setFooterSocInstagram] = useState('')
  const [footerSocZalo, setFooterSocZalo] = useState('')
  const [benefitsList, setBenefitsList] = useState([])
  const [rightsList, setRightsList] = useState([])
  const [benefitsCards, setBenefitsCards] = useState([
    { title: 'Lộ trình phát triển rõ ràng', imageUrl: '', body: '' },
    { title: 'Thu nhập cạnh tranh', imageUrl: '', body: '' },
    { title: 'Trợ cấp không giới hạn', imageUrl: '', body: '' },
    { title: 'Môi trường làm việc năng động', imageUrl: '', body: '' },
  ])

  const [testimonialsPage, setTestimonialsPage] = useState(1)
  const [culturePage, setCulturePage] = useState(1)
  const [footerPage, setFooterPage] = useState(1)
  const [benefitsCardsPage, setBenefitsCardsPage] = useState(1)
  const [jobsPage, setJobsPage] = useState(1)
  const [jobKeyword, setJobKeyword] = useState('')
  const [jobStatusFilter, setJobStatusFilter] = useState('all') // all / published / draft
  const [jobTypeFilter, setJobTypeFilter] = useState('all') // all / IT / NON_IT
  const [jobAddressFilter, setJobAddressFilter] = useState('')
  const [cvs, setCvs] = useState([])
  const [loadingCvs, setLoadingCvs] = useState(false)
  const [cvsPage, setCvsPage] = useState(1)
  const [cvStatusFilter, setCvStatusFilter] = useState('all')
  const [cvJobIdFilters, setCvJobIdFilters] = useState([])
  const [cvInterviewWorkFilters, setCvInterviewWorkFilters] = useState([])
  const [cvInterviewJobIdFilters, setCvInterviewJobIdFilters] = useState([])
  const [cvsInterviewPage, setCvsInterviewPage] = useState(1)
  const [cvSearchKeyword, setCvSearchKeyword] = useState('')
  const [cvSortOrder, setCvSortOrder] = useState('newest')
  const [deletingCvId, setDeletingCvId] = useState(null)
  const [jobDeleteModal, setJobDeleteModal] = useState({ open: false, job: null })
  const [deletingJob, setDeletingJob] = useState(false)

  function notifySuccess(message) {
    setNotice({ type: 'success', message: String(message || 'Thành công') })
  }

  function notifyError(message) {
    setNotice({ type: 'error', message: String(message || 'Thất bại') })
  }

  function confirmDelete(message) {
    return window.confirm(message || 'Bạn chắc chắn muốn xóa?')
  }

  useEffect(() => {
    if (!token) nav('/admin/login', { replace: true })
  }, [token, nav])

  useEffect(() => {
    if (!token) return
    const role = normalizeAdminRole(getRole())
    const p = String(location?.pathname || '')
    if (role === 'HR') {
      if (p === '/admin' || p.startsWith('/admin/site')) {
        nav('/admin/jobs', { replace: true })
      }
      return
    }
    if (
      role === 'DESIGN' &&
      (p.startsWith('/admin/jobs') ||
        p.startsWith('/admin/job-edit') ||
        p.startsWith('/admin/cv'))
    ) {
      nav('/admin/site', { replace: true })
    }
  }, [token, location.pathname, nav])

  useEffect(() => {
    const p = String(location?.pathname || '')
    if (p.startsWith('/admin/jobs')) setActive('jobs')
    else if (p.startsWith('/admin/job-edit')) setActive('job-edit')
    else if (p.startsWith('/admin/site')) setActive('site')
    else if (p.startsWith('/admin/cv/interview')) setActive('cv-interview')
    else if (p.startsWith('/admin/cv')) setActive('cv')
    else if (p === '/admin') setActive('site')
  }, [location?.pathname])

  useEffect(() => {
    if (!notice) return
    function onAnyPointerDown(e) {
      const el = noticeRef.current
      if (!el) {
        setNotice(null)
        return
      }
      if (!el.contains(e.target)) setNotice(null)
    }
    window.addEventListener('pointerdown', onAnyPointerDown, true)
    return () => window.removeEventListener('pointerdown', onAnyPointerDown, true)
  }, [notice])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const next = JSON.stringify({ siteCategory, homePanel, careersPanel, benefitsPanel })
    localStorage.setItem(ADMIN_UI_STATE_KEY, next)
  }, [siteCategory, homePanel, careersPanel, benefitsPanel])

  function uploadAndSet(setter) {
    return async (file) => {
      if (!file) return
      setUploading(true)
      setError(null)
      try {
        const res = await adminApi.uploadImage(token, file)
        const url = res?.url || ''
        if (!url) throw new Error('Upload failed')
        setter(url)
      } catch (e) {
        setError(e?.message || 'Upload failed')
      } finally {
        setUploading(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError(null)
      try {
        const role = normalizeAdminRole(getRole())
        if (role === 'HR') {
          const j = await adminApi.jobs(token)
          if (cancelled) return
          setJobs(j || [])
          setSite(null)
          return
        }

        const s = await adminApi.site(token)
        if (cancelled) return
        setSite(s)
        setJobs([])

        const sectionObj = safeJson(s?.sectionsJson, null)
        if (sectionObj && typeof sectionObj === 'object' && !Array.isArray(sectionObj)) {
          setSections((prev) => ({ ...prev, ...sectionObj }))
        }

        const navParsed = safeJson(s?.navJson, null)
        if (Array.isArray(navParsed) && navParsed.length) {
          setNavItems(
            navParsed.map((x) => ({
              label: String(x?.label || ''),
              href: String(x?.href || ''),
            })),
          )
        }

        const joinParsed = safeJson(s?.joinKaopizerJson, null)
        if (joinParsed && typeof joinParsed === 'object' && !Array.isArray(joinParsed)) {
          if (typeof joinParsed.title === 'string' && joinParsed.title.trim()) setJoinTitle(joinParsed.title)
          if (Array.isArray(joinParsed.cards) && joinParsed.cards.length) {
            const cards = joinParsed.cards.slice(0, 3).map((c) => ({
              imageUrl: String(c?.imageUrl || ''),
              title: String(c?.title || ''),
              body: String(c?.body || ''),
            }))
            while (cards.length < 3) cards.push({ imageUrl: '', title: '', body: '' })
            setJoinCards(cards)
          }
        }

        const tParsed = safeJson(s?.testimonialsJson, null)
        if (tParsed && typeof tParsed === 'object' && !Array.isArray(tParsed)) {
          if (typeof tParsed.title === 'string' && tParsed.title.trim()) setTestimonialsTitle(tParsed.title)
          const rawItems = Array.isArray(tParsed.items) ? tParsed.items : Array.isArray(tParsed.tabs) ? tParsed.tabs : []
          if (rawItems.length) {
            const items = rawItems.map((it) => ({
              imageUrl: String(it?.imageUrl || it?.avatarUrl || ''),
              quote: String(it?.quote || ''),
              role: String(it?.role || ''),
            }))
            while (items.length < 3) items.push({ imageUrl: '', quote: '', role: '' })
            setTestimonialsItems(items)
          }
        }

        const cParsed = safeJson(s?.cultureEventsJson, null)
        if (cParsed && typeof cParsed === 'object' && !Array.isArray(cParsed)) {
          if (typeof cParsed.title === 'string' && cParsed.title.trim()) setCultureTitle(cParsed.title)
          const raw = Array.isArray(cParsed.tabs) ? cParsed.tabs : Array.isArray(cParsed.items) ? cParsed.items : []
          if (raw.length) {
            setCultureItems(
              raw.map((it) => ({
                label: String(it?.label || ''),
                imageUrl: String(it?.imageUrl || ''),
                body: String(it?.body || ''),
              })),
            )
          }
        }

        const fParsed = safeJson(s?.footerJson, null)
        if (fParsed && typeof fParsed === 'object' && !Array.isArray(fParsed)) {
          if (typeof fParsed.contactHeading === 'string') setFooterContactHeading(fParsed.contactHeading)
          if (typeof fParsed.copyright === 'string') setFooterCopyright(fParsed.copyright)
          const sb = fParsed.socialBar && typeof fParsed.socialBar === 'object' ? fParsed.socialBar : null
          if (sb) {
            if (typeof sb.subtitle === 'string') setFooterSocialSubtitle(sb.subtitle)
            if (typeof sb.supportEmail === 'string') setFooterSupportEmail(sb.supportEmail)
            if (typeof sb.hotline === 'string') setFooterHotline(sb.hotline)
            const links = Array.isArray(sb.links) ? sb.links : []
            const hrefOf = (t) => String(links.find((x) => x?.type === t)?.href || '').trim()
            setFooterSocFacebook(hrefOf('facebook'))
            setFooterSocYoutube(hrefOf('youtube'))
            setFooterSocInstagram(hrefOf('instagram'))
            setFooterSocZalo(hrefOf('zalo'))
          }
          if (Array.isArray(fParsed.offices)) {
            const rows = fParsed.offices.map((o) => ({
              title: String(o?.title || ''),
              address: String(o?.address || ''),
              phone: String(o?.phone || ''),
              email: String(o?.email || ''),
            }))
            const noPeru = rows.filter((o) => {
              const t = String(o.title || '')
                .trim()
                .toLowerCase()
              return !t.includes('peru')
            })
            setFooterOffices(noPeru.slice(0, 3))
          }
        }

        setBenefitsList(listFromJsonArray(s?.benefitsJson))
        setRightsList(listFromJsonArray(s?.rightsJson))

        const bParsed = safeJson(s?.benefitsPageJson, null)
        if (Array.isArray(bParsed) && bParsed.length) {
          setBenefitsCards(
            bParsed.map((it) => ({
              title: String(it?.title || ''),
              imageUrl: String(it?.imageUrl || ''),
              body: String(it?.body || ''),
            })),
          )
        }
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

  useEffect(() => {
    if (active !== 'cv' && active !== 'cv-interview') return
    let cancelled = false
    setLoadingCvs(true)
    setError(null)
    adminApi
      .cvs(token)
      .then((rows) => {
        if (cancelled) return
        setCvs(Array.isArray(rows) ? rows : [])
      })
      .catch((e) => {
        if (cancelled) return
        const msg = e?.message || 'Failed to load'
        setError(msg)
        notifyError(msg)
        if (String(msg).toLowerCase().includes('401')) {
          setToken('')
          nav('/admin/login', { replace: true })
        }
      })
      .finally(() => {
        if (cancelled) return
        setLoadingCvs(false)
      })
    return () => {
      cancelled = true
    }
  }, [active, token, nav])

  const filteredJobs = useMemo(() => {
    const keyword = normalizeText(jobKeyword)
    const addressKeyword = normalizeText(jobAddressFilter)
    return (jobs || []).filter((job) => {
      if (jobStatusFilter === 'published' && !job?.published) return false
      if (jobStatusFilter === 'draft' && job?.published) return false

      if (jobTypeFilter !== 'all' && String(job?.jobType || '').toUpperCase() !== jobTypeFilter) return false

      if (keyword) {
        const haystack = [
          job?.title,
          job?.address,
          job?.salary,
          job?.description,
          job?.applyStartDate,
          job?.applyEndDate,
        ]
          .map((x) => normalizeText(x))
          .join(' ')
        if (!haystack.includes(keyword)) return false
      }

      if (addressKeyword && !normalizeText(job?.address).includes(addressKeyword)) return false

      return true
    })
  }, [jobs, jobKeyword, jobStatusFilter, jobTypeFilter, jobAddressFilter])

  const jobsTotalPages = Math.max(1, Math.ceil((filteredJobs.length || 0) / 10))
  const jobsPageSafe = Math.min(Math.max(1, jobsPage), jobsTotalPages)
  const pagedJobs = useMemo(
    () => filteredJobs.slice((jobsPageSafe - 1) * 10, jobsPageSafe * 10),
    [filteredJobs, jobsPageSafe],
  )

  useEffect(() => {
    setJobsPage(1)
  }, [jobKeyword, jobStatusFilter, jobTypeFilter, jobAddressFilter])

  const cvsForSidebarCounts = useMemo(() => {
    if (cvStatusFilter === 'all') return cvs || []
    return (cvs || []).filter((x) => String(x?.status || 'XEM_XET').toUpperCase() === cvStatusFilter)
  }, [cvs, cvStatusFilter])

  const cvJobBuckets = useMemo(() => {
    const map = new Map()
    for (const x of cvsForSidebarCounts) {
      const raw = x?.jobId
      const id = raw == null || raw === '' ? NaN : Number(raw)
      if (!Number.isFinite(id)) continue
      const title =
        id === 0
          ? 'Khác / vị trí tự mô tả'
          : String(x?.jobTitle || '').trim() || `Vị trí #${id}`
      if (!map.has(id)) map.set(id, { id, title, count: 0 })
      map.get(id).count++
    }
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, 'vi'))
  }, [cvsForSidebarCounts])

  const cvStats = useMemo(() => {
    const all = cvs || []
    let pending = 0
    let interview = 0
    for (const x of all) {
      const st = String(x?.status || 'XEM_XET').toUpperCase()
      if (st === 'PHONG_VAN') interview++
      else if (st === 'XEM_XET') pending++
    }
    return { total: all.length, pending, interview }
  }, [cvs])

  const filteredCvs = useMemo(() => {
    let list = cvsForSidebarCounts
    if (cvJobIdFilters.length) {
      list = list.filter((x) => cvJobIdFilters.includes(Number(x?.jobId)))
    }
    const q = normalizeText(cvSearchKeyword)
    if (q) {
      list = list.filter((x) => {
        const haystack = [x?.fullName, x?.email, x?.phone, x?.jobTitle].map(normalizeText).join(' ')
        return haystack.includes(q)
      })
    }
    const dir = cvSortOrder === 'oldest' ? 1 : -1
    return [...list].sort((a, b) => {
      const ta = new Date(a?.createdAt || 0).getTime()
      const tb = new Date(b?.createdAt || 0).getTime()
      return (ta - tb) * dir
    })
  }, [cvsForSidebarCounts, cvJobIdFilters, cvSearchKeyword, cvSortOrder])

  const cvsTotalPages = Math.max(1, Math.ceil((filteredCvs.length || 0) / 10))
  const cvsPageSafe = Math.min(Math.max(1, cvsPage), cvsTotalPages)
  const pagedCvs = useMemo(
    () => filteredCvs.slice((cvsPageSafe - 1) * 10, cvsPageSafe * 10),
    [filteredCvs, cvsPageSafe],
  )

  useEffect(() => {
    setCvsPage(1)
  }, [cvStatusFilter, cvJobIdFilters, cvSearchKeyword, cvSortOrder])

  function toggleCvJobFilter(jobId) {
    setCvJobIdFilters((prev) =>
      prev.includes(jobId) ? prev.filter((x) => x !== jobId) : [...prev, jobId],
    )
  }

  function resetCvFiltersAll() {
    setCvStatusFilter('all')
    setCvJobIdFilters([])
    setCvSearchKeyword('')
    setCvSortOrder('newest')
  }

  function resetCvInterviewAdvancedFilters() {
    setCvInterviewWorkFilters([])
    setCvInterviewJobIdFilters([])
  }

  const cvsPhongVanOnly = useMemo(
    () =>
      (cvs || []).filter((x) => String(x?.status || 'XEM_XET').toUpperCase() === 'PHONG_VAN'),
    [cvs],
  )

  const cvPhongVanCount = cvsPhongVanOnly.length

  const cvInterviewWorkFilterCounts = useMemo(() => {
    const m = { FULL_TIME: 0, PART_TIME: 0, INTERN: 0, COLLABORATOR: 0, UNSPEC: 0 }
    for (const x of cvsPhongVanOnly) {
      const k = cvWorkCategoryKey(x?.workArrangement)
      m[k] = (m[k] || 0) + 1
    }
    return m
  }, [cvsPhongVanOnly])

  const cvInterviewJobBuckets = useMemo(() => {
    const map = new Map()
    for (const x of cvsPhongVanOnly) {
      const raw = x?.jobId
      const id = raw == null || raw === '' ? NaN : Number(raw)
      if (!Number.isFinite(id)) continue
      const title =
        id === 0
          ? 'Khác / vị trí tự mô tả'
          : String(x?.jobTitle || '').trim() || `Vị trí #${id}`
      if (!map.has(id)) map.set(id, { id, title, count: 0 })
      map.get(id).count++
    }
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, 'vi'))
  }, [cvsPhongVanOnly])

  const filteredInterviewCvs = useMemo(() => {
    let list = cvsPhongVanOnly
    if (cvInterviewWorkFilters.length) {
      list = list.filter((x) => cvInterviewWorkFilters.includes(cvWorkCategoryKey(x?.workArrangement)))
    }
    if (cvInterviewJobIdFilters.length) {
      list = list.filter((x) => cvInterviewJobIdFilters.includes(Number(x?.jobId)))
    }
    return list
  }, [cvsPhongVanOnly, cvInterviewWorkFilters, cvInterviewJobIdFilters])

  const cvsInterviewTotalPages = Math.max(1, Math.ceil((filteredInterviewCvs.length || 0) / 10))
  const cvsInterviewPageSafe = Math.min(Math.max(1, cvsInterviewPage), cvsInterviewTotalPages)
  const pagedInterviewCvs = useMemo(
    () =>
      filteredInterviewCvs.slice((cvsInterviewPageSafe - 1) * 10, cvsInterviewPageSafe * 10),
    [filteredInterviewCvs, cvsInterviewPageSafe],
  )

  useEffect(() => {
    setCvsInterviewPage(1)
  }, [cvInterviewWorkFilters, cvInterviewJobIdFilters])

  function toggleCvInterviewWorkFilter(id) {
    setCvInterviewWorkFilters((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function toggleCvInterviewJobFilter(jobId) {
    setCvInterviewJobIdFilters((prev) =>
      prev.includes(jobId) ? prev.filter((x) => x !== jobId) : [...prev, jobId],
    )
  }

  async function deleteCv(id) {
    setDeletingCvId(id)
    setError(null)
    try {
      await adminApi.deleteCv(token, id)
      setCvs((prev) => prev.filter((x) => x.id !== id))
      notifySuccess('Đã xóa hồ sơ và file CV.')
    } catch (e) {
      const msg = e?.message || 'Xóa CV thất bại'
      setError(msg)
      notifyError(msg)
    } finally {
      setDeletingCvId(null)
    }
  }

  async function updateCvStatus(id, status) {
    try {
      const updated = await adminApi.updateCvStatus(token, id, status)
      setCvs((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      notifySuccess(`Đã gán loại CV: "${adminCvStatusLabel(status)}".`)
    } catch (err) {
      notifyError(err?.message || 'Cập nhật trạng thái CV thất bại')
    }
  }

  async function saveSite() {
    if (!site) return
    setSavingSite(true)
    setError(null)
    setNotice(null)
    try {
      if (sections.testimonials) {
        const cleaned = (testimonialsItems || []).map((x) => ({
          imageUrl: String(x.imageUrl || '').trim(),
          quote: String(x.quote || '').trim(),
          role: String(x.role || '').trim(),
        }))

        const filled = cleaned.filter((x) => x.imageUrl || x.quote || x.role)
        if (filled.length < 3) {
          throw new Error('“Người Savytech nói gì”: Bắt buộc tối thiểu 3 mục (ảnh + chữ).')
        }
        const invalid = filled.find((x) => !x.imageUrl || !x.quote || !x.role)
        if (invalid) {
          throw new Error('“Người Savytech nói gì”: Mỗi mục bắt buộc nhập đủ Ảnh + Nội dung + Chức danh.')
        }
      }

      const payload = {
        ...site,
        sectionsJson: JSON.stringify({ ...sections, about: false, benefits: false }),
        navJson: JSON.stringify(
          (navItems || []).map((x) => ({
            label: String(x.label || '').trim(),
            href: String(x.href || '').trim(),
          })),
        ),
        joinKaopizerJson: JSON.stringify({
          title: String(joinTitle || '').trim(),
          cards: (joinCards || []).slice(0, 3).map((c) => ({
            imageUrl: String(c.imageUrl || '').trim(),
            title: String(c.title || '').trim(),
            body: String(c.body || '').trim(),
          })),
        }),
        testimonialsJson: JSON.stringify({
          title: String(testimonialsTitle || '').trim(),
          items: (testimonialsItems || []).map((it) => ({
            imageUrl: String(it.imageUrl || '').trim(),
            quote: String(it.quote || '').trim(),
            role: String(it.role || '').trim(),
          })),
        }),
        cultureEventsJson: JSON.stringify({
          title: String(cultureTitle || '').trim(),
          tabs: (cultureItems || []).map((it) => ({
            label: String(it.label || '').trim(),
            imageUrl: String(it.imageUrl || '').trim(),
            body: String(it.body || '').trim(),
          })),
        }),
        footerJson: JSON.stringify({
          contactHeading: String(footerContactHeading || '').trim(),
          copyright: String(footerCopyright || '').trim(),
          socialBar: {
            subtitle: String(footerSocialSubtitle || '').trim(),
            supportEmail: String(footerSupportEmail || '').trim(),
            hotline: String(footerHotline || '').trim(),
            links: [
              { type: 'facebook', href: String(footerSocFacebook || '').trim() },
              { type: 'youtube', href: String(footerSocYoutube || '').trim() },
              { type: 'instagram', href: String(footerSocInstagram || '').trim() },
              { type: 'zalo', href: String(footerSocZalo || '').trim() },
            ].filter((x) => x.href),
          },
          offices: (footerOffices || []).map((o) => ({
            title: String(o.title || '').trim(),
            address: String(o.address || '').trim(),
            phone: String(o.phone || '').trim(),
            email: String(o.email || '').trim(),
          })),
        }),
        benefitsJson: jsonArrayFromList(benefitsList),
        rightsJson: jsonArrayFromList(rightsList),
        benefitsPageJson: JSON.stringify(
          (benefitsCards || []).map((it) => ({
            title: String(it.title || '').trim(),
            imageUrl: String(it.imageUrl || '').trim(),
            body: String(it.body || '').trim(),
          })),
        ),
      }

      const updated = await adminApi.upsertSite(token, payload)
      setSite(updated)
      notifySuccess('Đã lưu nội dung thành công.')
    } catch (e) {
      const msg = e?.message || 'Save failed'
      setError(msg)
      notifyError(msg)
    } finally {
      setSavingSite(false)
    }
  }

  async function saveJob() {
    setSavingJob(true)
    setError(null)
    setNotice(null)
    try {
      const start = jobDraft.applyStartDate?.trim() || null
      const end = jobDraft.applyEndDate?.trim() || null
      if (start && end && start > end) {
        throw new Error('Ngày kết thúc nhận hồ sơ phải sau hoặc trùng ngày bắt đầu.')
      }
      const sortOrderRaw = Number(jobDraft.sortOrder)
      const sortOrder = Number.isFinite(sortOrderRaw)
        ? Math.min(100_000, Math.max(0, Math.floor(sortOrderRaw)))
        : 0

      const mode = jobDraft.salaryInputMode || (jobDraft.salaryNegotiable ? 'NEGOTIABLE' : 'RANGE')
      const negotiable = mode === 'NEGOTIABLE'
      let salaryMinMillion = null
      let salaryMaxMillion = null
      if (!negotiable) {
        if (mode === 'SPECIFIC') {
          const n = Number(jobDraft.salaryMinMillion)
          if (!Number.isFinite(n)) {
            throw new Error('Vui lòng nhập mức lương cụ thể (triệu), hoặc chọn Thỏa thuận / khoảng lương.')
          }
          if (n < 0 || n > 500) {
            throw new Error('Mức lương không hợp lệ (0–500 triệu).')
          }
          const f = Math.floor(n)
          salaryMinMillion = f
          salaryMaxMillion = f
        } else {
          const mi = Number(jobDraft.salaryMinMillion)
          const ma = Number(jobDraft.salaryMaxMillion)
          if (!Number.isFinite(mi) || !Number.isFinite(ma)) {
            throw new Error('Vui lòng nhập mức lương từ và đến (triệu), hoặc chọn Thỏa thuận / mức cụ thể.')
          }
          if (mi >= ma) {
            throw new Error(
              'Khoảng lương: ô "Từ" phải nhỏ hơn "Đến". Nếu chỉ một mức, chọn Mức cụ thể.',
            )
          }
          if (mi < 0 || ma > 500) {
            throw new Error('Mức lương không hợp lệ (0–500 triệu).')
          }
          salaryMinMillion = Math.floor(mi)
          salaryMaxMillion = Math.floor(ma)
        }
      }

      const dto = {
        ...jobDraft,
        imageUrl: jobDraft.imageUrl || null,
        applyStartDate: start,
        applyEndDate: end,
        address: jobDraft.address || null,
        jobType: jobDraft.jobType || null,
        salary: jobDraft.salary || null,
        salaryNegotiable: negotiable,
        salaryMinMillion: negotiable ? null : salaryMinMillion,
        salaryMaxMillion: negotiable ? null : salaryMaxMillion,
        recruitmentHeadcount: (() => {
          const n = Number(jobDraft.recruitmentHeadcount)
          if (!Number.isFinite(n) || n < 1) return null
          return Math.floor(n)
        })(),
        workArrangement: jobDraft.workArrangement || null,
        sortOrder,
      }
      delete dto.salaryInputMode
      if (dto.id) {
        const updated = await adminApi.updateJob(token, dto.id, dto)
        setJobs((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
        notifySuccess('Đã lưu job thành công.')
      } else {
        const created = await adminApi.createJob(token, dto)
        setJobs((prev) => [created, ...prev])
        notifySuccess('Đã tạo job thành công.')
      }
      setJobDraft(defaultJob())
      nav('/admin/jobs')
    } catch (e) {
      const msg = e?.message || 'Save job failed'
      setError(msg)
      notifyError(msg)
    } finally {
      setSavingJob(false)
    }
  }

  function requestDeleteJob(job) {
    if (!job?.id) return
    setJobDeleteModal({ open: true, job: { id: job.id, title: String(job.title || '') } })
  }

  async function deleteJob(id) {
    if (!id) return
    setError(null)
    setNotice(null)
    setDeletingJob(true)
    try {
      await adminApi.deleteJob(token, id)
      setJobs((prev) => prev.filter((x) => x.id !== id))
      if (jobDraft.id === id) setJobDraft(defaultJob())
      notifySuccess('Đã xóa job.')
    } catch (e) {
      const msg = e?.message || 'Delete failed'
      setError(msg)
      notifyError(msg)
    } finally {
      setDeletingJob(false)
      setJobDeleteModal({ open: false, job: null })
    }
  }

  async function togglePublish(job) {
    if (!job?.id) return
    setError(null)
    setNotice(null)
    setSavingJob(true)
    try {
      const dto = {
        id: job.id,
        title: job.title || '',
        applyStartDate: job.applyStartDate || null,
        applyEndDate: job.applyEndDate || null,
        address: job.address || null,
        jobType: job.jobType || null,
        salary: job.salary || null,
        salaryNegotiable: job.salaryNegotiable === true,
        salaryMinMillion: job.salaryMinMillion != null ? job.salaryMinMillion : null,
        salaryMaxMillion: job.salaryMaxMillion != null ? job.salaryMaxMillion : null,
        recruitmentHeadcount: job.recruitmentHeadcount ?? null,
        workArrangement: job.workArrangement || null,
        imageUrl: job.imageUrl || null,
        description: job.description || '',
        published: !job.published,
        sortOrder: Number(job.sortOrder || 0),
      }
      const updated = await adminApi.updateJob(token, job.id, dto)
      setJobs((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      if (jobDraft.id === updated.id) setJobDraft((prev) => ({ ...prev, published: updated.published }))
      notifySuccess(updated.published ? 'Đã hiển thị job (Published).' : 'Đã ẩn job (Draft).')
    } catch (e) {
      const msg = e?.message || 'Update failed'
      setError(msg)
      notifyError(msg)
    } finally {
      setSavingJob(false)
    }
  }

  function logout() {
    setToken('')
    nav('/admin/login', { replace: true })
  }

  const adminNavItems = useMemo(() => {
    const role = normalizeAdminRole(getRole())
    if (role === 'HR') {
      return [
        { id: 'jobs', label: 'Tuyển dụng', path: '/admin/jobs', Icon: BriefcaseBusiness },
        { id: 'job-edit', label: 'Thêm / Sửa job', path: '/admin/job-edit', Icon: FilePenLine },
        { id: 'cv', label: 'Quản lý CV', path: '/admin/cv', Icon: Files },
        {
          id: 'cv-interview',
          label: 'CV đi phỏng vấn',
          path: '/admin/cv/interview',
          Icon: CalendarCheck,
          badgeCount: true,
        },
      ]
    }
    return [{ id: 'site', label: 'Nội dung trang (Design)', path: '/admin/site', Icon: null }]
  }, [token, location.pathname])

  const hrChrome = normalizeAdminRole(getRole()) === 'HR'

  return (
    <div
      className={hrChrome ? 'min-h-screen text-foreground' : 'min-h-screen bg-background'}
      style={hrChrome ? { backgroundColor: HR_PAGE_BG } : undefined}
    >
      <header
        className={
          hrChrome
            ? 'sticky top-0 z-40 border-b border-[#e4e8ef] bg-white/90 shadow-[0_1px_0_rgba(43,74,140,0.05)] backdrop-blur-md'
            : 'sticky top-0 z-40 border-b bg-background/95 backdrop-blur'
        }
      >
        {hrChrome ? (
          <div
            className="h-1 w-full bg-gradient-to-r from-[#2b4a8c] via-sky-500/90 to-[#2b4a8c]"
            aria-hidden
          />
        ) : null}
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex min-w-0 flex-1 basis-[min(100%,16rem)] items-center gap-3 sm:flex-initial">
            {hrChrome ? (
              <div
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-lg shadow-[#2b4a8c]/25"
                style={{ background: `linear-gradient(145deg, ${HR_NAVY} 0%, #1e3a6e 100%)` }}
              >
                <BriefcaseBusiness className="h-5 w-5" aria-hidden />
              </div>
            ) : null}
            <div className="min-w-0">
              <div
                className={
                  hrChrome
                    ? 'text-[11px] font-bold uppercase tracking-[0.14em] text-[#2b4a8c]/85'
                    : 'text-sm text-muted-foreground'
                }
              >
                {hrChrome ? 'Quản lý việc làm' : 'Design / nội dung'}
              </div>
              <div
                className={`truncate tracking-tight ${hrChrome ? 'text-lg font-bold text-[#1a2744] md:text-xl' : 'text-xl font-semibold'}`}
              >
              </div>
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto">
            <Button
              variant="outline"
              className={
                hrChrome
                  ? 'border-[#cfd8e8] bg-white text-[#2b4a8c] hover:bg-[#e8f0fe] hover:text-[#223d73]'
                  : undefined
              }
              asChild
            >
              <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Xem trang
              </a>
            </Button>
            <Button variant="destructive" onClick={logout}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <main className={`mx-auto max-w-7xl px-4 py-8 ${hrChrome ? 'lg:py-10' : ''}`}>
        {jobDeleteModal?.open ? (
          <div className="fixed inset-0 z-[80]">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => (deletingJob ? null : setJobDeleteModal({ open: false, job: null }))}
            />
            <div className="absolute inset-0 grid place-items-center p-4">
              <div
                className={`w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-xl ${hrChrome ? 'border-[#e4e8ef] shadow-[0_24px_64px_rgba(15,23,42,0.18)]' : ''}`}
              >
                <div className={`border-b p-5 ${hrChrome ? 'border-[#eef1f6] bg-[#fafbfd]' : ''}`}>
                  <div className={`text-base font-semibold ${hrChrome ? 'text-[#1a2744]' : ''}`}>
                    Xác nhận xoá job
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Bạn có chắc chắn muốn xoá job{' '}
                    <b className="text-foreground">{jobDeleteModal?.job?.title || '—'}</b>? Hành động này không thể
                    hoàn tác.
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-5">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={deletingJob}
                    onClick={() => setJobDeleteModal({ open: false, job: null })}
                  >
                    Huỷ
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deletingJob}
                    onClick={() => deleteJob(jobDeleteModal?.job?.id)}
                  >
                    {deletingJob ? 'Đang xoá...' : 'Xoá job'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div
          className={`grid min-w-0 grid-cols-1 gap-6 ${hrChrome ? 'lg:grid-cols-[268px_minmax(0,1fr)] lg:gap-8' : 'lg:grid-cols-[240px_minmax(0,1fr)]'}`}
        >
          <aside
            className={`h-fit rounded-2xl border p-3 lg:sticky lg:top-24 ${
              hrChrome
                ? 'border-[#e0e4ec] bg-white shadow-[0_8px_32px_rgba(15,23,42,0.06)]'
                : 'bg-card'
            }`}
          >
            <div
              className={`mb-3 px-2 text-xs font-semibold uppercase tracking-wide ${
                hrChrome ? 'text-[#2b4a8c]/70' : 'text-muted-foreground'
              }`}
            >
            </div>
            <div className="space-y-1">
              {adminNavItems.map((item) => {
                const NavIcon = item.Icon
                const isActive = active === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActive(item.id)
                      nav(item.path)
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                      hrChrome
                        ? isActive
                          ? 'bg-[#2b4a8c] text-white shadow-md shadow-[#2b4a8c]/30'
                          : 'text-[#334155] hover:bg-[#e8f0fe]/90'
                        : isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    {NavIcon ? (
                      <NavIcon className={`h-4 w-4 shrink-0 ${isActive && hrChrome ? 'opacity-100' : hrChrome ? 'opacity-80' : 'opacity-90'}`} />
                    ) : null}
                    <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                    {item.badgeCount && cvPhongVanCount > 0 ? (
                      <span
                        className={`grid h-5 min-w-[1.25rem] shrink-0 place-items-center rounded-full px-1.5 text-[10px] font-bold tabular-nums ${
                          hrChrome
                            ? isActive
                              ? 'bg-white/25 text-white'
                              : 'bg-[#2b4a8c] text-white'
                            : isActive
                              ? 'bg-primary-foreground/20 text-primary-foreground'
                              : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        {cvPhongVanCount > 99 ? '99+' : cvPhongVanCount}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </aside>

          <section className="min-w-0 space-y-4">
            {error ? (
              <div
                className={`border p-4 text-sm text-destructive ${
                  hrChrome
                    ? 'rounded-2xl border-red-200/80 bg-red-50/90 shadow-sm'
                    : 'rounded-lg border-destructive/30 bg-destructive/10'
                }`}
              >
                {error}
              </div>
            ) : null}

            {notice ? (
              <div
                ref={noticeRef}
                className={`border p-4 text-sm ${
                  notice.type === 'success'
                    ? hrChrome
                      ? 'rounded-2xl border-emerald-200/90 bg-emerald-50/95 text-emerald-900 shadow-sm'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : hrChrome
                      ? 'rounded-2xl border-red-200/80 bg-red-50/90 text-destructive shadow-sm'
                      : 'border-destructive/30 bg-destructive/10 text-destructive'
                }`}
              >
                {notice.message}
              </div>
            ) : null}

        {active === 'site' ? (
          <Card>
            <CardHeader>
              <CardTitle>Nội dung trang người dùng</CardTitle>
            </CardHeader>
            <CardContent>
              {site ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
                  <aside className="space-y-3">
                    <div className="rounded-xl border bg-muted/10 p-3">
                      <div className="text-xs font-semibold text-muted-foreground">DANH MỤC</div>
                      <div className="mt-2 space-y-1">
                        {[
                          { id: 'general', label: 'Thông tin chung' },
                          { id: 'home', label: 'Trang chủ' },
                          { id: 'careers', label: 'Cơ hội nghề nghiệp' },
                          { id: 'benefits', label: 'Quyền lợi' },
                        ].map((x) => (
                          <button
                            key={x.id}
                            type="button"
                            className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                              siteCategory === x.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/30'
                            }`}
                            onClick={() => setSiteCategory(x.id)}
                          >
                            {x.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {siteCategory === 'home' ? (
                      <div className="rounded-xl border bg-background p-3">
                        <div className="text-xs font-semibold text-muted-foreground">TRANG CHỦ</div>
                        <div className="mt-2 space-y-1">
                          {[
                            { id: 'hero', label: 'Hero' },
                            { id: 'join', label: 'Trở thành Savytech' },
                            { id: 'testimonials', label: 'Người Savytech nói gì' },
                            { id: 'culture', label: 'Văn hoá - Sự kiện' },
                            { id: 'cta', label: 'KEEP INNOVATING (CTA)' },
                            { id: 'footer', label: 'Footer' },
                          ].map((x) => (
                            <button
                              key={x.id}
                              type="button"
                              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                                homePanel === x.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/30'
                              }`}
                              onClick={() => setHomePanel(x.id)}
                            >
                              {x.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {siteCategory === 'careers' ? (
                      <div className="rounded-xl border bg-background p-3">
                        <div className="text-xs font-semibold text-muted-foreground">CƠ HỘI NGHỀ NGHIỆP</div>
                        <div className="mt-2 space-y-1">
                          {[{ id: 'hero', label: 'Hero' }].map((x) => (
                            <button
                              key={x.id}
                              type="button"
                              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                                careersPanel === x.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/30'
                              }`}
                              onClick={() => setCareersPanel(x.id)}
                            >
                              {x.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {siteCategory === 'benefits' ? (
                      <div className="rounded-xl border bg-background p-3">
                        <div className="text-xs font-semibold text-muted-foreground">QUYỀN LỢI</div>
                        <div className="mt-2 space-y-1">
                          {[
                            { id: 'hero', label: 'Hero' },
                            { id: 'content', label: 'Nội dung' },
                            { id: 'cta', label: 'KEEP INNOVATING (CTA)' },
                          ].map((x) => (
                            <button
                              key={x.id}
                              type="button"
                              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                                benefitsPanel === x.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/30'
                              }`}
                              onClick={() => setBenefitsPanel(x.id)}
                            >
                              {x.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </aside>

                  <div className="space-y-6">
                    {siteCategory === 'general' ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Thông tin chung</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Tên công ty</div>
                            <Input
                              value={site.companyName || ''}
                              onChange={(e) => setSite({ ...site, companyName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Logo</div>
                            <UploadField
                              value={site.logoUrl || ''}
                              placeholder="Chỉ upload file"
                              uploading={uploading}
                              onChange={(v) => setSite({ ...site, logoUrl: v })}
                              onUpload={uploadAndSet((url) => setSite((s) => ({ ...s, logoUrl: url })))}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}

                    {siteCategory === 'careers' && careersPanel === 'hero' ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Hero (Cơ hội nghề nghiệp)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Hero title</div>
                            <Input
                              value={site?.careersHeroTitle || ''}
                              onChange={(e) => setSite((s) => ({ ...s, careersHeroTitle: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Hero subtitle</div>
                            <RichTextEditor
                              value={site?.careersHeroSubtitle || ''}
                              onChange={(html) => setSite((s) => ({ ...s, careersHeroSubtitle: html }))}
                              placeholder="Nhập hero subtitle..."
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Ảnh nền</div>
                            <UploadField
                              value={site?.careersHeroBackgroundUrl || ''}
                              placeholder="Chỉ upload file"
                              uploading={uploading}
                              onChange={(v) => setSite((s) => ({ ...s, careersHeroBackgroundUrl: v }))}
                              onUpload={uploadAndSet((url) =>
                                setSite((s) => ({ ...s, careersHeroBackgroundUrl: url })),
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}

                    {siteCategory === 'benefits' ? (
                      <>
                        {benefitsPanel === 'hero' ? (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Hero (Quyền lợi)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <div className="text-sm font-medium">Hero title</div>
                                <Input
                                  value={site?.benefitsHeroTitle || ''}
                                  onChange={(e) => setSite((s) => ({ ...s, benefitsHeroTitle: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="text-sm font-medium">Hero subtitle</div>
                                <RichTextEditor
                            key={`benefits-hero-subtitle-${benefitsPanel}`}
                                  value={site?.benefitsHeroSubtitle || ''}
                                  onChange={(html) => setSite((s) => ({ ...s, benefitsHeroSubtitle: html }))}
                                  placeholder="Nhập hero subtitle..."
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="text-sm font-medium">Ảnh nền</div>
                                <UploadField
                                  value={site?.benefitsHeroBackgroundUrl || ''}
                                  placeholder="Chỉ upload file"
                                  uploading={uploading}
                                  onChange={(v) => setSite((s) => ({ ...s, benefitsHeroBackgroundUrl: v }))}
                                  onUpload={uploadAndSet((url) =>
                                    setSite((s) => ({ ...s, benefitsHeroBackgroundUrl: url })),
                                  )}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ) : null}

                        {benefitsPanel === 'content' ? (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Nội dung (Quyền lợi)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {benefitsCards
                                .slice(
                                  (clampPage(benefitsCardsPage, benefitsCards.length) - 1) * PAGE_SIZE,
                                  clampPage(benefitsCardsPage, benefitsCards.length) * PAGE_SIZE,
                                )
                                .map((c, localIdx) => {
                                  const idx =
                                    (clampPage(benefitsCardsPage, benefitsCards.length) - 1) * PAGE_SIZE + localIdx
                                  return (
                                    <div key={idx} className="rounded-xl border p-4 space-y-3">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm font-semibold">Mục {idx + 1}</div>
                                        <Button
                                          variant="destructive"
                                          type="button"
                                          disabled={benefitsCards.length <= 1}
                                          onClick={() =>
                                            setBenefitsCards((prev) => {
                                      if (!confirmDelete('Bạn chắc chắn muốn xóa mục này?')) return prev
                                              const next = prev.filter((_, i) => i !== idx)
                                              setBenefitsCardsPage((p) => clampPage(p, next.length))
                                              return next
                                            })
                                          }
                                        >
                                          Xóa
                                        </Button>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="text-xs font-medium text-muted-foreground">Tiêu đề</div>
                                        <Input
                                          value={c.title}
                                          onChange={(e) =>
                                            setBenefitsCards((prev) =>
                                              prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)),
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <div className="text-xs font-medium text-muted-foreground">Ảnh</div>
                                        <UploadField
                                          value={c.imageUrl}
                                          placeholder="Chỉ upload file"
                                          uploading={uploading}
                                          onChange={(v) =>
                                            setBenefitsCards((prev) =>
                                              prev.map((x, i) => (i === idx ? { ...x, imageUrl: v } : x)),
                                            )
                                          }
                                          onUpload={uploadAndSet((url) =>
                                            setBenefitsCards((prev) =>
                                              prev.map((x, i) => (i === idx ? { ...x, imageUrl: url } : x)),
                                            ),
                                          )}
                                        />
                                        {c.imageUrl ? (
                                          <img src={c.imageUrl} alt="" className="aspect-[16/7] w-full rounded-xl object-cover" />
                                        ) : null}
                                      </div>
                                      <div className="space-y-2">
                                        <div className="text-xs font-medium text-muted-foreground">Nội dung</div>
                                        <RichTextEditor
                                          value={c.body}
                                          onChange={(html) =>
                                            setBenefitsCards((prev) =>
                                              prev.map((x, i) => (i === idx ? { ...x, body: html } : x)),
                                            )
                                          }
                                          placeholder="Nhập nội dung..."
                                          className="min-h-24"
                                        />
                                      </div>
                                    </div>
                                  )
                                })}
                              <Button
                                variant="outline"
                                type="button"
                                onClick={() =>
                                  setBenefitsCards((prev) => {
                                    const next = [...prev, { title: '', imageUrl: '', body: '' }]
                                    setBenefitsCardsPage(clampPage(999, next.length))
                                    return next
                                  })
                                }
                              >
                                + Thêm mục
                              </Button>
                              <PaginationBar
                                page={clampPage(benefitsCardsPage, benefitsCards.length)}
                                totalItems={benefitsCards.length}
                                onChange={(p) => setBenefitsCardsPage(clampPage(p, benefitsCards.length))}
                              />
                            </CardContent>
                          </Card>
                        ) : null}

                        {benefitsPanel === 'cta' ? (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">KEEP INNOVATING (CTA) (Quyền lợi)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="space-y-2">
                                <div className="text-sm font-medium">Ảnh nền CTA</div>
                                <UploadField
                                  value={site?.benefitsCtaBackgroundUrl || ''}
                                  placeholder="Chỉ upload file"
                                  uploading={uploading}
                                  onChange={(v) => setSite((s) => ({ ...s, benefitsCtaBackgroundUrl: v }))}
                                  onUpload={uploadAndSet((url) =>
                                    setSite((s) => ({ ...s, benefitsCtaBackgroundUrl: url })),
                                  )}
                                />
                              </div>
                              {site?.benefitsCtaBackgroundUrl ? (
                                <img
                                  src={site.benefitsCtaBackgroundUrl}
                                  alt=""
                                  className="aspect-[16/6] w-full rounded-xl object-cover"
                                />
                              ) : null}
                            </CardContent>
                          </Card>
                        ) : null}
                      </>
                    ) : null}

                    {siteCategory === 'home' && homePanel === 'hero' ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Hero</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Hero title</div>
                            <Input
                              value={site.heroTitle || ''}
                              onChange={(e) => setSite({ ...site, heroTitle: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Hero subtitle</div>
                            <RichTextEditor
                              value={site.heroSubtitle || ''}
                              onChange={(html) => setSite((s) => ({ ...s, heroSubtitle: html }))}
                              placeholder="Nhập hero subtitle..."
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Ảnh nền</div>
                            <UploadField
                              value={site.heroBackgroundUrl || ''}
                              placeholder="Dán link hoặc upload file"
                              uploading={uploading}
                              onChange={(v) => setSite({ ...site, heroBackgroundUrl: v })}
                              onUpload={uploadAndSet((url) => setSite((s) => ({ ...s, heroBackgroundUrl: url })))}
                            />
                            {site.heroBackgroundUrl ? (
                              <img
                                src={site.heroBackgroundUrl}
                                alt=""
                                className="mt-2 aspect-[16/6] w-full rounded-xl object-cover"
                              />
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}

                    {siteCategory === 'home' && homePanel === 'join' ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Trở thành Savytech</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Tiêu đề khối</div>
                            <Input value={joinTitle} onChange={(e) => setJoinTitle(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {joinCards.map((c, idx) => (
                              <div key={idx} className="space-y-3 rounded-xl border p-4">
                                <div className="text-sm font-semibold">Card {idx + 1}</div>
                                <div className="space-y-2">
                                  <div className="text-xs font-medium text-muted-foreground">Ảnh</div>
                                  <UploadField
                                    value={c.imageUrl}
                                    placeholder="Dán link hoặc upload file"
                                    uploading={uploading}
                                    onChange={(v) =>
                                      setJoinCards((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, imageUrl: v } : x)),
                                      )
                                    }
                                    onUpload={uploadAndSet((url) =>
                                      setJoinCards((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, imageUrl: url } : x)),
                                      ),
                                    )}
                                  />
                                  {c.imageUrl ? (
                                    <img
                                      src={c.imageUrl}
                                      alt=""
                                      className="mt-2 aspect-[4/3] w-full rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="mt-2 aspect-[4/3] w-full rounded-lg border border-dashed bg-muted/20" />
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <div className="text-xs font-medium text-muted-foreground">Tiêu đề</div>
                                  <Input
                                    value={c.title}
                                    onChange={(e) =>
                                      setJoinCards((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)),
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="text-xs font-medium text-muted-foreground">Nội dung</div>
                                  <RichTextEditor
                                    value={c.body}
                                    onChange={(html) =>
                                      setJoinCards((prev) => prev.map((x, i) => (i === idx ? { ...x, body: html } : x)))
                                    }
                                    placeholder="Nhập nội dung..."
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}

                    {siteCategory === 'home' && homePanel === 'testimonials' ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Người Savytech nói gì</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Tiêu đề khối</div>
                            <Input
                              value={testimonialsTitle}
                              onChange={(e) => setTestimonialsTitle(e.target.value)}
                            />
                          </div>

                          <div className="space-y-4">
                            {testimonialsItems
                              .slice(
                                (clampPage(testimonialsPage, testimonialsItems.length) - 1) * PAGE_SIZE,
                                clampPage(testimonialsPage, testimonialsItems.length) * PAGE_SIZE,
                              )
                              .map((it, localIdx) => {
                                const idx =
                                  (clampPage(testimonialsPage, testimonialsItems.length) - 1) * PAGE_SIZE + localIdx
                                return (
                              <div
                                key={idx}
                                className="grid grid-cols-1 gap-4 rounded-xl border p-4 md:grid-cols-[240px_1fr]"
                              >
                                <div className="space-y-2">
                                  <div className="text-xs font-medium text-muted-foreground">Ảnh *</div>
                                  <UploadField
                                    value={it.imageUrl}
                                    placeholder="Dán link hoặc upload file"
                                    uploading={uploading}
                                    onChange={(v) =>
                                      setTestimonialsItems((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, imageUrl: v } : x)),
                                      )
                                    }
                                    onUpload={uploadAndSet((url) =>
                                      setTestimonialsItems((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, imageUrl: url } : x)),
                                      ),
                                    )}
                                  />
                                  {it.imageUrl ? (
                                    <img
                                      src={it.imageUrl}
                                      alt=""
                                      className="aspect-[4/3] w-full rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="aspect-[4/3] w-full rounded-lg border border-dashed bg-muted/20" />
                                  )}
                                  <Button
                                    variant="destructive"
                                    type="button"
                                    onClick={() =>
                                      setTestimonialsItems((prev) => {
                                        if (!confirmDelete('Bạn chắc chắn muốn xóa mục này?')) return prev
                                        const next = prev.filter((_, i) => i !== idx)
                                        setTestimonialsPage((p) => clampPage(p, next.length))
                                        return next
                                      })
                                    }
                                    disabled={testimonialsItems.length <= 3}
                                  >
                                    Xóa mục
                                  </Button>
                                </div>

                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground">Chức danh *</div>
                                    <Input
                                      value={it.role}
                                      onChange={(e) =>
                                        setTestimonialsItems((prev) =>
                                          prev.map((x, i) => (i === idx ? { ...x, role: e.target.value } : x)),
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground">Nội dung *</div>
                                    <RichTextEditor
                                      value={it.quote}
                                      onChange={(html) =>
                                        setTestimonialsItems((prev) =>
                                          prev.map((x, i) => (i === idx ? { ...x, quote: html } : x)),
                                        )
                                      }
                                      placeholder="Nhập nội dung..."
                                      className="min-h-28"
                                    />
                                  </div>

                                  <div className="rounded-xl border bg-muted/10 p-4">
                                    <div className="text-xs font-semibold text-muted-foreground">
                                      Preview (user)
                                    </div>
                                    <div className="mt-3 overflow-hidden rounded-xl">
                                      <div className="relative aspect-[16/7] bg-muted/30">
                                        {it.imageUrl ? (
                                          <img
                                            src={it.imageUrl}
                                            alt=""
                                            className="absolute inset-0 h-full w-full object-cover"
                                          />
                                        ) : null}
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
                                        <div className="absolute bottom-0 left-0 p-4 text-white">
                                          <div className="text-2xl leading-none">“</div>
                                          <div className="mt-1 max-w-xl text-sm text-white/90">
                                            {it.quote || 'Nội dung sẽ hiển thị ở đây...'}
                                          </div>
                                          <div className="mt-3 text-sm font-semibold">
                                            {it.role || 'Chức danh'}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                                )
                              })}

                            <Button
                              variant="outline"
                              type="button"
                              onClick={() =>
                                setTestimonialsItems((prev) => {
                                  const next = [...prev, { imageUrl: '', quote: '', role: '' }]
                                  setTestimonialsPage(clampPage(999, next.length))
                                  return next
                                })
                              }
                            >
                              + Thêm mục
                            </Button>
                            <PaginationBar
                              page={clampPage(testimonialsPage, testimonialsItems.length)}
                              totalItems={testimonialsItems.length}
                              onChange={(p) => setTestimonialsPage(clampPage(p, testimonialsItems.length))}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}

                    {siteCategory === 'home' && homePanel === 'culture' ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Văn hoá - Sự kiện</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Tiêu đề khối</div>
                            <Input value={cultureTitle} onChange={(e) => setCultureTitle(e.target.value)} />
                          </div>
                          <div className="space-y-4">
                            {cultureItems
                              .slice(
                                (clampPage(culturePage, cultureItems.length) - 1) * PAGE_SIZE,
                                clampPage(culturePage, cultureItems.length) * PAGE_SIZE,
                              )
                              .map((it, localIdx) => {
                                const idx = (clampPage(culturePage, cultureItems.length) - 1) * PAGE_SIZE + localIdx
                                return (
                              <div
                                key={idx}
                                className="grid grid-cols-1 gap-4 rounded-xl border p-4 md:grid-cols-[1fr_1fr_auto]"
                              >
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-muted-foreground">Tab</div>
                                  <Input
                                    value={it.label}
                                    onChange={(e) =>
                                      setCultureItems((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)),
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-muted-foreground">Ảnh</div>
                                  <UploadField
                                    value={it.imageUrl}
                                    placeholder="Dán link hoặc upload file"
                                    uploading={uploading}
                                    onChange={(v) =>
                                      setCultureItems((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, imageUrl: v } : x)),
                                      )
                                    }
                                    onUpload={uploadAndSet((url) =>
                                      setCultureItems((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, imageUrl: url } : x)),
                                      ),
                                    )}
                                  />
                                </div>
                                <div className="flex items-end">
                                  <Button
                                    variant="destructive"
                                    type="button"
                                    onClick={() =>
                                      setCultureItems((prev) => {
                                        if (!confirmDelete('Bạn chắc chắn muốn xóa tab này?')) return prev
                                        const next = prev.filter((_, i) => i !== idx)
                                        setCulturePage((p) => clampPage(p, next.length))
                                        return next
                                      })
                                    }
                                    disabled={cultureItems.length <= 1}
                                  >
                                    Xóa
                                  </Button>
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                  <div className="text-xs font-medium text-muted-foreground">Nội dung</div>
                                  <RichTextEditor
                                    value={it.body}
                                    onChange={(html) =>
                                      setCultureItems((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, body: html } : x)),
                                      )
                                    }
                                    placeholder="Nhập nội dung..."
                                    className="min-h-24"
                                  />
                                </div>
                              </div>
                                )
                              })}
                            <Button
                              variant="outline"
                              type="button"
                              onClick={() =>
                                setCultureItems((prev) => {
                                  const next = [...prev, { label: '', imageUrl: '', body: '' }]
                                  setCulturePage(clampPage(999, next.length))
                                  return next
                                })
                              }
                            >
                              + Thêm tab
                            </Button>
                            <PaginationBar
                              page={clampPage(culturePage, cultureItems.length)}
                              totalItems={cultureItems.length}
                              onChange={(p) => setCulturePage(clampPage(p, cultureItems.length))}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}

                    {siteCategory === 'home' && homePanel === 'cta' ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">KEEP INNOVATING (CTA)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Ảnh nền</div>
                            <UploadField
                              value={site.ctaBackgroundUrl || ''}
                              placeholder="Dán link hoặc upload file"
                              uploading={uploading}
                              onChange={(v) => setSite({ ...site, ctaBackgroundUrl: v })}
                              onUpload={uploadAndSet((url) => setSite((s) => ({ ...s, ctaBackgroundUrl: url })))}
                            />
                          </div>
                          {site.ctaBackgroundUrl ? (
                            <img
                              src={site.ctaBackgroundUrl}
                              alt=""
                              className="aspect-[16/6] w-full rounded-xl object-cover"
                            />
                          ) : null}
                        </CardContent>
                      </Card>
                    ) : null}

                    {siteCategory === 'home' && homePanel === 'footer' ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Footer</CardTitle>
                          <CardDescription>
                            Layout 4 cột + thanh mạng xã hội (giống mẫu). Liên kết menu mặc định trên site; chỉnh nội dung
                            liên hệ và URL MXH tại đây.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 gap-4 rounded-xl border bg-muted/20 p-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                              <div className="text-xs font-medium text-muted-foreground">Tiêu đề cột liên hệ</div>
                              <Input
                                value={footerContactHeading}
                                onChange={(e) => setFooterContactHeading(e.target.value)}
                                placeholder="Trung tâm Thu hút Nguồn nhân lực"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-muted-foreground">Email hỗ trợ (thanh dưới)</div>
                              <Input
                                value={footerSupportEmail}
                                onChange={(e) => setFooterSupportEmail(e.target.value)}
                                placeholder="Để trống = lấy từ chi nhánh đầu có email"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-muted-foreground">Hotline (thanh dưới)</div>
                              <Input
                                value={footerHotline}
                                onChange={(e) => setFooterHotline(e.target.value)}
                                placeholder="Để trống = lấy từ chi nhánh đầu có SĐT"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <div className="text-xs font-medium text-muted-foreground">
                                Dòng phụ dưới “Theo dõi các kênh…” (vd: của Savytech)
                              </div>
                              <Input
                                value={footerSocialSubtitle}
                                onChange={(e) => setFooterSocialSubtitle(e.target.value)}
                                placeholder="Để trống — hiển thị “của …” + tên công ty"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <div className="text-xs font-medium text-muted-foreground">Copyright (một dòng)</div>
                              <Input
                                value={footerCopyright}
                                onChange={(e) => setFooterCopyright(e.target.value)}
                                placeholder="Để trống = mặc định theo năm + tên công ty"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <div className="text-xs font-semibold text-foreground">Liên kết mạng xã hội</div>
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input
                                  value={footerSocFacebook}
                                  onChange={(e) => setFooterSocFacebook(e.target.value)}
                                  placeholder="Facebook URL"
                                />
                                <Input
                                  value={footerSocYoutube}
                                  onChange={(e) => setFooterSocYoutube(e.target.value)}
                                  placeholder="YouTube URL"
                                />
                                <Input
                                  value={footerSocInstagram}
                                  onChange={(e) => setFooterSocInstagram(e.target.value)}
                                  placeholder="Instagram URL"
                                />
                                <Input
                                  value={footerSocZalo}
                                  onChange={(e) => setFooterSocZalo(e.target.value)}
                                  placeholder="Zalo URL"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {footerOffices
                              .slice(
                                (clampPage(footerPage, footerOffices.length) - 1) * PAGE_SIZE,
                                clampPage(footerPage, footerOffices.length) * PAGE_SIZE,
                              )
                              .map((o, localIdx) => {
                                const idx =
                                  (clampPage(footerPage, footerOffices.length) - 1) * PAGE_SIZE + localIdx
                                return (
                              <div key={idx} className="space-y-3 rounded-xl border p-4">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-sm font-semibold">{o.title || `Office ${idx + 1}`}</div>
                                  <Button
                                    variant="destructive"
                                    type="button"
                                    onClick={() =>
                                      setFooterOffices((prev) => {
                                        if (!confirmDelete('Bạn chắc chắn muốn xóa chi nhánh này?')) return prev
                                        const next = prev.filter((_, i) => i !== idx)
                                        setFooterPage((p) => clampPage(p, next.length))
                                        return next
                                      })
                                    }
                                    disabled={footerOffices.length <= 1}
                                  >
                                    Xóa
                                  </Button>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-muted-foreground">Tiêu đề</div>
                                  <Input
                                    value={o.title}
                                    onChange={(e) =>
                                      setFooterOffices((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)),
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-muted-foreground">Địa chỉ</div>
                                  <Textarea
                                    value={o.address}
                                    onChange={(e) =>
                                      setFooterOffices((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, address: e.target.value } : x)),
                                      )
                                    }
                                    className="min-h-20"
                                  />
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                  <div className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground">SĐT</div>
                                    <Input
                                      value={o.phone}
                                      onChange={(e) =>
                                        setFooterOffices((prev) =>
                                          prev.map((x, i) => (i === idx ? { ...x, phone: e.target.value } : x)),
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground">Email</div>
                                    <Input
                                      value={o.email}
                                      onChange={(e) =>
                                        setFooterOffices((prev) =>
                                          prev.map((x, i) => (i === idx ? { ...x, email: e.target.value } : x)),
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                                )
                              })}
                          </div>
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() =>
                              setFooterOffices((prev) => {
                                const next = [...prev, { title: '', address: '', phone: '', email: '' }]
                                setFooterPage(clampPage(999, next.length))
                                return next
                              })
                            }
                          >
                            + Thêm chi nhánh
                          </Button>
                          <PaginationBar
                            page={clampPage(footerPage, footerOffices.length)}
                            totalItems={footerOffices.length}
                            onChange={(p) => setFooterPage(clampPage(p, footerOffices.length))}
                          />
                        </CardContent>
                      </Card>
                    ) : null}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button onClick={saveSite} disabled={savingSite || uploading}>
                        {savingSite ? 'Đang lưu…' : uploading ? 'Đang upload…' : 'Lưu nội dung'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Đang tải…</div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {active === 'jobs' ? (
          <Card
            className={
              hrChrome
                ? 'overflow-hidden rounded-2xl border-[#e4e8ef] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]'
                : undefined
            }
          >
            <CardHeader className={hrChrome ? 'space-y-1 border-b border-[#f0f2f6] bg-[#fafbfd]' : undefined}>
              <CardTitle className={hrChrome ? 'text-xl font-bold text-[#1a2744]' : undefined}>
                Danh sách vị trí tuyển dụng
              </CardTitle>
            </CardHeader>
            <CardContent className={hrChrome ? 'pt-6' : undefined}>
              <div
                className={`mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5 ${
                  hrChrome
                    ? 'rounded-2xl border border-[#e8ecf2] bg-white p-4 shadow-sm'
                    : 'rounded-lg border bg-muted/10 p-3'
                }`}
              >
                <div className="space-y-1 md:col-span-2 xl:col-span-2">
                  <div className="text-xs font-medium text-muted-foreground">Từ khóa</div>
                  <Input
                    value={jobKeyword}
                    onChange={(e) => setJobKeyword(e.target.value)}
                    placeholder="Tiêu đề, địa chỉ, lương..."
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Trạng thái</div>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={jobStatusFilter}
                    onChange={(e) => setJobStatusFilter(e.target.value)}
                  >
                    <option value="all">Tất cả</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Loại job</div>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={jobTypeFilter}
                    onChange={(e) => setJobTypeFilter(e.target.value)}
                  >
                    <option value="all">Tất cả</option>
                    <option value="IT">IT</option>
                    <option value="NON_IT">NON-IT</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Địa chỉ</div>
                  <Input
                    value={jobAddressFilter}
                    onChange={(e) => setJobAddressFilter(e.target.value)}
                    placeholder="Hà Nội, Đà Nẵng..."
                  />
                </div>
              </div>

              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className={hrChrome ? 'text-[#64748b]' : 'text-muted-foreground'}>
                  Tìm thấy{' '}
                  <b className={hrChrome ? 'font-bold text-[#2b4a8c]' : 'text-foreground'}>
                    {filteredJobs.length}
                  </b>{' '}
                  vị trí
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className={
                    hrChrome
                      ? 'border-[#cfd8e8] bg-white text-[#2b4a8c] hover:bg-[#e8f0fe]'
                      : undefined
                  }
                  onClick={() => {
                    setJobKeyword('')
                    setJobStatusFilter('all')
                    setJobTypeFilter('all')
                    setJobAddressFilter('')
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </div>

              <div className="space-y-3">
                {pagedJobs.length ? (
                  pagedJobs.map((j) => (
                    <div
                      key={j.id}
                      className={`flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between ${
                        hrChrome
                          ? 'rounded-2xl border border-[#e8ecf2] bg-white shadow-sm transition-shadow duration-200 hover:shadow-md'
                          : 'rounded-lg border'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className={`truncate font-medium ${hrChrome ? 'text-[#1a2744]' : ''}`}>{j.title}</div>
                        <div className={`mt-1.5 flex flex-wrap items-center gap-2 text-sm ${hrChrome ? 'text-[#64748b]' : 'text-muted-foreground'}`}>
                          <span>
                            {[
                              j.applyStartDate && j.applyEndDate ? `${j.applyStartDate} - ${j.applyEndDate}` : null,
                              j.address || null,
                              j.salary || null,
                            ]
                              .filter(Boolean)
                              .join(' • ') || '—'}
                          </span>
                          {j.published ? (
                            <span
                              className={
                                hrChrome
                                  ? 'rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-xs font-semibold text-[#2b4a8c]'
                                  : 'rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary'
                              }
                            >
                              Published
                            </span>
                          ) : (
                            <span
                              className={
                                hrChrome
                                  ? 'rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-medium text-[#64748b]'
                                  : 'rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'
                              }
                            >
                              Draft
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          type="button"
                          className={
                            hrChrome ? 'bg-[#2b4a8c] text-white shadow-sm hover:bg-[#223d73]' : undefined
                          }
                          onClick={() => nav(`/admin/jobs/${j.id}`)}
                        >
                          Xem
                        </Button>
                        <Button
                          variant="outline"
                          className={
                            hrChrome ? 'border-[#cfd8e8] bg-white hover:bg-[#e8f0fe]' : undefined
                          }
                          onClick={() => {
                            setJobDraft({
                              ...defaultJob(),
                              ...j,
                              imageUrl: j.imageUrl || '',
                              applyStartDate: j.applyStartDate || '',
                              applyEndDate: j.applyEndDate || '',
                              address: j.address || '',
                              jobType: j.jobType || 'IT',
                              recruitmentHeadcount:
                                j.recruitmentHeadcount != null ? j.recruitmentHeadcount : 1,
                              workArrangement: j.workArrangement || 'ALL',
                              description: j.description || '',
                              ...inferLegacySalaryFields(j),
                            })
                            nav('/admin/job-edit')
                          }}
                        >
                          Sửa
                        </Button>
                        <Button
                          variant={j.published ? 'outline' : 'default'}
                          type="button"
                          disabled={savingJob}
                          className={
                            hrChrome && !j.published
                              ? 'bg-[#0ea5e9] text-white shadow-sm hover:bg-sky-600'
                              : hrChrome && j.published
                                ? 'border-[#cfd8e8] bg-white hover:bg-[#e8f0fe]'
                                : undefined
                          }
                          onClick={() => togglePublish(j)}
                        >
                          {j.published ? 'Ẩn' : 'Hiện'}
                        </Button>
                        <Button variant="destructive" onClick={() => requestDeleteJob(j)}>
                          Xóa
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    className={`border border-dashed p-8 text-center text-sm ${
                      hrChrome
                        ? 'rounded-2xl border-[#cfd8e6] bg-[#f8fafc] text-[#64748b]'
                        : 'rounded-lg text-muted-foreground'
                    }`}
                  >
                    Không có job phù hợp với bộ lọc hiện tại.
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <Button
                  type="button"
                  variant="outline"
                  disabled={jobsPageSafe <= 1}
                  className={
                    hrChrome ? 'h-9 min-w-[2.25rem] rounded-full border-[#cfd8e8] hover:bg-[#e8f0fe]' : undefined
                  }
                  onClick={() => setJobsPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </Button>
                <div className={hrChrome ? 'px-2 text-[#64748b]' : 'px-2 text-muted-foreground'}>
                  Trang{' '}
                  <b className={hrChrome ? 'font-bold text-[#2b4a8c]' : 'text-foreground'}>{jobsPageSafe}</b> /{' '}
                  {jobsTotalPages}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={jobsPageSafe >= jobsTotalPages}
                  className={
                    hrChrome ? 'h-9 min-w-[2.25rem] rounded-full border-[#cfd8e8] hover:bg-[#e8f0fe]' : undefined
                  }
                  onClick={() => setJobsPage((p) => Math.min(jobsTotalPages, p + 1))}
                >
                  ›
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {active === 'job-edit' ? (
          <Card
            className={
              hrChrome
                ? 'overflow-hidden rounded-2xl border-[#e4e8ef] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]'
                : undefined
            }
          >
            <CardHeader className={hrChrome ? 'border-b border-[#f0f2f6] bg-[#fafbfd]' : undefined}>
              <CardTitle className={hrChrome ? 'text-xl font-bold text-[#1a2744]' : undefined}>
                {jobDraft.id ? 'Sửa job' : 'Tạo job mới'}
              </CardTitle>
            </CardHeader>
            <CardContent className={hrChrome ? 'pt-6' : undefined}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm font-medium">Tiêu đề</div>
                  <Input
                    value={jobDraft.title}
                    onChange={(e) => setJobDraft({ ...jobDraft, title: e.target.value })}
                    placeholder="Java Developer"
                  />
                </div>

                <div
                  className={`space-y-3 md:col-span-2 rounded-xl border p-4 ${
                    hrChrome
                      ? 'border-[#e8ecf2] bg-[#f8fafc]/90'
                      : 'border-border/80 bg-muted/15'
                  }`}
                >
                  <div
                    className={`text-sm font-semibold ${hrChrome ? 'font-bold text-[#2b4a8c]' : 'text-primary'}`}
                  >
                    Vị trí
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Phân loại vị trí</div>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={jobDraft.jobType || 'IT'}
                        onChange={(e) => setJobDraft({ ...jobDraft, jobType: e.target.value })}
                      >
                        <option value="IT">IT</option>
                        <option value="NON_IT">Non-IT</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div
                  className={`space-y-3 md:col-span-2 rounded-xl border p-4 ${
                    hrChrome
                      ? 'border-[#e8ecf2] bg-[#f8fafc]/90'
                      : 'border-border/80 bg-muted/15'
                  }`}
                >
                  <div
                    className={`text-sm font-semibold ${hrChrome ? 'font-bold text-[#2b4a8c]' : 'text-primary'}`}
                  >
                    Thông tin tuyển dụng
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Số lượng tuyển</div>
                      <Input
                        type="number"
                        min={1}
                        value={String(jobDraft.recruitmentHeadcount ?? '')}
                        onChange={(e) =>
                          setJobDraft({
                            ...jobDraft,
                            recruitmentHeadcount: e.target.value === '' ? '' : Number(e.target.value),
                          })
                        }
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Loại hình</div>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={jobDraft.workArrangement || 'ALL'}
                        onChange={(e) => setJobDraft({ ...jobDraft, workArrangement: e.target.value })}
                      >
                        {WORK_ARRANGEMENT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Thời gian ứng tuyển (từ ngày)</div>
                      <Input
                        type="date"
                        value={jobDraft.applyStartDate}
                        onChange={(e) => setJobDraft({ ...jobDraft, applyStartDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Thời gian ứng tuyển (đến ngày)</div>
                      <Input
                        type="date"
                        value={jobDraft.applyEndDate}
                        onChange={(e) => setJobDraft({ ...jobDraft, applyEndDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <div className="text-sm font-medium">Địa chỉ / địa điểm làm việc</div>
                      <Input
                        value={jobDraft.address}
                        onChange={(e) => setJobDraft({ ...jobDraft, address: e.target.value })}
                        placeholder="VD: Hồ Chí Minh hoặc địa chỉ đầy đủ"
                      />
                    </div>
                    <div
                      className={`space-y-3 md:col-span-2 rounded-xl border p-4 ${
                        hrChrome ? 'border-[#e8ecf2] bg-[#f8fafc]/90' : 'border-border/80 bg-muted/15'
                      }`}
                    >
                      <div className="text-sm font-medium">Mức lương</div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            jobDraft.salaryInputMode === 'RANGE'
                              ? hrChrome
                                ? 'border-[#2b4a8c] bg-[#e8f0fe] text-[#2b4a8c]'
                                : 'border-primary bg-primary/10 text-primary'
                              : 'border-input bg-background hover:bg-muted/40'
                          }`}
                          onClick={() =>
                            setJobDraft((p) => {
                              const next = {
                                ...p,
                                salaryInputMode: 'RANGE',
                                salaryNegotiable: false,
                              }
                              const s = buildSalaryDisplayFromStructure(
                                'RANGE',
                                next.salaryMinMillion,
                                next.salaryMaxMillion,
                              )
                              return { ...next, salary: s || p.salary }
                            })
                          }
                        >
                          Khoảng lương (triệu/tháng)
                        </button>
                        <button
                          type="button"
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            jobDraft.salaryInputMode === 'SPECIFIC'
                              ? hrChrome
                                ? 'border-[#2b4a8c] bg-[#e8f0fe] text-[#2b4a8c]'
                                : 'border-primary bg-primary/10 text-primary'
                              : 'border-input bg-background hover:bg-muted/40'
                          }`}
                          onClick={() =>
                            setJobDraft((p) => {
                              const guess =
                                Number(p.salaryMaxMillion) ||
                                Number(p.salaryMinMillion) ||
                                0
                              const ns = String(Math.min(500, Math.max(0, Math.floor(guess))))
                              const next = {
                                ...p,
                                salaryInputMode: 'SPECIFIC',
                                salaryNegotiable: false,
                                salaryMinMillion: ns,
                                salaryMaxMillion: ns,
                              }
                              const s = buildSalaryDisplayFromStructure('SPECIFIC', ns, ns)
                              return { ...next, salary: s || p.salary }
                            })
                          }
                        >
                          Mức cụ thể
                        </button>
                        <button
                          type="button"
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            jobDraft.salaryInputMode === 'NEGOTIABLE'
                              ? hrChrome
                                ? 'border-[#2b4a8c] bg-[#e8f0fe] text-[#2b4a8c]'
                                : 'border-primary bg-primary/10 text-primary'
                              : 'border-input bg-background hover:bg-muted/40'
                          }`}
                          onClick={() =>
                            setJobDraft((p) => ({
                              ...p,
                              salaryInputMode: 'NEGOTIABLE',
                              salaryNegotiable: true,
                              salaryMinMillion: '',
                              salaryMaxMillion: '',
                              salary: 'Thỏa thuận',
                            }))
                          }
                        >
                          Thỏa thuận
                        </button>
                      </div>
                      {jobDraft.salaryInputMode === 'RANGE' ? (
                        <div className="mt-1 flex flex-wrap gap-6">
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground">Từ (triệu)</div>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 w-9 shrink-0 p-0"
                                onClick={() =>
                                  setJobDraft((p) => {
                                    const n = Math.max(
                                      0,
                                      Math.min(500, (Number(p.salaryMinMillion) || 0) - 1),
                                    )
                                    const ns = String(n)
                                    return {
                                      ...p,
                                      salaryMinMillion: ns,
                                      salary:
                                        buildSalaryDisplayFromStructure('RANGE', ns, p.salaryMaxMillion) || p.salary,
                                    }
                                  })
                                }
                              >
                                −
                              </Button>
                              <Input
                                type="number"
                                min={0}
                                max={500}
                                className="w-24"
                                value={jobDraft.salaryMinMillion}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setJobDraft((p) => ({
                                    ...p,
                                    salaryMinMillion: v,
                                    salary:
                                      buildSalaryDisplayFromStructure('RANGE', v, p.salaryMaxMillion) || p.salary,
                                  }))
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 w-9 shrink-0 p-0"
                                onClick={() =>
                                  setJobDraft((p) => {
                                    const n = Math.max(
                                      0,
                                      Math.min(500, (Number(p.salaryMinMillion) || 0) + 1),
                                    )
                                    const ns = String(n)
                                    const hi = Math.max(n, Number(p.salaryMaxMillion) || 0)
                                    const hiS = String(hi)
                                    return {
                                      ...p,
                                      salaryMinMillion: ns,
                                      salaryMaxMillion: hiS,
                                      salary: buildSalaryDisplayFromStructure('RANGE', ns, hiS) || p.salary,
                                    }
                                  })
                                }
                              >
                                +
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground">Đến (triệu)</div>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 w-9 shrink-0 p-0"
                                onClick={() =>
                                  setJobDraft((p) => {
                                    const n = Math.max(
                                      0,
                                      Math.min(500, (Number(p.salaryMaxMillion) || 0) - 1),
                                    )
                                    const ns = String(n)
                                    const lo = Math.min(Number(p.salaryMinMillion) || 0, n)
                                    const loS = String(lo)
                                    return {
                                      ...p,
                                      salaryMinMillion: loS,
                                      salaryMaxMillion: ns,
                                      salary: buildSalaryDisplayFromStructure('RANGE', loS, ns) || p.salary,
                                    }
                                  })
                                }
                              >
                                −
                              </Button>
                              <Input
                                type="number"
                                min={0}
                                max={500}
                                className="w-24"
                                value={jobDraft.salaryMaxMillion}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setJobDraft((p) => ({
                                    ...p,
                                    salaryMaxMillion: v,
                                    salary:
                                      buildSalaryDisplayFromStructure('RANGE', p.salaryMinMillion, v) || p.salary,
                                  }))
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 w-9 shrink-0 p-0"
                                onClick={() =>
                                  setJobDraft((p) => {
                                    const n = Math.max(
                                      0,
                                      Math.min(500, (Number(p.salaryMaxMillion) || 0) + 1),
                                    )
                                    const ns = String(n)
                                    return {
                                      ...p,
                                      salaryMaxMillion: ns,
                                      salary:
                                        buildSalaryDisplayFromStructure('RANGE', p.salaryMinMillion, ns) || p.salary,
                                    }
                                  })
                                }
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      {jobDraft.salaryInputMode === 'SPECIFIC' ? (
                        <div className="mt-1 space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">Mức lương (triệu/tháng)</div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 shrink-0 p-0"
                              onClick={() =>
                                setJobDraft((p) => {
                                  const n = Math.max(
                                    0,
                                    Math.min(500, (Number(p.salaryMinMillion) || 0) - 1),
                                  )
                                  const ns = String(n)
                                  return {
                                    ...p,
                                    salaryMinMillion: ns,
                                    salaryMaxMillion: ns,
                                    salary:
                                      buildSalaryDisplayFromStructure('SPECIFIC', ns, ns) || p.salary,
                                  }
                                })
                              }
                            >
                              −
                            </Button>
                            <Input
                              type="number"
                              min={0}
                              max={500}
                              className="w-24"
                              value={jobDraft.salaryMinMillion}
                              onChange={(e) => {
                                const v = e.target.value
                                setJobDraft((p) => ({
                                  ...p,
                                  salaryMinMillion: v,
                                  salaryMaxMillion: v,
                                  salary: buildSalaryDisplayFromStructure('SPECIFIC', v, v) || p.salary,
                                }))
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 shrink-0 p-0"
                              onClick={() =>
                                setJobDraft((p) => {
                                  const n = Math.max(
                                    0,
                                    Math.min(500, (Number(p.salaryMinMillion) || 0) + 1),
                                  )
                                  const ns = String(n)
                                  return {
                                    ...p,
                                    salaryMinMillion: ns,
                                    salaryMaxMillion: ns,
                                    salary:
                                      buildSalaryDisplayFromStructure('SPECIFIC', ns, ns) || p.salary,
                                  }
                                })
                              }
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      ) : null}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Hiển thị công khai (có thể sửa)</div>
                        <Input
                          value={jobDraft.salary}
                          onChange={(e) => setJobDraft({ ...jobDraft, salary: e.target.value })}
                          placeholder="VD: Lên tới 25 triệu / 20 triệu / Thỏa thuận"
                        />
                      </div>
                    </div>
                  </div>
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
                  <div className="text-sm font-medium">Nội dung chi tiết job</div>
                  <RichTextEditor
                    value={jobDraft.description}
                    onChange={(html) => setJobDraft((prev) => ({ ...prev, description: html }))}
                    placeholder="Nhập nội dung chi tiết job..."
                  />
                </div>
                <div className="md:col-span-2 flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <label
                    className={`flex cursor-pointer select-none items-center gap-2 text-sm font-medium ${
                      hrChrome ? 'text-[#334155]' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      className={`h-4 w-4 ${hrChrome ? 'accent-[#2b4a8c]' : 'accent-[hsl(var(--primary))]'}`}
                      checked={jobDraft.published}
                      onChange={(e) => setJobDraft({ ...jobDraft, published: e.target.checked })}
                    />
                    Hiển thị trên trang tuyển dụng
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setJobDraft(defaultJob())}
                      type="button"
                      className={
                        hrChrome ? 'border-[#cfd8e8] bg-white hover:bg-[#e8f0fe]' : undefined
                      }
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={saveJob}
                      disabled={savingJob || !jobDraft.title.trim()}
                      className={
                        hrChrome ? 'bg-[#2b4a8c] font-semibold shadow-md shadow-[#2b4a8c]/25 hover:bg-[#223d73]' : undefined
                      }
                    >
                      {savingJob ? 'Đang lưu…' : jobDraft.id ? 'Lưu job' : 'Tạo job'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {active === 'cv' ? (
          <Card
            className={
              hrChrome
                ? 'overflow-hidden rounded-2xl border-[#e4e8ef] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]'
                : undefined
            }
          >
            <CardHeader className={hrChrome ? 'border-b border-[#f0f2f6] bg-[#fafbfd]' : undefined}>
              <CardTitle
                className={`flex items-center gap-2 ${hrChrome ? 'text-xl font-bold text-[#1a2744]' : ''}`}
              >
                {hrChrome ? <Files className="h-6 w-6 text-[#2b4a8c]" aria-hidden /> : null}
                Quản lý CV
              </CardTitle>
              {hrChrome ? (
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#475569]">
                  <span>
                    Tổng:{' '}
                    <b className="tabular-nums text-[#1a2744]">{cvStats.total}</b>
                  </span>
                  <span>
                    Chờ xử lý:{' '}
                    <b className="tabular-nums text-[#1a2744]">{cvStats.pending}</b>
                  </span>
                  <span>
                    Phỏng vấn:{' '}
                    <b className="tabular-nums text-[#1a2744]">{cvStats.interview}</b>
                  </span>
                </div>
              ) : null}
            </CardHeader>
            <CardContent className={hrChrome ? 'pt-6' : undefined}>
              {loadingCvs ? (
                <div
                  className={`mb-6 space-y-3 ${hrChrome ? 'rounded-2xl border border-[#e8ecf2] bg-[#f8fafc] p-5' : ''}`}
                >
                  <div className={`h-4 w-40 rounded-full ${hrChrome ? 'animate-pulse bg-[#e2e8f0]' : 'bg-muted'}`} />
                  <div className={`h-24 rounded-xl ${hrChrome ? 'animate-pulse bg-white' : 'bg-muted/50'}`} />
                  <div className={`h-24 rounded-xl ${hrChrome ? 'animate-pulse bg-white' : 'bg-muted/50'}`} />
                </div>
              ) : null}

              <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                <aside className="w-full shrink-0 lg:w-[300px] xl:w-[310px]">
                  <div
                    className={`sticky top-24 overflow-hidden rounded-2xl border bg-white shadow-sm ${
                      hrChrome
                        ? 'border-[#e4e8ef] shadow-[0_10px_36px_rgba(15,23,42,0.07)]'
                        : 'border-border'
                    }`}
                  >
                    {hrChrome ? (
                      <div
                        className="h-1 w-full bg-gradient-to-r from-[#2b4a8c] via-sky-500/80 to-[#2b4a8c]"
                        aria-hidden
                      />
                    ) : null}
                    <div className="p-5 pt-4">
                      <div className="space-y-6">
                        <div>
                          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#64748b]">
                            <ListChecks className="h-3.5 w-3.5 text-[#2b4a8c]" aria-hidden />
                            Trạng thái xử lý
                          </div>
                          <select
                            className={`h-11 w-full rounded-xl border bg-background px-3 text-sm font-medium outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[#2b4a8c]/25 ${
                              hrChrome ? 'border-[#e0e4ec] shadow-sm' : 'border-input'
                            }`}
                            value={cvStatusFilter}
                            onChange={(e) => setCvStatusFilter(e.target.value)}
                          >
                            <option value="all">Tất cả</option>
                            <option value="XEM_XET">Xem xét</option>
                            <option value="PHONG_VAN">Phỏng vấn</option>
                            <option value="LOAI">Loại</option>
                          </select>
                        </div>

                        <div>
                          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#64748b]">
                            <BriefcaseBusiness className="h-3.5 w-3.5 text-[#2b4a8c]" aria-hidden />
                            Vị trí ứng tuyển
                          </div>
                          {cvJobBuckets.length ? (
                            <div className="max-h-64 space-y-1 overflow-y-auto overscroll-contain pr-1">
                              {cvJobBuckets.map((b) => (
                                <CvFilterCheckboxRow
                                  key={b.id}
                                  id={b.id}
                                  label={b.title}
                                  count={b.count}
                                  checked={cvJobIdFilters.includes(b.id)}
                                  onToggle={toggleCvJobFilter}
                                  polished={hrChrome}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Chưa có vị trí trong tập lọc hiện tại.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>

                <div className="min-w-0 flex-1 space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-2 lg:max-w-md">
                      <label className={`text-xs font-semibold ${hrChrome ? 'text-[#64748b]' : ''}`}>
                        Tìm kiếm
                      </label>
                      <input
                        type="search"
                        placeholder="Tìm theo tên, email, SĐT…"
                        className={`h-10 w-full rounded-xl border px-3 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[#2b4a8c]/25 ${
                          hrChrome ? 'border-[#e0e4ec] bg-white shadow-sm' : 'border-input bg-background'
                        }`}
                        value={cvSearchKeyword}
                        onChange={(e) => setCvSearchKeyword(e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                      <div className="flex min-w-[10rem] flex-col gap-2">
                        <label className={`text-xs font-semibold ${hrChrome ? 'text-[#64748b]' : ''}`}>
                          Sắp xếp
                        </label>
                        <select
                          className={`h-10 w-full rounded-xl border px-3 text-sm font-medium outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[#2b4a8c]/25 sm:min-w-[11rem] ${
                            hrChrome ? 'border-[#e0e4ec] bg-white shadow-sm' : 'border-input bg-background'
                          }`}
                          value={cvSortOrder}
                          onChange={(e) => setCvSortOrder(e.target.value)}
                        >
                          <option value="newest">Mới nhất</option>
                          <option value="oldest">Cũ nhất</option>
                        </select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className={
                          hrChrome
                            ? 'h-10 shrink-0 gap-1.5 border-[#cfd8e8] bg-white font-semibold text-[#2b4a8c] hover:bg-[#e8f0fe]'
                            : 'h-10 shrink-0 gap-1.5'
                        }
                        onClick={resetCvFiltersAll}
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                        Đặt lại
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                        hrChrome
                          ? 'border-[#dce4f0] bg-white text-[#2b4a8c] shadow-sm'
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      Sau lọc: <b className="ml-1 tabular-nums">{filteredCvs.length}</b>
                    </span>
                    {cvStatusFilter !== 'all' ||
                    cvJobIdFilters.length ||
                    normalizeText(cvSearchKeyword) ||
                    cvSortOrder !== 'newest' ? (
                      <span className={`text-xs ${hrChrome ? 'text-[#94a3b8]' : 'text-muted-foreground'}`}>
                        Đang áp dụng bộ lọc
                      </span>
                    ) : null}
                  </div>

                  {pagedCvs.map((x) => (
                    <AdminCvListRow
                      key={x.id}
                      applicant={x}
                      hrLayout={hrChrome}
                      deletingCvId={deletingCvId}
                      token={token}
                      notifySuccess={notifySuccess}
                      notifyError={notifyError}
                      onUpdateStatus={updateCvStatus}
                      onDelete={deleteCv}
                      hideFilePath={hrChrome}
                    />
                  ))}

                  {!pagedCvs.length && !loadingCvs ? (
                    <div
                      className={`flex flex-col items-center justify-center border border-dashed p-10 text-center ${
                        hrChrome
                          ? 'rounded-2xl border-[#cfd8e6] bg-gradient-to-b from-[#f8fafc] to-white text-[#64748b]'
                          : 'rounded-lg text-muted-foreground'
                      }`}
                    >
                      <Files className={`mb-3 h-10 w-10 ${hrChrome ? 'text-[#2b4a8c]/40' : 'opacity-40'}`} />
                      <p className="text-sm font-medium text-foreground">Không có CV phù hợp</p>
                      <p className="mt-1 max-w-sm text-xs opacity-90">
                        Thử đổi trạng thái hoặc bỏ bớt lọc (nhấn Đặt lại).
                      </p>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-center gap-2 pt-2 text-sm">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={cvsPageSafe <= 1}
                      className={
                        hrChrome ? 'h-9 min-w-[2.25rem] rounded-full border-[#cfd8e8] hover:bg-[#e8f0fe]' : undefined
                      }
                      onClick={() => setCvsPage((p) => Math.max(1, p - 1))}
                    >
                      ‹
                    </Button>
                    <div className={hrChrome ? 'px-2 text-[#64748b]' : 'px-2 text-muted-foreground'}>
                      Trang{' '}
                      <b className={hrChrome ? 'font-bold text-[#2b4a8c]' : 'text-foreground'}>{cvsPageSafe}</b> /{' '}
                      {cvsTotalPages}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={cvsPageSafe >= cvsTotalPages}
                      className={
                        hrChrome ? 'h-9 min-w-[2.25rem] rounded-full border-[#cfd8e8] hover:bg-[#e8f0fe]' : undefined
                      }
                      onClick={() => setCvsPage((p) => Math.min(cvsTotalPages, p + 1))}
                    >
                      ›
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {active === 'cv-interview' ? (
          <Card
            className={
              hrChrome
                ? 'overflow-hidden rounded-2xl border-[#e4e8ef] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]'
                : undefined
            }
          >
            <CardHeader className={hrChrome ? 'border-b border-[#f0f2f6] bg-[#fafbfd]' : undefined}>
              <CardTitle
                className={`flex items-center gap-2 ${hrChrome ? 'text-xl font-bold text-[#1a2744]' : ''}`}
              >
                {hrChrome ? <CalendarCheck className="h-6 w-6 text-[#2b4a8c]" aria-hidden /> : null}
                CV đi phỏng vấn
              </CardTitle>
            </CardHeader>
            <CardContent className={hrChrome ? 'pt-6' : undefined}>
              {loadingCvs ? (
                <div
                  className={`mb-6 space-y-3 ${hrChrome ? 'rounded-2xl border border-[#e8ecf2] bg-[#f8fafc] p-5' : ''}`}
                >
                  <div className={`h-4 w-40 rounded-full ${hrChrome ? 'animate-pulse bg-[#e2e8f0]' : 'bg-muted'}`} />
                  <div className={`h-24 rounded-xl ${hrChrome ? 'animate-pulse bg-white' : 'bg-muted/50'}`} />
                  <div className={`h-24 rounded-xl ${hrChrome ? 'animate-pulse bg-white' : 'bg-muted/50'}`} />
                </div>
              ) : null}

              <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                <aside className="w-full shrink-0 lg:w-[300px] xl:w-[310px]">
                  <div
                    className={`sticky top-24 overflow-hidden rounded-2xl border bg-white shadow-sm ${
                      hrChrome
                        ? 'border-[#e4e8ef] shadow-[0_10px_36px_rgba(15,23,42,0.07)]'
                        : 'border-border'
                    }`}
                  >
                    {hrChrome ? (
                      <div
                        className="h-1 w-full bg-gradient-to-r from-[#2b4a8c] via-sky-500/80 to-[#2b4a8c]"
                        aria-hidden
                      />
                    ) : null}
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-2 border-b border-[#eef1f6] pb-4">
                        <h2 className="flex items-center gap-2 text-base font-bold text-[#2b4a8c]">
                          <Filter className="h-4 w-4 opacity-90" aria-hidden />
                          Bộ lọc
                        </h2>
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            hrChrome
                              ? 'rounded-lg px-2 py-1 text-[#2b4a8c] hover:bg-[#e8f0fe]'
                              : 'text-primary hover:underline'
                          }`}
                          onClick={resetCvInterviewAdvancedFilters}
                        >
                          <RotateCcw className="h-3 w-3" aria-hidden />
                          Đặt lại
                        </button>
                      </div>

                      <div className="mt-5 space-y-6">
                        <div>
                          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#64748b]">
                            <Briefcase className="h-3.5 w-3.5 text-[#2b4a8c]" aria-hidden />
                            Loại hình công việc
                          </div>
                          <div className="space-y-1">
                            {CV_WORK_FILTER_OPTIONS.map((opt) => (
                              <CvFilterCheckboxRow
                                key={opt.id}
                                id={opt.id}
                                label={opt.label}
                                count={cvInterviewWorkFilterCounts[opt.id] ?? 0}
                                checked={cvInterviewWorkFilters.includes(opt.id)}
                                onToggle={toggleCvInterviewWorkFilter}
                                polished={hrChrome}
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#64748b]">
                            <BriefcaseBusiness className="h-3.5 w-3.5 text-[#2b4a8c]" aria-hidden />
                            Vị trí ứng tuyển
                          </div>
                          {cvInterviewJobBuckets.length ? (
                            <div className="max-h-64 space-y-1 overflow-y-auto overscroll-contain pr-1">
                              {cvInterviewJobBuckets.map((b) => (
                                <CvFilterCheckboxRow
                                  key={b.id}
                                  id={b.id}
                                  label={b.title}
                                  count={b.count}
                                  checked={cvInterviewJobIdFilters.includes(b.id)}
                                  onToggle={toggleCvInterviewJobFilter}
                                  polished={hrChrome}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Chưa có vị trí trong danh sách phỏng vấn.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>

                <div className="min-w-0 flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                        hrChrome
                          ? 'border-[#dce4f0] bg-white text-[#2b4a8c] shadow-sm'
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      Phỏng vấn:{' '}
                      <b className="ml-1 tabular-nums">{filteredInterviewCvs.length}</b>
                    </span>
                    {cvInterviewWorkFilters.length || cvInterviewJobIdFilters.length ? (
                      <span className={`text-xs ${hrChrome ? 'text-[#94a3b8]' : 'text-muted-foreground'}`}>
                        Đang áp dụng bộ lọc
                      </span>
                    ) : null}
                  </div>

                  {pagedInterviewCvs.map((x) => (
                    <AdminCvListRow
                      key={x.id}
                      applicant={x}
                      hrLayout={hrChrome}
                      deletingCvId={deletingCvId}
                      token={token}
                      notifySuccess={notifySuccess}
                      notifyError={notifyError}
                      onUpdateStatus={updateCvStatus}
                      onDelete={deleteCv}
                      hideFilePath={hrChrome}
                    />
                  ))}

                  {!pagedInterviewCvs.length && !loadingCvs ? (
                    <div
                      className={`flex flex-col items-center justify-center border border-dashed p-10 text-center ${
                        hrChrome
                          ? 'rounded-2xl border-[#cfd8e6] bg-gradient-to-b from-[#f8fafc] to-white text-[#64748b]'
                          : 'rounded-lg text-muted-foreground'
                      }`}
                    >
                      <CalendarCheck className={`mb-3 h-10 w-10 ${hrChrome ? 'text-[#2b4a8c]/40' : 'opacity-40'}`} />
                      <p className="text-sm font-medium text-foreground">Chưa có hồ sơ phỏng vấn</p>
                      <p className="mt-1 max-w-sm text-xs opacity-90">
                        Gắn trạng thái Phỏng vấn từ Quản lý CV, hoặc nới bộ lọc (Đặt lại).
                      </p>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-center gap-2 pt-2 text-sm">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={cvsInterviewPageSafe <= 1}
                      className={
                        hrChrome ? 'h-9 min-w-[2.25rem] rounded-full border-[#cfd8e8] hover:bg-[#e8f0fe]' : undefined
                      }
                      onClick={() => setCvsInterviewPage((p) => Math.max(1, p - 1))}
                    >
                      ‹
                    </Button>
                    <div className={hrChrome ? 'px-2 text-[#64748b]' : 'px-2 text-muted-foreground'}>
                      Trang{' '}
                      <b className={hrChrome ? 'font-bold text-[#2b4a8c]' : 'text-foreground'}>
                        {cvsInterviewPageSafe}
                      </b>{' '}
                      / {cvsInterviewTotalPages}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={cvsInterviewPageSafe >= cvsInterviewTotalPages}
                      className={
                        hrChrome ? 'h-9 min-w-[2.25rem] rounded-full border-[#cfd8e8] hover:bg-[#e8f0fe]' : undefined
                      }
                      onClick={() =>
                        setCvsInterviewPage((p) => Math.min(cvsInterviewTotalPages, p + 1))
                      }
                    >
                      ›
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
          </section>
        </div>
      </main>
    </div>
  )
}

