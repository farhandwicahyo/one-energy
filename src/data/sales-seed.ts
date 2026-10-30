import { addDays, TODAY } from '../lib/dates'
import { buildBillings } from '../lib/billing'
import type { CommercialSheet, NegotiationRound, Quotation, QuotationItem, SalesOrder } from './types'

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20261022)
const int = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1))
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const pad = (n: number, w = 4) => String(n).padStart(w, '0')

const CUSTOMERS = [
  'PT Adaro Energy', 'PT Bayan Resources', 'PT Kideco Jaya Agung', 'PT Berau Coal',
  'PT Kaltim Prima Coal', 'PT Indominco Mandiri', 'PT Arutmin Indonesia', 'PT Multi Harapan Utama',
  'PT Trubaindo Coal Mining', 'PT Bharinto Ekatama',
]
const PIC_NAMES = ['Budi Santoso', 'Andi Pratama', 'Rina Kartika', 'Dewi Lestari', 'Agus Setiawan', 'Maya Sari', 'Hendra Wijaya', 'Sari Rahayu']
const PIC_POSITIONS = ['Logistics Manager', 'Procurement Head', 'Shipping Coordinator', 'Operations Manager', 'Supply Chain Manager']
const ORIGINS = ['Samarinda', 'Balikpapan', 'Banjarmasin', 'Muara Berau', 'Sangatta']
const PORTS_LOADING = ['Jetty Sungai Danau', 'Jetty Taboneo', 'Dermaga Banjarmasin', 'Pelabuhan Samarinda', 'Jetty Muara Berau']
const PORTS_DISCHARGE = ['Cilegon', 'Merak', 'Surabaya', 'Gresik', 'Semarang', 'Jakarta']
const DESTINATIONS = ['Surabaya', 'Jakarta', 'Semarang', 'Gresik', 'Cirebon', 'Merak', 'Cilegon']
const CARGO = ['Coal (Sub-bituminous)', 'Coal (Bituminous)', 'Coal (Lignite)', 'Nickel Ore', 'Iron Ore']
const SHIPMENT_TYPES = ['Transshipments', 'Direct Loading', 'Floating Crane']
const PAYMENT_TERMS_LIST = [
  '25% when SPAL Signed, 50% when start to sailing and 25% before berthing at destination',
  '50% advance, 50% upon completion',
  '100% upon loading completion',
  '30% advance, 40% on sailing, 30% on discharge',
]
const SALES_NAMES = ['Rina Wulandari', 'Andi Pratama', 'Hendra Wijaya']
const VESSELS_TB = ['TB Taboneo', 'TB Mahakam', 'TB Barito', 'TB Kapuas', 'TB Perkasa']
const BARGES = ['BG-001', 'BG-002', 'BG-003', 'BG-004', 'BG-005']

