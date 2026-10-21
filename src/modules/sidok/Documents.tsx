import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Check, Download, FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { DeleteDocument, EditDocument } from './forms'
import { DaysLeft, RenewModal } from '../../components/domain'
import { Badge, Button, cx, DocBadge, Empty, Field, FollowBadge, Input, KV, Locked, Modal, PageHeader, Panel, RowActions, SearchBox, Select, Table, Toolbar, useToast, type Col } from '../../components/ui'
import { ranks } from '../../data/master'
import type { Doc, DocType, FollowUp } from '../../data/types'
import { docStatusLabel, followUpLabel } from '../../i18n/en'
import { addDays, addMonths, fmtDate, fmtDateTime, TODAY } from '../../lib/dates'
import { docStatus } from '../../lib/rules'
import { useDocRows, useStore } from '../../store'

type Row = ReturnType<typeof useDocRows>[number]

export function DocumentList() {
  const { s, can, userName } = useStore()
  const all = useDocRows()
  const nav = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const win = params.get('window')
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState(win === 'expired' ? 'expired' : 'all')
  const [recipient, setRecipient] = useState('all')
  const [from, setFrom] = useState(win && win !== 'expired' ? TODAY : '')
  const [to, setTo] = useState(win && win !== 'expired' ? addDays(TODAY, Number(win)) : '')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Doc | null>(null)
  const [removing, setRemoving] = useState<Doc | null>(null)
  const owner = params.get('owner')

  const rows = useMemo(() => all
    .filter((r) => !r.type.sensitive || can('contract.read'))
    .filter((r) => (!owner || r.doc.ownerId === owner) && (kind === 'all' || r.doc.ownerKind === kind) && (type === 'all' || r.type.id === type) && (status === 'all' || r.status === status) && (recipient === 'all' || r.doc.recipientId === recipient))
    .filter((r) => (!from || (r.doc.expiresAt && r.doc.expiresAt >= from)) && (!to || (r.doc.expiresAt && r.doc.expiresAt <= to)))
    .filter((r) => !q || r.owner.toLowerCase().includes(q.toLowerCase()) || r.doc.number.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => ((a.doc.expiresAt ?? '9999') < (b.doc.expiresAt ?? '9999') ? -1 : 1)), [all, can, owner, kind, type, status, recipient, from, to, q])

  const cols: Col<Row>[] = [
    { key: 't', header: 'Document', mobile: 'title', cell: (r) => <div><div className="font-medium">{r.type.name}</div><div className="tnum text-[13px] text-ink-2">{r.doc.number}</div></div> },
    { key: 'o', header: 'Vessel or crew', cell: (r) => r.owner },
    { key: 'e', header: 'Valid until', cell: (r) => <span className="tnum">{fmtDate(r.doc.expiresAt)}</span> },
    { key: 'l', header: 'Left', cell: (r) => <DaysLeft date={r.doc.expiresAt} /> },
    { key: 's', header: 'Status', cell: (r) => <DocBadge s={r.status} /> },
    { key: 'f', header: 'Follow-up', mobile: 'hide', cell: (r) => <FollowBadge s={r.doc.followUp} /> },
    { key: 'r', header: 'Reminder to', mobile: 'hide', cell: (r) => r.recipient },
    { key: 'act', header: 'Actions', mobile: 'hide', className: 'text-right', cell: (r) => can(r.doc.ownerKind === 'vessel' ? 'document_vessel.write' : 'document_crew.write') ? <RowActions label={r.type.name} onEdit={() => setEditing(r.doc)} onDelete={() => setRemoving(r.doc)} /> : null },
  ]
  const recipients = [...new Set(all.map((r) => r.doc.recipientId))]

  return (
    <div>
      <PageHeader
        title="Documents"
        module="E-DOC"
        lead="Every active vessel and crew document. Status is worked out from the expiry date, so nobody has to update it by hand."
        actions={<>
          <Button variant="secondary" onClick={() => toast(`documents-${TODAY}.xlsx generated with ${rows.length} rows, same filters as the screen.`)}><Download className="size-4" />Export</Button>
          {(can('document_vessel.write') || can('document_crew.write')) && <Button onClick={() => setAdding(true)}><Plus className="size-4" />Add document</Button>}
        </>}
      />
      {owner && <div className="mb-4 flex items-center gap-2 text-sm">Showing documents for <span className="font-medium">{s.vessels.find((v) => v.id === owner)?.name ?? s.crew.find((c) => c.id === owner)?.name}</span> <Link to="/documents" className="text-accent hover:underline">Clear</Link></div>}
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Vessel, crew or number" />
        <Select value={kind} onChange={(e) => { setKind(e.target.value); setType('all') }} aria-label="Belongs to"><option value="all">Vessel and crew</option><option value="vessel">Vessel documents</option><option value="crew">Crew documents</option></Select>
        <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type"><option value="all">All types</option>{s.docTypes.filter((t) => kind === 'all' || t.object === kind).filter((t) => !t.sensitive || can('contract.read')).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="all">Any status</option>{Object.entries(docStatusLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
        <Select value={recipient} onChange={(e) => setRecipient(e.target.value)} aria-label="Recipient"><option value="all">Any recipient</option>{recipients.map((u) => <option key={u} value={u}>{userName(u)}</option>)}</Select>
        <div className="flex items-center gap-2 text-sm text-ink-2">
          <span>Expires</span>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="!w-40" aria-label="Expires from" />
          <span>to</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="!w-40" aria-label="Expires until" />
        </div>
      </Toolbar>
      <Table rows={rows} cols={cols} rowKey={(r) => r.doc.id} onRow={(r) => nav(`/documents/${r.doc.id}`)} limit={50} />
      <AddDocument open={adding} onClose={() => setAdding(false)} presetOwner={owner} />
      {editing && <EditDocument doc={editing} open onClose={() => setEditing(null)} />}
      {removing && <DeleteDocument doc={removing} open onClose={() => setRemoving(null)} />}
    </div>
  )
}

