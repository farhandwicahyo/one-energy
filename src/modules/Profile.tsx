import { useEffect, useState } from 'react'
import { Check, KeyRound, Pencil, ShieldCheck } from 'lucide-react'
import { initials } from '../components/Shell'
import { Badge, Button, Field, Input, KV, Modal, PageHeader, Panel, Table, useToast } from '../components/ui'
import { permissionCatalog } from '../data/master'
import { roleLabel } from '../i18n/en'
import { fmtDateTime } from '../lib/dates'
import { useStore } from '../store'

export default function Profile() {
  const { s, me, can, updateUser } = useStore()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [pw, setPw] = useState(false)
  const [f, setF] = useState({ email: me.email, phone: me.phone })
  useEffect(() => { if (editing) setF({ email: me.email, phone: me.phone }) }, [editing, me])
  const mine = s.audit.filter((a) => a.userId === me.id)
  const docsHeld = s.docs.filter((d) => d.isCurrent && d.recipientId === me.id).length

  return (
    <div>
      <PageHeader title="My profile" lead="Your account, what your role lets you do, and what you changed recently." />
      <div className="mb-6 flex flex-wrap items-center gap-5 rounded border-2 border-ink bg-surface p-5">
        <span className="grid size-20 place-items-center rounded bg-sorot font-display text-[2.25rem] font-extrabold text-surface">{initials(me.name)}</span>
        <div className="min-w-0 flex-1">
          <div className="judul text-[2.25rem]">{me.name}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">{me.roles.map((r) => <Badge key={r} t="accent">{roleLabel[r]}</Badge>)}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEditing(true)}><Pencil className="size-4" />Edit contact</Button>
          <Button onClick={() => setPw(true)}><KeyRound className="size-4" />Change password</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Account">
          <KV items={[
            ['Username', me.username], ['Email', me.email], ['WhatsApp number', me.phone],
            ['Last sign-in', me.lastLogin ? fmtDateTime(me.lastLogin) : 'Never'],
            ['Reminders sent to you', docsHeld ? `${docsHeld} documents` : 'None'],
          ]} />
        </Panel>
        <Panel title="What your role lets you do">
          <ul className="space-y-3">
            {permissionCatalog.map((g) => {
              const items = g.items.filter((p) => can(p.code))
              if (!items.length) return null
              return (
                <li key={g.group}>
                  <div className="text-sm font-bold text-ink-2">{g.group}</div>
                  <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    {items.map((p) => <li key={p.code} className="flex items-center gap-1.5 text-[15px]"><Check className="size-4 text-ok" aria-hidden />{p.label}</li>)}
                  </ul>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      <h2 className="judul mb-4 mt-10 text-[2rem]">My recent changes</h2>
      <Table rows={mine} rowKey={(a) => a.id} empty="You have not changed anything yet. Your changes in this demo appear here." cols={[
        { key: 't', header: 'When', cell: (a) => <span className="tnum whitespace-nowrap">{fmtDateTime(a.at)}</span> },
        { key: 'a', header: 'Action', cell: (a) => <Badge t={a.action === 'insert' ? 'ok' : a.action === 'delete' ? 'bad' : 'accent'}>{a.action === 'insert' ? 'Added' : a.action === 'delete' ? 'Removed' : 'Changed'}</Badge> },
        { key: 'r', header: 'Record', mobile: 'title', cell: (a) => <span className="font-medium">{a.rowLabel}</span> },
        { key: 'd', header: 'Fields', cell: (a) => <span className="text-ink-2">{a.diff.map((d) => d.field).join(', ')}</span> },
      ]} />

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit contact" footer={<><Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button><Button onClick={() => { updateUser(me.id, f); toast('Contact details saved. Reminders now go to these.'); setEditing(false) }}>Save</Button></>}>
        <div className="grid gap-4">
          <Field label="Email" hint="Email reminders and the weekly summary are sent here."><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="WhatsApp number" hint="WhatsApp reminders are sent here."><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        </div>
      </Modal>
      <PasswordModal open={pw} onClose={() => setPw(false)} />
    </div>
  )
}

function PasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const [f, setF] = useState({ current: '', next: '', again: '' })
  useEffect(() => { if (open) setF({ current: '', next: '', again: '' }) }, [open])
  const long = f.next.length >= 12
  const same = f.next && f.next === f.again
  return (
    <Modal open={open} onClose={onClose} title="Change password" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!f.current || !long || !same} onClick={() => { toast('Password changed. Your other sessions were signed out.'); onClose() }}>Change password</Button></>}>
      <div className="grid gap-4">
        <Field label="Current password"><Input type="password" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></Field>
        <Field label="New password"><Input type="password" autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></Field>
        <Field label="New password again"><Input type="password" autoComplete="new-password" value={f.again} onChange={(e) => setF({ ...f, again: e.target.value })} /></Field>
        <ul className="space-y-1 text-sm">
          <li className={long ? 'text-ok' : 'text-ink-2'}><ShieldCheck className="mr-1.5 inline size-4" />At least 12 characters</li>
          <li className={same ? 'text-ok' : 'text-ink-2'}><ShieldCheck className="mr-1.5 inline size-4" />Both new passwords match</li>
        </ul>
      </div>
    </Modal>
  )
}
