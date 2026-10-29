import { useState, useMemo, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Check, ChevronDown, ClipboardList, FileCheck2, FileStack, Fuel, Inbox, LayoutDashboard,
  MapPin, Plus, RefreshCw, Search, ShoppingCart, Trash2, Truck, Upload, UserCog, Users, X as XIcon,
} from 'lucide-react'
import { useStore } from '../../store'
import {
  Badge, Button, cx, Empty, Field, ModuleFooter, Input, PageHeader, Panel, Select,
  SearchBox, Stat, Table, Textarea, Toolbar, type Col, type Tone,
} from '../../components/ui'
import { fmtDate, TODAY } from '../../lib/dates'
import type { PurchaseRequest, BunkerRequestItem } from '../../data/types'

const idr = (n: number) => `IDR ${new Intl.NumberFormat('en-US').format(n)}`
const section = 'rounded border-2 border-accent bg-surface'
const sectionTitle = 'bg-accent px-4 py-2 text-sm font-bold text-white rounded-t'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/procurement/dashboard' },
  { key: 'request', label: 'Purchase Request', icon: Inbox, path: '/procurement/request' },
  { key: 'vendor', label: 'Vendor Selection', icon: Users, path: '/procurement/vendor' },
  { key: 'order', label: 'Purchase Order', icon: ShoppingCart, path: '/procurement/order' },
  { key: 'delivery', label: 'Monitor Delivery', icon: Truck, path: '/procurement/delivery' },
] as const

const DOC_SUPPORT_ITEMS = [
  { key: 'renewal', label: 'Certificate Renewal', icon: RefreshCw, path: '/procurement/doc-support/renewal' },
  { key: 'permit', label: 'Permit & License', icon: FileCheck2, path: '/procurement/doc-support/permit' },
  { key: 'documentation', label: 'Documentation', icon: FileStack, path: '/procurement/doc-support/documentation' },
  { key: 'vendor-service', label: 'Vendor Service', icon: UserCog, path: '/procurement/doc-support/vendor-service' },
] as const

