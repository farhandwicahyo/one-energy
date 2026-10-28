// Deterministic dummy data for the mockup. Same seed, same fleet, every reload.
import { addDays, addMonths, TODAY } from '../lib/dates'
import { compositionRules, docTypeById, ranks, requiredDocRules, users } from './master'
import type {
  Assignment, AuditEntry, Contract, Crew, CrewPrivate, Doc, LoginAttempt, NotificationRow,
  OpStatus, Pair, StatusHistory, Vessel, VesselAsset,
} from './types'

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20261021)
const int = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1))
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const chance = (p: number) => rand() < p
const pad = (n: number, w = 3) => String(n).padStart(w, '0')
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const WORDS = [
  'Mahakam', 'Barito', 'Kapuas', 'Musi', 'Berau', 'Kutai', 'Sangatta', 'Bontang', 'Tarakan', 'Senipah',
  'Satui', 'Kotabaru', 'Taboneo', 'Mentawir', 'Muara Jawa', 'Perkasa', 'Samudra', 'Bahari', 'Nusantara', 'Sentosa',
  'Abadi', 'Makmur', 'Lestari', 'Gemilang', 'Cahaya', 'Bintang', 'Rajawali', 'Elang', 'Camar', 'Garuda',
  'Pelangi', 'Mutiara', 'Permata', 'Selaras', 'Tangguh',
]
const PORTS = ['Samarinda', 'Balikpapan', 'Banjarmasin', 'Tarakan', 'Bontang']
const BUILDERS = ['PT Galangan Kapal Samarinda', 'PT Daya Radar Utama', 'PT Anggrek Hitam Shipyard', 'Jiangsu Zhenjiang Shipyard', 'PT Karya Teknik Utama']
const ENGINES = ['Cummins KTA38-M0', 'Mitsubishi S6R2-MTK3L', 'Yanmar 6AYM-WET', 'Caterpillar 3508C']

const FIRST = ['Ahmad', 'Agus', 'Bambang', 'Rudi', 'Joko', 'Hendro', 'Yusuf', 'Rahmat', 'Slamet', 'Teguh', 'Wahyu', 'Imam', 'Arif', 'Dwi', 'Eko', 'Fikri', 'Gilang', 'Hasan', 'Irfan', 'Kurniawan', 'Lukman', 'Mulyadi', 'Nanang', 'Putra', 'Rizky', 'Sugeng', 'Taufik', 'Udin', 'Yoga', 'Zainal', 'Aditya', 'Bayu', 'Dimas', 'Fajri', 'Hari', 'Johan', 'Krisna', 'Rendra', 'Sandi', 'Wawan']
const LAST = ['Saputra', 'Hidayat', 'Siregar', 'Nasution', 'Simanjuntak', 'Wibowo', 'Setiawan', 'Pratama', 'Gunawan', 'Kusnadi', 'Harahap', 'Lubis', 'Pangaribuan', 'Rahman', 'Syahputra', 'Tambunan', 'Utomo', 'Wijaya', 'Yulianto', 'Hutapea', 'Manurung', 'Sitompul', 'Batubara', 'Ramadhan', 'Firmansyah']
const CITIES = ['Samarinda', 'Balikpapan', 'Makassar', 'Surabaya', 'Semarang', 'Medan', 'Banjarmasin', 'Ambon', 'Manado', 'Cirebon']
const STREETS = ['Jl. Pelabuhan', 'Jl. Sungai Kunjang', 'Jl. Gajah Mada', 'Jl. Ahmad Yani', 'Jl. Pramuka', 'Jl. Juanda', 'Jl. Pangeran Antasari', 'Jl. Cendana']

// ---------- Vessels ----------
const vessels: Vessel[] = []
const assets: VesselAsset[] = []
const opStatusFor = (i: number): OpStatus =>
  [4, 17, 29].includes(i) ? 'docking' : [11, 23].includes(i) ? 'repair' : [2, 8, 14, 20, 26, 32].includes(i) ? 'standby' : 'operating'

