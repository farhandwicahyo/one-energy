import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileUp } from 'lucide-react'
import type { Doc, OpStatus, Readiness, Vessel } from '../data/types'
import { opStatusLabel, readinessLabel } from '../i18n/en'
import { addMonths, daysLeft, fmtDate, relDays, TODAY } from '../lib/dates'
import { docStatus } from '../lib/rules'
import { useStore } from '../store'
import { Button, cx, DocBadge, Field, Input, Modal, Select, Textarea, useToast } from './ui'

const cellTone: Record<Readiness, string> = { green: 'bg-ok', yellow: 'bg-warn', red: 'bg-bad' }

// All 70 vessels at once (SIMON-03): one square per vessel, grouped TB then BG.
export function FleetGrid({ vessels }: { vessels: Vessel[] }) {
  const { assessments } = useStore()
  const groups: ['TB' | 'BG', string][] = [['TB', 'Tug boats'], ['BG', 'Barges']]
  return (
    <div className="space-y-4">
      {groups.map(([k, label]) => {
        const list = vessels.filter((v) => v.kind === k)
        return (
          <div key={k}>
            <div className="mb-2 text-[13px] text-ink-2">{label} · {list.length}</div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(30px,1fr))] gap-1.5">
              {list.map((v) => {
                const a = assessments.get(v.id)!
                return (
                  <li key={v.id}>
                    <Link
                      to={`/readiness/${v.id}`}
                      title={`${v.name} · ${readinessLabel[a.status]}${a.reasons[0] ? ` · ${a.reasons[0].message}` : ''}`}
                      className={cx('tnum grid aspect-square place-items-center rounded text-[10px] font-semibold text-white transition-transform hover:scale-110', cellTone[a.status])}
                    >
                      {v.code.slice(-2)}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
      <div className="flex flex-wrap gap-4 text-[13px] text-ink-2">
        {(['green', 'yellow', 'red'] as Readiness[]).map((r) => (
          <span key={r} className="inline-flex items-center gap-1.5"><span className={cx('size-3 rounded-sm', cellTone[r])} />{readinessLabel[r]}</span>
        ))}
      </div>
    </div>
  )
}

export function DaysLeft({ date }: { date: string | null }) {
  if (!date) return <span className="text-ink-3">No expiry</span>
  const n = daysLeft(date)
  return <span className={cx('tnum', n < 0 ? 'font-medium text-bad' : n <= 30 ? 'font-medium text-warn' : 'text-ink')}>{relDays(n)}</span>
}

// E-DOC-05: a renewal records a new version; the old one is archived and its reminders stop.
export function RenewModal({ doc, open, onClose, onDone }: { doc: Doc | null; open: boolean; onClose: () => void; onDone?: (newId: string) => void }) {
  const { s, renewDocument, ownerName } = useStore()
  const toast = useToast()
  const type = doc ? s.docTypes.find((t) => t.id === doc.typeId)! : null
  const [number, setNumber] = useState('')
  const [issued, setIssued] = useState(TODAY)
  const [expires, setExpires] = useState('')
  const [issuer, setIssuer] = useState('')
  const [file, setFile] = useState<string>('')

  useEffect(() => {
    if (!doc || !type) return
    setNumber('')
    setIssued(TODAY)
    setExpires(type.hasExpiry ? addMonths(TODAY, type.validityMonths) : '')
    setIssuer(doc.issuer)
    setFile('')
  }, [doc, type])

  if (!doc || !type) return null
  const valid = number.trim() && issued && (!type.hasExpiry || expires) && file
  const submit = () => {
    const id = renewDocument(doc.id, { number: number.trim(), issuedAt: issued, expiresAt: type.hasExpiry ? expires : null, fileName: file, issuer })
    toast(`Version ${doc.version + 1} recorded. Version ${doc.version} archived and its reminders stopped.`)
    onClose()
    onDone?.(id)
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Renew ${type.name}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={!valid}>Record new version</Button></>}
    >
      <div className="mb-4 rounded bg-surface-2 p-3 text-sm">
        <div className="font-medium">{ownerName(doc)}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-ink-2">
          Current: {doc.number} · version {doc.version} · expires {fmtDate(doc.expiresAt)} <DocBadge s={docStatus(doc)} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New document number" className="sm:col-span-2"><Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder={doc.number} autoFocus /></Field>
        <Field label="Issued on"><Input type="date" value={issued} onChange={(e) => setIssued(e.target.value)} /></Field>
        {type.hasExpiry && <Field label="Valid until" hint={`Default validity ${type.validityMonths} months`}><Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} /></Field>}
        <Field label="Issued by" className="sm:col-span-2"><Input value={issuer} onChange={(e) => setIssuer(e.target.value)} /></Field>
        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-[13px] font-medium">Scan</span>
          <label className={cx('flex cursor-pointer flex-col items-center gap-1 rounded-md px-4 py-6 text-center text-sm transition-colors', file ? 'bg-ok-soft text-ok' : 'bg-surface-2 text-ink-2 hover:bg-surface-3')}>
            <FileUp className="size-5" aria-hidden />
            {file ? <span className="font-medium">{file}</span> : <span><span className="font-medium text-accent">Choose a PDF, JPG or PNG</span> · up to 10 MB</span>}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => setFile(e.target.files?.[0]?.name ?? '')} />
          </label>
          {!file && <button type="button" className="mt-2 text-[13px] text-accent hover:underline" onClick={() => setFile(`${type.code}_scan_${TODAY}.pdf`)}>Use a sample scan for the demo</button>}
        </div>
      </div>
    </Modal>
  )
}

export function StatusModal({ vessel, open, onClose }: { vessel: Vessel; open: boolean; onClose: () => void }) {
  const { changeVesselStatus } = useStore()
  const toast = useToast()
  const [to, setTo] = useState<OpStatus>(vessel.opStatus)
  const [reason, setReason] = useState('')
  useEffect(() => { if (open) { setTo(vessel.opStatus); setReason('') } }, [open, vessel.opStatus])
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Change status of ${vessel.name}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={to === vessel.opStatus || !reason.trim()} onClick={() => { changeVesselStatus(vessel.id, to, reason.trim()); toast(`${vessel.name} is now ${opStatusLabel[to].toLowerCase()}. The change is in the status history.`); onClose() }}>Save status</Button></>}
    >
      <div className="space-y-4">
        <Field label="New status">
          <Select value={to} onChange={(e) => setTo(e.target.value as OpStatus)}>
            {(Object.keys(opStatusLabel) as OpStatus[]).map((k) => <option key={k} value={k}>{opStatusLabel[k]}</option>)}
          </Select>
        </Field>
        <Field label="Reason" hint="Recorded with your name and today’s date (SISKA-03)."><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Annual docking at Samarinda yard" /></Field>
      </div>
    </Modal>
  )
}
