import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { RotateCw } from 'lucide-react'
import { DaysLeft, RenewModal } from '../../components/domain'
import { Badge, Button, cx, DocBadge, Field, Input, PageHeader, Panel, Segmented, Select, Stat, Table, Textarea, Toolbar, useToast, type Col } from '../../components/ui'
import type { Doc, FollowUp, NotificationRow, RoleId, Template } from '../../data/types'
import { followUpLabel, roleLabel } from '../../i18n/en'
import { addDays, daysLeft, fmtDate, fmtDateTime, TODAY } from '../../lib/dates'
import { useDocRows, useStore } from '../../store'

type Row = ReturnType<typeof useDocRows>[number]

export function FollowUps() {
  const { s, me, can, setFollowUp } = useStore()
  const rows = useDocRows()
  const nav = useNavigate()
  const toast = useToast()
  const [scope, setScope] = useState<'mine' | 'all'>(can('reminder.config') ? 'all' : 'mine')
  const [fu, setFu] = useState<'all' | FollowUp>('all')
  const [renew, setRenew] = useState<Doc | null>(null)

  const list = useMemo(() => rows
    .filter((r) => r.status !== 'valid' && (!r.type.sensitive || can('contract.read')))
    .filter((r) => scope === 'all' || r.doc.recipientId === me.id)
    .filter((r) => fu === 'all' || (r.doc.followUp ?? 'pending') === fu)
    .sort((a, b) => (a.doc.expiresAt! < b.doc.expiresAt! ? -1 : 1)), [rows, scope, fu, me.id, can])

  const stagesFor = (r: Row) => r.type.reminderDays.map((d) => {
    const date = addDays(r.doc.expiresAt!, -d)
    const ns = s.notifications.filter((n) => n.documentId === r.doc.id && n.reminderDay === d)
    return { d, state: date > TODAY ? 'later' : ns.some((n) => n.status === 'sent') ? 'sent' : ns.some((n) => n.status === 'failed') ? 'failed' : ns.length ? 'queued' : 'skipped' }
  })

  const cols: Col<Row>[] = [
    { key: 'd', header: 'Document', mobile: 'title', cell: (r) => <div><div className="font-medium">{r.type.name}</div><div className="text-[13px] text-ink-2">{r.owner}</div></div> },
    { key: 'e', header: 'Expires', cell: (r) => <div><div className="tnum">{fmtDate(r.doc.expiresAt)}</div><div className="text-[13px]"><DaysLeft date={r.doc.expiresAt} /></div></div> },
    { key: 's', header: 'Reminders', cell: (r) => (
      <div className="flex gap-1">
        {stagesFor(r).map((x) => (
          <span key={x.d} title={`${x.d} days: ${x.state}`} className={cx('tnum rounded px-1.5 py-0.5 text-[11px] font-medium', x.state === 'sent' && 'bg-ok-soft text-ok', x.state === 'failed' && 'bg-bad-soft text-bad', x.state === 'queued' && 'bg-accent-soft text-accent-strong', x.state === 'later' && 'bg-surface-2 text-ink-3', x.state === 'skipped' && 'bg-surface-2 text-ink-2 line-through')}>{x.d}</span>
        ))}
      </div>
    ) },
    { key: 'st', header: 'Status', cell: (r) => <DocBadge s={r.status} /> },
    { key: 'f', header: 'Follow-up', cell: (r) => (
      <Select disabled={!can('followup.write')} value={r.doc.followUp ?? 'pending'} onClick={(e) => e.stopPropagation()} onChange={(e) => { setFollowUp(r.doc.id, e.target.value as FollowUp); toast(`Follow-up set to “${followUpLabel[e.target.value as FollowUp]}”.`) }} className="h-8 w-36 text-[13px]" aria-label="Follow-up">
        <option value="pending">{followUpLabel.pending}</option><option value="in_progress">{followUpLabel.in_progress}</option>
      </Select>
    ) },
    { key: 'r', header: 'Recipient', mobile: 'hide', cell: (r) => r.recipient },
    { key: 'a', header: '', className: 'text-right', cell: (r) => can(r.doc.ownerKind === 'vessel' ? 'document_vessel.write' : 'document_crew.write') ? <Button size="sm" onClick={(e) => { e.stopPropagation(); setRenew(r.doc) }}>Renew</Button> : null },
  ]

  const mineSoon = rows.filter((r) => r.doc.recipientId === me.id && r.doc.expiresAt && r.doc.expiresAt >= TODAY && daysLeft(r.doc.expiresAt) <= 30).sort((a, b) => (a.doc.expiresAt! < b.doc.expiresAt! ? -1 : 1))

  return (
    <div>
      <PageHeader title="Follow-up" module="SINAR" lead="Documents that have started sending reminders. A reminder stops by itself once the new version is recorded (SINAR-04)." />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div>
          <Toolbar>
            <Segmented value={scope} onChange={setScope} options={[{ value: 'mine', label: 'Sent to me' }, { value: 'all', label: 'Everyone' }]} />
            <Segmented value={fu} onChange={setFu} options={[{ value: 'all', label: 'Any' }, { value: 'pending', label: followUpLabel.pending }, { value: 'in_progress', label: followUpLabel.in_progress }]} />
          </Toolbar>
          <Table rows={list} cols={cols} rowKey={(r) => r.doc.id} onRow={(r) => nav(`/documents/${r.doc.id}`)} limit={30} empty="Nothing waiting." />
          <p className="mt-3 flex flex-wrap gap-3 text-[13px] text-ink-2">
            <span><Badge t="ok">30</Badge> sent</span><span><Badge t="bad">30</Badge> failed</span><span><Badge t="accent">30</Badge> queued</span><span><Badge>30</Badge> later</span><span>Struck through: passed before the document was recorded</span>
          </p>
        </div>
        <Panel title="Monday’s summary for you">
          <div className="rounded bg-surface-2 p-4 text-sm">
            <div className="text-[13px] text-ink-2">To {me.email}</div>
            <div className="mt-1 font-medium">[OneEnergy] {mineSoon.length} documents expire in the next 30 days</div>
            <ul className="mt-3 space-y-1.5">
              {mineSoon.slice(0, 8).map((r) => <li key={r.doc.id} className="flex justify-between gap-2"><span className="truncate">{r.type.name} · {r.owner}</span><span className="tnum shrink-0 text-ink-2">{fmtDate(r.doc.expiresAt)}</span></li>)}
              {mineSoon.length > 8 && <li className="text-ink-2">and {mineSoon.length - 8} more</li>}
              {!mineSoon.length && <li className="text-ink-2">Nothing expires in the next 30 days.</li>}
            </ul>
          </div>
          <p className="mt-3 text-[13px] text-ink-2">Sent every {s.config.find((c) => c.key === 'ringkasan.hari')?.value} at {s.config.find((c) => c.key === 'ringkasan.jam')?.value} WIB (SINAR-05).</p>
        </Panel>
      </div>
      <RenewModal doc={renew} open={!!renew} onClose={() => setRenew(null)} />
    </div>
  )
}

