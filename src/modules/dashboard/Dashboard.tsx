import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import { DaysLeft, FleetGrid, RenewModal } from '../../components/domain'
import { Badge, Button, DocBadge, Meter, OpBadge, PageHeader, Pager, Panel, ReadinessBadge, Segmented, Select, Stat, Table, usePaged, useToast, type Col } from '../../components/ui'
import type { Doc, FollowUp, Readiness } from '../../data/types'
import { followUpLabel, readinessLabel, roleLabel } from '../../i18n/en'
import { daysLeft, fmtDate, fmtDateTime } from '../../lib/dates'
import { docKey } from '../../lib/rules'
import { useDocRows, useExpiryBuckets, useStore } from '../../store'

type View = 'management' | 'tasks' | 'operations' | 'system'

export default function Dashboard() {
  const { me, can } = useStore()
  const views = useMemo(() => {
    const v: { value: View; label: string }[] = []
    if (can('dashboard.management')) v.push({ value: 'management', label: 'Fleet overview' })
    if (can('dashboard.tasks')) v.push({ value: 'tasks', label: 'My tasks' })
    if (can('dashboard.operations')) v.push({ value: 'operations', label: 'Operations' })
    if (can('user.manage')) v.push({ value: 'system', label: 'System' })
    return v
  }, [can])
  const [view, setView] = useState<View | null>(null)
  const active = view && views.some((v) => v.value === view) ? view : views[0]?.value

  const first = me.name.split(' ')[0]
  return (
    <div>
      <PageHeader
        title={`Good morning, ${first}`}
        module="Dashboard"
        lead={`Dashboard for ${me.roles.map((r) => roleLabel[r]).join(' and ')}. Figures read the same views as SIAP and E-DOC, so they always match.`}
        actions={views.length > 1 ? <Segmented value={active!} onChange={setView} options={views} /> : undefined}
      />
      {active === 'management' && <ManagementView />}
      {active === 'tasks' && <TasksView />}
      {active === 'operations' && <OperationsView />}
      {active === 'system' && <SystemView />}
    </div>
  )
}

function useReadinessCounts() {
  const { assessments } = useStore()
  return useMemo(() => {
    const c: Record<Readiness, number> = { green: 0, yellow: 0, red: 0 }
    for (const a of assessments.values()) c[a.status]++
    return c
  }, [assessments])
}

