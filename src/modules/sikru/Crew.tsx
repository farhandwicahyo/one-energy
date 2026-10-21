import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Download, Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { ContractForm, CrewForm, DeleteCrew, PrivateForm } from './forms'
import { DaysLeft, RenewModal } from '../../components/domain'
import { Badge, Button, DocBadge, Empty, Field, Input, KV, Locked, Modal, PageHeader, Panel, RowActions, SearchBox, Select, Table, Tabs, Toolbar, useToast, type Col } from '../../components/ui'
import { rankByCode, ranks } from '../../data/master'
import type { Assignment, Crew, CrewStatus, Doc } from '../../data/types'
import { crewStatusLabel, employmentLabel } from '../../i18n/en'
import { fmtDate, TODAY } from '../../lib/dates'
import { docStatus, effectiveComposition } from '../../lib/rules'
import { useStore } from '../../store'

const statusTone = (s: CrewStatus) => (s === 'on_duty' ? 'accent' : s === 'inactive' ? 'neutral' : s === 'leave' ? 'warn' : 'neutral') as 'accent' | 'neutral' | 'warn'
export const CrewStatusBadge = ({ s }: { s: CrewStatus }) => <Badge t={statusTone(s)}>{crewStatusLabel[s]}</Badge>
const rankLabel = (code: string) => rankByCode[code]?.name ?? code

