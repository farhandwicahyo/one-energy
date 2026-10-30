import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, ClipboardList } from 'lucide-react'
import { useStore } from '../../store'
import { Badge, Button, Empty, PageHeader, SearchBox, Select, Table, Toolbar, type Col, type Tone } from '../../components/ui'
import { fmtDate } from '../../lib/dates'
import type { SalesOrder } from '../../data/types'

// A Job Order is the operational view of a submitted Sales Order. It carries the voyage
// instructions only (parties, route, cargo, vessels, laycan) and never the commercial price.
type JobStatus = 'new' | 'in_progress' | 'completed'
const section = 'rounded border-2 border-accent bg-surface'
const sectionTitle = 'bg-accent px-4 py-2 text-sm font-bold text-white rounded-t'
const jobTone: Record<JobStatus, Tone> = { new: 'accent', in_progress: 'warn', completed: 'ok' }
const jobLabel: Record<JobStatus, string> = { new: 'New', in_progress: 'In progress', completed: 'Completed' }

export const jobNo = (so: SalesOrder) => so.soNo.replace(/^SO/, 'JO')
export const jobStatusOf = (so: SalesOrder): JobStatus => so.jobStatus ?? (so.status === 'completed' ? 'completed' : 'new')
// Draft and cancelled sales orders do not reach operations.
export const isJobOrder = (so: SalesOrder) => so.status === 'active' || so.status === 'completed'

export function JobOrderList() {
  const { s } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const rows = useMemo(() => {
    const term = q.toLowerCase()
    return s.salesOrders.filter(isJobOrder).filter((so) => {
      if (status !== 'all' && jobStatusOf(so) !== status) return false
      return !term || jobNo(so).toLowerCase().includes(term) || so.soNo.toLowerCase().includes(term) || so.customerName.toLowerCase().includes(term) || (so.tugBoatName ?? '').toLowerCase().includes(term) || (so.bargeName ?? '').toLowerCase().includes(term)
    })
  }, [s.salesOrders, q, status])
  const cols: Col<SalesOrder>[] = [
    { key: 'no', header: 'Job Order No', cell: (r) => <span className="font-semibold text-accent">{jobNo(r)}</span>, mobile: 'title' },
    { key: 'so', header: 'SO / PO', cell: (r) => <div><div>{r.soNo}</div><div className="text-xs text-ink-2">{r.poNo}</div></div>, mobile: 'hide' },
    { key: 'customer', header: 'Customer', cell: (r) => <div><div>{r.customerName}</div>{r.consigneeName && <div className="text-xs text-ink-2">Consignee: {r.consigneeName}</div>}</div> },
    { key: 'route', header: 'Route', cell: (r) => <div><div>{r.portOfLoading} → {r.portOfDischarge}</div><div className="text-xs text-ink-2">{r.shipmentType}</div></div> },
    { key: 'cargo', header: 'Cargo', cell: (r) => `${r.cargoType} · ${r.cargoWeight.toLocaleString()} ${r.cargoWeightUnit}` },
    { key: 'laycan', header: 'Laycan', cell: (r) => `${fmtDate(r.laycanStart)} — ${fmtDate(r.laycanEnd)}`, mobile: 'hide' },
    { key: 'vessel', header: 'TB / BG', cell: (r) => r.tugBoatName || r.bargeName ? `${r.tugBoatName || '—'} / ${r.bargeName || '—'}` : '—', mobile: 'hide' },
    { key: 'status', header: 'Status', cell: (r) => <Badge t={jobTone[jobStatusOf(r)]}>{jobLabel[jobStatusOf(r)]}</Badge> },
  ]
  return (
    <div>
      <PageHeader title="Job Order" lead="Voyage instructions generated from submitted Sales Orders" />
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Search job order, SO, customer, vessel..." />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
          <option value="all">All Status</option><option value="new">New</option><option value="in_progress">In progress</option><option value="completed">Completed</option>
        </Select>
      </Toolbar>
      {rows.length > 0
        ? <Table rows={rows} cols={cols} rowKey={(r) => r.id} onRow={(r) => nav(`/operations/job-order/${r.id}`)} />
        : <Empty title="No job orders yet">A job order appears here as soon as Sales submits a Sales Order.</Empty>}
    </div>
  )
}