export function Notifications() {
  const { s, userName, ownerName, resendNotification } = useStore()
  const toast = useToast()
  const [params] = useSearchParams()
  const [status, setStatus] = useState<'all' | NotificationRow['status']>((params.get('status') as NotificationRow['status']) ?? 'all')
  const [channel, setChannel] = useState('all')
  const docById = useMemo(() => new Map(s.docs.map((d) => [d.id, d])), [s.docs])
  const rows = s.notifications.filter((n) => (status === 'all' || n.status === status) && (channel === 'all' || n.channel === channel))
  const count = (st: NotificationRow['status']) => s.notifications.filter((n) => n.status === st).length

  const cols: Col<NotificationRow>[] = [
    { key: 't', header: 'Queued', cell: (n) => <span className="tnum whitespace-nowrap">{fmtDateTime(n.createdAt)}</span> },
    { key: 'd', header: 'Document', mobile: 'title', cell: (n) => { const d = docById.get(n.documentId)!; return <Link to={`/documents/${d.id}`} onClick={(e) => e.stopPropagation()} className="hover:text-accent"><div className="font-medium">{s.docTypes.find((t) => t.id === d.typeId)!.name}</div><div className="text-[13px] text-ink-2">{ownerName(d)}</div></Link> } },
    { key: 'c', header: 'Channel', cell: (n) => (n.channel === 'whatsapp' ? 'WhatsApp' : 'Email') },
    { key: 'st', header: 'Stage', cell: (n) => <span className="tnum">{n.reminderDay} days</span> },
    { key: 'r', header: 'Recipient', cell: (n) => userName(n.recipientId) },
    { key: 's', header: 'Result', cell: (n) => (
      <div>
        <Badge t={n.status === 'sent' ? 'ok' : n.status === 'failed' ? 'bad' : 'neutral'}>{n.status === 'sent' ? 'Delivered' : n.status === 'failed' ? 'Failed' : 'Queued'}</Badge>
        {n.error && <div className="mt-1 max-w-xs text-[13px] text-bad">{n.error}</div>}
      </div>
    ) },
    { key: 'a', header: 'Tries', className: 'text-right', cell: (n) => <span className="tnum">{n.attempts}</span> },
    { key: 'x', header: '', className: 'text-right', cell: (n) => n.status === 'failed' && !n.error?.startsWith('Recipient inactive') ? <Button size="sm" variant="secondary" onClick={() => { resendNotification(n.id); toast('Queued again and delivered.') }}><RotateCw className="size-3.5" />Resend</Button> : n.error?.startsWith('Recipient inactive') ? <Link to="/reminders/settings" className="text-[13px] font-medium text-accent hover:underline">Reassign</Link> : null },
  ]
  return (
    <div>
      <PageHeader title="Delivery monitor" module="SINAR" lead="Every WhatsApp and email the system tried to send, with each failure kept. WhatsApp and email go out independently; a reminder counts as sent when one of them arrives." />
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Stat label="Delivered" value={count('sent')} t="ok" />
        <Stat label="Failed" value={count('failed')} t={count('failed') ? 'bad' : undefined} />
        <Stat label="Queued" value={count('queued')} />
      </div>
      <Toolbar>
        <Segmented value={status} onChange={setStatus} options={[{ value: 'all', label: 'All' }, { value: 'failed', label: 'Failed' }, { value: 'queued', label: 'Queued' }, { value: 'sent', label: 'Delivered' }]} />
        <Select value={channel} onChange={(e) => setChannel(e.target.value)} aria-label="Channel"><option value="all">WhatsApp and email</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option></Select>
      </Toolbar>
      <Table rows={rows} cols={cols} rowKey={(n) => n.id} limit={40} />
    </div>
  )
}

