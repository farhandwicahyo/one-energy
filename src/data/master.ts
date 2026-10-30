import type { CompositionRule, ConfigItem, DocType, Escalation, Rank, RequiredDocRule, Role, Template, User } from './types'

export const ranks: Rank[] = [
  { code: 'MASTER', name: 'Master', localName: 'Nakhoda', department: 'General', isOfficer: true },
  { code: 'CO', name: 'Chief Mate', localName: 'Mualim I', department: 'Deck', isOfficer: true },
  { code: '2O', name: 'Second Mate', localName: 'Mualim II', department: 'Deck', isOfficer: true },
  { code: 'AB', name: 'Able Seafarer Deck', localName: 'Rating dek', department: 'Deck', isOfficer: false },
  { code: 'CE', name: 'Chief Engineer', localName: 'KKM', department: 'Engine', isOfficer: true },
  { code: '2E', name: 'Second Engineer', localName: 'Masinis II', department: 'Engine', isOfficer: true },
  { code: 'OILER', name: 'Able Seafarer Engine', localName: 'Rating mesin', department: 'Engine', isOfficer: false },
  { code: 'COOK', name: 'Cook', localName: 'Juru masak', department: 'Catering', isOfficer: false },
]

export const rankByCode = Object.fromEntries(ranks.map((r) => [r.code, r]))

export const vesselTypes = [
  { id: 'vt-tb', code: 'TB', name: 'Tug Boat', category: 'TB' as const, active: true },
  { id: 'vt-bg', code: 'BG', name: 'Barge', category: 'BG' as const, active: true },
  { id: 'vt-bg-coal', code: 'BG-COAL', name: 'Coal Barge', category: 'BG' as const, active: true },
]

