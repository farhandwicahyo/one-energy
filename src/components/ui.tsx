import { createContext, useCallback, useContext, useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Pencil, Search, Trash2, X } from 'lucide-react'
import type { DocStatus, FollowUp, OpStatus, Readiness } from '../data/types'
import { docStatusLabel, followUpLabel, opStatusLabel, readinessLabel } from '../i18n/en'

export const cx = (...c: (string | number | false | null | undefined)[]) => c.filter(Boolean).join(' ')

// ---------- Buttons ----------
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
// .tombol, .tombol--sekunder, .tombol--teks, .tombol--bahaya from the reference site.css
const variants: Record<Variant, string> = {
  primary: 'border-accent bg-accent text-surface hover:border-accent-strong hover:bg-accent-strong active:translate-y-px',
  secondary: 'border-accent bg-transparent text-accent hover:bg-accent-soft active:translate-y-px',
  ghost: 'border-transparent text-accent hover:bg-accent-soft',
  danger: 'border-bad bg-bad text-surface hover:border-[#8f1e18] hover:bg-[#8f1e18] active:translate-y-px',
}
export function Button({ variant = 'primary', size = 'md', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg border-2 font-bold transition-[background-color,transform] duration-100 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
        size === 'sm' ? 'h-9 px-3 text-sm' : 'h-12 px-5 text-base',
        variants[variant], className,
      )}
    />
  )
}

// ---------- Status badges ----------
const tone = {
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
  neutral: 'bg-surface-2 text-ink-2',
  accent: 'bg-accent-soft text-accent-strong',
} as const
export type Tone = keyof typeof tone

export function Badge({ t = 'neutral', children, dot, className }: { t?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-[13px] font-bold whitespace-nowrap', tone[t], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export const readinessTone: Record<Readiness, Tone> = { green: 'ok', yellow: 'warn', red: 'bad' }
export const ReadinessBadge = ({ s }: { s: Readiness }) => <Badge t={readinessTone[s]} dot>{readinessLabel[s]}</Badge>
export const DocBadge = ({ s }: { s: DocStatus }) => <Badge t={s === 'valid' ? 'ok' : s === 'soon' ? 'warn' : 'bad'}>{docStatusLabel[s]}</Badge>
// Neutral on purpose: orange is the brand accent and would read like a warning next to readiness.
export const OpBadge = ({ s }: { s: OpStatus }) => <Badge t="neutral" className={s === 'operating' ? '!text-ink' : undefined}>{opStatusLabel[s]}</Badge>
export const FollowBadge = ({ s }: { s: FollowUp | null }) =>
  s ? <Badge t={s === 'done' ? 'ok' : s === 'in_progress' ? 'accent' : 'neutral'}>{followUpLabel[s]}</Badge> : <span className="text-ink-3">—</span>

// ---------- Layout pieces ----------
// The module code lives in the breadcrumb now; `module` is kept so pages need no change.
export function PageHeader({ title, lead, actions, back }: { module?: string; title: string; lead?: ReactNode; actions?: ReactNode; back?: { to: string; label: string } }) {
  return (
    <header className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back && <Link to={back.to} className="mb-2 inline-flex min-h-9 items-center font-bold text-accent hover:text-accent-strong">← {back.label}</Link>}
        <h1 className="judul text-[2.5rem] text-ink md:text-[3.25rem]">
          {title}
        </h1>
        {lead && <p className="mt-3 max-w-[68ch] text-[17px] text-ink-2">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function Panel({ title, actions, children, className, pad = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cx('rounded border border-line bg-surface', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-1">
          {title && <h2 className="text-[17px] font-bold text-ink">{title}</h2>}
          {actions}
        </div>
      )}
      <div className={cx(pad && 'p-5', pad && title && 'pt-3')}>{children}</div>
    </section>
  )
}

export function Stat({ label, value, sub, t, to }: { label: string; value: ReactNode; sub?: ReactNode; t?: Tone; to?: string }) {
  const body = (
    <>
      <div className="text-[15px] font-bold text-ink-2">{label}</div>
      <div className={cx('tnum mt-1 font-display text-[3.25rem] font-extrabold leading-none', t === 'ok' && 'text-ok', t === 'warn' && 'text-warn', t === 'bad' && 'text-bad', !t && 'text-ink')}>{value}</div>
      {sub && <div className="mt-2 text-sm text-ink-2">{sub}</div>}
    </>
  )
  const cls = 'block rounded border border-line bg-surface p-5'
  return to ? <Link to={to} className={cx(cls, 'border-2 border-ink transition-colors hover:bg-accent-soft')}>{body}</Link> : <div className={cls}>{body}</div>
}

export function KV({ items, cols = 2 }: { items: [string, ReactNode][]; cols?: 2 | 3 }) {
  return (
    <dl className={cx('grid gap-x-6 gap-y-4', cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-[13px] text-ink-2">{k}</dt>
          <dd className="mt-0.5 text-[15px] text-ink">{v || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

// `notFound` shows the not-found picture, for searches and filters that return nothing.
export function Empty({ title, children, notFound }: { title: string; children?: ReactNode; notFound?: boolean }) {
  return (
    <div className="rounded border-2 border-dashed border-ink-3 bg-surface px-6 py-10 text-center">
      {notFound && <img src="/not-found.jpg" alt="" width={1408} height={768} className="mx-auto mb-4 w-full max-w-md rounded" />}
      <div className="font-bold text-ink">{title}</div>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-ink-2">{children}</div>}
    </div>
  )
}

export function Locked({ what }: { what: string }) {
  return (
    <div className="flex items-start gap-3 rounded border-2 border-dashed border-ink-3 bg-surface p-5">
      <Lock className="mt-0.5 size-5 shrink-0 text-ink-2" aria-hidden />
      <div>
        <div className="font-medium text-ink">{what} is restricted</div>
        <p className="mt-0.5 text-sm text-ink-2">Only Crewing / HR can see personal data and contracts (SIGUNA-03). The request is blocked by the API and by row-level security, not only hidden here.</p>
      </div>
    </div>
  )
}

// ---------- Form controls ----------
// .input from the reference: 2px strong border, blue border + soft outline on focus
const control = 'h-11 w-full rounded-lg border-2 border-ink-3 bg-surface px-3 text-[15px] text-ink placeholder:text-ink-3 outline-none hover:border-ink-2 focus:border-accent focus:outline-3 focus:outline-accent-200'
export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(control, className)} />
export const Select = ({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={cx(control, 'pr-8', className)}>{children}</select>
)
export function Textarea(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cx(control, 'h-auto min-h-24 py-2 leading-relaxed', p.className)} />
}
export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-[15px] font-bold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-2">{hint}</span>}
    </label>
  )
}
export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-[14rem] flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" aria-label={placeholder} />
    </div>
  )
}
export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2 [&_select]:w-auto [&_select]:max-w-[15rem]">{children}</div>
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="inline-flex flex-wrap overflow-hidden rounded-lg border-2 border-accent" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx('h-9 px-3.5 text-sm font-bold transition-colors', value === o.value ? 'bg-accent text-surface' : 'bg-surface text-accent hover:bg-accent-soft')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: ReactNode }[] }) {
  return (
    <div className="-mx-4 mb-5 overflow-x-auto px-4 md:mx-0 md:px-0" role="tablist">
      <div className="flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={value === t.value}
            onClick={() => onChange(t.value)}
            className={cx('relative h-11 shrink-0 px-4 text-[15px] font-bold transition-colors', value === t.value ? 'text-accent after:absolute after:inset-x-2 after:bottom-0 after:h-1.5 after:bg-sorot' : 'text-ink-2 hover:text-accent')}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------- Table (becomes cards on phones) ----------
export interface Col<T> {
  key: string
  header: string
  cell: (r: T) => ReactNode
  className?: string
  mobile?: 'title' | 'hide'
}
// ---------- Pagination ----------
// Pages through any list. Goes back to page 1 when the list changes size (a filter was applied).
export function usePaged<T>(rows: T[], initialSize = 10) {
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(initialSize)
  useEffect(() => setPage(1), [rows.length, size])
  const pages = Math.max(1, Math.ceil(rows.length / size))
  const current = Math.min(page, pages)
  const start = (current - 1) * size
  return { items: rows.slice(start, start + size), page: current, pages, size, setSize, setPage, start, total: rows.length }
}

function pageList(page: number, pages: number): (number | '…')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const set = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages))
  const sorted = [...set].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
}