export function CrewList() {
  const { s, currentDocs } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [rank, setRank] = useState('all')
  const [vessel, setVessel] = useState('all')
  const [status, setStatus] = useState('all')
  const [emp, setEmp] = useState('all')
  const [cert, setCert] = useState('all')
  const { can } = useStore()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Crew | null>(null)
  const [removing, setRemoving] = useState<Crew | null>(null)

  const activeBy = useMemo(() => new Map(s.assignments.filter((a) => a.status === 'active').map((a) => [a.crewId, a])), [s.assignments])
  const issuesBy = useMemo(() => {
    const m = new Map<string, { expired: number; soon: number }>()
    for (const d of currentDocs) {
      if (d.ownerKind !== 'crew') continue
      const st = docStatus(d)
      if (st === 'valid' || s.docTypes.find((t) => t.id === d.typeId)?.sensitive) continue
      const x = m.get(d.ownerId) ?? { expired: 0, soon: 0 }
      x[st === 'expired' ? 'expired' : 'soon']++
      m.set(d.ownerId, x)
    }
    return m
  }, [currentDocs, s.docTypes])

  const rows = useMemo(() => s.crew.filter((c) => {
    const a = activeBy.get(c.id)
    const iss = issuesBy.get(c.id)
    return (!q || c.name.toLowerCase().includes(q.toLowerCase()) || c.crewNo.toLowerCase().includes(q.toLowerCase())) &&
      (rank === 'all' || c.rank === rank) && (status === 'all' || c.status === status) && (emp === 'all' || c.employment === emp) &&
      (vessel === 'all' || a?.vesselId === vessel) &&
      (cert === 'all' || (cert === 'expired' ? !!iss?.expired : cert === 'soon' ? !!iss?.soon : !iss))
  }), [s.crew, q, rank, status, emp, vessel, cert, activeBy, issuesBy])

  const cols: Col<Crew>[] = [
    { key: 'no', header: 'Crew no.', mobile: 'hide', cell: (c) => <span className="tnum text-ink-2">{c.crewNo}</span> },
    { key: 'n', header: 'Name', mobile: 'title', cell: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'r', header: 'Rank', cell: (c) => rankLabel(c.rank) },
    { key: 'v', header: 'Vessel', cell: (c) => { const a = activeBy.get(c.id); return a ? s.vessels.find((v) => v.id === a.vesselId)!.name : <span className="text-ink-3">—</span> } },
    { key: 'e', header: 'Employment', mobile: 'hide', cell: (c) => employmentLabel[c.employment] },
    { key: 's', header: 'Status', cell: (c) => <CrewStatusBadge s={c.status} /> },
    { key: 'i', header: 'Certificates', cell: (c) => { const i = issuesBy.get(c.id); return !i ? <Badge t="ok">All valid</Badge> : i.expired ? <Badge t="bad">{i.expired} expired</Badge> : <Badge t="warn">{i.soon} expiring</Badge> } },
    ...(can('crew.write') ? [{ key: 'act', header: 'Actions', mobile: 'hide' as const, className: 'text-right', cell: (c: Crew) => <RowActions label={c.name} onEdit={() => setEditing(c)} onDelete={() => setRemoving(c)} /> }] : []),
  ]

  return (
    <div>
      <PageHeader title="Crew" module="SI-CREW" lead={`${s.crew.length} crew members: ${s.crew.filter((c) => c.employment === 'permanent').length} permanent and ${s.crew.filter((c) => c.employment === 'contract').length} on contract. Personal data is kept on a separate, restricted record.`} actions={can('crew.write') && <Button onClick={() => setAdding(true)}><Plus className="size-4" />Add crew member</Button>} />
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Name or crew number" />
        <Select value={rank} onChange={(e) => setRank(e.target.value)} aria-label="Rank"><option value="all">All ranks</option>{ranks.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}</Select>
        <Select value={vessel} onChange={(e) => setVessel(e.target.value)} aria-label="Vessel"><option value="all">Any vessel</option>{s.vessels.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="all">Any status</option>{Object.entries(crewStatusLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
        <Select value={emp} onChange={(e) => setEmp(e.target.value)} aria-label="Employment"><option value="all">Permanent and contract</option><option value="permanent">Permanent</option><option value="contract">Contract</option></Select>
        <Select value={cert} onChange={(e) => setCert(e.target.value)} aria-label="Certificates"><option value="all">Any certificates</option><option value="expired">Has expired</option><option value="soon">Has expiring</option><option value="ok">All valid</option></Select>
      </Toolbar>
      <Table rows={rows} cols={cols} rowKey={(c) => c.id} onRow={(c) => nav(`/crew/${c.id}`)} limit={50} />
      <CrewForm open={adding} onClose={() => setAdding(false)} />
      {editing && <CrewForm open onClose={() => setEditing(null)} crew={editing} />}
      {removing && <DeleteCrew open crew={removing} onClose={() => setRemoving(null)} />}
    </div>
  )
}

type Tab = 'profile' | 'private' | 'assign' | 'docs' | 'contract'

export function CrewDetail() {
  const { id } = useParams()
  const { s, can, signOff } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('profile')
  const [renew, setRenew] = useState<Doc | null>(null)
  const [off, setOff] = useState<Assignment | null>(null)
  const [form, setForm] = useState<'edit' | 'delete' | 'private' | 'contract' | null>(null)
  const nav = useNavigate()
  const c = s.crew.find((x) => x.id === id)
  if (!c) return <Empty notFound title="Crew member not found" />
  const priv = s.crewPrivate.find((p) => p.crewId === c.id)
  const assigns = s.assignments.filter((a) => a.crewId === c.id).sort((a, b) => (a.signOn < b.signOn ? 1 : -1))
  const active = assigns.find((a) => a.status === 'active')
  const docs = s.docs.filter((d) => d.isCurrent && d.ownerKind === 'crew' && d.ownerId === c.id && !s.docTypes.find((t) => t.id === d.typeId)!.sensitive)
  const contracts = s.contracts.filter((k) => k.crewId === c.id)
  const vname = (id: string) => s.vessels.find((v) => v.id === id)?.name ?? 'Removed vessel'
  const lock = (ok: boolean, label: string) => ok ? label : <span className="inline-flex items-center gap-1">{label}<Lock className="size-3.5" aria-label="restricted" /></span>

  return (
    <div>
      <PageHeader back={{ to: '/crew', label: 'Crew' }} title={c.name} module="SI-CREW" lead={`${c.crewNo} · ${rankLabel(c.rank)} (${rankByCode[c.rank]?.localName}) · ${employmentLabel[c.employment]}`}
        actions={<>
          <span className="self-center"><CrewStatusBadge s={c.status} /></span>
          {can('crew.write') && <Button variant="secondary" onClick={() => setForm('edit')}><Pencil className="size-4" />Edit</Button>}
          {can('crew.write') && <Button variant="secondary" className="!border-bad !text-bad hover:!bg-bad-soft" onClick={() => setForm('delete')}><Trash2 className="size-4" />Delete</Button>}
        </>} />
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'profile', label: 'Profile' },
        { value: 'private', label: lock(can('crew_private.read'), 'Personal') },
        { value: 'assign', label: 'Assignments' },
        { value: 'docs', label: `Certificates ${docs.length}` },
        { value: 'contract', label: lock(can('contract.read'), 'Contract') },
      ]} />

      {tab === 'profile' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Work"><KV items={[['Crew number', c.crewNo], ['Rank', `${rankLabel(c.rank)} (${rankByCode[c.rank]?.localName})`], ['Department', rankByCode[c.rank]?.department], ['Employment', employmentLabel[c.employment]], ['Joined', fmtDate(c.joined)], ['Status', crewStatusLabel[c.status]]]} /></Panel>
          <Panel title="Current assignment">
            {active ? <KV items={[['Vessel', <Link key="v" className="text-accent hover:underline" to={`/vessels/${active.vesselId}`}>{vname(active.vesselId)}</Link>], ['Rank aboard', rankLabel(active.rank)], ['Signed on', fmtDate(active.signOn)], ['Days aboard', String(Math.round((Date.parse(TODAY) - Date.parse(active.signOn)) / 864e5))]]} /> : <p className="text-sm text-ink-2">Not signed on to any vessel.</p>}
          </Panel>
        </div>
      )}

      {tab === 'private' && (can('crew_private.read') && priv ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Personal data" actions={can('crew.write') && <Button size="sm" variant="secondary" onClick={() => setForm('private')}><Pencil className="size-4" />Edit</Button>}><KV items={[['NIK', priv.nik], ['Place and date of birth', `${priv.birthPlace}, ${fmtDate(priv.birthDate)}`], ['Address', priv.address], ['Phone', priv.phone], ['Email', priv.email]]} /></Panel>
          <Panel title="Emergency contact"><KV items={[['Name', priv.emergencyName], ['Relation', priv.emergencyRelation], ['Phone', priv.emergencyPhone]]} /></Panel>
        </div>
      ) : <Locked what="Personal data" />)}

      {tab === 'assign' && (
        <Table rows={assigns} rowKey={(a) => a.id} cols={[
          { key: 'v', header: 'Vessel', mobile: 'title', cell: (a) => <Link to={`/vessels/${a.vesselId}`} className="font-medium hover:text-accent">{vname(a.vesselId)}</Link> },
          { key: 'r', header: 'Rank', cell: (a) => rankLabel(a.rank) },
          { key: 'on', header: 'Sign on', cell: (a) => <span className="tnum">{fmtDate(a.signOn)}</span> },
          { key: 'off', header: 'Sign off', cell: (a) => a.signOff ? <span className="tnum">{fmtDate(a.signOff)}</span> : <Badge t="accent">Aboard</Badge> },
          { key: 'why', header: 'Reason', mobile: 'hide', cell: (a) => a.reason ?? '—' },
          { key: 'x', header: '', className: 'text-right', cell: (a) => a.status === 'active' && can('assignment.write') ? <Button size="sm" variant="secondary" onClick={() => setOff(a)}>Sign off</Button> : null },
        ]} />
      )}

      {tab === 'docs' && (
        <Table rows={docs} rowKey={(d) => d.id} cols={[
          { key: 't', header: 'Certificate', mobile: 'title', cell: (d) => <Link to={`/documents/${d.id}`} className="font-medium hover:text-accent">{s.docTypes.find((t) => t.id === d.typeId)!.name}{d.level && <span className="font-normal text-ink-2"> · {d.level}</span>}</Link> },
          { key: 'n', header: 'Number', cell: (d) => <span className="tnum">{d.number}</span> },
          { key: 'e', header: 'Valid until', cell: (d) => <span className="tnum">{fmtDate(d.expiresAt)}</span> },
          { key: 'l', header: 'Left', cell: (d) => <DaysLeft date={d.expiresAt} /> },
          { key: 's', header: 'Status', cell: (d) => <DocBadge s={docStatus(d)} /> },
          { key: 'a', header: '', className: 'text-right', cell: (d) => can('document_crew.write') && docStatus(d) !== 'valid' ? <Button size="sm" onClick={(e) => { e.stopPropagation(); setRenew(d) }}>Renew</Button> : null },
        ]} />
      )}

      {tab === 'contract' && can('contract.read') && can('crew.write') && (
        <div className="mb-4"><Button onClick={() => setForm('contract')}><Plus className="size-4" />New contract</Button></div>
      )}
      {tab === 'contract' && (can('contract.read') ? (
        contracts.length ? (
          <div className="space-y-4">
            {contracts.map((k) => {
              const d = s.docs.find((x) => x.id === k.documentId)!
              return (
                <Panel key={k.id} title={`Contract ${k.number}`} actions={<DocBadge s={docStatus(d)} />}>
                  <KV cols={3} items={[['Type', 'Fixed-term sea service (PKL)'], ['Start', fmtDate(k.start)], ['End', fmtDate(k.end)], ['Ends in', <DaysLeft key="d" date={k.end} />], ['File', d.files[0]?.name], ['Salary', 'Not stored in Phase 1']]} />
                  <p className="mt-4 text-[13px] text-ink-2">The end date is tracked as a sensitive E-DOC document, so it gets the same reminders without being visible to other roles.</p>
                </Panel>
              )
            })}
          </div>
        ) : <Empty title="No contract on file">{c.employment === 'permanent' ? 'Permanent employees have no fixed-term contract.' : 'Add the contract to start tracking its end date.'}</Empty>
      ) : <Locked what="The contract" />)}

      <RenewModal doc={renew} open={!!renew} onClose={() => setRenew(null)} />
      <CrewForm open={form === 'edit'} onClose={() => setForm(null)} crew={c} />
      <DeleteCrew open={form === 'delete'} crew={c} onClose={() => setForm(null)} onDone={() => nav('/crew')} />
      <PrivateForm open={form === 'private'} onClose={() => setForm(null)} crew={c} />
      <ContractForm open={form === 'contract'} onClose={() => setForm(null)} crew={c} />
      <SignOffModal a={off} onClose={() => setOff(null)} onDone={() => { signOff(off!.id, TODAY, 'End of rotation'); toast(`${c.name} signed off today.`); setOff(null) }} />
    </div>
  )
}