WORDS.forEach((word, i) => {
  const n = i + 1
  const yearTb = int(2008, 2022)
  const st = opStatusFor(i)
  vessels.push({
    id: `v-tb-${n}`, code: `TB-${pad(n)}`, name: `TB Energi ${word}`, kind: 'TB', typeName: 'Tug Boat',
    gt: int(140, 290), nt: int(45, 90), loa: int(23, 32), breadth: int(7, 10), depth: Number((3 + rand() * 1.4).toFixed(1)),
    yearBuilt: yearTb, builder: pick(BUILDERS), flag: 'Indonesia', owner: 'PT OneEnergy Maritim', homePort: pick(PORTS),
    callSign: `YD${int(3000, 6999)}`, classSociety: 'Biro Klasifikasi Indonesia (BKI)', isClassRequired: true, isCoalCarrier: false,
    enginePower: pick([1200, 1600, 1800, 2000, 2400]), bollardPull: int(14, 30), mainEngine: `2 × ${pick(ENGINES)}`,
    opStatus: st, statusSince: st === 'operating' ? addDays(TODAY, -int(40, 200)) : addDays(TODAY, -int(3, 35)),
    notes: i % 7 === 0 ? 'Fire pump overhauled in August; next survey due with class renewal.' : '', isActive: true,
  })
  const coal = i % 5 !== 1 && i % 5 !== 3
  const stBg: OpStatus = i === 9 ? 'docking' : st === 'repair' ? 'standby' : st
  vessels.push({
    id: `v-bg-${n}`, code: `BG-${pad(n)}`, name: `BG Energi ${word} ${300 + n}`, kind: 'BG', typeName: coal ? 'Coal Barge' : 'Barge',
    gt: int(1500, 3200), nt: int(450, 960), loa: int(76, 92), breadth: int(22, 28), depth: Number((4.8 + rand() * 1.2).toFixed(1)),
    yearBuilt: int(2010, 2023), builder: pick(BUILDERS), flag: 'Indonesia', owner: 'PT OneEnergy Maritim', homePort: pick(PORTS),
    callSign: `YD${int(7000, 9999)}`, classSociety: 'Biro Klasifikasi Indonesia (BKI)', isClassRequired: true, isCoalCarrier: coal,
    capacityFt: pick([270, 300, 300, 330]), dwt: int(5000, 10500),
    opStatus: stBg, statusSince: stBg === 'operating' ? addDays(TODAY, -int(40, 200)) : addDays(TODAY, -int(3, 35)),
    notes: '', isActive: true,
  })
})

for (const v of vessels) {
  const acq = `${Math.max(v.yearBuilt, 2012) + int(0, 2)}-${pad(int(1, 12), 2)}-${pad(int(1, 28), 2)}`
  const value = v.kind === 'TB' ? int(18, 46) * 1_000_000_000 : int(9, 24) * 1_000_000_000
  assets.push({
    vesselId: v.id, acquisitionDate: acq > TODAY ? '2024-03-01' : acq, assetValueIdr: value,
    hullMaterial: 'Steel', generatorSets: v.kind === 'TB' ? `2 × ${pick(['Perkins', 'Yanmar', 'Cummins'])} ${pick([60, 80, 100])} kVA` : '—',
    lastOverhaul: addDays(TODAY, -int(60, 700)), insuredValueIdr: Math.round(value * 0.85),
  })
}

const vesselById = Object.fromEntries(vessels.map((v) => [v.id, v]))
const tugs = vessels.filter((v) => v.kind === 'TB')
const barges = vessels.filter((v) => v.kind === 'BG')

// ---------- Pairs ----------
const pairs: Pair[] = []
tugs.forEach((tb, i) => {
  if (i >= 34) return
  const start = addDays(TODAY, -int(20, 300))
  if (i % 4 === 0 && i + 2 < 34) {
    const prevStart = addDays(start, -int(120, 400))
    pairs.push({ id: `p-old-${i}`, tugId: tb.id, bargeId: barges[(i + 2) % 34].id, start: prevStart, end: addDays(start, -1) })
  }
  pairs.push({ id: `p-${i}`, tugId: tb.id, bargeId: barges[i].id, start, end: null })
})