export const docTypes: DocType[] = [
  { id: 'dt-surat-laut', code: 'SURAT_LAUT', name: 'Surat Laut (Certificate of Nationality)', object: 'vessel', category: 'Registration', hasExpiry: false, validityMonths: 0, soonDays: 90, reminderDays: [], issuer: 'Ditjen Hubla', sensitive: false, active: true },
  { id: 'dt-surat-ukur', code: 'SURAT_UKUR', name: 'Surat Ukur (Tonnage Certificate)', object: 'vessel', category: 'Registration', hasExpiry: false, validityMonths: 0, soonDays: 90, reminderDays: [], issuer: 'Ditjen Hubla', sensitive: false, active: true },
  { id: 'dt-class', code: 'CLASS', name: 'Class Certificate', object: 'vessel', category: 'Class', hasExpiry: true, validityMonths: 60, soonDays: 90, reminderDays: [90, 60, 30, 7], issuer: 'Biro Klasifikasi Indonesia', sensitive: false, active: true },
  { id: 'dt-safety-cons', code: 'SAFETY_CONSTRUCTION', name: 'Cargo Ship Safety Construction', object: 'vessel', category: 'Safety', hasExpiry: true, validityMonths: 12, soonDays: 90, reminderDays: [90, 60, 30, 7], issuer: 'KSOP', sensitive: false, active: true },
  { id: 'dt-safety-equip', code: 'SAFETY_EQUIPMENT', name: 'Cargo Ship Safety Equipment', object: 'vessel', category: 'Safety', hasExpiry: true, validityMonths: 12, soonDays: 90, reminderDays: [90, 60, 30, 7], issuer: 'KSOP', sensitive: false, active: true },
  { id: 'dt-safety-radio', code: 'SAFETY_RADIO', name: 'Cargo Ship Safety Radio', object: 'vessel', category: 'Safety', hasExpiry: true, validityMonths: 12, soonDays: 90, reminderDays: [90, 60, 30, 7], issuer: 'KSOP', sensitive: false, active: true },
  { id: 'dt-load-line', code: 'LOAD_LINE', name: 'Load Line Certificate', object: 'vessel', category: 'Safety', hasExpiry: true, validityMonths: 60, soonDays: 90, reminderDays: [90, 60, 30, 7], issuer: 'KSOP', sensitive: false, active: true },
  { id: 'dt-safe-manning', code: 'SAFE_MANNING', name: 'Minimum Safe Manning Document', object: 'vessel', category: 'Manning', hasExpiry: true, validityMonths: 60, soonDays: 90, reminderDays: [90, 60, 30, 7], issuer: 'Ditjen Hubla', sensitive: false, active: true },
  { id: 'dt-iopp', code: 'IOPP', name: 'IOPP Certificate', object: 'vessel', category: 'Pollution', hasExpiry: true, validityMonths: 60, soonDays: 90, reminderDays: [90, 30], issuer: 'KSOP', sensitive: false, active: true },
  { id: 'dt-coal', code: 'COAL_BARGE', name: 'Coal Barge Special Certificate', object: 'vessel', category: 'Cargo', hasExpiry: true, validityMonths: 12, soonDays: 90, reminderDays: [90, 60, 30, 7], issuer: 'KSOP (SE-DJPL/28/2023)', sensitive: false, active: true },
  { id: 'dt-insurance', code: 'HM_INSURANCE', name: 'Hull & Machinery Insurance', object: 'vessel', category: 'Insurance', hasExpiry: true, validityMonths: 12, soonDays: 60, reminderDays: [60, 30, 7], issuer: 'Insurer', sensitive: false, active: true },
  { id: 'dt-coc', code: 'COC', name: 'Certificate of Competency (CoC)', object: 'crew', category: 'Competency', hasExpiry: true, validityMonths: 60, soonDays: 90, reminderDays: [90, 60, 30, 7], issuer: 'Ditjen Hubla', sensitive: false, active: true },
  { id: 'dt-bst', code: 'BST', name: 'Basic Safety Training (BST)', object: 'crew', category: 'Proficiency', hasExpiry: true, validityMonths: 60, soonDays: 90, reminderDays: [90, 60, 30, 7], issuer: 'Ditjen Hubla', sensitive: false, active: true },
  { id: 'dt-medical', code: 'MEDICAL', name: 'Medical Check-up', object: 'crew', category: 'Health', hasExpiry: true, validityMonths: 12, soonDays: 30, reminderDays: [30, 14, 7], issuer: 'Approved clinic', sensitive: false, active: true },
  { id: 'dt-seaman-book', code: 'SEAMAN_BOOK', name: "Seaman's Book (Buku Pelaut)", object: 'crew', category: 'Identity', hasExpiry: true, validityMonths: 36, soonDays: 90, reminderDays: [90, 30], issuer: 'Ditjen Hubla', sensitive: false, active: true },
  { id: 'dt-rating', code: 'RATING', name: 'Able Seafarer Certificate', object: 'crew', category: 'Proficiency', hasExpiry: false, validityMonths: 0, soonDays: 90, reminderDays: [], issuer: 'Ditjen Hubla', sensitive: false, active: true },
  { id: 'dt-contract', code: 'CREW_CONTRACT', name: 'Crew Contract', object: 'crew', category: 'Employment', hasExpiry: true, validityMonths: 12, soonDays: 60, reminderDays: [60, 30, 7], issuer: 'OneEnergy HR', sensitive: true, active: true },
]

export const docTypeById = Object.fromEntries(docTypes.map((t) => [t.id, t]))

const vesselRule = (target: 'TB' | 'BG', typeId: string, coalOnly = false): RequiredDocRule => ({
  id: `rq-${target}-${typeId}`,
  scope: 'vessel',
  target,
  typeId,
  coalOnly,
})
const rankRule = (rank: string, typeId: string): RequiredDocRule => ({ id: `rq-${rank}-${typeId}`, scope: 'rank', target: rank, typeId })

