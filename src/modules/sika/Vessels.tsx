import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { DaysLeft, RenewModal, StatusModal } from '../../components/domain'
import { Button, DocBadge, Empty, Field, idr, Input, KV, OpBadge, PageHeader, Panel, ReadinessBadge, SearchBox, Select, Table, Tabs, Toolbar, useToast, type Col } from '../../components/ui'
import { rankByCode } from '../../data/master'
import type { Doc, OpStatus, Pair, Vessel } from '../../data/types'
import { opStatusLabel, readinessLabel } from '../../i18n/en'
import { fmtDate, fmtDateTime, TODAY } from '../../lib/dates'
import { docStatus, effectiveComposition } from '../../lib/rules'
import { useStore } from '../../store'
import { AssetForm, DeleteVessel, VesselForm } from './forms'

export function VesselList() {
  const { s, assessments, can } = useStore()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const [op, setOp] = useState('all')
  const [ready, setReady] = useState('all')
  const [adding, setAdding] = useState(false)

  const rows = useMemo(() => s.vessels.filter((v) =>
    (!q || v.name.toLowerCase().includes(q.toLowerCase()) || v.code.toLowerCase().includes(q.toLowerCase())) &&
    (kind === 'all' || v.kind === kind) && (op === 'all' || v.opStatus === op) && (ready === 'all' || assessments.get(v.id)?.status === ready),
  ), [s.vessels, q, kind, op, ready, assessments])

  const pairName = (v: Vessel) => {
    const p = s.pairs.find((x) => !x.end && (x.tugId === v.id || x.bargeId === v.id))
    return p ? s.vessels.find((x) => x.id === (p.tugId === v.id ? p.bargeId : p.tugId))!.name : '—'
  }
  const cols: Col<Vessel>[] = [
    { key: 'code', header: 'Code', mobile: 'hide', cell: (v) => <span className="tnum text-ink-2">{v.code}</span> },
    { key: 'name', header: 'Vessel', mobile: 'title', cell: (v) => <span className="font-medium">{v.name}</span> },
    { key: 'type', header: 'Type', cell: (v) => v.typeName },
    { key: 'gt', header: 'GT', className: 'text-right', cell: (v) => <span className="tnum">{v.gt.toLocaleString('en-US')}</span> },
    { key: 'yr', header: 'Built', className: 'text-right', cell: (v) => <span className="tnum">{v.yearBuilt}</span> },
    { key: 'port', header: 'Home port', mobile: 'hide', cell: (v) => v.homePort },
    { key: 'pair', header: 'Paired with', mobile: 'hide', cell: pairName },
    { key: 'op', header: 'Status', cell: (v) => <OpBadge s={v.opStatus} /> },
    { key: 'r', header: 'Readiness', cell: (v) => <ReadinessBadge s={assessments.get(v.id)!.status} /> },
    { key: 'act', header: 'Actions', className: 'text-right', cell: (v: Vessel) => <Link to={`/vessels/${v.id}`} aria-label={`Details of ${v.name}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border-2 border-accent px-3 text-sm font-bold whitespace-nowrap text-accent transition-colors hover:bg-accent-soft"><Eye className="size-4" aria-hidden />Details</Link> },
  ]

  return (
    <div>
      <PageHeader title="Vessels" module="SISKA" lead={`${s.vessels.filter((v) => v.kind === 'TB').length} tug boats and ${s.vessels.filter((v) => v.kind === 'BG').length} barges, domestic fleet.`} actions={can('vessel.write') && <Button onClick={() => setAdding(true)}><Plus className="size-4" />Add vessel</Button>} />
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Name or code" />
        <Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type"><option value="all">All types</option><option value="TB">Tug boat</option><option value="BG">Barge</option></Select>
        <Select value={op} onChange={(e) => setOp(e.target.value)} aria-label="Status"><option value="all">Any status</option>{Object.entries(opStatusLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
        <Select value={ready} onChange={(e) => setReady(e.target.value)} aria-label="Readiness"><option value="all">Any readiness</option>{Object.entries(readinessLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
      </Toolbar>
      <Table rows={rows} cols={cols} rowKey={(v) => v.id} />
      <VesselForm open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}

type Tab = 'profile' | 'crew' | 'docs' | 'history' | 'pairs' | 'asset'

export function VesselDetail() {
  const { id } = useParams()
  const { s, assessments, can, userName } = useStore()
  const [tab, setTab] = useState<Tab>('profile')
  const [statusOpen, setStatusOpen] = useState(false)
  const [renew, setRenew] = useState<Doc | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [assetOpen, setAssetOpen] = useState(false)
  const nav = useNavigate()
  const v = s.vessels.find((x) => x.id === id)
  if (!v) return <Empty notFound title="Vessel not found" />
  const a = assessments.get(v.id)!
  const aboard = s.assignments.filter((x) => x.vesselId === v.id && x.status === 'active')
  const docs = s.docs.filter((d) => d.isCurrent && d.ownerKind === 'vessel' && d.ownerId === v.id)
  const pairs = s.pairs.filter((p) => p.tugId === v.id || p.bargeId === v.id).sort((x, y) => (x.start < y.start ? 1 : -1))
  const history = s.statusHistory.filter((h) => h.vesselId === v.id).sort((x, y) => (x.at < y.at ? 1 : -1))
  const asset = s.assets.find((x) => x.vesselId === v.id)
  const vname = (id: string) => s.vessels.find((x) => x.id === id)?.name
  const activePair = pairs.find((p) => !p.end)

  const specs: [string, string][] = v.kind === 'TB'
    ? [['Length overall', `${v.loa} m`], ['Breadth', `${v.breadth} m`], ['Depth', `${v.depth} m`], ['Gross / net tonnage', `${v.gt} / ${v.nt}`], ['Main engines', v.mainEngine ?? '—'], ['Power', `${v.enginePower?.toLocaleString('en-US')} HP`], ['Bollard pull', `${v.bollardPull} t`], ['Call sign', v.callSign]]
    : [['Length overall', `${v.loa} m`], ['Breadth', `${v.breadth} m`], ['Depth', `${v.depth} m`], ['Gross / net tonnage', `${v.gt.toLocaleString('en-US')} / ${v.nt}`], ['Size class', `${v.capacityFt} ft`], ['Deadweight', `${v.dwt?.toLocaleString('en-US')} t`], ['Coal carrier', v.isCoalCarrier ? 'Yes' : 'No'], ['Call sign', v.callSign]]

  return (
    <div>
      <PageHeader
        back={{ to: '/vessels', label: 'Vessels' }}
        title={v.name}
        module="SISKA"
        lead={`${v.code} · ${v.typeName} · ${v.homePort}`}
        actions={<>
          <Link to={`/readiness/${v.id}`}><Button variant="secondary">Readiness</Button></Link>
          {can('vessel.write') && <Button variant="secondary" onClick={() => setEditOpen(true)}><Pencil className="size-4" />Edit</Button>}
          {can('vessel.write') && <Button variant="secondary" className="!border-bad !text-bad hover:!bg-bad-soft" onClick={() => setDelOpen(true)}><Trash2 className="size-4" />Delete</Button>}
          {can('vessel.status_change') && <Button onClick={() => setStatusOpen(true)}>Change status</Button>}
        </>}
      />
      <div className="mb-6 grid gap-4 rounded border border-line bg-surface p-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <div><div className="text-[13px] text-ink-2">Status</div><div className="mt-1"><OpBadge s={v.opStatus} /></div><div className="mt-1 text-xs text-ink-2">since {fmtDate(v.statusSince)}</div></div>
          <div><div className="text-[13px] text-ink-2">Readiness</div><div className="mt-1"><ReadinessBadge s={a.status} /></div><div className="mt-1 text-xs text-ink-2">{a.reasons.length} issue{a.reasons.length === 1 ? '' : 's'}</div></div>
          <div><div className="text-[13px] text-ink-2">Paired with</div><div className="mt-1 text-[15px]">{activePair ? <Link className="text-accent hover:underline" to={`/vessels/${activePair.tugId === v.id ? activePair.bargeId : activePair.tugId}`}>{vname(activePair.tugId === v.id ? activePair.bargeId : activePair.tugId)}</Link> : '—'}</div></div>
          <div><div className="text-[13px] text-ink-2">Crew aboard</div><div className="tnum mt-1 text-[15px]">{aboard.length}</div></div>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'profile', label: 'Profile' }, { value: 'crew', label: `Crew ${aboard.length}` }, { value: 'docs', label: `Documents ${docs.length}` },
        { value: 'history', label: 'Status history' }, { value: 'pairs', label: 'Pairing' }, { value: 'asset', label: 'Asset' },
      ]} />

      {tab === 'profile' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Registration"><KV items={[['Flag', v.flag], ['Owner', v.owner], ['Year built', String(v.yearBuilt)], ['Builder', v.builder], ['Class society', v.classSociety], ['Class required', v.isClassRequired ? 'Yes' : 'No']]} /></Panel>
          <Panel title="Main particulars"><KV items={specs} /></Panel>
          <Panel title="Notes" className="lg:col-span-2"><p className="text-[15px] text-ink">{v.notes || 'No notes yet.'}</p></Panel>
        </div>
      )}

      {tab === 'crew' && (
        <Panel title="Crew aboard and minimum composition" actions={<Link to={`/crew/composition?vessel=${v.id}`} className="text-sm font-medium text-accent hover:underline">Manage crew</Link>}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {effectiveComposition(v, s.compositionRules).map((rule) => {
              const have = aboard.filter((x) => x.rank === rule.rank)
              return (
                <li key={rule.rank} className={`rounded-md p-3 ${have.length < rule.min ? 'bg-bad-soft' : 'bg-surface-2/60'}`}>
                  <div className="flex justify-between text-sm"><span className="font-medium">{rankByCode[rule.rank].name} <span className="font-normal text-ink-2">({rankByCode[rule.rank].localName})</span></span><span className="tnum">{have.length} / {rule.min}</span></div>
                  <div className="mt-1 text-[13px] text-ink-2">{have.length ? have.map((h) => <Link key={h.id} to={`/crew/${h.crewId}`} className="mr-2 text-accent hover:underline">{s.crew.find((c) => c.id === h.crewId)!.name}</Link>) : 'Nobody signed on'}</div>
                </li>
              )
            })}
            {aboard.filter((x) => !effectiveComposition(v, s.compositionRules).some((r) => r.rank === x.rank)).map((x) => (
              <li key={x.id} className="rounded bg-surface-2 p-3 text-sm"><span className="font-medium">{rankByCode[x.rank].name}</span> · <Link to={`/crew/${x.crewId}`} className="text-accent hover:underline">{s.crew.find((c) => c.id === x.crewId)!.name}</Link></li>
            ))}
          </ul>
        </Panel>
      )}

      {tab === 'docs' && (
        <Table rows={docs} rowKey={(d) => d.id} cols={[
          { key: 't', header: 'Document', mobile: 'title', cell: (d) => <Link to={`/documents/${d.id}`} className="font-medium hover:text-accent">{s.docTypes.find((t) => t.id === d.typeId)!.name}</Link> },
          { key: 'n', header: 'Number', cell: (d) => <span className="tnum">{d.number}</span> },
          { key: 'e', header: 'Valid until', cell: (d) => <span className="tnum">{fmtDate(d.expiresAt)}</span> },
          { key: 'l', header: 'Left', cell: (d) => <DaysLeft date={d.expiresAt} /> },
          { key: 's', header: 'Status', cell: (d) => <DocBadge s={docStatus(d)} /> },
          { key: 'v', header: 'Version', className: 'text-right', cell: (d) => <span className="tnum">v{d.version}</span> },
          { key: 'a', header: '', className: 'text-right', cell: (d) => can('document_vessel.write') && docStatus(d) !== 'valid' ? <Button size="sm" onClick={(e) => { e.stopPropagation(); setRenew(d) }}>Renew</Button> : null },
        ]} />
      )}

      {tab === 'history' && (
        <Panel>
          <ol className="space-y-4">
            {history.map((h) => (
              <li key={h.id} className="grid gap-1 sm:grid-cols-[11rem_1fr]">
                <span className="tnum text-sm text-ink-2">{fmtDateTime(h.at)}</span>
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">{h.from && <><OpBadge s={h.from} /><span className="text-ink-2">to</span></>}<OpBadge s={h.to} /></div>
                  <div className="mt-1 text-sm">{h.reason} <span className="text-ink-2">· {userName(h.userId)}</span></div>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      {tab === 'pairs' && (
        <Table rows={pairs} rowKey={(p) => p.id} empty="Never paired." cols={[
          { key: 'w', header: v.kind === 'TB' ? 'Barge' : 'Tug', mobile: 'title', cell: (p: Pair) => <span className="font-medium">{vname(v.kind === 'TB' ? p.bargeId : p.tugId)}</span> },
          { key: 's', header: 'From', cell: (p: Pair) => <span className="tnum">{fmtDate(p.start)}</span> },
          { key: 'e', header: 'Until', cell: (p: Pair) => p.end ? <span className="tnum">{fmtDate(p.end)}</span> : <span className="font-medium text-ok">Active</span> },
        ]} />
      )}

      {tab === 'asset' && (can('asset.read') && asset ? (
        <Panel title="Asset data" actions={can('asset.write') ? <Button size="sm" variant="secondary" onClick={() => setAssetOpen(true)}><Pencil className="size-4" />Edit asset</Button> : undefined}>
          <KV cols={3} items={[['Acquired', fmtDate(asset.acquisitionDate)], ['Book value', idr(asset.assetValueIdr)], ['Insured value', idr(asset.insuredValueIdr)], ['Hull', asset.hullMaterial], ['Generator sets', asset.generatorSets], ['Last overhaul', fmtDate(asset.lastOverhaul)]]} />
          <p className="mt-4 text-[13px] text-ink-2">Sample columns only. The final asset fields wait for the Asset role decision in the PRD.</p>
        </Panel>
      ) : <Empty title="Asset data is visible to the Asset role">Switch the demo user to Maya Kusuma (Asset) from the account menu to see and edit it.</Empty>)}

      <StatusModal vessel={v} open={statusOpen} onClose={() => setStatusOpen(false)} />
      <VesselForm open={editOpen} onClose={() => setEditOpen(false)} vessel={v} />
      <DeleteVessel open={delOpen} vessel={v} onClose={() => setDelOpen(false)} onDone={() => nav('/vessels')} />
      {asset && <AssetForm open={assetOpen} onClose={() => setAssetOpen(false)} asset={asset} vesselName={v.name} />}
      <RenewModal doc={renew} open={!!renew} onClose={() => setRenew(null)} />
    </div>
  )
}

export function PairManager() {
  const { s, can, createPair, endPair, pairStatus } = useStore()
  const toast = useToast()
  const [tug, setTug] = useState('')
  const [barge, setBarge] = useState('')
  const [start, setStart] = useState(TODAY)
  const [err, setErr] = useState<string | null>(null)
  const name = (id: string) => s.vessels.find((v) => v.id === id)?.name ?? 'Removed vessel'
  const active = s.pairs.filter((p) => !p.end)
  const ended = s.pairs.filter((p) => p.end).sort((a, b) => (a.end! < b.end! ? 1 : -1))
  const manage = can('vessel.pair_manage')
  const submit = () => {
    const e = createPair(tug, barge, start)
    setErr(e)
    if (!e) { toast(`${name(tug)} now tows ${name(barge)}.`); setTug(''); setBarge('') }
  }
  return (
    <div>
      <PageHeader title="TB/BG pairs" module="SISKA" lead="Which tug tows which barge, and since when. A barge belongs to one tug at a time (SISKA-02)." />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Panel title={`Active pairs · ${active.length}`} pad={false}>
            <div className="p-5 pt-3">
              <Table rows={active} rowKey={(p) => p.id} limit={40} cols={[
                { key: 't', header: 'Tug', mobile: 'title', cell: (p) => <Link to={`/vessels/${p.tugId}`} className="font-medium hover:text-accent">{name(p.tugId)}</Link> },
                { key: 'b', header: 'Barge', cell: (p) => <Link to={`/vessels/${p.bargeId}`} className="hover:text-accent">{name(p.bargeId)}</Link> },
                { key: 's', header: 'Since', cell: (p) => <span className="tnum">{fmtDate(p.start)}</span> },
                { key: 'r', header: 'Pair readiness', cell: (p) => <ReadinessBadge s={pairStatus(p.id)} /> },
                { key: 'a', header: '', className: 'text-right', cell: (p) => manage ? <Button size="sm" variant="secondary" onClick={() => { endPair(p.id, TODAY); toast('Pair ended today. It moves to the history.') }}>End pair</Button> : null },
              ]} />
            </div>
          </Panel>
          <Panel title="History" pad={false}>
            <div className="p-5 pt-3">
              <Table rows={ended} rowKey={(p) => p.id} cols={[
                { key: 't', header: 'Tug', mobile: 'title', cell: (p) => name(p.tugId) },
                { key: 'b', header: 'Barge', cell: (p) => name(p.bargeId) },
                { key: 'p', header: 'Period', cell: (p) => <span className="tnum">{fmtDate(p.start)} – {fmtDate(p.end)}</span> },
              ]} />
            </div>
          </Panel>
        </div>
        {manage ? (
          <Panel title="Pair a tug and a barge">
            <div className="space-y-4">
              <Field label="Tug"><Select value={tug} onChange={(e) => setTug(e.target.value)}><option value="">Choose a tug</option>{s.vessels.filter((v) => v.kind === 'TB').map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select></Field>
              <Field label="Barge"><Select value={barge} onChange={(e) => { setBarge(e.target.value); setErr(null) }}><option value="">Choose a barge</option>{s.vessels.filter((v) => v.kind === 'BG').map((v) => <option key={v.id} value={v.id}>{v.name}{active.some((p) => p.bargeId === v.id) ? ' (paired)' : ''}</option>)}</Select></Field>
              <Field label="From"><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
              {err && <p className="rounded-md bg-bad-soft p-3 text-sm text-bad">{err}</p>}
              <Button className="w-full" disabled={!tug || !barge} onClick={submit}>Create pair</Button>
            </div>
          </Panel>
        ) : <Empty title="Read only">Operation manages pairs.</Empty>}
      </div>
    </div>
  )
}

export const opStatuses = Object.keys(opStatusLabel) as OpStatus[]