// ---------- Status history ----------
const statusHistory: StatusHistory[] = []
for (const v of vessels) {
  statusHistory.push({ id: `sh-${v.id}-0`, vesselId: v.id, from: null, to: 'operating', at: '2026-02-02T09:15', userId: 'u-andi', reason: 'Initial data entry (pilot onboarding)' })
  if (chance(0.3)) {
    const d = addDays(TODAY, -int(220, 260))
    statusHistory.push({ id: `sh-${v.id}-1`, vesselId: v.id, from: 'operating', to: 'docking', at: `${d}T10:20`, userId: 'u-budi', reason: 'Scheduled intermediate docking' })
    statusHistory.push({ id: `sh-${v.id}-2`, vesselId: v.id, from: 'docking', to: 'operating', at: `${addDays(d, int(14, 30))}T14:05`, userId: 'u-budi', reason: 'Docking completed, class endorsement received' })
  }
  if (v.opStatus !== 'operating') {
    const reason = { standby: 'Waiting for charter', docking: 'Annual docking at Samarinda yard', repair: 'Main engine repair, port side', operating: '' }[v.opStatus]
    statusHistory.push({ id: `sh-${v.id}-3`, vesselId: v.id, from: 'operating', to: v.opStatus, at: `${v.statusSince}T08:40`, userId: pick(['u-budi', 'u-lina']), reason })
  }
}

// ---------- Crew ----------
const crew: Crew[] = []
const crewPrivate: CrewPrivate[] = []
const assignments: Assignment[] = []
let crewSeq = 0
const usedNames = new Set<string>()
function newCrew(rank: string, status: Crew['status']): Crew {
  crewSeq++
  let name = ''
  do name = `${pick(FIRST)} ${pick(LAST)}`
  while (usedNames.has(name))
  usedNames.add(name)
  const c: Crew = {
    id: `c-${crewSeq}`, crewNo: `CR-${pad(crewSeq, 4)}`, name, rank,
    employment: chance(0.4) ? 'contract' : 'permanent', status, joined: addDays(TODAY, -int(120, 3200)),
  }
  crew.push(c)
  const city = pick(CITIES)
  crewPrivate.push({
    crewId: c.id, nik: `64${int(10, 79)}${int(100000, 999999)}${int(1000, 9999)}${int(10, 99)}`.slice(0, 16), birthPlace: city,
    birthDate: `${int(1972, 2001)}-${pad(int(1, 12), 2)}-${pad(int(1, 28), 2)}`,
    address: `${pick(STREETS)} No. ${int(1, 180)}, ${city}`, phone: `+62 8${int(11, 59)}-${int(1000, 9999)}-${int(1000, 9999)}`,
    email: `${name.toLowerCase().replace(/ /g, '.')}@gmail.com`, emergencyName: `${pick(['Siti', 'Dewi', 'Nur', 'Ani', 'Lestari', 'Wati'])} ${name.split(' ')[1]}`,
    emergencyRelation: pick(['Spouse', 'Spouse', 'Parent', 'Sibling']), emergencyPhone: `+62 8${int(11, 59)}-${int(1000, 9999)}-${int(1000, 9999)}`,
  })
  return c
}