export const requiredDocRules: RequiredDocRule[] = [
  ...['dt-surat-laut', 'dt-surat-ukur', 'dt-class', 'dt-safety-cons', 'dt-safety-equip', 'dt-safety-radio', 'dt-load-line', 'dt-safe-manning', 'dt-insurance'].map((t) => vesselRule('TB', t)),
  ...['dt-surat-laut', 'dt-surat-ukur', 'dt-class', 'dt-safety-cons', 'dt-load-line', 'dt-insurance'].map((t) => vesselRule('BG', t)),
  vesselRule('BG', 'dt-coal', true),
  ...ranks.flatMap((r) => {
    const base = ['dt-bst', 'dt-medical', 'dt-seaman-book']
    const extra = r.isOfficer ? ['dt-coc'] : r.code === 'COOK' ? [] : ['dt-rating']
    return [...extra, ...base].map((t) => rankRule(r.code, t))
  }),
]

export const compositionRules: CompositionRule[] = [
  { id: 'cm-tb-master', kind: 'TB', rank: 'MASTER', min: 1 },
  { id: 'cm-tb-co', kind: 'TB', rank: 'CO', min: 1 },
  { id: 'cm-tb-ce', kind: 'TB', rank: 'CE', min: 1 },
  { id: 'cm-tb-2e', kind: 'TB', rank: '2E', min: 1 },
  { id: 'cm-tb-ab', kind: 'TB', rank: 'AB', min: 2 },
  { id: 'cm-tb-oiler', kind: 'TB', rank: 'OILER', min: 1 },
  { id: 'cm-bg-ab', kind: 'BG', rank: 'AB', min: 1 },
]

export const users: User[] = [
  { id: 'u-hendra', name: 'Hendra Wijaya', username: 'hendra.w', email: 'hendra.w@oneenergy.co.id', phone: '+62 811-5009-3381', roles: ['superadmin'], active: true, lastLogin: '2026-10-21T07:58' },
  { id: 'u-rina', name: 'Rina Wulandari', username: 'rina.w', email: 'rina.w@oneenergy.co.id', phone: '+62 812-4410-2231', roles: ['sales'], active: true, lastLogin: '2026-10-21T08:12' },
  { id: 'u-sari', name: 'Sari Handayani', username: 'sari.h', email: 'sari.h@oneenergy.co.id', phone: '+62 811-2034-7765', roles: ['ops_crewing'], active: true, lastLogin: '2026-10-21T08:03' },
  { id: 'u-maya', name: 'Maya Kusuma', username: 'maya.k', email: 'maya.k@oneenergy.co.id', phone: '+62 813-3320-8876', roles: ['ops_asset'], active: true, lastLogin: '2026-10-21T08:03' },
  { id: 'u-budi', name: 'Budi Santoso', username: 'budi.s', email: 'budi.s@oneenergy.co.id', phone: '+62 812-9087-1123', roles: ['ops_bunker'], active: true, lastLogin: '2026-10-21T06:41' },
  { id: 'u-andi', name: 'Andi Pratama', username: 'andi.p', email: 'andi.p@oneenergy.co.id', phone: '+62 815-7712-4409', roles: ['ops_traffic'], active: true, lastLogin: '2026-10-21T07:20' },
  { id: 'u-fajar', name: 'Fajar Nugroho', username: 'fajar.n', email: 'fajar.n@oneenergy.co.id', phone: '+62 812-6654-2210', roles: ['ops_repair'], active: true, lastLogin: '2026-10-21T09:15' },
  { id: 'u-lina', name: 'Lina Marlina', username: 'lina.m', email: 'lina.m@oneenergy.co.id', phone: '+62 811-4478-5520', roles: ['ops_keagenan'], active: true, lastLogin: '2026-10-20T15:30' },
  { id: 'u-dewi', name: 'Dewi Lestari', username: 'dewi.l', email: 'dewi.l@oneenergy.co.id', phone: '+62 812-7780-3345', roles: ['procurement'], active: true, lastLogin: '2026-10-21T08:45' },
  { id: 'u-nina', name: 'Nina Permata', username: 'nina.p', email: 'nina.p@oneenergy.co.id', phone: '+62 811-6643-8890', roles: ['finance'], active: true, lastLogin: '2026-10-21T08:30' },
  { id: 'u-customer', name: 'Agus Prasetyo (Customer)', username: 'agus.p', email: 'agus.p@customer.co.id', phone: '+62 812-5500-1200', roles: ['customer'], active: true, lastLogin: '2026-10-21T09:00' },
]

