import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3, ChevronDown, Clock, CreditCard, FileSearch, LayoutDashboard,
  ListChecks, Receipt, Wallet,
  type LucideIcon,
} from 'lucide-react'
import { cx, Empty, ModuleFooter, PageHeader, Panel, Stat } from '../../components/ui'

interface NavItem { key: string; label: string; icon: LucideIcon; path: string }
interface NavGroup { key: string; label: string; icon: LucideIcon; items: NavItem[] }

const GROUPS: NavGroup[] = [
  { key: 'billing', label: 'Billing to Customer', icon: Receipt, items: [
    { key: 'invoice', label: 'Customer Invoice', icon: Receipt, path: '/finance/billing/invoice' },
    { key: 'timesheet', label: 'Time Sheet', icon: Clock, path: '/finance/billing/timesheet' },
    { key: 'receipt', label: 'Payment Receipt', icon: Wallet, path: '/finance/billing/receipt' },
    { key: 'receivable', label: 'Account Receivable', icon: BarChart3, path: '/finance/billing/receivable' },
  ]},
  { key: 'payment', label: 'Payment to Vendor', icon: CreditCard, items: [
    { key: 'verify', label: 'Verify Vendor Invoice', icon: FileSearch, path: '/finance/payment/verify' },
    { key: 'matching', label: '3-Way Matching', icon: ListChecks, path: '/finance/payment/matching' },
    { key: 'processing', label: 'Payment Processing', icon: CreditCard, path: '/finance/payment/processing' },
    { key: 'payable', label: 'Account Payable', icon: BarChart3, path: '/finance/payment/payable' },
  ]},
]

function SidebarContent({ pathname, onNav, collapsed }: { pathname: string; onNav?: () => void; collapsed?: boolean }) {
  const initOpen = GROUPS.filter((g) => g.items.some((it) => pathname.startsWith(it.path))).map((g) => g.key)
  const [open, setOpen] = useState<Set<string>>(new Set(initOpen.length ? initOpen : ['billing']))
  const toggle = (key: string) => setOpen((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  const isDashboard = pathname === '/finance/dashboard' || pathname === '/finance' || pathname === '/finance/'

  return (
    <div className="space-y-0.5">
      <Link to="/finance/dashboard" onClick={onNav} title="Dashboard" className={cx(
        'flex items-center gap-2.5 rounded-lg py-2.5 text-[15px] font-semibold transition-colors',
        collapsed ? 'justify-center px-0' : 'px-3',
        isDashboard ? 'bg-accent text-white' : 'text-[var(--color-nav-ink)] hover:bg-white/10',
      )}><LayoutDashboard className="size-4 shrink-0" />{!collapsed && ' Dashboard'}</Link>
      {GROUPS.map((g) => {
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
      <nav className={cx('hidden shrink-0 overflow-y-auto bg-[var(--color-nav)] transition-[width] lg:block', open ? 'w-56 p-3' : 'w-16 p-2')} aria-label="Finance menu">
        <SidebarContent pathname={pathname} collapsed={!open} />
      </nav>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
          <nav className="fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto bg-[var(--color-nav)] p-4 pt-6 shadow-2xl lg:hidden" aria-label="Finance menu">
            <SidebarContent pathname={pathname} onNav={() => setOpen(false)} />
          </nav>
        </>
      )}
      <div className="min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">{children}<ModuleFooter /></div>
    </div>
  )
}

function FinanceDashboard() {
  return (
    <div>
      <h1 className="judul mb-5 text-[2rem] uppercase">Finance Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Invoices" value="—" />
        <Stat label="Pending Payments" value="—" />
        <Stat label="Receivable" value="—" />
        <Stat label="Payable" value="—" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Panel title="Billing to Customer"><p className="text-sm text-ink-2">Customer billing features will be available in the next phase.</p></Panel>
        <Panel title="Payment to Vendor"><p className="text-sm text-ink-2">Vendor payment features will be available in the next phase.</p></Panel>
      </div>
    </div>
  )
}

function ComingSoon({ title }: { title: string }) {
  return <div><PageHeader title={title} lead="This feature is under development" /><Empty title="Coming Soon">This section will be available in the next phase.</Empty></div>
}

export default function FinanceModule() {
  const { pathname } = useLocation()
  const rest = pathname.replace(/^\/finance\/?/, '')
  const segments = rest.split('/')
  const s0 = segments[0] || 'dashboard'
  const s1 = segments[1] || ''

  let content: JSX.Element
  switch (s0) {
    case 'billing':
      content = s1 === 'invoice' ? <ComingSoon title="Customer Invoice" />
        : s1 === 'timesheet' ? <ComingSoon title="Time Sheet" />
        : s1 === 'receipt' ? <ComingSoon title="Payment Receipt" />
        : s1 === 'receivable' ? <ComingSoon title="Account Receivable" />
        : <ComingSoon title="Billing" />
      break
    case 'payment':
      content = s1 === 'verify' ? <ComingSoon title="Verify Vendor Invoice" />
        : s1 === 'matching' ? <ComingSoon title="3-Way Matching" />
        : s1 === 'processing' ? <ComingSoon title="Payment Processing" />
        : s1 === 'payable' ? <ComingSoon title="Account Payable" />
        : <ComingSoon title="Payment" />
      break
    default:
      content = <FinanceDashboard />
  }

  return <ModuleShell pathname={pathname}>{content}</ModuleShell>
}
