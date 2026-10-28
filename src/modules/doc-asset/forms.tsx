import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ConfirmDelete, Field, Input, Modal, Select, Textarea, useToast } from '../../components/ui'
import type { OpStatus, Vessel, VesselAsset } from '../../data/types'
import { opStatusLabel } from '../../i18n/en'
import { useStore } from '../../store'

const num = (v: string) => (v.trim() === '' ? 0 : Number(v.replace(',', '.')) || 0)

type Draft = Record<
  'name' | 'typeName' | 'gt' | 'nt' | 'loa' | 'breadth' | 'depth' | 'yearBuilt' | 'builder' | 'flag' | 'owner' | 'homePort' | 'callSign' |
  'classSociety' | 'mainEngine' | 'enginePower' | 'bollardPull' | 'capacityFt' | 'dwt' | 'notes', string
> & { kind: 'TB' | 'BG'; isClassRequired: boolean; isCoalCarrier: boolean; opStatus: OpStatus }

const toDraft = (v?: Vessel): Draft => ({
  name: v?.name ?? '', kind: v?.kind ?? 'TB', typeName: v?.typeName ?? 'Tug Boat',
  gt: String(v?.gt ?? ''), nt: String(v?.nt ?? ''), loa: String(v?.loa ?? ''), breadth: String(v?.breadth ?? ''), depth: String(v?.depth ?? ''),
  yearBuilt: String(v?.yearBuilt ?? new Date().getFullYear()), builder: v?.builder ?? '', flag: v?.flag ?? 'Indonesia', owner: v?.owner ?? 'PT OneEnergy Maritim',
  homePort: v?.homePort ?? 'Samarinda', callSign: v?.callSign ?? '', classSociety: v?.classSociety ?? 'Biro Klasifikasi Indonesia (BKI)',
  mainEngine: v?.mainEngine ?? '', enginePower: String(v?.enginePower ?? ''), bollardPull: String(v?.bollardPull ?? ''),
  capacityFt: String(v?.capacityFt ?? ''), dwt: String(v?.dwt ?? ''), notes: v?.notes ?? '',
  isClassRequired: v?.isClassRequired ?? true, isCoalCarrier: v?.isCoalCarrier ?? false, opStatus: v?.opStatus ?? 'standby',
})

