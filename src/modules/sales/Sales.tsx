import { useState, useMemo, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileSpreadsheet, FileText,
  Handshake, LayoutDashboard, Plus, Check, X as XIcon, MessageSquare, Trash2,
} from 'lucide-react'
import { useStore } from '../../store'
import {
  Badge, Button, cx, Empty, Field, ModuleFooter, Input, PageHeader, Panel, Select,
  SearchBox, Stat, Table, Textarea, Toolbar, type Col, type Tone,
} from '../../components/ui'
import { fmtDate, TODAY } from '../../lib/dates'
import { billingLabel, billingStage, billingSummary, buildBillings } from '../../lib/billing'
import type { CommercialSheet, Quotation, SalesOrder } from '../../data/types'

const idr = (n: number) => `IDR ${new Intl.NumberFormat('en-US').format(n)}`
// A sales order is In progress until every billing term is paid, then Completed.
const soStatusLabel: Record<string, string> = { active: 'In progress', completed: 'Completed', draft: 'In progress', cancelled: 'Cancelled' }
const section = 'rounded border-2 border-accent bg-surface'
const sectionTitle = 'bg-accent px-4 py-2 text-sm font-bold text-white rounded-t'

// ---------- Sidebar ----------
const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/sales/dashboard' },
  { key: 'quotation', label: 'Quotation', icon: FileText, path: '/sales/quotation' },
  { key: 'so', label: 'Sales Order', icon: Handshake, path: '/sales/so' },
  { key: 'commercial-sheet', label: 'Commercial Sheet', icon: FileSpreadsheet, path: '/sales/commercial-sheet' },
] as const

