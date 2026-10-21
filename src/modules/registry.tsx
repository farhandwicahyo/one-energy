// One place that lists every module and its features. The home grid, the module pages
// and the breadcrumb all read from here, so a new module only needs an entry below.
import {
  Anchor, Bell, CalendarCheck, ClipboardList, FileCheck2, FileStack, FileText, Gauge, History, Inbox,
  KeyRound, LayoutDashboard, Link2, ListChecks, MessageSquareText, Settings, Ship, ShieldCheck, Ship as ShipIcon,
  SlidersHorizontal, UserCog, Users, UsersRound, Wrench, Route, ClipboardCheck, ShoppingCart, Wallet, BarChart3, Scale, Handshake, Plug,
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
  phase?: 2 | 3 | 4 // set for modules still in development; Phase 1 modules leave it out
  plan?: string[] // what the module will do, from the PRD roadmap
}

export const PHASES: Record<2 | 3 | 4, { name: string; gate: string }> = {
  2: { name: 'Daily operations', gate: 'Starts after Gate 1: documents for all 70 vessels complete, reminders running reliably, every role using the system.' },
  3: { name: 'Cost control', gate: 'Starts after Gate 2: maintenance recorded routinely, voyages logged in the system, inspection findings tracked.' },
  4: { name: 'Expansion', gate: 'Starts after Gate 3: cost per vessel accurate, reports used by management, international plan clear.' },
}

const notReady = (st: Store) => [...st.assessments.values()].filter((a) => a.status === 'red').length

