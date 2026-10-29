import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Anchor, BarChart3, Building2, CalendarCheck, ChevronDown, ClipboardCheck,
  ClipboardList, Clock, FileCheck2, FileStack, Fuel, Gauge, LayoutDashboard,
  ListChecks, MapPin, Package, Radar, Route, Settings, Shield, Ship,
  SlidersHorizontal, Truck, Users, UsersRound, Wrench,
  type LucideIcon,
} from 'lucide-react'
import { useStore } from '../../store'
import { cx, Empty, ModuleFooter, PageHeader, Panel, Stat } from '../../components/ui'
import { Guard } from '../../components/Shell'

import { VesselList, VesselDetail, PairManager } from '../doc-asset/Vessels'
import { CrewList, CrewDetail, Composition } from '../crewing/Crew'
import { DocumentList, DocumentDetail, DocumentTypes, RequiredDocs } from '../documents/Documents'

interface NavItem { key: string; label: string; icon: LucideIcon; path: string }
interface NavGroup { key: string; label: string; icon: LucideIcon; items: NavItem[] }

const GROUPS: NavGroup[] = [
  { key: 'crewing', label: 'Crewing', icon: Users, items: [
    { key: 'crew', label: 'Crew Master', icon: UsersRound, path: '/operations/crew' },
    { key: 'composition', label: 'Assignment & Manning', icon: ClipboardList, path: '/operations/crew/composition' },
  ]},
  { key: 'doc-asset', label: 'Documents Asset TB & BG', icon: Ship, items: [
    { key: 'vessels', label: 'Vessel Profile', icon: Ship, path: '/operations/vessels' },
    { key: 'pairs', label: 'TB/BG Pairs', icon: Anchor, path: '/operations/vessels/pairs' },
    { key: 'documents', label: 'Vessel Certificate', icon: FileStack, path: '/operations/documents' },
    { key: 'doc-types', label: 'Asset Document', icon: SlidersHorizontal, path: '/operations/documents/types' },
    { key: 'doc-rules', label: 'Regulatory Compliance', icon: FileCheck2, path: '/operations/documents/rules' },
  ]},
  { key: 'bunker', label: 'Bunker', icon: Fuel, items: [
    { key: 'fuel-planning', label: 'Fuel Planning', icon: ClipboardList, path: '/operations/bunker/planning' },
    { key: 'fuel-delivery', label: 'Purchase & Delivery', icon: Truck, path: '/operations/bunker/delivery' },
    { key: 'consumption', label: 'Consumption', icon: BarChart3, path: '/operations/bunker/consumption' },
    { key: 'stock', label: 'Stock Monitoring', icon: Gauge, path: '/operations/bunker/stock' },
  ]},
  { key: 'traffic', label: 'Traffic', icon: Radar, items: [
    { key: 'voyage', label: 'Voyage Planning', icon: Route, path: '/operations/traffic/voyage' },
    { key: 'tracking', label: 'Vessel Tracking', icon: MapPin, path: '/operations/traffic/tracking' },
    { key: 'miles', label: 'Nautical Miles', icon: Radar, path: '/operations/traffic/miles' },
    { key: 'reporting', label: 'ETA & Reporting', icon: Clock, path: '/operations/traffic/reporting' },
  ]},
  { key: 'maintenance', label: 'Maintenance & Repair', icon: Wrench, items: [
    { key: 'maint-plan', label: 'Maintenance Plan', icon: CalendarCheck, path: '/operations/maintenance/plan' },
    { key: 'work-order', label: 'Work Order', icon: ClipboardCheck, path: '/operations/maintenance/work-order' },
    { key: 'spare-parts', label: 'Spare Parts', icon: Settings, path: '/operations/maintenance/spare-parts' },
    { key: 'progress', label: 'Repair Progress', icon: ListChecks, path: '/operations/maintenance/progress' },
    { key: 'cost', label: 'Cost Control', icon: BarChart3, path: '/operations/maintenance/cost' },
  ]},
  { key: 'keagenan', label: 'Port Agency & Logistics', icon: Building2, items: [
    { key: 'agency', label: 'Port Agency', icon: Building2, path: '/operations/keagenan/agency' },
    { key: 'clearance', label: 'Clearance', icon: Shield, path: '/operations/keagenan/clearance' },
    { key: 'logistics', label: 'Logistics', icon: Package, path: '/operations/keagenan/logistics' },
    { key: 'supply', label: 'Supply to Vessel', icon: Ship, path: '/operations/keagenan/supply' },
  ]},
]