const tbRoster = ['MASTER', 'CO', 'CE', '2E', 'AB', 'AB', 'OILER', 'COOK']
for (const v of vessels) {
  const roster = v.kind === 'TB' ? tbRoster : ['AB']
  for (const rank of roster) {
    const c = newCrew(rank, 'on_duty')
    const signOn = addDays(TODAY, -int(10, 240))
    if (chance(0.3)) {
      const other = pick(v.kind === 'TB' ? tugs : barges)
      const prevOff = addDays(signOn, -int(20, 60))
      assignments.push({ id: `a-${c.id}-0`, crewId: c.id, vesselId: other.id, rank, signOn: addDays(prevOff, -int(150, 300)), signOff: prevOff, status: 'completed', reason: 'End of rotation' })
    }
    assignments.push({ id: `a-${c.id}`, crewId: c.id, vesselId: v.id, rank, signOn, signOff: null, status: 'active' })
  }
}
const poolRanks = ['MASTER', 'CO', '2O', 'CE', '2E', 'AB', 'AB', 'AB', 'OILER', 'OILER', 'COOK']
for (let i = 0; i < 45; i++) {
  const status: Crew['status'] = i < 25 ? 'standby' : i < 40 ? 'leave' : 'inactive'
  const c = newCrew(poolRanks[i % poolRanks.length], status)
  if (status !== 'inactive' || chance(0.5)) {
    const v = pick(tugs)
    const off = addDays(TODAY, -int(5, 120))
    assignments.push({ id: `a-${c.id}-0`, crewId: c.id, vesselId: v.id, rank: c.rank, signOn: addDays(off, -int(120, 240)), signOff: off, status: 'completed', reason: status === 'leave' ? 'Leave' : 'End of rotation' })
  }
}

// ---------- Documents ----------
type Mode = 'valid' | 'soon' | 'expired'
const docs: Doc[] = []
let docSeq = 0
const NUM_PREFIX: Record<string, string> = {
  SURAT_LAUT: 'PK.', SURAT_UKUR: 'GT.', CLASS: 'BKI/', SAFETY_CONSTRUCTION: 'SK-KON/', SAFETY_EQUIPMENT: 'SK-PER/', SAFETY_RADIO: 'SK-RAD/',
  LOAD_LINE: 'GM/', SAFE_MANNING: 'SM/', IOPP: 'IOPP/', COAL_BARGE: 'TBB/', HM_INSURANCE: 'POL-HM-', COC: '6201', BST: 'BST-', MEDICAL: 'MCU/',
  SEAMAN_BOOK: 'F ', RATING: 'RAT-', CREW_CONTRACT: 'OE/PKL/',
}
const LEVEL: Record<string, string> = { MASTER: 'ANT-III', CO: 'ANT-IV', '2O': 'ANT-V', CE: 'ATT-III', '2E': 'ATT-IV' }

function vesselRecipient() {
  const x = rand()
  return x < 0.55 ? 'u-rina' : x < 0.92 ? 'u-maya' : 'u-fajar'
}
function crewRecipient() {
  const x = rand()
  return x < 0.5 ? 'u-maya' : x < 0.9 ? 'u-rina' : 'u-fajar'
}