const SAMPLE = { nama_objek: 'TB Energi Mahakam', jenis_dokumen: 'Load Line Certificate', tgl_berlaku: '20 Nov 2026', sisa_hari: '30', tautan: 'https://oneenergy.local/dokumen/d-1042', jumlah: '7', daftar: '• Load Line Certificate · TB Energi Mahakam · 20 Nov 2026\n• Medical Check-up · Ahmad Siregar · 24 Nov 2026\n• …' }
const fill = (t: string) => t.replace(/\{\{(\w+)\}\}/g, (_, k: keyof typeof SAMPLE) => SAMPLE[k] ?? `{{${k}}}`)

export function Templates() {
  const { s, can, updateTemplate } = useStore()
  const toast = useToast()
  const [sel, setSel] = useState<string>(s.templates[0].id)
  const t = s.templates.find((x) => x.id === sel)!
  const [body, setBody] = useState(t.body)
  const editable = can('config.manage')
  const pickT = (x: Template) => { setSel(x.id); setBody(x.body) }
  return (
    <div>
      <PageHeader title="Message templates" module="SINAR" lead="WhatsApp templates must be approved by the provider before use. Editing one sends it back for approval." />
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <ul className="space-y-1">
          {s.templates.map((x) => (
            <li key={x.id}>
              <button onClick={() => pickT(x)} className={cx('w-full rounded-md px-3 py-2.5 text-left transition-colors', x.id === sel ? 'bg-surface' : 'hover:bg-surface/60')}>
                <div className="text-sm font-medium">{x.name}</div>
                <div className="mt-1 flex items-center gap-2 text-[13px] text-ink-2">{x.channel === 'whatsapp' ? 'WhatsApp' : 'Email'}<Badge t={x.approval === 'approved' ? 'ok' : x.approval === 'pending' ? 'warn' : 'bad'}>{x.approval === 'approved' ? 'Approved' : x.approval === 'pending' ? 'Awaiting approval' : 'Rejected'}</Badge></div>
              </button>
            </li>
          ))}
        </ul>
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Text">
            {t.providerCode && <div className="mb-3 text-[13px] text-ink-2">Provider template: {t.providerCode}</div>}
            {t.subject && <Field label="Subject" className="mb-3"><Input value={t.subject} readOnly /></Field>}
            <Field label="Body" hint="Variables: {{nama_objek}} {{jenis_dokumen}} {{tgl_berlaku}} {{sisa_hari}} {{tautan}}">
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} readOnly={!editable} rows={9} />
            </Field>
            {editable && <Button className="mt-3" disabled={body === t.body} onClick={() => { updateTemplate(t.id, body); toast(t.channel === 'whatsapp' ? 'Saved and sent to the provider for approval.' : 'Saved.') }}>Save template</Button>}
          </Panel>
          <Panel title="Preview">
            {t.channel === 'whatsapp' ? (
              <div className="rounded-lg bg-[#e7ded3] p-4">
                <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-[14px] leading-relaxed text-[#111b21] whitespace-pre-wrap">
                  {fill(body)}
                  <div className="mt-1 text-right text-[11px] text-[#667781]">08:00</div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-surface-2/60 p-4 text-sm">
                <div className="text-[13px] text-ink-2">From sinar@oneenergy.co.id</div>
                <div className="mt-1 font-semibold">{fill(t.subject ?? '')}</div>
                <div className="mt-3 whitespace-pre-wrap leading-relaxed">{fill(body)}</div>
              </div>
            )}
            <p className="mt-3 text-[13px] text-ink-2">Filled with a sample document. Contract reminders leave out the dates and only name the crew member.</p>
          </Panel>
        </div>
      </div>
    </div>
  )
}

