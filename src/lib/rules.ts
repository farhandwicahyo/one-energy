// Client-side mirror of vw_dokumen_status and fn_alasan_kesiapan (TRD 6.4, 6.6).
import { docTypeById, rankByCode } from '../data/master'
import type { Assignment, CompositionRule, Crew, Doc, DocStatus, Readiness, RequiredDocRule, Vessel } from '../data/types'
import { daysBetween, fmtDate, relDays, TODAY } from './dates'

export function docStatus(doc: Pick<Doc, 'typeId' | 'expiresAt'>, ref = TODAY): DocStatus {
  if (!doc.expiresAt) return 'valid'
  if (doc.expiresAt < ref) return 'expired'
  const t = docTypeById[doc.typeId]
  return daysBetween(ref, doc.expiresAt) <= t.soonDays ? 'soon' : 'valid'
}

export type ReasonCode =
  | 'DOK_KAPAL_TIDAK_ADA' | 'DOK_KAPAL_EXPIRED' | 'DOK_KAPAL_SEGERA'
  | 'DOK_KRU_TIDAK_ADA' | 'DOK_KRU_EXPIRED' | 'DOK_KRU_SEGERA'
  | 'KOMPOSISI_KURANG'

export interface Reason {
  code: ReasonCode
  severity: 'red' | 'yellow'
  vesselId: string
  crewId?: string
  rank?: string
  typeId?: string
  docId?: string
  expiresAt?: string | null
  ownerUserId?: string
  message: string
}

export interface Assessment {
  status: Readiness
  reasons: Reason[]
}

export interface Index {
  currentDoc: Map<string, Doc>
  activeByVessel: Map<string, Assignment[]>
  crewById: Map<string, Crew>
}

export const docKey = (kind: string, ownerId: string, typeId: string) => `${kind}:${ownerId}:${typeId}`

export function buildIndex(docs: Doc[], assignments: Assignment[], crew: Crew[]): Index {
  const currentDoc = new Map<string, Doc>()
  for (const d of docs) if (d.isCurrent) currentDoc.set(docKey(d.ownerKind, d.ownerId, d.typeId), d)
  const activeByVessel = new Map<string, Assignment[]>()
  for (const a of assignments) {
    if (a.status !== 'active') continue
    const list = activeByVessel.get(a.vesselId) ?? []
    list.push(a)
    activeByVessel.set(a.vesselId, list)
  }
  return { currentDoc, activeByVessel, crewById: new Map(crew.map((c) => [c.id, c])) }
}

function checkDoc(doc: Doc | undefined, ref: string) {
  if (!doc) return 'missing' as const
  return docStatus(doc, ref)
}

export function assessVessel(v: Vessel, idx: Index, rules: RequiredDocRule[], comp: CompositionRule[], ref = TODAY): Assessment {
  const reasons: Reason[] = []
  const when = (d: Doc) => {
    const n = daysBetween(ref, d.expiresAt!)
    if (n < 0 && d.expiresAt! >= TODAY) return `expires on ${fmtDate(d.expiresAt)}, before departure`
    if (ref !== TODAY) return n < 0 ? `expired on ${fmtDate(d.expiresAt)}` : `expires ${relDays(n)} after departure (${fmtDate(d.expiresAt)})`
    return n < 0 ? `expired on ${fmtDate(d.expiresAt)}` : `expires ${relDays(n)} (${fmtDate(d.expiresAt)})`
  }

  for (const r of rules) {
    if (r.scope !== 'vessel' || r.target !== v.kind || (r.coalOnly && !v.isCoalCarrier)) continue
    const t = docTypeById[r.typeId]
    const d = idx.currentDoc.get(docKey('vessel', v.id, r.typeId))
    const s = checkDoc(d, ref)
    if (s === 'missing') reasons.push({ code: 'DOK_KAPAL_TIDAK_ADA', severity: 'red', vesselId: v.id, typeId: r.typeId, message: `Required document missing: ${t.name}` })
    else if (s === 'expired') reasons.push({ code: 'DOK_KAPAL_EXPIRED', severity: 'red', vesselId: v.id, typeId: r.typeId, docId: d!.id, expiresAt: d!.expiresAt, ownerUserId: d!.recipientId, message: `${t.name} ${when(d!)}` })
    else if (s === 'soon') reasons.push({ code: 'DOK_KAPAL_SEGERA', severity: 'yellow', vesselId: v.id, typeId: r.typeId, docId: d!.id, expiresAt: d!.expiresAt, ownerUserId: d!.recipientId, message: `${t.name} ${when(d!)}` })
  }

  const aboard = idx.activeByVessel.get(v.id) ?? []
  for (const a of aboard) {
    const c = idx.crewById.get(a.crewId)
    if (!c) continue
    const rankName = rankByCode[a.rank]?.name ?? a.rank
    for (const r of rules) {
      if (r.scope !== 'rank' || r.target !== a.rank) continue
      const t = docTypeById[r.typeId]
      const d = idx.currentDoc.get(docKey('crew', c.id, r.typeId))
      const s = checkDoc(d, ref)
      const who = `${c.name} (${rankName})`
      if (s === 'missing') reasons.push({ code: 'DOK_KRU_TIDAK_ADA', severity: 'red', vesselId: v.id, crewId: c.id, rank: a.rank, typeId: r.typeId, message: `${who}: ${t.name} missing` })
      else if (s === 'expired') reasons.push({ code: 'DOK_KRU_EXPIRED', severity: 'red', vesselId: v.id, crewId: c.id, rank: a.rank, typeId: r.typeId, docId: d!.id, expiresAt: d!.expiresAt, ownerUserId: d!.recipientId, message: `${who}: ${t.name} ${when(d!)}` })
      else if (s === 'soon') reasons.push({ code: 'DOK_KRU_SEGERA', severity: 'yellow', vesselId: v.id, crewId: c.id, rank: a.rank, typeId: r.typeId, docId: d!.id, expiresAt: d!.expiresAt, ownerUserId: d!.recipientId, message: `${who}: ${t.name} ${when(d!)}` })
    }
  }

  for (const rule of effectiveComposition(v, comp)) {
    const have = aboard.filter((a) => a.rank === rule.rank).length
    if (have < rule.min) {
      reasons.push({ code: 'KOMPOSISI_KURANG', severity: 'red', vesselId: v.id, rank: rule.rank, message: `Crew short: ${rankByCode[rule.rank]?.name ?? rule.rank} ${have} of ${rule.min} aboard` })
    }
  }

  reasons.sort((a, b) => (a.severity === b.severity ? (a.expiresAt ?? '') < (b.expiresAt ?? '') ? -1 : 1 : a.severity === 'red' ? -1 : 1))
  const status: Readiness = reasons.some((r) => r.severity === 'red') ? 'red' : reasons.length ? 'yellow' : 'green'
  return { status, reasons }
}

// A vessel-specific rule overrides the type rule for the same rank (TRD 6.3).
export function effectiveComposition(v: Vessel, comp: CompositionRule[]): CompositionRule[] {
  const own = comp.filter((c) => c.vesselId === v.id)
  const base = comp.filter((c) => !c.vesselId && c.kind === v.kind && !own.some((o) => o.rank === c.rank))
  return [...base, ...own]
}

const order: Record<Readiness, number> = { green: 0, yellow: 1, red: 2 }
export const worst = (a: Readiness, b: Readiness): Readiness => (order[a] >= order[b] ? a : b)
