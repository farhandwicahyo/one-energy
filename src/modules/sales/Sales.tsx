import { useState, useMemo, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ClipboardList, FileSearch, FileSpreadsheet, FileText,
  Handshake, LayoutDashboard, Plus, Eye, Check, X as XIcon, MessageSquare, Trash2,
} from 'lucide-react'
import { useStore } from '../../store'
import {
  Badge, Button, cx, Empty, Field, ModuleFooter, Input, PageHeader, Panel, Select,
  SearchBox, Stat, Table, Textarea, Toolbar, type Col, type Tone,
} from '../../components/ui'
import { fmtDate, TODAY } from '../../lib/dates'
import type { CommercialSheet, PurchaseOrder, Quotation, RFQ, SalesOrder } from '../../data/types'

const idr = (n: number) => `IDR ${new Intl.NumberFormat('en-US').format(n)}`
const section = 'rounded border-2 border-accent bg-surface'
const sectionTitle = 'bg-accent px-4 py-2 text-sm font-bold text-white rounded-t'

// ---------- Sidebar ----------
const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/sales/dashboard' },
  { key: 'rfq', label: 'RFQ', icon: FileSearch, path: '/sales/rfq' },
  { key: 'quotation', label: 'Quotation', icon: FileText, path: '/sales/quotation' },
  { key: 'po', label: 'Purchase Order', icon: ClipboardList, path: '/sales/po' },
  { key: 'so', label: 'Sales Order', icon: Handshake, path: '/sales/so' },
  { key: 'commercial-sheet', label: 'Commercial Sheet', icon: FileSpreadsheet, path: '/sales/commercial-sheet' },
] as const

function SidebarContent({ active, onNav, collapsed }: { active: string; onNav?: () => void; collapsed?: boolean }) {
  return (
    <div className="space-y-0.5">
      {NAV.map((n) => {
        const Icon = n.icon
        const here = active === n.key
        return (
          <Link key={n.key} to={n.path} onClick={onNav} title={n.label} className={cx(
            'flex items-center gap-2.5 rounded-lg py-2.5 text-[15px] font-semibold transition-colors',
            collapsed ? 'justify-center px-0' : 'px-3',
            here ? 'bg-accent text-white' : 'text-[var(--color-nav-ink)] hover:bg-white/10',
          )}>
            <Icon className="size-4 shrink-0" aria-hidden />
            {!collapsed && n.label}
          </Link>
        )
      })}
    </div>
  )
}

function ModuleShell({ active, children }: { active: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const h = () => setOpen((o) => !o)
    window.addEventListener('toggle-module-sidebar', h)
    return () => window.removeEventListener('toggle-module-sidebar', h)
  }, [])
  return (
    <div className="flex min-h-0 w-full flex-1">
      <nav className={cx('hidden shrink-0 overflow-y-auto bg-[var(--color-nav)] transition-[width] lg:block', open ? 'w-56 p-3' : 'w-16 p-2')} aria-label="Sales menu">
        <SidebarContent active={active} collapsed={!open} />
      </nav>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
          <nav className="fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto bg-[var(--color-nav)] p-4 pt-6 shadow-2xl lg:hidden" aria-label="Sales menu">
            <SidebarContent active={active} onNav={() => setOpen(false)} />
          </nav>
        </>
      )}
      <div className="min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">{children}<ModuleFooter /></div>
    </div>
  )
}

function BackButton({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
      <ArrowLeft className="size-4" /> Back to {label}
    </Link>
  )
}

// ---------- Dashboard ----------
function SalesDashboard() {
  const { s } = useStore()
  return (
    <div>
      <h1 className="judul mb-5 text-[2rem] uppercase">Sales Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total RFQ" value={s.rfqs.length} to="/sales/rfq" />
        <Stat label="Total Quotation" value={s.quotations.length} to="/sales/quotation" />
        <Stat label="Total PO" value={s.purchaseOrders.length} to="/sales/po" />
        <Stat label="Total SO" value={s.salesOrders.length} to="/sales/so" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Panel title="Quotation by Status">
          <dl className="space-y-2">
            {(['draft', 'negotiation', 'approved', 'rejected', 'expired'] as const).map((st) => {
              const count = s.quotations.filter((q) => q.status === st).length
              if (!count) return null
              return <div key={st} className="flex justify-between text-[15px]"><dt className="capitalize">{st}</dt><dd className="font-bold">{count}</dd></div>
            })}
          </dl>
        </Panel>
        <Panel title="PO by Status">
          <dl className="space-y-2">
            {(['draft', 'confirmed', 'completed', 'cancelled'] as const).map((st) => {
              const count = s.purchaseOrders.filter((p) => p.status === st).length
              if (!count) return null
              return <div key={st} className="flex justify-between text-[15px]"><dt className="capitalize">{st}</dt><dd className="font-bold">{count}</dd></div>
            })}
          </dl>
        </Panel>
        <Panel title="SO by Status">
          <dl className="space-y-2">
            {(['draft', 'active', 'completed', 'cancelled'] as const).map((st) => {
              const count = s.salesOrders.filter((so) => so.status === st).length
              if (!count) return null
              return <div key={st} className="flex justify-between text-[15px]"><dt className="capitalize">{st}</dt><dd className="font-bold">{count}</dd></div>
            })}
          </dl>
        </Panel>
      </div>
    </div>
  )
}

// ---------- RFQ ----------
function RFQDetailPage({ id }: { id: string }) {
  const { s } = useStore()
  const rfq = s.rfqs.find((r) => r.id === id)
  if (!rfq) return <div><BackButton to="/sales/rfq" label="RFQ" /><Empty title="RFQ not found">The requested RFQ does not exist.</Empty></div>
  return (
    <div>
      <BackButton to="/sales/rfq" label="RFQ" />
      <div className="mb-6 flex items-center gap-3"><FileSearch className="size-8 text-accent" /><h1 className="text-2xl font-bold text-ink">{rfq.rfqNo}</h1></div>
      <div className="space-y-5">
        <div className={section}>
          <div className={sectionTitle}>RFQ Details</div>
          <dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2 text-[15px]">
            <div><dt className="text-xs text-ink-2">Customer</dt><dd className="font-semibold">{rfq.customerName}</dd></div>
            <div><dt className="text-xs text-ink-2">Contact</dt><dd>{rfq.customerContact}</dd></div>
            <div><dt className="text-xs text-ink-2">Origin</dt><dd>{rfq.origin}</dd></div>
            <div><dt className="text-xs text-ink-2">Destination</dt><dd>{rfq.destination}</dd></div>
            <div><dt className="text-xs text-ink-2">Cargo</dt><dd>{rfq.cargoType}</dd></div>
            <div><dt className="text-xs text-ink-2">Tonnage</dt><dd>{rfq.cargoTonnage.toLocaleString()} MT</dd></div>
            <div><dt className="text-xs text-ink-2">Request Date</dt><dd>{fmtDate(rfq.requestDate)}</dd></div>
            <div><dt className="text-xs text-ink-2">Valid Until</dt><dd>{fmtDate(rfq.validUntil)}</dd></div>
            {rfq.notes && <div className="sm:col-span-2"><dt className="text-xs text-ink-2">Notes</dt><dd>{rfq.notes}</dd></div>}
          </dl>
        </div>
        <div className={section}>
          <div className={sectionTitle}>Attached Documents</div>
          <div className="p-4">
            {rfq.files.length > 0 ? (
              <div className="space-y-2">
                {rfq.files.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded border border-line p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid size-9 shrink-0 place-items-center rounded bg-bad-soft text-bad"><FileText className="size-4" /></span>
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold text-ink">{f.name}</div>
                        <div className="text-xs text-ink-2">{(f.sizeKb / 1024).toFixed(1)} MB · {fmtDate(f.uploadedAt.slice(0, 10))}</div>
                      </div>
                    </div>
                    <button onClick={() => window.open(`data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCg==`, '_blank')} className="flex items-center gap-1.5 rounded border-2 border-accent px-3 py-1.5 text-sm font-bold text-accent hover:bg-accent-soft">
                      <Eye className="size-4" /> View PDF
                    </button>
                  </div>
                ))}
              </div>
            ) : <div className="rounded border-2 border-dashed border-ink-3 p-4 text-center text-sm text-ink-2">No documents uploaded for this RFQ.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function RFQPage() {
  const { s } = useStore()
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const rows = useMemo(() => { const term = q.toLowerCase(); return s.rfqs.filter((r) => !term || r.rfqNo.toLowerCase().includes(term) || r.customerName.toLowerCase().includes(term)) }, [s.rfqs, q])
  const cols: Col<RFQ>[] = [
    { key: 'no', header: 'RFQ No', cell: (r) => <span className="font-semibold text-accent">{r.rfqNo}</span>, mobile: 'title' },
    { key: 'customer', header: 'Customer', cell: (r) => r.customerName },
    { key: 'route', header: 'Route', cell: (r) => `${r.origin} → ${r.destination}` },
    { key: 'cargo', header: 'Cargo', cell: (r) => r.cargoType },
    { key: 'tonnage', header: 'Tonnage', cell: (r) => `${r.cargoTonnage.toLocaleString()} MT`, className: 'text-right' },
    { key: 'docs', header: 'Docs', cell: (r) => r.files.length > 0 ? <Badge t="accent">{r.files.length} PDF</Badge> : <span className="text-ink-3">—</span> },
    { key: 'date', header: 'Request Date', cell: (r) => fmtDate(r.requestDate) },
  ]
  return (
    <div>
      <PageHeader title="RFQ" lead="Request for Quotation from customers" />
      <Toolbar><SearchBox value={q} onChange={setQ} placeholder="Search RFQ no or customer..." /></Toolbar>
      <Table rows={rows} cols={cols} rowKey={(r) => r.id} onRow={(r) => nav(`/sales/rfq/${r.id}`)} />
    </div>
  )
}

// ---------- Quotation ----------
const quotationTone: Record<string, Tone> = { draft: 'neutral', negotiation: 'accent', approved: 'ok', rejected: 'bad', expired: 'bad' }

function NegotiationPanel({ quotation }: { quotation: Quotation }) {
  const { approveNegotiation, rejectNegotiation, customerRespondNegotiation, submitNegotiation, me } = useStore()
  const [price, setPrice] = useState('')
  const [showNegotiate, setShowNegotiate] = useState(false)
  const isSuperadmin = me.roles.includes('superadmin' as any)
  const latestRound = quotation.negotiations[quotation.negotiations.length - 1]
  const canNegotiateAgain = quotation.status === 'negotiation' && quotation.currentRound < 2 && latestRound?.customerResponse === 'reject'
  const canSubmitNew = quotation.status === 'draft' || showNegotiate

  return (
    <div className={section}>
      <div className={sectionTitle}>Negotiation History</div>
      <div className="p-4">
        {quotation.negotiations.length === 0 && <p className="text-sm text-ink-2">No negotiation rounds yet.</p>}
        {quotation.negotiations.map((n) => (
          <div key={n.round} className="mb-3 rounded border border-line p-4">
            <div className="flex items-center justify-between">
              <span className="font-bold">Round {n.round}</span>
              <span className="text-sm text-ink-2">{fmtDate(n.submittedAt.slice(0, 10))}</span>
            </div>
            <div className="mt-2 text-[15px]">Price: <strong>{idr(n.salesPrice)}</strong></div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge t={n.approvalStatus === 'approved' ? 'ok' : n.approvalStatus === 'rejected' ? 'bad' : 'accent'}>Internal: {n.approvalStatus}</Badge>
              {n.customerResponse && <Badge t={n.customerResponse === 'ok' ? 'ok' : 'bad'}>Customer: {n.customerResponse}</Badge>}
            </div>
            {/* Internal approval buttons */}
            {n.approvalStatus === 'pending' && isSuperadmin && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => approveNegotiation(quotation.id, n.round)}><Check className="size-4" /> Approve</Button>
                <Button size="sm" variant="danger" onClick={() => rejectNegotiation(quotation.id, n.round)}><XIcon className="size-4" /> Reject</Button>
              </div>
            )}
            {/* Customer response: Approve, Reject, or Negotiate (counter-offer) */}
            {n.approvalStatus === 'approved' && !n.customerResponse && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => customerRespondNegotiation(quotation.id, n.round, 'ok')}><Check className="size-4" /> Customer Approve</Button>
                {quotation.currentRound < 2 && (
                  <Button size="sm" variant="secondary" onClick={() => { customerRespondNegotiation(quotation.id, n.round, 'reject'); setShowNegotiate(true) }}>
                    <MessageSquare className="size-4" /> Negotiate
                  </Button>
                )}
                {quotation.currentRound >= 2 && (
                  <Button size="sm" variant="danger" onClick={() => customerRespondNegotiation(quotation.id, n.round, 'reject')}><XIcon className="size-4" /> Customer Reject</Button>
                )}
              </div>
            )}
          </div>
        ))}
        {/* Submit new negotiation round */}
        {(canSubmitNew || canNegotiateAgain) && quotation.currentRound < 2 && (
          <div className="mt-3 rounded border-2 border-accent-soft p-4">
            <h4 className="mb-2 font-bold text-ink">Submit Counter-Offer (Round {quotation.currentRound + 1} of max 2)</h4>
            <div className="flex items-end gap-2">
              <Field label="Proposed Price (IDR)">
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 500000000" />
              </Field>
              <Button size="sm" disabled={!price} onClick={() => { submitNegotiation(quotation.id, Number(price)); setPrice(''); setShowNegotiate(false) }}>Submit Round {quotation.currentRound + 1}</Button>
            </div>
          </div>
        )}
        {quotation.status === 'expired' && <p className="mt-3 text-sm text-bad font-semibold">Quotation expired — maximum 2 negotiation rounds reached without agreement.</p>}
      </div>
    </div>
  )
}