// One form for both "Add vessel" and "Edit vessel" (SISKA-01, SISKA-05).
export function VesselForm({ open, onClose, vessel }: { open: boolean; onClose: () => void; vessel?: Vessel }) {
  const { s, addVessel, updateVessel } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const [f, setF] = useState<Draft>(() => toDraft(vessel))
  useEffect(() => { if (open) setF(toDraft(vessel)) }, [open, vessel])
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setF((x) => ({ ...x, [k]: v }))

  const dup = s.vessels.some((v) => v.id !== vessel?.id && v.name.toLowerCase() === f.name.trim().toLowerCase())
  const types = s.vesselTypes.filter((t) => t.category === f.kind && t.active)
  const valid = f.name.trim() && !dup && num(f.gt) > 0

  const submit = () => {
    const data = {
      name: f.name.trim(), kind: f.kind, typeName: f.typeName, gt: num(f.gt), nt: num(f.nt), loa: num(f.loa), breadth: num(f.breadth), depth: num(f.depth),
      yearBuilt: num(f.yearBuilt), builder: f.builder.trim(), flag: f.flag.trim(), owner: f.owner.trim(), homePort: f.homePort.trim(), callSign: f.callSign.trim(),
      classSociety: f.classSociety.trim(), isClassRequired: f.isClassRequired, isCoalCarrier: f.kind === 'BG' && f.isCoalCarrier, notes: f.notes.trim(),
      ...(f.kind === 'TB'
        ? { mainEngine: f.mainEngine.trim(), enginePower: num(f.enginePower), bollardPull: num(f.bollardPull) }
        : { capacityFt: num(f.capacityFt), dwt: num(f.dwt) }),
    }
    if (vessel) {
      updateVessel(vessel.id, data)
      toast(`${data.name} saved. The change is in the audit log.`)
      onClose()
    } else {
      const n = s.vessels.filter((v) => v.kind === f.kind).length + 1
      const id = addVessel({ ...data, code: `${f.kind}-${String(n).padStart(3, '0')}`, opStatus: f.opStatus })
      toast(`${data.name} added. It shows as not ready until its required documents are uploaded.`)
      onClose()
      nav(`/vessels/${id}`)
    }
  }

  return (
    <Modal wide open={open} onClose={onClose} title={vessel ? `Edit ${vessel.name}` : 'Add vessel'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!valid} onClick={submit}>{vessel ? 'Save changes' : 'Add vessel'}</Button></>}>
      <div className="space-y-6">
        <fieldset className="grid gap-4 sm:grid-cols-3">
          <legend className="mb-3 text-[17px] font-bold">Identity</legend>
          <Field label="Vessel name" className="sm:col-span-2" hint={dup ? 'A vessel with this name already exists. Names are unique.' : undefined}><Input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="TB Energi …" autoFocus /></Field>
          <Field label="Category">
            <Select value={f.kind} disabled={!!vessel} onChange={(e) => { const k = e.target.value as 'TB' | 'BG'; setF((x) => ({ ...x, kind: k, typeName: s.vesselTypes.find((t) => t.category === k)?.name ?? '' })) }}>
              <option value="TB">Tug boat (TB)</option><option value="BG">Barge (BG)</option>
            </Select>
          </Field>
          <Field label="Vessel type"><Select value={f.typeName} onChange={(e) => set('typeName', e.target.value)}>{types.map((t) => <option key={t.id}>{t.name}</option>)}</Select></Field>
          <Field label="Call sign"><Input value={f.callSign} onChange={(e) => set('callSign', e.target.value)} /></Field>
          <Field label="Home port"><Input value={f.homePort} onChange={(e) => set('homePort', e.target.value)} /></Field>
          {!vessel && <Field label="Starting status"><Select value={f.opStatus} onChange={(e) => set('opStatus', e.target.value as OpStatus)}>{(Object.keys(opStatusLabel) as OpStatus[]).map((k) => <option key={k} value={k}>{opStatusLabel[k]}</option>)}</Select></Field>}
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-3">
          <legend className="mb-3 text-[17px] font-bold">Registration</legend>
          <Field label="Flag"><Input value={f.flag} onChange={(e) => set('flag', e.target.value)} /></Field>
          <Field label="Owner" className="sm:col-span-2"><Input value={f.owner} onChange={(e) => set('owner', e.target.value)} /></Field>
          <Field label="Year built"><Input inputMode="numeric" value={f.yearBuilt} onChange={(e) => set('yearBuilt', e.target.value)} /></Field>
          <Field label="Builder" className="sm:col-span-2"><Input value={f.builder} onChange={(e) => set('builder', e.target.value)} /></Field>
          <Field label="Class society" className="sm:col-span-2"><Input value={f.classSociety} onChange={(e) => set('classSociety', e.target.value)} /></Field>
          <label className="flex items-center gap-2 self-end pb-3 text-[15px]"><input type="checkbox" className="size-4 accent-accent" checked={f.isClassRequired} onChange={(e) => set('isClassRequired', e.target.checked)} />Class required</label>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-3">
          <legend className="mb-3 text-[17px] font-bold">Main particulars</legend>
          <Field label="Gross tonnage (GT)"><Input inputMode="decimal" value={f.gt} onChange={(e) => set('gt', e.target.value)} /></Field>
          <Field label="Net tonnage (NT)"><Input inputMode="decimal" value={f.nt} onChange={(e) => set('nt', e.target.value)} /></Field>
          <Field label="Length overall (m)"><Input inputMode="decimal" value={f.loa} onChange={(e) => set('loa', e.target.value)} /></Field>
          <Field label="Breadth (m)"><Input inputMode="decimal" value={f.breadth} onChange={(e) => set('breadth', e.target.value)} /></Field>
          <Field label="Depth (m)"><Input inputMode="decimal" value={f.depth} onChange={(e) => set('depth', e.target.value)} /></Field>
          {f.kind === 'TB' ? <>
            <Field label="Power (HP)"><Input inputMode="numeric" value={f.enginePower} onChange={(e) => set('enginePower', e.target.value)} /></Field>
            <Field label="Main engines" className="sm:col-span-2"><Input value={f.mainEngine} onChange={(e) => set('mainEngine', e.target.value)} placeholder="2 × Cummins KTA38-M0" /></Field>
            <Field label="Bollard pull (t)"><Input inputMode="decimal" value={f.bollardPull} onChange={(e) => set('bollardPull', e.target.value)} /></Field>
          </> : <>
            <Field label="Size class (ft)"><Input inputMode="numeric" value={f.capacityFt} onChange={(e) => set('capacityFt', e.target.value)} /></Field>
            <Field label="Deadweight (t)"><Input inputMode="numeric" value={f.dwt} onChange={(e) => set('dwt', e.target.value)} /></Field>
            <label className="flex items-center gap-2 self-end pb-3 text-[15px]"><input type="checkbox" className="size-4 accent-accent" checked={f.isCoalCarrier} onChange={(e) => set('isCoalCarrier', e.target.checked)} />Carries coal</label>
          </>}
        </fieldset>

        <Field label="Notes"><Textarea value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
        {!num(f.gt) && <p className="text-sm text-ink-2">Gross tonnage is required.</p>}
      </div>
    </Modal>
  )
}

