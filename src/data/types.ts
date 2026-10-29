// Shapes follow the TRD Phase 1 data model (section 5), simplified for a client-only mockup.

export type VesselKind = 'TB' | 'BG'
export type OpStatus = 'operating' | 'standby' | 'docking' | 'repair'
export type Readiness = 'green' | 'yellow' | 'red'
export type DocStatus = 'valid' | 'soon' | 'expired'
export type FollowUp = 'pending' | 'in_progress' | 'done'
export type CrewStatus = 'on_duty' | 'leave' | 'standby' | 'inactive'
export type Employment = 'permanent' | 'contract'
export type RoleId = 'superadmin' | 'sales' | 'ops_crewing' | 'ops_asset' | 'ops_bunker' | 'ops_traffic' | 'ops_repair' | 'ops_keagenan' | 'procurement' | 'finance'

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

// ---------- Sales ----------
export type NegotiationStatus = 'draft' | 'waiting_approval' | 'approved' | 'sent_to_customer' | 'customer_ok' | 'customer_reject' | 'revision' | 'expired'
export type QuotationStatus = 'draft' | 'negotiation' | 'approved' | 'rejected' | 'expired'
export type POStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled'
export type SOStatus = 'draft' | 'active' | 'completed' | 'cancelled'

export interface RFQ {
  id: string
  rfqNo: string
  customerName: string
  customerContact: string
  origin: string
  destination: string
  cargoType: string
  cargoTonnage: number
  requestDate: string
  validUntil: string
  notes: string
  files: RFQFileRef[]
  createdBy: string
  createdAt: string
}

export interface QuotationItem {
  description: string
  unit: string
  qty: number
  unitPrice: number
  amount: number
}

export interface NegotiationRound {
  round: number
  salesPrice: number
  submittedAt: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  approvedBy: string | null
  approvedAt: string | null
  customerResponse: 'pending' | 'ok' | 'reject' | null
  customerRespondedAt: string | null
}

export interface Quotation {
  id: string
  quotationNo: string
  rfqId: string
  customerName: string
  origin: string
  destination: string
  cargoType: string
  cargoTonnage: number
  items: QuotationItem[]
  totalAmount: number
  validUntil: string
  status: QuotationStatus
  negotiations: NegotiationRound[]
  currentRound: number
  createdBy: string
  createdAt: string
}

export interface PurchaseOrder {
  id: string
  poNo: string
  quotationId: string
  quotationNo: string
  customerName: string
  customerContact: string
  origin: string
  destination: string
  cargoType: string
  cargoTonnage: number
  totalAmount: number
  poDate: string
  deliveryDate: string
  paymentTerms: string
  shipmentType: string
  portOfLoading: string
  portOfDischarge: string
  specialInstructions: string
  status: POStatus
  notes: string
  createdBy: string
  createdAt: string
}

export interface SalesOrder {
  id: string
  soNo: string
  poId: string
  poNo: string
  customerName: string
  salesName: string
  shipmentType: string
  laycanStart: string
  laycanEnd: string
  portOfLoading: string
  portOfDischarge: string
  freeTime: number
  freeTimeUnit: string
  cargoType: string
  cargoWeight: number
  cargoWeightUnit: string
  dwt: number
  dwtUnit: string
  freightPrice: number
  freightCurrency: string
  freightBasis: string
  paymentTerms: string
  customerPic: string
  customerPicPhone: string
  customerPicEmail: string
  customerPicPosition: string
  remarks: string
  origin: string
  destination: string
  totalAmount: number
  soDate: string
  status: SOStatus
  vesselAssigned: string | null
  createdBy: string
  createdAt: string
}

export interface CommercialSheet {
  id: string
  csNo: string
  refSoId: string
  refSoNo: string
  voyageNo: string
  vesselTB: string
  barge: string
  cargoType: string
  cargoWeight: number
  origin: string
  destination: string
  riverDistance: number
  seaDistance: number
  totalDistance: number
  laycanStart: string
  laycanEnd: string
  mainEnginePower: number
  mainEngineConsumption: number
  particularEngineConsumption: number
  totalConsumption: number
  seaSpeedLoaded: number
  seaSpeedBallast: number
  riverSpeedLoaded: number
  riverSpeedBallast: number
  fuelPricePerLiter: number
  contingencyPercent: number
  operatingCosts: { description: string; unit: string; qty: number; rate: number; amount: number; remarks: string }[]
  totalOperatingCost: number
  revenueRate: number
  totalRevenue: number
  profit: number
  profitPercent: number
  notes: string
  createdBy: string
  createdAt: string
}

export type RFQFileRef = { id: string; name: string; sizeKb: number; uploadedAt: string }

// ---------- Procurement ----------
export type PRStatus = 'draft' | 'pending_dept_head' | 'pending_finance' | 'pending_procurement' | 'pending_management' | 'approved' | 'rejected'
export type PRPriority = 'Normal' | 'Urgent' | 'Critical'

export interface BunkerRequestItem {
  fuelType: string
  quantity: number
  estPrice: number
  estimatedAmount: number
  remarks: string
}

export interface PurchaseRequest {
  id: string
  prNo: string
  prDate: string
  requestBy: string
  department: string
  priority: PRPriority
  requiredDate: string
  status: PRStatus
  // Reference
  jobOrderNo: string
  salesOrderNo: string
  commercialSheetNo: string
  voyageNo: string
  contractCustomer: string
  // Vessel & position
  vesselTB: string
  barge: string
  currentLocation: string
  vesselType: string
  mainEnginePower: number
  mainEngineConsumption: number
  particularEngineConsumption: number
  totalConsumption: number
  // Fuel status
  measurementDateTime: string
  currentROB: number
  fuelTankCapacity: number
  availableCapacity: number
  // Bunker port & route
  bunkerPort: string
  distanceToBunkerPort: number
  estimatedSpeed: number
  estimatedSailingHours: number
  mainEngineConsRoute: number
  particularEngineConsRoute: number
  estimatedFuelConsumption: number
  // ROB at bunker port
  estConsumptionToBunkerPort: number
  estimatedROBAtArrival: number
  // Bunker requirement
  targetROBAfterBunkering: number
  requiredBunkerQuantity: number
  // Bunker request detail
  bunkerItems: BunkerRequestItem[]
  totalEstimatedAmount: number
  // Supplier
  preferredSupplier: string
  supplierContact: string
  supplierPhone: string
  supplierEmail: string
  // Delivery
  deliveryMethod: string
  deliveryLocation: string
  estimatedDeliveryDate: string
  estimatedDeliveryTime: string
  picAtLocation: string
  picPhone: string
  // Misc
  remarks: string
  approvalStep: number
  createdBy: string
  createdAt: string
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
