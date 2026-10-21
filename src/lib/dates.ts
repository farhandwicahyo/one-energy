// All dates are calendar dates (no time), interpreted in WIB, as the TRD specifies.
// The mockup pins "today" so the demo always shows the same picture.
export const TODAY = '2026-10-21'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function toUtc(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number): string {
  return fromUtc(toUtc(iso) + days * 86400000)
}

export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1 + months, d))
  return date.toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / 86400000)
}

export function daysLeft(iso: string, ref = TODAY): number {
  return daysBetween(ref, iso)
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

export function fmtDateTime(iso: string): string {
  const time = iso.length > 10 ? iso.slice(11, 16) : ''
  return time ? `${fmtDate(iso)}, ${time}` : fmtDate(iso)
}

export function relDays(n: number): string {
  if (n === 0) return 'today'
  if (n > 0) return n === 1 ? 'in 1 day' : `in ${n} days`
  return n === -1 ? '1 day ago' : `${-n} days ago`
}

export function nowStamp(): string {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `${TODAY}T${hh}:${mm}`
}