export function Pager({ p, sizes = [10, 25, 50] }: { p: ReturnType<typeof usePaged<unknown>>; sizes?: number[] }) {
  if (!p.total) return null
  const btn = 'grid h-9 min-w-9 place-items-center rounded-lg border-2 px-2 text-sm font-bold transition-colors disabled:pointer-events-none disabled:opacity-40'
  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-3 text-ink-2">
        <span className="tnum">{p.start + 1}–{Math.min(p.start + p.size, p.total)} of {p.total}</span>
        <label className="flex items-center gap-2">
          <span className="sr-only">Rows per page</span>
          <select value={p.size} onChange={(e) => p.setSize(Number(e.target.value))} className="h-9 rounded-lg border-2 border-ink-3 bg-surface px-2 text-sm text-ink outline-none focus:border-accent" aria-label="Rows per page">
            {sizes.map((n) => <option key={n} value={n}>{n} per page</option>)}
          </select>
        </label>
      </div>
      {p.pages > 1 && (
        <div className="flex flex-wrap items-center gap-1">
          <button className={cx(btn, 'border-accent text-accent hover:bg-accent-soft')} disabled={p.page === 1} onClick={() => p.setPage(p.page - 1)} aria-label="Previous page">‹</button>
          {pageList(p.page, p.pages).map((n, i) => n === '…'
            ? <span key={`e${i}`} className="px-1 text-ink-3">…</span>
            : <button key={n} onClick={() => p.setPage(n)} aria-current={n === p.page ? 'page' : undefined} className={cx(btn, 'tnum', n === p.page ? 'border-accent bg-accent text-surface' : 'border-transparent text-ink hover:border-accent hover:text-accent')}>{n}</button>)}
          <button className={cx(btn, 'border-accent text-accent hover:bg-accent-soft')} disabled={p.page === p.pages} onClick={() => p.setPage(p.page + 1)} aria-label="Next page">›</button>
        </div>
      )}
    </nav>
  )
}