export function ReminderSettings() {
  const { s, reassignRecipient, setEscalation, updateConfig } = useStore()
  const toast = useToast()
  const holders = s.users.map((u) => ({ u, n: s.docs.filter((d) => d.isCurrent && d.recipientId === u.id).length })).filter((x) => x.n)
  const [from, setFrom] = useState(holders.find((h) => !h.u.active)?.u.id ?? '')
  const [to, setTo] = useState('')
  const [esc, setEsc] = useState(s.escalation)
  const cfg = (k: string) => s.config.find((c) => c.key === k)!.value
  return (
    <div>
      <PageHeader title="Recipients and escalation" module="SINAR" lead="Reminders go only to the person who recorded the document. IT moves them when staff change jobs." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Who receives reminders">
          <ul className="space-y-2">
            {holders.map(({ u, n }) => (
              <li key={u.id} className={cx('flex items-center justify-between gap-3 rounded-md p-3', u.active ? 'bg-surface-2/60' : 'bg-bad-soft')}>
                <div><div className="font-medium">{u.name}</div><div className="text-[13px] text-ink-2">{u.roles.map((r) => roleLabel[r]).join(', ')}{!u.active && ' · inactive, reminders are failing'}</div></div>
                <span className="tnum text-sm font-medium">{n} documents</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label="Move all from"><Select value={from} onChange={(e) => setFrom(e.target.value)}><option value="">Choose</option>{holders.map(({ u }) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field>
            <Field label="To"><Select value={to} onChange={(e) => setTo(e.target.value)}><option value="">Choose</option>{s.users.filter((u) => u.active && u.id !== from && (u.roles.includes('doc_admin') || u.roles.includes('crewing'))).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field>
            <Button disabled={!from || !to} onClick={() => { const n = reassignRecipient(from, to); toast(`${n} documents moved. Failed reminders were queued again for the new recipient.`); setFrom(''); setTo('') }}>Move</Button>
          </div>
        </Panel>
        <div className="space-y-6">
          <Panel title="Escalation" actions={<Badge t={esc.active ? 'accent' : 'neutral'}>{esc.active ? 'On' : 'Off by default'}</Badge>}>
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-accent" checked={esc.active} onChange={(e) => setEsc({ ...esc, active: e.target.checked })} />Escalate documents that are still not being handled</label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Days before expiry"><Input type="number" min={1} value={esc.daysBefore} onChange={(e) => setEsc({ ...esc, daysBefore: Number(e.target.value) })} disabled={!esc.active} /></Field>
                <Field label="Send to"><Select value={esc.recipientRole} onChange={(e) => setEsc({ ...esc, recipientRole: e.target.value as RoleId })} disabled={!esc.active}>{(Object.keys(roleLabel) as RoleId[]).map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}</Select></Field>
              </div>
              <p className="text-[13px] text-ink-2">When on, a document with {esc.daysBefore} days or fewer left and follow-up not done is sent once to {roleLabel[esc.recipientRole]} (SINAR-06).</p>
              <Button disabled={JSON.stringify(esc) === JSON.stringify(s.escalation)} onClick={() => { setEscalation(esc); toast('Escalation rule saved.') }}>Save escalation</Button>
            </div>
          </Panel>
          <Panel title="Schedule">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Daily reminder time (WIB)"><Input type="time" defaultValue={cfg('pengingat.jam_kirim')} onBlur={(e) => { updateConfig('pengingat.jam_kirim', e.target.value); toast('Daily send time saved.') }} /></Field>
              <Field label="Weekly summary"><Select defaultValue={cfg('ringkasan.hari')} onChange={(e) => { updateConfig('ringkasan.hari', e.target.value); toast(`Weekly summary moved to ${e.target.value}.`) }}>{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => <option key={d}>{d}</option>)}</Select></Field>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