function ManagementView() {
  const { s, assessments, currentDocs } = useStore()
  const toast = useToast()
  const counts = useReadinessCounts()
  const buckets = useExpiryBuckets()
  const rows = useDocRows()
  const total = assessments.size

  const completeness = useMemo(() => {
    const idx = new Set(currentDocs.map((d) => docKey(d.ownerKind, d.ownerId, d.typeId)))
    const incomplete = s.vessels.filter((v) => s.requiredDocRules.some((r) => r.scope === 'vessel' && r.target === v.kind && (!r.coalOnly || v.isCoalCarrier) && !idx.has(docKey('vessel', v.id, r.typeId))))
    return { complete: s.vessels.length - incomplete.length, incomplete }
  }, [s.vessels, s.requiredDocRules, currentDocs])

  const causes = useMemo(() => {
    const m = new Map<string, number>()
    const label: Record<string, string> = {
      DOK_KAPAL_EXPIRED: 'Vessel document expired', DOK_KAPAL_TIDAK_ADA: 'Vessel document missing', DOK_KAPAL_SEGERA: 'Vessel document expiring',
      DOK_KRU_EXPIRED: 'Crew certificate expired', DOK_KRU_TIDAK_ADA: 'Crew certificate missing', DOK_KRU_SEGERA: 'Crew certificate expiring', KOMPOSISI_KURANG: 'Crew below minimum',
    }
    for (const a of assessments.values()) for (const r of a.reasons) m.set(label[r.code], (m.get(label[r.code]) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [assessments])

  const upcoming = rows.filter((r) => r.status !== 'valid').sort((a, b) => (a.doc.expiresAt! < b.doc.expiresAt! ? -1 : 1)).slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Ready to sail" value={counts.green} t="ok" sub={`of ${total} vessels`} to="/readiness?status=green" />
        <Stat label="Need attention" value={counts.yellow} t="warn" sub="A document expires soon" to="/readiness?status=yellow" />
        <Stat label="Not ready" value={counts.red} t="bad" sub="Expired, missing or short of crew" to="/readiness?status=red" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="The whole fleet" actions={<Link to="/readiness" className="text-sm font-medium text-accent hover:underline">Open readiness</Link>}>
          <FleetGrid vessels={s.vessels} />
        </Panel>
        <Panel title="Documents by expiry">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {[
              ['Already expired', buckets.expired, 'bad'],
              ['Within 30 days', buckets.d30, 'warn'],
              ['Within 60 days', buckets.d60, undefined],
              ['Within 90 days', buckets.d90, undefined],
            ].map(([l, v, t]) => (
              <Link key={l as string} to={`/documents?window=${l === 'Already expired' ? 'expired' : String(l).match(/\d+/)![0]}`} className="group">
                <div className="text-sm text-ink-2 group-hover:text-accent">{l}</div>
                <div className={`tnum mt-1 text-[30px] font-semibold leading-none tracking-[-0.03em] ${t === 'bad' ? 'text-bad' : t === 'warn' ? 'text-warn' : ''}`}>{v as number}</div>
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">Required vessel documents uploaded</span>
              <span className="tnum text-ink-2">{completeness.complete} of {s.vessels.length} vessels</span>
            </div>
            <div className="mt-2"><Meter value={completeness.complete} max={s.vessels.length} t="ok" /></div>
            <p className="mt-2 text-[13px] text-ink-2">Gate 1 needs all {s.vessels.length} vessels complete before Phase 2 starts.{completeness.incomplete.length > 0 && <> Missing: {completeness.incomplete.map((v, i) => <span key={v.id}>{i > 0 && ', '}<Link className="text-accent hover:underline" to={`/vessels/${v.id}`}>{v.name}</Link></span>)}.</>}</p>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="Why vessels are not green">
          <ul className="space-y-3">
            {causes.map(([label, n]) => (
              <li key={label}>
                <div className="flex justify-between text-sm"><span>{label}</span><span className="tnum font-medium">{n}</span></div>
                <div className="mt-1.5"><Meter value={n} max={causes[0][1]} t={label.includes('expiring') ? 'warn' : 'bad'} /></div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Nearest expiries" actions={<Button size="sm" variant="secondary" onClick={() => toast('expiring-documents-2026-10-21.xlsx generated with the same filters as this list.')}><Download className="size-4" />Export</Button>} pad={false}>
          <ul className="px-5 pb-3">
            {upcoming.map((r) => (
              <li key={r.doc.id} className="border-t border-surface-2 first:border-0">
                <Link to={`/documents/${r.doc.id}`} className="flex items-center justify-between gap-4 py-3 hover:text-accent">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{r.type.name}</div>
                    <div className="truncate text-[13px] text-ink-2">{r.owner} · {fmtDate(r.doc.expiresAt)}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3"><DaysLeft date={r.doc.expiresAt} /><DocBadge s={r.status} /></div>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}

interface TaskRow { doc: Doc; typeName: string; owner: string; status: 'soon' | 'expired'; recipient: string; vesselHint?: string }

function TasksView() {
  const { me, s, setFollowUp, can, hasRole } = useStore()
  const rows = useDocRows()
  const toast = useToast()
  const nav = useNavigate()
  const [scope, setScope] = useState<'mine' | 'all'>('mine')
  const [renew, setRenew] = useState<Doc | null>(null)
  const crewing = hasRole('ops_crewing') && !hasRole('ops_asset')

  // SIMON-02: everything that needs action, nearest expiry first. Renewed items leave the list.
  const tasks: TaskRow[] = useMemo(() => rows
    .filter((r) => r.status !== 'valid' && (!r.type.sensitive || can('contract.read')))
    .filter((r) => (crewing ? r.doc.ownerKind === 'crew' : true))
    .filter((r) => scope === 'all' || r.doc.recipientId === me.id)
    .map((r) => ({ doc: r.doc, typeName: r.type.name, owner: r.owner, status: r.status as 'soon' | 'expired', recipient: r.recipient }))
    .sort((a, b) => (a.doc.expiresAt! < b.doc.expiresAt! ? -1 : 1)), [rows, scope, me.id, can, crewing])

  const mine = rows.filter((r) => r.status !== 'valid' && r.doc.recipientId === me.id)
  const n = {
    expired: mine.filter((r) => r.status === 'expired').length,
    week: mine.filter((r) => r.status === 'soon' && daysLeft(r.doc.expiresAt!) <= 7).length,
    month: mine.filter((r) => r.status === 'soon' && daysLeft(r.doc.expiresAt!) <= 30).length,
    progress: mine.filter((r) => r.doc.followUp === 'in_progress').length,
  }
  const writable = (d: Doc) => can(d.ownerKind === 'vessel' ? 'document_vessel.write' : 'document_crew.write')

  const cols: Col<TaskRow>[] = [
    { key: 'doc', header: 'Document', mobile: 'title', cell: (r) => <div><div className="font-medium">{r.typeName}</div><div className="text-[13px] text-ink-2">{r.owner}</div></div> },
    { key: 'exp', header: 'Expires', cell: (r) => <div><div className="tnum">{fmtDate(r.doc.expiresAt)}</div><div className="text-[13px]"><DaysLeft date={r.doc.expiresAt} /></div></div> },
    { key: 'st', header: 'Status', cell: (r) => <DocBadge s={r.status} /> },
    { key: 'fu', header: 'Follow-up', cell: (r) => (
      <Select value={r.doc.followUp ?? 'pending'} onClick={(e) => e.stopPropagation()} onChange={(e) => { setFollowUp(r.doc.id, e.target.value as FollowUp); toast(`Follow-up set to “${followUpLabel[e.target.value as FollowUp]}”.`) }} className="h-8 w-36 text-[13px]" aria-label="Follow-up status">
        <option value="pending">{followUpLabel.pending}</option><option value="in_progress">{followUpLabel.in_progress}</option>
      </Select>
    ) },
    ...(scope === 'all' ? [{ key: 'rc', header: 'Recipient', cell: (r: TaskRow) => r.recipient }] : []),
    { key: 'act', header: '', className: 'text-right', cell: (r) => writable(r.doc) ? <Button size="sm" onClick={(e) => { e.stopPropagation(); setRenew(r.doc) }}>Renew</Button> : null },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Expired, yours" value={n.expired} t={n.expired ? 'bad' : undefined} sub="Blocks sailing today" />
        <Stat label="Due within 7 days" value={n.week} t={n.week ? 'warn' : undefined} />
        <Stat label="Due within 30 days" value={n.month} />
        <Stat label="Renewal in progress" value={n.progress} sub={`${s.docs.filter((d) => d.archivedAt?.startsWith('2026-10')).length} renewed this month`} />
      </div>
      <Panel
        title={crewing ? 'Crew documents to handle' : 'Documents to handle'}
        actions={<Segmented value={scope} onChange={setScope} options={[{ value: 'mine', label: 'Sent to me' }, { value: 'all', label: 'Everyone' }]} />}
      >
        <Table rows={tasks} cols={cols} rowKey={(r) => r.doc.id} onRow={(r) => nav(`/documents/${r.doc.id}`)} limit={25} empty="Nothing to renew. Every document you recorded is valid." />
      </Panel>
      <RenewModal doc={renew} open={!!renew} onClose={() => setRenew(null)} />
    </div>
  )
}

function OperationsView() {
  const { s, assessments, pairStatus } = useStore()
  const counts = useReadinessCounts()
  const [filter, setFilter] = useState<'all' | Readiness>('all')
  const list = s.vessels.filter((v) => filter === 'all' || assessments.get(v.id)?.status === filter)
  const paged = usePaged(list, 12)
  const pairOf = (id: string) => s.pairs.find((p) => !p.end && (p.tugId === id || p.bargeId === id))
  const vName = (id: string) => s.vessels.find((v) => v.id === id)?.name ?? 'Removed vessel'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented value={filter} onChange={setFilter} options={[
          { value: 'all', label: `All ${s.vessels.length}` },
          { value: 'green', label: `${readinessLabel.green} ${counts.green}` },
          { value: 'yellow', label: `${readinessLabel.yellow} ${counts.yellow}` },
          { value: 'red', label: `${readinessLabel.red} ${counts.red}` },
        ]} />
        <span className="text-sm text-ink-2">Schedule only green vessels. Open a card to see what blocks it.</span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {paged.items.map((v) => {
          const a = assessments.get(v.id)!
          const p = pairOf(v.id)
          const partner = p ? (p.tugId === v.id ? p.bargeId : p.tugId) : null
          return (
            <li key={v.id}>
              <Link to={`/readiness/${v.id}`} className="block h-full rounded border border-line bg-surface p-4 transition-colors hover:bg-accent-soft/60">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{v.name}</div>
                    <div className="tnum text-[13px] text-ink-2">{v.code} · {v.homePort}</div>
                  </div>
                  <ReadinessBadge s={a.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
                  <OpBadge s={v.opStatus} />
                  {partner && <span className="truncate text-ink-2">with {vName(partner)}</span>}
                  {p && pairStatus(p.id) !== a.status && <Badge t="warn">Pair {readinessLabel[pairStatus(p.id)].toLowerCase()}</Badge>}
                </div>
                {a.reasons[0] && <p className="mt-3 line-clamp-2 text-[13px] text-ink">{a.reasons[0].message}{a.reasons.length > 1 && <span className="text-ink-2"> · {a.reasons.length - 1} more</span>}</p>}
              </Link>
            </li>
          )
        })}
      </ul>
      <Pager p={paged as ReturnType<typeof usePaged<unknown>>} sizes={[12, 24, 48]} />
    </div>
  )
}

function SystemView() {
  const { s, userName } = useStore()
  const failed = s.notifications.filter((n) => n.status === 'failed')
  const queued = s.notifications.filter((n) => n.status === 'queued')
  const inactiveHolding = s.users.filter((u) => !u.active).map((u) => ({ u, n: s.docs.filter((d) => d.isCurrent && d.recipientId === u.id).length })).filter((x) => x.n)
  const badLogins = s.loginAttempts.filter((l) => !l.success)
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Failed notifications" value={failed.length} t={failed.length ? 'bad' : undefined} to="/reminders/notifications?status=failed" sub="Last 75 days" />
        <Stat label="Queued now" value={queued.length} sub="Worker polls every 10 s" to="/reminders/notifications?status=queued" />
        <Stat label="Active users" value={s.users.filter((u) => u.active).length} sub={`${s.users.filter((u) => !u.active).length} inactive`} to="/admin/users" />
        <Stat label="Failed sign-ins" value={badLogins.length} sub="Last 7 days" />
      </div>
      {inactiveHolding.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg bg-bad-soft p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold text-bad">Reminders are going to an inactive user</div>
            <p className="mt-0.5 text-sm text-ink">{inactiveHolding.map((x) => `${x.u.name} still receives ${x.n} documents`).join('; ')}. Their reminders fail on purpose until you reassign them (SINAR-03).</p>
          </div>
          <Link to="/reminders/settings" className="shrink-0"><Button variant="danger">Reassign recipient</Button></Link>
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Latest changes" actions={<Link to="/admin/audit" className="text-sm font-medium text-accent hover:underline">Audit log</Link>} pad={false}>
          <ul className="px-5 pb-3">
            {s.audit.slice(0, 7).map((a) => (
              <li key={a.id} className="border-t border-surface-2 py-3 text-sm first:border-0">
                <div className="flex justify-between gap-3"><span className="truncate font-medium">{a.rowLabel}</span><span className="tnum shrink-0 text-[13px] text-ink-2">{fmtDateTime(a.at)}</span></div>
                <div className="text-[13px] text-ink-2">{userName(a.userId)} · {a.action} · {a.table}</div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Sign-in attempts" pad={false}>
          <ul className="px-5 pb-3">
            {s.loginAttempts.slice(0, 7).map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 border-t border-surface-2 py-3 text-sm first:border-0">
                <div className="min-w-0"><div className="font-medium">{l.username}</div><div className="tnum text-[13px] text-ink-2">{fmtDateTime(l.at)} · {l.ip}</div></div>
                {l.success ? <Badge t="ok">Signed in</Badge> : <Badge t="bad">{l.reason}</Badge>}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel title="Notification failures">
        {failed.length === 0 ? <p className="text-sm text-ink-2">No failures.</p> : (
          <ul className="space-y-2 text-sm">
            {Object.entries(failed.reduce<Record<string, number>>((m, f) => ({ ...m, [f.error ?? 'Unknown']: (m[f.error ?? 'Unknown'] ?? 0) + 1 }), {})).map(([e, n]) => (
              <li key={e} className="flex justify-between"><span>{e}</span><span className="tnum font-medium">{n}</span></li>
            ))}
          </ul>
        )}
        <div className="mt-3 text-[13px] text-ink-2">Recipients: {[...new Set(failed.map((f) => userName(f.recipientId)))].join(', ') || '—'}</div>
      </Panel>
    </div>
  )
}