// `limit` is accepted for older callers but every table now pages at 10 rows.
export function Table<T>({ rows, cols, rowKey, onRow, empty }: { rows: T[]; cols: Col<T>[]; rowKey: (r: T) => string; onRow?: (r: T) => void; limit?: number; empty?: string }) {
  const paged = usePaged(rows)
  if (!rows.length) return empty ? <Empty title={empty} /> : <Empty notFound title="Nothing matches your search or filters">Clear the search or change a filter to see more.</Empty>
  const visible = paged.items
  const title = cols.find((c) => c.mobile === 'title') ?? cols[0]
  return (
    <div>
      <div className="hidden overflow-x-auto rounded border-2 border-ink bg-surface md:block">
        <table className="w-full text-left text-[15px]">
          <thead>
            <tr className="border-b-2 border-ink bg-surface-2 text-sm font-bold text-ink">
              {cols.map((c) => <th key={c.key} scope="col" className={cx('px-4 py-2.5 font-medium', c.className)}>{c.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr
                key={rowKey(r)}
                onClick={onRow ? () => onRow(r) : undefined}
                className={cx('border-t border-line align-middle first:border-t-0', onRow && 'cursor-pointer hover:bg-accent-soft')}
              >
                {cols.map((c) => <td key={c.key} className={cx('px-4 py-3', c.className)}>{c.cell(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-2 md:hidden">
        {visible.map((r) => (
          <li key={rowKey(r)}>
            <div role={onRow ? 'button' : undefined} tabIndex={onRow ? 0 : undefined} onClick={onRow ? () => onRow(r) : undefined} className="rounded border-2 border-ink bg-surface p-4 active:bg-accent-soft">
              <div className="font-medium text-ink">{title.cell(r)}</div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {cols.filter((c) => c !== title && c.mobile !== 'hide').map((c) => (
                  <div key={c.key} className="min-w-0">
                    <dt className="text-xs text-ink-2">{c.header}</dt>
                    <dd className="mt-0.5 truncate">{c.cell(r)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </li>
        ))}
      </ul>
      <Pager p={paged as ReturnType<typeof usePaged<unknown>>} />
    </div>
  )
}

// ---------- Modal ----------
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cx('rise max-h-[92vh] w-full overflow-y-auto rounded-t border-2 border-ink bg-surface sm:rounded', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-5">
          <h2 className="judul text-[2rem] text-ink">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-ink-2 hover:bg-surface-2" aria-label="Close"><X className="size-5" /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 bg-surface-2/50 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

// ---------- Toasts ----------
const ToastCtx = createContext<(msg: string) => void>(() => {})
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string }[]>([])
  const push = useCallback((msg: string) => {
    const id = Date.now() + Math.random()
    setItems((x) => [...x, { id, msg }])
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3800)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {items.map((i) => (
          <div key={i.id} className="rise pointer-events-auto max-w-md rounded-lg bg-ink px-4 py-3 text-sm text-white shadow-xl">{i.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)

export function Meter({ value, max, t = 'accent' }: { value: number; max: number; t?: 'ok' | 'warn' | 'bad' | 'accent' }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0
  const fill = { ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad', accent: 'bg-accent' }[t]
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className={cx('h-full rounded-full', fill)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export const idr = (n: number) => `IDR ${new Intl.NumberFormat('en-US').format(n)}`

// Delete always asks for a reason; it goes into the audit log with the change.
export function ConfirmDelete({ open, onClose, title, children, confirmLabel = 'Delete', onConfirm }: { open: boolean; onClose: () => void; title: string; children: ReactNode; confirmLabel?: string; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('')
  useEffect(() => { if (open) setReason('') }, [open])
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>{confirmLabel}</Button></>}>
      <div className="space-y-4">
        <div className="text-[15px] text-ink">{children}</div>
        <Field label="Reason" hint="Recorded in the audit log with your name and the time."><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Vessel sold" /></Field>
      </div>
    </Modal>
  )
}

// Edit / delete icon buttons for a table row. Clicks stop here so the row does not open.
export function RowActions({ label, onEdit, onDelete }: { label: string; onEdit?: () => void; onDelete?: () => void }) {
  const b = 'grid size-9 place-items-center rounded-lg border-2 transition-colors'
  return (
    <span className="inline-flex gap-1.5" onClick={(e) => e.stopPropagation()}>
      {onEdit && <button className={cx(b, 'border-accent text-accent hover:bg-accent-soft')} onClick={onEdit} aria-label={`Edit ${label}`} title="Edit"><Pencil className="size-4" /></button>}
      {onDelete && <button className={cx(b, 'border-bad text-bad hover:bg-bad-soft')} onClick={onDelete} aria-label={`Delete ${label}`} title="Delete"><Trash2 className="size-4" /></button>}
    </span>
  )
}