export const MODULES: ModuleDef[] = [
  {
    code: 'Dashboard', slug: 'dashboard', name: 'Fleet Monitoring', icon: LayoutDashboard,
    hint: 'The first screen to check every morning. It shows the fleet and its risks on one page, shaped to each role: readiness at a glance for Management, a renewal task list for Document Admin and Crewing, and all 70 vessels for Operation.',
    features: [
      { to: '/dashboard', label: 'Dashboard', hint: 'The view that fits your role, figures identical to SIAP and E-DOC.', icon: LayoutDashboard },
    ],
  },
  {
    code: 'SIAP', slug: 'siap', name: 'Sailing Readiness', icon: Gauge,
    hint: 'SIAP stands for Sistem Informasi Asesmen Pelayaran. It is used to decide whether a vessel can sail, marking each one green, yellow or red from its documents and crew, with the exact reasons and a check for a planned departure date.',
    features: [
      { to: '/readiness', label: 'Fleet readiness', hint: 'All 70 vessels with their status and main cause.', icon: Gauge, perm: 'readiness.read', figure: (st) => `${notReady(st)} red` },
      { to: '/readiness/pairs', label: 'TB/BG pair readiness', hint: 'A pair is as ready as its weaker half.', icon: Link2, perm: 'readiness.read', figure: (st) => `${st.s.pairs.filter((p) => !p.end).length} pairs` },
    ],
  },
  {
    code: 'SISKA', slug: 'siska', name: 'Vessels', icon: Ship,
    hint: 'SISKA stands for Sistem Informasi Kapal. It is used to keep the master record of every tug boat and barge: profile and particulars, operating status with its history, and which tug tows which barge.',
    features: [
      { to: '/vessels', label: 'All vessels', hint: 'Profile, particulars, crew aboard, documents, status history and asset.', icon: ShipIcon, perm: 'vessel.read', figure: (st) => `${st.s.vessels.length} vessels` },
      { to: '/vessels/pairs', label: 'TB/BG pairs', hint: 'Which tug tows which barge, and since when.', icon: Anchor, perm: 'vessel.read', figure: (st) => `${st.s.pairs.filter((p) => !p.end).length} active` },
    ],
  },
  {
    code: 'SI-CREW', slug: 'si-crew', name: 'Crew', icon: Users,
    hint: 'SI-CREW stands for Sistem Informasi Crew. It is used to manage permanent and contract crew, sign them on and off vessels, and check each vessel against its minimum safe manning.',
    features: [
      { to: '/crew', label: 'All crew', hint: 'Profile, assignments and certificates. Personal data and contracts for Crewing / HR only.', icon: UsersRound, perm: 'crew.read', figure: (st) => `${st.s.crew.length} crew` },
      { to: '/crew/composition', label: 'Crew composition', hint: 'Crew aboard against the safe manning minimum, sign on and off, crew list export.', icon: ClipboardList, perm: 'crew.read' },
    ],
  },
  {
    code: 'E-DOC', slug: 'e-doc', name: 'Documents', icon: FileText,
    hint: 'E-DOC stands for Electronic Document. It is used to store every vessel and crew document with its scan, track its expiry automatically, and keep each renewal as a new version.',
    features: [
      { to: '/documents', label: 'All documents', hint: 'Search by vessel, crew, type, status or expiry range. Renew from here.', icon: FileStack, perm: 'document.read', figure: (st) => `${st.currentDocs.length} active` },
      { to: '/documents/types', label: 'Document types', hint: 'Add types and set when “expiring soon” and reminders start. No developer needed.', icon: SlidersHorizontal, perm: 'document.read', figure: (st) => `${st.s.docTypes.length} types` },
      { to: '/documents/rules', label: 'Required documents', hint: 'What each vessel type and rank must hold. SIAP checks against this.', icon: FileCheck2, perm: 'document.read' },
    ],
  },
  {
    code: 'SINAR', slug: 'sinar', name: 'Reminders', icon: Bell,
    hint: 'SINAR stands for Sistem Informasi Notifikasi dan Reminder. It is used to send WhatsApp and email reminders 90, 60, 30 and 7 days before a document expires, and to follow up until it is renewed.',
    features: [
      { to: '/reminders', label: 'Follow-up', hint: 'Documents that are sending reminders, and the weekly summary.', icon: ListChecks, perm: ['followup.write', 'reminder.config'] },
      { to: '/reminders/notifications', label: 'Delivery monitor', hint: 'Every message sent, every failure, resend.', icon: Inbox, perm: 'notification.read', figure: (st) => `${st.s.notifications.filter((n) => n.status === 'failed').length} failed` },
      { to: '/reminders/templates', label: 'Message templates', hint: 'WhatsApp and email text with a live preview.', icon: MessageSquareText, perm: 'notification.read', figure: (st) => `${st.s.templates.length} templates` },
      { to: '/reminders/settings', label: 'Recipients and escalation', hint: 'Move reminders when staff change jobs; optional escalation.', icon: CalendarCheck, perm: 'reminder.config' },
    ],
  },
  {
    code: 'SIGUNA', slug: 'siguna', name: 'Users & Access', icon: ShieldCheck,
    hint: 'SIGUNA stands for Sistem Informasi Pengguna. It is used to control who can see and change what: users, roles and permissions, the audit log, system settings and master data.',
    features: [
      { to: '/admin/users', label: 'Users', hint: 'Create, edit, deactivate and reset passwords.', icon: UserCog, perm: 'user.manage', figure: (st) => `${st.s.users.length} users` },
      { to: '/admin/roles', label: 'Roles and permissions', hint: 'Who may see and change what. Sensitive crew data is locked.', icon: KeyRound, perm: 'role.manage', figure: (st) => `${st.s.roles.length} roles` },
      { to: '/admin/audit', label: 'Audit log', hint: 'Every change with who, when, and before and after values.', icon: History, perm: 'audit.read', figure: (st) => `${st.s.audit.length} entries` },
      { to: '/admin/config', label: 'Configuration', hint: 'Send times, retry limits, upload size, sign-in lockout.', icon: Settings, perm: 'config.manage' },
      { to: '/admin/master', label: 'Master data', hint: 'Vessel types and ranks shared by every module.', icon: Settings, perm: 'master.manage' },
    ],
  },

  // ---------- Phase 2 to 4: shown as cards, open the "under development" page ----------
  {
    code: 'SIRAWAT', slug: 'sirawat', name: 'Maintenance', icon: Wrench, phase: 2, features: [],
    hint: 'SIRAWAT stands for Sistem Informasi Perawatan. It will be used to plan and record maintenance and docking for every vessel.',
    plan: ['Maintenance schedule per vessel and per equipment', 'Work records with parts used and hours', 'Docking plan and docking history'],
  },
  {
    code: 'SILAYAR', slug: 'silayar', name: 'Voyages', icon: Route, phase: 2, features: [],
    hint: 'SILAYAR stands for Sistem Informasi Pelayaran. It will be used to log voyages, cargo and tug-barge movements, and to block red vessels from being scheduled.',
    plan: ['Voyage plan and log per TB/BG pair', 'Cargo and port calls', 'Scheduling gate that calls SIAP: a red vessel cannot be scheduled'],
  },
  {
    code: 'SIPEKA', slug: 'sipeka', name: 'Inspections', icon: ClipboardCheck, phase: 2, features: [],
    hint: 'SIPEKA stands for Sistem Informasi Pemeriksaan Kapal. It will be used to record inspections and class surveys, and to follow each finding until it is closed.',
    plan: ['Inspection and class survey calendar', 'Findings with owner and due date', 'Follow-up until each finding is closed'],
  },
  {
    code: 'SIPENA', slug: 'sipena', name: 'Procurement', icon: ShoppingCart, phase: 3, features: [],
    hint: 'SIPENA stands for Sistem Informasi Pengadaan. It will be used to manage purchasing, spare-part stock and vendors.',
    plan: ['Purchase requests and orders', 'Spare-part stock per warehouse and vessel', 'Vendor list and performance'],
  },
  {
    code: 'SIKEU', slug: 'sikeu', name: 'Finance', icon: Wallet, phase: 3, features: [],
    hint: 'SIKEU stands for Sistem Informasi Keuangan. It will be used to see the cost and profitability of each vessel.',
    plan: ['Cost per vessel from maintenance, crew and purchasing', 'Revenue per voyage', 'Profitability per vessel and per pair'],
  },
  {
    code: 'SILAPOR', slug: 'silapor', name: 'Reports', icon: BarChart3, phase: 3, features: [],
    hint: 'SILAPOR stands for Sistem Informasi Laporan. It will be used to produce print-ready reports and trend analysis for management.',
    plan: ['Print-ready monthly reports', 'Readiness and expiry trends from the daily snapshots', 'Export to Excel and PDF'],
  },
  {
    code: 'SIPATUH', slug: 'sipatuh', name: 'Compliance', icon: Scale, phase: 4, features: [],
    hint: 'SIPATUH stands for Sistem Informasi Kepatuhan. It will be used to manage international rules and standard documents for overseas voyages.',
    plan: ['Flag-state rules and international certificates', 'Document sets per trading area', 'English interface for international use'],
  },
  {
    code: 'SIMITRA', slug: 'simitra', name: 'Partner Portal', icon: Handshake, phase: 4, features: [],
    hint: 'SIMITRA stands for Sistem Informasi Mitra. It will be used to give crew, agents, vendors and clients their own portal, with an offline mode where needed.',
    plan: ['Crew portal to view and upload their own certificates', 'Agent and vendor access', 'Offline mode for use on board'],
  },
  {
    code: 'SIGRASI', slug: 'sigrasi', name: 'Integrations', icon: Plug, phase: 4, features: [],
    hint: 'SIGRASI stands for Sistem Integrasi. It will be used to connect OneEnergy to accounting or ERP, attendance and AIS vessel tracking.',
    plan: ['Accounting / ERP link', 'Attendance system link', 'AIS position feed for live vessel location'],
  },
]

export function allowed(can: (p: string) => boolean, perm?: string | string[]) {
  if (!perm) return true
  return Array.isArray(perm) ? perm.some(can) : can(perm)
}

// Single-feature modules skip their module page and open the feature directly.
export const moduleHref = (m: ModuleDef) => (m.features.length === 1 ? m.features[0].to : `/m/${m.slug}`)

export function visibleFeatures(m: ModuleDef, can: (p: string) => boolean) {
  return m.features.filter((f) => allowed(can, f.perm))
}

// Longest matching feature path wins, so /documents/types maps to E-DOC › Document types.
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