function AddDocument({ open, onClose, presetOwner }: { open: boolean; onClose: () => void; presetOwner: string | null }) {
  const { s, can, addDocument } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const presetKind = presetOwner ? (s.vessels.some((v) => v.id === presetOwner) ? 'vessel' : 'crew') : can('document_vessel.write') ? 'vessel' : 'crew'
  const [kind, setKind] = useState<'vessel' | 'crew'>(presetKind)
  const [ownerId, setOwnerId] = useState(presetOwner ?? '')
  const [typeId, setTypeId] = useState('')
  const [number, setNumber] = useState('')
  const [issued, setIssued] = useState(TODAY)
  const [expires, setExpires] = useState('')
  const [file, setFile] = useState('')
  const t = s.docTypes.find((x) => x.id === typeId)
  const owners = kind === 'vessel' ? s.vessels.map((v) => ({ id: v.id, name: v.name })) : s.crew.map((c) => ({ id: c.id, name: `${c.name} · ${c.crewNo}` }))
  const ok = ownerId && t && number && (!t.hasExpiry || expires) && file
  const submit = () => {
    const id = addDocument({ typeId, ownerKind: kind, ownerId, number, issuedAt: issued, expiresAt: t!.hasExpiry ? expires : null, issuer: t!.issuer, files: [{ id: `f-${Date.now()}`, name: file, sizeKb: 640, kind: 'pdf', uploadedAt: TODAY }] })
    toast('Document recorded. Reminders were scheduled from its expiry date.')
    onClose()
    nav(`/documents/${id}`)
  }
  return (
    <Modal open={open} onClose={onClose} title="Add document" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!ok} onClick={submit}>Save document</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Belongs to"><Select value={kind} onChange={(e) => { setKind(e.target.value as 'vessel' | 'crew'); setOwnerId(''); setTypeId('') }}>{can('document_vessel.write') && <option value="vessel">Vessel</option>}{can('document_crew.write') && <option value="crew">Crew member</option>}</Select></Field>
        <Field label={kind === 'vessel' ? 'Vessel' : 'Crew member'}><Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}><option value="">Choose</option>{owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>
        <Field label="Document type" className="sm:col-span-2"><Select value={typeId} onChange={(e) => { setTypeId(e.target.value); const nt = s.docTypes.find((x) => x.id === e.target.value); setExpires(nt?.hasExpiry ? addMonths(issued, nt.validityMonths) : '') }}><option value="">Choose a type</option>{s.docTypes.filter((x) => x.object === kind && x.active && (!x.sensitive || can('contract.read'))).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
        <Field label="Document number" className="sm:col-span-2"><Input value={number} onChange={(e) => setNumber(e.target.value)} /></Field>
        <Field label="Issued on"><Input type="date" value={issued} onChange={(e) => setIssued(e.target.value)} /></Field>
        {t?.hasExpiry !== false && <Field label="Valid until"><Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} /></Field>}
        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-[13px] font-medium">Scan</span>
          <label className={cx('flex cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-5 text-sm', file ? 'bg-ok-soft text-ok' : 'bg-surface-2 text-ink-2 hover:bg-surface-3')}>
            {file ? <><Check className="size-4" />{file}</> : <span><span className="font-medium text-accent">Choose a PDF, JPG or PNG</span> · up to 10 MB</span>}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => setFile(e.target.files?.[0]?.name ?? '')} />
          </label>
          {!file && <button type="button" className="mt-2 text-[13px] text-accent hover:underline" onClick={() => setFile(`${t?.code ?? 'DOC'}_${TODAY}.pdf`)}>Use a sample scan for the demo</button>}
        </div>
      </div>
    </Modal>
  )
}

