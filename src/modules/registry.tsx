// One place that lists every module and its features. The home grid, the module pages
// and the breadcrumb all read from here, so a new module only needs an entry below.
import {
  Anchor, BarChart3, Building2, CalendarCheck, ClipboardCheck, ClipboardList,
  Clock, CreditCard, FileCheck2, FileSearch, FileSpreadsheet, FileStack, FileText,
  Fuel, Gauge, Handshake, History, Inbox, KeyRound, LayoutDashboard, Link2, ListChecks,
  MapPin, MessageSquareText, Package, Radar, Receipt, RefreshCw, Route,
  Settings, Shield, Ship, ShieldCheck, Ship as ShipIcon, SlidersHorizontal, ShoppingCart,
  Truck, UserCog, Users, UsersRound, Wallet, Wrench,
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

const notReady = (st: Store) => [...st.assessments.values()].filter((a) => a.status === 'red').length

export const MODULES: ModuleDef[] = [
  {
    code: 'Dashboard', slug: 'dashboard', name: 'Fleet Monitoring', icon: LayoutDashboard,
    hint: 'The first screen to check every morning. It shows the fleet and its risks on one page, shaped to each role.',
    features: [
      { to: '/dashboard', label: 'Dashboard', hint: 'Fleet overview shaped to your role.', icon: LayoutDashboard, perm: 'readiness.read' },
    ],
  },
  {
    code: 'SALES', slug: 'sales', name: 'Sales', icon: Handshake,
    hint: 'Manages the end-to-end commercial process from customer inquiry to sales order, covering RFQ, quotation, negotiation and order creation as the basis for job orders to Operations.',
    features: [
      { to: '/sales/rfq', label: 'RFQ', hint: 'Receive and manage Request for Quotation from customers.', icon: FileSearch, perm: 'sales.read' },
      { to: '/sales/commercial-sheet', label: 'Commercial Sheet', hint: 'Prepare commercial analysis and cost breakdown for pricing.', icon: FileSpreadsheet, perm: 'sales.read' },
      { to: '/sales/quotation', label: 'Quotation', hint: 'Create and send price quotations to customers.', icon: FileText, perm: 'sales.read' },
      { to: '/sales/negotiation', label: 'Negotiation', hint: 'Track negotiation progress and deal terms with customers.', icon: MessageSquareText, perm: 'sales.read' },
      { to: '/sales/order', label: 'Sales Order', hint: 'Create Sales Order as the basis for Job Order to Operations.', icon: ClipboardList, perm: 'sales.read' },
    ],
  },
  {
    code: 'CREWING', slug: 'crewing', name: 'Crewing', icon: Users,
    hint: 'Manages permanent and contract crew, sign them on and off vessels, and check each vessel against its minimum safe manning.',
    features: [
      { to: '/crew', label: 'Crew Master', hint: 'Profile, assignments and certificates for all crew.', icon: UsersRound, perm: 'crew.read', figure: (st) => `${st.s.crew.length} crew` },
      { to: '/crew/composition', label: 'Assignment & Manning', hint: 'Crew aboard against the safe manning minimum, sign on and off, crew list export.', icon: ClipboardList, perm: 'crew.read' },
    ],
  },
  {
    code: 'DOC ASSET', slug: 'doc-asset', name: 'Documents Asset TB & BG', icon: FileText,
    hint: 'Manages vessel profiles, TB/BG pairs, all vessel and crew documents with certificates, asset data, insurance and regulatory compliance.',
    features: [
      { to: '/vessels', label: 'Vessel Profile', hint: 'Profile, particulars, status history and asset data for every vessel.', icon: ShipIcon, perm: 'vessel.read', figure: (st) => `${st.s.vessels.length} vessels` },
      { to: '/vessels/pairs', label: 'TB/BG Pairs', hint: 'Which tug tows which barge, and since when.', icon: Anchor, perm: 'vessel.read', figure: (st) => `${st.s.pairs.filter((p) => !p.end).length} active` },
      { to: '/documents', label: 'Vessel Certificate', hint: 'All vessel and crew documents, search by type, status or expiry range.', icon: FileStack, perm: 'document.read', figure: (st) => `${st.currentDocs.length} active` },
      { to: '/documents/types', label: 'Asset Document', hint: 'Document types with expiry settings and reminder configuration.', icon: SlidersHorizontal, perm: 'document.read', figure: (st) => `${st.s.docTypes.length} types` },
      { to: '/documents/rules', label: 'Regulatory Compliance', hint: 'What each vessel type and rank must hold.', icon: FileCheck2, perm: 'document.read' },
    ],
  },
  {
    code: 'BUNKER', slug: 'bunker', name: 'Bunker', icon: Fuel,
    hint: 'Manages vessel fuel operations from planning based on voyage distance, through procurement and delivery, to consumption tracking and stock monitoring.',
    features: [
      { to: '/bunker/planning', label: 'Fuel Planning', hint: 'Plan fuel requirements based on voyage distance and vessel consumption rate.', icon: ClipboardList, perm: 'bunker.read' },
      { to: '/bunker/delivery', label: 'Purchase & Delivery', hint: 'Order fuel and coordinate delivery to vessels.', icon: Truck, perm: 'bunker.read' },
      { to: '/bunker/consumption', label: 'Consumption', hint: 'Track daily fuel consumption and compare against plan.', icon: BarChart3, perm: 'bunker.read' },
      { to: '/bunker/stock', label: 'Stock Monitoring', hint: 'Monitor fuel stock levels across the fleet in real time.', icon: Gauge, perm: 'bunker.read' },
    ],
  },
  {
    code: 'TRAFFIC', slug: 'traffic', name: 'Traffic', icon: Radar,
    hint: 'Monitors vessel movements from departure to arrival, tracking positions via GPS, logging nautical miles, and reporting ETAs through daily captain reports.',
    features: [
      { to: '/traffic/voyage', label: 'Voyage Planning', hint: 'Plan vessel routes, ports of call and estimated schedules.', icon: Route, perm: 'traffic.read' },
      { to: '/traffic/tracking', label: 'Vessel Tracking', hint: 'Live vessel position updates via GPS and manual captain reports.', icon: MapPin, perm: 'traffic.read' },
      { to: '/traffic/miles', label: 'Nautical Miles', hint: 'Log and calculate distances travelled per voyage.', icon: Radar, perm: 'traffic.read' },
      { to: '/traffic/reporting', label: 'ETA & Reporting', hint: 'Estimated arrival times and daily progress reports.', icon: Clock, perm: 'traffic.read' },
    ],
  },
  {
    code: 'MAINT & REPAIR', slug: 'maintenance', name: 'Maintenance & Repair', icon: Wrench,
    hint: 'Manages planned and unplanned maintenance including work orders, spare parts tracking, repair progress and cost control.',
    features: [
      { to: '/maintenance/plan', label: 'Maintenance Plan', hint: 'Schedule preventive maintenance per vessel and equipment.', icon: CalendarCheck, perm: 'maintenance.read' },
      { to: '/maintenance/work-order', label: 'Work Order', hint: 'Create and track maintenance and repair work orders.', icon: ClipboardCheck, perm: 'maintenance.read' },
      { to: '/maintenance/spare-parts', label: 'Spare Parts', hint: 'Manage spare parts inventory and usage per vessel.', icon: Settings, perm: 'maintenance.read' },
      { to: '/maintenance/progress', label: 'Repair Progress', hint: 'Track ongoing repairs and maintenance completion status.', icon: ListChecks, perm: 'maintenance.read' },
      { to: '/maintenance/cost', label: 'Cost Control', hint: 'Monitor maintenance costs per vessel and per job.', icon: BarChart3, perm: 'maintenance.read' },
    ],
  },
  {
    code: 'KEAGENAN', slug: 'keagenan', name: 'Port Agency & Logistics', icon: Building2,
    hint: 'Handles port agency coordination, clearance and sailing permits from Syahbandar, cargo logistics, and supply of provisions, water and necessities to vessels.',
    features: [
      { to: '/keagenan/agency', label: 'Port Agency', hint: 'Coordinate with port agents for berthing and port services.', icon: Building2, perm: 'keagenan.read' },
      { to: '/keagenan/clearance', label: 'Clearance', hint: 'Manage sailing permits and route permits from Syahbandar.', icon: Shield, perm: 'keagenan.read' },
      { to: '/keagenan/logistics', label: 'Logistics', hint: 'Coordinate cargo loading, unloading and transport logistics.', icon: Package, perm: 'keagenan.read' },
      { to: '/keagenan/supply', label: 'Supply to Vessel', hint: 'Manage crew provisions, clean water and supplies delivery to vessels.', icon: Ship, perm: 'keagenan.read' },
    ],
  },
  {
    code: 'PROCUREMENT', slug: 'procurement', name: 'Procurement', icon: ShoppingCart,
    hint: 'Manages the procurement process from receiving purchase requests, selecting vendors, creating purchase orders to monitoring delivery.',
    features: [
      { to: '/procurement/request', label: 'Purchase Request', hint: 'Receive and review purchase requests from operations.', icon: Inbox, perm: 'procurement.read' },
      { to: '/procurement/vendor', label: 'Vendor Selection', hint: 'Select and evaluate vendors for purchase orders.', icon: Users, perm: 'procurement.read' },
      { to: '/procurement/order', label: 'Purchase Order', hint: 'Create and manage purchase orders to vendors.', icon: ShoppingCart, perm: 'procurement.read' },
      { to: '/procurement/delivery', label: 'Monitor Delivery', hint: 'Track delivery status and receipt of ordered goods.', icon: Truck, perm: 'procurement.read' },
    ],
  },
  {
    code: 'DOC SUPPORT', slug: 'doc-support', name: 'Document Support', icon: FileCheck2,
    hint: 'Manages procurement-related documentation including certificate renewals, permits, licenses and vendor service compliance records.',
    features: [
      { to: '/doc-support/renewal', label: 'Certificate Renewal', hint: 'Track and process vessel certificate renewals for procurement.', icon: RefreshCw, perm: 'doc_support.read' },
      { to: '/doc-support/permit', label: 'Permit & License', hint: 'Manage operating permits and license applications.', icon: FileCheck2, perm: 'doc_support.read' },
      { to: '/doc-support/documentation', label: 'Documentation', hint: 'Maintain supporting documents for purchase orders and contracts.', icon: FileStack, perm: 'doc_support.read' },
      { to: '/doc-support/vendor-service', label: 'Vendor Service', hint: 'Track vendor certifications and service compliance requirements.', icon: UserCog, perm: 'doc_support.read' },
    ],
  },
  {
    code: 'BILLING', slug: 'billing', name: 'Billing to Customer', icon: Receipt,
    hint: 'Handles customer invoicing based on completed sales orders and vessel time sheets, tracking payment receipts and managing accounts receivable.',
    features: [
      { to: '/billing/invoice', label: 'Customer Invoice', hint: 'Create customer invoices based on completed sales orders.', icon: Receipt, perm: 'billing.read' },
      { to: '/billing/timesheet', label: 'Time Sheet', hint: 'Generate vessel time sheets as evaluation from loading through sailing to unloading.', icon: Clock, perm: 'billing.read' },
      { to: '/billing/receipt', label: 'Payment Receipt', hint: 'Record and track incoming customer payment receipts.', icon: Wallet, perm: 'billing.read' },
      { to: '/billing/receivable', label: 'Account Receivable', hint: 'Monitor outstanding customer balances and aging reports.', icon: BarChart3, perm: 'billing.read' },
    ],
  },
  {
    code: 'PAYMENT', slug: 'payment', name: 'Payment to Vendor', icon: CreditCard,
    hint: 'Manages vendor invoice verification through 3-way matching of PO, goods receipt and invoice, processes payments and tracks accounts payable.',
    features: [
      { to: '/payment/verify', label: 'Verify Vendor Invoice', hint: 'Review and verify incoming vendor invoices for accuracy.', icon: FileSearch, perm: 'payment.read' },
      { to: '/payment/matching', label: '3-Way Matching', hint: 'Match Purchase Order, Goods Receipt and Invoice before approving payment.', icon: ListChecks, perm: 'payment.read' },
      { to: '/payment/processing', label: 'Payment Processing', hint: 'Process approved vendor payments and record transactions.', icon: CreditCard, perm: 'payment.read' },
      { to: '/payment/payable', label: 'Account Payable', hint: 'Monitor outstanding vendor balances and payment schedules.', icon: BarChart3, perm: 'payment.read' },
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