function SignOffModal({ a, onClose, onDone }: { a: Assignment | null; onClose: () => void; onDone: () => void }) {
  const { s } = useStore()
  if (!a) return null
  return (
    <Modal open onClose={onClose} title="Sign off" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={onDone}>Sign off today</Button></>}>
      <p className="text-[15px]">{s.crew.find((c) => c.id === a.crewId)!.name} leaves {s.vessels.find((v) => v.id === a.vesselId)!.name} on {fmtDate(TODAY)}. If this drops the vessel below its minimum crew, it turns red in SIAP straight away.</p>
    </Modal>
  )
}

export function Composition() {
  const { s, can, signOn, signOff, assessments, setComposition } = useStore()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const vesselId = params.get('vessel') ?? s.vessels[0].id
  const v = s.vessels.find((x) => x.id === vesselId) ?? s.vessels[0]
  const [onRank, setOnRank] = useState<string | null>(null)
  const [pickCrew, setPickCrew] = useState('')
  const [onDate, setOnDate] = useState(TODAY)
  const [err, setErr] = useState<string | null>(null)
  const [listDate, setListDate] = useState(TODAY)
  const aboard = s.assignments.filter((a) => a.vesselId === v.id && a.status === 'active')
  const rules = effectiveComposition(v, s.compositionRules)
  const listOnDate = s.assignments.filter((a) => a.vesselId === v.id && a.status !== 'cancelled' && a.signOn <= listDate && (!a.signOff || a.signOff > listDate))
  const candidates = s.crew.filter((c) => onRank && c.rank === onRank && (c.status === 'standby' || c.status === 'leave'))
  const name = (id: string) => s.crew.find((c) => c.id === id)?.name ?? 'Removed crew'

  return (
    <div>
      <PageHeader title="Crew composition" module="SI-CREW" lead="Actual crew aboard against the minimum from the vessel’s safe manning document. A short rank turns the vessel red." />
      <Toolbar>
        <Select value={vesselId} onChange={(e) => setParams({ vessel: e.target.value })} aria-label="Vessel" className="!w-72">
          {s.vessels.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </Select>
        <span className="text-sm text-ink-2">Readiness now: <span className="font-medium text-ink">{assessments.get(v.id)!.status === 'green' ? 'Ready' : assessments.get(v.id)!.status === 'yellow' ? 'Attention' : 'Not ready'}</span></span>
      </Toolbar>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Panel title={`${v.name} · ${aboard.length} aboard`}>
          <ul className="space-y-2">
            {rules.map((r) => {
              const have = aboard.filter((a) => a.rank === r.rank)
              const short = have.length < r.min
              return (
                <li key={r.rank} className={`rounded-md p-4 ${short ? 'bg-bad-soft' : 'bg-surface-2/60'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><span className="font-medium">{rankLabel(r.rank)}</span> <span className="text-sm text-ink-2">({rankByCode[r.rank].localName})</span></div>
                    <div className="flex items-center gap-3">
                      <span className={`tnum text-sm font-medium ${short ? 'text-bad' : 'text-ink'}`}>{have.length} of {r.min} required</span>
                      {can('assignment.write') && <Button size="sm" variant={short ? 'primary' : 'secondary'} onClick={() => { setOnRank(r.rank); setPickCrew(''); setErr(null) }}>Sign on</Button>}
                    </div>
                  </div>
                  {have.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {have.map((a) => (
                        <li key={a.id} className="inline-flex items-center gap-2 rounded bg-surface px-2.5 py-1 text-sm">
                          <Link to={`/crew/${a.crewId}`} className="hover:text-accent">{name(a.crewId)}</Link>
                          <span className="text-xs text-ink-2">since {fmtDate(a.signOn)}</span>
                          {can('assignment.write') && <button className="text-xs font-medium text-accent hover:underline" onClick={() => { signOff(a.id, TODAY, 'End of rotation'); toast(`${name(a.crewId)} signed off.`) }}>Sign off</button>}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
            {aboard.filter((a) => !rules.some((r) => r.rank === a.rank)).map((a) => (
              <li key={a.id} className="rounded bg-surface-2 p-4 text-sm"><span className="font-medium">{rankLabel(a.rank)}</span> (not in the minimum) · {name(a.crewId)}</li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-6">
          <Panel title="Crew list on a date" actions={<span className="text-[13px] text-ink-2">SI-CREW-05</span>}>
            <Field label="Date"><Input type="date" value={listDate} onChange={(e) => setListDate(e.target.value || TODAY)} /></Field>
            <ul className="mt-3 space-y-1.5 text-sm">
              {listOnDate.map((a) => <li key={a.id} className="flex justify-between gap-2"><span className="truncate">{name(a.crewId)}</span><span className="shrink-0 text-ink-2">{rankLabel(a.rank)}</span></li>)}
              {!listOnDate.length && <li className="text-ink-2">Nobody aboard on that date.</li>}
            </ul>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => toast(`crew-list-${v.code}-${listDate}.pdf generated.`)}><Download className="size-4" />PDF</Button>
              <Button size="sm" variant="secondary" onClick={() => toast(`crew-list-${v.code}-${listDate}.xlsx generated.`)}><Download className="size-4" />Excel</Button>
            </div>
          </Panel>
          <Panel title={`Minimum for every ${v.kind === 'TB' ? 'tug boat' : 'barge'}`}>
            <ul className="space-y-2 text-sm">
              {ranks.map((r) => {
                const rule = s.compositionRules.find((c) => !c.vesselId && c.kind === v.kind && c.rank === r.code)
                return (
                  <li key={r.code} className="flex items-center justify-between gap-2">
                    <span>{r.name}</span>
                    {can('composition.manage') ? (
                      <Input type="number" min={0} max={5} value={rule?.min ?? 0} onChange={(e) => setComposition(v.kind, r.code, Math.max(0, Number(e.target.value)))} className="!h-8 !w-16 text-right" aria-label={`Minimum ${r.name}`} />
                    ) : <span className="tnum font-medium">{rule?.min ?? 0}</span>}
                  </li>
                )
              })}
            </ul>
            {!can('composition.manage') && <p className="mt-3 text-[13px] text-ink-2">IT and selected admins edit these rules.</p>}
          </Panel>
        </div>
      </div>

      <Modal open={!!onRank} onClose={() => setOnRank(null)} title={`Sign on a ${onRank ? rankLabel(onRank) : ''}`} footer={<><Button variant="secondary" onClick={() => setOnRank(null)}>Cancel</Button><Button disabled={!pickCrew} onClick={() => { const e = signOn(pickCrew, v.id, onRank!, onDate); setErr(e); if (!e) { toast(`${name(pickCrew)} signed on to ${v.name}.`); setOnRank(null) } }}>Sign on</Button></>}>
        <div className="space-y-4">
          <Field label="Crew member" hint="Standby and on-leave crew of this rank. Crew active on another vessel cannot be chosen.">
            <Select value={pickCrew} onChange={(e) => setPickCrew(e.target.value)}>
              <option value="">Choose crew</option>
              {candidates.map((c) => <option key={c.id} value={c.id}>{c.name} · {crewStatusLabel[c.status]}</option>)}
            </Select>
          </Field>
          <Field label="Sign-on date"><Input type="date" value={onDate} onChange={(e) => setOnDate(e.target.value)} /></Field>
          {err && <p className="rounded-md bg-bad-soft p-3 text-sm text-bad">{err}</p>}
        </div>
      </Modal>
    </div>
  )
}
