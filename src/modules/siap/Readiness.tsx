import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CalendarCheck, Download } from 'lucide-react'
import { FleetGrid } from '../../components/domain'
import { Badge, Button, Empty, Field, Input, OpBadge, PageHeader, Panel, ReadinessBadge, SearchBox, Segmented, Select, Table, Toolbar, useToast, type Col } from '../../components/ui'
import type { Readiness, Vessel } from '../../data/types'
import { opStatusLabel, readinessLabel } from '../../i18n/en'
import { fmtDate, TODAY } from '../../lib/dates'
import type { Reason } from '../../lib/rules'
import { useStore } from '../../store'

export function FleetReadiness() {
  const { s, assessments } = useStore()
  const nav = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | Readiness>((params.get('status') as Readiness) ?? 'all')
  const [kind, setKind] = useState('all')
  const [op, setOp] = useState('all')
  const [view, setView] = useState<'table' | 'grid'>('table')

  const rows = useMemo(() => s.vessels
    .filter((v) => (status === 'all' || assessments.get(v.id)?.status === status) && (kind === 'all' || v.kind === kind) && (op === 'all' || v.opStatus === op))
    .filter((v) => !q || v.name.toLowerCase().includes(q.toLowerCase()) || v.code.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      const o = { red: 0, yellow: 1, green: 2 }
      return o[assessments.get(a.id)!.status] - o[assessments.get(b.id)!.status] || a.code.localeCompare(b.code)
    }), [s.vessels, assessments, status, kind, op, q])

  const count = (r: Readiness) => [...assessments.values()].filter((a) => a.status === r).length
  const cols: Col<Vessel>[] = [
    { key: 'name', header: 'Vessel', mobile: 'title', cell: (v) => <div><div className="font-medium">{v.name}</div><div className="tnum text-[13px] text-ink-2">{v.code} · {v.typeName}</div></div> },
    { key: 'r', header: 'Readiness', cell: (v) => <ReadinessBadge s={assessments.get(v.id)!.status} /> },
    { key: 'op', header: 'Status', cell: (v) => <OpBadge s={v.opStatus} /> },
    { key: 'why', header: 'Main cause', mobile: 'hide', className: 'max-w-md', cell: (v) => { const a = assessments.get(v.id)!; return a.reasons[0] ? <span className="line-clamp-1">{a.reasons[0].message}</span> : <span className="text-ink-3">All documents valid, crew complete</span> } },
    { key: 'n', header: 'Issues', className: 'text-right', cell: (v) => <span className="tnum">{assessments.get(v.id)!.reasons.length || '—'}</span> },
  ]

  return (
    <div>
      <PageHeader
        title="Fleet readiness"
        module="SIAP"
        lead="Red when a required vessel or crew document has expired or is missing, or crew is below the minimum. Yellow when something expires soon."
        actions={<Button variant="secondary" onClick={() => toast('readiness-2026-10-21.pdf generated with the current filters.')}><Download className="size-4" />Export</Button>}
      />
      <Toolbar>
        <Segmented value={status} onChange={setStatus} options={[
          { value: 'all', label: `All ${s.vessels.length}` },
          { value: 'red', label: `${readinessLabel.red} ${count('red')}` },
          { value: 'yellow', label: `${readinessLabel.yellow} ${count('yellow')}` },
          { value: 'green', label: `${readinessLabel.green} ${count('green')}` },
        ]} />
        <SearchBox value={q} onChange={setQ} placeholder="Vessel name or code" />
        <Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type"><option value="all">TB and BG</option><option value="TB">Tug boats</option><option value="BG">Barges</option></Select>
        <Select value={op} onChange={(e) => setOp(e.target.value)} aria-label="Operating status"><option value="all">Any status</option>{Object.entries(opStatusLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
        <div className="ml-auto"><Segmented value={view} onChange={setView} options={[{ value: 'table', label: 'List' }, { value: 'grid', label: 'Grid' }]} /></div>
      </Toolbar>
      {view === 'table' ? <Table rows={rows} cols={cols} rowKey={(v) => v.id} onRow={(v) => nav(`/readiness/${v.id}`)} limit={70} /> : <Panel><FleetGrid vessels={rows} /></Panel>}
    </div>
  )
}

const reasonGroup = (r: Reason) => (r.code.startsWith('DOK_KAPAL') ? 'Vessel documents' : r.code.startsWith('DOK_KRU') ? 'Crew certificates' : 'Crew composition')

export function VesselReadiness() {
  const { id } = useParams()
  const { s, assessAt, userName, pairStatus, assessments } = useStore()
  const toast = useToast()
  const v = s.vessels.find((x) => x.id === id)
  const [date, setDate] = useState(TODAY)
  const a = useMemo(() => (v ? assessAt(v.id, date) : null), [v, date, assessAt])
  const today = useMemo(() => (v ? assessAt(v.id, TODAY) : null), [v, assessAt])
  if (!v || !a || !today) return <Empty notFound title="Vessel not found" />

  const pair = s.pairs.find((p) => !p.end && (p.tugId === v.id || p.bargeId === v.id))
  const partner = pair ? s.vessels.find((x) => x.id === (pair.tugId === v.id ? pair.bargeId : pair.tugId)) : null
  const key = (r: Reason) => [r.code, r.docId, r.typeId, r.crewId, r.rank].join('|')
  const todayKeys = new Set(today.reasons.map(key))
  const newOnDate = date !== TODAY ? a.reasons.filter((r) => !todayKeys.has(key(r))) : []
  const groups = ['Vessel documents', 'Crew certificates', 'Crew composition'].map((g) => [g, a.reasons.filter((r) => reasonGroup(r) === g)] as const)

  return (
    <div>
      <PageHeader back={{ to: '/readiness', label: 'Fleet readiness' }} title={v.name} module="SIAP" lead={`${v.code} · ${v.typeName} · ${v.homePort}`} actions={<Link to={`/vessels/${v.id}`}><Button variant="secondary">Vessel profile</Button></Link>} />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className={`rounded-lg p-6 ${a.status === 'green' ? 'bg-ok-soft' : a.status === 'yellow' ? 'bg-warn-soft' : 'bg-bad-soft'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm text-ink-2">{date === TODAY ? 'Today' : `For departure on ${fmtDate(date)}`}</div>
                <div className={`mt-1 text-[34px] font-semibold leading-none tracking-[-0.03em] ${a.status === 'green' ? 'text-ok' : a.status === 'yellow' ? 'text-warn' : 'text-bad'}`}>{readinessLabel[a.status]}</div>
                <p className="mt-2 text-[15px] text-ink">
                  {a.status === 'green' ? 'Every required document is valid and the crew meets the minimum composition.' : `${a.reasons.filter((r) => r.severity === 'red').length} blocking, ${a.reasons.filter((r) => r.severity === 'yellow').length} expiring soon.`}
                </p>
              </div>
            </div>
          </section>

          {groups.map(([g, list]) => (
            <Panel key={g} title={`${g} · ${list.length ? `${list.length} issue${list.length > 1 ? 's' : ''}` : 'no issues'}`}>
              {list.length === 0 ? <p className="text-sm text-ink-2">Nothing to fix here.</p> : (
                <ul className="space-y-2">
                  {list.map((r, i) => (
                    <li key={i} className="flex flex-col gap-2 rounded bg-surface-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`size-2 shrink-0 rounded-full ${r.severity === 'red' ? 'bg-bad' : 'bg-warn'}`} />
                          <span className="font-medium">{r.message}</span>
                          {newOnDate.includes(r) && <Badge t="bad">By departure</Badge>}
                        </div>
                        <div className="mt-0.5 pl-4 text-[13px] text-ink-2">
                          {r.ownerUserId ? `Responsible: ${userName(r.ownerUserId)}` : r.code === 'KOMPOSISI_KURANG' ? 'Responsible: Crewing / HR' : 'Responsible: Document Admin'}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2 pl-4 sm:pl-0">
                        {r.docId && <Link to={`/documents/${r.docId}`}><Button size="sm" variant="secondary">Open document</Button></Link>}
                        {!r.docId && r.code !== 'KOMPOSISI_KURANG' && <Link to={`/documents?owner=${r.crewId ?? r.vesselId}`}><Button size="sm" variant="secondary">Add document</Button></Link>}
                        {r.code === 'KOMPOSISI_KURANG' && <Link to={`/crew/composition?vessel=${v.id}`}><Button size="sm" variant="secondary">Sign on crew</Button></Link>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          ))}
        </div>

        <aside className="space-y-6">
          <Panel title="Check a departure date">
            <Field label="Planned departure" hint="Documents that expire before this date are marked red, even if they are valid today (SIAP-06).">
              <Input type="date" value={date} min={TODAY} onChange={(e) => setDate(e.target.value || TODAY)} />
            </Field>
            <div className="mt-3 flex flex-wrap gap-2">
              {[7, 14, 30, 60].map((n) => {
                const d = new Date(Date.UTC(2026, 9, 21 + n)).toISOString().slice(0, 10)
                return <Button key={n} size="sm" variant={date === d ? 'primary' : 'secondary'} onClick={() => setDate(d)}>+{n} days</Button>
              })}
            </div>
            {date !== TODAY && (
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-sm">{newOnDate.length ? `${newOnDate.length} more issue${newOnDate.length > 1 ? 's' : ''} by ${fmtDate(date)}.` : `Nothing new by ${fmtDate(date)}.`}</p>
                <Button variant="secondary" onClick={() => toast(`Readiness check for ${fmtDate(date)} saved as a snapshot.`)}><CalendarCheck className="size-4" />Save this check</Button>
              </div>
            )}
          </Panel>
          {pair && partner && (
            <Panel title="TB/BG pair">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-2"><Link to={`/readiness/${partner.id}`} className="font-medium text-accent hover:underline">{partner.name}</Link><ReadinessBadge s={assessments.get(partner.id)!.status} /></div>
                <div className="flex items-center justify-between"><span className="text-ink-2">Pair status (worst of both)</span><ReadinessBadge s={pairStatus(pair.id)} /></div>
                <div className="text-ink-2">Paired since {fmtDate(pair.start)}</div>
              </div>
            </Panel>
          )}
          <Panel title="Vessel">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-2">Status</dt><dd><OpBadge s={v.opStatus} /></dd></div>
              <div className="flex justify-between"><dt className="text-ink-2">Crew aboard</dt><dd className="tnum">{s.assignments.filter((x) => x.vesselId === v.id && x.status === 'active').length}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-2">Coal carrier</dt><dd>{v.isCoalCarrier ? 'Yes' : 'No'}</dd></div>
            </dl>
          </Panel>
        </aside>
      </div>
    </div>
  )
}

export function PairReadiness() {
  const { s, assessments, pairStatus } = useStore()
  const nav = useNavigate()
  const [f, setF] = useState<'all' | Readiness>('all')
  const name = (id: string) => s.vessels.find((v) => v.id === id)?.name ?? 'Removed vessel'
  const rows = s.pairs.filter((p) => !p.end).filter((p) => f === 'all' || pairStatus(p.id) === f)
  const cols: Col<(typeof rows)[number]>[] = [
    { key: 'pair', header: 'Pair', mobile: 'title', cell: (p) => <span className="font-medium">{name(p.tugId)} + {name(p.bargeId)}</span> },
    { key: 'tug', header: 'Tug', cell: (p) => <ReadinessBadge s={assessments.get(p.tugId)!.status} /> },
    { key: 'barge', header: 'Barge', cell: (p) => <ReadinessBadge s={assessments.get(p.bargeId)!.status} /> },
    { key: 'combined', header: 'Pair', cell: (p) => <ReadinessBadge s={pairStatus(p.id)} /> },
    { key: 'since', header: 'Since', cell: (p) => <span className="tnum">{fmtDate(p.start)}</span> },
  ]
  return (
    <div>
      <PageHeader title="TB/BG pair readiness" module="SIAP" lead="A pair can only sail as well as its weaker half, so its status is the worse of the tug and the barge (SIAP-05)." />
      <Toolbar>
        <Segmented value={f} onChange={setF} options={[{ value: 'all', label: 'All pairs' }, { value: 'red', label: readinessLabel.red }, { value: 'yellow', label: readinessLabel.yellow }, { value: 'green', label: readinessLabel.green }]} />
      </Toolbar>
      <Table rows={rows} cols={cols} rowKey={(p) => p.id} onRow={(p) => nav(`/readiness/${assessments.get(p.tugId)!.status !== 'green' ? p.tugId : p.bargeId}`)} limit={40} />
    </div>
  )
}