// ---------- Quotation ----------
export const quotations: Quotation[] = []
for (let i = 1; i <= 8; i++) {
  const dayOffset = -int(1, 45)
  const requestDate = addDays(TODAY, dayOffset)
  const customerName = pick(CUSTOMERS)
  const cargoType = pick(CARGO)
  const cargoTonnage = int(3, 15) * 1000
  const origin = pick(ORIGINS)
  const destination = pick(DESTINATIONS)
  const freightRate = int(80, 150) * 1000
  const totalFreight = freightRate * cargoTonnage
  const items: QuotationItem[] = [
    { description: 'Freight charge', unit: 'MT', qty: cargoTonnage, unitPrice: freightRate, amount: totalFreight },
    { description: 'Loading supervision', unit: 'Lumpsum', qty: 1, unitPrice: int(15, 30) * 1000000, amount: int(15, 30) * 1000000 },
    { description: 'Insurance surcharge', unit: '%', qty: 1, unitPrice: Math.round(totalFreight * 0.005), amount: Math.round(totalFreight * 0.005) },
  ]
  const totalAmount = items.reduce((s, x) => s + x.amount, 0)

  const negotiations: NegotiationRound[] = []
  let status: Quotation['status'] = 'draft'
  let currentRound = 0

  if (i <= 6) {
    negotiations.push({
      round: 1,
      salesPrice: totalAmount,
      submittedAt: addDays(requestDate, 2) + 'T10:00',
      approvalStatus: 'approved',
      approvedBy: 'u-hendra',
      approvedAt: addDays(requestDate, 2) + 'T14:00',
      customerResponse: i <= 4 ? 'ok' : 'reject',
      customerRespondedAt: addDays(requestDate, 5) + 'T09:00',
    })
    currentRound = 1

    if (i <= 4) {
      status = 'approved'
    } else {
      const revisedAmount = Math.round(totalAmount * 0.95)
      negotiations.push({
        round: 2,
        salesPrice: revisedAmount,
        submittedAt: addDays(requestDate, 7) + 'T10:00',
        approvalStatus: 'approved',
        approvedBy: 'u-hendra',
        approvedAt: addDays(requestDate, 7) + 'T15:00',
        customerResponse: i === 5 ? 'ok' : 'reject',
        customerRespondedAt: addDays(requestDate, 10) + 'T09:00',
      })
      currentRound = 2
      status = i === 5 ? 'approved' : 'expired'
    }
  } else if (i === 7) {
    status = 'negotiation'
    negotiations.push({
      round: 1,
      salesPrice: totalAmount,
      submittedAt: addDays(requestDate, 2) + 'T10:00',
      approvalStatus: 'pending',
      approvedBy: null,
      approvedAt: null,
      customerResponse: null,
      customerRespondedAt: null,
    })
    currentRound = 1
  }

  quotations.push({
    id: `quo-${pad(i)}`,
    quotationNo: `QUO-2026-${pad(i)}`,
    customerAddress: 'Jl. Jenderal Sudirman No. 1, Jakarta',
    customerPic: i <= 3 ? 'Agus Prasetyo' : pick(PIC_NAMES),
    customerPicPosition: pick(PIC_POSITIONS),
    customerPicPhone: i <= 3 ? '+62 812-5500-1200' : `0812 ${int(1000, 9999)} ${int(1000, 9999)}`,
    customerPicEmail: i <= 3 ? 'agus.p@customer.co.id' : `pic${i}@${customerName.toLowerCase().replace(/pt /g, '').replace(/ /g, '').slice(0, 10)}.co.id`,
    customerName,
    customerId: `01.${int(100, 999)}.${int(100, 999)}.${int(1, 9)}-${int(100, 999)}.000`,
    consigneeName: customerName,
    shipperName: customerName,
    shipmentType: pick(SHIPMENT_TYPES),
    origin,
    destination,
    portOfLoading: origin,
    portOfDischarge: destination,
    cargoType,
    cargoTonnage,
    laycanStart: addDays(requestDate, 10),
    laycanEnd: addDays(requestDate, 20),
    items,
    totalAmount,
    validUntil: addDays(TODAY, 14),
    status,
    negotiations,
    currentRound,
    quotationDate: requestDate,
    salesName: pick(SALES_NAMES),
    freightPrice: totalFreight,
    freightCurrency: 'IDR',
    freightBasis: 'Per MT',
    paymentTerms: pick(PAYMENT_TERMS_LIST),
    freeTime: pick([3, 5, 7]),
    freeTimeUnit: 'Days',
    createdBy: 'u-rina',
    createdAt: addDays(requestDate, 1) + 'T09:00',
  })
}

// ---------- Sales Orders (created from approved quotations) ----------
export const salesOrders: SalesOrder[] = []
const approvedQuotations = quotations.filter((q) => q.status === 'approved').slice(0, 4)
for (let i = 0; i < approvedQuotations.length; i++) {
  const quo = approvedQuotations[i]
  const soDate = addDays(TODAY, -int(1, 20))
  salesOrders.push({
    id: `so-${pad(i + 1)}`,
    soNo: `SO-${TODAY.replace(/-/g, '').slice(0, 8)}-${pad(i + 1, 3)}`,
    poNo: `PO-${quo.customerName.replace(/^PT /, "").slice(0, 3).toUpperCase()}-${pad(i + 1, 3)}`,
    customerName: quo.customerName,
    salesName: quo.salesName ?? pick(SALES_NAMES),
    shipmentType: quo.shipmentType ?? pick(SHIPMENT_TYPES),
    laycanStart: addDays(soDate, int(5, 15)),
    laycanEnd: addDays(soDate, int(16, 25)),
    portOfLoading: pick(PORTS_LOADING),
    portOfDischarge: pick(PORTS_DISCHARGE),
    freeTime: pick([3, 5, 7]),
    freeTimeUnit: 'Days',
    cargoType: quo.cargoType,
    cargoWeight: int(5, 10) * 1000,
    cargoWeightUnit: 'MT',
    dwt: int(8, 12) * 1000,
    dwtUnit: 'MT',
    freightPrice: int(300, 600) * 1000000,
    freightCurrency: 'IDR',
    freightBasis: 'Per Voyage',
    paymentTerms: quo.paymentTerms ?? pick(PAYMENT_TERMS_LIST),
    customerPic: pick(PIC_NAMES),
    customerPicPhone: `0812 ${int(1000, 9999)} ${int(1000, 9999)}`,
    customerPicEmail: `${pick(PIC_NAMES).toLowerCase().replace(' ', '.')}@${quo.customerName.toLowerCase().replace(/pt /g, '').replace(/ /g, '').slice(0, 10)}.co.id`,
    customerPicPosition: pick(PIC_POSITIONS),
    remarks: i === 0 ? `Pengangkutan batubara dari ${quo.origin} ke ${quo.destination}.` : '',
    origin: quo.origin,
    destination: quo.destination,
    totalAmount: quo.totalAmount,
    soDate,
    status: i < 1 ? 'active' : i < 3 ? 'completed' : 'active',
    vesselAssigned: null,
    createdBy: 'u-rina',
    createdAt: soDate + 'T10:00',
  })
}