function makeDoc(typeId: string, ownerKind: 'vessel' | 'crew', ownerId: string, ownerCode: string, mode: Mode, recipientId: string, rank?: string): Doc {
  const t = docTypeById[typeId]
  docSeq++
  let expiresAt: string | null = null
  let issuedAt: string
  if (!t.hasExpiry) {
    issuedAt = addDays(TODAY, -int(400, 3500))
  } else {
    const span = t.validityMonths * 30
    if (mode === 'valid') expiresAt = addDays(TODAY, int(t.soonDays + 4, Math.max(t.soonDays + 12, span - 15)))
    else if (mode === 'soon') expiresAt = addDays(TODAY, int(2, t.soonDays - 2))
    else expiresAt = addDays(TODAY, -int(1, 40))
    issuedAt = addMonths(expiresAt, -t.validityMonths)
    if (issuedAt > TODAY) issuedAt = addDays(TODAY, -int(5, 30))
  }
  const year = issuedAt.slice(0, 4)
  const number = t.code === 'COC' ? `6201${int(100000, 999999)}N${int(10, 40)}` : `${NUM_PREFIX[t.code]}${int(100, 9999)}/${year}`
  const createdBy = ownerKind === 'crew' && t.sensitive ? 'u-sari' : recipientId === 'u-fajar' ? 'u-fajar' : recipientId
  const d: Doc = {
    id: `d-${docSeq}`, typeId, ownerKind, ownerId, number, level: t.code === 'COC' && rank ? LEVEL[rank] : undefined,
    issuedAt, expiresAt, issuer: t.issuer === 'Insurer' ? pick(['PT Asuransi Jasindo', 'PT Asuransi Tugu Pratama', 'PT Asuransi Raksa Pratikara']) : t.issuer,
    version: 1, isCurrent: true, previousId: null, archivedAt: null, recipientId, createdBy,
    followUp: mode === 'valid' ? null : chance(0.4) ? 'in_progress' : 'pending',
    files: [{ id: `f-${docSeq}`, name: `${t.code}_${ownerCode}.pdf`, sizeKb: int(180, 2400), kind: chance(0.85) ? 'pdf' : 'jpg', uploadedAt: `${issuedAt}T10:${pad(int(0, 59), 2)}` }],
  }
  if (t.hasExpiry && chance(0.35)) {
    docSeq++
    const prevExp = issuedAt
    const prev: Doc = {
      ...d, id: `d-${docSeq}`, number: `${NUM_PREFIX[t.code] ?? ''}${int(100, 9999)}/${prevExp.slice(0, 4)}`, issuedAt: addMonths(prevExp, -t.validityMonths),
      expiresAt: prevExp, version: 1, isCurrent: false, archivedAt: `${issuedAt}T11:00`, followUp: 'done',
      files: [{ id: `f-${docSeq}`, name: `${t.code}_${ownerCode}_v1.pdf`, sizeKb: int(180, 2400), kind: 'pdf', uploadedAt: `${addMonths(prevExp, -t.validityMonths)}T09:30` }],
    }
    docs.push(prev)
    d.version = 2
    d.previousId = prev.id
    d.files[0].name = `${t.code}_${ownerCode}_v2.pdf`
  }
  docs.push(d)
  return d
}

// Planted readiness issues: which vessels are red or yellow, and why.
type Plan = 'ok' | 'vdoc_expired' | 'vdoc_missing' | 'crew_expired' | 'composition' | 'vdoc_soon' | 'crew_soon'
const plan = new Map<string, Plan>()
const tugOrder = shuffle(tugs.map((v) => v.id))
const bargeOrder = shuffle(barges.map((v) => v.id))
const tugPlans: Plan[] = ['vdoc_expired', 'vdoc_expired', 'crew_expired', 'crew_expired', 'composition', 'composition', 'vdoc_soon', 'vdoc_soon', 'vdoc_soon', 'vdoc_soon', 'vdoc_soon', 'crew_soon', 'crew_soon', 'crew_soon', 'crew_soon', 'crew_soon', 'crew_soon']
const bargePlans: Plan[] = ['vdoc_expired', 'vdoc_expired', 'vdoc_missing', 'vdoc_soon', 'vdoc_soon', 'vdoc_soon', 'vdoc_soon', 'vdoc_soon']
tugOrder.forEach((id, i) => plan.set(id, tugPlans[i] ?? 'ok'))
bargeOrder.forEach((id, i) => plan.set(id, bargePlans[i] ?? 'ok'))

for (const v of vessels) {
  const p = plan.get(v.id)!
  const rules = requiredDocRules.filter((r) => r.scope === 'vessel' && r.target === v.kind && (!r.coalOnly || v.isCoalCarrier))
  const expiring = rules.filter((r) => docTypeById[r.typeId].hasExpiry)
  const target = pick(expiring).typeId
  for (const r of rules) {
    if (p === 'vdoc_missing' && r.typeId === target) continue
    const mode: Mode = r.typeId === target && p === 'vdoc_expired' ? 'expired' : r.typeId === target && p === 'vdoc_soon' ? 'soon' : 'valid'
    makeDoc(r.typeId, 'vessel', v.id, v.code, mode, vesselRecipient())
  }
  if (v.kind === 'TB' && chance(0.5)) makeDoc('dt-iopp', 'vessel', v.id, v.code, chance(0.15) ? 'soon' : 'valid', vesselRecipient())
}

