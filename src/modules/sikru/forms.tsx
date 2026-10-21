import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ConfirmDelete, Field, Input, Modal, Select, useToast } from '../../components/ui'
import type { Crew, CrewPrivate, Employment } from '../../data/types'
import { addMonths, TODAY } from '../../lib/dates'
import { useStore } from '../../store'

const emptyPrivate: Omit<CrewPrivate, 'crewId'> = {
  nik: '', birthPlace: '', birthDate: '', address: '', phone: '', email: '', emergencyName: '', emergencyRelation: 'Spouse', emergencyPhone: '',
}

function PrivateFields({ p, set }: { p: Omit<CrewPrivate, 'crewId'>; set: (patch: Partial<CrewPrivate>) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="NIK" hint="16 digits from the KTP."><Input inputMode="numeric" maxLength={16} value={p.nik} onChange={(e) => set({ nik: e.target.value.replace(/\D/g, '') })} /></Field>
      <Field label="Phone / WhatsApp"><Input value={p.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+62 8…" /></Field>
      <Field label="Place of birth"><Input value={p.birthPlace} onChange={(e) => set({ birthPlace: e.target.value })} /></Field>
      <Field label="Date of birth"><Input type="date" value={p.birthDate} onChange={(e) => set({ birthDate: e.target.value })} /></Field>
      <Field label="Address" className="sm:col-span-2"><Input value={p.address} onChange={(e) => set({ address: e.target.value })} /></Field>
      <Field label="Email" className="sm:col-span-2"><Input type="email" value={p.email} onChange={(e) => set({ email: e.target.value })} /></Field>
      <Field label="Emergency contact"><Input value={p.emergencyName} onChange={(e) => set({ emergencyName: e.target.value })} /></Field>
      <Field label="Relation"><Select value={p.emergencyRelation} onChange={(e) => set({ emergencyRelation: e.target.value })}>{['Spouse', 'Parent', 'Sibling', 'Child', 'Other'].map((r) => <option key={r}>{r}</option>)}</Select></Field>
      <Field label="Emergency phone" className="sm:col-span-2"><Input value={p.emergencyPhone} onChange={(e) => set({ emergencyPhone: e.target.value })} /></Field>
    </div>
  )
}

// Add or edit the non-sensitive crew record. When adding, Crewing / HR also fills the personal data.
export function CrewForm({ open, onClose, crew }: { open: boolean; onClose: () => void; crew?: Crew }) {
  const { s, can, addCrew, updateCrew } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', rank: 'AB', employment: 'permanent' as Employment, joined: TODAY })
  const [p, setP] = useState(emptyPrivate)
  useEffect(() => {
    if (!open) return
    setF(crew ? { name: crew.name, rank: crew.rank, employment: crew.employment, joined: crew.joined } : { name: '', rank: 'AB', employment: 'permanent', joined: TODAY })
    setP(emptyPrivate)
  }, [open, crew])
  const withPrivate = !crew && can('crew_private.read')
  const valid = f.name.trim().length > 2 && (!withPrivate || p.nik.length === 16)

  const submit = () => {
    if (crew) {
      updateCrew(crew.id, { ...f, name: f.name.trim() })
      toast(`${f.name.trim()} saved.`)
      onClose()
    } else {
      const id = addCrew({ ...f, name: f.name.trim() }, p)
      toast(`${f.name.trim()} added as standby. Upload their certificates in E-DOC, then sign them on.`)
      onClose()
      nav(`/crew/${id}`)
    }
  }
  return (
    <Modal wide open={open} onClose={onClose} title={crew ? `Edit ${crew.name}` : 'Add crew member'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!valid} onClick={submit}>{crew ? 'Save changes' : 'Add crew member'}</Button></>}>
      <div className="space-y-6">
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-[17px] font-bold">Work</legend>
          <Field label="Full name" className="sm:col-span-2"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
          <Field label="Rank"><Select value={f.rank} onChange={(e) => setF({ ...f, rank: e.target.value })}>{s.ranks.map((r) => <option key={r.code} value={r.code}>{r.name} ({r.localName})</option>)}</Select></Field>
          <Field label="Employment" hint="Contract crew use the same assignments and documents (SI-CREW-07)."><Select value={f.employment} onChange={(e) => setF({ ...f, employment: e.target.value as Employment })}><option value="permanent">Permanent</option><option value="contract">Contract</option></Select></Field>
          <Field label="Joined on"><Input type="date" value={f.joined} onChange={(e) => setF({ ...f, joined: e.target.value })} /></Field>
        </fieldset>
        {withPrivate && (
          <fieldset>
            <legend className="mb-3 text-[17px] font-bold">Personal data <span className="text-sm font-normal text-ink-2">· visible to Crewing / HR only</span></legend>
            <PrivateFields p={p} set={(patch) => setP((x) => ({ ...x, ...patch }))} />
          </fieldset>
        )}
      </div>
    </Modal>
  )
}

