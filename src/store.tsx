// In-memory store standing in for the API. Every change writes an audit entry, like the real triggers would.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { config as seedConfig, docTypeById, docTypes as seedDocTypes, escalation as seedEscalation, rankByCode, ranks as masterRanks, roles as seedRoles, templates as seedTemplates, users as seedUsers, vesselTypes as seedVesselTypes } from './data/master'
import { seed } from './data/seed'
import { commercialSheets as seedCS, purchaseOrders as seedPOs, quotations as seedQuotations, rfqs as seedRFQs, salesOrders as seedSOs } from './data/sales-seed'
import { purchaseRequests as seedPRs } from './data/procurement-seed'
import type { AuditDiff, AuditEntry, CommercialSheet, Crew, CrewPrivate, Doc, DocType, FollowUp, NegotiationRound, OpStatus, PurchaseOrder, PurchaseRequest, Quotation, QuotationItem, Rank, RFQ, Readiness, RoleId, SalesOrder, Vessel, VesselAsset } from './data/types'
import { addDays, nowStamp, TODAY } from './lib/dates'
import { assessVessel, buildIndex, docStatus, worst, type Assessment } from './lib/rules'

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))

function initialState() {
  return {
    ...clone(seed),
    users: clone(seedUsers),
    roles: clone(seedRoles),
    docTypes: clone(seedDocTypes),
    templates: clone(seedTemplates),
    config: clone(seedConfig),
    escalation: clone(seedEscalation),
    vesselTypes: clone(seedVesselTypes),
    ranks: clone(masterRanks),
    rfqs: clone(seedRFQs),
    quotations: clone(seedQuotations),
    purchaseOrders: clone(seedPOs),
    salesOrders: clone(seedSOs),
    commercialSheets: clone(seedCS),
    purchaseRequests: clone(seedPRs),
  }
}
export type State = ReturnType<typeof initialState>

interface Store {
  s: State
  me: State['users'][number]
  setMe: (id: string) => void
  signedIn: boolean
  signIn: (id: string) => void
  signOut: () => void
  can: (perm: string) => boolean
  hasRole: (r: RoleId) => boolean
  assessments: Map<string, Assessment>
  pairStatus: (pairId: string) => Readiness
  assessAt: (vesselId: string, date: string) => Assessment
  currentDocs: Doc[]
  ownerName: (d: Pick<Doc, 'ownerKind' | 'ownerId'>) => string
  userName: (id: string) => string
  renewDocument: (docId: string, data: { number: string; issuedAt: string; expiresAt: string | null; fileName: string; issuer: string }) => string
  addDocument: (data: Omit<Doc, 'id' | 'version' | 'isCurrent' | 'previousId' | 'archivedAt' | 'followUp' | 'createdBy' | 'recipientId'>) => string
  setFollowUp: (docId: string, f: FollowUp) => void
  changeVesselStatus: (vesselId: string, to: OpStatus, reason: string) => void
  addVessel: (v: Omit<Vessel, 'id' | 'statusSince' | 'isActive'>) => string
  createPair: (tugId: string, bargeId: string, start: string) => string | null
  endPair: (pairId: string, end: string) => void
  signOff: (assignmentId: string, date: string, reason: string) => void
  signOn: (crewId: string, vesselId: string, rank: string, date: string) => string | null
  resendNotification: (id: string) => void
  reassignRecipient: (fromId: string, toId: string) => number
  setUserActive: (id: string, active: boolean) => void
  resetPassword: (id: string) => void
  toggleRolePermission: (roleId: RoleId, perm: string) => void
  updateConfig: (key: string, value: string) => void
  updateDocType: (id: string, patch: Partial<DocType>) => void
  setEscalation: (e: State['escalation']) => void
  updateTemplate: (id: string, body: string) => void
  setComposition: (kind: 'TB' | 'BG', rank: string, min: number) => void
  addDocType: (t: Omit<DocType, 'id'>) => void
  toggleRequiredRule: (scope: 'vessel' | 'rank', target: string, typeId: string) => void
  addUser: (u: Omit<State['users'][number], 'id' | 'lastLogin'>) => void
  updateUser: (id: string, patch: Partial<State['users'][number]>) => void
  updateVessel: (id: string, patch: Partial<Vessel>) => void
  deleteVessel: (id: string, reason: string) => void
  updateAsset: (vesselId: string, patch: Partial<VesselAsset>) => void
  addCrew: (data: Omit<Crew, 'id' | 'crewNo' | 'status'>, priv: Omit<CrewPrivate, 'crewId'>) => string
  updateCrew: (id: string, patch: Partial<Crew>) => void
  updateCrewPrivate: (id: string, patch: Partial<CrewPrivate>) => void
  deleteCrew: (id: string, reason: string) => void
  addContract: (crewId: string, k: { number: string; start: string; end: string; fileName: string }) => void
  updateDocument: (id: string, patch: Partial<Pick<Doc, 'number' | 'issuedAt' | 'expiresAt' | 'issuer' | 'level' | 'notes'>>) => void
  deleteDocument: (id: string, reason: string) => void
  saveVesselType: (t: State['vesselTypes'][number]) => void
  saveRank: (r: Rank, isNew: boolean) => void
  // Sales
  addRFQ: (data: Omit<RFQ, 'id' | 'rfqNo' | 'createdBy' | 'createdAt'>) => string
  addQuotation: (data: Omit<Quotation, 'id' | 'quotationNo' | 'negotiations' | 'currentRound' | 'status' | 'createdBy' | 'createdAt'>) => string
  updateQuotation: (id: string, patch: Partial<Quotation>) => void
  submitNegotiation: (quotationId: string, salesPrice: number) => void
  approveNegotiation: (quotationId: string, round: number) => void
  rejectNegotiation: (quotationId: string, round: number) => void
  customerRespondNegotiation: (quotationId: string, round: number, response: 'ok' | 'reject') => void
  addPO: (data: Omit<PurchaseOrder, 'id' | 'poNo' | 'createdBy' | 'createdAt'>) => string
  updatePO: (id: string, patch: Partial<PurchaseOrder>) => void
  addSO: (data: Omit<SalesOrder, 'id' | 'soNo' | 'createdBy' | 'createdAt'>) => string
  updateSO: (id: string, patch: Partial<SalesOrder>) => void
  addCommercialSheet: (data: Omit<CommercialSheet, 'id' | 'csNo' | 'createdBy' | 'createdAt'>) => string
  updateCommercialSheet: (id: string, patch: Partial<CommercialSheet>) => void
  deleteCommercialSheet: (id: string) => void
  // Procurement
  addPurchaseRequest: (data: Omit<PurchaseRequest, 'id' | 'prNo' | 'createdBy' | 'createdAt'>) => string
  updatePurchaseRequest: (id: string, patch: Partial<PurchaseRequest>) => void
  approvePR: (id: string) => void
  rejectPR: (id: string) => void
}