function SidebarContent({ active, onNav, collapsed }: { active: string; onNav?: () => void; collapsed?: boolean }) {
  const { can } = useStore()
  const items = can('sales.read') ? NAV : NAV.filter((n) => n.key === 'quotation')
  return (
    <div className="space-y-0.5">
      {items.map((n) => {
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Stat label="Total Quotation" value={s.quotations.length} to="/sales/quotation" />
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
        <Panel title="SO by Status">
          <dl className="space-y-2">
            {(['active', 'completed'] as const).map((st) => {
              const count = s.salesOrders.filter((so) => so.status === st).length
              if (!count) return null
              return <div key={st} className="flex justify-between text-[15px]"><dt>{soStatusLabel[st]}</dt><dd className="font-bold">{count}</dd></div>
            })}
          </dl>
        </Panel>
      </div>
    </div>
  )
}

// ---------- Quotation ----------
const quotationTone: Record<string, Tone> = { draft: 'neutral', negotiation: 'accent', approved: 'ok', rejected: 'bad', expired: 'bad' }

function NegotiationPanel({ quotation }: { quotation: Quotation }) {
  const { approveNegotiation, rejectNegotiation, customerRespondNegotiation, submitNegotiation, me, can } = useStore()
  const canRespond = can('quotation.respond')
  const canQuote = can('sales.write') || canRespond
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
            {n.approvalStatus === 'approved' && !n.customerResponse && canRespond && (
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
        {canQuote && (canSubmitNew || canNegotiateAgain) && quotation.currentRound < 2 && (
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
  const { s, can, me } = useStore()
  const found = s.quotations.find((q) => q.id === id)
  const quotation = found && (can('sales.read') || visibleToCustomer(found, me.email)) ? found : undefined
  const isCustomer = !can('sales.read')
  if (!quotation) return <div><BackButton to="/sales/quotation" label="Quotation" /><Empty title="Quotation not found">The requested quotation does not exist.</Empty></div>
  const num = (n?: number) => new Intl.NumberFormat('en-US').format(n ?? 0)
  const item = (label: string, value: React.ReactNode, span?: string) => <div className={span}><dt className="text-xs text-ink-2">{label}</dt><dd>{value || '-'}</dd></div>
  const coords = (lat?: string, lng?: string) => lat ? <span className="block text-xs text-ink-2">{lat}, {lng}</span> : null
  const lastPos = (loc?: string, lat?: string, lng?: string) => loc || lat ? <span className="block text-xs text-ink-2">Last position: {loc}{lat && ` (${lat}, ${lng})`}</span> : null
  const dl = (cols: string) => `grid gap-x-6 gap-y-4 p-4 text-[15px] ${cols}`
  const totalsByCurrency = quotation.items.reduce<Record<string, number>>((a, x) => { const c = x.currency ?? quotation.freightCurrency ?? 'IDR'; return { ...a, [c]: (a[c] ?? 0) + x.amount } }, {})
  const th = 'px-3 py-2 font-medium'
  return (
    <div>
      <BackButton to="/sales/quotation" label="Quotation" />
      <div className="mb-6 flex items-center gap-3"><FileText className="size-8 text-accent" /><h1 className="text-2xl font-bold text-ink">{quotation.quotationNo}</h1><Badge t={quotationTone[quotation.status]}>{quotation.status}</Badge></div>
      <div className="space-y-5">
        <div className={section}><div className={sectionTitle}>1. Basic Information</div><dl className={dl('sm:grid-cols-4')}>
          {item('Quotation Number', <span className="font-semibold">{quotation.quotationNo}</span>)}
          {item('Quotation Date', quotation.quotationDate ? fmtDate(quotation.quotationDate) : fmtDate(quotation.createdAt.slice(0, 10)))}
          {item('Sales Name', quotation.salesName)}
          {item('Valid Until', quotation.validUntil ? fmtDate(quotation.validUntil) : '')}
          {item('Total Amount', <span className="font-bold">{quotation.freightCurrency ?? 'IDR'} {num(quotation.totalAmount)}</span>)}
          {item('Negotiation Round', `${quotation.currentRound} of 2`)}
        </dl></div>
        <div className={section}><div className={sectionTitle}>2. Customer & Parties</div><dl className={dl('sm:grid-cols-3')}>
          {item('Customer Name', <span className="font-semibold">{quotation.customerName}</span>)}
          {item('Consignee Name', quotation.consigneeName)}
          {item('Shipper Name', quotation.shipperName)}
          {item('Customer ID', quotation.customerId)}
          {item('Consignee ID', quotation.consigneeId)}
          {item('Shipper ID', quotation.shipperId)}
        </dl></div>
        <div className={section}><div className={sectionTitle}>3. Shipment Details</div><dl className={dl('sm:grid-cols-3')}>
          {item('Shipment Type', quotation.shipmentType)}
          {item('Laycan', quotation.laycanStart ? `${fmtDate(quotation.laycanStart)} — ${fmtDate(quotation.laycanEnd ?? '')}` : '')}
          {item('Free Time', quotation.freeTime != null ? `${quotation.freeTime} ${quotation.freeTimeUnit}` : '')}
          {item('Port of Loading', <>{quotation.portOfLoading || quotation.origin}{coords(quotation.polLat, quotation.polLng)}</>)}
          {item('Port of Discharge', <>{quotation.portOfDischarge || quotation.destination}{coords(quotation.podLat, quotation.podLng)}</>)}
        </dl></div>
        <div className={section}><div className={sectionTitle}>4. Cargo</div><dl className={dl('sm:grid-cols-3')}>
          {item('Cargo Type', quotation.cargoType)}
          {item('Cargo Weight', `${quotation.cargoTonnage.toLocaleString()} MT`)}
          {item('Dead Weight (DWT)', quotation.dwt ? `${quotation.dwt.toLocaleString()} ${quotation.dwtUnit ?? 'MT'}` : '')}
        </dl></div>
        <div className={section}><div className={sectionTitle}>5. Quotation To</div><dl className={dl('sm:grid-cols-3')}>
          {item('Company', quotation.customerName)}
          {item('Company Address', quotation.customerAddress)}
          {item('Attention (PIC)', quotation.customerPic)}
          {item('Position', quotation.customerPicPosition)}
          {item('Phone Number', quotation.customerPicPhone)}
          {item('Email', quotation.customerPicEmail)}
        </dl></div>
        <div className={section}><div className={sectionTitle}>6. Vessel Plan</div><dl className={dl('sm:grid-cols-2')}>
          {item('Tug Boat', <>{quotation.tugBoatName}{lastPos(quotation.tugLastLocation, quotation.tugLastLat, quotation.tugLastLng)}</>)}
          {item('Barge', <>{quotation.bargeName}{lastPos(quotation.bargeLastLocation, quotation.bargeLastLat, quotation.bargeLastLng)}</>)}
        </dl></div>
        <div className={section}><div className={sectionTitle}>7. Pricing</div><div className="p-4">
          <div className="overflow-x-auto rounded border border-line">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-line bg-surface-2"><th className={cx(th, 'text-left')}>Description</th><th className={cx(th, 'text-left')}>Unit</th><th className={cx(th, 'text-left')}>Currency</th><th className={cx(th, 'text-right')}>Qty</th><th className={cx(th, 'text-right')}>Unit Price</th><th className={cx(th, 'text-right')}>Amount</th></tr></thead>
              <tbody>{quotation.items.map((it, i) => { const c = it.currency ?? quotation.freightCurrency ?? 'IDR'; return (<tr key={i} className="border-t border-line"><td className="px-3 py-2">{it.description}</td><td className="px-3 py-2">{it.unit}</td><td className="px-3 py-2">{c}</td><td className="px-3 py-2 text-right">{it.qty.toLocaleString()}</td><td className="px-3 py-2 text-right">{num(it.unitPrice)}</td><td className="px-3 py-2 text-right font-semibold">{num(it.amount)}</td></tr>) })}</tbody>
              <tfoot>{Object.entries(totalsByCurrency).map(([cur, val]) => <tr key={cur} className="border-t-2 border-ink bg-surface-2"><td colSpan={5} className="px-3 py-2 text-right font-bold">Total ({cur})</td><td className="px-3 py-2 text-right font-bold">{cur} {num(val)}</td></tr>)}</tfoot>
            </table>
          </div>
        </div></div>
        <div className={section}><div className={sectionTitle}>8. Commercial Terms</div><dl className={dl('sm:grid-cols-3')}>
          {item('Payment Terms', quotation.paymentTerms, 'sm:col-span-2')}
          {item('Demurrage Rate', quotation.demurrageRate != null ? `${quotation.freightCurrency ?? 'IDR'} ${num(quotation.demurrageRate)} / day` : '')}
        </dl></div>
        <div className={section}><div className={sectionTitle}>9. Terms & Remarks</div><div className="p-4 text-[15px] whitespace-pre-wrap">{quotation.terms || '-'}</div></div>
        <div className={section}><div className={sectionTitle}>10. Customer RFQ Documents</div><div className="space-y-2 p-4">
          {quotation.rfqFiles && quotation.rfqFiles.length > 0 ? quotation.rfqFiles.map((fl) => (
            <div key={fl.id} className="flex items-center gap-3 rounded border border-line p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded bg-accent-soft text-accent"><FileText className="size-4" /></span>
              <div className="min-w-0"><div className="truncate text-[15px] font-semibold text-ink">{fl.name}</div><div className="text-xs text-ink-2">{fl.docType} · {fl.sizeKb.toLocaleString()} KB · {fmtDate(fl.uploadedAt.slice(0, 10))}</div></div>
            </div>
          )) : <div className="rounded border-2 border-dashed border-ink-3 p-4 text-center text-sm text-ink-2">No documents attached.</div>}
        </div></div>
        <NegotiationPanel quotation={quotation} />
        {isCustomer && quotation.status === 'approved' && <p className="rounded border-2 border-ok p-3 text-sm font-semibold text-ok">You accepted this quotation. Sales will continue with your Sales Order.</p>}
      </div>
    </div>
  )
}

const RFQ_DOC_TYPES = ['RFQ Letter / Email', 'Cargo Specification', 'Draft Contract / Charter Party', 'Survey / Quality Certificate', 'Port & Berth Information', 'Other']
const PO_DOC_TYPES = ['Customer PO', 'Contract / Agreement', 'Cargo Specification', 'Other']
const PRICE_UNITS = ['MT', 'Voyage', 'Lot', 'Day', 'Hour', '%']

function QuotationCreatePage() {
  const { s, addQuotation, submitNegotiation, can } = useStore()
  const nav = useNavigate()
  const [f, setF] = useState({
    salesName: '', validUntil: '', customerAddress: '',
    customerName: '', customerId: '', consigneeName: '', consigneeId: '', shipperName: '', shipperId: '',
    shipmentType: 'Transshipments', laycanStart: '', laycanEnd: '', freeTime: 5, freeTimeUnit: 'Days',
    portOfLoading: '', portOfDischarge: '', polLat: '', polLng: '', podLat: '', podLng: '',
    cargoType: 'Coal', cargoTonnage: 7500, dwt: 10000, dwtUnit: 'MT',
    customerPic: '', customerPicPhone: '', customerPicEmail: '', customerPicPosition: '',
    tugBoatId: '', tugLastLocation: '', tugLastLat: '', tugLastLng: '',
    bargeId: '', bargeLastLocation: '', bargeLastLat: '', bargeLastLng: '',
    freightPrice: 0, freightCurrency: 'IDR', freightBasis: 'Per Voyage',
    paymentTerms: PAYMENT_TERMS_OPTIONS[0], demurrageRate: 0, terms: '',
  })
  const newDocRow = () => ({ id: `rfq-up-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, docType: RFQ_DOC_TYPES[0], name: '', sizeKb: 0 })
  const [docRows, setDocRows] = useState([newDocRow()])
  const [rows, setRows] = useState<{ description: string; unit: string; currency: string; qty: number; unitPrice: number }[]>([{ description: 'Freight charge', unit: 'Voyage', currency: 'IDR', qty: 1, unitPrice: 0 }])
  const tugs = s.vessels.filter((v) => v.isActive && v.kind === 'TB')
  const barges = s.vessels.filter((v) => v.isActive && v.kind === 'BG')
  const up = (k: string, v: any) => setF((prev) => ({ ...prev, [k]: v }))
  const quoNoPreview = `QUO-2026-${String(s.quotations.length + 1).padStart(4, '0')}`
  if (!can('sales.write')) return <div><BackButton to="/sales/quotation" label="Quotation" /><Empty title="Sales prepares quotations">Quotations are prepared by the Sales team and sent to the customer.</Empty></div>
  const items = rows.filter((x) => x.description).map((x) => ({ ...x, amount: x.qty * x.unitPrice }))
  const totalsByCurrency = items.reduce<Record<string, number>>((a, x) => ({ ...a, [x.currency]: (a[x.currency] ?? 0) + x.amount }), {})
  const total = totalsByCurrency[rows[0].currency] ?? 0 // negotiated total is in the freight row's currency
  const freightRow = rows[0]
  const setRow = (i: number, k: string, v: any) => setRows((p) => p.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  const valid = !!f.customerName && !!f.portOfLoading && !!f.portOfDischarge && /.+@.+\..+/.test(f.customerPicEmail)
  const handleSave = (send: boolean) => {
    if (!valid) return
    const tug = tugs.find((v) => v.id === f.tugBoatId)
    const barge = barges.find((v) => v.id === f.bargeId)
    const id = addQuotation({
      ...f, origin: f.portOfLoading, destination: f.portOfDischarge,
      freightCurrency: freightRow.currency, freightPrice: freightRow.unitPrice, freightBasis: freightRow.unit === 'MT' ? 'Per MT' : 'Per Voyage',
      rfqFiles: docRows.filter((d) => d.name).map((d) => ({ id: d.id, name: d.name, sizeKb: d.sizeKb, docType: d.docType, uploadedAt: new Date().toISOString().slice(0, 16) })), items, totalAmount: total, quotationDate: TODAY, tugBoatName: tug?.name ?? '', bargeName: barge?.name ?? '',
    })
    if (send) submitNegotiation(id, total)
    nav('/sales/quotation')
  }
  const th = 'px-3 py-2 text-left font-medium'
  const coord = (latK: string, lngK: string, p1: string, p2: string) => (
    <div className="flex gap-2"><Input value={(f as any)[latK]} onChange={(e) => up(latK, e.target.value)} placeholder={p1} /><Input value={(f as any)[lngK]} onChange={(e) => up(lngK, e.target.value)} placeholder={p2} /></div>
  )
  return (
    <div>
      <BackButton to="/sales/quotation" label="Quotation" />
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3"><FileText className="size-8 text-accent" /><h1 className="text-2xl font-bold text-ink">New Quotation</h1></div>
        <div className="flex gap-2"><Button variant="secondary" onClick={() => nav('/sales/quotation')}>Cancel</Button><Button variant="secondary" disabled={!valid} onClick={() => handleSave(false)}>Save Draft</Button><Button disabled={!valid || total <= 0} onClick={() => handleSave(true)}>Submit for Approval</Button></div>
      </div>
      <div className="space-y-5">
        <div className={section}><div className={sectionTitle}>1. Basic Information</div><div className="grid gap-4 p-4 sm:grid-cols-4">
          <Field label="Quotation Number *"><Input value={quoNoPreview} disabled /></Field>
          <Field label="Quotation Date *"><Input type="date" value={TODAY} disabled /></Field>
          <Field label="Sales Name *"><Select value={f.salesName} onChange={(e) => up('salesName', e.target.value)}><option value="">-- Select --</option>{s.users.filter((u) => u.roles.includes('sales') || u.roles.includes('superadmin' as any)).map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}</Select></Field>
          <Field label="Valid Until *"><Input type="date" value={f.validUntil} onChange={(e) => up('validUntil', e.target.value)} /></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>2. Customer & Parties</div><div className="grid gap-4 p-4 sm:grid-cols-3">
          <Field label="Customer Name *"><Input value={f.customerName} onChange={(e) => up('customerName', e.target.value)} placeholder="PT Customer Name" /></Field>
          <Field label="Consignee Name *"><Input value={f.consigneeName} onChange={(e) => up('consigneeName', e.target.value)} placeholder="PT Consignee Name" /></Field>
          <Field label="Shipper Name *"><Input value={f.shipperName} onChange={(e) => up('shipperName', e.target.value)} placeholder="PT Shipper Name" /></Field>
          <Field label="Customer ID *"><Input value={f.customerId} onChange={(e) => up('customerId', e.target.value)} placeholder="NPWP / Company ID" /></Field>
          <Field label="Consignee ID *"><Input value={f.consigneeId} onChange={(e) => up('consigneeId', e.target.value)} placeholder="NPWP / Company ID" /></Field>
          <Field label="Shipper ID *"><Input value={f.shipperId} onChange={(e) => up('shipperId', e.target.value)} placeholder="NPWP / Company ID" /></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>3. Shipment Details</div><div className="grid gap-4 p-4 sm:grid-cols-3">
          <Field label="Shipment Type *"><Select value={f.shipmentType} onChange={(e) => up('shipmentType', e.target.value)}>{SHIPMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
          <Field label="Laycan Date *"><div className="flex items-center gap-2"><Input type="date" value={f.laycanStart} onChange={(e) => up('laycanStart', e.target.value)} /><span className="text-sm text-ink-2">to</span><Input type="date" value={f.laycanEnd} onChange={(e) => up('laycanEnd', e.target.value)} /></div></Field>
          <Field label="Free Time *"><div className="flex gap-2"><Input type="number" value={f.freeTime} onChange={(e) => up('freeTime', Number(e.target.value))} className="w-24" /><Select value={f.freeTimeUnit} onChange={(e) => up('freeTimeUnit', e.target.value)} className="w-auto"><option value="Days">Days</option><option value="Hours">Hours</option></Select></div></Field>
          <Field label="Port Of Loading *"><Input value={f.portOfLoading} onChange={(e) => up('portOfLoading', e.target.value)} placeholder="e.g. Banjarmasin" /></Field>
          <Field label="POL Coordinates (Lat, Lng)">{coord('polLat', 'polLng', '-3.3186', '114.5944')}</Field>
          <div className="hidden sm:block" />
          <Field label="Port Of Discharge *"><Input value={f.portOfDischarge} onChange={(e) => up('portOfDischarge', e.target.value)} placeholder="e.g. Cilegon" /></Field>
          <Field label="POD Coordinates (Lat, Lng)">{coord('podLat', 'podLng', '-6.0167', '106.0500')}</Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>4. Cargo</div><div className="grid gap-4 p-4 sm:grid-cols-3">
          <Field label="Cargo Type *"><Select value={f.cargoType} onChange={(e) => up('cargoType', e.target.value)}><option>Coal</option><option>Nickel Ore</option><option>Iron Sand</option></Select></Field>
          <Field label="Cargo Weight (MT) *"><Input type="number" value={f.cargoTonnage} onChange={(e) => up('cargoTonnage', Number(e.target.value))} /></Field>
          <Field label="Dead Weight (DWT)"><div className="flex gap-2"><Input type="number" value={f.dwt} onChange={(e) => up('dwt', Number(e.target.value))} /><Select value={f.dwtUnit} onChange={(e) => up('dwtUnit', e.target.value)} className="w-20"><option value="MT">MT</option></Select></div></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>5. Quotation To</div><div className="p-4">
          <p className="mb-3 text-sm text-ink-2">The quotation is addressed to this recipient. A customer who signs in with this email sees the quotation in their portal.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Company Name *"><Input value={f.customerName} disabled placeholder="Filled from Customer Name" /></Field>
            <Field label="Company Address"><Input value={f.customerAddress} onChange={(e) => up('customerAddress', e.target.value)} placeholder="Jl. Jenderal Sudirman No. 1, Jakarta" /></Field>
            <Field label="Attention (PIC) *"><Input value={f.customerPic} onChange={(e) => up('customerPic', e.target.value)} placeholder="Budi Santoso" /></Field>
            <Field label="Position"><Input value={f.customerPicPosition} onChange={(e) => up('customerPicPosition', e.target.value)} placeholder="Logistics Manager" /></Field>
            <Field label="Phone Number"><Input value={f.customerPicPhone} onChange={(e) => up('customerPicPhone', e.target.value)} placeholder="0812 3456 7890" /></Field>
            <Field label="Email *"><Input type="email" value={f.customerPicEmail} onChange={(e) => up('customerPicEmail', e.target.value)} placeholder="email@company.co.id" /></Field>
          </div>
        </div></div>
        <div className={section}><div className={sectionTitle}>6. Vessel Plan</div><div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Tug Boat *"><Select value={f.tugBoatId} onChange={(e) => up('tugBoatId', e.target.value)}><option value="">-- Select Tug Boat --</option>{tugs.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select></Field>
          <Field label="Barge *"><Select value={f.bargeId} onChange={(e) => up('bargeId', e.target.value)}><option value="">-- Select Barge --</option>{barges.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select></Field>
          <Field label="Tug Boat Last Location"><Input value={f.tugLastLocation} onChange={(e) => up('tugLastLocation', e.target.value)} placeholder="e.g. Anchorage Muara Berau" /></Field>
          <Field label="Barge Last Location"><Input value={f.bargeLastLocation} onChange={(e) => up('bargeLastLocation', e.target.value)} placeholder="e.g. Anchorage Taboneo" /></Field>
          <Field label="Tug Boat Coordinates (Lat, Lng)">{coord('tugLastLat', 'tugLastLng', '-0.5021', '117.1536')}</Field>
          <Field label="Barge Coordinates (Lat, Lng)">{coord('bargeLastLat', 'bargeLastLng', '-3.4500', '114.6500')}</Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>7. Pricing</div><div className="space-y-4 p-4">
          <div className="overflow-x-auto rounded border border-line">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-line bg-surface-2"><th className={th}>Description</th><th className={th}>Unit</th><th className={th}>Currency</th><th className={cx(th, 'text-right')}>Qty</th><th className={cx(th, 'text-right')}>Unit Price</th><th className={cx(th, 'text-right')}>Amount</th><th className="w-10" /></tr></thead>
              <tbody>
                {rows.map((x, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-2 py-1"><Input value={x.description} onChange={(e) => setRow(i, 'description', e.target.value)} placeholder="e.g. Agency fee" /></td>
                    <td className="px-2 py-1"><Select value={x.unit} onChange={(e) => setRow(i, 'unit', e.target.value)} className="w-28">{PRICE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</Select></td>
                    <td className="px-2 py-1"><Select value={x.currency} onChange={(e) => setRow(i, 'currency', e.target.value)} className="w-24"><option value="IDR">IDR</option><option value="USD">USD</option></Select></td>
                    <td className="px-2 py-1"><Input type="number" value={x.qty} onChange={(e) => setRow(i, 'qty', Number(e.target.value))} className="w-24 text-right" /></td>
                    <td className="px-2 py-1"><Input type="number" value={x.unitPrice} onChange={(e) => setRow(i, 'unitPrice', Number(e.target.value))} className="w-40 text-right" /></td>
                    <td className="px-3 py-2 text-right font-semibold">{x.currency} {new Intl.NumberFormat('en-US').format(x.qty * x.unitPrice)}</td>
                    <td className="px-2">{i > 0 && <button onClick={() => setRows((p) => p.filter((_, j) => j !== i))} className="text-bad" aria-label="Remove"><Trash2 className="size-4" /></button>}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>{Object.entries(totalsByCurrency).map(([cur, val]) => <tr key={cur} className="border-t-2 border-ink bg-surface-2"><td colSpan={5} className="px-3 py-2 text-right font-bold">Total ({cur})</td><td className="px-3 py-2 text-right font-bold">{cur} {new Intl.NumberFormat('en-US').format(val)}</td><td /></tr>)}</tfoot>
            </table>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setRows((p) => [...p, { description: '', unit: 'Lot', currency: rows[0]?.currency ?? 'IDR', qty: 1, unitPrice: 0 }])}><Plus className="size-4" /> Add Row</Button>
        </div></div>
        <div className={section}><div className={sectionTitle}>8. Commercial Terms</div><div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Payment Terms *"><Select value={f.paymentTerms} onChange={(e) => up('paymentTerms', e.target.value)}>{PAYMENT_TERMS_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
          <Field label={`Demurrage Rate (${rows[0].currency} / day)`}><Input type="number" value={f.demurrageRate} onChange={(e) => up('demurrageRate', Number(e.target.value))} /></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>9. Terms & Remarks</div><div className="p-4">
          <Field label="Terms & Conditions / Remarks"><Textarea value={f.terms} onChange={(e) => up('terms', e.target.value)} placeholder="Price excludes port dues, bunker adjustment, insurance..." maxLength={1000} /></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>10. Customer RFQ Documents</div><div className="space-y-3 p-4">
          {docRows.map((d, i) => (
            <div key={d.id} className="flex flex-wrap items-center gap-2">
              <Select value={d.docType} onChange={(e) => setDocRows((p) => p.map((x, j) => (j === i ? { ...x, docType: e.target.value } : x)))} className="w-60">{RFQ_DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select>
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={(e) => { const file = e.target.files?.[0]; setDocRows((p) => p.map((x, j) => (j === i ? { ...x, name: file?.name ?? '', sizeKb: file ? Math.max(1, Math.round(file.size / 1024)) : 0 } : x))) }} className="min-w-0 flex-1 text-sm text-ink file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-bold file:text-white" />
              {docRows.length > 1 && <button onClick={() => setDocRows((p) => p.filter((_, j) => j !== i))} className="text-bad" aria-label="Remove"><Trash2 className="size-4" /></button>}
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => setDocRows((p) => [...p, newDocRow()])}><Plus className="size-4" /> Add Document</Button>
        </div></div>
      </div>
    </div>
  )
}

// A customer only sees quotations linked to their account, and only once Sales has sent them (approved internally).
const visibleToCustomer = (q: Quotation, email: string) =>
  !!q.customerPicEmail && q.customerPicEmail.toLowerCase() === email.toLowerCase() && q.status !== 'draft' && q.negotiations.some((n) => n.approvalStatus === 'approved')

function QuotationPage() {
  const { s, can, me } = useStore()
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const ownOnly = !can('sales.read')
  const rows = useMemo(() => { const term = q.toLowerCase(); return s.quotations.filter((r) => { if (ownOnly && !visibleToCustomer(r, me.email)) return false; if (statusFilter !== 'all' && r.status !== statusFilter) return false; return !term || r.quotationNo.toLowerCase().includes(term) || r.customerName.toLowerCase().includes(term) || (r.consigneeName ?? '').toLowerCase().includes(term) || (r.tugBoatName ?? '').toLowerCase().includes(term) || (r.bargeName ?? '').toLowerCase().includes(term) }) }, [s.quotations, q, statusFilter, ownOnly, me.id])
  const cols: Col<Quotation>[] = [
    { key: 'no', header: 'Quotation No', cell: (r) => <span className="font-semibold text-accent">{r.quotationNo}</span>, mobile: 'title' },
    { key: 'date', header: 'Date', cell: (r) => r.quotationDate ? fmtDate(r.quotationDate) : fmtDate(r.createdAt.slice(0, 10)), mobile: 'hide' },
    { key: 'customer', header: 'Customer', cell: (r) => <div><div>{r.customerName}</div>{r.consigneeName && r.consigneeName !== r.customerName && <div className="text-xs text-ink-2">Consignee: {r.consigneeName}</div>}</div> },
    { key: 'route', header: 'Route', cell: (r) => <div><div>{r.portOfLoading || r.origin} → {r.portOfDischarge || r.destination}</div>{r.shipmentType && <div className="text-xs text-ink-2">{r.shipmentType}</div>}</div> },
    { key: 'cargo', header: 'Cargo', cell: (r) => `${r.cargoType} · ${r.cargoTonnage.toLocaleString()} MT` },
    { key: 'laycan', header: 'Laycan', cell: (r) => r.laycanStart ? `${fmtDate(r.laycanStart)} — ${fmtDate(r.laycanEnd ?? '')}` : '—', mobile: 'hide' },
    { key: 'vessel', header: 'TB / BG', cell: (r) => r.tugBoatName || r.bargeName ? `${r.tugBoatName || '—'} / ${r.bargeName || '—'}` : '—', mobile: 'hide' },
    { key: 'amount', header: 'Total', cell: (r) => `${r.freightCurrency ?? 'IDR'} ${new Intl.NumberFormat('en-US').format(r.totalAmount)}`, className: 'text-right' },
    { key: 'valid', header: 'Valid Until', cell: (r) => r.validUntil ? fmtDate(r.validUntil) : '—', mobile: 'hide' },
    { key: 'sales', header: 'Sales', cell: (r) => r.salesName || '—', mobile: 'hide' },
    { key: 'round', header: 'Round', cell: (r) => `${r.currentRound} / 2`, className: 'text-center', mobile: 'hide' },
    { key: 'docs', header: 'Docs', cell: (r) => r.rfqFiles?.length ? <Badge t="accent">{r.rfqFiles.length} file</Badge> : <span className="text-ink-3">—</span>, mobile: 'hide' },
    { key: 'status', header: 'Status', cell: (r) => <Badge t={quotationTone[r.status]}>{r.status}</Badge> },
  ]
  return (
    <div>
      <PageHeader title="Quotation" lead="Create and manage quotations with negotiation workflow" actions={can('sales.write') ? <Link to="/sales/quotation/create"><Button><Plus className="size-4" /> New Quotation</Button></Link> : undefined} />
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Search quotation, customer, vessel..." />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
          <option value="all">All Status</option><option value="draft">Draft</option><option value="negotiation">Negotiation</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="expired">Expired</option>
        </Select>
      </Toolbar>
      <Table rows={rows} cols={cols} rowKey={(r) => r.id} onRow={(r) => nav(`/sales/quotation/${r.id}`)} />
    </div>
  )
}

// ---------- Shared options ----------
const SHIPMENT_TYPES = ['Transshipments', 'Direct Loading', 'Floating Crane']
const PAYMENT_TERMS_OPTIONS = [
  '25% when SPAL Signed, 50% when start to sailing and 25% before berthing at destination',
  '50% advance, 50% upon completion', '100% upon loading completion', '30% advance, 40% on sailing, 30% on discharge',
]

// ---------- SO (created from the customer's PO) ----------
function SOCreatePage() {
  const { s, addSO } = useStore()
  const nav = useNavigate()
  const [f, setF] = useState({
    poNo: '', customerName: '', cargoType: 'Coal', salesName: '', shipmentType: 'Transshipments',
    laycanStart: '', laycanEnd: '', portOfLoading: '', portOfDischarge: '',
    freeTime: 5, freeTimeUnit: 'Days', cargoWeight: 7500, cargoWeightUnit: 'MT', dwt: 10000, dwtUnit: 'MT',
    freightPrice: 450000000, freightCurrency: 'IDR', freightBasis: 'Per Voyage',
    paymentTerms: PAYMENT_TERMS_OPTIONS[0],
    customerPic: '', customerPicPhone: '', customerPicEmail: '', customerPicPosition: '', remarks: '', customerAddress: '', demurrageRate: 0,
    customerId: '', shipperName: '', shipperId: '', consigneeName: '', consigneeId: '',
    polLat: '', polLng: '', podLat: '', podLng: '',
    tugBoatId: '', tugLastLocation: '', tugLastLat: '', tugLastLng: '',
    bargeId: '', bargeLastLocation: '', bargeLastLat: '', bargeLastLng: '',
  })
  const soNoPreview = `SO-2026-${String(s.salesOrders.length + 1).padStart(4, '0')}`
  const tugs = s.vessels.filter((v) => v.isActive && v.kind === 'TB')
  const barges = s.vessels.filter((v) => v.isActive && v.kind === 'BG')
  const up = (k: string, v: any) => setF((prev) => ({ ...prev, [k]: v }))
  const [charges, setCharges] = useState<{ description: string; unit: string; currency: string; qty: number; unitPrice: number }[]>([])
  const setCharge = (i: number, k: string, v: any) => setCharges((p) => p.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  const newDocRow = () => ({ id: `po-up-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, docType: PO_DOC_TYPES[0], name: '', sizeKb: 0 })
  const [docRows, setDocRows] = useState([newDocRow()])
  const freightAmount = f.freightPrice * (f.freightBasis === 'Per MT' ? f.cargoWeight : 1)
  const soItems = [
    { description: `Freight charge (${f.freightBasis})`, unit: f.freightBasis === 'Per MT' ? 'MT' : 'Voyage', currency: f.freightCurrency, qty: f.freightBasis === 'Per MT' ? f.cargoWeight : 1, unitPrice: f.freightPrice, amount: freightAmount },
    ...charges.filter((x) => x.description).map((x) => ({ ...x, amount: x.qty * x.unitPrice })),
  ]
  const totalsByCurrency = soItems.reduce<Record<string, number>>((a, x) => ({ ...a, [x.currency]: (a[x.currency] ?? 0) + x.amount }), {})
  const total = totalsByCurrency[f.freightCurrency] ?? 0 // order value is in the freight currency
  const handleSubmit = (status: 'draft' | 'active') => {
    if (!f.poNo || !f.customerName) return
    const tug = tugs.find((v) => v.id === f.tugBoatId)
    const barge = barges.find((v) => v.id === f.bargeId)
    addSO({ customerId: f.customerId, shipperName: f.shipperName, shipperId: f.shipperId, consigneeName: f.consigneeName, consigneeId: f.consigneeId, polLat: f.polLat, polLng: f.polLng, podLat: f.podLat, podLng: f.podLng, tugBoatId: f.tugBoatId, tugBoatName: tug?.name ?? '', tugLastLocation: f.tugLastLocation, tugLastLat: f.tugLastLat, tugLastLng: f.tugLastLng, bargeId: f.bargeId, bargeName: barge?.name ?? '', bargeLastLocation: f.bargeLastLocation, bargeLastLat: f.bargeLastLat, bargeLastLng: f.bargeLastLng, poNo: f.poNo, customerName: f.customerName, salesName: f.salesName, shipmentType: f.shipmentType, laycanStart: f.laycanStart, laycanEnd: f.laycanEnd, portOfLoading: f.portOfLoading, portOfDischarge: f.portOfDischarge, freeTime: f.freeTime, freeTimeUnit: f.freeTimeUnit, cargoType: f.cargoType, cargoWeight: f.cargoWeight, cargoWeightUnit: f.cargoWeightUnit, dwt: f.dwt, dwtUnit: f.dwtUnit, freightPrice: f.freightPrice, freightCurrency: f.freightCurrency, freightBasis: f.freightBasis, paymentTerms: f.paymentTerms, customerPic: f.customerPic, customerPicPhone: f.customerPicPhone, customerPicEmail: f.customerPicEmail, customerPicPosition: f.customerPicPosition, remarks: f.remarks, origin: f.portOfLoading, destination: f.portOfDischarge, totalAmount: total, items: soItems, billings: buildBillings(f.paymentTerms, total, f.freightCurrency), customerAddress: f.customerAddress, demurrageRate: f.demurrageRate, poFiles: docRows.filter((d) => d.name).map((d) => ({ id: d.id, name: d.name, sizeKb: d.sizeKb, docType: d.docType, uploadedAt: new Date().toISOString().slice(0, 16) })), soDate: TODAY, status, vesselAssigned: null })
    nav('/sales/so')
  }
  return (
    <div>
      <BackButton to="/sales/so" label="Sales Order" />
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3"><Handshake className="size-8 text-accent" /><h1 className="text-2xl font-bold text-ink">New Sales Order</h1></div>
        <div className="flex gap-2"><Button variant="secondary" onClick={() => nav('/sales/so')}>Cancel</Button><Button onClick={() => handleSubmit('active')}>Submit Sales Order</Button></div>
      </div>
      <div className="space-y-5">
        <div className={section}><div className={sectionTitle}>1. Basic Information</div><div className="grid gap-4 p-4 sm:grid-cols-4">
          <Field label="PO Number *"><Input value={f.poNo} onChange={(e) => up("poNo", e.target.value)} placeholder="Customer PO number" /></Field>
          <Field label="SO Number *"><Input value={soNoPreview} disabled /></Field>
          <Field label="SO Date *"><Input type="date" value={TODAY} disabled /></Field>
          <Field label="Sales Name *"><Select value={f.salesName} onChange={(e) => up('salesName', e.target.value)}><option value="">-- Select --</option>{s.users.filter((u) => u.roles.includes('sales')).map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}{s.users.filter((u) => u.roles.includes('superadmin' as any)).map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}</Select></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>2. Customer & Parties</div><div className="grid gap-4 p-4 sm:grid-cols-3">
          <Field label="Customer Name *"><Input value={f.customerName} onChange={(e) => up("customerName", e.target.value)} placeholder="PT Customer Name" /></Field>
          <Field label="Consignee Name *"><Input value={f.consigneeName} onChange={(e) => up('consigneeName', e.target.value)} placeholder="PT Consignee Name" /></Field>
          <Field label="Shipper Name *"><Input value={f.shipperName} onChange={(e) => up('shipperName', e.target.value)} placeholder="PT Shipper Name" /></Field>
          <Field label="Customer ID *"><Input value={f.customerId} onChange={(e) => up('customerId', e.target.value)} placeholder="NPWP / Company ID" /></Field>
          <Field label="Consignee ID *"><Input value={f.consigneeId} onChange={(e) => up('consigneeId', e.target.value)} placeholder="NPWP / Company ID" /></Field>
          <Field label="Shipper ID *"><Input value={f.shipperId} onChange={(e) => up('shipperId', e.target.value)} placeholder="NPWP / Company ID" /></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>3. Shipment Details</div><div className="grid gap-4 p-4 sm:grid-cols-3">
          <Field label="Shipment Type *"><Select value={f.shipmentType} onChange={(e) => up('shipmentType', e.target.value)}>{SHIPMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
          <Field label="Laycan Date *"><div className="flex items-center gap-2"><Input type="date" value={f.laycanStart} onChange={(e) => up('laycanStart', e.target.value)} /><span className="text-sm text-ink-2">to</span><Input type="date" value={f.laycanEnd} onChange={(e) => up('laycanEnd', e.target.value)} /></div></Field>
          <Field label="Port Of Loading *"><Input value={f.portOfLoading} onChange={(e) => up('portOfLoading', e.target.value)} placeholder="e.g. Banjarmasin" /></Field>
          <Field label="POL Coordinates (Lat, Lng)"><div className="flex gap-2"><Input value={f.polLat} onChange={(e) => up('polLat', e.target.value)} placeholder="-3.3186" /><Input value={f.polLng} onChange={(e) => up('polLng', e.target.value)} placeholder="114.5944" /></div></Field>
          <Field label="Port Of Discharge *"><Input value={f.portOfDischarge} onChange={(e) => up('portOfDischarge', e.target.value)} placeholder="e.g. Cilegon" /></Field>
          <Field label="POD Coordinates (Lat, Lng)"><div className="flex gap-2"><Input value={f.podLat} onChange={(e) => up('podLat', e.target.value)} placeholder="-6.0167" /><Input value={f.podLng} onChange={(e) => up('podLng', e.target.value)} placeholder="106.0500" /></div></Field>
          <Field label="Free Time *"><div className="flex gap-2"><Input type="number" value={f.freeTime} onChange={(e) => up('freeTime', Number(e.target.value))} className="w-24" /><Select value={f.freeTimeUnit} onChange={(e) => up('freeTimeUnit', e.target.value)} className="w-auto"><option value="Days">Days</option><option value="Hours">Hours</option></Select></div></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>4. Cargo & Vessel</div><div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Cargo Type *"><Select value={f.cargoType} onChange={(e) => up("cargoType", e.target.value)}><option>Coal</option><option>Nickel Ore</option><option>Iron Sand</option></Select></Field>
          <div className="hidden sm:block" />
          <Field label="Cargo Weight *"><div className="flex gap-2"><Input type="number" value={f.cargoWeight} onChange={(e) => up('cargoWeight', Number(e.target.value))} /><Select value={f.cargoWeightUnit} onChange={(e) => up('cargoWeightUnit', e.target.value)} className="w-20"><option value="MT">MT</option></Select></div></Field>
          <Field label="Dead Weight (DWT) *"><div className="flex gap-2"><Input type="number" value={f.dwt} onChange={(e) => up('dwt', Number(e.target.value))} /><Select value={f.dwtUnit} onChange={(e) => up('dwtUnit', e.target.value)} className="w-20"><option value="MT">MT</option></Select></div></Field>
          <Field label="Tug Boat *"><Select value={f.tugBoatId} onChange={(e) => up('tugBoatId', e.target.value)}><option value="">-- Select Tug Boat --</option>{tugs.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select></Field>
          <Field label="Barge *"><Select value={f.bargeId} onChange={(e) => up('bargeId', e.target.value)}><option value="">-- Select Barge --</option>{barges.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select></Field>
          <Field label="Tug Boat Last Location"><Input value={f.tugLastLocation} onChange={(e) => up('tugLastLocation', e.target.value)} placeholder="e.g. Anchorage Muara Berau" /></Field>
          <Field label="Barge Last Location"><Input value={f.bargeLastLocation} onChange={(e) => up('bargeLastLocation', e.target.value)} placeholder="e.g. Anchorage Taboneo" /></Field>
          <Field label="Tug Boat Coordinates (Lat, Lng)"><div className="flex gap-2"><Input value={f.tugLastLat} onChange={(e) => up('tugLastLat', e.target.value)} placeholder="-0.5021" /><Input value={f.tugLastLng} onChange={(e) => up('tugLastLng', e.target.value)} placeholder="117.1536" /></div></Field>
          <Field label="Barge Coordinates (Lat, Lng)"><div className="flex gap-2"><Input value={f.bargeLastLat} onChange={(e) => up('bargeLastLat', e.target.value)} placeholder="-3.4500" /><Input value={f.bargeLastLng} onChange={(e) => up('bargeLastLng', e.target.value)} placeholder="114.6500" /></div></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>5. Commercial & Payment</div><div className="grid gap-4 p-4 sm:grid-cols-3">
          <Field label="Freight Price *"><div className="flex gap-2"><Input type="number" value={f.freightPrice} onChange={(e) => up('freightPrice', Number(e.target.value))} /><Select value={f.freightCurrency} onChange={(e) => up('freightCurrency', e.target.value)} className="w-20"><option value="IDR">IDR</option><option value="USD">USD</option></Select><Select value={f.freightBasis} onChange={(e) => up('freightBasis', e.target.value)} className="w-auto"><option value="Per Voyage">Per Voyage</option><option value="Per MT">Per MT</option></Select></div></Field>
          <Field label="Payment Terms *"><Select value={f.paymentTerms} onChange={(e) => up('paymentTerms', e.target.value)}>{PAYMENT_TERMS_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
          <Field label={`Demurrage Rate (${f.freightCurrency} / day)`}><Input type="number" value={f.demurrageRate} onChange={(e) => up("demurrageRate", Number(e.target.value))} /></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>6. Additional Charges</div><div className="space-y-4 p-4">
          <div className="overflow-x-auto rounded border border-line">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-line bg-surface-2"><th className="px-3 py-2 text-left font-medium">Description</th><th className="px-3 py-2 text-left font-medium">Unit</th><th className="px-3 py-2 text-left font-medium">Currency</th><th className="px-3 py-2 text-right font-medium">Qty</th><th className="px-3 py-2 text-right font-medium">Unit Price</th><th className="px-3 py-2 text-right font-medium">Amount</th><th className="w-10" /></tr></thead>
              <tbody>
                <tr className="border-t border-line bg-surface-2/50"><td className="px-3 py-2">Freight charge ({f.freightBasis})</td><td className="px-3 py-2">{f.freightBasis === 'Per MT' ? 'MT' : 'Voyage'}</td><td className="px-3 py-2">{f.freightCurrency}</td><td className="px-3 py-2 text-right">{f.freightBasis === 'Per MT' ? f.cargoWeight.toLocaleString() : 1}</td><td className="px-3 py-2 text-right">{new Intl.NumberFormat('en-US').format(f.freightPrice)}</td><td className="px-3 py-2 text-right font-semibold">{f.freightCurrency} {new Intl.NumberFormat('en-US').format(freightAmount)}</td><td /></tr>
                {charges.map((x, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-2 py-1"><Input value={x.description} onChange={(e) => setCharge(i, 'description', e.target.value)} placeholder="e.g. Agency fee" /></td>
                    <td className="px-2 py-1"><Select value={x.unit} onChange={(e) => setCharge(i, 'unit', e.target.value)} className="w-28">{PRICE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</Select></td>
                    <td className="px-2 py-1"><Select value={x.currency} onChange={(e) => setCharge(i, 'currency', e.target.value)} className="w-24"><option value="IDR">IDR</option><option value="USD">USD</option></Select></td>
                    <td className="px-2 py-1"><Input type="number" value={x.qty} onChange={(e) => setCharge(i, 'qty', Number(e.target.value))} className="w-24 text-right" /></td>
                    <td className="px-2 py-1"><Input type="number" value={x.unitPrice} onChange={(e) => setCharge(i, 'unitPrice', Number(e.target.value))} className="w-40 text-right" /></td>
                    <td className="px-3 py-2 text-right font-semibold">{x.currency} {new Intl.NumberFormat('en-US').format(x.qty * x.unitPrice)}</td>
                    <td className="px-2"><button onClick={() => setCharges((p) => p.filter((_, j) => j !== i))} className="text-bad" aria-label="Remove"><Trash2 className="size-4" /></button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>{Object.entries(totalsByCurrency).map(([cur, val]) => <tr key={cur} className="border-t-2 border-ink bg-surface-2"><td colSpan={5} className="px-3 py-2 text-right font-bold">Total ({cur})</td><td className="px-3 py-2 text-right font-bold">{cur} {new Intl.NumberFormat('en-US').format(val)}</td><td /></tr>)}</tfoot>
            </table>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setCharges((p) => [...p, { description: '', unit: 'Lot', currency: f.freightCurrency, qty: 1, unitPrice: 0 }])}><Plus className="size-4" /> Add Row</Button>
        </div></div>
        <div className={section}><div className={sectionTitle}>7. Customer&apos;s PIC</div><div className="grid gap-4 p-4 sm:grid-cols-3">
          <Field label="Customer's PIC *"><Input value={f.customerPic} onChange={(e) => up('customerPic', e.target.value)} placeholder="Budi Santoso" /></Field>
          <Field label="Phone Number"><Input value={f.customerPicPhone} onChange={(e) => up('customerPicPhone', e.target.value)} placeholder="0812 3456 7890" /></Field>
          <Field label="Email"><Input value={f.customerPicEmail} onChange={(e) => up('customerPicEmail', e.target.value)} placeholder="email@company.co.id" /></Field>
          <Field label="Position"><Input value={f.customerPicPosition} onChange={(e) => up('customerPicPosition', e.target.value)} placeholder="Logistics Manager" /></Field>
          <Field label="Company Address"><Input value={f.customerAddress} onChange={(e) => up("customerAddress", e.target.value)} placeholder="Jl. Jenderal Sudirman No. 1, Jakarta" /></Field>
        </div></div>
        <div className={section}><div className={sectionTitle}>8. Additional Information</div><div className="p-4">
          <Field label="Remarks"><Textarea value={f.remarks} onChange={(e) => up('remarks', e.target.value)} placeholder="Additional notes..." maxLength={500} /></Field>
          {f.remarks && <div className="mt-1 text-right text-xs text-ink-2">{f.remarks.length}/500</div>}
        </div></div>
        <div className={section}><div className={sectionTitle}>9. Documents</div><div className="space-y-3 p-4">
          {docRows.map((d, i) => (
            <div key={d.id} className="flex flex-wrap items-center gap-2">
              <Select value={d.docType} onChange={(e) => setDocRows((p) => p.map((x, j) => (j === i ? { ...x, docType: e.target.value } : x)))} className="w-60">{PO_DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select>
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={(e) => { const file = e.target.files?.[0]; setDocRows((p) => p.map((x, j) => (j === i ? { ...x, name: file?.name ?? '', sizeKb: file ? Math.max(1, Math.round(file.size / 1024)) : 0 } : x))) }} className="min-w-0 flex-1 text-sm text-ink file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-bold file:text-white" />
              {docRows.length > 1 && <button onClick={() => setDocRows((p) => p.filter((_, j) => j !== i))} className="text-bad" aria-label="Remove"><Trash2 className="size-4" /></button>}
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => setDocRows((p) => [...p, newDocRow()])}><Plus className="size-4" /> Add Document</Button>
        </div></div>
      </div>
    </div>
  )
}

function SODetailPage({ id }: { id: string }) {
  const { s, can } = useStore()
  const billingTone: Record<string, Tone> = { waiting_payment: 'warn', paid: 'ok' }
  const so = s.salesOrders.find((so) => so.id === id)
  const statusTone: Record<string, Tone> = { draft: 'neutral', active: 'accent', completed: 'ok', cancelled: 'bad' }
  if (!so) return <div><BackButton to="/sales/so" label="Sales Order" /><Empty title="SO not found">The requested SO does not exist.</Empty></div>
  const soBillings = so.billings ?? []
  const soTotal = soBillings.reduce((a, b) => a + b.amount, 0)
  const soPaid = soBillings.filter((b) => b.status === 'paid').reduce((a, b) => a + b.amount, 0)
  return (
    <div>
      <BackButton to="/sales/so" label="Sales Order" />
      <div className="mb-6 flex items-center gap-3"><Handshake className="size-8 text-accent" /><h1 className="text-2xl font-bold text-ink">{so.soNo}</h1><Badge t={statusTone[so.status]}>{soStatusLabel[so.status]}</Badge>{so.status !== 'draft' && <Badge t={billingTone[billingSummary(so.billings)]}>{billingLabel[billingSummary(so.billings)]}</Badge>}</div>
      {so.status !== 'draft' && <p className="-mt-4 mb-6 text-sm text-ink-2">Billing: {billingStage(so.billings)}</p>}
      <div className="space-y-5">
        <div className={section}><div className={sectionTitle}>1. Basic Information</div><dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-3 text-[15px]"><div><dt className="text-xs text-ink-2">SO Number</dt><dd className="font-semibold">{so.soNo}</dd></div><div><dt className="text-xs text-ink-2">SO Date</dt><dd>{fmtDate(so.soDate)}</dd></div><div><dt className="text-xs text-ink-2">Sales Name</dt><dd>{so.salesName}</dd></div></dl></div>
        <div className={section}><div className={sectionTitle}>2. Customer & Parties</div><dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-3 text-[15px]"><div><dt className="text-xs text-ink-2">PO Number</dt><dd className="font-semibold">{so.poNo}</dd></div><div><dt className="text-xs text-ink-2">Customer</dt><dd className="font-semibold">{so.customerName}</dd></div><div><dt className="text-xs text-ink-2">Customer ID</dt><dd>{so.customerId || '-'}</dd></div><div><dt className="text-xs text-ink-2">Consignee</dt><dd>{so.consigneeName || '-'} <span className="text-ink-2">({so.consigneeId || '-'})</span></dd></div><div><dt className="text-xs text-ink-2">Shipper</dt><dd>{so.shipperName || '-'} <span className="text-ink-2">({so.shipperId || '-'})</span></dd></div></dl></div>
        <div className={section}><div className={sectionTitle}>3. Shipment Details</div><dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-3 text-[15px]"><div><dt className="text-xs text-ink-2">Shipment Type</dt><dd>{so.shipmentType}</dd></div><div><dt className="text-xs text-ink-2">Laycan</dt><dd>{fmtDate(so.laycanStart)} — {fmtDate(so.laycanEnd)}</dd></div><div><dt className="text-xs text-ink-2">Port of Loading</dt><dd>{so.portOfLoading}{so.polLat && <span className="block text-xs text-ink-2">{so.polLat}, {so.polLng}</span>}</dd></div><div><dt className="text-xs text-ink-2">Port of Discharge</dt><dd>{so.portOfDischarge}{so.podLat && <span className="block text-xs text-ink-2">{so.podLat}, {so.podLng}</span>}</dd></div><div><dt className="text-xs text-ink-2">Free Time</dt><dd>{so.freeTime} {so.freeTimeUnit}</dd></div></dl></div>
        <div className={section}><div className={sectionTitle}>4. Cargo & Vessel</div><dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2 text-[15px]"><div><dt className="text-xs text-ink-2">Cargo Type</dt><dd>{so.cargoType}</dd></div><div><dt className="text-xs text-ink-2">Tug Boat</dt><dd>{so.tugBoatName || '-'}{(so.tugLastLocation || so.tugLastLat) && <span className="block text-xs text-ink-2">Last: {so.tugLastLocation} {so.tugLastLat && `(${so.tugLastLat}, ${so.tugLastLng})`}</span>}</dd></div><div><dt className="text-xs text-ink-2">Barge</dt><dd>{so.bargeName || '-'}{(so.bargeLastLocation || so.bargeLastLat) && <span className="block text-xs text-ink-2">Last: {so.bargeLastLocation} {so.bargeLastLat && `(${so.bargeLastLat}, ${so.bargeLastLng})`}</span>}</dd></div><div><dt className="text-xs text-ink-2">Cargo Weight</dt><dd>{so.cargoWeight.toLocaleString()} {so.cargoWeightUnit}</dd></div><div><dt className="text-xs text-ink-2">DWT</dt><dd>{so.dwt.toLocaleString()} {so.dwtUnit}</dd></div></dl></div>
        <div className={section}><div className={sectionTitle}>5. Commercial & Payment</div><dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-3 text-[15px]"><div><dt className="text-xs text-ink-2">Freight Price</dt><dd className="font-bold">{idr(so.freightPrice)} {so.freightCurrency} {so.freightBasis}</dd></div><div><dt className="text-xs text-ink-2">Payment Terms</dt><dd>{so.paymentTerms}</dd></div>{so.demurrageRate != null && <div><dt className="text-xs text-ink-2">Demurrage Rate</dt><dd>{so.freightCurrency} {new Intl.NumberFormat('en-US').format(so.demurrageRate)} / day</dd></div>}</dl></div>
        {so.items && so.items.length > 1 && (
          <div className={section}><div className={sectionTitle}>6. Additional Charges</div><div className="p-4"><div className="overflow-x-auto rounded border border-line">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-line bg-surface-2"><th className="px-3 py-2 text-left font-medium">Description</th><th className="px-3 py-2 text-left font-medium">Unit</th><th className="px-3 py-2 text-left font-medium">Currency</th><th className="px-3 py-2 text-right font-medium">Qty</th><th className="px-3 py-2 text-right font-medium">Unit Price</th><th className="px-3 py-2 text-right font-medium">Amount</th></tr></thead>
              <tbody>{so.items.map((it, i) => <tr key={i} className="border-t border-line"><td className="px-3 py-2">{it.description}</td><td className="px-3 py-2">{it.unit}</td><td className="px-3 py-2">{it.currency ?? so.freightCurrency}</td><td className="px-3 py-2 text-right">{it.qty.toLocaleString()}</td><td className="px-3 py-2 text-right">{new Intl.NumberFormat('en-US').format(it.unitPrice)}</td><td className="px-3 py-2 text-right font-semibold">{new Intl.NumberFormat('en-US').format(it.amount)}</td></tr>)}</tbody>
              <tfoot>{Object.entries(so.items.reduce<Record<string, number>>((a, x) => { const c = x.currency ?? so.freightCurrency; return { ...a, [c]: (a[c] ?? 0) + x.amount } }, {})).map(([cur, val]) => <tr key={cur} className="border-t-2 border-ink bg-surface-2"><td colSpan={5} className="px-3 py-2 text-right font-bold">Total ({cur})</td><td className="px-3 py-2 text-right font-bold">{cur} {new Intl.NumberFormat('en-US').format(val)}</td></tr>)}</tfoot>
            </table>
          </div></div></div>
        )}
        {so.customerPic && <div className={section}><div className={sectionTitle}>7. Customer&apos;s PIC</div><dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-4 text-[15px]"><div><dt className="text-xs text-ink-2">Name</dt><dd className="font-semibold">{so.customerPic}</dd></div><div><dt className="text-xs text-ink-2">Phone</dt><dd>{so.customerPicPhone}</dd></div><div><dt className="text-xs text-ink-2">Email</dt><dd>{so.customerPicEmail}</dd></div><div><dt className="text-xs text-ink-2">Position</dt><dd>{so.customerPicPosition}</dd></div>{so.customerAddress && <div><dt className="text-xs text-ink-2">Company Address</dt><dd>{so.customerAddress}</dd></div>}</dl></div>}
        {so.remarks && <div className={section}><div className={sectionTitle}>8. Additional Information</div><div className="p-4 text-[15px]">{so.remarks}</div></div>}
        <div className={section}><div className={sectionTitle}>9. Customer PO Documents</div><div className="space-y-2 p-4">
          {so.poFiles && so.poFiles.length > 0 ? so.poFiles.map((fl) => (
            <div key={fl.id} className="flex items-center gap-3 rounded border border-line p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded bg-accent-soft text-accent"><FileText className="size-4" /></span>
              <div className="min-w-0"><div className="truncate text-[15px] font-semibold text-ink">{fl.name}</div><div className="text-xs text-ink-2">{fl.docType} · {fl.sizeKb.toLocaleString()} KB · {fmtDate(fl.uploadedAt.slice(0, 10))}</div></div>
            </div>
          )) : <div className="rounded border-2 border-dashed border-ink-3 p-4 text-center text-sm text-ink-2">No documents attached.</div>}
        </div></div>
        <div className={section}><div className={sectionTitle}>Billing</div><div className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-ink-2">Billing status</span><Badge t={billingTone[billingSummary(so.billings)]}>{billingLabel[billingSummary(so.billings)]}</Badge>
            <span className="text-ink-2">Paid {soPaid.toLocaleString()} / {soTotal.toLocaleString()} {so.freightCurrency}</span>
          </div>
          <div className="overflow-x-auto rounded border border-line">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-line bg-surface-2"><th className="px-3 py-2 text-left font-medium">Milestone</th><th className="px-3 py-2 text-right font-medium">%</th><th className="px-3 py-2 text-right font-medium">Amount</th><th className="px-3 py-2 text-left font-medium">Paid</th><th className="px-3 py-2 text-left font-medium">Status</th><th className="px-3 py-2 text-left font-medium">Marked paid by</th></tr></thead>
              <tbody>{(so.billings ?? []).map((b) => (
                <tr key={b.id} className="border-t border-line">
                  <td className="px-3 py-2">{b.term}</td>
                  <td className="px-3 py-2 text-right">{b.percent}%</td>
                  <td className="px-3 py-2 text-right font-semibold">{b.currency} {b.amount.toLocaleString()}</td>
                  <td className="px-3 py-2">{b.paidAt ? fmtDate(b.paidAt) : '-'}</td>
                  <td className="px-3 py-2"><Badge t={b.status === 'paid' ? 'ok' : 'warn'}>{b.status === 'paid' ? 'Paid' : 'Waiting payment'}</Badge></td>
                  <td className="px-3 py-2">{b.paidBy ?? '-'}{b.proof && (b.proof.dataUrl ? <a href={b.proof.dataUrl} target="_blank" rel="noreferrer" className="block text-xs font-semibold text-accent hover:underline">View proof</a> : <span className="block text-xs text-ink-2">{b.proof.name}</span>)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <p className="text-xs text-ink-2">Billing status is updated by Finance from the Finance module. This order completes when every term is paid.</p>
        </div></div>
        <div className={section}><div className={sectionTitle}>Output Documents</div>
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            {[
              { t: 'Sales Order', d: `${so.soNo} — ${so.customerName}`, to: 'Sales / Finance' },
              { t: 'SPAL', d: `Surat Perjanjian Angkutan Laut — ${so.shipperName || so.customerName} ↔ Consignee ${so.consigneeName || '-'}`, to: 'Customer / Legal' },
              { t: 'Job Order', d: `${so.tugBoatName || 'TB TBA'} + ${so.bargeName || 'BG TBA'} · ${so.portOfLoading} → ${so.portOfDischarge}`, to: 'Operations Team' },
            ].map((o) => (
              <div key={o.t} className="rounded border border-line p-3 text-sm">
                <div className="font-semibold text-ink">{o.t}</div>
                <div className="mt-1 text-ink-2">{o.d}</div>
                <div className="mt-1 text-xs text-ink-2">Recipient: {o.to}</div>
                <div className="mt-2 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => window.print()}>Print / Save PDF</Button>{o.t === 'Job Order' && (so.status === 'active' || so.status === 'completed') && can('joborder.read') && <Link to={`/operations/job-order/${so.id}`}><Button variant="secondary">Open in Operational</Button></Link>}</div>{o.t === 'Job Order' && so.status === 'draft' && <div className="mt-2 text-xs text-ink-2">Sent to Operational automatically when this SO is submitted.</div>}
              </div>
            ))}
          </div>
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
    { key: 'po', header: 'PO Number', cell: (r) => r.poNo },
    { key: 'customer', header: 'Customer', cell: (r) => r.customerName },
    { key: 'route', header: 'Route', cell: (r) => `${r.portOfLoading || r.origin} → ${r.portOfDischarge || r.destination}` },
    { key: 'amount', header: 'Freight', cell: (r) => idr(r.freightPrice), className: 'text-right' },
    { key: 'billing', header: 'Billing', cell: (r) => <div><Badge t={({ waiting_payment: 'warn', paid: 'ok' } as Record<string, Tone>)[billingSummary(r.billings)]}>{billingLabel[billingSummary(r.billings)]}</Badge>{r.status !== 'draft' && <div className="mt-1 text-xs text-ink-2">{billingStage(r.billings)}</div>}</div> },
    { key: 'date', header: 'SO Date', cell: (r) => fmtDate(r.soDate) },
    { key: 'status', header: 'Status', cell: (r) => <Badge t={statusTone[r.status]}>{soStatusLabel[r.status]}</Badge> },
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
  const { can } = useStore()
  const rest = pathname.replace(/^\/sales\/?/, '')
  const segments = rest.split('/')
  const feature = can('sales.read') ? (segments[0] || 'dashboard') : 'quotation'
  const sub = segments[1] || ''
  const active = NAV.find((n) => n.path === `/sales/${feature}`)?.key ?? 'dashboard'

  let content: JSX.Element
  switch (feature) {
    case 'quotation': content = sub === 'create' ? <QuotationCreatePage /> : sub ? <QuotationDetailPage id={sub} /> : <QuotationPage />; break
    case 'so': content = sub === 'create' ? <SOCreatePage /> : sub ? <SODetailPage id={sub} /> : <SOPage />; break
    case 'commercial-sheet': content = sub === 'create' ? <CSCreatePage /> : sub ? <CSDetailPage id={sub} /> : <CommercialSheetPage />; break
    default: content = <SalesDashboard />
  }

  return <ModuleShell active={active}>{content}</ModuleShell>
}