export function JobOrderDetail({ id }: { id: string }) {
  const { s, can, updateSO } = useStore()
  const so = s.salesOrders.find((x) => x.id === id && isJobOrder(x))
  const back = <Link to="/operations/job-order" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"><ArrowLeft className="size-4" /> Back to Job Order</Link>
  if (!so) return <div>{back}<Empty title="Job order not found">The requested job order does not exist or its sales order is not submitted.</Empty></div>
  const st = jobStatusOf(so)
  const item = (label: string, value: React.ReactNode, span?: string) => <div className={span}><dt className="text-xs text-ink-2">{label}</dt><dd>{value || '-'}</dd></div>
  const coords = (lat?: string, lng?: string) => lat ? <span className="block text-xs text-ink-2">{lat}, {lng}</span> : null
  const lastPos = (loc?: string, lat?: string, lng?: string) => loc || lat ? <span className="block text-xs text-ink-2">Last position: {loc}{lat && ` (${lat}, ${lng})`}</span> : null
  const dl = (cols: string) => `grid gap-x-6 gap-y-4 p-4 text-[15px] ${cols}`
  return (
    <div>
      {back}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><ClipboardList className="size-8 text-accent" /><h1 className="text-2xl font-bold text-ink">{jobNo(so)}</h1><Badge t={jobTone[st]}>{jobLabel[st]}</Badge></div>
        {can('joborder.write') && (
          <div className="flex gap-2">
            {st === 'new' && <Button onClick={() => updateSO(so.id, { jobStatus: 'in_progress' })}><Check className="size-4" /> Accept Job</Button>}
            {st === 'in_progress' && <Button onClick={() => updateSO(so.id, { jobStatus: 'completed' })}><Check className="size-4" /> Mark Completed</Button>}
          </div>
        )}
      </div>
      <div className="space-y-5">
        <div className={section}><div className={sectionTitle}>1. Job Summary</div><dl className={dl('sm:grid-cols-4')}>
          {item('Job Order No', <span className="font-semibold">{jobNo(so)}</span>)}
          {item('Sales Order', so.soNo)}
          {item('Customer PO', so.poNo)}
          {item('Issued', fmtDate(so.soDate))}
          {item('Sales Name', so.salesName)}
        </dl></div>
        <div className={section}><div className={sectionTitle}>2. Customer & Parties</div><dl className={dl('sm:grid-cols-3')}>
          {item('Customer Name', <span className="font-semibold">{so.customerName}</span>)}
          {item('Consignee Name', so.consigneeName)}
          {item('Shipper Name', so.shipperName)}
          {item('Customer ID', so.customerId)}
          {item('Consignee ID', so.consigneeId)}
          {item('Shipper ID', so.shipperId)}
        </dl></div>
        <div className={section}><div className={sectionTitle}>3. Shipment & Route</div><dl className={dl('sm:grid-cols-3')}>
          {item('Shipment Type', so.shipmentType)}
          {item('Laycan', `${fmtDate(so.laycanStart)} — ${fmtDate(so.laycanEnd)}`)}
          {item('Free Time', `${so.freeTime} ${so.freeTimeUnit}`)}
          {item('Port of Loading', <>{so.portOfLoading}{coords(so.polLat, so.polLng)}</>)}
          {item('Port of Discharge', <>{so.portOfDischarge}{coords(so.podLat, so.podLng)}</>)}
        </dl></div>
        <div className={section}><div className={sectionTitle}>4. Cargo</div><dl className={dl('sm:grid-cols-3')}>
          {item('Cargo Type', so.cargoType)}
          {item('Cargo Weight', `${so.cargoWeight.toLocaleString()} ${so.cargoWeightUnit}`)}
          {item('Dead Weight (DWT)', `${so.dwt.toLocaleString()} ${so.dwtUnit}`)}
        </dl></div>
        <div className={section}><div className={sectionTitle}>5. Vessel Assignment</div><dl className={dl('sm:grid-cols-2')}>
          {item('Tug Boat', <>{so.tugBoatName}{lastPos(so.tugLastLocation, so.tugLastLat, so.tugLastLng)}</>)}
          {item('Barge', <>{so.bargeName}{lastPos(so.bargeLastLocation, so.bargeLastLat, so.bargeLastLng)}</>)}
        </dl></div>
        <div className={section}><div className={sectionTitle}>6. Customer Contact</div><dl className={dl('sm:grid-cols-3')}>
          {item('PIC', so.customerPic)}
          {item('Position', so.customerPicPosition)}
          {item('Phone Number', so.customerPicPhone)}
          {item('Email', so.customerPicEmail)}
          {item('Company Address', so.customerAddress, 'sm:col-span-2')}
        </dl></div>
        <div className={section}><div className={sectionTitle}>7. Special Instructions</div><div className="whitespace-pre-wrap p-4 text-[15px]">{so.remarks || '-'}</div></div>
      </div>
    </div>
  )
}
