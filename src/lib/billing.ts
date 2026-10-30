import type { SalesBilling } from '../data/types'

// Splits a payment-terms sentence such as "25% when SPAL Signed, 50% when start to sailing and 25% before
// berthing" into one billing milestone per percentage, each worth that share of the order value.
export function buildBillings(terms: string, total: number, currency: string): SalesBilling[] {
  const parts = terms.split(/,|\band\b/).map((p) => p.trim()).filter(Boolean)
  const found = parts.map((p) => p.match(/^(\d+(?:\.\d+)?)%\s*(.*)$/)).filter((m): m is RegExpMatchArray => !!m)
  const milestones = found.length ? found.map((m) => ({ percent: Number(m[1]), term: m[2] || 'Payment' })) : [{ percent: 100, term: terms || 'Payment' }]
  return milestones.map((m, i) => ({
    id: `bill-${Date.now()}-${i}`,
    term: m.term.charAt(0).toUpperCase() + m.term.slice(1),
    percent: m.percent,
    amount: Math.round((total * m.percent) / 100),
    currency,
    status: 'planned',
  }))
}

export type BillingSummary = 'not_billed' | 'partially_billed' | 'billed' | 'paid'

export function billingSummary(billings?: SalesBilling[]): BillingSummary {
  if (!billings || billings.length === 0 || billings.every((b) => b.status === 'planned')) return 'not_billed'
  if (billings.every((b) => b.status === 'paid')) return 'paid'
  if (billings.every((b) => b.status !== 'planned')) return 'billed'
  return 'partially_billed'
}

export const billingLabel: Record<BillingSummary, string> = {
  not_billed: 'Not billed', partially_billed: 'Partially billed', billed: 'Billed', paid: 'Paid',
}

// Where the order stands against its payment terms, e.g. "Term 2/3 · 50% When start to sailing · invoiced, awaiting payment".
export function billingStage(billings?: SalesBilling[]): string {
  if (!billings || billings.length === 0) return ''
  const n = billings.length
  const idx = billings.findIndex((b) => b.status !== 'paid')
  if (idx === -1) return `All ${n} terms paid`
  const b = billings[idx]
  return `Term ${idx + 1}/${n} · ${b.percent}% ${b.term} · ${b.status === 'invoiced' ? 'invoiced, awaiting payment' : 'to be invoiced'}`
}
