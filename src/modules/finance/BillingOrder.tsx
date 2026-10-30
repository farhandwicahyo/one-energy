import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Receipt } from 'lucide-react'
import { useStore } from '../../store'
import { Badge, Button, Empty, Field, Modal, type Tone } from '../../components/ui'
import { fmtDate, TODAY } from '../../lib/dates'
import { billingLabel, billingPatch, billingStage, billingSummary } from '../../lib/billing'
import type { SalesBilling } from '../../data/types'

const section = 'rounded border-2 border-accent bg-surface'
const sectionTitle = 'bg-accent px-4 py-2 text-sm font-bold text-white rounded-t'
const billingTone: Record<string, Tone> = { waiting_payment: 'warn', paid: 'ok' }
const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n)

// Billing page of one sales order inside the Finance module. Finance marks each term as paid here, with proof of payment.
export function BillingOrderDetail({ id, from }: { id: string; from: 'invoice' | 'receipt' }) {
  const { s, can, me, updateSO } = useStore()
  const so = s.salesOrders.find((x) => x.id === id)
  const [payIdx, setPayIdx] = useState<number | null>(null)
  const [proof, setProof] = useState<SalesBilling['proof'] | null>(null)
  const back = <Link to={`/finance/billing/${from}`} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"><ArrowLeft className="size-4" /> Back to {from === 'invoice' ? 'Customer Invoice' : 'Payment Receipt'}</Link>
  if (!so) return <div>{back}<Empty title="Sales order not found">The requested sales order does not exist.</Empty></div>
  const billings = so.billings ?? []
  const total = billings.reduce((a, b) => a + b.amount, 0)
  const paid = billings.filter((b) => b.status === 'paid').reduce((a, b) => a + b.amount, 0)
  const item = (label: string, value: React.ReactNode) => <div><dt className="text-xs text-ink-2">{label}</dt><dd>{value || '-'}</dd></div>
  const th = 'px-3 py-2 text-left font-medium'
  return (
    <div>
      {back}
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <Receipt className="size-8 text-accent" /><h1 className="text-2xl font-bold text-ink">{so.soNo}</h1>
        <Badge t={billingTone[billingSummary(billings)]}>{billingLabel[billingSummary(billings)]}</Badge>
      </div>
      <p className="mb-6 text-sm text-ink-2">Billing: {billingStage(billings)}</p>
      <div className="space-y-5">
        <div className={section}><div className={sectionTitle}>Order Summary</div>
          <dl className="grid gap-x-6 gap-y-4 p-4 text-[15px] sm:grid-cols-4">
            {item('Customer', <span className="font-semibold">{so.customerName}</span>)}
            {item('Customer PO', so.poNo)}
            {item('SO Date', fmtDate(so.soDate))}
            {item('Route', `${so.portOfLoading} → ${so.portOfDischarge}`)}
            {item('Cargo', `${so.cargoType} · ${so.cargoWeight.toLocaleString()} ${so.cargoWeightUnit}`)}
            {item('Order Value', <span className="font-bold">{so.freightCurrency} {fmt(so.totalAmount)}</span>)}
            {item('Payment Terms', so.paymentTerms)}
            {item('Billing Contact', [so.customerPic, so.customerPicEmail].filter(Boolean).join(' · '))}
          </dl>
        </div>
        <div className={section}><div className={sectionTitle}>Billing Terms</div><div className="space-y-3 p-4">
          <div className="text-sm text-ink-2">Paid {fmt(paid)} / {fmt(total)} {so.freightCurrency}</div>
          <div className="overflow-x-auto rounded border border-line">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-line bg-surface-2"><th className={th}>Term</th><th className={`${th} text-right`}>%</th><th className={`${th} text-right`}>Amount</th><th className={th}>Paid</th><th className={th}>Status</th><th className={th}>Marked paid by</th><th className="w-36" /></tr></thead>
              <tbody>{billings.map((b, i) => (
                <tr key={b.id} className="border-t border-line">
                  <td className="px-3 py-2">{b.term}</td>
                  <td className="px-3 py-2 text-right">{b.percent}%</td>
                  <td className="px-3 py-2 text-right font-semibold">{b.currency} {fmt(b.amount)}</td>
                  <td className="px-3 py-2">{b.paidAt ? fmtDate(b.paidAt) : '-'}</td>
                  <td className="px-3 py-2"><Badge t={billingTone[b.status]}>{b.status === 'paid' ? 'Paid' : 'Waiting payment'}</Badge></td>
                  <td className="px-3 py-2">{b.paidBy ?? '-'}{b.proof && (b.proof.dataUrl ? <a href={b.proof.dataUrl} target="_blank" rel="noreferrer" className="block text-xs font-semibold text-accent hover:underline">View proof</a> : <span className="block text-xs text-ink-2">{b.proof.name}</span>)}</td>
                  <td className="px-3 py-2 text-right">{can('billing.write') && b.status === 'waiting_payment' && <Button size="sm" onClick={() => { setProof(null); setPayIdx(i) }}>Mark Paid</Button>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <p className="text-xs text-ink-2">Marking a term as paid requires a photo or screenshot proving the money reached the company account. The sales order completes when every term is paid.</p>
        </div></div>
      </div>
      <Modal
        open={payIdx !== null} onClose={() => setPayIdx(null)} title="Confirm payment received"
        footer={<><Button variant="secondary" onClick={() => setPayIdx(null)}>Cancel</Button><Button disabled={!proof} onClick={() => { if (payIdx === null || !proof) return; updateSO(so.id, billingPatch(billings, payIdx, { status: 'paid', paidAt: TODAY, paidBy: me.name, proof })); setPayIdx(null) }}>Mark Paid</Button></>}
      >
        <p className="mb-3 text-sm text-ink-2">{payIdx !== null && billings[payIdx] ? `${billings[payIdx].term} · ${billings[payIdx].currency} ${fmt(billings[payIdx].amount)}` : ''}</p>
        <Field label="Proof of payment *" hint="Photo or screenshot showing the money has reached the company account (JPG, PNG or PDF).">
          <input type="file" accept="image/*,.pdf" onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) { setProof(null); return }
            const reader = new FileReader()
            reader.onload = () => setProof({ name: file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)), dataUrl: typeof reader.result === 'string' ? reader.result : undefined })
            reader.readAsDataURL(file)
          }} className="block w-full text-sm text-ink file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-bold file:text-white" />
        </Field>
        {proof?.dataUrl?.startsWith('data:image') && <img src={proof.dataUrl} alt="Payment proof preview" className="mt-3 max-h-56 rounded border border-line" />}
        {proof && !proof.dataUrl?.startsWith('data:image') && <p className="mt-3 text-sm text-ink-2">{proof.name} · {proof.sizeKb.toLocaleString()} KB</p>}
      </Modal>
    </div>
  )
}