export const permissionCatalog: { group: string; items: { code: string; label: string; sensitive?: boolean }[] }[] = [
  { group: 'Sales', items: [
    { code: 'sales.read', label: 'View sales data' },
    { code: 'sales.write', label: 'Create and edit sales' },
    { code: 'quotation.respond', label: 'View and respond to own quotations (customer)' },
  ] },
  { group: 'Operational · Doc Asset TB & BG', items: [
    { code: 'vessel.read', label: 'View vessels' },
    { code: 'vessel.write', label: 'Create and edit vessels' },
    { code: 'vessel.status_change', label: 'Change vessel status' },
    { code: 'vessel.pair_manage', label: 'Manage TB/BG pairs' },
    { code: 'asset.read', label: 'View vessel assets' },
    { code: 'asset.write', label: 'Edit vessel assets' },
    { code: 'document.read', label: 'View documents' },
    { code: 'document_vessel.write', label: 'Write vessel documents' },
    { code: 'document_crew.write', label: 'Write crew documents' },
    { code: 'followup.write', label: 'Update follow-up status' },
  ] },
  { group: 'Operational · Crewing', items: [
    { code: 'crew.read', label: 'View crew' },
    { code: 'crew.write', label: 'Create and edit crew' },
    { code: 'crew_private.read', label: 'View personal data', sensitive: true },
    { code: 'contract.read', label: 'View contracts', sensitive: true },
    { code: 'assignment.write', label: 'Sign on / sign off' },
    { code: 'composition.manage', label: 'Manage minimum composition' },
  ] },
  { group: 'Operational · Job Order', items: [
    { code: 'joborder.read', label: 'View job orders' },
    { code: 'joborder.write', label: 'Accept and complete job orders' },
  ] },
  { group: 'Operational · Bunker', items: [
    { code: 'bunker.read', label: 'View bunker data' },
    { code: 'bunker.write', label: 'Manage bunker operations' },
  ] },
  { group: 'Operational · Traffic', items: [
    { code: 'traffic.read', label: 'View traffic data' },
    { code: 'traffic.write', label: 'Manage vessel traffic' },
  ] },
  { group: 'Operational · Port Agency', items: [
    { code: 'keagenan.read', label: 'View port agency data' },
    { code: 'keagenan.write', label: 'Manage port agency' },
  ] },
  { group: 'Operational · Maintenance & Repair', items: [
    { code: 'maintenance.read', label: 'View maintenance data' },
    { code: 'maintenance.write', label: 'Manage maintenance' },
  ] },
  { group: 'Procurement', items: [
    { code: 'procurement.read', label: 'View procurement data' },
    { code: 'procurement.write', label: 'Manage procurement' },
    { code: 'doc_support.read', label: 'View document support' },
    { code: 'doc_support.write', label: 'Manage document support' },
  ] },
  { group: 'Finance', items: [
    { code: 'billing.read', label: 'View billing data' },
    { code: 'billing.write', label: 'Manage billing' },
    { code: 'payment.read', label: 'View payment data' },
    { code: 'payment.write', label: 'Manage payments' },
  ] },
  { group: 'Dashboard', items: [
    { code: 'readiness.read', label: 'View sailing readiness' },
    { code: 'dashboard.management', label: 'Management dashboard' },
    { code: 'dashboard.tasks', label: 'Task dashboard' },
    { code: 'dashboard.operations', label: 'Operations dashboard' },
    { code: 'export.run', label: 'Export to Excel / PDF' },
  ] },
  { group: 'System (SIGUNA)', items: [
    { code: 'user.manage', label: 'Manage users' },
    { code: 'role.manage', label: 'Manage roles and permissions' },
    { code: 'audit.read', label: 'Read audit log' },
    { code: 'config.manage', label: 'System configuration' },
    { code: 'master.manage', label: 'Master data' },
  ] },
]