const GROUP_PERM: Record<string, string> = {
  crewing: 'crew.read', 'doc-asset': 'asset.read', bunker: 'bunker.read',
  traffic: 'traffic.read', maintenance: 'maintenance.read', keagenan: 'keagenan.read',
}

function SidebarContent({ pathname, onNav, collapsed }: { pathname: string; onNav?: () => void; collapsed?: boolean }) {
  const { can } = useStore()
  const groups = GROUPS.filter((g) => can(GROUP_PERM[g.key]))
  const initOpen = groups.filter((g) => g.items.some((it) => pathname.startsWith(it.path))).map((g) => g.key)
  const [open, setOpen] = useState<Set<string>>(new Set(initOpen.length ? initOpen : groups.length ? [groups[0].key] : []))
  const toggle = (key: string) => setOpen((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  const isDashboard = pathname === '/operations/dashboard' || pathname === '/operations' || pathname === '/operations/'

  return (
    <div className="space-y-0.5">
      <Link to="/operations/dashboard" onClick={onNav} title="Dashboard" className={cx(
        'flex items-center gap-2.5 rounded-lg py-2.5 text-[15px] font-semibold transition-colors',
        collapsed ? 'justify-center px-0' : 'px-3',
        isDashboard ? 'bg-accent text-white' : 'text-[var(--color-nav-ink)] hover:bg-white/10',
      )}><LayoutDashboard className="size-4 shrink-0" />{!collapsed && ' Dashboard'}</Link>
      {groups.map((g) => {
        const Icon = g.icon
        const isOpen = open.has(g.key)
        const active = g.items.some((it) => pathname.startsWith(it.path))
        if (collapsed) return (
          <button key={g.key} title={g.label} onClick={() => window.dispatchEvent(new Event('toggle-module-sidebar'))} className={cx(
            'flex w-full items-center justify-center rounded-lg py-2.5 transition-colors',
            active ? 'text-accent' : 'text-[var(--color-nav-ink)] hover:bg-white/10',
          )}><Icon className="size-4" /></button>
        )
        return (
          <div key={g.key}>
            <button onClick={() => toggle(g.key)} className={cx(
              'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-bold transition-colors',
              active ? 'text-accent' : 'text-[var(--color-nav-ink)] hover:bg-white/10',
            )}>
              <Icon className="size-4 shrink-0" />
              <span className="flex-1 text-left truncate">{g.label}</span>
              <ChevronDown className={cx('size-4 shrink-0 transition-transform', isOpen && 'rotate-180')} />
            </button>
            {isOpen && (
              <div className="ml-4 space-y-0.5 border-l-2 border-white/20 pl-2">
                {g.items.map((it) => {
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
      })}
    </div>
  )
}

function ModuleShell({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const h = () => setOpen((o) => !o)
    window.addEventListener('toggle-module-sidebar', h)
    return () => window.removeEventListener('toggle-module-sidebar', h)
  }, [])
  return (
    <div className="flex min-h-0 w-full flex-1">
      <nav className={cx('hidden shrink-0 overflow-y-auto bg-[var(--color-nav)] transition-[width] lg:block', open ? 'w-56 p-3' : 'w-16 p-2')} aria-label="Operations menu">
        <SidebarContent pathname={pathname} collapsed={!open} />
      </nav>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
          <nav className="fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto bg-[var(--color-nav)] p-4 pt-6 shadow-2xl lg:hidden" aria-label="Operations menu">
            <SidebarContent pathname={pathname} onNav={() => setOpen(false)} />
          </nav>
        </>
      )}
      <div className="min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">{children}<ModuleFooter /></div>
    </div>
  )
}

function OpsDashboard() {
  const { s, can } = useStore()
  const asset = can('asset.read')
  const crew = can('crew.read')
  return (
    <div>
      <h1 className="judul mb-5 text-[2rem] uppercase">Operational Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {asset && <Stat label="Total Vessels" value={s.vessels.length} to="/operations/vessels" />}
        {crew && <Stat label="Total Crew" value={s.crew.length} to="/operations/crew" />}
        {asset && <Stat label="Active Documents" value={s.docs.filter((d) => d.isCurrent).length} to="/operations/documents" />}
        {asset && <Stat label="Active Pairs" value={s.pairs.filter((p) => !p.end).length} to="/operations/vessels/pairs" />}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {asset && <Panel title="Vessel Status">
          <dl className="space-y-2">
            {(['operating', 'standby', 'docking', 'repair'] as const).map((st) => {
              const count = s.vessels.filter((v) => v.opStatus === st).length
              if (!count) return null
              return <div key={st} className="flex justify-between text-[15px]"><dt className="capitalize">{st}</dt><dd className="font-bold">{count}</dd></div>
            })}
          </dl>
        </Panel>}
        {crew && <Panel title="Crew Status">
          <dl className="space-y-2">
            {(['on_duty', 'leave', 'standby', 'inactive'] as const).map((st) => {
              const count = s.crew.filter((c) => c.status === st).length
              if (!count) return null
              return <div key={st} className="flex justify-between text-[15px]"><dt className="capitalize">{st.replace(/_/g, ' ')}</dt><dd className="font-bold">{count}</dd></div>
            })}
          </dl>
        </Panel>}
        {asset && <Panel title="Document Alerts">
          <dl className="space-y-2">
            {(['valid', 'soon', 'expired'] as const).map((st) => {
              const docs = s.docs.filter((d) => d.isCurrent)
              const types = s.docTypes
              const count = docs.filter((d) => {
                if (!d.expiresAt) return st === 'valid'
                const t = types.find((t) => t.id === d.typeId)
                const days = Math.ceil((new Date(d.expiresAt).getTime() - Date.now()) / 86400000)
                if (st === 'expired') return days < 0
                if (st === 'soon') return days >= 0 && days <= (t?.soonDays ?? 30)
                return days > (t?.soonDays ?? 30)
              }).length
              if (!count) return null
              return <div key={st} className="flex justify-between text-[15px]"><dt className="capitalize">{st}</dt><dd className="font-bold">{count}</dd></div>
            })}
          </dl>
        </Panel>}
      </div>
    </div>
  )
}

function ComingSoon({ title }: { title: string }) {
  return <div><PageHeader title={title} lead="This feature is under development" /><Empty title="Coming Soon">This section will be available in the next phase.</Empty></div>
}

export default function OperationsModule() {
  const { pathname } = useLocation()
  const rest = pathname.replace(/^\/operations\/?/, '')
  const segments = rest.split('/')
  const s0 = segments[0] || 'dashboard'
  const s1 = segments[1] || ''

  const perm = GROUP_PERM[{ crew: 'crewing', vessels: 'doc-asset', documents: 'doc-asset', bunker: 'bunker', traffic: 'traffic', maintenance: 'maintenance', keagenan: 'keagenan' }[s0] ?? '']
  let content: JSX.Element
  switch (s0) {
    case 'crew':
      if (s1 === 'composition') content = <Composition />
      else if (s1) content = <CrewDetail />
      else content = <CrewList />
      break
    case 'vessels':
      if (s1 === 'pairs') content = <PairManager />
      else if (s1) content = <VesselDetail />
      else content = <VesselList />
      break
    case 'documents':
      if (s1 === 'types') content = <DocumentTypes />
      else if (s1 === 'rules') content = <RequiredDocs />
      else if (s1) content = <DocumentDetail />
      else content = <DocumentList />
      break
    case 'bunker':
      content = s1 === 'planning' ? <ComingSoon title="Fuel Planning" />
        : s1 === 'delivery' ? <ComingSoon title="Purchase & Delivery" />
        : s1 === 'consumption' ? <ComingSoon title="Consumption" />
        : s1 === 'stock' ? <ComingSoon title="Stock Monitoring" />
        : <ComingSoon title="Bunker" />
      break
    case 'traffic':
      content = s1 === 'voyage' ? <ComingSoon title="Voyage Planning" />
        : s1 === 'tracking' ? <ComingSoon title="Vessel Tracking" />
        : s1 === 'miles' ? <ComingSoon title="Nautical Miles" />
        : s1 === 'reporting' ? <ComingSoon title="ETA & Reporting" />
        : <ComingSoon title="Traffic" />
      break
    case 'maintenance':
      content = s1 === 'plan' ? <ComingSoon title="Maintenance Plan" />
        : s1 === 'work-order' ? <ComingSoon title="Work Order" />
        : s1 === 'spare-parts' ? <ComingSoon title="Spare Parts" />
        : s1 === 'progress' ? <ComingSoon title="Repair Progress" />
        : s1 === 'cost' ? <ComingSoon title="Cost Control" />
        : <ComingSoon title="Maintenance & Repair" />
      break
    case 'keagenan':
      content = s1 === 'agency' ? <ComingSoon title="Port Agency" />
        : s1 === 'clearance' ? <ComingSoon title="Clearance" />
        : s1 === 'logistics' ? <ComingSoon title="Logistics" />
        : s1 === 'supply' ? <ComingSoon title="Supply to Vessel" />
        : <ComingSoon title="Port Agency & Logistics" />
      break
    default:
      content = <OpsDashboard />
  }

  return <ModuleShell pathname={pathname}>{perm ? <Guard perm={perm}>{content}</Guard> : content}</ModuleShell>
}
