// One place that lists every module and its features. The home grid, the module pages
// and the breadcrumb all read from here, so a new module only needs an entry below.
import {
  Handshake, History, KeyRound, Receipt, Settings, Ship, ShieldCheck, ShoppingCart, UserCog,
  type LucideIcon,
} from 'lucide-react'
import type { useStore } from '../store'

type Store = ReturnType<typeof useStore>

export interface Feature {
  to: string
  label: string
  hint: string
  icon: LucideIcon
  perm?: string | string[]
  figure?: (st: Store) => string | null
}

export interface ModuleDef {
  code: string
  slug: string
  name: string
  hint: string
  icon: LucideIcon
  features: Feature[]
}

export const MODULES: ModuleDef[] = [
  {
    code: 'SALES', slug: 'sales', name: 'Sales', icon: Handshake,
    hint: 'End-to-end commercial process: RFQ, quotation, negotiation, PO and SO.',
    features: [
      { to: '/sales/dashboard', label: 'Sales', hint: 'Sales dashboard, RFQ, quotation, PO, SO and commercial sheet.', icon: Handshake, perm: 'sales.read' },
    ],
  },
  {
    code: 'OPERATIONAL', slug: 'operations', name: 'Operational', icon: Ship,
    hint: 'All vessel operations: crewing, documents, bunker, traffic, maintenance and port agency in one module.',
    features: [
      { to: '/operations/dashboard', label: 'Operational', hint: 'Crewing, doc asset, bunker, traffic, maintenance & repair, port agency.', icon: Ship, perm: ['crew.read', 'asset.read', 'bunker.read', 'traffic.read', 'maintenance.read', 'keagenan.read'] },
    ],
  },
  {
    code: 'PROCUREMENT', slug: 'procurement', name: 'Procurement', icon: ShoppingCart,
    hint: 'Manages procurement and document support: purchase requests, vendor selection, purchase orders, delivery monitoring, certificate renewals and permits.',
    features: [
      { to: '/procurement/dashboard', label: 'Procurement', hint: 'Purchase requests, vendor selection, PO, delivery and document support.', icon: ShoppingCart, perm: ['procurement.read', 'doc_support.read'] },
    ],
  },
  {
    code: 'FINANCE', slug: 'finance', name: 'Finance', icon: Receipt,
    hint: 'Billing to customer and payment to vendor: invoicing, time sheets, receivables, vendor verification, 3-way matching and payables.',
    features: [
      { to: '/finance/dashboard', label: 'Finance', hint: 'Customer billing, payment processing, receivables and payables.', icon: Receipt, perm: ['billing.read', 'payment.read'] },
    ],
  },
  {
    code: 'ADMIN', slug: 'admin-module', name: 'Users & Access', icon: ShieldCheck,
    hint: 'Controls who can see and change what: users, roles and permissions, the audit log, system settings and master data.',
    features: [
      { to: '/admin/users', label: 'Users', hint: 'Create, edit, deactivate and reset passwords.', icon: UserCog, perm: 'user.manage', figure: (st) => `${st.s.users.length} users` },
      { to: '/admin/roles', label: 'Roles and permissions', hint: 'Who may see and change what.', icon: KeyRound, perm: 'role.manage', figure: (st) => `${st.s.roles.length} roles` },
      { to: '/admin/audit', label: 'Audit log', hint: 'Every change with who, when, and before and after values.', icon: History, perm: 'audit.read', figure: (st) => `${st.s.audit.length} entries` },
      { to: '/admin/config', label: 'Configuration', hint: 'Send times, retry limits, upload size, sign-in lockout.', icon: Settings, perm: 'config.manage' },
      { to: '/admin/master', label: 'Master data', hint: 'Vessel types and ranks shared by every module.', icon: Settings, perm: 'master.manage' },
    ],
  },
]

export function allowed(can: (p: string) => boolean, perm?: string | string[]) {
  if (!perm) return true
  return Array.isArray(perm) ? perm.some(can) : can(perm)
}

export const moduleHref = (m: ModuleDef) => (m.features.length === 1 ? m.features[0].to : `/m/${m.slug}`)

export function visibleFeatures(m: ModuleDef, can: (p: string) => boolean) {
  return m.features.filter((f) => allowed(can, f.perm))
}

export function locate(pathname: string): { module: ModuleDef; feature?: Feature } | null {
  const slug = pathname.match(/^\/m\/([^/]+)/)?.[1]
  if (slug) {
    const m = MODULES.find((x) => x.slug === slug)
    return m ? { module: m } : null
  }
  let best: { module: ModuleDef; feature: Feature } | null = null
  for (const m of MODULES) for (const f of m.features) {
    if ((pathname === f.to || pathname.startsWith(`${f.to}/`)) && (!best || f.to.length > best.feature.to.length)) best = { module: m, feature: f }
  }
  return best
}
