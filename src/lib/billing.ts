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
    status: 'waiting_payment',
  }))
}

export type BillingSummary = 'waiting_payment' | 'paid'

// An order is "Waiting payment" until every term is paid.
export function billingSummary(billings?: SalesBilling[]): BillingSummary {
  return billings && billings.length > 0 && billings.every((b) => b.status === 'paid') ? 'paid' : 'waiting_payment'
}

export const billingLabel: Record<BillingSummary, string> = { waiting_payment: 'Waiting payment', paid: 'Paid' }

// Where the order stands against its payment terms, e.g. "Term 2/3 · 50% When start to sailing · waiting payment (1 of 3 paid)".
export function billingStage(billings?: SalesBilling[]): string {
  if (!billings || billings.length === 0) return ''
  const n = billings.length
  const idx = billings.findIndex((b) => b.status !== 'paid')
  if (idx === -1) return `All ${n} terms paid`
  const b = billings[idx]
  return `Term ${idx + 1}/${n} · ${b.percent}% ${b.term} · waiting payment (${idx} of ${n} paid)`
}

// Patch for updateSO after one milestone changes; the order completes once every term is paid.

export function billingPatch(billings: SalesBilling[], index: number, change: Partial<SalesBilling>): { billings: SalesBilling[]; status?: 'completed' } {

  const next = billings.map((b, j) => (j === index ? { ...b, ...change } : b))

  return next.every((b) => b.status === 'paid') ? { billings: next, status: 'completed' } : { billings: next }

}
