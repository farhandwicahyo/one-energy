// Shapes follow the TRD Phase 1 data model (section 5), simplified for a client-only mockup.

export type VesselKind = 'TB' | 'BG'
export type OpStatus = 'operating' | 'standby' | 'docking' | 'repair'
export type Readiness = 'green' | 'yellow' | 'red'
export type DocStatus = 'valid' | 'soon' | 'expired'
export type FollowUp = 'pending' | 'in_progress' | 'done'
export type CrewStatus = 'on_duty' | 'leave' | 'standby' | 'inactive'
export type Employment = 'permanent' | 'contract'
export type RoleId = 'superadmin' | 'sales_admin' | 'ops_crewing' | 'ops_asset' | 'ops_bunker' | 'ops_traffic' | 'ops_repair' | 'ops_keagenan' | 'procurement' | 'finance'

export interface Vessel {
  id: string
  code: string
  name: string
  kind: VesselKind
  typeName: string
  gt: number
  nt: number
  loa: number
  breadth: number
  depth: number
  yearBuilt: number
  builder: string
  flag: string
  owner: string
  homePort: string
  callSign: string
  classSociety: string
  isClassRequired: boolean
  isCoalCarrier: boolean
  enginePower?: number
  bollardPull?: number
  mainEngine?: string
  capacityFt?: number
  dwt?: number
  opStatus: OpStatus
  statusSince: string
  notes: string
  isActive: boolean
}

export interface VesselAsset {
  vesselId: string
  acquisitionDate: string
  assetValueIdr: number
  hullMaterial: string
  generatorSets: string
  lastOverhaul: string
  insuredValueIdr: number
}

export interface StatusHistory {
  id: string
  vesselId: string
  from: OpStatus | null
  to: OpStatus
  at: string
  userId: string
  reason: string
}

export interface Pair {
  id: string
  tugId: string
  bargeId: string
  start: string
  end: string | null
}

export interface Rank {
  code: string
  name: string
  localName: string
  department: 'General' | 'Deck' | 'Engine' | 'Catering'
  isOfficer: boolean
}

export interface Crew {
  id: string
  crewNo: string
  name: string
  rank: string
  employment: Employment
  status: CrewStatus
  joined: string
}

export interface CrewPrivate {
  crewId: string
  nik: string
  birthPlace: string
  birthDate: string
  address: string
  phone: string
  email: string
  emergencyName: string
  emergencyRelation: string
  emergencyPhone: string
}

export interface Assignment {
  id: string
  crewId: string
  vesselId: string
  rank: string
  signOn: string
  signOff: string | null
  status: 'active' | 'completed' | 'cancelled'
  reason?: string
}

export interface Contract {
  id: string
  crewId: string
  number: string
  type: 'PKWT' | 'PKL'
  start: string
  end: string
  documentId: string
}

export interface DocType {
  id: string
  code: string
  name: string
  object: 'vessel' | 'crew'
  category: string
  hasExpiry: boolean
  validityMonths: number
  soonDays: number
  reminderDays: number[]
  issuer: string
  sensitive: boolean
  active: boolean
}

export interface FileRef {
  id: string
  name: string
  sizeKb: number
  kind: 'pdf' | 'jpg' | 'png'
  uploadedAt: string
}

export interface Doc {
  id: string
  typeId: string
  ownerKind: 'vessel' | 'crew'
  ownerId: string
  number: string
  level?: string
  issuedAt: string
  expiresAt: string | null
  issuer: string
  version: number
  isCurrent: boolean
  previousId: string | null
  archivedAt: string | null
  recipientId: string
  createdBy: string
  followUp: FollowUp | null
  files: FileRef[]
  notes?: string
}

export interface RequiredDocRule {
  id: string
  scope: 'vessel' | 'rank'
  target: string // vessel kind or rank code
  typeId: string
  coalOnly?: boolean
}

export interface CompositionRule {
  id: string
  kind: VesselKind
  vesselId?: string
  rank: string
  min: number
}

export interface User {
  id: string
  name: string
  username: string
  email: string
  phone: string
  roles: RoleId[]
  active: boolean
  lastLogin: string | null
}

export interface Role {
  id: RoleId
  name: string
  description: string
  permissions: string[]
}

export interface NotificationRow {
  id: string
  documentId: string
  reminderDay: number
  channel: 'whatsapp' | 'email'
  recipientId: string
  createdAt: string
  status: 'queued' | 'sent' | 'failed'
  attempts: number
  error?: string
  isCatchUp?: boolean
}

export interface Template {
  id: string
  code: string
  channel: 'whatsapp' | 'email'
  name: string
  providerCode?: string
  approval: 'approved' | 'pending' | 'rejected'
  subject?: string
  body: string
}

export interface AuditDiff {
  field: string
  before: string | null
  after: string | null
}

export interface AuditEntry {
  id: string
  at: string
  userId: string
  action: 'insert' | 'update' | 'delete'
  table: string
  rowLabel: string
  diff: AuditDiff[]
}

export interface LoginAttempt {
  id: string
  at: string
  username: string
  success: boolean
  ip: string
  reason?: string
}

export interface ConfigItem {
  key: string
  label: string
  value: string
  description: string
}

export interface Escalation {
  active: boolean
  daysBefore: number
  recipientRole: RoleId
  channels: ('whatsapp' | 'email')[]
}