// A drawn page standing in for the uploaded scan.
function ScanPreview({ doc, type, owner }: { doc: Doc; type: DocType; owner: string }) {
  return (
    <div className="mx-auto aspect-[1/1.3] w-full max-w-[20rem] bg-white p-6 text-[9px] leading-snug text-ink shadow-[0_1px_0_#d5dce2,0_8px_24px_-12px_rgba(13,27,42,.35)]">
      <div className="text-center">
        <div className="text-[8px] uppercase text-ink-2">Republik Indonesia</div>
        <div className="mt-1 text-[11px] font-semibold">{type.name}</div>
        <div className="tnum mt-1 text-ink-2">No. {doc.number}</div>
      </div>
      <div className="mt-5 space-y-2">
        {[['Name', owner], ['Issued', fmtDate(doc.issuedAt)], ['Valid until', fmtDate(doc.expiresAt)], ['Issued by', doc.issuer], ...(doc.level ? [['Level', doc.level]] : [])].map(([k, v]) => (
          <div key={k} className="flex gap-2"><span className="w-16 shrink-0 text-ink-2">{k}</span><span className="font-medium">{v}</span></div>
        ))}
      </div>
      <div className="mt-6 space-y-1.5">{[90, 82, 95, 70, 88, 60].map((w, i) => <div key={i} className="h-1 rounded bg-surface-2" style={{ width: `${w}%` }} />)}</div>
      <div className="mt-8 flex items-end justify-between">
        <div className="grid size-12 place-items-center rounded-full bg-accent-soft text-[7px] font-semibold text-accent">STAMP</div>
        <div className="text-right text-ink-2"><div className="h-4 w-20 border-b border-ink-3" />Signed</div>
      </div>
    </div>
  )
}