export const roles: Role[] = [
  { id: 'superadmin', name: 'Super Admin', description: 'Full access to all modules and features across the entire system.', permissions: permissionCatalog.flatMap((g) => g.items.map((i) => i.code)).concat(['user.manage', 'role.manage', 'audit.read', 'config.manage', 'master.manage']) },
  { id: 'sales', name: 'Sales', description: 'Manages the commercial process from Quotation to Sales Order.', permissions: ['sales.read', 'sales.write', 'vessel.read', 'readiness.read', 'dashboard.operations'] },
  { id: 'ops_crewing', name: 'Operational Crewing', description: 'Operational module: Crewing only (crew, assignments, manning, contracts).', permissions: ['joborder.read', 'crew.read', 'crew.write', 'crew_private.read', 'contract.read', 'assignment.write', 'composition.manage', 'vessel.read', 'document.read', 'document_crew.write', 'readiness.read', 'dashboard.tasks'] },
  { id: 'ops_asset', name: 'Operational Doc Asset', description: 'Operational module: Documents Asset TB & BG (vessels, pairs, certificates, regulatory compliance).', permissions: ['joborder.read', 'vessel.read', 'vessel.write', 'vessel.status_change', 'vessel.pair_manage', 'asset.read', 'asset.write', 'document.read', 'document_vessel.write', 'document_crew.write', 'followup.write', 'readiness.read', 'dashboard.tasks'] },
  { id: 'ops_bunker', name: 'Operational Bunker', description: 'Operational module: Bunker only (fuel planning, delivery, consumption, stock).', permissions: ['joborder.read', 'bunker.read', 'bunker.write', 'vessel.read', 'readiness.read', 'dashboard.operations'] },
  { id: 'ops_traffic', name: 'Operational Traffic', description: 'Operational module: Traffic only (voyage planning, tracking, reporting).', permissions: ['joborder.read', 'joborder.write', 'traffic.read', 'traffic.write', 'vessel.read', 'readiness.read', 'dashboard.operations'] },
  { id: 'ops_repair', name: 'Operational Maintenance & Repair', description: 'Operational module: Maintenance & Repair only.', permissions: ['joborder.read', 'maintenance.read', 'maintenance.write', 'vessel.read', 'readiness.read', 'dashboard.operations'] },
  { id: 'ops_keagenan', name: 'Operational Port Agency', description: 'Operational module: Port Agency & Logistics only.', permissions: ['joborder.read', 'keagenan.read', 'keagenan.write', 'vessel.read', 'readiness.read', 'dashboard.operations'] },
  { id: 'procurement', name: 'Procurement', description: 'Manages purchasing, vendors, delivery and document support.', permissions: ['procurement.read', 'procurement.write', 'doc_support.read', 'doc_support.write', 'vessel.read', 'readiness.read', 'dashboard.operations'] },
  { id: 'finance', name: 'Finance', description: 'Manages billing to customer and payment to vendor, including invoicing, 3-way matching and accounts.', permissions: ['billing.read', 'billing.write', 'payment.read', 'payment.write', 'dashboard.tasks'] },
  { id: 'customer', name: 'Customer', description: 'External customer: views the quotations sent to them and accepts or negotiates the price.', permissions: ['quotation.respond'] },
]