function QuotationDetailPage({ id }: { id: string }) {
  const { s } = useStore()
  const quotation = s.quotations.find((q) => q.id === id)
  if (!quotation) return <div><BackButton to="/sales/quotation" label="Quotation" /><Empty title="Quotation not found">The requested quotation does not exist.</Empty></div>
  return (
    <div>
      <BackButton to="/sales/quotation" label="Quotation" />
      <div className="mb-6 flex items-center gap-3"><FileText className="size-8 text-accent" /><h1 className="text-2xl font-bold text-ink">{quotation.quotationNo}</h1><Badge t={quotationTone[quotation.status]}>{quotation.status}</Badge></div>
      <div className="space-y-5">
        <div className={section}>
          <div className={sectionTitle}>Quotation Details</div>
          <dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2 text-[15px]">
            <div><dt className="text-xs text-ink-2">Customer</dt><dd className="font-semibold">{quotation.customerName}</dd></div>
            <div><dt className="text-xs text-ink-2">Route</dt><dd>{quotation.origin} → {quotation.destination}</dd></div>
            <div><dt className="text-xs text-ink-2">Cargo</dt><dd>{quotation.cargoType} · {quotation.cargoTonnage.toLocaleString()} MT</dd></div>
            <div><dt className="text-xs text-ink-2">Total Amount</dt><dd className="font-bold">{idr(quotation.totalAmount)}</dd></div>
            <div><dt className="text-xs text-ink-2">Valid Until</dt><dd>{fmtDate(quotation.validUntil)}</dd></div>
            <div><dt className="text-xs text-ink-2">RFQ Ref</dt><dd>{s.rfqs.find((x) => x.id === quotation.rfqId)?.rfqNo ?? '—'}</dd></div>
          </dl>
        </div>
        <div className={section}>
          <div className={sectionTitle}>Items</div>
          <div className="p-4">
            <div className="overflow-x-auto rounded border border-line">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-line bg-surface-2"><th className="px-3 py-2 text-left font-medium">Description</th><th className="px-3 py-2 text-right font-medium">Qty</th><th className="px-3 py-2 text-left font-medium">Unit</th><th className="px-3 py-2 text-right font-medium">Unit Price</th><th className="px-3 py-2 text-right font-medium">Amount</th></tr></thead>
                <tbody>{quotation.items.map((it, i) => (<tr key={i} className="border-t border-line"><td className="px-3 py-2">{it.description}</td><td className="px-3 py-2 text-right">{it.qty.toLocaleString()}</td><td className="px-3 py-2">{it.unit}</td><td className="px-3 py-2 text-right">{idr(it.unitPrice)}</td><td className="px-3 py-2 text-right font-semibold">{idr(it.amount)}</td></tr>))}</tbody>
                <tfoot><tr className="border-t-2 border-ink bg-surface-2"><td colSpan={4} className="px-3 py-2 font-bold text-right">Total</td><td className="px-3 py-2 text-right font-bold">{idr(quotation.totalAmount)}</td></tr></tfoot>
              </table>
            </div>
          </div>
        </div>
        <NegotiationPanel quotation={quotation} />
      </div>
    </div>
  )
}

function QuotationCreatePage() {
  const { s, addQuotation } = useStore()
  const nav = useNavigate()
  const [rfqId, setRfqId] = useState('')
  const rfq = s.rfqs.find((r) => r.id === rfqId)
  const handleCreate = () => { if (!rfq) return; addQuotation({ rfqId: rfq.id, customerName: rfq.customerName, origin: rfq.origin, destination: rfq.destination, cargoType: rfq.cargoType, cargoTonnage: rfq.cargoTonnage, items: [{ description: 'Freight charge', unit: 'MT', qty: rfq.cargoTonnage, unitPrice: 0, amount: 0 }], totalAmount: 0, validUntil: '' }); nav('/sales/quotation') }
  return (
    <div>
      <BackButton to="/sales/quotation" label="Quotation" />
      <div className="mb-6 flex items-center gap-3"><FileText className="size-8 text-accent" /><h1 className="text-2xl font-bold text-ink">New Quotation</h1></div>
      <div className="max-w-2xl space-y-5">
        <div className={section}><div className={sectionTitle}>Select RFQ</div><div className="p-4 space-y-4">
          <Field label="Select RFQ *"><Select value={rfqId} onChange={(e) => setRfqId(e.target.value)}><option value="">-- Select RFQ --</option>{s.rfqs.map((r) => <option key={r.id} value={r.id}>{r.rfqNo} — {r.customerName}</option>)}</Select></Field>
          {rfq && <div className="rounded border border-line p-3 text-sm"><p><strong>Route:</strong> {rfq.origin} → {rfq.destination}</p><p><strong>Cargo:</strong> {rfq.cargoType} · {rfq.cargoTonnage.toLocaleString()} MT</p></div>}
        </div></div>
        <div className="flex gap-2"><Button variant="secondary" onClick={() => nav('/sales/quotation')}>Cancel</Button><Button disabled={!rfqId} onClick={handleCreate}>Create Quotation</Button></div>
      </div>
    </div>
  )
}

function QuotationPage() {
  const { s } = useStore()
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const rows = useMemo(() => { const term = q.toLowerCase(); return s.quotations.filter((r) => { if (statusFilter !== 'all' && r.status !== statusFilter) return false; return !term || r.quotationNo.toLowerCase().includes(term) || r.customerName.toLowerCase().includes(term) }) }, [s.quotations, q, statusFilter])
  const cols: Col<Quotation>[] = [
    { key: 'no', header: 'Quotation No', cell: (r) => <span className="font-semibold text-accent">{r.quotationNo}</span>, mobile: 'title' },
    { key: 'rfq', header: 'RFQ Ref', cell: (r) => s.rfqs.find((x) => x.id === r.rfqId)?.rfqNo ?? '—' },
    { key: 'customer', header: 'Customer', cell: (r) => r.customerName },
    { key: 'route', header: 'Route', cell: (r) => `${r.origin} → ${r.destination}` },
    { key: 'amount', header: 'Total', cell: (r) => idr(r.totalAmount), className: 'text-right' },
    { key: 'status', header: 'Status', cell: (r) => <Badge t={quotationTone[r.status]}>{r.status}</Badge> },
  ]
  return (
    <div>
      <PageHeader title="Quotation" lead="Create and manage quotations with negotiation workflow" actions={<Link to="/sales/quotation/create"><Button><Plus className="size-4" /> New Quotation</Button></Link>} />
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Search quotation..." />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
          <option value="all">All Status</option><option value="draft">Draft</option><option value="negotiation">Negotiation</option><option value="approved">Approved</option><option value="expired">Expired</option>
        </Select>
      </Toolbar>
      <Table rows={rows} cols={cols} rowKey={(r) => r.id} onRow={(r) => nav(`/sales/quotation/${r.id}`)} />
    </div>
  )
}

// ---------- PO (detailed form) ----------
const SHIPMENT_TYPES = ['Transshipments', 'Direct Loading', 'Floating Crane']
const PAYMENT_TERMS_OPTIONS = [
  '25% when SPAL Signed, 50% when start to sailing and 25% before berthing at destination',
  '50% advance, 50% upon completion', '100% upon loading completion', '30% advance, 40% on sailing, 30% on discharge',
]