const activeByCrew = new Map(assignments.filter((a) => a.status === 'active').map((a) => [a.crewId, a]))
const crewPlanTarget = new Map<string, { crewId: string; mode: Mode }>()
for (const [vid, p] of plan) {
  if (p !== 'crew_expired' && p !== 'crew_soon') continue
  const aboard = assignments.filter((a) => a.vesselId === vid && a.status === 'active')
  crewPlanTarget.set(pick(aboard).crewId, { crewId: vid, mode: p === 'crew_expired' ? 'expired' : 'soon' })
}

const contracts: Contract[] = []
for (const c of crew) {
  const rules = requiredDocRules.filter((r) => r.scope === 'rank' && r.target === c.rank)
  const planned = crewPlanTarget.get(c.id)
  const target = planned ? pick(rules.filter((r) => docTypeById[r.typeId].hasExpiry)).typeId : null
  const unassigned = !activeByCrew.has(c.id)
  const recip = crewRecipient()
  for (const r of rules) {
    let mode: Mode = 'valid'
    if (planned && r.typeId === target) mode = planned.mode
    else if (unassigned && docTypeById[r.typeId].hasExpiry && chance(0.08)) mode = chance(0.5) ? 'expired' : 'soon'
    makeDoc(r.typeId, 'crew', c.id, c.crewNo, mode, recip, c.rank)
  }
  if (c.employment === 'contract' && c.status !== 'inactive') {
    const d = makeDoc('dt-contract', 'crew', c.id, c.crewNo, chance(0.12) ? 'soon' : 'valid', 'u-sari')
    contracts.push({ id: `k-${c.id}`, crewId: c.id, number: d.number, type: 'PKL', start: d.issuedAt, end: d.expiresAt!, documentId: d.id })
  }
}

// Composition shortages: sign off one officer on the planned vessels.
for (const [vid, p] of plan) {
  if (p !== 'composition') continue
  const a = assignments.find((x) => x.vesselId === vid && x.status === 'active' && (x.rank === 'CO' || x.rank === '2E'))!
  a.status = 'completed'
  a.signOff = addDays(TODAY, -int(3, 12))
  a.reason = 'Medical leave'
  crew.find((c) => c.id === a.crewId)!.status = 'leave'
}

// ---------- Notifications (SINAR outbox) ----------
const notifications: NotificationRow[] = []
const WA_ERRORS = ['Number is not registered on WhatsApp', 'Provider timeout after 3 attempts', 'Template paused by provider (quality rating)']
let nSeq = 0
for (const d of docs) {
  if (!d.isCurrent || !d.expiresAt) continue
  const t = docTypeById[d.typeId]
  const recipientInactive = !users.find((u) => u.id === d.recipientId)!.active
  for (const day of t.reminderDays) {
    const date = addDays(d.expiresAt, -day)
    if (date > TODAY || date < addDays(TODAY, -75)) continue
    for (const channel of ['whatsapp', 'email'] as const) {
      nSeq++
      let status: NotificationRow['status'] = 'sent'
      let error: string | undefined
      let attempts = 1
      if (recipientInactive) {
        status = 'failed'; error = 'Recipient inactive – reassign the recipient'; attempts = 0
      } else if (date === TODAY && chance(0.5)) {
        status = 'queued'; attempts = 0
      } else if (channel === 'whatsapp' && chance(0.06)) {
        status = 'failed'; error = pick(WA_ERRORS); attempts = 3
      } else if (channel === 'email' && chance(0.02)) {
        status = 'failed'; error = 'SMTP 550: mailbox unavailable'; attempts = 3
      }
      notifications.push({ id: `n-${nSeq}`, documentId: d.id, reminderDay: day, channel, recipientId: d.recipientId, createdAt: `${date}T08:0${int(0, 9)}`, status, attempts, error })
    }
  }
}
notifications.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