// Before/after pairs for the audit log, only for fields that actually changed.
function diffOf<T extends object>(before: T, patch: Partial<T>): AuditDiff[] {
  return Object.entries(patch)
    .filter(([k, v]) => JSON.stringify((before as Record<string, unknown>)[k]) !== JSON.stringify(v))
    .map(([k, v]) => ({ field: k, before: fmtVal((before as Record<string, unknown>)[k]), after: fmtVal(v) }))
}
const fmtVal = (v: unknown) => (v === null || v === undefined || v === '' ? null : Array.isArray(v) ? v.join(', ') : String(v))

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(initialState)
  const [meId, setMeId] = useState<string>(() => {
    // A demo link can pick the user, e.g. #/readiness?as=u-budi
    const asParam = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('as')
    if (asParam) return asParam
    try { return localStorage.getItem('oe.me') ?? 'u-hendra' } catch { return 'u-hendra' }
    // u-hendra is the Super Admin user
  })

  // Signed-in state lives for the browser tab: a refresh keeps you in, a new tab starts at the login page.
  // A demo link with ?as=<user> counts as signed in, so links for a given role still open directly.
  const [signedIn, setSignedIn] = useState<boolean>(() => {
    if (new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('as')) return true
    try { return sessionStorage.getItem('oe.session') === '1' } catch { return false }
  })
  const signIn = useCallback((id: string) => {
    setMeId(id)
    setSignedIn(true)
    try { localStorage.setItem('oe.me', id); sessionStorage.setItem('oe.session', '1') } catch { /* private mode */ }
  }, [])
  const signOut = useCallback(() => {
    setSignedIn(false)
    try { sessionStorage.removeItem('oe.session') } catch { /* private mode */ }
  }, [])

  const me = s.users.find((u) => u.id === meId) ?? s.users[0]
  const perms = useMemo(() => new Set(s.roles.filter((r) => me.roles.includes(r.id)).flatMap((r) => r.permissions)), [s.roles, me])

  const setMe = useCallback((id: string) => {
    setMeId(id)
    try { localStorage.setItem('oe.me', id) } catch { /* private mode */ }
  }, [])

  const index = useMemo(() => buildIndex(s.docs, s.assignments, s.crew), [s.docs, s.assignments, s.crew])
  const assessments = useMemo(() => {
    const m = new Map<string, Assessment>()
    for (const v of s.vessels) if (v.isActive) m.set(v.id, assessVessel(v, index, s.requiredDocRules, s.compositionRules))
    return m
  }, [s.vessels, index, s.requiredDocRules, s.compositionRules, s.docTypes])

  const vesselMap = useMemo(() => new Map(s.vessels.map((v) => [v.id, v])), [s.vessels])
  const crewMap = useMemo(() => new Map(s.crew.map((c) => [c.id, c])), [s.crew])
  const userMap = useMemo(() => new Map(s.users.map((u) => [u.id, u])), [s.users])
  // Documents of a deleted vessel or crew member stay in the archive but leave every list.
  const currentDocs = useMemo(() => s.docs.filter((d) => d.isCurrent && (d.ownerKind === "vessel" ? vesselMap.has(d.ownerId) : crewMap.has(d.ownerId))), [s.docs, vesselMap, crewMap])

  const audit = (entry: Omit<AuditEntry, 'id' | 'at' | 'userId'>, st: State): AuditEntry[] => [
    { id: `au-x-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: nowStamp(), userId: me.id, ...entry },
    ...st.audit,
  ]

  const ownerName = useCallback((d: Pick<Doc, 'ownerKind' | 'ownerId'>) =>
    d.ownerKind === 'vessel' ? vesselMap.get(d.ownerId)?.name ?? '—' : crewMap.get(d.ownerId)?.name ?? '—', [vesselMap, crewMap])

  const store: Store = {
    s, me, setMe, signedIn, signIn, signOut,
    can: (p) => me.roles.includes('superadmin' as any) || perms.has(p),
    hasRole: (r) => me.roles.includes(r),
    assessments,
    currentDocs,
    ownerName,
    userName: (id) => userMap.get(id)?.name ?? '—',
    pairStatus: (pairId) => {
      const p = s.pairs.find((x) => x.id === pairId)!
      return worst(assessments.get(p.tugId)?.status ?? 'green', assessments.get(p.bargeId)?.status ?? 'green')
    },
    assessAt: (vesselId, date) => assessVessel(vesselMap.get(vesselId)!, index, s.requiredDocRules, s.compositionRules, date),

    renewDocument: (docId, data) => {
      const newId = `d-new-${Date.now()}`
      setS((st) => {
        const old = st.docs.find((d) => d.id === docId)!
        const t = st.docTypes.find((x) => x.id === old.typeId)!
        const next: Doc = {
          ...old, id: newId, number: data.number, issuedAt: data.issuedAt, expiresAt: data.expiresAt, issuer: data.issuer,
          version: old.version + 1, isCurrent: true, previousId: old.id, archivedAt: null, followUp: null, createdBy: me.id,
          files: [{ id: `f-${newId}`, name: data.fileName, sizeKb: 860, kind: data.fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'jpg', uploadedAt: nowStamp() }],
        }
        const docs = st.docs.map((d) => (d.id === docId ? { ...d, isCurrent: false, archivedAt: nowStamp(), followUp: 'done' as const } : d))
        const diff: AuditDiff[] = [
          { field: 'nomor', before: old.number, after: data.number },
          { field: 'tgl_berlaku', before: old.expiresAt, after: data.expiresAt },
          { field: 'versi', before: String(old.version), after: String(next.version) },
        ]
        return {
          ...st,
          docs: [...docs, next],
          // Pending reminders for the archived version stop; queued ones are dropped.
          notifications: st.notifications.filter((n) => !(n.documentId === docId && n.status === 'queued')),
          audit: audit({ action: 'insert', table: 'tbl_t_dokumen', rowLabel: `${t.name} · ${ownerName(old)}`, diff }, st),
        }
      })
      return newId
    },

    addDocument: (data) => {
      const id = `d-new-${Date.now()}`
      setS((st) => {
        const t = st.docTypes.find((x) => x.id === data.typeId)!
        const existing = st.docs.find((d) => d.isCurrent && d.ownerId === data.ownerId && d.typeId === data.typeId)
        const docs = existing ? st.docs.map((d) => (d.id === existing.id ? { ...d, isCurrent: false, archivedAt: nowStamp() } : d)) : st.docs
        const doc: Doc = {
          ...data, id, version: existing ? existing.version + 1 : 1, isCurrent: true, previousId: existing?.id ?? null, archivedAt: null,
          followUp: null, createdBy: me.id, recipientId: me.id,
        }
        return { ...st, docs: [...docs, doc], audit: audit({ action: 'insert', table: 'tbl_t_dokumen', rowLabel: `${t.name} · ${ownerName(data)}`, diff: [{ field: 'nomor', before: null, after: data.number }, { field: 'tgl_berlaku', before: null, after: data.expiresAt }] }, st) }
      })
      return id
    },

    setFollowUp: (docId, f) => setS((st) => {
      const d = st.docs.find((x) => x.id === docId)!
      return {
        ...st,
        docs: st.docs.map((x) => (x.id === docId ? { ...x, followUp: f } : x)),
        audit: audit({ action: 'update', table: 'tbl_t_tindak_lanjut', rowLabel: `${st.docTypes.find((t) => t.id === d.typeId)!.name} · ${ownerName(d)}`, diff: [{ field: 'status', before: d.followUp, after: f }] }, st),
      }
    }),

    changeVesselStatus: (vesselId, to, reason) => setS((st) => {
      const v = st.vessels.find((x) => x.id === vesselId)!
      return {
        ...st,
        vessels: st.vessels.map((x) => (x.id === vesselId ? { ...x, opStatus: to, statusSince: TODAY } : x)),
        statusHistory: [...st.statusHistory, { id: `sh-x-${Date.now()}`, vesselId, from: v.opStatus, to, at: nowStamp(), userId: me.id, reason }],
        audit: audit({ action: 'update', table: 'tbl_m_kapal', rowLabel: v.name, diff: [{ field: 'status_operasi', before: v.opStatus, after: to }, { field: 'alasan', before: null, after: reason }] }, st),
      }
    }),

    addVessel: (data) => {
      const id = `v-new-${Date.now()}`
      setS((st) => ({
        ...st,
        vessels: [...st.vessels, { ...data, id, statusSince: TODAY, isActive: true }],
        assets: [...st.assets, { vesselId: id, acquisitionDate: TODAY, assetValueIdr: 0, hullMaterial: 'Steel', generatorSets: '', lastOverhaul: TODAY, insuredValueIdr: 0 }],
        statusHistory: [...st.statusHistory, { id: `sh-${id}`, vesselId: id, from: null, to: data.opStatus, at: nowStamp(), userId: me.id, reason: 'Vessel created' }],
        audit: audit({ action: 'insert', table: 'tbl_m_kapal', rowLabel: data.name, diff: [{ field: 'nama', before: null, after: data.name }, { field: 'kode', before: null, after: data.code }] }, st),
      }))
      return id
    },

    createPair: (tugId, bargeId, start) => {
      const clash = s.pairs.find((p) => p.bargeId === bargeId && !p.end)
      if (clash) return `${vesselMap.get(bargeId)?.name} is still paired with ${vesselMap.get(clash.tugId)?.name}. End that pair first (409 KONFLIK_PERIODE).`
      setS((st) => ({
        ...st,
        pairs: [...st.pairs, { id: `p-x-${Date.now()}`, tugId, bargeId, start, end: null }],
        audit: audit({ action: 'insert', table: 'tbl_r_pasangan_tb_bg', rowLabel: `${vesselMap.get(tugId)?.name} + ${vesselMap.get(bargeId)?.name}`, diff: [{ field: 'tgl_mulai', before: null, after: start }] }, st),
      }))
      return null
    },

    endPair: (pairId, end) => setS((st) => {
      const p = st.pairs.find((x) => x.id === pairId)!
      return {
        ...st,
        pairs: st.pairs.map((x) => (x.id === pairId ? { ...x, end } : x)),
        audit: audit({ action: 'update', table: 'tbl_r_pasangan_tb_bg', rowLabel: `${vesselMap.get(p.tugId)?.name} + ${vesselMap.get(p.bargeId)?.name}`, diff: [{ field: 'tgl_selesai', before: null, after: end }] }, st),
      }
    }),

    signOff: (assignmentId, date, reason) => setS((st) => {
      const a = st.assignments.find((x) => x.id === assignmentId)!
      const c = st.crew.find((x) => x.id === a.crewId)!
      return {
        ...st,
        assignments: st.assignments.map((x) => (x.id === assignmentId ? { ...x, status: 'completed' as const, signOff: date, reason } : x)),
        crew: st.crew.map((x) => (x.id === a.crewId ? { ...x, status: 'standby' as const } : x)),
        audit: audit({ action: 'update', table: 'tbl_t_penugasan_kru', rowLabel: `${c.name} · ${vesselMap.get(a.vesselId)?.name}`, diff: [{ field: 'tgl_sign_off', before: null, after: date }, { field: 'status', before: 'aktif', after: 'selesai' }] }, st),
      }
    }),

    signOn: (crewId, vesselId, rank, date) => {
      const c = crewMap.get(crewId)!
      if (c.status === 'inactive') return `${c.name} is inactive and cannot be signed on.`
      const active = s.assignments.find((a) => a.crewId === crewId && a.status === 'active')
      if (active) return `${c.name} is still active on ${vesselMap.get(active.vesselId)?.name}. Sign off first (409 KONFLIK_PERIODE).`
      setS((st) => ({
        ...st,
        assignments: [...st.assignments, { id: `a-x-${Date.now()}`, crewId, vesselId, rank, signOn: date, signOff: null, status: 'active' }],
        crew: st.crew.map((x) => (x.id === crewId ? { ...x, status: 'on_duty' as const } : x)),
        audit: audit({ action: 'insert', table: 'tbl_t_penugasan_kru', rowLabel: `${c.name} · ${vesselMap.get(vesselId)?.name}`, diff: [{ field: 'tgl_sign_on', before: null, after: date }, { field: 'jabatan', before: null, after: rank }] }, st),
      }))
      return null
    },

    resendNotification: (id) => setS((st) => ({
      ...st,
      notifications: st.notifications.map((n) => (n.id === id ? { ...n, status: 'sent' as const, attempts: n.attempts + 1, error: undefined, createdAt: nowStamp() } : n)),
    })),

    reassignRecipient: (fromId, toId) => {
      const count = s.docs.filter((d) => d.isCurrent && d.recipientId === fromId).length
      setS((st) => ({
        ...st,
        docs: st.docs.map((d) => (d.isCurrent && d.recipientId === fromId ? { ...d, recipientId: toId } : d)),
        notifications: st.notifications.map((n) => (n.recipientId === fromId && n.status === 'failed' ? { ...n, recipientId: toId, status: 'queued' as const, error: undefined } : n)),
        audit: audit({ action: 'update', table: 'tbl_t_dokumen', rowLabel: `${count} documents`, diff: [{ field: 'penerima_pengingat_id', before: userMap.get(fromId)?.name ?? fromId, after: userMap.get(toId)?.name ?? toId }] }, st),
      }))
      return count
    },

    setUserActive: (id, active) => setS((st) => ({
      ...st,
      users: st.users.map((u) => (u.id === id ? { ...u, active } : u)),
      audit: audit({ action: 'update', table: 'tbl_m_pengguna', rowLabel: userMap.get(id)!.name, diff: [{ field: 'is_active', before: String(!active), after: String(active) }] }, st),
    })),

    resetPassword: (id) => setS((st) => ({
      ...st,
      audit: audit({ action: 'update', table: 'tbl_m_pengguna', rowLabel: userMap.get(id)!.name, diff: [{ field: 'is_wajib_ganti_sandi', before: 'false', after: 'true' }] }, st),
    })),

    toggleRolePermission: (roleId, perm) => setS((st) => {
      const role = st.roles.find((r) => r.id === roleId)!
      const has = role.permissions.includes(perm)
      return {
        ...st,
        roles: st.roles.map((r) => (r.id === roleId ? { ...r, permissions: has ? r.permissions.filter((p) => p !== perm) : [...r.permissions, perm] } : r)),
        audit: audit({ action: has ? 'delete' : 'insert', table: 'tbl_r_peran_izin', rowLabel: `${role.name} · ${perm}`, diff: [{ field: 'izin', before: has ? perm : null, after: has ? null : perm }] }, st),
      }
    }),

    updateConfig: (key, value) => setS((st) => {
      const c = st.config.find((x) => x.key === key)!
      return { ...st, config: st.config.map((x) => (x.key === key ? { ...x, value } : x)), audit: audit({ action: 'update', table: 'tbl_s_konfigurasi', rowLabel: key, diff: [{ field: 'nilai', before: c.value, after: value }] }, st) }
    }),

    updateDocType: (id, patch) => setS((st) => {
      const t = st.docTypes.find((x) => x.id === id)!
      const diff = Object.entries(patch).map(([k, v]) => ({ field: k, before: String((t as unknown as Record<string, unknown>)[k]), after: String(v) }))
      // The rules read the shared type table, so keep it in step with the store.
      Object.assign(docTypeById[id], patch)
      return { ...st, docTypes: st.docTypes.map((x) => (x.id === id ? { ...x, ...patch } : x)), audit: audit({ action: 'update', table: 'tbl_m_jenis_dokumen', rowLabel: t.name, diff }, st) }
    }),

    setEscalation: (e) => setS((st) => ({
      ...st,
      escalation: e,
      audit: audit({ action: 'update', table: 'tbl_s_eskalasi', rowLabel: 'Escalation rule', diff: [{ field: 'is_aktif', before: String(st.escalation.active), after: String(e.active) }, { field: 'hari_sebelum', before: String(st.escalation.daysBefore), after: String(e.daysBefore) }] }, st),
    })),

    updateTemplate: (id, body) => setS((st) => ({
      ...st,
      templates: st.templates.map((t) => (t.id === id ? { ...t, body, approval: t.channel === 'whatsapp' ? 'pending' as const : t.approval } : t)),
      audit: audit({ action: 'update', table: 'tbl_m_templat_pesan', rowLabel: st.templates.find((t) => t.id === id)!.name, diff: [{ field: 'isi', before: '…', after: '…' }] }, st),
    })),

    setComposition: (kind, rank, min) => setS((st) => {
      const existing = st.compositionRules.find((c) => !c.vesselId && c.kind === kind && c.rank === rank)
      const rules = existing
        ? min === 0 ? st.compositionRules.filter((c) => c !== existing) : st.compositionRules.map((c) => (c === existing ? { ...c, min } : c))
        : min > 0 ? [...st.compositionRules, { id: `cm-x-${Date.now()}`, kind, rank, min }] : st.compositionRules
      return { ...st, compositionRules: rules, audit: audit({ action: 'update', table: 'tbl_r_komposisi_minimal', rowLabel: `${kind} · ${rank}`, diff: [{ field: 'jml_min', before: String(existing?.min ?? 0), after: String(min) }] }, st) }
    }),

    addDocType: (t) => setS((st) => {
      const id = `dt-x-${Date.now()}`
      const full = { ...t, id }
      docTypeById[id] = full
      return { ...st, docTypes: [...st.docTypes, full], audit: audit({ action: 'insert', table: 'tbl_m_jenis_dokumen', rowLabel: t.name, diff: [{ field: 'kode', before: null, after: t.code }, { field: 'berlaku_untuk', before: null, after: t.object }] }, st) }
    }),

    toggleRequiredRule: (scope, target, typeId) => setS((st) => {
      const existing = st.requiredDocRules.find((r) => r.scope === scope && r.target === target && r.typeId === typeId)
      const name = st.docTypes.find((t) => t.id === typeId)!.name
      return {
        ...st,
        requiredDocRules: existing ? st.requiredDocRules.filter((r) => r !== existing) : [...st.requiredDocRules, { id: `rq-x-${Date.now()}`, scope, target, typeId }],
        audit: audit({ action: existing ? 'delete' : 'insert', table: scope === 'vessel' ? 'tbl_r_dokumen_wajib_kapal' : 'tbl_r_dokumen_wajib_jabatan', rowLabel: `${target} · ${name}`, diff: [{ field: 'wajib', before: existing ? 'true' : null, after: existing ? null : 'true' }] }, st),
      }
    }),

    addUser: (u) => setS((st) => ({
      ...st,
      users: [...st.users, { ...u, id: `u-x-${Date.now()}`, lastLogin: null }],
      audit: audit({ action: 'insert', table: 'tbl_m_pengguna', rowLabel: u.name, diff: [{ field: 'username', before: null, after: u.username }, { field: 'peran', before: null, after: u.roles.join(', ') }] }, st),
    })),

    updateUser: (id, patch) => setS((st) => {
      const u = st.users.find((x) => x.id === id)!
      return { ...st, users: st.users.map((x) => (x.id === id ? { ...x, ...patch } : x)), audit: audit({ action: 'update', table: 'tbl_m_pengguna', rowLabel: u.name, diff: diffOf(u, patch) }, st) }
    }),

    // ---------- SISKA ----------
    updateVessel: (id, patch) => setS((st) => {
      const v = st.vessels.find((x) => x.id === id)!
      return { ...st, vessels: st.vessels.map((x) => (x.id === id ? { ...x, ...patch } : x)), audit: audit({ action: 'update', table: 'tbl_m_kapal', rowLabel: v.name, diff: diffOf(v, patch) }, st) }
    }),

    // Deleting a vessel ends its pairing and signs its crew off today; its documents are kept for the record.
    deleteVessel: (id, reason) => setS((st) => {
      const v = st.vessels.find((x) => x.id === id)!
      const leaving = st.assignments.filter((a) => a.vesselId === id && a.status === 'active').map((a) => a.crewId)
      return {
        ...st,
        vessels: st.vessels.filter((x) => x.id !== id),
        pairs: st.pairs.map((p) => (!p.end && (p.tugId === id || p.bargeId === id) ? { ...p, end: TODAY } : p)),
        assignments: st.assignments.map((a) => (a.vesselId === id && a.status === 'active' ? { ...a, status: 'completed' as const, signOff: TODAY, reason: 'Vessel removed from fleet' } : a)),
        crew: st.crew.map((c) => (leaving.includes(c.id) ? { ...c, status: 'standby' as const } : c)),
        audit: audit({ action: 'delete', table: 'tbl_m_kapal', rowLabel: v.name, diff: [{ field: 'is_active', before: 'true', after: 'false' }, { field: 'alasan', before: null, after: reason }] }, st),
      }
    }),

    updateAsset: (vesselId, patch) => setS((st) => {
      const a = st.assets.find((x) => x.vesselId === vesselId)!
      return { ...st, assets: st.assets.map((x) => (x.vesselId === vesselId ? { ...x, ...patch } : x)), audit: audit({ action: 'update', table: 'tbl_m_kapal_aset', rowLabel: vesselMap.get(vesselId)?.name ?? vesselId, diff: diffOf(a, patch) }, st) }
    }),

    // ---------- SI-CREW ----------
    addCrew: (data, priv) => {
      const id = `c-x-${Date.now()}`
      setS((st) => {
        const no = `CR-${String(st.crew.length + 1).padStart(4, '0')}`
        return {
          ...st,
          crew: [...st.crew, { ...data, id, crewNo: no, status: 'standby' }],
          crewPrivate: [...st.crewPrivate, { ...priv, crewId: id }],
          audit: audit({ action: 'insert', table: 'tbl_m_kru', rowLabel: data.name, diff: [{ field: 'nomor_kru', before: null, after: no }, { field: 'jabatan', before: null, after: data.rank }] }, st),
        }
      })
      return id
    },

    updateCrew: (id, patch) => setS((st) => {
      const c = st.crew.find((x) => x.id === id)!
      return { ...st, crew: st.crew.map((x) => (x.id === id ? { ...x, ...patch } : x)), audit: audit({ action: 'update', table: 'tbl_m_kru', rowLabel: c.name, diff: diffOf(c, patch) }, st) }
    }),

    updateCrewPrivate: (id, patch) => setS((st) => {
      const c = st.crew.find((x) => x.id === id)!
      const fields = Object.keys(patch).map((field) => ({ field, before: '•••• (masked)', after: '•••• (masked)' }))
      return { ...st, crewPrivate: st.crewPrivate.map((x) => (x.crewId === id ? { ...x, ...patch } : x)), audit: audit({ action: 'update', table: 'tbl_m_kru_pribadi', rowLabel: c.name, diff: fields }, st) }
    }),

    deleteCrew: (id, reason) => setS((st) => {
      const c = st.crew.find((x) => x.id === id)!
      return {
        ...st,
        crew: st.crew.filter((x) => x.id !== id),
        assignments: st.assignments.map((a) => (a.crewId === id && a.status === 'active' ? { ...a, status: 'completed' as const, signOff: TODAY, reason: 'Crew record removed' } : a)),
        audit: audit({ action: 'delete', table: 'tbl_m_kru', rowLabel: c.name, diff: [{ field: 'is_active', before: 'true', after: 'false' }, { field: 'alasan', before: null, after: reason }] }, st),
      }
    }),

    // SI-CREW-06: one call records the contract and its sensitive E-DOC document together.
    addContract: (crewId, k) => setS((st) => {
      const c = st.crew.find((x) => x.id === crewId)!
      const docId = `d-k-${Date.now()}`
      const prev = st.docs.find((d) => d.isCurrent && d.ownerId === crewId && d.typeId === 'dt-contract')
      const doc: Doc = {
        id: docId, typeId: 'dt-contract', ownerKind: 'crew', ownerId: crewId, number: k.number, issuedAt: k.start, expiresAt: k.end, issuer: 'OneEnergy HR',
        version: prev ? prev.version + 1 : 1, isCurrent: true, previousId: prev?.id ?? null, archivedAt: null, recipientId: me.id, createdBy: me.id, followUp: null,
        files: [{ id: `f-${docId}`, name: k.fileName, sizeKb: 420, kind: 'pdf', uploadedAt: nowStamp() }],
      }
      return {
        ...st,
        docs: [...st.docs.map((d) => (prev && d.id === prev.id ? { ...d, isCurrent: false, archivedAt: nowStamp() } : d)), doc],
        contracts: [...st.contracts, { id: `k-x-${Date.now()}`, crewId, number: k.number, type: 'PKL', start: k.start, end: k.end, documentId: docId }],
        audit: audit({ action: 'insert', table: 'tbl_t_kontrak_kru', rowLabel: c.name, diff: [{ field: 'nomor', before: null, after: k.number }, { field: 'tgl_berakhir', before: null, after: k.end }] }, st),
      }
    }),

    // ---------- E-DOC ----------
    updateDocument: (id, patch) => setS((st) => {
      const d = st.docs.find((x) => x.id === id)!
      const t = st.docTypes.find((x) => x.id === d.typeId)!
      return { ...st, docs: st.docs.map((x) => (x.id === id ? { ...x, ...patch } : x)), audit: audit({ action: 'update', table: 'tbl_t_dokumen', rowLabel: `${t.name} · ${ownerName(d)}`, diff: diffOf(d, patch) }, st) }
    }),

    // Soft delete: the version before it (if any) becomes current again.
    deleteDocument: (id, reason) => setS((st) => {
      const d = st.docs.find((x) => x.id === id)!
      const t = st.docTypes.find((x) => x.id === d.typeId)!
      return {
        ...st,
        docs: st.docs.filter((x) => x.id !== id).map((x) => (x.id === d.previousId ? { ...x, isCurrent: true, archivedAt: null } : x)),
        notifications: st.notifications.filter((n) => n.documentId !== id),
        audit: audit({ action: 'delete', table: 'tbl_t_dokumen', rowLabel: `${t.name} · ${ownerName(d)}`, diff: [{ field: 'nomor', before: d.number, after: null }, { field: 'alasan', before: null, after: reason }] }, st),
      }
    }),

    // ---------- Master data (SIGUNA-05) ----------
    saveVesselType: (t) => setS((st) => {
      const existing = st.vesselTypes.find((x) => x.id === t.id)
      return {
        ...st,
        vesselTypes: existing ? st.vesselTypes.map((x) => (x.id === t.id ? t : x)) : [...st.vesselTypes, t],
        audit: audit({ action: existing ? 'update' : 'insert', table: 'tbl_m_jenis_kapal', rowLabel: t.name, diff: existing ? diffOf(existing, t) : [{ field: 'kode', before: null, after: t.code }] }, st),
      }
    }),

    saveRank: (r, isNew) => {
      // Rules and labels read the shared rank table, so keep it in step with the store.
      const i = masterRanks.findIndex((x) => x.code === r.code)
      if (i >= 0) masterRanks[i] = r
      else masterRanks.push(r)
      rankByCode[r.code] = r
      setS((st) => {
        const existing = st.ranks.find((x) => x.code === r.code)
        return {
          ...st,
          ranks: existing ? st.ranks.map((x) => (x.code === r.code ? r : x)) : [...st.ranks, r],
          audit: audit({ action: isNew ? 'insert' : 'update', table: 'tbl_m_jabatan', rowLabel: r.name, diff: existing ? diffOf(existing, r) : [{ field: 'kode', before: null, after: r.code }] }, st),
        }
      })
    },
  }

  // ---------- Sales ----------
  store.addRFQ = (data) => {
    const id = `rfq-x-${Date.now()}`
    const rfqNo = `RFQ-2026-${String(s.rfqs.length + 1).padStart(4, '0')}`
    setS((st) => ({
      ...st,
      rfqs: [...st.rfqs, { ...data, id, rfqNo, createdBy: me.id, createdAt: nowStamp() }],
      audit: audit({ action: 'insert', table: 'tbl_t_rfq', rowLabel: rfqNo, diff: [{ field: 'customer', before: null, after: data.customerName }] }, st),
    }))
    return id
  }

  store.addQuotation = (data) => {
    const id = `quo-x-${Date.now()}`
    const quotationNo = `QUO-2026-${String(s.quotations.length + 1).padStart(4, '0')}`
    setS((st) => ({
      ...st,
      quotations: [...st.quotations, { ...data, id, quotationNo, negotiations: [], currentRound: 0, status: 'draft', createdBy: me.id, createdAt: nowStamp() }],
      audit: audit({ action: 'insert', table: 'tbl_t_quotation', rowLabel: quotationNo, diff: [{ field: 'customer', before: null, after: data.customerName }, { field: 'total', before: null, after: String(data.totalAmount) }] }, st),
    }))
    return id
  }

  store.updateQuotation = (id, patch) => setS((st) => {
    const q = st.quotations.find((x) => x.id === id)!
    return { ...st, quotations: st.quotations.map((x) => (x.id === id ? { ...x, ...patch } : x)), audit: audit({ action: 'update', table: 'tbl_t_quotation', rowLabel: q.quotationNo, diff: diffOf(q, patch) }, st) }
  })

  store.submitNegotiation = (quotationId, salesPrice) => setS((st) => {
    const q = st.quotations.find((x) => x.id === quotationId)!
    const round = q.currentRound + 1
    const neg: NegotiationRound = {
      round, salesPrice, submittedAt: nowStamp(),
      approvalStatus: 'pending', approvedBy: null, approvedAt: null,
      customerResponse: null, customerRespondedAt: null,
    }
    return {
      ...st,
      quotations: st.quotations.map((x) => (x.id === quotationId ? { ...x, status: 'negotiation' as const, currentRound: round, negotiations: [...x.negotiations, neg] } : x)),
      audit: audit({ action: 'update', table: 'tbl_t_quotation', rowLabel: q.quotationNo, diff: [{ field: 'negotiation_round', before: String(q.currentRound), after: String(round) }, { field: 'price', before: null, after: String(salesPrice) }] }, st),
    }
  })

  store.approveNegotiation = (quotationId, round) => setS((st) => {
    const q = st.quotations.find((x) => x.id === quotationId)!
    const negs = q.negotiations.map((n) => n.round === round ? { ...n, approvalStatus: 'approved' as const, approvedBy: me.id, approvedAt: nowStamp() } : n)
    return {
      ...st,
      quotations: st.quotations.map((x) => (x.id === quotationId ? { ...x, negotiations: negs } : x)),
      audit: audit({ action: 'update', table: 'tbl_t_negotiation', rowLabel: `${q.quotationNo} R${round}`, diff: [{ field: 'approval', before: 'pending', after: 'approved' }] }, st),
    }
  })

  store.rejectNegotiation = (quotationId, round) => setS((st) => {
    const q = st.quotations.find((x) => x.id === quotationId)!
    const negs = q.negotiations.map((n) => n.round === round ? { ...n, approvalStatus: 'rejected' as const, approvedBy: me.id, approvedAt: nowStamp() } : n)
    return {
      ...st,
      quotations: st.quotations.map((x) => (x.id === quotationId ? { ...x, negotiations: negs } : x)),
      audit: audit({ action: 'update', table: 'tbl_t_negotiation', rowLabel: `${q.quotationNo} R${round}`, diff: [{ field: 'approval', before: 'pending', after: 'rejected' }] }, st),
    }
  })

  store.customerRespondNegotiation = (quotationId, round, response) => setS((st) => {
    const q = st.quotations.find((x) => x.id === quotationId)!
    const negs = q.negotiations.map((n) => n.round === round ? { ...n, customerResponse: response, customerRespondedAt: nowStamp() } : n)
    let status = q.status
    if (response === 'ok') status = 'approved'
    else if (round >= 2) status = 'expired'
    return {
      ...st,
      quotations: st.quotations.map((x) => (x.id === quotationId ? { ...x, status, negotiations: negs } : x)),
      audit: audit({ action: 'update', table: 'tbl_t_negotiation', rowLabel: `${q.quotationNo} R${round}`, diff: [{ field: 'customer_response', before: 'pending', after: response }] }, st),
    }
  })

  store.addPO = (data) => {
    const id = `po-x-${Date.now()}`
    const poNo = `PO-2026-${String(s.purchaseOrders.length + 1).padStart(4, '0')}`
    setS((st) => ({
      ...st,
      purchaseOrders: [...st.purchaseOrders, { ...data, id, poNo, createdBy: me.id, createdAt: nowStamp() }],
      audit: audit({ action: 'insert', table: 'tbl_t_po', rowLabel: poNo, diff: [{ field: 'quotation_ref', before: null, after: data.quotationNo }, { field: 'total', before: null, after: String(data.totalAmount) }] }, st),
    }))
    return id
  }

  store.updatePO = (id, patch) => setS((st) => {
    const p = st.purchaseOrders.find((x) => x.id === id)!
    return { ...st, purchaseOrders: st.purchaseOrders.map((x) => (x.id === id ? { ...x, ...patch } : x)), audit: audit({ action: 'update', table: 'tbl_t_po', rowLabel: p.poNo, diff: diffOf(p, patch) }, st) }
  })

  store.addSO = (data) => {
    const id = `so-x-${Date.now()}`
    const soNo = `SO-2026-${String(s.salesOrders.length + 1).padStart(4, '0')}`
    setS((st) => ({
      ...st,
      salesOrders: [...st.salesOrders, { ...data, id, soNo, createdBy: me.id, createdAt: nowStamp() }],
      audit: audit({ action: 'insert', table: 'tbl_t_so', rowLabel: soNo, diff: [{ field: 'po_ref', before: null, after: data.poNo }, { field: 'total', before: null, after: String(data.totalAmount) }] }, st),
    }))
    return id
  }

  store.updateSO = (id, patch) => setS((st) => {
    const so = st.salesOrders.find((x) => x.id === id)!
    return { ...st, salesOrders: st.salesOrders.map((x) => (x.id === id ? { ...x, ...patch } : x)), audit: audit({ action: 'update', table: 'tbl_t_so', rowLabel: so.soNo, diff: diffOf(so, patch) }, st) }
  })

  store.addCommercialSheet = (data) => {
    const id = `cs-x-${Date.now()}`
    const csNo = `CS-2026-${String(s.commercialSheets.length + 1).padStart(4, '0')}`
    setS((st) => ({
      ...st,
      commercialSheets: [...st.commercialSheets, { ...data, id, csNo, createdBy: me.id, createdAt: nowStamp() }],
      audit: audit({ action: 'insert', table: 'tbl_t_commercial_sheet', rowLabel: csNo, diff: [{ field: 'so_ref', before: null, after: data.refSoNo }, { field: 'profit', before: null, after: String(data.profit) }] }, st),
    }))
    return id
  }

  store.updateCommercialSheet = (id, patch) => setS((st) => {
    const cs = st.commercialSheets.find((x) => x.id === id)!
    return { ...st, commercialSheets: st.commercialSheets.map((x) => (x.id === id ? { ...x, ...patch } : x)), audit: audit({ action: 'update', table: 'tbl_t_commercial_sheet', rowLabel: cs.csNo, diff: diffOf(cs, patch) }, st) }
  })

  store.deleteCommercialSheet = (id) => setS((st) => {
    const cs = st.commercialSheets.find((x) => x.id === id)!
    return { ...st, commercialSheets: st.commercialSheets.filter((x) => x.id !== id), audit: audit({ action: 'delete', table: 'tbl_t_commercial_sheet', rowLabel: cs.csNo, diff: [{ field: 'deleted', before: 'false', after: 'true' }] }, st) }
  })

  // ---------- Procurement ----------
  store.addPurchaseRequest = (data) => {
    const id = `pr-x-${Date.now()}`
    const prNo = `PR-${TODAY.replace(/-/g, '').slice(0, 8)}-${String(s.purchaseRequests.length + 1).padStart(3, '0')}`
    setS((st) => ({
      ...st,
      purchaseRequests: [...st.purchaseRequests, { ...data, id, prNo, createdBy: me.id, createdAt: nowStamp() }],
      audit: audit({ action: 'insert', table: 'tbl_t_purchase_request', rowLabel: prNo, diff: [{ field: 'vessel', before: null, after: data.vesselTB }, { field: 'total', before: null, after: String(data.totalEstimatedAmount) }] }, st),
    }))
    return id
  }

  store.updatePurchaseRequest = (id, patch) => setS((st) => {
    const pr = st.purchaseRequests.find((x) => x.id === id)!
    return { ...st, purchaseRequests: st.purchaseRequests.map((x) => (x.id === id ? { ...x, ...patch } : x)), audit: audit({ action: 'update', table: 'tbl_t_purchase_request', rowLabel: pr.prNo, diff: diffOf(pr, patch) }, st) }
  })

  store.approvePR = (id) => setS((st) => {
    const pr = st.purchaseRequests.find((x) => x.id === id)!
    const steps: PurchaseRequest['status'][] = ['draft', 'pending_dept_head', 'pending_finance', 'pending_procurement', 'pending_management', 'approved']
    const nextIdx = Math.min(pr.approvalStep + 1, steps.length - 1)
    return {
      ...st,
      purchaseRequests: st.purchaseRequests.map((x) => (x.id === id ? { ...x, status: steps[nextIdx], approvalStep: nextIdx } : x)),
      audit: audit({ action: 'update', table: 'tbl_t_purchase_request', rowLabel: pr.prNo, diff: [{ field: 'status', before: pr.status, after: steps[nextIdx] }] }, st),
    }
  })

  store.rejectPR = (id) => setS((st) => {
    const pr = st.purchaseRequests.find((x) => x.id === id)!
    return {
      ...st,
      purchaseRequests: st.purchaseRequests.map((x) => (x.id === id ? { ...x, status: 'rejected' as const } : x)),
      audit: audit({ action: 'update', table: 'tbl_t_purchase_request', rowLabel: pr.prNo, diff: [{ field: 'status', before: pr.status, after: 'rejected' }] }, st),
    }
  })

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider missing')
  return s
}

// Shared derived helpers
export function useDocRows() {
  const { currentDocs, s, ownerName, userName } = useStore()
  return useMemo(() => currentDocs.map((d) => {
    const t = s.docTypes.find((x) => x.id === d.typeId)!
    return { doc: d, type: t, status: docStatus(d), owner: ownerName(d), recipient: userName(d.recipientId) }
  }), [currentDocs, s.docTypes, ownerName, userName])
}

export function useExpiryBuckets() {
  const rows = useDocRows()
  return useMemo(() => {
    const within = (n: number) => rows.filter((r) => r.doc.expiresAt && r.doc.expiresAt >= TODAY && r.doc.expiresAt <= addDays(TODAY, n)).length
    return { d30: within(30), d60: within(60), d90: within(90), expired: rows.filter((r) => r.status === 'expired').length }
  }, [rows])
}
