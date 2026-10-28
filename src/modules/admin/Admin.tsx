import { Fragment, useEffect, useMemo, useState } from 'react'
import { Check, Lock, Plus } from 'lucide-react'
import { Badge, Button, cx, Field, Input, Modal, PageHeader, RowActions, SearchBox, Select, Table, Tabs, Toolbar, useToast, type Col } from '../../components/ui'
import { permissionCatalog } from '../../data/master'
import type { AuditEntry, Rank, RoleId, User } from '../../data/types'
import { roleLabel } from '../../i18n/en'
import { fmtDate, fmtDateTime } from '../../lib/dates'
import { useStore } from '../../store'

// Add or edit a user. A user can hold several roles; their permissions are the union.
function UserForm({ open, onClose, user }: { open: boolean; onClose: () => void; user?: User }) {
  const { s, addUser, updateUser } = useStore()
  const toast = useToast()
  const blank = { name: '', username: '', email: '', phone: '', roles: ['ops_asset'] as RoleId[] }
  const [f, setF] = useState(blank)
  useEffect(() => { if (open) setF(user ? { name: user.name, username: user.username, email: user.email, phone: user.phone, roles: [...user.roles] } : blank) }, [open, user]) // eslint-disable-line react-hooks/exhaustive-deps
  const taken = s.users.some((u) => u.id !== user?.id && u.username === f.username.trim().toLowerCase())
  const valid = f.name.trim() && f.username.trim() && !taken && f.roles.length > 0
  const toggle = (r: RoleId) => setF((x) => ({ ...x, roles: x.roles.includes(r) ? x.roles.filter((y) => y !== r) : [...x.roles, r] }))
  const submit = () => {
    const data = { name: f.name.trim(), username: f.username.trim().toLowerCase(), email: f.email.trim(), phone: f.phone.trim(), roles: f.roles }
    if (user) { updateUser(user.id, data); toast(`${data.name} saved.`) }
    else { addUser({ ...data, active: true }); toast(`${data.name} created with a temporary password.`) }
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={user ? `Edit ${user.name}` : 'New user'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!valid} onClick={submit}>{user ? 'Save changes' : 'Create user'}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" className="sm:col-span-2"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
        <Field label="Username" hint={taken ? 'This username is already used.' : undefined}><Input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></Field>
        <Field label="WhatsApp number" hint="Reminders are sent here."><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+62 8…" /></Field>
        <Field label="Email" className="sm:col-span-2"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-[15px] font-bold">Roles</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(roleLabel) as RoleId[]).map((r) => (
              <label key={r} className="flex items-center gap-2 text-[15px]"><input type="checkbox" className="size-4 accent-accent" checked={f.roles.includes(r)} onChange={() => toggle(r)} />{roleLabel[r]}</label>
            ))}
          </div>
          {f.roles.length === 0 && <p className="mt-2 text-sm text-bad">Choose at least one role.</p>}
        </fieldset>
      </div>
    </Modal>
  )
}