function SidebarContent({ active, pathname, onNav, collapsed }: { active: string; pathname: string; onNav?: () => void; collapsed?: boolean }) {
  const docActive = pathname.startsWith('/procurement/doc-support')
  const [docOpen, setDocOpen] = useState(docActive)
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
      <button onClick={() => collapsed ? window.dispatchEvent(new Event('toggle-module-sidebar')) : setDocOpen((o) => !o)} title="Document Support" className={cx(
        'flex w-full items-center gap-2 rounded-lg py-2 text-[14px] font-bold transition-colors',
        collapsed ? 'justify-center px-0' : 'px-3',
        docActive ? 'text-accent' : 'text-[var(--color-nav-ink)] hover:bg-white/10',
      )}>
        <FileCheck2 className="size-4 shrink-0" />
        {!collapsed && <span className="flex-1 text-left">Document Support</span>}
        {!collapsed && <ChevronDown className={cx('size-4 shrink-0 transition-transform', docOpen && 'rotate-180')} />}
      </button>
      {docOpen && !collapsed && (
        <div className="ml-4 space-y-0.5 border-l-2 border-white/20 pl-2">
          {DOC_SUPPORT_ITEMS.map((it) => {
            const Ic = it.icon
            const here = pathname === it.path || pathname.startsWith(it.path + '/')
            return (
              <Link key={it.key} to={it.path} onClick={onNav} className={cx(
                'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition-colors',
                here ? 'bg-accent text-white' : 'text-[var(--color-nav-ink)] hover:bg-white/10',
              )}><Ic className="size-3.5" />{it.label}</Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ProcModuleShell({ active, pathname, children }: { active: string; pathname: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const h = () => setOpen((o) => !o)
    window.addEventListener('toggle-module-sidebar', h)
    return () => window.removeEventListener('toggle-module-sidebar', h)
  }, [])
  return (
    <div className="flex min-h-0 w-full flex-1">
      <nav className={cx('hidden shrink-0 overflow-y-auto bg-[var(--color-nav)] transition-[width] lg:block', open ? 'w-56 p-3' : 'w-16 p-2')} aria-label="Procurement menu">
        <SidebarContent active={active} pathname={pathname} collapsed={!open} />
      </nav>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
          <nav className="fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto bg-[var(--color-nav)] p-4 pt-6 shadow-2xl lg:hidden" aria-label="Procurement menu">
            <SidebarContent active={active} pathname={pathname} onNav={() => setOpen(false)} />
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

// ---------- Vessel SVG Illustration ----------
function VesselIllustration() {
  return (
    <svg viewBox="0 0 280 160" className="w-full rounded" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
        <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="280" height="160" rx="8" fill="url(#sea)" />
      {/* Water waves */}
      <path d="M0 120 Q35 110 70 120 T140 120 T210 120 T280 120 V160 H0Z" fill="#38bdf8" opacity="0.3" />
      <path d="M0 130 Q35 122 70 130 T140 130 T210 130 T280 130 V160 H0Z" fill="#0ea5e9" opacity="0.3" />
      {/* Hull */}
      <path d="M40 105 L60 85 L220 85 L240 105 L230 115 L50 115Z" fill="url(#hull)" />
      {/* Superstructure */}
      <rect x="80" y="55" width="80" height="30" rx="3" fill="#334155" />
      <rect x="90" y="40" width="40" height="18" rx="2" fill="#475569" />
      {/* Bridge windows */}
      <rect x="95" y="62" width="12" height="8" rx="1" fill="#fbbf24" opacity="0.8" />
      <rect x="112" y="62" width="12" height="8" rx="1" fill="#fbbf24" opacity="0.8" />
      <rect x="129" y="62" width="12" height="8" rx="1" fill="#fbbf24" opacity="0.8" />
      {/* Mast */}
      <line x1="110" y1="40" x2="110" y2="22" stroke="#94a3b8" strokeWidth="2" />
      <circle cx="110" cy="20" r="3" fill="#ef4444" />
      {/* Funnel */}
      <rect x="165" y="60" width="18" height="25" rx="2" fill="#1e293b" />
      <rect x="165" y="57" width="18" height="5" rx="1" fill="#F36D25" />
      {/* Tow line */}
      <path d="M220 95 Q250 90 270 100" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
      {/* Water spray */}
      <circle cx="50" cy="108" r="2" fill="white" opacity="0.6" />
      <circle cx="45" cy="104" r="1.5" fill="white" opacity="0.5" />
      <circle cx="55" cy="106" r="1" fill="white" opacity="0.4" />
    </svg>
  )
}

// ---------- Route Map SVG ----------
function RouteMap({ from, to, distance }: { from: string; to: string; distance: number }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full rounded" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ocean" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
        <filter id="shadow"><feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.3" /></filter>
      </defs>
      {/* Ocean background */}
      <rect width="320" height="200" rx="8" fill="url(#ocean)" />
      {/* Land masses */}
      <path d="M20 30 Q40 20 70 35 Q90 45 80 70 Q70 90 40 85 Q15 80 10 55 Q5 40 20 30Z" fill="#86efac" stroke="#22c55e" strokeWidth="1" />
      <path d="M230 110 Q260 95 290 105 Q310 115 305 145 Q295 170 265 175 Q240 170 235 150 Q228 130 230 110Z" fill="#86efac" stroke="#22c55e" strokeWidth="1" />
      {/* Route line */}
      <path d="M65 65 Q160 50 255 130" stroke="#1e40af" strokeWidth="2.5" strokeDasharray="8 4" fill="none" />
      {/* Distance label */}
      <rect x="130" y="65" width="60" height="24" rx="12" fill="white" filter="url(#shadow)" />
      <text x="160" y="82" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e40af">{distance} NM</text>
      {/* From point */}
      <circle cx="65" cy="65" r="8" fill="#ef4444" stroke="white" strokeWidth="2" />
      <circle cx="65" cy="65" r="3" fill="white" />
      <rect x="20" y="95" width="90" height="32" rx="4" fill="white" filter="url(#shadow)" />
      <text x="65" y="108" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0f172a">{from}</text>
      <text x="65" y="120" textAnchor="middle" fontSize="7" fill="#64748b">(Current Position)</text>
      {/* To point */}
      <circle cx="255" cy="130" r="8" fill="#22c55e" stroke="white" strokeWidth="2" />
      <circle cx="255" cy="130" r="3" fill="white" />
      <rect x="210" y="155" width="90" height="32" rx="4" fill="white" filter="url(#shadow)" />
      <text x="255" y="168" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0f172a">{to}</text>
      <text x="255" y="180" textAnchor="middle" fontSize="7" fill="#64748b">(Bunker Port)</text>
    </svg>
  )
}

// ---------- Dashboard ----------
function ProcDashboard() {
  const { s } = useStore()
  const prs = s.purchaseRequests
  return (
    <div>
      <h1 className="judul mb-5 text-[2rem] uppercase">Procurement Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total PR" value={prs.length} to="/procurement/request" />
        <Stat label="Pending Approval" value={prs.filter((p) => p.status.startsWith('pending')).length} />
        <Stat label="Approved" value={prs.filter((p) => p.status === 'approved').length} />
        <Stat label="Draft" value={prs.filter((p) => p.status === 'draft').length} />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Panel title="PR by Priority">
          <dl className="space-y-2">
            {(['Normal', 'Urgent', 'Critical'] as const).map((p) => {
              const count = prs.filter((r) => r.priority === p).length
              if (!count) return null
              return <div key={p} className="flex justify-between text-[15px]"><dt>{p}</dt><dd className="font-bold">{count}</dd></div>
            })}
          </dl>
        </Panel>
        <Panel title="PR by Status">
          <dl className="space-y-2">
            {['draft', 'pending_dept_head', 'pending_finance', 'pending_procurement', 'pending_management', 'approved', 'rejected'].map((st) => {
              const count = prs.filter((p) => p.status === st).length
              if (!count) return null
              return <div key={st} className="flex justify-between text-[15px]"><dt className="capitalize">{st.replace(/_/g, ' ')}</dt><dd className="font-bold">{count}</dd></div>
            })}
          </dl>
        </Panel>
      </div>
    </div>
  )
}

// ---------- Approval Steps ----------
const APPROVAL_LABELS = ['Request\n(Current)', 'Dept. Head\nApproval', 'Finance\nApproval', 'Procurement\nApproval', 'Management\nApproval', 'Closed']

function ApprovalWorkflow({ step, status }: { step: number; status: string }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {APPROVAL_LABELS.map((label, i) => {
        const done = status === 'approved' ? true : i < step
        const current = status !== 'approved' && status !== 'rejected' && i === step
        const rejected = status === 'rejected' && i === step
        return (
          <div key={i} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <div className={cx(
                'grid size-9 place-items-center rounded-full text-xs font-bold border-2',
                done ? 'bg-ok text-white border-ok' : current ? 'bg-accent text-white border-accent' : rejected ? 'bg-bad text-white border-bad' : 'bg-surface-2 text-ink-2 border-ink-3',
              )}>{i + 1}</div>
              <span className="mt-1 w-16 whitespace-pre-line text-center text-[10px] leading-tight text-ink-2">{label}</span>
            </div>
            {i < APPROVAL_LABELS.length - 1 && <div className={cx('h-0.5 w-8 shrink-0', done ? 'bg-ok' : 'bg-ink-3')} />}
          </div>
        )
      })}
    </div>
  )
}

// ---------- PR Status Badge ----------
const prTone: Record<string, Tone> = {
  draft: 'neutral', pending_dept_head: 'accent', pending_finance: 'accent',
  pending_procurement: 'accent', pending_management: 'accent', approved: 'ok', rejected: 'bad',
}

// ---------- PR Detail ----------
function PRDetailPage({ id }: { id: string }) {
  const { s, approvePR, rejectPR } = useStore()
  const pr = s.purchaseRequests.find((r) => r.id === id)
  if (!pr) return <div><BackButton to="/procurement/request" label="Purchase Request" /><Empty title="PR not found">The requested PR does not exist.</Empty></div>

  const robPercent = pr.fuelTankCapacity > 0 ? Math.round((pr.currentROB / pr.fuelTankCapacity) * 100) : 0

  return (
    <div>
      <BackButton to="/procurement/request" label="Purchase Request" />
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Inbox className="size-8 text-accent" />
          <h1 className="text-2xl font-bold text-ink">{pr.prNo}</h1>
          <Badge t={prTone[pr.status]}>{pr.status.replace(/_/g, ' ')}</Badge>
        </div>
        {pr.status.startsWith('pending') && (
          <div className="flex gap-2">
            <Button variant="danger" onClick={() => rejectPR(pr.id)}><XIcon className="size-4" /> Reject</Button>
            <Button onClick={() => approvePR(pr.id)}><Check className="size-4" /> Approve</Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* 1. General Information */}
        <div className={section}>
          <div className={sectionTitle}>1. General Information</div>
          <dl className="grid gap-4 p-4 sm:grid-cols-7 text-[13px]">
            <div><dt className="text-xs text-ink-2">PR Number</dt><dd className="font-bold">{pr.prNo}</dd></div>
            <div><dt className="text-xs text-ink-2">PR Date</dt><dd>{fmtDate(pr.prDate)}</dd></div>
            <div><dt className="text-xs text-ink-2">Request By</dt><dd>{pr.requestBy}</dd></div>
            <div><dt className="text-xs text-ink-2">Department</dt><dd>{pr.department}</dd></div>
            <div><dt className="text-xs text-ink-2">Priority</dt><dd><Badge t={pr.priority === 'Critical' ? 'bad' : pr.priority === 'Urgent' ? 'accent' : 'neutral'}>{pr.priority}</Badge></dd></div>
            <div><dt className="text-xs text-ink-2">Required Date</dt><dd>{fmtDate(pr.requiredDate)}</dd></div>
            <div><dt className="text-xs text-ink-2">Status</dt><dd><Badge t={prTone[pr.status]}>{pr.status.replace(/_/g, ' ')}</Badge></dd></div>
          </dl>
        </div>

        {/* 2. Reference Information */}
        <div className={section}>
          <div className={sectionTitle}>2. Reference Information</div>
          <dl className="grid gap-4 p-4 sm:grid-cols-5 text-[13px]">
            <div><dt className="text-xs text-ink-2">Job Order No.</dt><dd className="font-bold">{pr.jobOrderNo}</dd></div>
            <div><dt className="text-xs text-ink-2">Sales Order No.</dt><dd className="font-bold">{pr.salesOrderNo}</dd></div>
            <div><dt className="text-xs text-ink-2">Commercial Sheet No.</dt><dd className="font-bold">{pr.commercialSheetNo}</dd></div>
            <div><dt className="text-xs text-ink-2">Voyage No.</dt><dd>{pr.voyageNo}</dd></div>
            <div><dt className="text-xs text-ink-2">Contract / Customer</dt><dd>{pr.contractCustomer}</dd></div>
          </dl>
        </div>

        {/* 3 + 4 + 5 side by side */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* 3. Vessel & Position */}
          <div className={section}>
            <div className={sectionTitle}>3. Vessel & Position Information</div>
            <div className="p-4 space-y-3">
              <dl className="grid grid-cols-3 gap-2 text-[13px]">
                <div><dt className="text-xs text-ink-2">Vessel (TB)</dt><dd className="font-bold">{pr.vesselTB}</dd></div>
                <div><dt className="text-xs text-ink-2">Barge</dt><dd className="font-bold">{pr.barge}</dd></div>
                <div><dt className="text-xs text-ink-2">Current Location</dt><dd className="font-bold">{pr.currentLocation}</dd></div>
              </dl>
              <VesselIllustration />
              <dl className="space-y-1 text-[12px]">
                <div className="flex justify-between"><dt className="text-ink-2">Type</dt><dd>: {pr.vesselType}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-2">Main Engine</dt><dd>: {pr.mainEnginePower.toLocaleString()} HP</dd></div>
                <div className="flex justify-between"><dt className="text-ink-2">Main Engine Cons.</dt><dd>: {pr.mainEngineConsumption} L/hour</dd></div>
                <div className="flex justify-between"><dt className="text-ink-2">Particular Engine Cons.</dt><dd>: {pr.particularEngineConsumption} L/hour</dd></div>
                <div className="flex justify-between border-t border-line pt-1"><dt className="font-bold">Total Consumption</dt><dd className="font-bold">: {pr.totalConsumption} L/hour</dd></div>
              </dl>
            </div>
          </div>

          {/* 4. Current Fuel Status (ROB) */}
          <div className={section}>
            <div className={sectionTitle}>4. Current Fuel Status (ROB)</div>
            <div className="p-4 space-y-3">
              <dl className="grid grid-cols-2 gap-3 text-[13px]">
                <div><dt className="text-xs text-ink-2">Measurement Date/Time</dt><dd className="font-semibold">{pr.measurementDateTime}</dd></div>
                <div><dt className="text-xs text-ink-2">Current ROB</dt><dd className="font-bold text-accent">{pr.currentROB.toLocaleString()} Liter</dd></div>
              </dl>
              <dl className="grid grid-cols-2 gap-3 text-[13px]">
                <div><dt className="text-xs text-ink-2">Fuel Tank Capacity</dt><dd>{pr.fuelTankCapacity.toLocaleString()} Liter</dd></div>
                <div><dt className="text-xs text-ink-2">Available Capacity</dt><dd>{pr.availableCapacity.toLocaleString()} Liter</dd></div>
              </dl>
              <div>
                <div className="flex justify-between text-xs text-ink-2 mb-1"><span>0</span><span className="font-bold text-lg text-accent">{robPercent}%</span><span>{pr.fuelTankCapacity.toLocaleString()}</span></div>
                <div className="h-6 w-full overflow-hidden rounded-full bg-surface-2 border border-line">
                  <div className={cx('h-full rounded-full transition-all', robPercent > 50 ? 'bg-ok' : robPercent > 25 ? 'bg-yellow-400' : 'bg-bad')} style={{ width: `${robPercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Bunker Port & Route */}
          <div className={section}>
            <div className={sectionTitle}>5. Bunker Port & Route</div>
            <div className="p-4 space-y-3">
              <dl className="text-[13px] space-y-2">
                <div><dt className="text-xs text-ink-2">Bunker Port</dt><dd className="font-bold">{pr.bunkerPort}</dd></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><dt className="text-xs text-ink-2">Distance to Bunker Port</dt><dd>{pr.distanceToBunkerPort} NM</dd></div>
                  <div><dt className="text-xs text-ink-2">Estimated Speed</dt><dd>{pr.estimatedSpeed} Knot</dd></div>
                  <div><dt className="text-xs text-ink-2">Estimated Sailing Hours</dt><dd>{pr.estimatedSailingHours} Hours</dd></div>
                  <div><dt className="text-xs text-ink-2">Main Engine Cons.</dt><dd>{pr.mainEngineConsRoute} L/hour</dd></div>
                  <div><dt className="text-xs text-ink-2">Part. Engine Cons.</dt><dd>{pr.particularEngineConsRoute} L/hour</dd></div>
                  <div><dt className="text-xs text-ink-2">Est. Fuel Consumption</dt><dd className="font-bold text-accent">{pr.estimatedFuelConsumption.toLocaleString()} Liter</dd></div>
                </div>
              </dl>
              <RouteMap from={pr.currentLocation} to={pr.bunkerPort} distance={pr.distanceToBunkerPort} />
            </div>
          </div>
        </div>

        {/* 6 + 7 side by side */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={section}>
            <div className={sectionTitle}>6. Estimated ROB at Bunker Port</div>
            <dl className="space-y-2 p-4 text-[13px]">
              <div className="flex justify-between"><dt>Current ROB</dt><dd className="font-bold">{pr.currentROB.toLocaleString()} Liter</dd></div>
              <div className="flex justify-between"><dt>(-) Est. Consumption to Bunker Port</dt><dd>{pr.estConsumptionToBunkerPort.toLocaleString()} Liter</dd></div>
              <div className="flex justify-between border-t-2 border-accent pt-2"><dt className="font-bold text-accent">Estimated ROB at Arrival</dt><dd className="font-bold text-accent">{pr.estimatedROBAtArrival.toLocaleString()} Liter</dd></div>
            </dl>
          </div>
          <div className={section}>
            <div className={sectionTitle}>7. Bunker Requirement Calculation</div>
            <dl className="space-y-2 p-4 text-[13px]">
              <div className="flex justify-between"><dt>Target ROB After Bunkering</dt><dd className="font-bold">{pr.targetROBAfterBunkering.toLocaleString()} Liter</dd></div>
              <div className="flex justify-between"><dt>Estimated ROB at Arrival</dt><dd>{pr.estimatedROBAtArrival.toLocaleString()} Liter</dd></div>
              <div className="flex justify-between border-t-2 border-accent pt-2"><dt className="font-bold text-accent">Required Bunker Quantity</dt><dd className="font-bold text-accent text-lg">{pr.requiredBunkerQuantity.toLocaleString()} Liter</dd></div>
            </dl>
          </div>
        </div>

        {/* 8. Bunker Request Detail */}
        <div className={section}>
          <div className={sectionTitle}>8. Bunker Request Detail</div>
          <div className="p-4">
            <div className="overflow-x-auto rounded border border-line">
              <table className="w-full text-[13px]">
                <thead><tr className="border-b border-line bg-surface-2">
                  <th className="px-3 py-2 text-left font-bold w-12">No.</th>
                  <th className="px-3 py-2 text-left font-bold">Fuel Type</th>
                  <th className="px-3 py-2 text-right font-bold">Quantity (Liter)</th>
                  <th className="px-3 py-2 text-right font-bold">Est. Price (IDR/Liter)</th>
                  <th className="px-3 py-2 text-right font-bold">Estimated Amount (IDR)</th>
                  <th className="px-3 py-2 text-left font-bold">Remarks</th>
                </tr></thead>
                <tbody>
                  {pr.bunkerItems.map((it, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2">{it.fuelType}</td>
                      <td className="px-3 py-2 text-right">{it.quantity.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{it.estPrice.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-semibold">{idr(it.estimatedAmount)}</td>
                      <td className="px-3 py-2">{it.remarks}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t-2 border-ink bg-surface-2">
                  <td colSpan={4} className="px-3 py-2 font-bold text-right">Total Estimated Amount</td>
                  <td className="px-3 py-2 text-right font-bold text-accent text-base">{idr(pr.totalEstimatedAmount)}</td>
                  <td></td>
                </tr></tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* 9 + 10 side by side */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={section}>
            <div className={sectionTitle}>9. Supplier Information</div>
            <dl className="grid gap-3 p-4 sm:grid-cols-2 text-[13px]">
              <div><dt className="text-xs text-ink-2">Preferred Supplier</dt><dd className="font-bold">{pr.preferredSupplier}</dd></div>
              <div><dt className="text-xs text-ink-2">Supplier Contact</dt><dd>{pr.supplierContact}</dd></div>
              <div><dt className="text-xs text-ink-2">Phone Number</dt><dd>{pr.supplierPhone}</dd></div>
              <div><dt className="text-xs text-ink-2">Email</dt><dd>{pr.supplierEmail}</dd></div>
            </dl>
          </div>
          <div className={section}>
            <div className={sectionTitle}>10. Delivery / Service Details</div>
            <dl className="grid gap-3 p-4 sm:grid-cols-3 text-[13px]">
              <div><dt className="text-xs text-ink-2">Delivery Method</dt><dd>{pr.deliveryMethod}</dd></div>
              <div><dt className="text-xs text-ink-2">Delivery Location</dt><dd>{pr.deliveryLocation}</dd></div>
              <div><dt className="text-xs text-ink-2">Est. Delivery Date</dt><dd>{fmtDate(pr.estimatedDeliveryDate)}</dd></div>
              <div><dt className="text-xs text-ink-2">Est. Delivery Time</dt><dd>{pr.estimatedDeliveryTime}</dd></div>
              <div><dt className="text-xs text-ink-2">PIC at Location</dt><dd>{pr.picAtLocation}</dd></div>
              <div><dt className="text-xs text-ink-2">Phone Number</dt><dd>{pr.picPhone}</dd></div>
            </dl>
          </div>
        </div>

        {pr.remarks && (
          <div className={section}>
            <div className={sectionTitle}>12. Remarks</div>
            <div className="p-4 text-[13px]">{pr.remarks}</div>
          </div>
        )}

        {/* 13. Approval Workflow */}
        <div className={section}>
          <div className={sectionTitle}>13. Approval Workflow</div>
          <div className="flex justify-center p-6">
            <ApprovalWorkflow step={pr.approvalStep} status={pr.status} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- PR Create (matches screenshot exactly) ----------
function PRCreatePage() {
  const { s, addPurchaseRequest } = useStore()
  const nav = useNavigate()

  const [f, setF] = useState({
    requestBy: 'Budi Santoso', department: 'Operation', priority: 'Normal' as const,
    requiredDate: '', jobOrderNo: '', salesOrderNo: '', commercialSheetNo: '',
    voyageNo: '', contractCustomer: '', vesselTB: 'TB Taboneo', barge: 'BG-001', currentLocation: 'Tg. Tiram',
    mainEnginePower: 2000, mainEngineConsumption: 120, particularEngineConsumption: 25,
    measurementDateTime: `${TODAY} 08:00`, currentROB: 20000, fuelTankCapacity: 60000,
    bunkerPort: 'Sungai Danau', distanceToBunkerPort: 100, estimatedSpeed: 3,
    targetROBAfterBunkering: 45000,
    preferredSupplier: 'PT Pertamina', supplierContact: 'Andi Wijaya', supplierPhone: '0812 3456 7890', supplierEmail: 'andi.wijaya@pertamina.co.id',
    deliveryMethod: 'Barge to Vessel', deliveryLocation: 'Sungai Danau Jetty', estimatedDeliveryDate: '',
    estimatedDeliveryTime: '08:00', picAtLocation: 'Agus Kurniawan', picPhone: '0813 9876 5432', remarks: '',
  })
  const up = (k: string, v: any) => setF((prev) => ({ ...prev, [k]: v }))

  // Dynamic fuel items
  const [fuelItems, setFuelItems] = useState<{ fuelType: string; quantity: number; estPrice: number; remarks: string }[]>([
    { fuelType: 'MGO / Solar', quantity: 0, estPrice: 22000, remarks: '' },
    { fuelType: 'MGO / Solar', quantity: 5000, estPrice: 22000, remarks: 'Additional / Contingency' },
  ])
  const addFuelItem = () => setFuelItems((prev) => [...prev, { fuelType: 'MGO / Solar', quantity: 0, estPrice: 22000, remarks: '' }])
  const removeFuelItem = (i: number) => setFuelItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateFuelItem = (i: number, k: string, v: any) => setFuelItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it))

  const totalCons = f.mainEngineConsumption + f.particularEngineConsumption
  const sailingHours = f.estimatedSpeed > 0 ? +(f.distanceToBunkerPort / f.estimatedSpeed).toFixed(2) : 0
  const fuelConsumption = Math.round(sailingHours * totalCons)
  const availableCapacity = f.fuelTankCapacity - f.currentROB
  const robAtArrival = f.currentROB - fuelConsumption
  const requiredBunker = Math.max(0, f.targetROBAfterBunkering - robAtArrival)
  const robPercent = f.fuelTankCapacity > 0 ? Math.round((f.currentROB / f.fuelTankCapacity) * 100) : 0

  // Auto-set first fuel item quantity to required bunker
  const effectiveItems = fuelItems.map((it, i) => ({
    ...it,
    quantity: i === 0 ? requiredBunker : it.quantity,
    remarks: i === 0 && !it.remarks ? `Bunker di ${f.bunkerPort}` : it.remarks,
  }))
  const totalAmt = effectiveItems.reduce((s, it) => s + it.quantity * it.estPrice, 0)

  const handleSubmit = (asDraft: boolean) => {
    const items: BunkerRequestItem[] = effectiveItems.map((it) => ({
      fuelType: it.fuelType, quantity: it.quantity, estPrice: it.estPrice,
      estimatedAmount: it.quantity * it.estPrice, remarks: it.remarks,
    }))
    addPurchaseRequest({
      prDate: TODAY, requestBy: f.requestBy, department: f.department,
      priority: f.priority, requiredDate: f.requiredDate,
      status: asDraft ? 'draft' : 'pending_dept_head',
      jobOrderNo: f.jobOrderNo, salesOrderNo: f.salesOrderNo,
      commercialSheetNo: f.commercialSheetNo, voyageNo: f.voyageNo,
      contractCustomer: f.contractCustomer,
      vesselTB: f.vesselTB, barge: f.barge, currentLocation: f.currentLocation,
      vesselType: 'Tug Boat', mainEnginePower: f.mainEnginePower,
      mainEngineConsumption: f.mainEngineConsumption,
      particularEngineConsumption: f.particularEngineConsumption,
      totalConsumption: totalCons,
      measurementDateTime: f.measurementDateTime, currentROB: f.currentROB,
      fuelTankCapacity: f.fuelTankCapacity, availableCapacity,
      bunkerPort: f.bunkerPort, distanceToBunkerPort: f.distanceToBunkerPort,
      estimatedSpeed: f.estimatedSpeed, estimatedSailingHours: sailingHours,
      mainEngineConsRoute: f.mainEngineConsumption,
      particularEngineConsRoute: f.particularEngineConsumption,
      estimatedFuelConsumption: fuelConsumption,
      estConsumptionToBunkerPort: fuelConsumption,
      estimatedROBAtArrival: robAtArrival,
      targetROBAfterBunkering: f.targetROBAfterBunkering,
      requiredBunkerQuantity: requiredBunker,
      bunkerItems: items, totalEstimatedAmount: totalAmt,
      preferredSupplier: f.preferredSupplier, supplierContact: f.supplierContact,
      supplierPhone: f.supplierPhone, supplierEmail: f.supplierEmail,
      deliveryMethod: f.deliveryMethod, deliveryLocation: f.deliveryLocation,
      estimatedDeliveryDate: f.estimatedDeliveryDate,
      estimatedDeliveryTime: f.estimatedDeliveryTime,
      picAtLocation: f.picAtLocation, picPhone: f.picPhone,
      remarks: f.remarks, approvalStep: asDraft ? 0 : 1,
    })
    nav('/procurement/request')
  }

  return (
    <div>
      <BackButton to="/procurement/request" label="Purchase Request" />
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3"><Inbox className="size-8 text-accent" /><h1 className="text-2xl font-bold text-ink">New Purchase Request</h1></div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => nav('/procurement/request')}>Cancel</Button>
          <Button variant="secondary" onClick={() => handleSubmit(true)}>Save Draft</Button>
          <Button onClick={() => handleSubmit(false)}><Check className="size-4" /> Submit for Approval</Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* 1. General Information */}
        <div className={section}>
          <div className={sectionTitle}>1. General Information</div>
          <div className="grid gap-3 p-4 sm:grid-cols-7 text-[13px]">
            <Field label="PR Number *"><Input value="(Auto-generated)" disabled className="bg-surface-2" /></Field>
            <Field label="PR Date *"><Input type="date" value={TODAY} disabled className="bg-surface-2" /></Field>
            <Field label="Request By *">
              <div className="relative"><Input value={f.requestBy} onChange={(e) => up('requestBy', e.target.value)} className="pl-8" /><Users className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-ink-2" /></div>
            </Field>
            <Field label="Department"><Input value={f.department} disabled className="bg-surface-2" /></Field>
            <Field label="Priority *">
              <Select value={f.priority} onChange={(e) => up('priority', e.target.value)}>
                <option value="Normal">Normal</option><option value="Urgent">Urgent</option><option value="Critical">Critical</option>
              </Select>
            </Field>
            <Field label="Required Date *"><Input type="date" value={f.requiredDate} onChange={(e) => up('requiredDate', e.target.value)} /></Field>
            <Field label="Status"><Badge t="neutral">Draft</Badge></Field>
          </div>
        </div>

        {/* 2. Reference Information */}
        <div className={section}>
          <div className={sectionTitle}>2. Reference Information</div>
          <div className="grid gap-3 p-4 sm:grid-cols-5 text-[13px]">
            <Field label="Job Order No."><div className="relative"><Input value={f.jobOrderNo} onChange={(e) => up('jobOrderNo', e.target.value)} className="pr-8" /><Search className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-ink-3" /></div></Field>
            <Field label="Sales Order No."><div className="relative"><Input value={f.salesOrderNo} onChange={(e) => up('salesOrderNo', e.target.value)} className="pr-8" /><Search className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-ink-3" /></div></Field>
            <Field label="Commercial Sheet No."><div className="relative"><Input value={f.commercialSheetNo} onChange={(e) => up('commercialSheetNo', e.target.value)} className="pr-8" /><Search className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-ink-3" /></div></Field>
            <Field label="Voyage No."><div className="relative"><Input value={f.voyageNo} onChange={(e) => up('voyageNo', e.target.value)} className="pr-8" /><Search className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-ink-3" /></div></Field>
            <Field label="Contract / Customer"><div className="relative"><Input value={f.contractCustomer} onChange={(e) => up('contractCustomer', e.target.value)} className="pr-8" /><Search className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-ink-3" /></div></Field>
          </div>
        </div>

        {/* 3 + 4 + 5 side by side */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* 3. Vessel & Position Information */}
          <div className={section}>
            <div className={sectionTitle}>3. Vessel & Position Information</div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Field label="Vessel (TB) *"><div className="relative"><Input value={f.vesselTB} onChange={(e) => up('vesselTB', e.target.value)} className="pr-8 text-[13px]" /><Search className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-ink-3" /></div></Field>
                <Field label="Barge"><div className="relative"><Input value={f.barge} onChange={(e) => up('barge', e.target.value)} className="pr-8 text-[13px]" /><Search className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-ink-3" /></div></Field>
                <Field label="Current Location *"><div className="relative"><Input value={f.currentLocation} onChange={(e) => up('currentLocation', e.target.value)} className="pr-8 text-[13px]" /><Search className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-ink-3" /></div></Field>
              </div>
              <VesselIllustration />
              <dl className="space-y-1 text-[12px]">
                <div className="flex justify-between"><dt className="text-ink-2">Type</dt><dd>: Tug Boat</dd></div>
                <div className="flex justify-between"><dt className="text-ink-2">Main Engine</dt><dd>: <input type="number" value={f.mainEnginePower} onChange={(e) => up('mainEnginePower', Number(e.target.value))} className="w-16 rounded border border-line px-1 text-right text-[12px]" /> HP</dd></div>
                <div className="flex justify-between"><dt className="text-ink-2">Main Engine Cons.</dt><dd>: <input type="number" value={f.mainEngineConsumption} onChange={(e) => up('mainEngineConsumption', Number(e.target.value))} className="w-16 rounded border border-line px-1 text-right text-[12px]" /> L/hour</dd></div>
                <div className="flex justify-between"><dt className="text-ink-2">Particular Engine Cons.</dt><dd>: <input type="number" value={f.particularEngineConsumption} onChange={(e) => up('particularEngineConsumption', Number(e.target.value))} className="w-16 rounded border border-line px-1 text-right text-[12px]" /> L/hour</dd></div>
                <div className="flex justify-between border-t border-line pt-1 font-bold"><dt>Total Consumption</dt><dd>: {totalCons} L/hour</dd></div>
              </dl>
            </div>
          </div>

          {/* 4. Current Fuel Status (ROB) */}
          <div className={section}>
            <div className={sectionTitle}>4. Current Fuel Status (ROB)</div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Measurement Date/Time *"><Input value={f.measurementDateTime} onChange={(e) => up('measurementDateTime', e.target.value)} className="text-[13px]" /></Field>
                <Field label="Current ROB *"><div className="flex items-center gap-1"><Input type="number" value={f.currentROB} onChange={(e) => up('currentROB', Number(e.target.value))} className="text-[13px]" /><span className="shrink-0 text-[11px] text-ink-2">Liter</span></div></Field>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div><span className="text-xs text-ink-2">Fuel Tank Capacity</span><div className="font-semibold">{f.fuelTankCapacity.toLocaleString()} Liter</div></div>
                <div><span className="text-xs text-ink-2">Available Capacity</span><div className="font-semibold">{availableCapacity.toLocaleString()} Liter</div></div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-ink-2 mb-1"><span>0</span><span className="font-bold text-lg text-accent">{robPercent}%</span><span>{f.fuelTankCapacity.toLocaleString()}</span></div>
                <div className="h-6 w-full overflow-hidden rounded-full bg-surface-2 border border-line">
                  <div className={cx('h-full rounded-full transition-all', robPercent > 50 ? 'bg-ok' : robPercent > 25 ? 'bg-yellow-400' : 'bg-bad')} style={{ width: `${robPercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Bunker Port & Route */}
          <div className={section}>
            <div className={sectionTitle}>5. Bunker Port & Route</div>
            <div className="p-4 space-y-3">
              <Field label="Bunker Port *"><div className="relative"><Input value={f.bunkerPort} onChange={(e) => up('bunkerPort', e.target.value)} className="pr-8 text-[13px]" /><Search className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-ink-3" /></div></Field>
              <div className="grid grid-cols-2 gap-2 text-[13px]">
                <Field label="Distance to Bunker Port"><div className="flex items-center gap-1"><Input type="number" value={f.distanceToBunkerPort} onChange={(e) => up('distanceToBunkerPort', Number(e.target.value))} className="text-[13px]" /><span className="shrink-0 text-[11px]">NM</span></div></Field>
                <Field label="Estimated Speed"><div className="flex items-center gap-1"><Input type="number" step="0.5" value={f.estimatedSpeed} onChange={(e) => up('estimatedSpeed', Number(e.target.value))} className="text-[13px]" /><span className="shrink-0 text-[11px]">Knot</span></div></Field>
                <div><span className="text-xs text-ink-2">Estimated Sailing Hours</span><div className="font-bold">{sailingHours} Hours</div></div>
                <div><span className="text-xs text-ink-2">Main Engine Cons.</span><div>{f.mainEngineConsumption} L/hour</div></div>
                <div><span className="text-xs text-ink-2">Part. Engine Cons.</span><div>{f.particularEngineConsumption} L/hour</div></div>
                <div><span className="text-xs text-ink-2">Est. Fuel Consumption</span><div className="font-bold text-accent">{fuelConsumption.toLocaleString()} Liter</div></div>
              </div>
              <RouteMap from={f.currentLocation || 'Current'} to={f.bunkerPort || 'Bunker Port'} distance={f.distanceToBunkerPort} />
            </div>
          </div>
        </div>

        {/* 6 + 7 side by side */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={section}>
            <div className={sectionTitle}>6. Estimated ROB at Bunker Port</div>
            <dl className="space-y-2 p-4 text-[13px]">
              <div className="flex justify-between"><dt>Current ROB</dt><dd className="font-bold">{f.currentROB.toLocaleString()} Liter</dd></div>
              <div className="flex justify-between"><dt>(-) Est. Consumption to Bunker Port</dt><dd>{fuelConsumption.toLocaleString()} Liter</dd></div>
              <div className="flex justify-between border-t-2 border-accent pt-2"><dt className="font-bold text-accent">Estimated ROB at Arrival</dt><dd className="font-bold text-accent">{robAtArrival.toLocaleString()} Liter</dd></div>
            </dl>
          </div>
          <div className={section}>
            <div className={sectionTitle}>7. Bunker Requirement Calculation</div>
            <div className="p-4 space-y-3">
              <Field label="Target ROB After Bunkering *"><div className="flex items-center gap-1"><Input type="number" value={f.targetROBAfterBunkering} onChange={(e) => up('targetROBAfterBunkering', Number(e.target.value))} className="text-[13px]" /><span className="shrink-0 text-[11px]">Liter</span></div></Field>
              <dl className="space-y-2 text-[13px]">
                <div className="flex justify-between"><dt>Estimated ROB at Arrival</dt><dd>{robAtArrival.toLocaleString()} Liter</dd></div>
                <div className="flex justify-between border-t-2 border-accent pt-2"><dt className="font-bold text-accent">Required Bunker Quantity</dt><dd className="font-bold text-accent text-lg">{requiredBunker.toLocaleString()} Liter</dd></div>
              </dl>
            </div>
          </div>
        </div>

        {/* 8. Bunker Request Detail (dynamic rows) */}
        <div className={section}>
          <div className={sectionTitle}>8. Bunker Request Detail</div>
          <div className="p-4">
            <div className="overflow-x-auto rounded border border-line">
              <table className="w-full text-[13px]">
                <thead><tr className="border-b border-line bg-surface-2">
                  <th className="px-3 py-2 text-left font-bold w-12">No.</th>
                  <th className="px-3 py-2 text-left font-bold">Fuel Type</th>
                  <th className="px-3 py-2 text-right font-bold">Quantity (Liter)</th>
                  <th className="px-3 py-2 text-right font-bold">Est. Price (IDR/Liter)</th>
                  <th className="px-3 py-2 text-right font-bold">Estimated Amount (IDR)</th>
                  <th className="px-3 py-2 text-left font-bold">Remarks</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr></thead>
                <tbody>
                  {effectiveItems.map((it, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-1">
                        <Select value={it.fuelType} onChange={(e) => updateFuelItem(i, 'fuelType', e.target.value)} className="text-[13px] h-8">
                          <option value="MGO / Solar">MGO / Solar</option><option value="HFO">HFO</option><option value="MDO">MDO</option>
                        </Select>
                      </td>
                      <td className="px-3 py-1"><Input type="number" value={it.quantity} onChange={(e) => updateFuelItem(i, 'quantity', Number(e.target.value))} className="text-right text-[13px] h-8" disabled={i === 0} /></td>
                      <td className="px-3 py-1"><Input type="number" value={it.estPrice} onChange={(e) => updateFuelItem(i, 'estPrice', Number(e.target.value))} className="text-right text-[13px] h-8" /></td>
                      <td className="px-3 py-2 text-right font-semibold">{idr(it.quantity * it.estPrice)}</td>
                      <td className="px-3 py-1"><Input value={it.remarks} onChange={(e) => updateFuelItem(i, 'remarks', e.target.value)} className="text-[13px] h-8" /></td>
                      <td className="px-3 py-1">{fuelItems.length > 1 && <button onClick={() => removeFuelItem(i)} className="text-bad hover:text-bad/80"><Trash2 className="size-4" /></button>}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t-2 border-ink bg-surface-2">
                  <td colSpan={4} className="px-3 py-2 font-bold text-right">Total Estimated Amount</td>
                  <td className="px-3 py-2 text-right font-bold text-accent text-base">{idr(totalAmt)}</td>
                  <td colSpan={2}></td>
                </tr></tfoot>
              </table>
            </div>
            <button onClick={addFuelItem} className="mt-3 flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"><Plus className="size-4" /> Add Fuel Item</button>
          </div>
        </div>

        {/* 9 + 10 side by side */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={section}>
            <div className={sectionTitle}>9. Supplier Information</div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 text-[13px]">
              <Field label="Preferred Supplier *"><div className="relative"><Input value={f.preferredSupplier} onChange={(e) => up('preferredSupplier', e.target.value)} className="pr-8 text-[13px]" /><Search className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-ink-3" /></div></Field>
              <Field label="Supplier Contact"><Input value={f.supplierContact} onChange={(e) => up('supplierContact', e.target.value)} className="text-[13px]" /></Field>
              <Field label="Phone Number"><Input value={f.supplierPhone} onChange={(e) => up('supplierPhone', e.target.value)} className="text-[13px]" /></Field>
              <Field label="Email"><Input value={f.supplierEmail} onChange={(e) => up('supplierEmail', e.target.value)} className="text-[13px]" /></Field>
            </div>
          </div>
          <div className={section}>
            <div className={sectionTitle}>10. Delivery / Service Details</div>
            <div className="grid gap-3 p-4 sm:grid-cols-3 text-[13px]">
              <Field label="Delivery Method">
                <Select value={f.deliveryMethod} onChange={(e) => up('deliveryMethod', e.target.value)} className="text-[13px]">
                  <option value="Barge to Vessel">Barge to Vessel</option><option value="Truck to Jetty">Truck to Jetty</option><option value="Pipeline">Pipeline</option>
                </Select>
              </Field>
              <Field label="Delivery Location"><div className="relative"><Input value={f.deliveryLocation} onChange={(e) => up('deliveryLocation', e.target.value)} className="pr-8 text-[13px]" /><Search className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-ink-3" /></div></Field>
              <Field label="Est. Delivery Date *"><Input type="date" value={f.estimatedDeliveryDate} onChange={(e) => up('estimatedDeliveryDate', e.target.value)} className="text-[13px]" /></Field>
              <Field label="Est. Delivery Time"><Input type="time" value={f.estimatedDeliveryTime} onChange={(e) => up('estimatedDeliveryTime', e.target.value)} className="text-[13px]" /></Field>
              <Field label="PIC at Location"><Input value={f.picAtLocation} onChange={(e) => up('picAtLocation', e.target.value)} className="text-[13px]" /></Field>
              <Field label="Phone Number"><Input value={f.picPhone} onChange={(e) => up('picPhone', e.target.value)} className="text-[13px]" /></Field>
            </div>
          </div>
        </div>

        {/* 11. Attachment */}
        <div className={section}>
          <div className={sectionTitle}>11. Attachment</div>
          <div className="p-4">
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink-3 bg-surface-2 px-6 py-8 text-center hover:border-accent transition-colors cursor-pointer">
              <Upload className="size-10 text-ink-3 mb-2" />
              <p className="text-sm font-semibold text-ink">Drag & drop file here or click to upload</p>
              <p className="text-xs text-ink-2 mt-1">(Quotation, Bunker Plan, ROB Report, Route Map, Supporting Document)</p>
            </div>
          </div>
        </div>

        {/* 12. Remarks */}
        <div className={section}>
          <div className={sectionTitle}>12. Remarks</div>
          <div className="p-4">
            <Textarea value={f.remarks} onChange={(e) => up('remarks', e.target.value)} placeholder="Permintaan bunker untuk TB Taboneo sebelum voyage Sungai Danau - Cilegon..." maxLength={500} className="text-[13px]" />
            <div className="mt-1 text-right text-xs text-ink-2">{f.remarks.length}/500</div>
          </div>
        </div>

        {/* 13. Approval Workflow */}
        <div className={section}>
          <div className={sectionTitle}>13. Approval Workflow</div>
          <div className="flex justify-center p-6">
            <ApprovalWorkflow step={0} status="draft" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- PR List ----------
function PRListPage() {
  const { s } = useStore()
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const rows = useMemo(() => {
    const term = q.toLowerCase()
    return s.purchaseRequests.filter((r) => !term || r.prNo.toLowerCase().includes(term) || r.vesselTB.toLowerCase().includes(term) || r.contractCustomer.toLowerCase().includes(term))
  }, [s.purchaseRequests, q])

  const cols: Col<PurchaseRequest>[] = [
    { key: 'no', header: 'PR No', cell: (r) => <span className="font-semibold text-accent">{r.prNo}</span>, mobile: 'title' },
    { key: 'vessel', header: 'Vessel', cell: (r) => `${r.vesselTB} / ${r.barge}` },
    { key: 'customer', header: 'Customer', cell: (r) => r.contractCustomer },
    { key: 'priority', header: 'Priority', cell: (r) => <Badge t={r.priority === 'Critical' ? 'bad' : r.priority === 'Urgent' ? 'accent' : 'neutral'}>{r.priority}</Badge> },
    { key: 'amount', header: 'Total', cell: (r) => idr(r.totalEstimatedAmount), className: 'text-right' },
    { key: 'date', header: 'PR Date', cell: (r) => fmtDate(r.prDate) },
    { key: 'status', header: 'Status', cell: (r) => <Badge t={prTone[r.status]}>{r.status.replace(/_/g, ' ')}</Badge> },
  ]

  return (
    <div>
      <PageHeader title="Purchase Request" lead="Bunker purchase requests from operations" actions={<Link to="/procurement/request/create"><Button><Plus className="size-4" /> New Purchase Request</Button></Link>} />
      <Toolbar><SearchBox value={q} onChange={setQ} placeholder="Search PR, vessel or customer..." /></Toolbar>
      <Table rows={rows} cols={cols} rowKey={(r) => r.id} onRow={(r) => nav(`/procurement/request/${r.id}`)} />
    </div>
  )
}

// ---------- Placeholder pages ----------
function ComingSoon({ title }: { title: string }) {
  return <div><PageHeader title={title} lead="This feature is under development" /><Empty title="Coming Soon">This section will be available in the next phase.</Empty></div>
}

// ---------- Main ----------
export default function ProcurementModule() {
  const { pathname } = useLocation()
  const rest = pathname.replace(/^\/procurement\/?/, '')
  const segments = rest.split('/')
  const feature = segments[0] || 'dashboard'
  const sub = segments[1] || ''
  const active = NAV.find((n) => n.path === `/procurement/${feature}`)?.key ?? 'dashboard'

  let content: JSX.Element
  switch (feature) {
    case 'request':
      content = sub === 'create' ? <PRCreatePage /> : sub ? <PRDetailPage id={sub} /> : <PRListPage />
      break
    case 'vendor': content = <ComingSoon title="Vendor Selection" />; break
    case 'order': content = <ComingSoon title="Purchase Order" />; break
    case 'delivery': content = <ComingSoon title="Monitor Delivery" />; break
    case 'doc-support':
      content = sub === 'renewal' ? <ComingSoon title="Certificate Renewal" />
        : sub === 'permit' ? <ComingSoon title="Permit & License" />
        : sub === 'documentation' ? <ComingSoon title="Documentation" />
        : sub === 'vendor-service' ? <ComingSoon title="Vendor Service" />
        : <ComingSoon title="Document Support" />
      break
    default: content = <ProcDashboard />
  }

  return <ProcModuleShell active={active} pathname={pathname}>{content}</ProcModuleShell>
}
