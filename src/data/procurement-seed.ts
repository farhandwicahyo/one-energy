import { addDays, TODAY } from '../lib/dates'
import type { PurchaseRequest, BunkerRequestItem, PRStatus, PRPriority } from './types'

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20261028)
const int = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1))
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const pad = (n: number, w = 4) => String(n).padStart(w, '0')

const REQUESTERS = ['Budi Santoso', 'Andi Pratama', 'Eko Wahyudi', 'Agus Setiawan']
const DEPARTMENTS = ['Operation', 'Bunker', 'Maintenance']
const VESSELS_TB = ['TB Taboneo', 'TB Mahakam', 'TB Barito', 'TB Kapuas', 'TB Perkasa']
const BARGES = ['BG-001', 'BG-002', 'BG-003', 'BG-004', 'BG-005']
const LOCATIONS = ['Tg. Tiram', 'Muara Berau', 'Samarinda', 'Balikpapan', 'Banjarmasin']
const BUNKER_PORTS = ['Sungai Danau', 'Tanjung Pemancingan', 'Muara Jawa', 'Lawe-Lawe']
const SUPPLIERS = ['PT Pertamina', 'PT AKR Corporindo', 'PT Shell Indonesia', 'PT Elnusa']
const SUPPLIER_CONTACTS = ['Andi Wijaya', 'Rina Kartika', 'Hendra Saputra', 'Maya Sari']
const CUSTOMERS = ['PT ABC Logistics', 'PT Adaro Energy', 'PT Bayan Resources', 'PT Kideco Jaya Agung']

export const purchaseRequests: PurchaseRequest[] = []

for (let i = 1; i <= 6; i++) {
  const dayOffset = -int(1, 15)
  const prDate = addDays(TODAY, dayOffset)
  const vesselTB = pick(VESSELS_TB)
  const barge = pick(BARGES)
  const mainHP = pick([1800, 2000, 2400])
  const mainCons = pick([100, 120, 140])
  const partCons = pick([20, 25, 30])
  const totalCons = mainCons + partCons
  const currentROB = int(15000, 25000)
  const tankCapacity = 60000
  const distance = int(80, 200)
  const speed = pick([3, 3.5, 4])
  const sailingHours = +(distance / speed).toFixed(2)
  const fuelConsumption = Math.round(sailingHours * totalCons)
  const robAtArrival = currentROB - fuelConsumption
  const targetROB = int(40000, 50000)
  const requiredBunker = targetROB - robAtArrival
  const fuelPrice = pick([20000, 22000, 24000])

  const items: BunkerRequestItem[] = [
    { fuelType: 'MGO / Solar', quantity: requiredBunker, estPrice: fuelPrice, estimatedAmount: requiredBunker * fuelPrice, remarks: `Bunker di ${pick(BUNKER_PORTS)}` },
    { fuelType: 'MGO / Solar', quantity: 5000, estPrice: fuelPrice, estimatedAmount: 5000 * fuelPrice, remarks: 'Additional / Contingency' },
  ]
  const totalAmt = items.reduce((s, it) => s + it.estimatedAmount, 0)

  const statuses: PRStatus[] = ['draft', 'pending_dept_head', 'pending_finance', 'pending_procurement', 'pending_management', 'approved']
  const status = statuses[Math.min(i - 1, statuses.length - 1)]
  const approvalStep = statuses.indexOf(status)

  const supplier = pick(SUPPLIERS)
  const contact = pick(SUPPLIER_CONTACTS)
  const bunkerPort = pick(BUNKER_PORTS)

  purchaseRequests.push({
    id: `pr-${pad(i)}`,
    prNo: `PR-${prDate.replace(/-/g, '').slice(0, 8)}-${pad(i, 3)}`,
    prDate,
    requestBy: pick(REQUESTERS),
    department: pick(DEPARTMENTS),
    priority: pick(['Normal', 'Urgent', 'Critical'] as PRPriority[]),
    requiredDate: addDays(prDate, int(3, 10)),
    status,
    jobOrderNo: `JO-${prDate.replace(/-/g, '').slice(0, 8)}-${pad(i, 3)}`,
    salesOrderNo: `SO-2026-${pad(int(1, 4), 3)}`,
    commercialSheetNo: `CS-2026-${pad(int(1, 3))}`,
    voyageNo: `VYG-2026-${pad(int(1, 99), 3)}`,
    contractCustomer: pick(CUSTOMERS),
    vesselTB,
    barge,
    currentLocation: pick(LOCATIONS),
    vesselType: 'Tug Boat',
    mainEnginePower: mainHP,
    mainEngineConsumption: mainCons,
    particularEngineConsumption: partCons,
    totalConsumption: totalCons,
    measurementDateTime: `${prDate} 08:00`,
    currentROB,
    fuelTankCapacity: tankCapacity,
    availableCapacity: tankCapacity - currentROB,
    bunkerPort,
    distanceToBunkerPort: distance,
    estimatedSpeed: speed,
    estimatedSailingHours: sailingHours,
    mainEngineConsRoute: mainCons,
    particularEngineConsRoute: partCons,
    estimatedFuelConsumption: fuelConsumption,
    estConsumptionToBunkerPort: fuelConsumption,
    estimatedROBAtArrival: robAtArrival,
    targetROBAfterBunkering: targetROB,
    requiredBunkerQuantity: requiredBunker,
    bunkerItems: items,
    totalEstimatedAmount: totalAmt,
    preferredSupplier: supplier,
    supplierContact: contact,
    supplierPhone: `0812 ${int(1000, 9999)} ${int(1000, 9999)}`,
    supplierEmail: `${contact.toLowerCase().replace(' ', '.')}@${supplier.toLowerCase().replace(/pt /g, '').replace(/ /g, '')}.co.id`,
    deliveryMethod: 'Barge to Vessel',
    deliveryLocation: `${bunkerPort} Jetty`,
    estimatedDeliveryDate: addDays(prDate, int(3, 7)),
    estimatedDeliveryTime: `${pad(int(6, 18), 2)}:00`,
    picAtLocation: pick(REQUESTERS),
    picPhone: `0813 ${int(1000, 9999)} ${int(1000, 9999)}`,
    remarks: i <= 2 ? `Permintaan bunker untuk ${vesselTB} sebelum voyage ${pick(LOCATIONS)} – ${pick(LOCATIONS)}` : '',
    approvalStep,
    createdBy: 'u-budi',
    createdAt: prDate + 'T08:00',
  })
}
