import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { Badge, Empty, PageHeader, SearchBox, Select, Table, Toolbar, type Col } from '../../components/ui'
import { fmtDate } from '../../lib/dates'
import type { SalesBilling, SalesOrder } from '../../data/types'

// One row per billing milestone of a sales order. Finance is the only place that issues invoices and records payments.
interface Row { id: string; so: SalesOrder; b: SalesBilling; idx: number }
const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n)

function useRows() {
  const { s } = useStore()
  return useMemo<Row[]>(() => s.salesOrders.flatMap((so) => (so.billings ?? []).map((b, idx) => ({ id: b.id, so, b, idx }))), [s.salesOrders])
}

function BillingTable({ title, lead, rows, statusOptions, empty, base }: {
  title: string; lead: string; rows: Row[]; statusOptions: { value: string; label: string }[]
  empty: string; base: string
}) {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const shown = rows.filter((r) => {
    const term = q.toLowerCase()
    if (status !== 'all' && r.b.status !== status) return false
    return !term || r.so.soNo.toLowerCase().includes(term) || r.so.customerName.toLowerCase().includes(term) || r.so.poNo.toLowerCase().includes(term)
  })
  const cols: Col<Row>[] = [
    { key: 'so', header: 'Sales Order', cell: (r) => <span className="font-semibold text-accent">{r.so.soNo}</span>, mobile: 'title' },
    { key: 'customer', header: 'Customer', cell: (r) => <div><div>{r.so.customerName}</div><div className="text-xs text-ink-2">PO {r.so.poNo}</div></div> },
    { key: 'term', header: 'Term', cell: (r) => <div><div>{r.idx + 1}/{r.so.billings?.length} · {r.b.percent}%</div><div className="text-xs text-ink-2">{r.b.term}</div></div> },
    { key: 'amount', header: 'Amount', cell: (r) => `${r.b.currency} ${fmt(r.b.amount)}`, className: 'text-right' },
    { key: 'paid', header: 'Paid', cell: (r) => r.b.paidAt ? fmtDate(r.b.paidAt) : '—', mobile: 'hide' },
    { key: 'paidby', header: 'Marked paid by', cell: (r) => r.b.paidBy ?? '—', mobile: 'hide' },
    { key: 'status', header: 'Status', cell: (r) => <Badge t={r.b.status === 'paid' ? 'ok' : 'warn'}>{r.b.status === 'paid' ? 'Paid' : 'Waiting payment'}</Badge> },
  ]
  return (
    <div>
      <PageHeader title={title} lead={lead} />
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Search SO, customer, PO..." />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
          <option value="all">All Status</option>{statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </Toolbar>
      {shown.length > 0 ? <Table rows={shown} cols={cols} rowKey={(r) => r.id} onRow={(r) => nav(`${base}/${r.so.id}`)} /> : <Empty title="Nothing here yet">{empty}</Empty>}
    </div>
  )
}

export function CustomerInvoicePage() {
  const rows = useRows()
  return (
    <BillingTable
      title="Customer Invoice" lead="Every billing term of every sales order. Open an order to mark a term as paid with proof of payment."
      rows={rows} statusOptions={[{ value: 'waiting_payment', label: 'Waiting payment' }, { value: 'paid', label: 'Paid' }]}
      empty="Billing milestones appear here as soon as Sales submits a Sales Order." base="/finance/billing/invoice"
    />
  )
}

export function PaymentReceiptPage() {
  const rows = useRows().filter((r) => r.b.status === 'paid')
  return (
    <BillingTable
      title="Payment Receipt" lead="Payments already received, with proof of payment. Open an order to see its billing terms."
      rows={rows} statusOptions={[{ value: 'paid', label: 'Paid' }]}
      empty="Paid terms appear here once Finance confirms the money is in the company account." base="/finance/billing/receipt"
    />
  )
}

export function useBillingStats() {
  const rows = useRows()
  const waiting = rows.filter((r) => r.b.status === 'waiting_payment')
  return {
    waiting: waiting.length,
    paid: rows.filter((r) => r.b.status === 'paid').length,
    receivable: waiting.reduce((a, r) => a + r.b.amount, 0),
  }
}