export function DocumentDetail() {
  const { id } = useParams()
  const { s, can, ownerName, userName, setFollowUp } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const [renew, setRenew] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const doc = s.docs.find((d) => d.id === id)
  if (!doc) return <Empty notFound title="Document not found" />
  const type = s.docTypes.find((t) => t.id === doc.typeId)!
  if (type.sensitive && !can('contract.read')) return <div className="max-w-xl"><Locked what="This document" /></div>

  // Walk the version chain both ways.
  const chain: Doc[] = []
  let cur: Doc | undefined = s.docs.find((d) => d.isCurrent && d.ownerId === doc.ownerId && d.typeId === doc.typeId) ?? doc
  while (cur) { chain.push(cur); cur = cur.previousId ? s.docs.find((d) => d.id === cur!.previousId) : undefined }
  const current = chain[0]
  const st = docStatus(doc)
  const writable = can(doc.ownerKind === 'vessel' ? 'document_vessel.write' : 'document_crew.write')
  const notes = s.notifications.filter((n) => n.documentId === doc.id)
  const schedule = doc.expiresAt ? type.reminderDays.map((d) => {
    const date = addDays(doc.expiresAt!, -d)
    const sent = notes.filter((n) => n.reminderDay === d)
    const state = !doc.isCurrent ? 'Cancelled' : date > TODAY ? 'Scheduled' : sent.some((n) => n.status === 'sent') ? 'Sent' : sent.some((n) => n.status === 'queued') ? 'Queued' : sent.length ? 'Failed' : 'Before recording'
    return { d, date, state }
  }) : []
  const ownerLink = doc.ownerKind === 'vessel' ? `/vessels/${doc.ownerId}` : `/crew/${doc.ownerId}`

  return (
    <div>
      <PageHeader
        back={{ to: '/documents', label: 'Documents' }}
        title={type.name}
        module="E-DOC"
        lead={<><Link to={ownerLink} className="text-accent hover:underline">{ownerName(doc)}</Link> · No. {doc.number}</>}
        actions={<>
          {!doc.isCurrent && <Button variant="secondary" onClick={() => nav(`/documents/${current.id}`)}>Open current version</Button>}
          {doc.isCurrent && writable && <Button variant="secondary" onClick={() => setEditOpen(true)}><Pencil className="size-4" />Correct</Button>}
          {doc.isCurrent && writable && <Button variant="secondary" className="!border-bad !text-bad hover:!bg-bad-soft" onClick={() => setDelOpen(true)}><Trash2 className="size-4" />Delete</Button>}
          {doc.isCurrent && writable && <Button onClick={() => setRenew(true)}>Renew</Button>}
        </>}
      />
      {!doc.isCurrent && <div className="mb-5 rounded-lg bg-surface-2 p-4 text-sm">This is archived version {doc.version}. It was replaced on {fmtDateTime(doc.archivedAt!)}.</div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className={cx('flex flex-wrap items-center justify-between gap-4 rounded-lg p-5', st === 'valid' ? 'bg-ok-soft' : st === 'soon' ? 'bg-warn-soft' : 'bg-bad-soft')}>
            <div>
              <div className="text-sm text-ink-2">Valid until</div>
              <div className="tnum mt-1 text-[28px] font-semibold leading-none tracking-[-0.02em]">{fmtDate(doc.expiresAt)}</div>
              <div className="mt-2 text-[15px]">{doc.expiresAt ? <DaysLeft date={doc.expiresAt} /> : 'This document type has no expiry.'}</div>
            </div>
            <DocBadge s={st} />
          </section>
          <Panel title="Details"><KV items={[['Number', doc.number], ['Issued on', fmtDate(doc.issuedAt)], ['Issued by', doc.issuer], ['Category', type.category], ['Version', `v${doc.version}`], ...(doc.level ? [['Level', doc.level] as [string, string]] : []), ['Recorded by', userName(doc.createdBy)], ['Reminder recipient', userName(doc.recipientId)]]} /></Panel>

          {doc.expiresAt && (
            <Panel title="Reminders" actions={<span className="text-[13px] text-ink-2">WhatsApp and email · 08:00 WIB</span>}>
              {schedule.length ? (
                <ol className="grid gap-2 sm:grid-cols-4">
                  {schedule.map((r) => (
                    <li key={r.d} className={cx('rounded-md p-3', r.state === 'Sent' ? 'bg-ok-soft' : r.state === 'Failed' ? 'bg-bad-soft' : 'bg-surface-2/60')}>
                      <div className="tnum text-lg font-semibold leading-none">{r.d} days</div>
                      <div className="tnum mt-1 text-[13px] text-ink-2">{fmtDate(r.date)}</div>
                      <div className="mt-2 text-[13px] font-medium">{r.state}</div>
                    </li>
                  ))}
                </ol>
              ) : <p className="text-sm text-ink-2">No reminder schedule for this type.</p>}
              {doc.isCurrent && (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium">Follow-up</span>
                  {(['pending', 'in_progress', 'done'] as FollowUp[]).map((f) => (
                    <Button key={f} size="sm" variant={doc.followUp === f || (!doc.followUp && f === 'pending' && st !== 'valid') ? 'primary' : 'secondary'} disabled={!can('followup.write') || f === 'done'} onClick={() => { setFollowUp(doc.id, f); toast(`Follow-up set to “${followUpLabel[f]}”.`) }}>{followUpLabel[f]}</Button>
                  ))}
                  <span className="text-[13px] text-ink-2">“Done” is set automatically when the renewal is recorded.</span>
                </div>
              )}
            </Panel>
          )}

          <Panel title="Version history" pad={false}>
            <ol className="px-5 pb-3">
              {chain.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-2 py-3 first:border-0">
                  <div>
                    <Link to={`/documents/${d.id}`} className={cx('font-medium hover:text-accent', d.id === doc.id && 'text-accent')}>Version {d.version} · {d.number}</Link>
                    <div className="tnum text-[13px] text-ink-2">{fmtDate(d.issuedAt)} – {fmtDate(d.expiresAt)}</div>
                  </div>
                  {d.isCurrent ? <Badge t="accent">Current</Badge> : <Badge>Archived {fmtDate(d.archivedAt)}</Badge>}
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <aside className="space-y-4">
          <Panel title="Scan">
            <ScanPreview doc={doc} type={type} owner={ownerName(doc)} />
            <ul className="mt-4 space-y-2">
              {doc.files.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2 rounded bg-surface-2 px-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2"><FileText className="size-4 shrink-0 text-ink-2" /><span className="truncate">{f.name}</span></span>
                  <span className="tnum shrink-0 text-xs text-ink-2">{f.sizeKb} KB</span>
                </li>
              ))}
            </ul>
            <Button variant="secondary" className="mt-3 w-full" onClick={() => toast('In the real app the file streams from the API after a permission check.')}><Download className="size-4" />Download</Button>
          </Panel>
          {notes.length > 0 && (
            <Panel title="Messages sent">
              <ul className="space-y-2 text-sm">
                {notes.slice(0, 6).map((n) => (
                  <li key={n.id} className="flex items-center justify-between gap-2">
                    <span><span className="font-medium">{n.channel === 'whatsapp' ? 'WhatsApp' : 'Email'}</span> <span className="text-ink-2">· {n.reminderDay} d</span></span>
                    <Badge t={n.status === 'sent' ? 'ok' : n.status === 'failed' ? 'bad' : 'neutral'}>{n.status === 'sent' ? 'Sent' : n.status === 'failed' ? 'Failed' : 'Queued'}</Badge>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </aside>
      </div>
      <RenewModal doc={doc.isCurrent ? doc : null} open={renew} onClose={() => setRenew(false)} onDone={(nid) => nav(`/documents/${nid}`)} />
      <EditDocument doc={doc} open={editOpen} onClose={() => setEditOpen(false)} />
      <DeleteDocument doc={doc} open={delOpen} onClose={() => setDelOpen(false)} onDone={(prev) => nav(prev ? `/documents/${prev}` : '/documents')} />
    </div>
  )
}

export function DocumentTypes() {
  const { s, can, updateDocType, addDocType } = useStore()
  const toast = useToast()
  const [edit, setEdit] = useState<DocType | null>(null)
  const [draft, setDraft] = useState<DocType | null>(null)
  const [creating, setCreating] = useState(false)
  const editable = can('master.manage')
  const used = (id: string) => s.docs.filter((d) => d.isCurrent && d.typeId === id).length
  const open = (t: DocType | null) => {
    setCreating(!t)
    const base: DocType = t ?? { id: '', code: '', name: '', object: 'vessel', category: '', hasExpiry: true, validityMonths: 12, soonDays: 90, reminderDays: [90, 60, 30, 7], issuer: '', sensitive: false, active: true }
    setEdit(base)
    setDraft({ ...base, reminderDays: [...base.reminderDays] })
  }
  const save = () => {
    if (!draft) return
    if (creating) { addDocType({ ...draft, code: draft.code || draft.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_') }); toast(`${draft.name} added. It can be used right away, no developer needed.`) }
    else { updateDocType(draft.id, { soonDays: draft.soonDays, reminderDays: draft.reminderDays, validityMonths: draft.validityMonths, active: draft.active, name: draft.name, hasExpiry: draft.hasExpiry }); toast('Saved. Reminder schedules of active documents of this type are being rebuilt (JOB-05).') }
    setEdit(null)
  }
  const cols: Col<DocType>[] = [
    { key: 'n', header: 'Type', mobile: 'title', cell: (t) => <div><div className="font-medium">{t.name}</div><div className="text-[13px] text-ink-2">{t.code}</div></div> },
    { key: 'o', header: 'For', cell: (t) => (t.object === 'vessel' ? 'Vessel' : 'Crew') },
    { key: 'c', header: 'Category', mobile: 'hide', cell: (t) => t.category },
    { key: 'v', header: 'Validity', cell: (t) => (t.hasExpiry ? `${t.validityMonths} months` : 'No expiry') },
    { key: 's', header: 'Soon from', cell: (t) => (t.hasExpiry ? `${t.soonDays} days` : '—') },
    { key: 'r', header: 'Reminders', cell: (t) => (t.reminderDays.length ? <span className="tnum">{t.reminderDays.join(' · ')} d</span> : '—') },
    { key: 'u', header: 'In use', className: 'text-right', cell: (t) => <span className="tnum">{used(t.id)}</span> },
    { key: 'f', header: '', cell: (t) => <span className="flex justify-end gap-1">{t.sensitive && <Badge>Sensitive</Badge>}{!t.active && <Badge>Inactive</Badge>}</span> },
  ]
  const toggleDay = (d: number) => draft && setDraft({ ...draft, reminderDays: draft.reminderDays.includes(d) ? draft.reminderDays.filter((x) => x !== d) : [...draft.reminderDays, d].sort((a, b) => b - a) })
  return (
    <div>
      <PageHeader title="Document types" module="E-DOC" lead="The admin adds and changes document types here, including when “expiring soon” starts and when reminders go out. New types work immediately." actions={editable && <Button onClick={() => open(null)}><Plus className="size-4" />New type</Button>} />
      <Table rows={s.docTypes} cols={cols} rowKey={(t) => t.id} onRow={editable ? (t) => open(t) : undefined} limit={40} />
      {!editable && <p className="mt-3 text-[13px] text-ink-2">Read only. IT and selected admins edit document types (SIGUNA-05).</p>}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={creating ? 'New document type' : `Edit ${edit?.name}`} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button><Button disabled={!draft?.name} onClick={save}>Save</Button></>}>
        {draft && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" className="sm:col-span-2"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. P&I Insurance" /></Field>
            {creating && <>
              <Field label="For"><Select value={draft.object} onChange={(e) => setDraft({ ...draft, object: e.target.value as 'vessel' | 'crew' })}><option value="vessel">Vessel</option><option value="crew">Crew</option></Select></Field>
              <Field label="Category"><Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Insurance" /></Field>
            </>}
            <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" className="size-4 accent-accent" checked={draft.hasExpiry} onChange={(e) => setDraft({ ...draft, hasExpiry: e.target.checked })} />Has an expiry date</label>
            {draft.hasExpiry && <>
              <Field label="Default validity (months)"><Input type="number" min={1} value={draft.validityMonths} onChange={(e) => setDraft({ ...draft, validityMonths: Number(e.target.value) })} /></Field>
              <Field label="“Expiring soon” from (days)"><Input type="number" min={1} value={draft.soonDays} onChange={(e) => setDraft({ ...draft, soonDays: Number(e.target.value) })} /></Field>
              <div className="sm:col-span-2">
                <span className="mb-1.5 block text-[13px] font-medium">Send reminders this many days before expiry</span>
                <div className="flex flex-wrap gap-2">
                  {[120, 90, 60, 45, 30, 14, 7, 3, 1].map((d) => (
                    <button key={d} type="button" onClick={() => toggleDay(d)} className={cx('tnum h-9 min-w-12 rounded-md px-3 text-sm font-medium transition-colors', draft.reminderDays.includes(d) ? 'bg-accent text-white' : 'bg-surface-2 text-ink hover:bg-surface-3')}>{d}</button>
                  ))}
                </div>
              </div>
            </>}
            {!creating && <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" className="size-4 accent-accent" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />Active (inactive types cannot be chosen for new documents)</label>}
          </div>
        )}
      </Modal>
    </div>
  )
}

export function RequiredDocs() {
  const { s, can, toggleRequiredRule } = useStore()
  const editable = can('composition.manage')
  const vesselTypes = s.docTypes.filter((t) => t.object === 'vessel')
  const crewTypes = s.docTypes.filter((t) => t.object === 'crew' && !t.sensitive)
  const has = (scope: 'vessel' | 'rank', target: string, typeId: string) => s.requiredDocRules.some((r) => r.scope === scope && r.target === target && r.typeId === typeId)
  const Cell = ({ scope, target, typeId }: { scope: 'vessel' | 'rank'; target: string; typeId: string }) => {
    const on = has(scope, target, typeId)
    return (
      <td className="px-2 py-2 text-center">
        <button
          disabled={!editable}
          onClick={() => toggleRequiredRule(scope, target, typeId)}
          aria-pressed={on}
          aria-label={on ? 'Required' : 'Not required'}
          className={cx('inline-grid size-7 place-items-center rounded transition-colors', on ? 'bg-accent text-white' : 'bg-surface-2 text-transparent', editable && 'hover:ring-2 hover:ring-accent')}
        >
          <Check className="size-4" />
        </button>
      </td>
    )
  }
  return (
    <div>
      <PageHeader title="Required documents" module="E-DOC · SIAP" lead="What each vessel type and each rank must hold. SIAP only checks what is ticked here; an empty rule means no obligation. Draft list, to confirm with KSOP and the class society." />
      <div className="space-y-6">
        <Panel title="Per vessel type">
          <div className="overflow-x-auto">
            <table className="text-sm">
              <thead><tr className="text-[13px] text-ink-2"><th className="py-2 pr-4 text-left font-medium">Document</th><th className="px-2 font-medium">Tug boat</th><th className="px-2 font-medium">Barge</th></tr></thead>
              <tbody>
                {vesselTypes.map((t) => (
                  <tr key={t.id} className="border-t border-surface-2">
                    <td className="py-1 pr-4">{t.name}{t.id === 'dt-coal' && <span className="text-ink-2"> · coal barges only</span>}</td>
                    <Cell scope="vessel" target="TB" typeId={t.id} />
                    <Cell scope="vessel" target="BG" typeId={t.id} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Per rank">
          <div className="overflow-x-auto">
            <table className="text-sm">
              <thead><tr className="text-[13px] text-ink-2"><th className="py-2 pr-4 text-left font-medium">Certificate</th>{ranks.map((r) => <th key={r.code} className="px-2 font-medium">{r.name}</th>)}</tr></thead>
              <tbody>
                {crewTypes.map((t) => (
                  <tr key={t.id} className="border-t border-surface-2">
                    <td className="py-1 pr-4 whitespace-nowrap">{t.name}</td>
                    {ranks.map((r) => <Cell key={r.code} scope="rank" target={r.code} typeId={t.id} />)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        {!editable && <p className="text-[13px] text-ink-2">Read only for your role. Changes here change every vessel’s readiness at once.</p>}
      </div>
    </div>
  )
}