export function DeleteVessel({ vessel, open, onClose, onDone }: { vessel: Vessel; open: boolean; onClose: () => void; onDone?: () => void }) {
  const { s, deleteVessel } = useStore()
  const toast = useToast()
  const crew = s.assignments.filter((a) => a.vesselId === vessel.id && a.status === 'active').length
  const pair = s.pairs.find((p) => !p.end && (p.tugId === vessel.id || p.bargeId === vessel.id))
  return (
    <ConfirmDelete open={open} onClose={onClose} title={`Delete ${vessel.name}?`} confirmLabel="Delete vessel" onConfirm={(reason) => { deleteVessel(vessel.id, reason); toast(`${vessel.name} removed from the fleet.`); onClose(); onDone?.() }}>
      <p>The vessel leaves every list and readiness count.{pair ? ' Its TB/BG pair ends today.' : ''}{crew ? ` ${crew} crew aboard are signed off today and become standby.` : ''} Its documents stay in the archive.</p>
    </ConfirmDelete>
  )
}

export function AssetForm({ open, onClose, asset, vesselName }: { open: boolean; onClose: () => void; asset: VesselAsset; vesselName: string }) {
  const { updateAsset } = useStore()
  const toast = useToast()
  const [f, setF] = useState(asset)
  useEffect(() => { if (open) setF(asset) }, [open, asset])
  return (
    <Modal open={open} onClose={onClose} title={`Edit asset · ${vesselName}`} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => { updateAsset(asset.vesselId, f); toast('Asset data saved.'); onClose() }}>Save asset</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Acquired on"><Input type="date" value={f.acquisitionDate} onChange={(e) => setF({ ...f, acquisitionDate: e.target.value })} /></Field>
        <Field label="Last overhaul"><Input type="date" value={f.lastOverhaul} onChange={(e) => setF({ ...f, lastOverhaul: e.target.value })} /></Field>
        <Field label="Book value (IDR)"><Input inputMode="numeric" value={String(f.assetValueIdr)} onChange={(e) => setF({ ...f, assetValueIdr: num(e.target.value) })} /></Field>
        <Field label="Insured value (IDR)"><Input inputMode="numeric" value={String(f.insuredValueIdr)} onChange={(e) => setF({ ...f, insuredValueIdr: num(e.target.value) })} /></Field>
        <Field label="Hull material"><Input value={f.hullMaterial} onChange={(e) => setF({ ...f, hullMaterial: e.target.value })} /></Field>
        <Field label="Generator sets"><Input value={f.generatorSets} onChange={(e) => setF({ ...f, generatorSets: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}