function POCreatePage() {
  const { s, addPO } = useStore()
  const nav = useNavigate()
  const approved = s.quotations.filter((q) => q.status === 'approved')
  const [quoId, setQuoId] = useState('')
  const quo = approved.find((q) => q.id === quoId)
  const [f, setF] = useState({
    deliveryDate: '', paymentTerms: PAYMENT_TERMS_OPTIONS[0], shipmentType: 'Transshipments',
    portOfLoading: '', portOfDischarge: '', specialInstructions: '', notes: '',
  })
  const up = (k: string, v: any) => setF((prev) => ({ ...prev, [k]: v }))
  const handleCreate = () => {
    if (!quo) return
    addPO({
      quotationId: quo.id, quotationNo: quo.quotationNo, customerName: quo.customerName,
      customerContact: '', origin: quo.origin, destination: quo.destination,
      cargoType: quo.cargoType, cargoTonnage: quo.cargoTonnage, totalAmount: quo.totalAmount,
      poDate: TODAY, deliveryDate: f.deliveryDate, paymentTerms: f.paymentTerms,
      shipmentType: f.shipmentType, portOfLoading: f.portOfLoading, portOfDischarge: f.portOfDischarge,
      specialInstructions: f.specialInstructions, status: 'draft', notes: f.notes,
    })
    nav('/sales/po')
  }
  return (
    <div>
      <BackButton to="/sales/po" label="Purchase Order" />
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3"><ClipboardList className="size-8 text-accent" /><h1 className="text-2xl font-bold text-ink">New Purchase Order</h1></div>
        <div className="flex gap-2"><Button variant="secondary" onClick={() => nav('/sales/po')}>Cancel</Button><Button disabled={!quoId || !f.deliveryDate} onClick={handleCreate}>Create PO</Button></div>
      </div>
      <div className="space-y-5">
        <div className={section}><div className={sectionTitle}>1. Quotation Reference</div><div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Select Quotation (Approved) *"><Select value={quoId} onChange={(e) => setQuoId(e.target.value)}><option value="">-- Select Quotation --</option>{approved.map((q) => <option key={q.id} value={q.id}>{q.quotationNo} — {q.customerName} — {idr(q.totalAmount)}</option>)}</Select></Field>
          {quo && <div className="rounded border border-line p-3 text-sm"><p><strong>Customer:</strong> {quo.customerName}</p><p><strong>Route:</strong> {quo.origin} → {quo.destination}</p><p><strong>Cargo:</strong> {quo.cargoType} · {quo.cargoTonnage.toLocaleString()} MT</p><p><strong>Total:</strong> {idr(quo.totalAmount)}</p></div>}
        </div></div>
        <div className={section}><div className={sectionTitle}>2. Shipment Details</div><div className="grid gap-4 p-4 sm:grid-cols-3">
          <Field label="Shipment Type *"><Select value={f.shipmentType} onChange={(e) => up('shipmentType', e.target.value)}>{SHIPMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
          <Field label="Port of Loading *"><Input value={f.portOfLoading} onChange={(e) => up('portOfLoading', e.target.value)} placeholder="e.g. Banjarmasin" /></Field>
          <Field label="Port of Discharge *"><Input value={f.portOfDischarge} onChange={(e) => up('portOfDischarge', e.target.value)} placeholder="e.g. Cilegon" /></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>3. Delivery & Payment</div><div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Delivery Date *"><Input type="date" value={f.deliveryDate} onChange={(e) => up('deliveryDate', e.target.value)} /></Field>
          <Field label="Payment Terms *"><Select value={f.paymentTerms} onChange={(e) => up('paymentTerms', e.target.value)}>{PAYMENT_TERMS_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>4. Additional Information</div><div className="p-4 space-y-4">
          <Field label="Special Instructions"><Textarea value={f.specialInstructions} onChange={(e) => up('specialInstructions', e.target.value)} placeholder="Loading instructions, safety requirements..." /></Field>
          <Field label="Notes"><Textarea value={f.notes} onChange={(e) => up('notes', e.target.value)} placeholder="Additional notes..." /></Field>
        </div></div>
      </div>
    </div>
  )
}

function PODetailPage({ id }: { id: string }) {
  const { s, updatePO } = useStore()
  const nav = useNavigate()
  const po = s.purchaseOrders.find((p) => p.id === id)
  const statusTone: Record<string, Tone> = { draft: 'neutral', confirmed: 'accent', completed: 'ok', cancelled: 'bad' }
  if (!po) return <div><BackButton to="/sales/po" label="Purchase Order" /><Empty title="PO not found">The requested PO does not exist.</Empty></div>
  return (
    <div>
      <BackButton to="/sales/po" label="Purchase Order" />
      <div className="mb-6 flex items-center gap-3"><ClipboardList className="size-8 text-accent" /><h1 className="text-2xl font-bold text-ink">{po.poNo}</h1><Badge t={statusTone[po.status]}>{po.status}</Badge></div>
      <div className="space-y-5">
        <div className={section}><div className={sectionTitle}>1. Quotation Reference</div><dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-3 text-[15px]">
          <div><dt className="text-xs text-ink-2">PO Number</dt><dd className="font-semibold">{po.poNo}</dd></div>
          <div><dt className="text-xs text-ink-2">Quotation Ref</dt><dd>{po.quotationNo}</dd></div>
          <div><dt className="text-xs text-ink-2">PO Date</dt><dd>{fmtDate(po.poDate)}</dd></div>
          <div><dt className="text-xs text-ink-2">Customer</dt><dd className="font-semibold">{po.customerName}</dd></div>
          <div><dt className="text-xs text-ink-2">Route</dt><dd>{po.origin} → {po.destination}</dd></div>
          <div><dt className="text-xs text-ink-2">Total Amount</dt><dd className="font-bold">{idr(po.totalAmount)}</dd></div>
        </dl></div>
        <div className={section}><div className={sectionTitle}>2. Shipment Details</div><dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-3 text-[15px]">
          <div><dt className="text-xs text-ink-2">Cargo</dt><dd>{po.cargoType} · {po.cargoTonnage.toLocaleString()} MT</dd></div>
          <div><dt className="text-xs text-ink-2">Shipment Type</dt><dd>{po.shipmentType}</dd></div>
          <div><dt className="text-xs text-ink-2">Port of Loading</dt><dd>{po.portOfLoading}</dd></div>
          <div><dt className="text-xs text-ink-2">Port of Discharge</dt><dd>{po.portOfDischarge}</dd></div>
        </dl></div>
        <div className={section}><div className={sectionTitle}>3. Delivery & Payment</div><dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2 text-[15px]">
          <div><dt className="text-xs text-ink-2">Delivery Date</dt><dd>{fmtDate(po.deliveryDate)}</dd></div>
          <div><dt className="text-xs text-ink-2">Payment Terms</dt><dd>{po.paymentTerms}</dd></div>
        </dl></div>
        {po.specialInstructions && <div className={section}><div className={sectionTitle}>4. Special Instructions</div><div className="p-4 text-[15px]">{po.specialInstructions}</div></div>}
        <div className="flex gap-2">
          {po.status === 'draft' && <Button onClick={() => { updatePO(po.id, { status: 'confirmed' }); nav('/sales/po') }}>Confirm PO</Button>}
          {po.status === 'confirmed' && <Button onClick={() => { updatePO(po.id, { status: 'completed' }); nav('/sales/po') }}>Mark Completed</Button>}
        </div>
      </div>
    </div>
  )
}

function POPage() {
  const { s } = useStore()
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const statusTone: Record<string, Tone> = { draft: 'neutral', confirmed: 'accent', completed: 'ok', cancelled: 'bad' }
  const rows = useMemo(() => { const term = q.toLowerCase(); return s.purchaseOrders.filter((p) => !term || p.poNo.toLowerCase().includes(term) || p.customerName.toLowerCase().includes(term)) }, [s.purchaseOrders, q])
  const cols: Col<PurchaseOrder>[] = [
    { key: 'no', header: 'PO No', cell: (r) => <span className="font-semibold text-accent">{r.poNo}</span>, mobile: 'title' },
    { key: 'quo', header: 'Quotation Ref', cell: (r) => r.quotationNo },
    { key: 'customer', header: 'Customer', cell: (r) => r.customerName },
    { key: 'amount', header: 'Total', cell: (r) => idr(r.totalAmount), className: 'text-right' },
    { key: 'date', header: 'PO Date', cell: (r) => fmtDate(r.poDate) },
    { key: 'status', header: 'Status', cell: (r) => <Badge t={statusTone[r.status]}>{r.status}</Badge> },
  ]
  return (
    <div>
      <PageHeader title="Purchase Order" lead="PO linked to approved quotations" actions={<Link to="/sales/po/create"><Button><Plus className="size-4" /> New PO</Button></Link>} />
      <Toolbar><SearchBox value={q} onChange={setQ} placeholder="Search PO..." /></Toolbar>
      <Table rows={rows} cols={cols} rowKey={(r) => r.id} onRow={(r) => nav(`/sales/po/${r.id}`)} />
    </div>
  )
}

// ---------- SO (only from approved quotation, price agreed) ----------
function SOCreatePage() {
  const { s, addSO } = useStore()
  const nav = useNavigate()
  const confirmed = s.purchaseOrders.filter((p) => p.status === 'confirmed' || p.status === 'completed')
  const [f, setF] = useState({
    poId: '', salesName: '', shipmentType: 'Transshipments',
    laycanStart: '', laycanEnd: '', portOfLoading: '', portOfDischarge: '',
    freeTime: 5, freeTimeUnit: 'Days', cargoWeight: 7500, cargoWeightUnit: 'MT', dwt: 10000, dwtUnit: 'MT',
    freightPrice: 450000000, freightCurrency: 'IDR', freightBasis: 'Per Voyage',
    paymentTerms: PAYMENT_TERMS_OPTIONS[0],
    customerPic: '', customerPicPhone: '', customerPicEmail: '', customerPicPosition: '', remarks: '',
  })
  const po = confirmed.find((p) => p.id === f.poId)
  const up = (k: string, v: any) => setF((prev) => ({ ...prev, [k]: v }))
  const handleSubmit = (status: 'draft' | 'active') => {
    if (!po) return
    addSO({ poId: po.id, poNo: po.poNo, customerName: po.customerName, salesName: f.salesName, shipmentType: f.shipmentType, laycanStart: f.laycanStart, laycanEnd: f.laycanEnd, portOfLoading: f.portOfLoading, portOfDischarge: f.portOfDischarge, freeTime: f.freeTime, freeTimeUnit: f.freeTimeUnit, cargoType: po.cargoType, cargoWeight: f.cargoWeight, cargoWeightUnit: f.cargoWeightUnit, dwt: f.dwt, dwtUnit: f.dwtUnit, freightPrice: f.freightPrice, freightCurrency: f.freightCurrency, freightBasis: f.freightBasis, paymentTerms: f.paymentTerms, customerPic: f.customerPic, customerPicPhone: f.customerPicPhone, customerPicEmail: f.customerPicEmail, customerPicPosition: f.customerPicPosition, remarks: f.remarks, origin: po.origin, destination: po.destination, totalAmount: f.freightPrice, soDate: TODAY, status, vesselAssigned: null })
    nav('/sales/so')
  }
  return (
    <div>
      <BackButton to="/sales/so" label="Sales Order" />
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3"><Handshake className="size-8 text-accent" /><h1 className="text-2xl font-bold text-ink">New Sales Order</h1></div>
        <div className="flex gap-2"><Button variant="secondary" onClick={() => nav('/sales/so')}>Cancel</Button><Button variant="secondary" onClick={() => handleSubmit('draft')}>Save Draft</Button><Button onClick={() => handleSubmit('active')}>Submit for Approval</Button></div>
      </div>
      <div className="space-y-5">
        <div className={section}><div className={sectionTitle}>1. Basic Information</div><div className="grid gap-4 p-4 sm:grid-cols-3">
          <Field label="SO Number *"><Input value="(Auto-generated)" disabled /></Field>
          <Field label="SO Date *"><Input type="date" value={TODAY} disabled /></Field>
          <Field label="Sales Name *"><Select value={f.salesName} onChange={(e) => up('salesName', e.target.value)}><option value="">-- Select --</option>{s.users.filter((u) => u.roles.includes('sales')).map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}{s.users.filter((u) => u.roles.includes('superadmin' as any)).map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}</Select></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>2. Customer & Parties</div><div className="grid gap-4 p-4 sm:grid-cols-3">
          <Field label="Select PO *"><Select value={f.poId} onChange={(e) => up('poId', e.target.value)}><option value="">-- Select PO --</option>{confirmed.map((p) => <option key={p.id} value={p.id}>{p.poNo} — {p.customerName}</option>)}</Select></Field>
          <Field label="Customer Name *"><Input value={po?.customerName ?? ''} disabled /></Field>
          <Field label="Cargo Type *"><Input value={po?.cargoType ?? ''} disabled /></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>3. Shipment Details</div><div className="grid gap-4 p-4 sm:grid-cols-3">
          <Field label="Shipment Type *"><Select value={f.shipmentType} onChange={(e) => up('shipmentType', e.target.value)}>{SHIPMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
          <Field label="Laycan Date *"><div className="flex items-center gap-2"><Input type="date" value={f.laycanStart} onChange={(e) => up('laycanStart', e.target.value)} /><span className="text-sm text-ink-2">to</span><Input type="date" value={f.laycanEnd} onChange={(e) => up('laycanEnd', e.target.value)} /></div></Field>
          <Field label="Port Of Loading *"><Input value={f.portOfLoading} onChange={(e) => up('portOfLoading', e.target.value)} placeholder="e.g. Banjarmasin" /></Field>
          <Field label="Port Of Discharge *"><Input value={f.portOfDischarge} onChange={(e) => up('portOfDischarge', e.target.value)} placeholder="e.g. Cilegon" /></Field>
          <Field label="Free Time *"><div className="flex gap-2"><Input type="number" value={f.freeTime} onChange={(e) => up('freeTime', Number(e.target.value))} className="w-24" /><Select value={f.freeTimeUnit} onChange={(e) => up('freeTimeUnit', e.target.value)} className="w-auto"><option value="Days">Days</option><option value="Hours">Hours</option></Select></div></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>4. Cargo & Vessel</div><div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Cargo Weight *"><div className="flex gap-2"><Input type="number" value={f.cargoWeight} onChange={(e) => up('cargoWeight', Number(e.target.value))} /><Select value={f.cargoWeightUnit} onChange={(e) => up('cargoWeightUnit', e.target.value)} className="w-20"><option value="MT">MT</option></Select></div></Field>
          <Field label="Dead Weight (DWT) *"><div className="flex gap-2"><Input type="number" value={f.dwt} onChange={(e) => up('dwt', Number(e.target.value))} /><Select value={f.dwtUnit} onChange={(e) => up('dwtUnit', e.target.value)} className="w-20"><option value="MT">MT</option></Select></div></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>5. Commercial & Payment</div><div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Freight Price *"><div className="flex gap-2"><Input type="number" value={f.freightPrice} onChange={(e) => up('freightPrice', Number(e.target.value))} /><Select value={f.freightCurrency} onChange={(e) => up('freightCurrency', e.target.value)} className="w-20"><option value="IDR">IDR</option><option value="USD">USD</option></Select><Select value={f.freightBasis} onChange={(e) => up('freightBasis', e.target.value)} className="w-auto"><option value="Per Voyage">Per Voyage</option><option value="Per MT">Per MT</option></Select></div></Field>
          <Field label="Payment Terms *"><Select value={f.paymentTerms} onChange={(e) => up('paymentTerms', e.target.value)}>{PAYMENT_TERMS_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>6. Customer&apos;s PIC</div><div className="grid gap-4 p-4 sm:grid-cols-4">
          <Field label="Customer's PIC *"><Input value={f.customerPic} onChange={(e) => up('customerPic', e.target.value)} placeholder="Budi Santoso" /></Field>
          <Field label="Phone Number"><Input value={f.customerPicPhone} onChange={(e) => up('customerPicPhone', e.target.value)} placeholder="0812 3456 7890" /></Field>
          <Field label="Email"><Input value={f.customerPicEmail} onChange={(e) => up('customerPicEmail', e.target.value)} placeholder="email@company.co.id" /></Field>
          <Field label="Position"><Input value={f.customerPicPosition} onChange={(e) => up('customerPicPosition', e.target.value)} placeholder="Logistics Manager" /></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>7. Additional Information</div><div className="p-4">
          <Field label="Remarks"><Textarea value={f.remarks} onChange={(e) => up('remarks', e.target.value)} placeholder="Additional notes..." maxLength={500} /></Field>
          {f.remarks && <div className="mt-1 text-right text-xs text-ink-2">{f.remarks.length}/500</div>}
        </div></div>
      </div>
    </div>
  )
}

function SODetailPage({ id }: { id: string }) {
  const { s, updateSO } = useStore()
  const nav = useNavigate()
  const so = s.salesOrders.find((so) => so.id === id)
  const statusTone: Record<string, Tone> = { draft: 'neutral', active: 'accent', completed: 'ok', cancelled: 'bad' }
  if (!so) return <div><BackButton to="/sales/so" label="Sales Order" /><Empty title="SO not found">The requested SO does not exist.</Empty></div>
  return (
    <div>
      <BackButton to="/sales/so" label="Sales Order" />
      <div className="mb-6 flex items-center gap-3"><Handshake className="size-8 text-accent" /><h1 className="text-2xl font-bold text-ink">{so.soNo}</h1><Badge t={statusTone[so.status]}>{so.status}</Badge></div>
      <div className="space-y-5">
        <div className={section}><div className={sectionTitle}>1. Basic Information</div><dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-3 text-[15px]"><div><dt className="text-xs text-ink-2">SO Number</dt><dd className="font-semibold">{so.soNo}</dd></div><div><dt className="text-xs text-ink-2">SO Date</dt><dd>{fmtDate(so.soDate)}</dd></div><div><dt className="text-xs text-ink-2">Sales Name</dt><dd>{so.salesName}</dd></div></dl></div>
        <div className={section}><div className={sectionTitle}>2. Customer & Parties</div><dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-3 text-[15px]"><div><dt className="text-xs text-ink-2">PO Ref</dt><dd className="font-semibold">{so.poNo}</dd></div><div><dt className="text-xs text-ink-2">Customer</dt><dd className="font-semibold">{so.customerName}</dd></div><div><dt className="text-xs text-ink-2">Cargo Type</dt><dd>{so.cargoType}</dd></div></dl></div>
        <div className={section}><div className={sectionTitle}>3. Shipment Details</div><dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-3 text-[15px]"><div><dt className="text-xs text-ink-2">Shipment Type</dt><dd>{so.shipmentType}</dd></div><div><dt className="text-xs text-ink-2">Laycan</dt><dd>{fmtDate(so.laycanStart)} — {fmtDate(so.laycanEnd)}</dd></div><div><dt className="text-xs text-ink-2">Port of Loading</dt><dd>{so.portOfLoading}</dd></div><div><dt className="text-xs text-ink-2">Port of Discharge</dt><dd>{so.portOfDischarge}</dd></div><div><dt className="text-xs text-ink-2">Free Time</dt><dd>{so.freeTime} {so.freeTimeUnit}</dd></div></dl></div>
        <div className={section}><div className={sectionTitle}>4. Cargo & Vessel</div><dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2 text-[15px]"><div><dt className="text-xs text-ink-2">Cargo Weight</dt><dd>{so.cargoWeight.toLocaleString()} {so.cargoWeightUnit}</dd></div><div><dt className="text-xs text-ink-2">DWT</dt><dd>{so.dwt.toLocaleString()} {so.dwtUnit}</dd></div></dl></div>
        <div className={section}><div className={sectionTitle}>5. Commercial & Payment</div><dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2 text-[15px]"><div><dt className="text-xs text-ink-2">Freight Price</dt><dd className="font-bold">{idr(so.freightPrice)} {so.freightCurrency} {so.freightBasis}</dd></div><div><dt className="text-xs text-ink-2">Payment Terms</dt><dd>{so.paymentTerms}</dd></div></dl></div>
        {so.customerPic && <div className={section}><div className={sectionTitle}>6. Customer&apos;s PIC</div><dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-4 text-[15px]"><div><dt className="text-xs text-ink-2">Name</dt><dd className="font-semibold">{so.customerPic}</dd></div><div><dt className="text-xs text-ink-2">Phone</dt><dd>{so.customerPicPhone}</dd></div><div><dt className="text-xs text-ink-2">Email</dt><dd>{so.customerPicEmail}</dd></div><div><dt className="text-xs text-ink-2">Position</dt><dd>{so.customerPicPosition}</dd></div></dl></div>}
        {so.remarks && <div className={section}><div className={sectionTitle}>7. Additional Information</div><div className="p-4 text-[15px]">{so.remarks}</div></div>}
        <div className="flex gap-2">
          {so.status === 'draft' && <Button onClick={() => { updateSO(so.id, { status: 'active' }); nav('/sales/so') }}>Activate SO</Button>}
          {so.status === 'active' && <Button onClick={() => { updateSO(so.id, { status: 'completed' }); nav('/sales/so') }}>Mark Completed</Button>}
        </div>
      </div>
    </div>
  )
}

function SOPage() {
  const { s } = useStore()
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const statusTone: Record<string, Tone> = { draft: 'neutral', active: 'accent', completed: 'ok', cancelled: 'bad' }
  const rows = useMemo(() => { const term = q.toLowerCase(); return s.salesOrders.filter((so) => !term || so.soNo.toLowerCase().includes(term) || so.customerName.toLowerCase().includes(term)) }, [s.salesOrders, q])
  const cols: Col<SalesOrder>[] = [
    { key: 'no', header: 'SO No', cell: (r) => <span className="font-semibold text-accent">{r.soNo}</span>, mobile: 'title' },
    { key: 'po', header: 'PO Ref', cell: (r) => r.poNo },
    { key: 'customer', header: 'Customer', cell: (r) => r.customerName },
    { key: 'route', header: 'Route', cell: (r) => `${r.portOfLoading || r.origin} → ${r.portOfDischarge || r.destination}` },
    { key: 'amount', header: 'Freight', cell: (r) => idr(r.freightPrice), className: 'text-right' },
    { key: 'date', header: 'SO Date', cell: (r) => fmtDate(r.soDate) },
    { key: 'status', header: 'Status', cell: (r) => <Badge t={statusTone[r.status]}>{r.status}</Badge> },
  ]
  return (
    <div>
      <PageHeader title="Sales Order" lead="SO created after quotation price is agreed by both parties" actions={<Link to="/sales/so/create"><Button><Plus className="size-4" /> New Sales Order</Button></Link>} />
      <Toolbar><SearchBox value={q} onChange={setQ} placeholder="Search SO..." /></Toolbar>
      <Table rows={rows} cols={cols} rowKey={(r) => r.id} onRow={(r) => nav(`/sales/so/${r.id}`)} />
    </div>
  )
}

// ---------- Commercial Sheet (CRUD + auto-calc — matching screenshot layout) ----------
const th = 'px-2 py-1.5 text-left font-bold text-[12px] bg-accent/10'
const thR = 'px-2 py-1.5 text-right font-bold text-[12px] bg-accent/10'
const td_ = 'px-2 py-1 text-[12px]'
const tdR = 'px-2 py-1 text-right text-[12px]'
const tdRB = 'px-2 py-1 text-right text-[12px] font-bold'

function CSCreatePage() {
  const { s, addCommercialSheet } = useStore()
  const nav = useNavigate()
  const [soId, setSoId] = useState('')
  const so = s.salesOrders.find((x) => x.id === soId)
  const [f, setF] = useState({
    voyageNo: '', vesselTB: 'TB Taboneo', barge: 'BG-001',
    cargoType: 'Coal', cargoWeight: 7500,
    riverDistance: 50, seaDistance: 550,
    mainEnginePower: 2000, mainEngineConsumption: 120, particularEngineConsumption: 25,
    seaSpeedLoaded: 3, seaSpeedBallast: 4, riverSpeedLoaded: 2, riverSpeedBallast: 3,
    fuelPricePerLiter: 22000, contingencyPercent: 5,
    op1Desc: 'Keagenan Kapal – Origin', op1Amt: 15000000, op1Remarks: 'Agency at Sungai Danau',
    op2Desc: 'Keagenan Kapal – Destination', op2Amt: 15000000, op2Remarks: 'Agency at Cilegon',
    op3Desc: 'Perjalanan Crew & Logistik', op3Amt: 10000000, op3Remarks: 'Makanan & logistik 10 orang',
    op4Desc: 'Insentif Crew', op4Amt: 25000000, op4Remarks: 'Crew incentive',
    notes: '',
  })
  const up = (k: string, v: any) => setF((prev) => ({ ...prev, [k]: v }))

  const totalDist = f.riverDistance + f.seaDistance
  const totalCons = f.mainEngineConsumption + f.particularEngineConsumption

  // Voyage calculation
  const loadedRiverH = f.riverSpeedLoaded > 0 ? f.riverDistance / f.riverSpeedLoaded : 0
  const loadedSeaH = f.seaSpeedLoaded > 0 ? f.seaDistance / f.seaSpeedLoaded : 0
  const ballastRiverH = f.riverSpeedBallast > 0 ? f.riverDistance / f.riverSpeedBallast : 0
  const ballastSeaH = f.seaSpeedBallast > 0 ? f.seaDistance / f.seaSpeedBallast : 0
  const totalLoadedH = loadedRiverH + loadedSeaH
  const totalBallastH = ballastRiverH + ballastSeaH

  // Fuel consumption per engine per leg
  const meLoadedH = totalLoadedH
  const meLoadedL = Math.round(meLoadedH * f.mainEngineConsumption)
  const meBallastH = totalBallastH
  const meBallastL = Math.round(meBallastH * f.mainEngineConsumption)
  const meTotalL = meLoadedL + meBallastL
  const meTotalCost = meTotalL * f.fuelPricePerLiter

  const peLoadedH = totalLoadedH
  const peLoadedL = Math.round(peLoadedH * f.particularEngineConsumption)
  const peBallastH = totalBallastH
  const peBallastL = Math.round(peBallastH * f.particularEngineConsumption)
  const peTotalL = peLoadedL + peBallastL
  const peTotalCost = peTotalL * f.fuelPricePerLiter

  const totalFuelL = meTotalL + peTotalL
  const totalFuelCost = meTotalCost + peTotalCost

  const opCosts = [
    { description: f.op1Desc, unit: 'LS', qty: 1, rate: f.op1Amt, amount: f.op1Amt, remarks: f.op1Remarks },
    { description: f.op2Desc, unit: 'LS', qty: 1, rate: f.op2Amt, amount: f.op2Amt, remarks: f.op2Remarks },
    { description: f.op3Desc, unit: 'LS', qty: 1, rate: f.op3Amt, amount: f.op3Amt, remarks: f.op3Remarks },
    { description: f.op4Desc, unit: 'LS', qty: 1, rate: f.op4Amt, amount: f.op4Amt, remarks: f.op4Remarks },
  ]
  const opTotal = opCosts.reduce((s, c) => s + c.amount, 0)
  const contingencyAmt = Math.round((totalFuelCost + opTotal) * f.contingencyPercent / 100)
  const totalOpCost = totalFuelCost + opTotal + contingencyAmt
  const revenue = so?.freightPrice ?? 0
  const profit = revenue - totalOpCost
  const profitPercent = revenue > 0 ? +(profit / revenue * 100).toFixed(1) : 0
  const opCostPctRevenue = revenue > 0 ? +(totalOpCost / revenue * 100).toFixed(1) : 0
  const revenuePct = 100

  const origin = so?.origin ?? 'Jetty Sungai Danau'
  const destination = so?.destination ?? 'Cilegon'
  const laycanStart = so?.laycanStart ?? ''
  const laycanEnd = so?.laycanEnd ?? ''

  const handleSave = () => {
    if (!so) return
    addCommercialSheet({
      refSoId: so.id, refSoNo: so.soNo, voyageNo: f.voyageNo, vesselTB: f.vesselTB, barge: f.barge,
      cargoType: so.cargoType, cargoWeight: so.cargoWeight, origin: so.origin, destination: so.destination,
      riverDistance: f.riverDistance, seaDistance: f.seaDistance, totalDistance: totalDist,
      laycanStart: so.laycanStart, laycanEnd: so.laycanEnd,
      mainEnginePower: f.mainEnginePower, mainEngineConsumption: f.mainEngineConsumption,
      particularEngineConsumption: f.particularEngineConsumption, totalConsumption: totalCons,
      seaSpeedLoaded: f.seaSpeedLoaded, seaSpeedBallast: f.seaSpeedBallast,
      riverSpeedLoaded: f.riverSpeedLoaded, riverSpeedBallast: f.riverSpeedBallast,
      fuelPricePerLiter: f.fuelPricePerLiter, contingencyPercent: f.contingencyPercent,
      operatingCosts: opCosts, totalOperatingCost: totalOpCost,
      revenueRate: revenue, totalRevenue: revenue, profit, profitPercent, notes: f.notes,
    })
    nav('/sales/commercial-sheet')
  }

  const ni = (val: number, k: string) => <input type="number" value={val} onChange={(e) => up(k, Number(e.target.value))} className="h-7 w-full rounded border border-line bg-surface px-1 text-right text-[12px] focus:border-accent outline-none" />
  const ns = (val: number, k: string, step = 1) => <input type="number" step={step} value={val} onChange={(e) => up(k, Number(e.target.value))} className="h-7 w-20 rounded border border-line bg-surface px-1 text-right text-[12px] focus:border-accent outline-none" />
  const fmt2 = (n: number) => n.toFixed(2)

  return (
    <div>
      <BackButton to="/sales/commercial-sheet" label="Commercial Sheet" />
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3"><FileSpreadsheet className="size-8 text-accent" /><h1 className="text-2xl font-bold text-ink">New Commercial Sheet</h1></div>
        <div className="flex gap-2"><Button variant="secondary" onClick={() => nav('/sales/commercial-sheet')}>Cancel</Button><Button disabled={!soId} onClick={handleSave}>Save</Button></div>
      </div>

      <div className="space-y-3">
        {/* 1. Voyage Information */}
        <div className={section}><div className={sectionTitle}>1. Voyage Information</div>
          <div className="grid gap-2 p-3 sm:grid-cols-6">
            <Field label="Ref. Sales Order *"><Select value={soId} onChange={(e) => setSoId(e.target.value)} className="text-[12px] h-8"><option value="">-- Select SO --</option>{s.salesOrders.map((so) => <option key={so.id} value={so.id}>{so.soNo}</option>)}</Select></Field>
            <Field label="Voyage No. *"><Input value={f.voyageNo} onChange={(e) => up('voyageNo', e.target.value)} placeholder="VYG-2026-045" className="text-[12px] h-8" /></Field>
            <Field label="Vessel (TB) *"><Input value={f.vesselTB} onChange={(e) => up('vesselTB', e.target.value)} className="text-[12px] h-8" /></Field>
            <Field label="Barge"><Input value={f.barge} onChange={(e) => up('barge', e.target.value)} className="text-[12px] h-8" /></Field>
            <Field label="Cargo Type *"><Select value={f.cargoType} onChange={(e) => up('cargoType', e.target.value)} className="text-[12px] h-8"><option>Coal</option><option>Nickel Ore</option><option>Iron Sand</option></Select></Field>
            <Field label="Cargo Weight (MT) *">{ni(f.cargoWeight, 'cargoWeight')}</Field>
          </div>
          <div className="grid gap-2 px-3 pb-3 sm:grid-cols-6">
            <Field label="Origin"><Input value={origin} disabled className="text-[12px] h-8 bg-surface-2" /></Field>
            <Field label="Destination"><Input value={destination} disabled className="text-[12px] h-8 bg-surface-2" /></Field>
            <Field label="River Distance (NM) *">{ni(f.riverDistance, 'riverDistance')}</Field>
            <Field label="Sea Distance (NM) *">{ni(f.seaDistance, 'seaDistance')}</Field>
            <Field label="Total Distance (NM)"><div className="h-7 flex items-center rounded bg-surface-2 px-2 text-[12px] font-bold border border-line">{totalDist}</div></Field>
            <Field label="Laycan Date"><div className="h-7 flex items-center rounded bg-surface-2 px-2 text-[11px] border border-line">{laycanStart && laycanEnd ? `${fmtDate(laycanStart)} – ${fmtDate(laycanEnd)}` : '—'}</div></Field>
          </div>
        </div>

        {/* 2 + 3 + 4 side by side */}
        <div className="grid gap-3 lg:grid-cols-3">
          <div className={section}><div className={sectionTitle}>2. Vessel Parameters ({f.vesselTB})</div>
            <div className="p-3">
              <table className="w-full text-[12px]"><tbody>
                <tr><td className="py-1">Main Engine (HP)</td><td className="py-1 text-right">{ni(f.mainEnginePower, 'mainEnginePower')}</td></tr>
                <tr><td className="py-1">Main Engine Cons. (L/hour)</td><td className="py-1 text-right">{ni(f.mainEngineConsumption, 'mainEngineConsumption')}</td></tr>
                <tr><td className="py-1">Particular Engine Cons. (L/hour)</td><td className="py-1 text-right">{ni(f.particularEngineConsumption, 'particularEngineConsumption')}</td></tr>
              </tbody></table>
              <div className="mt-2 flex justify-between rounded bg-accent/10 px-2 py-1 text-[12px] font-bold"><span>Total Cons. (L/hour)</span><span>{totalCons}</span></div>
            </div>
          </div>
          <div className={section}><div className={sectionTitle}>3. Sailing Speed (Knot)</div>
            <div className="p-3">
              <table className="w-full text-[12px]"><thead><tr className="border-b border-line"><th></th><th className="py-1 text-right font-bold">Loaded</th><th className="py-1 text-right font-bold">Ballast</th></tr></thead>
              <tbody>
                <tr><td className="py-1.5">Sea Speed (knot)</td><td className="py-1.5 text-right">{ns(f.seaSpeedLoaded, 'seaSpeedLoaded', 0.5)}</td><td className="py-1.5 text-right">{ns(f.seaSpeedBallast, 'seaSpeedBallast', 0.5)}</td></tr>
                <tr><td className="py-1.5">River Speed (knot)</td><td className="py-1.5 text-right">{ns(f.riverSpeedLoaded, 'riverSpeedLoaded', 0.5)}</td><td className="py-1.5 text-right">{ns(f.riverSpeedBallast, 'riverSpeedBallast', 0.5)}</td></tr>
              </tbody></table>
            </div>
          </div>
          <div className={section}><div className={sectionTitle}>4. Fuel Price & Other Assumptions</div>
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between text-[12px]"><span>Solar Price (IDR/Liter) *</span>{ni(f.fuelPricePerLiter, 'fuelPricePerLiter')}</div>
              <div className="flex items-center justify-between text-[12px]"><span>Contingency (%)</span><div className="flex items-center gap-1">{ns(f.contingencyPercent, 'contingencyPercent')}<span>%</span></div></div>
            </div>
          </div>
        </div>

        {/* 5. Voyage Calculation */}
        <div className={section}><div className={sectionTitle}>5. Voyage Calculation</div>
          <div className="p-3 overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr><th rowSpan={2} className={cx(th, 'border border-line')}>Segment</th><th colSpan={3} className={cx(th, 'text-center border border-line')}>Loaded (With Cargo)</th><th colSpan={3} className={cx(th, 'text-center border border-line')}>Ballast (Empty)</th></tr>
                <tr><th className={cx(thR, 'border border-line')}>Distance (NM)</th><th className={cx(thR, 'border border-line')}>Speed (Knot)</th><th className={cx(thR, 'border border-line')}>Sailing Hours</th><th className={cx(thR, 'border border-line')}>Distance (NM)</th><th className={cx(thR, 'border border-line')}>Speed (Knot)</th><th className={cx(thR, 'border border-line')}>Sailing Hours</th></tr>
              </thead>
              <tbody>
                <tr><td className={cx(td_, 'border border-line')}>River ({origin} → Muara)</td><td className={cx(tdR, 'border border-line')}>{f.riverDistance}</td><td className={cx(tdR, 'border border-line')}>{f.riverSpeedLoaded}</td><td className={cx(tdRB, 'border border-line')}>{fmt2(loadedRiverH)}</td><td className={cx(tdR, 'border border-line')}>{f.riverDistance}</td><td className={cx(tdR, 'border border-line')}>{f.riverSpeedBallast}</td><td className={cx(tdRB, 'border border-line')}>{fmt2(ballastRiverH)}</td></tr>
                <tr><td className={cx(td_, 'border border-line')}>Sea (Muara → {destination})</td><td className={cx(tdR, 'border border-line')}>{f.seaDistance}</td><td className={cx(tdR, 'border border-line')}>{f.seaSpeedLoaded}</td><td className={cx(tdRB, 'border border-line')}>{fmt2(loadedSeaH)}</td><td className={cx(tdR, 'border border-line')}>{f.seaDistance}</td><td className={cx(tdR, 'border border-line')}>{f.seaSpeedBallast}</td><td className={cx(tdRB, 'border border-line')}>{fmt2(ballastSeaH)}</td></tr>
                <tr className="bg-accent/10 font-bold"><td className={cx(td_, 'border border-line font-bold')}>Total</td><td className={cx(tdRB, 'border border-line')}>{totalDist}</td><td className={cx(tdR, 'border border-line')}>—</td><td className={cx(tdRB, 'border border-line')}>{fmt2(totalLoadedH)}</td><td className={cx(tdRB, 'border border-line')}>{totalDist}</td><td className={cx(tdR, 'border border-line')}>—</td><td className={cx(tdRB, 'border border-line')}>{fmt2(totalBallastH)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. Fuel Consumption Calculation */}
        <div className={section}><div className={sectionTitle}>6. Fuel Consumption Calculation</div>
          <div className="p-3 overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr><th rowSpan={2} className={cx(th, 'border border-line')}>Item</th><th colSpan={3} className={cx(th, 'text-center border border-line')}>Loaded (With Cargo)</th><th colSpan={3} className={cx(th, 'text-center border border-line')}>Ballast (Empty)</th><th colSpan={2} className={cx(th, 'text-center border border-line')}>Total Voyage</th></tr>
                <tr><th className={cx(thR, 'border border-line')}>Hours</th><th className={cx(thR, 'border border-line')}>Cons. (L/hour)</th><th className={cx(thR, 'border border-line')}>Total (Liter)</th><th className={cx(thR, 'border border-line')}>Hours</th><th className={cx(thR, 'border border-line')}>Cons. (L/hour)</th><th className={cx(thR, 'border border-line')}>Total (Liter)</th><th className={cx(thR, 'border border-line')}>Total (Liter)</th><th className={cx(thR, 'border border-line')}>Cost (IDR)</th></tr>
              </thead>
              <tbody>
                <tr><td className={cx(td_, 'border border-line')}>Main Engine</td><td className={cx(tdR, 'border border-line')}>{fmt2(meLoadedH)}</td><td className={cx(tdR, 'border border-line')}>{f.mainEngineConsumption}</td><td className={cx(tdRB, 'border border-line')}>{meLoadedL.toLocaleString()}</td><td className={cx(tdR, 'border border-line')}>{fmt2(meBallastH)}</td><td className={cx(tdR, 'border border-line')}>{f.mainEngineConsumption}</td><td className={cx(tdRB, 'border border-line')}>{meBallastL.toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{meTotalL.toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{meTotalCost.toLocaleString()}</td></tr>
                <tr><td className={cx(td_, 'border border-line')}>Particular Engine</td><td className={cx(tdR, 'border border-line')}>{fmt2(peLoadedH)}</td><td className={cx(tdR, 'border border-line')}>{f.particularEngineConsumption}</td><td className={cx(tdRB, 'border border-line')}>{peLoadedL.toLocaleString()}</td><td className={cx(tdR, 'border border-line')}>{fmt2(peBallastH)}</td><td className={cx(tdR, 'border border-line')}>{f.particularEngineConsumption}</td><td className={cx(tdRB, 'border border-line')}>{peBallastL.toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{peTotalL.toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{peTotalCost.toLocaleString()}</td></tr>
                <tr className="bg-accent/10 font-bold"><td className={cx(td_, 'border border-line font-bold')}>Total Fuel</td><td className={cx(tdRB, 'border border-line')}>{fmt2(totalLoadedH)}</td><td className={cx(tdR, 'border border-line')}>—</td><td className={cx(tdRB, 'border border-line')}>{(meLoadedL + peLoadedL).toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{fmt2(totalBallastH)}</td><td className={cx(tdR, 'border border-line')}>—</td><td className={cx(tdRB, 'border border-line')}>{(meBallastL + peBallastL).toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{totalFuelL.toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{totalFuelCost.toLocaleString()}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 7. Other Operating Cost */}
        <div className={section}><div className={sectionTitle}>7. Other Operating Cost</div>
          <div className="p-3 overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead><tr><th className={cx(th, 'border border-line w-10')}>No.</th><th className={cx(th, 'border border-line')}>Description</th><th className={cx(th, 'border border-line w-14')}>Unit</th><th className={cx(thR, 'border border-line w-16')}>Quantity</th><th className={cx(thR, 'border border-line')}>Rate (IDR)</th><th className={cx(thR, 'border border-line')}>Amount (IDR)</th><th className={cx(th, 'border border-line')}>Remarks</th></tr></thead>
              <tbody>
                {[1, 2, 3, 4].map((i) => {
                  const desc = (f as any)[`op${i}Desc`]
                  const amt = (f as any)[`op${i}Amt`]
                  const rmk = (f as any)[`op${i}Remarks`]
                  return (
                    <tr key={i}>
                      <td className={cx(td_, 'border border-line text-center')}>{i}</td>
                      <td className={cx(td_, 'border border-line')}><input value={desc} onChange={(e) => up(`op${i}Desc`, e.target.value)} className="h-6 w-full rounded border border-line px-1 text-[12px] outline-none focus:border-accent" /></td>
                      <td className={cx(td_, 'border border-line text-center')}>LS</td>
                      <td className={cx(tdR, 'border border-line')}>1</td>
                      <td className={cx(tdR, 'border border-line')}><input type="number" value={amt} onChange={(e) => up(`op${i}Amt`, Number(e.target.value))} className="h-6 w-full rounded border border-line px-1 text-right text-[12px] outline-none focus:border-accent" /></td>
                      <td className={cx(tdRB, 'border border-line')}>{amt.toLocaleString()}</td>
                      <td className={cx(td_, 'border border-line')}><input value={rmk} onChange={(e) => up(`op${i}Remarks`, e.target.value)} className="h-6 w-full rounded border border-line px-1 text-[12px] outline-none focus:border-accent" /></td>
                    </tr>
                  )
                })}
                <tr className="bg-accent/10 font-bold"><td colSpan={5} className={cx(td_, 'border border-line font-bold text-right')}>Total Other Operating Cost</td><td className={cx(tdRB, 'border border-line')}>{opTotal.toLocaleString()}</td><td className="border border-line"></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 8 + 9 + 10 layout: cost summary (wider) + revenue & PnL (narrower) */}
        <div className="grid gap-3 lg:grid-cols-5">
          <div className={cx(section, 'lg:col-span-3')}><div className={sectionTitle}>8. Cost Summary per Voyage</div>
            <div className="p-3">
              <table className="w-full border-collapse text-[12px]">
                <thead><tr><th className={cx(th, 'border border-line w-10')}>No.</th><th className={cx(th, 'border border-line')}>Description</th><th className={cx(thR, 'border border-line')}>Amount (IDR)</th></tr></thead>
                <tbody>
                  <tr><td className={cx(td_, 'border border-line text-center')}>1</td><td className={cx(td_, 'border border-line')}>Fuel Cost (Total)</td><td className={cx(tdRB, 'border border-line')}>{totalFuelCost.toLocaleString()}</td></tr>
                  {opCosts.map((c, i) => <tr key={i}><td className={cx(td_, 'border border-line text-center')}>{i + 2}</td><td className={cx(td_, 'border border-line')}>{c.description}</td><td className={cx(tdR, 'border border-line')}>{c.amount.toLocaleString()}</td></tr>)}
                  <tr><td className={cx(td_, 'border border-line text-center')}>{opCosts.length + 2}</td><td className={cx(td_, 'border border-line')}>Contingency ({f.contingencyPercent}%)</td><td className={cx(tdR, 'border border-line')}>{contingencyAmt.toLocaleString()}</td></tr>
                  <tr className="bg-accent/10 font-bold"><td colSpan={2} className={cx(td_, 'border border-line font-bold text-right')}>Total Operating Cost (A)</td><td className={cx(tdRB, 'border border-line')}>{totalOpCost.toLocaleString()}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-3">
            <div className={section}><div className={sectionTitle}>9. Revenue / Freight</div>
              <div className="p-3">
                <table className="w-full border-collapse text-[12px]">
                  <thead><tr><th className={cx(th, 'border border-line')}>Description</th><th className={cx(thR, 'border border-line w-10')}>Qty</th><th className={cx(thR, 'border border-line')}>Rate (IDR)</th><th className={cx(thR, 'border border-line')}>Amount (IDR)</th></tr></thead>
                  <tbody>
                    <tr><td className={cx(td_, 'border border-line')}>Freight Tug + Barge (per voyage)</td><td className={cx(tdR, 'border border-line')}>1</td><td className={cx(tdR, 'border border-line')}>{revenue.toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{revenue.toLocaleString()}</td></tr>
                    <tr className="bg-accent/10 font-bold"><td colSpan={3} className={cx(td_, 'border border-line font-bold text-right')}>Total Revenue (B)</td><td className={cx(tdRB, 'border border-line')}>{revenue.toLocaleString()}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className={section}><div className={sectionTitle}>10. Profit & Loss per Voyage</div>
              <div className="p-3">
                <table className="w-full border-collapse text-[12px]">
                  <thead><tr><th className={cx(th, 'border border-line')}>Description</th><th className={cx(thR, 'border border-line')}>Amount (IDR)</th><th className={cx(thR, 'border border-line')}>% of Revenue</th></tr></thead>
                  <tbody>
                    <tr><td className={cx(td_, 'border border-line')}>Total Operating Cost (A)</td><td className={cx(tdR, 'border border-line')}>{totalOpCost.toLocaleString()}</td><td className={cx(tdR, 'border border-line')}>{opCostPctRevenue}%</td></tr>
                    <tr><td className={cx(td_, 'border border-line')}>Total Revenue (B)</td><td className={cx(tdR, 'border border-line')}>{revenue.toLocaleString()}</td><td className={cx(tdR, 'border border-line')}>{revenuePct}%</td></tr>
                    <tr className={cx('font-bold', profit >= 0 ? 'bg-ok/10 text-ok' : 'bg-bad/10 text-bad')}><td className={cx(td_, 'border border-line font-bold')}>Profit / (Loss) (B - A)</td><td className={cx(tdRB, 'border border-line')}>{profit.toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{profitPercent}%</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 11. Notes */}
        <div className={section}><div className={sectionTitle}>11. Notes</div>
          <div className="p-3">
            <Textarea value={f.notes} onChange={(e) => up('notes', e.target.value)} placeholder={`Perhitungan berdasarkan spesifikasi ${f.vesselTB}:\n- Main Engine ${f.mainEnginePower} HP (${f.mainEngineConsumption} L/hour)\n- Particular Engine ${f.particularEngineConsumption} L/hour\n- Kecepatan sea loaded ${f.seaSpeedLoaded} knot, ballast ${f.seaSpeedBallast} knot\n- Kecepatan sungai 1 knot lebih lambat dari sea\n- Jarak: Sungai ${f.riverDistance} NM, Laut ${f.seaDistance} NM (total ${totalDist} NM satu arah)`} className="text-[12px]" />
          </div>
        </div>
      </div>
    </div>
  )
}

function CSDetailPage({ id }: { id: string }) {
  const { s, deleteCommercialSheet } = useStore()
  const nav = useNavigate()
  const cs = s.commercialSheets.find((c) => c.id === id)
  if (!cs) return <div><BackButton to="/sales/commercial-sheet" label="Commercial Sheet" /><Empty title="CS not found">The requested commercial sheet does not exist.</Empty></div>

  const loadedRiverH = cs.riverSpeedLoaded > 0 ? cs.riverDistance / cs.riverSpeedLoaded : 0
  const loadedSeaH = cs.seaSpeedLoaded > 0 ? cs.seaDistance / cs.seaSpeedLoaded : 0
  const ballastRiverH = cs.riverSpeedBallast > 0 ? cs.riverDistance / cs.riverSpeedBallast : 0
  const ballastSeaH = cs.seaSpeedBallast > 0 ? cs.seaDistance / cs.seaSpeedBallast : 0
  const totalLoadedH = loadedRiverH + loadedSeaH
  const totalBallastH = ballastRiverH + ballastSeaH

  const meLoadedL = Math.round(totalLoadedH * cs.mainEngineConsumption)
  const meBallastL = Math.round(totalBallastH * cs.mainEngineConsumption)
  const meTotalL = meLoadedL + meBallastL
  const meTotalCost = meTotalL * cs.fuelPricePerLiter
  const peLoadedL = Math.round(totalLoadedH * cs.particularEngineConsumption)
  const peBallastL = Math.round(totalBallastH * cs.particularEngineConsumption)
  const peTotalL = peLoadedL + peBallastL
  const peTotalCost = peTotalL * cs.fuelPricePerLiter
  const totalFuelL = meTotalL + peTotalL
  const totalFuelCost = meTotalCost + peTotalCost
  const opTotal = cs.operatingCosts.reduce((s, c) => s + c.amount, 0)
  const contingencyAmt = Math.round((totalFuelCost + opTotal) * cs.contingencyPercent / 100)
  const opCostPctRevenue = cs.totalRevenue > 0 ? +(cs.totalOperatingCost / cs.totalRevenue * 100).toFixed(1) : 0
  const fmt2 = (n: number) => n.toFixed(2)

  return (
    <div>
      <BackButton to="/sales/commercial-sheet" label="Commercial Sheet" />
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3"><FileSpreadsheet className="size-8 text-accent" /><h1 className="text-2xl font-bold text-ink">{cs.csNo}</h1></div>
        <Button variant="danger" onClick={() => { deleteCommercialSheet(cs.id); nav('/sales/commercial-sheet') }}><Trash2 className="size-4" /> Delete</Button>
      </div>
      <div className="space-y-3 text-[12px]">
        {/* 1. Voyage Information */}
        <div className={section}><div className={sectionTitle}>1. Voyage Information</div>
          <div className="grid gap-2 p-3 sm:grid-cols-6">
            <div><span className="text-ink-2">Ref SO</span><div className="font-bold">{cs.refSoNo}</div></div>
            <div><span className="text-ink-2">Voyage No</span><div className="font-bold">{cs.voyageNo}</div></div>
            <div><span className="text-ink-2">Vessel (TB)</span><div className="font-bold">{cs.vesselTB}</div></div>
            <div><span className="text-ink-2">Barge</span><div className="font-bold">{cs.barge}</div></div>
            <div><span className="text-ink-2">Cargo Type</span><div>{cs.cargoType}</div></div>
            <div><span className="text-ink-2">Weight (MT)</span><div className="font-bold">{cs.cargoWeight.toLocaleString()}</div></div>
          </div>
          <div className="grid gap-2 px-3 pb-3 sm:grid-cols-6">
            <div><span className="text-ink-2">Origin</span><div>{cs.origin}</div></div>
            <div><span className="text-ink-2">Destination</span><div>{cs.destination}</div></div>
            <div><span className="text-ink-2">River</span><div>{cs.riverDistance} NM</div></div>
            <div><span className="text-ink-2">Sea</span><div>{cs.seaDistance} NM</div></div>
            <div><span className="text-ink-2">Total</span><div className="font-bold">{cs.totalDistance} NM</div></div>
            <div><span className="text-ink-2">Laycan</span><div>{fmtDate(cs.laycanStart)} – {fmtDate(cs.laycanEnd)}</div></div>
          </div>
        </div>

        {/* 2 + 3 + 4 */}
        <div className="grid gap-3 lg:grid-cols-3">
          <div className={section}><div className={sectionTitle}>2. Vessel Parameters ({cs.vesselTB})</div>
            <div className="p-3 space-y-1">
              <div className="flex justify-between"><span>Main Engine (HP)</span><span className="font-bold">{cs.mainEnginePower.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Main Engine Cons. (L/hour)</span><span className="font-bold">{cs.mainEngineConsumption}</span></div>
              <div className="flex justify-between"><span>Particular Engine Cons. (L/hour)</span><span className="font-bold">{cs.particularEngineConsumption}</span></div>
              <div className="flex justify-between border-t border-line pt-1 font-bold"><span>Total Cons. (L/hour)</span><span>{cs.totalConsumption}</span></div>
            </div>
          </div>
          <div className={section}><div className={sectionTitle}>3. Sailing Speed (Knot)</div>
            <div className="p-3">
              <table className="w-full"><thead><tr className="border-b border-line"><th></th><th className="py-1 text-right font-bold">Loaded</th><th className="py-1 text-right font-bold">Ballast</th></tr></thead>
              <tbody>
                <tr><td className="py-1">Sea Speed</td><td className="py-1 text-right font-bold">{cs.seaSpeedLoaded}</td><td className="py-1 text-right font-bold">{cs.seaSpeedBallast}</td></tr>
                <tr><td className="py-1">River Speed</td><td className="py-1 text-right font-bold">{cs.riverSpeedLoaded}</td><td className="py-1 text-right font-bold">{cs.riverSpeedBallast}</td></tr>
              </tbody></table>
            </div>
          </div>
          <div className={section}><div className={sectionTitle}>4. Fuel Price & Other Assumptions</div>
            <div className="p-3 space-y-1">
              <div className="flex justify-between"><span>Solar Price (IDR/Liter)</span><span className="font-bold">{cs.fuelPricePerLiter.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Contingency</span><span className="font-bold">{cs.contingencyPercent}%</span></div>
            </div>
          </div>
        </div>

        {/* 5. Voyage Calculation */}
        <div className={section}><div className={sectionTitle}>5. Voyage Calculation</div>
          <div className="p-3 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr><th rowSpan={2} className={cx(th, 'border border-line')}>Segment</th><th colSpan={3} className={cx(th, 'text-center border border-line')}>Loaded (With Cargo)</th><th colSpan={3} className={cx(th, 'text-center border border-line')}>Ballast (Empty)</th></tr>
                <tr><th className={cx(thR, 'border border-line')}>Distance (NM)</th><th className={cx(thR, 'border border-line')}>Speed (Knot)</th><th className={cx(thR, 'border border-line')}>Sailing Hours</th><th className={cx(thR, 'border border-line')}>Distance (NM)</th><th className={cx(thR, 'border border-line')}>Speed (Knot)</th><th className={cx(thR, 'border border-line')}>Sailing Hours</th></tr>
              </thead>
              <tbody>
                <tr><td className={cx(td_, 'border border-line')}>River</td><td className={cx(tdR, 'border border-line')}>{cs.riverDistance}</td><td className={cx(tdR, 'border border-line')}>{cs.riverSpeedLoaded}</td><td className={cx(tdRB, 'border border-line')}>{fmt2(loadedRiverH)}</td><td className={cx(tdR, 'border border-line')}>{cs.riverDistance}</td><td className={cx(tdR, 'border border-line')}>{cs.riverSpeedBallast}</td><td className={cx(tdRB, 'border border-line')}>{fmt2(ballastRiverH)}</td></tr>
                <tr><td className={cx(td_, 'border border-line')}>Sea</td><td className={cx(tdR, 'border border-line')}>{cs.seaDistance}</td><td className={cx(tdR, 'border border-line')}>{cs.seaSpeedLoaded}</td><td className={cx(tdRB, 'border border-line')}>{fmt2(loadedSeaH)}</td><td className={cx(tdR, 'border border-line')}>{cs.seaDistance}</td><td className={cx(tdR, 'border border-line')}>{cs.seaSpeedBallast}</td><td className={cx(tdRB, 'border border-line')}>{fmt2(ballastSeaH)}</td></tr>
                <tr className="bg-accent/10 font-bold"><td className={cx(td_, 'border border-line font-bold')}>Total</td><td className={cx(tdRB, 'border border-line')}>{cs.totalDistance}</td><td className={cx(tdR, 'border border-line')}>—</td><td className={cx(tdRB, 'border border-line')}>{fmt2(totalLoadedH)}</td><td className={cx(tdRB, 'border border-line')}>{cs.totalDistance}</td><td className={cx(tdR, 'border border-line')}>—</td><td className={cx(tdRB, 'border border-line')}>{fmt2(totalBallastH)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. Fuel Consumption Calculation */}
        <div className={section}><div className={sectionTitle}>6. Fuel Consumption Calculation</div>
          <div className="p-3 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr><th rowSpan={2} className={cx(th, 'border border-line')}>Item</th><th colSpan={3} className={cx(th, 'text-center border border-line')}>Loaded</th><th colSpan={3} className={cx(th, 'text-center border border-line')}>Ballast</th><th colSpan={2} className={cx(th, 'text-center border border-line')}>Total Voyage</th></tr>
                <tr><th className={cx(thR, 'border border-line')}>Hours</th><th className={cx(thR, 'border border-line')}>Cons.</th><th className={cx(thR, 'border border-line')}>Total (L)</th><th className={cx(thR, 'border border-line')}>Hours</th><th className={cx(thR, 'border border-line')}>Cons.</th><th className={cx(thR, 'border border-line')}>Total (L)</th><th className={cx(thR, 'border border-line')}>Total (L)</th><th className={cx(thR, 'border border-line')}>Cost (IDR)</th></tr>
              </thead>
              <tbody>
                <tr><td className={cx(td_, 'border border-line')}>Main Engine</td><td className={cx(tdR, 'border border-line')}>{fmt2(totalLoadedH)}</td><td className={cx(tdR, 'border border-line')}>{cs.mainEngineConsumption}</td><td className={cx(tdRB, 'border border-line')}>{meLoadedL.toLocaleString()}</td><td className={cx(tdR, 'border border-line')}>{fmt2(totalBallastH)}</td><td className={cx(tdR, 'border border-line')}>{cs.mainEngineConsumption}</td><td className={cx(tdRB, 'border border-line')}>{meBallastL.toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{meTotalL.toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{meTotalCost.toLocaleString()}</td></tr>
                <tr><td className={cx(td_, 'border border-line')}>Particular Engine</td><td className={cx(tdR, 'border border-line')}>{fmt2(totalLoadedH)}</td><td className={cx(tdR, 'border border-line')}>{cs.particularEngineConsumption}</td><td className={cx(tdRB, 'border border-line')}>{peLoadedL.toLocaleString()}</td><td className={cx(tdR, 'border border-line')}>{fmt2(totalBallastH)}</td><td className={cx(tdR, 'border border-line')}>{cs.particularEngineConsumption}</td><td className={cx(tdRB, 'border border-line')}>{peBallastL.toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{peTotalL.toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{peTotalCost.toLocaleString()}</td></tr>
                <tr className="bg-accent/10 font-bold"><td className={cx(td_, 'border border-line font-bold')}>Total Fuel</td><td className={cx(tdRB, 'border border-line')}>{fmt2(totalLoadedH)}</td><td className={cx(tdR, 'border border-line')}>—</td><td className={cx(tdRB, 'border border-line')}>{(meLoadedL + peLoadedL).toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{fmt2(totalBallastH)}</td><td className={cx(tdR, 'border border-line')}>—</td><td className={cx(tdRB, 'border border-line')}>{(meBallastL + peBallastL).toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{totalFuelL.toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{totalFuelCost.toLocaleString()}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 7. Other Operating Cost */}
        <div className={section}><div className={sectionTitle}>7. Other Operating Cost</div>
          <div className="p-3 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead><tr><th className={cx(th, 'border border-line w-10')}>No.</th><th className={cx(th, 'border border-line')}>Description</th><th className={cx(th, 'border border-line w-14')}>Unit</th><th className={cx(thR, 'border border-line w-16')}>Quantity</th><th className={cx(thR, 'border border-line')}>Rate (IDR)</th><th className={cx(thR, 'border border-line')}>Amount (IDR)</th><th className={cx(th, 'border border-line')}>Remarks</th></tr></thead>
              <tbody>
                {cs.operatingCosts.map((c, i) => <tr key={i}><td className={cx(td_, 'border border-line text-center')}>{i + 1}</td><td className={cx(td_, 'border border-line')}>{c.description}</td><td className={cx(td_, 'border border-line text-center')}>{c.unit}</td><td className={cx(tdR, 'border border-line')}>{c.qty}</td><td className={cx(tdR, 'border border-line')}>{c.rate.toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{c.amount.toLocaleString()}</td><td className={cx(td_, 'border border-line')}>{c.remarks}</td></tr>)}
                <tr className="bg-accent/10 font-bold"><td colSpan={5} className={cx(td_, 'border border-line font-bold text-right')}>Total Other Operating Cost</td><td className={cx(tdRB, 'border border-line')}>{opTotal.toLocaleString()}</td><td className="border border-line"></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 8 + 9 + 10 */}
        <div className="grid gap-3 lg:grid-cols-5">
          <div className={cx(section, 'lg:col-span-3')}><div className={sectionTitle}>8. Cost Summary per Voyage</div>
            <div className="p-3">
              <table className="w-full border-collapse">
                <thead><tr><th className={cx(th, 'border border-line w-10')}>No.</th><th className={cx(th, 'border border-line')}>Description</th><th className={cx(thR, 'border border-line')}>Amount (IDR)</th></tr></thead>
                <tbody>
                  <tr><td className={cx(td_, 'border border-line text-center')}>1</td><td className={cx(td_, 'border border-line')}>Fuel Cost (Total)</td><td className={cx(tdRB, 'border border-line')}>{totalFuelCost.toLocaleString()}</td></tr>
                  {cs.operatingCosts.map((c, i) => <tr key={i}><td className={cx(td_, 'border border-line text-center')}>{i + 2}</td><td className={cx(td_, 'border border-line')}>{c.description}</td><td className={cx(tdR, 'border border-line')}>{c.amount.toLocaleString()}</td></tr>)}
                  <tr><td className={cx(td_, 'border border-line text-center')}>{cs.operatingCosts.length + 2}</td><td className={cx(td_, 'border border-line')}>Contingency ({cs.contingencyPercent}%)</td><td className={cx(tdR, 'border border-line')}>{contingencyAmt.toLocaleString()}</td></tr>
                  <tr className="bg-accent/10 font-bold"><td colSpan={2} className={cx(td_, 'border border-line font-bold text-right')}>Total Operating Cost (A)</td><td className={cx(tdRB, 'border border-line')}>{cs.totalOperatingCost.toLocaleString()}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-3">
            <div className={section}><div className={sectionTitle}>9. Revenue / Freight</div>
              <div className="p-3">
                <table className="w-full border-collapse">
                  <thead><tr><th className={cx(th, 'border border-line')}>Description</th><th className={cx(thR, 'border border-line w-10')}>Qty</th><th className={cx(thR, 'border border-line')}>Rate (IDR)</th><th className={cx(thR, 'border border-line')}>Amount (IDR)</th></tr></thead>
                  <tbody>
                    <tr><td className={cx(td_, 'border border-line')}>Freight Tug + Barge</td><td className={cx(tdR, 'border border-line')}>1</td><td className={cx(tdR, 'border border-line')}>{cs.totalRevenue.toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{cs.totalRevenue.toLocaleString()}</td></tr>
                    <tr className="bg-accent/10 font-bold"><td colSpan={3} className={cx(td_, 'border border-line font-bold text-right')}>Total Revenue (B)</td><td className={cx(tdRB, 'border border-line')}>{cs.totalRevenue.toLocaleString()}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className={section}><div className={sectionTitle}>10. Profit & Loss per Voyage</div>
              <div className="p-3">
                <table className="w-full border-collapse">
                  <thead><tr><th className={cx(th, 'border border-line')}>Description</th><th className={cx(thR, 'border border-line')}>Amount (IDR)</th><th className={cx(thR, 'border border-line')}>% of Revenue</th></tr></thead>
                  <tbody>
                    <tr><td className={cx(td_, 'border border-line')}>Total Operating Cost (A)</td><td className={cx(tdR, 'border border-line')}>{cs.totalOperatingCost.toLocaleString()}</td><td className={cx(tdR, 'border border-line')}>{opCostPctRevenue}%</td></tr>
                    <tr><td className={cx(td_, 'border border-line')}>Total Revenue (B)</td><td className={cx(tdR, 'border border-line')}>{cs.totalRevenue.toLocaleString()}</td><td className={cx(tdR, 'border border-line')}>100.0%</td></tr>
                    <tr className={cx('font-bold', cs.profit >= 0 ? 'bg-ok/10 text-ok' : 'bg-bad/10 text-bad')}><td className={cx(td_, 'border border-line font-bold')}>Profit / (Loss) (B - A)</td><td className={cx(tdRB, 'border border-line')}>{cs.profit.toLocaleString()}</td><td className={cx(tdRB, 'border border-line')}>{cs.profitPercent}%</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {cs.notes && <div className={section}><div className={sectionTitle}>11. Notes</div><pre className="whitespace-pre-wrap p-3 text-[12px] text-ink-2">{cs.notes}</pre></div>}
      </div>
    </div>
  )
}

function CommercialSheetPage() {
  const { s } = useStore()
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const rows = useMemo(() => { const term = q.toLowerCase(); return s.commercialSheets.filter((c) => !term || c.csNo.toLowerCase().includes(term) || c.refSoNo.toLowerCase().includes(term) || c.vesselTB.toLowerCase().includes(term)) }, [s.commercialSheets, q])
  const cols: Col<CommercialSheet>[] = [
    { key: 'no', header: 'CS No', cell: (r) => <span className="font-semibold text-accent">{r.csNo}</span>, mobile: 'title' },
    { key: 'so', header: 'SO Ref', cell: (r) => r.refSoNo },
    { key: 'voyage', header: 'Voyage', cell: (r) => r.voyageNo },
    { key: 'vessel', header: 'Vessel', cell: (r) => `${r.vesselTB} / ${r.barge}` },
    { key: 'route', header: 'Route', cell: (r) => `${r.origin} → ${r.destination}` },
    { key: 'revenue', header: 'Revenue', cell: (r) => idr(r.totalRevenue), className: 'text-right' },
    { key: 'profit', header: 'Profit', cell: (r) => <span className={r.profit >= 0 ? 'text-ok font-bold' : 'text-bad font-bold'}>{idr(r.profit)} ({r.profitPercent}%)</span>, className: 'text-right' },
  ]
  return (
    <div>
      <PageHeader title="Commercial Sheet" lead="Voyage cost calculation and profit/loss analysis" actions={<Link to="/sales/commercial-sheet/create"><Button><Plus className="size-4" /> New Commercial Sheet</Button></Link>} />
      <Toolbar><SearchBox value={q} onChange={setQ} placeholder="Search CS, SO or vessel..." /></Toolbar>
      {rows.length > 0 ? <Table rows={rows} cols={cols} rowKey={(r) => r.id} onRow={(r) => nav(`/sales/commercial-sheet/${r.id}`)} /> : <Empty title="No commercial sheets yet">Commercial sheets are created based on sales orders.</Empty>}
    </div>
  )
}

// ---------- Main Layout ----------
export default function SalesModule() {
  const { pathname } = useLocation()
  const rest = pathname.replace(/^\/sales\/?/, '')
  const segments = rest.split('/')
  const feature = segments[0] || 'dashboard'
  const sub = segments[1] || ''
  const active = NAV.find((n) => n.path === `/sales/${feature}`)?.key ?? 'dashboard'

  let content: JSX.Element
  switch (feature) {
    case 'rfq': content = sub ? <RFQDetailPage id={sub} /> : <RFQPage />; break
    case 'quotation': content = sub === 'create' ? <QuotationCreatePage /> : sub ? <QuotationDetailPage id={sub} /> : <QuotationPage />; break
    case 'po': content = sub === 'create' ? <POCreatePage /> : sub ? <PODetailPage id={sub} /> : <POPage />; break
    case 'so': content = sub === 'create' ? <SOCreatePage /> : sub ? <SODetailPage id={sub} /> : <SOPage />; break
    case 'commercial-sheet': content = sub === 'create' ? <CSCreatePage /> : sub ? <CSDetailPage id={sub} /> : <CommercialSheetPage />; break
    default: content = <SalesDashboard />
  }

  return <ModuleShell active={active}>{content}</ModuleShell>
}