export function Users() {
  const { s, me, setUserActive, resetPassword } = useStore()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [temp, setTemp] = useState<{ name: string; pw: string } | null>(null)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const rows = s.users.filter((u) => !q || u.name.toLowerCase().includes(q.toLowerCase()) || u.username.includes(q.toLowerCase()))
  const docsHeld = (id: string) => s.docs.filter((d) => d.isCurrent && d.recipientId === id).length
  const cols: Col<User>[] = [
    { key: 'n', header: 'Name', mobile: 'title', cell: (u) => <div><div className="font-medium">{u.name}</div><div className="text-[13px] text-ink-2">{u.username} · {u.email}</div></div> },
    { key: 'r', header: 'Roles', cell: (u) => <div className="flex flex-wrap gap-1">{u.roles.map((r) => <Badge key={r}>{roleLabel[r]}</Badge>)}</div> },
    { key: 'l', header: 'Last sign-in', cell: (u) => <span className="tnum text-sm">{u.lastLogin ? fmtDateTime(u.lastLogin) : 'Never'}</span> },
    { key: 's', header: 'Status', cell: (u) => (u.active ? <Badge t="ok">Active</Badge> : <Badge t="bad">Inactive</Badge>) },
    { key: 'a', header: '', className: 'text-right', cell: (u) => (
      <div className="flex justify-end gap-2">
        <RowActions label={u.name} onEdit={() => setEditing(u)} />
        <Button size="sm" variant="secondary" onClick={() => { resetPassword(u.id); setTemp({ name: u.name, pw: `Oe-${Math.random().toString(36).slice(2, 8)}-${Math.floor(Math.random() * 90 + 10)}` }) }}>Reset password</Button>
        {u.id !== me.id && <Button size="sm" variant={u.active ? 'secondary' : 'primary'} onClick={() => { setUserActive(u.id, !u.active); toast(u.active ? `${u.name} deactivated and all sessions revoked.${docsHeld(u.id) ? ` Reassign their ${docsHeld(u.id)} documents in SINAR.` : ''}` : `${u.name} reactivated.`) }}>{u.active ? 'Deactivate' : 'Activate'}</Button>}
      </div>
    ) },
  ]
  return (
    <div>
      <PageHeader title="Users" module="SIGUNA" lead="Office staff only in Phase 1. A deactivated user cannot sign in and every session ends at once." actions={<Button onClick={() => setAdding(true)}><Plus className="size-4" />New user</Button>} />
      <Toolbar><SearchBox value={q} onChange={setQ} placeholder="Name or username" /></Toolbar>
      <Table rows={rows} cols={cols} rowKey={(u) => u.id} />
      <Modal open={!!temp} onClose={() => setTemp(null)} title="Temporary password" footer={<Button onClick={() => setTemp(null)}>Done</Button>}>
        <p className="text-[15px]">Give this to {temp?.name}. They must choose a new password at the next sign-in.</p>
        <div className="tnum mt-4 rounded-md bg-surface-2 p-4 text-center text-xl font-semibold tracking-wide">{temp?.pw}</div>
      </Modal>
      <UserForm open={adding} onClose={() => setAdding(false)} />
      {editing && <UserForm open onClose={() => setEditing(null)} user={editing} />}
    </div>
  )
}