export function PrivateForm({ open, onClose, crew }: { open: boolean; onClose: () => void; crew: Crew }) {
  const { s, updateCrewPrivate } = useStore()
  const toast = useToast()
  const current = s.crewPrivate.find((x) => x.crewId === crew.id)
  const [p, setP] = useState<Omit<CrewPrivate, 'crewId'>>(current ?? emptyPrivate)
  useEffect(() => { if (open) setP(current ?? emptyPrivate) }, [open, current])
  return (
    <Modal wide open={open} onClose={onClose} title={`Personal data · ${crew.name}`} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => { updateCrewPrivate(crew.id, p); toast('Personal data saved. The audit log records the change with the values masked.'); onClose() }}>Save</Button></>}>
      <PrivateFields p={p} set={(patch) => setP((x) => ({ ...x, ...patch }))} />
    </Modal>
  )
}

export function ContractForm({ open, onClose, crew }: { open: boolean; onClose: () => void; crew: Crew }) {
  const { addContract } = useStore()
  const toast = useToast()
  const [k, setK] = useState({ number: '', start: TODAY, end: addMonths(TODAY, 12), fileName: '' })
  useEffect(() => { if (open) setK({ number: '', start: TODAY, end: addMonths(TODAY, 12), fileName: '' }) }, [open])
  const valid = k.number.trim() && k.end > k.start && k.fileName
  return (
    <Modal open={open} onClose={onClose} title={`New contract · ${crew.name}`} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!valid} onClick={() => { addContract(crew.id, { ...k, number: k.number.trim() }); toast('Contract saved. Its end date now gets reminders like any other document.'); onClose() }}>Save contract</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contract number" className="sm:col-span-2"><Input value={k.number} onChange={(e) => setK({ ...k, number: e.target.value })} placeholder="OE/PKL/…" autoFocus /></Field>
        <Field label="Starts"><Input type="date" value={k.start} onChange={(e) => setK({ ...k, start: e.target.value })} /></Field>
        <Field label="Ends"><Input type="date" value={k.end} onChange={(e) => setK({ ...k, end: e.target.value })} /></Field>
        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-[15px] font-bold">Signed contract</span>
          <label className={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed px-4 py-5 text-sm ${k.fileName ? 'border-ok bg-ok-soft text-ok' : 'border-ink-3 text-ink-2 hover:bg-surface-2'}`}>
            {k.fileName || <span><span className="font-bold text-accent">Choose a PDF</span> · up to 10 MB</span>}
            <input type="file" accept=".pdf" className="sr-only" onChange={(e) => setK({ ...k, fileName: e.target.files?.[0]?.name ?? '' })} />
          </label>
          {!k.fileName && <button type="button" className="mt-2 text-[13px] text-accent hover:underline" onClick={() => setK({ ...k, fileName: `CONTRACT_${crew.crewNo}_${TODAY}.pdf` })}>Use a sample file for the demo</button>}
        </div>
      </div>
    </Modal>
  )
}

export function DeleteCrew({ crew, open, onClose, onDone }: { crew: Crew; open: boolean; onClose: () => void; onDone?: () => void }) {
  const { s, deleteCrew } = useStore()
  const toast = useToast()
  const active = s.assignments.find((a) => a.crewId === crew.id && a.status === 'active')
  const vessel = active ? s.vessels.find((v) => v.id === active.vesselId)?.name : null
  return (
    <ConfirmDelete open={open} onClose={onClose} title={`Delete ${crew.name}?`} confirmLabel="Delete crew member" onConfirm={(reason) => { deleteCrew(crew.id, reason); toast(`${crew.name} removed.`); onClose(); onDone?.() }}>
      <p>The crew record leaves every list.{vessel ? ` They are signed off ${vessel} today, which may turn that vessel red if it drops below its minimum crew.` : ''} Certificates and contracts stay in the archive.</p>
    </ConfirmDelete>
  )
}