// ---------- Audit log and sign-ins ----------
const audit: AuditEntry[] = []
let auSeq = 0
const recentDocs = shuffle(docs.filter((d) => d.isCurrent)).slice(0, 26)
for (const d of recentDocs) {
  auSeq++
  const t = docTypeById[d.typeId]
  const owner = d.ownerKind === 'vessel' ? vesselById[d.ownerId].name : crew.find((c) => c.id === d.ownerId)!.name
  audit.push({
    id: `au-${auSeq}`, at: `${addDays(TODAY, -int(0, 14))}T${pad(int(8, 16), 2)}:${pad(int(0, 59), 2)}`, userId: d.createdBy, action: d.version > 1 ? 'insert' : 'update',
    table: 'tbl_t_dokumen', rowLabel: `${t.name} · ${owner}`,
    diff: d.version > 1
      ? [{ field: 'nomor', before: null, after: d.number }, { field: 'tgl_berlaku', before: null, after: d.expiresAt }, { field: 'versi', before: '1', after: '2' }]
      : [{ field: 'tindak_lanjut', before: 'belum', after: 'sedang_diproses' }],
  })
}
for (const h of statusHistory.filter((s) => s.from && s.at > addDays(TODAY, -40))) {
  auSeq++
  audit.push({ id: `au-${auSeq}`, at: h.at, userId: h.userId, action: 'update', table: 'tbl_m_kapal', rowLabel: vesselById[h.vesselId].name, diff: [{ field: 'status_operasi', before: h.from, after: h.to }, { field: 'alasan', before: null, after: h.reason }] })
}
audit.push(
  { id: `au-${++auSeq}`, at: '2026-10-01T09:02', userId: 'u-andi', action: 'update', table: 'tbl_m_pengguna', rowLabel: 'Fajar Nugroho', diff: [{ field: 'is_active', before: 'true', after: 'false' }] },
  { id: `au-${++auSeq}`, at: '2026-10-14T13:40', userId: 'u-andi', action: 'update', table: 'tbl_m_jenis_dokumen', rowLabel: 'Medical Check-up', diff: [{ field: 'hari_ambang_segera', before: '60', after: '30' }] },
  { id: `au-${++auSeq}`, at: '2026-10-18T10:12', userId: 'u-andi', action: 'insert', table: 'tbl_m_jenis_dokumen', rowLabel: 'Coal Barge Special Certificate', diff: [{ field: 'kode', before: null, after: 'COAL_BARGE' }, { field: 'berlaku_untuk', before: null, after: 'kapal' }] },
  { id: `au-${++auSeq}`, at: '2026-10-20T16:22', userId: 'u-sari', action: 'update', table: 'tbl_m_kru_pribadi', rowLabel: crew[3].name, diff: [{ field: 'kontak_darurat', before: '•••• (masked)', after: '•••• (masked)' }] },
)
audit.sort((a, b) => (a.at < b.at ? 1 : -1))

const loginAttempts: LoginAttempt[] = []
for (let i = 0; i < 24; i++) {
  const u = pick(users.filter((x) => x.active))
  const fail = chance(0.15)
  loginAttempts.push({ id: `l-${i}`, at: `${addDays(TODAY, -int(0, 6))}T${pad(int(6, 18), 2)}:${pad(int(0, 59), 2)}`, username: u.username, success: !fail, ip: `10.10.${int(1, 4)}.${int(10, 200)}`, reason: fail ? 'Wrong password' : undefined })
}
loginAttempts.push({ id: 'l-x', at: '2026-10-21T07:05', username: 'fajar.n', success: false, ip: '10.10.2.77', reason: 'Account inactive' })
loginAttempts.sort((a, b) => (a.at < b.at ? 1 : -1))

export const seed = {
  vessels, assets, pairs, statusHistory, crew, crewPrivate, assignments, contracts, docs, notifications, audit, loginAttempts,
  compositionRules, requiredDocRules,
}
export type SeedData = typeof seed
export { ranks }