// Billing milestones follow each SO's payment terms; earlier orders are further along.
salesOrders.forEach((so) => {
  const billings = buildBillings(so.paymentTerms, so.totalAmount, so.freightCurrency)
  billings.forEach((b, j) => {
    b.id = `bill-${so.id}-${j}`
    const paid = so.status === 'completed' || (so.id === 'so-001' && j < 1)
    if (!paid) return
    b.status = 'paid'
    b.paidAt = addDays(so.soDate, 5 + j * 4)
    b.paidBy = 'Nina Permata'
  })
  so.billings = billings

})

// ---------- Commercial Sheets ----------
export const commercialSheets: CommercialSheet[] = []
for (let i = 0; i < Math.min(salesOrders.length, 3); i++) {
  const so = salesOrders[i]
  const riverDist = int(30, 80)
  const seaDist = int(400, 700)
  const totalDist = riverDist + seaDist
  const mainHP = pick([1800, 2000, 2400])
  const mainCons = pick([100, 120, 140])
  const partCons = pick([20, 25, 30])
  const totalCons = mainCons + partCons
  const fuelPrice = pick([20000, 22000, 24000])
  const contingency = 5

  const seaSpeedLoaded = 3
  const seaSpeedBallast = 4
  const riverSpeedLoaded = 2
  const riverSpeedBallast = 3

  const loadedSeaHours = +(seaDist / seaSpeedLoaded).toFixed(2)
  const loadedRiverHours = +(riverDist / riverSpeedLoaded).toFixed(2)
  const ballastSeaHours = +(seaDist / seaSpeedBallast).toFixed(2)
  const ballastRiverHours = +(riverDist / riverSpeedBallast).toFixed(2)
  const totalHoursLoaded = loadedSeaHours + loadedRiverHours
  const totalHoursBallast = ballastSeaHours + ballastRiverHours
  const totalFuelLoaded = Math.round(totalHoursLoaded * totalCons)
  const totalFuelBallast = Math.round(totalHoursBallast * totalCons)
  const totalFuel = totalFuelLoaded + totalFuelBallast
  const fuelCost = totalFuel * fuelPrice

  const opCosts = [
    { description: 'Keagenan Kapal - Origin', unit: 'LS', qty: 1, rate: 15000000, amount: 15000000, remarks: `Agency at ${so.origin}` },
    { description: 'Keagenan Kapal - Destination', unit: 'LS', qty: 1, rate: 15000000, amount: 15000000, remarks: `Agency at ${so.destination}` },
    { description: 'Perjalanan Crew & Logistik', unit: 'LS', qty: 1, rate: 10000000, amount: 10000000, remarks: 'Makanan & logistik 10 orang' },
    { description: 'Insentif Crew', unit: 'LS', qty: 1, rate: 25000000, amount: 25000000, remarks: 'Crew incentive' },
  ]
  const totalOpCost = opCosts.reduce((s, c) => s + c.amount, 0)
  const contingencyAmount = Math.round((fuelCost + totalOpCost) * contingency / 100)
  const totalOperatingCost = fuelCost + totalOpCost + contingencyAmount

  const revenueRate = so.freightPrice
  const totalRevenue = revenueRate
  const profit = totalRevenue - totalOperatingCost
  const profitPercent = totalRevenue > 0 ? +(profit / totalRevenue * 100).toFixed(1) : 0

  commercialSheets.push({
    id: `cs-${pad(i + 1)}`,
    csNo: `CS-2026-${pad(i + 1)}`,
    refSoId: so.id,
    refSoNo: so.soNo,
    voyageNo: `VYG-2026-${pad(int(1, 99), 3)}`,
    vesselTB: pick(VESSELS_TB),
    barge: pick(BARGES),
    cargoType: so.cargoType,
    cargoWeight: so.cargoWeight,
    origin: so.origin,
    destination: so.destination,
    riverDistance: riverDist,
    seaDistance: seaDist,
    totalDistance: totalDist,
    laycanStart: so.laycanStart,
    laycanEnd: so.laycanEnd,
    mainEnginePower: mainHP,
    mainEngineConsumption: mainCons,
    particularEngineConsumption: partCons,
    totalConsumption: totalCons,
    seaSpeedLoaded,
    seaSpeedBallast,
    riverSpeedLoaded,
    riverSpeedBallast,
    fuelPricePerLiter: fuelPrice,
    contingencyPercent: contingency,
    operatingCosts: opCosts,
    totalOperatingCost,
    revenueRate,
    totalRevenue,
    profit,
    profitPercent,
    notes: `Perhitungan berdasarkan spesifikasi ${pick(VESSELS_TB)}:\n- Main Engine ${mainHP} HP (${mainCons} L/hour)\n- Kecepatan sea loaded ${seaSpeedLoaded} knot, ballast ${seaSpeedBallast} knot`,
    createdBy: 'u-rina',
    createdAt: so.createdAt,
  })
}