export const templates: Template[] = [
  { id: 'tp-wa-reminder', code: 'REMINDER_EXPIRY', channel: 'whatsapp', name: 'Expiry reminder', providerCode: 'oe_doc_expiry_v2', approval: 'approved', body: 'OneEnergy reminder: {{jenis_dokumen}} for {{nama_objek}} expires on {{tgl_berlaku}} ({{sisa_hari}} days left). Open the document: {{tautan}}' },
  { id: 'tp-wa-catchup', code: 'REMINDER_CATCHUP', channel: 'whatsapp', name: 'Catch-up reminder', providerCode: 'oe_doc_catchup_v1', approval: 'approved', body: 'OneEnergy: {{jenis_dokumen}} for {{nama_objek}} was recorded with only {{sisa_hari}} days left (expires {{tgl_berlaku}}). Please start the renewal: {{tautan}}' },
  { id: 'tp-wa-sensitive', code: 'REMINDER_CONTRACT', channel: 'whatsapp', name: 'Contract reminder (sensitive)', providerCode: 'oe_contract_end_v1', approval: 'pending', body: 'OneEnergy: a {{jenis_dokumen}} for {{nama_objek}} needs attention. Sign in to view the details: {{tautan}}' },
  { id: 'tp-email-reminder', code: 'REMINDER_EXPIRY', channel: 'email', name: 'Expiry reminder', approval: 'approved', subject: '[OneEnergy] {{jenis_dokumen}} – {{nama_objek}} expires in {{sisa_hari}} days', body: 'Hello,\n\nThe {{jenis_dokumen}} for {{nama_objek}} expires on {{tgl_berlaku}}, {{sisa_hari}} days from today.\n\nPlease start the renewal and upload the new scan when it is issued. The reminder stops automatically once the new version is recorded.\n\nOpen the document: {{tautan}}\n\nOneEnergy · SINAR' },
  { id: 'tp-email-weekly', code: 'WEEKLY_SUMMARY', channel: 'email', name: 'Weekly summary', approval: 'approved', subject: '[OneEnergy] {{jumlah}} documents expire in the next 30 days', body: 'Hello,\n\nThis is your Monday summary. {{jumlah}} documents you recorded expire within 30 days. The list is below, nearest first.\n\n{{daftar}}\n\nOneEnergy · SINAR' },
]

export const config: ConfigItem[] = [
  { key: 'pengingat.jam_kirim', label: 'Daily reminder send time', value: '08:00', description: 'Reminders are queued at this time every day (WIB).' },
  { key: 'ringkasan.aktif', label: 'Weekly summary enabled', value: 'true', description: 'Send a weekly summary to each Document Admin.' },
  { key: 'ringkasan.hari', label: 'Weekly summary day', value: 'Monday', description: 'Day the weekly summary is sent.' },
  { key: 'ringkasan.jam', label: 'Weekly summary time', value: '07:30', description: 'Time the weekly summary is sent (WIB).' },
  { key: 'ringkasan.jendela_hari', label: 'Summary window (days)', value: '30', description: 'Documents expiring within this many days are included.' },
  { key: 'notifikasi.maks_percobaan', label: 'Max send attempts', value: '3', description: 'A notification is marked failed after this many attempts.' },
  { key: 'notifikasi.jeda_menit', label: 'Retry delay (minutes)', value: '15', description: 'Wait between send attempts.' },
  { key: 'berkas.maks_ukuran_mb', label: 'Max upload size (MB)', value: '10', description: 'PDF, JPG and PNG only.' },
  { key: 'auth.maks_gagal_login', label: 'Failed sign-ins before lock', value: '5', description: 'The account is locked after this many failed attempts.' },
  { key: 'auth.kunci_menit', label: 'Lock duration (minutes)', value: '15', description: 'How long a locked account stays locked.' },
  { key: 'sesi.idle_menit', label: 'Idle session timeout (minutes)', value: '30', description: 'Sessions end after this much inactivity.' },
  { key: 'kesiapan.jam_snapshot', label: 'Readiness snapshot time', value: '23:00', description: 'Daily snapshot of every vessel’s readiness for trends.' },
]

export const escalation: Escalation = { active: false, daysBefore: 14, recipientRole: 'superadmin', channels: ['email'] }