export function Roles() {
  const { s, toggleRolePermission } = useStore()
  // One permission group at a time keeps the matrix short.
  const [group, setGroup] = useState(permissionCatalog[0].group)
  const shownGroups = permissionCatalog.filter((g) => g.group === group)
  return (
    <div>
      <PageHeader title="Roles and permissions" module="SIGUNA" lead="A user’s permissions are the union of their roles. Locked rows are sensitive crew data; the database enforces them with row-level security as well." />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {s.roles.map((r) => (
          <div key={r.id} className="rounded border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-2"><div className="font-semibold">{r.name}</div><span className="tnum text-[13px] text-ink-2">{(() => { const n = s.users.filter((u) => u.roles.includes(r.id)).length; return `${n} user${n === 1 ? '' : 's'}` })()}</span></div>
            <p className="mt-1 text-sm text-ink-2">{r.description}</p>          </div>
        ))}
      </div>
      <Tabs value={group} onChange={setGroup} tabs={permissionCatalog.map((g) => ({ value: g.group, label: g.group }))} />
      <div className="overflow-x-auto rounded border-2 border-ink bg-surface">
        <table className="w-full text-[15px]">
          <thead>
            <tr className="border-b-2 border-ink bg-surface-2 text-sm font-bold text-ink">
              <th className="px-4 py-2.5 text-left">Permission</th>
              {s.roles.map((r) => <th key={r.id} className="px-2 py-2.5">{r.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {shownGroups.map((g) => (
              <Fragment key={g.group}>
                {g.items.map((p) => (
                  <tr key={p.code} className="border-t border-line first:border-t-0">
                    <td className="px-4 py-1.5"><span className="inline-flex items-center gap-1.5">{p.label}{p.sensitive && <Lock className="size-3.5 text-ink-2" aria-label="sensitive" />}</span><div className="text-xs text-ink-3">{p.code}</div></td>
                    {s.roles.map((r) => {
                      const on = r.permissions.includes(p.code)
                      return (
                        <td key={r.id} className="px-2 py-1.5 text-center">
                          <button onClick={() => toggleRolePermission(r.id, p.code)} aria-pressed={on} aria-label={`${p.label} for ${r.name}`} className={cx('inline-grid size-7 place-items-center rounded transition-colors hover:ring-2 hover:ring-accent', on ? (p.sensitive ? 'bg-ink text-white' : 'bg-accent text-white') : 'bg-surface-2 text-transparent')}>
                            <Check className="size-4" />
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[13px] text-ink-2">Changes apply immediately in this demo: switch the demo user to see menus appear or disappear.</p>
    </div>
  )
}

const TABLE_LABEL: Record<string, string> = {
  tbl_t_dokumen: 'Documents', tbl_m_kapal: 'Vessels', tbl_m_pengguna: 'Users', tbl_m_jenis_dokumen: 'Document types', tbl_m_kru_pribadi: 'Crew personal data',
  tbl_t_penugasan_kru: 'Assignments', tbl_r_pasangan_tb_bg: 'TB/BG pairs', tbl_t_tindak_lanjut: 'Follow-up', tbl_r_peran_izin: 'Role permissions', tbl_s_konfigurasi: 'Configuration',
  tbl_s_eskalasi: 'Escalation', tbl_m_templat_pesan: 'Templates', tbl_r_komposisi_minimal: 'Minimum composition', tbl_r_dokumen_wajib_kapal: 'Required vessel documents',
  tbl_r_dokumen_wajib_jabatan: 'Required crew documents', tbl_m_peran: 'Roles',
}

export function Audit() {
  const { s, userName } = useStore()
  const [q, setQ] = useState('')
  const [table, setTable] = useState('all')
  const [user, setUser] = useState('all')
  const [open, setOpen] = useState<string | null>(null)
  const tables = [...new Set(s.audit.map((a) => a.table))]
  const rows = useMemo(() => s.audit.filter((a) => (table === 'all' || a.table === table) && (user === 'all' || a.userId === user) && (!q || a.rowLabel.toLowerCase().includes(q.toLowerCase()))), [s.audit, table, user, q])
  const cols: Col<AuditEntry>[] = [
    { key: 't', header: 'When', cell: (a) => <span className="tnum whitespace-nowrap">{fmtDateTime(a.at)}</span> },
    { key: 'u', header: 'Who', cell: (a) => userName(a.userId) },
    { key: 'a', header: 'Action', cell: (a) => <Badge t={a.action === 'insert' ? 'ok' : a.action === 'delete' ? 'bad' : 'accent'}>{a.action === 'insert' ? 'Added' : a.action === 'delete' ? 'Removed' : 'Changed'}</Badge> },
    { key: 'r', header: 'Record', mobile: 'title', cell: (a) => <div><div className="font-medium">{a.rowLabel}</div><div className="text-[13px] text-ink-2">{TABLE_LABEL[a.table] ?? a.table}</div></div> },
    { key: 'd', header: 'Change', cell: (a) => open === a.id ? (
      <dl className="space-y-1 text-[13px]">
        {a.diff.map((d) => <div key={d.field} className="flex flex-wrap gap-1.5"><dt className="text-ink-2">{d.field}</dt><dd><span className="rounded bg-bad-soft px-1 text-bad line-through">{d.before ?? '∅'}</span> → <span className="rounded bg-ok-soft px-1 text-ok">{d.after ?? '∅'}</span></dd></div>)}
      </dl>
    ) : <span className="text-[13px] text-accent">{a.diff.length} field{a.diff.length > 1 ? 's' : ''} · show</span> },
  ]
  return (
    <div>
      <PageHeader title="Audit log" module="SIGUNA" lead="Every insert, update and delete, with who, when and the before and after values. Ordinary users cannot change it. Your own actions in this demo appear at the top." />
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Record" />
        <Select value={table} onChange={(e) => setTable(e.target.value)} aria-label="Table"><option value="all">All tables</option>{tables.map((t) => <option key={t} value={t}>{TABLE_LABEL[t] ?? t}</option>)}</Select>
        <Select value={user} onChange={(e) => setUser(e.target.value)} aria-label="User"><option value="all">Anyone</option>{s.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
      </Toolbar>
      <Table rows={rows} cols={cols} rowKey={(a) => a.id} onRow={(a) => setOpen(open === a.id ? null : a.id)} limit={40} />
    </div>
  )
}

export function Config() {
  const { s, updateConfig } = useStore()
  const toast = useToast()
  const [draft, setDraft] = useState<Record<string, string>>({})
  return (
    <div>
      <PageHeader title="Configuration" module="SIGUNA" lead="System settings read by the reminder jobs, uploads and sign-in. Each change is audited." />
      <div className="grid gap-3 lg:grid-cols-2">
        {s.config.map((c) => {
          const v = draft[c.key] ?? c.value
          return (
            <div key={c.key} className="flex flex-col gap-3 rounded border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="font-medium">{c.label}</div>
                <div className="text-[13px] text-ink-2">{c.description}</div>
                <div className="mt-0.5 text-xs text-ink-3">{c.key}</div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Input value={v} onChange={(e) => setDraft({ ...draft, [c.key]: e.target.value })} className="!w-32" aria-label={c.label} />
                <Button size="md" variant="secondary" disabled={v === c.value} onClick={() => { updateConfig(c.key, v); toast(`${c.label} saved.`) }}>Save</Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type VesselType = ReturnType<typeof useStore>['s']['vesselTypes'][number]

export function MasterData() {
  const { s, saveVesselType, saveRank } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState<'types' | 'ranks'>('types')
  const [vt, setVt] = useState<{ t: VesselType; isNew: boolean } | null>(null)
  const [rk, setRk] = useState<{ r: Rank; isNew: boolean } | null>(null)
  const add = () => tab === 'types'
    ? setVt({ isNew: true, t: { id: `vt-x-${Date.now()}`, code: '', name: '', category: 'BG', active: true } })
    : setRk({ isNew: true, r: { code: '', name: '', localName: '', department: 'Deck', isOfficer: false } })
  const codeTaken = rk?.isNew && s.ranks.some((r) => r.code === rk.r.code.trim().toUpperCase())
  return (
    <div>
      <PageHeader title="Master data" module="SIGUNA" lead="Shared lists every module reads. Adding a vessel type or rank needs no code change." actions={<Button onClick={add}><Plus className="size-4" />{tab === 'types' ? 'Add vessel type' : 'Add rank'}</Button>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'types', label: 'Vessel types' }, { value: 'ranks', label: 'Ranks' }]} />
      {tab === 'types' ? (
        <Table rows={s.vesselTypes} rowKey={(t) => t.id} cols={[
          { key: 'c', header: 'Code', cell: (t) => <span className="tnum">{t.code}</span> },
          { key: 'n', header: 'Name', mobile: 'title', cell: (t) => <span className="font-medium">{t.name}</span> },
          { key: 'k', header: 'Category', cell: (t) => (t.category === 'TB' ? 'Tug (TB)' : 'Barge (BG)') },
          { key: 'v', header: 'Vessels', className: 'text-right', cell: (t) => <span className="tnum">{s.vessels.filter((v) => v.typeName === t.name).length}</span> },
          { key: 'a', header: 'Status', cell: (t) => (t.active ? <Badge t="ok">Active</Badge> : <Badge>Inactive</Badge>) },
          { key: 'x', header: 'Actions', mobile: 'hide', className: 'text-right', cell: (t) => <RowActions label={t.name} onEdit={() => setVt({ t: { ...t }, isNew: false })} /> },
        ]} />
      ) : (
        <Table rows={s.ranks} rowKey={(r) => r.code} cols={[
          { key: 'c', header: 'Code', cell: (r) => <span className="tnum">{r.code}</span> },
          { key: 'n', header: 'Rank', mobile: 'title', cell: (r) => <span className="font-medium">{r.name}</span> },
          { key: 'l', header: 'Indonesian title', cell: (r) => r.localName },
          { key: 'd', header: 'Department', cell: (r) => r.department },
          { key: 'o', header: 'Officer', cell: (r) => (r.isOfficer ? 'Yes' : 'No') },
          { key: 'u', header: 'Crew', className: 'text-right', cell: (r) => <span className="tnum">{s.crew.filter((c) => c.rank === r.code).length}</span> },
          { key: 'x', header: 'Actions', mobile: 'hide', className: 'text-right', cell: (r) => <RowActions label={r.name} onEdit={() => setRk({ r: { ...r }, isNew: false })} /> },
        ]} />
      )}
      <p className="mt-3 text-[13px] text-ink-2">Entries in use are deactivated, never deleted, so old records keep their meaning.</p>

      <Modal open={!!vt} onClose={() => setVt(null)} title={vt?.isNew ? 'Add vessel type' : `Edit ${vt?.t.name}`} footer={<><Button variant="secondary" onClick={() => setVt(null)}>Cancel</Button><Button disabled={!vt?.t.code.trim() || !vt?.t.name.trim()} onClick={() => { saveVesselType({ ...vt!.t, code: vt!.t.code.trim().toUpperCase(), name: vt!.t.name.trim() }); toast('Vessel type saved. It can be chosen for vessels right away.'); setVt(null) }}>Save</Button></>}>
        {vt && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code"><Input value={vt.t.code} onChange={(e) => setVt({ ...vt, t: { ...vt.t, code: e.target.value } })} placeholder="BG-TANK" /></Field>
            <Field label="Category" hint="Decides which documents and crew rules apply."><Select value={vt.t.category} onChange={(e) => setVt({ ...vt, t: { ...vt.t, category: e.target.value as 'TB' | 'BG' } })}><option value="TB">Tug (TB)</option><option value="BG">Barge (BG)</option></Select></Field>
            <Field label="Name" className="sm:col-span-2"><Input value={vt.t.name} onChange={(e) => setVt({ ...vt, t: { ...vt.t, name: e.target.value } })} placeholder="Tank Barge" /></Field>
            <label className="flex items-center gap-2 text-[15px] sm:col-span-2"><input type="checkbox" className="size-4 accent-accent" checked={vt.t.active} onChange={(e) => setVt({ ...vt, t: { ...vt.t, active: e.target.checked } })} />Active</label>
          </div>
        )}
      </Modal>

      <Modal open={!!rk} onClose={() => setRk(null)} title={rk?.isNew ? 'Add rank' : `Edit ${rk?.r.name}`} footer={<><Button variant="secondary" onClick={() => setRk(null)}>Cancel</Button><Button disabled={!rk?.r.code.trim() || !rk?.r.name.trim() || !!codeTaken} onClick={() => { saveRank({ ...rk!.r, code: rk!.r.code.trim().toUpperCase(), name: rk!.r.name.trim() }, rk!.isNew); toast('Rank saved. It can be used for crew and composition rules right away.'); setRk(null) }}>Save</Button></>}>
        {rk && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code" hint={codeTaken ? 'This code is already used.' : undefined}><Input value={rk.r.code} disabled={!rk.isNew} onChange={(e) => setRk({ ...rk, r: { ...rk.r, code: e.target.value } })} placeholder="3O" /></Field>
            <Field label="Department"><Select value={rk.r.department} onChange={(e) => setRk({ ...rk, r: { ...rk.r, department: e.target.value as Rank['department'] } })}>{['General', 'Deck', 'Engine', 'Catering'].map((d) => <option key={d}>{d}</option>)}</Select></Field>
            <Field label="Rank (English)"><Input value={rk.r.name} onChange={(e) => setRk({ ...rk, r: { ...rk.r, name: e.target.value } })} placeholder="Third Mate" /></Field>
            <Field label="Indonesian title"><Input value={rk.r.localName} onChange={(e) => setRk({ ...rk, r: { ...rk.r, localName: e.target.value } })} placeholder="Mualim III" /></Field>
            <label className="flex items-center gap-2 text-[15px] sm:col-span-2"><input type="checkbox" className="size-4 accent-accent" checked={rk.r.isOfficer} onChange={(e) => setRk({ ...rk, r: { ...rk.r, isOfficer: e.target.checked } })} />Officer (needs a Certificate of Competency)</label>
          </div>
        )}
      </Modal>
      <p className="mt-3 text-[13px] text-ink-2">Ranks follow PM 70/2013 and PM 26/2022. Last reviewed {fmtDate('2026-10-14')}.</p>
    </div>
  )
}
