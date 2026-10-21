import { useEffect, useState } from 'react'
import { Button, ConfirmDelete, Field, Input, Modal, Textarea, useToast } from '../../components/ui'
import type { Doc } from '../../data/types'
import { useStore } from '../../store'

// Correction of a typo in the record (PATCH /dokumen/{id}). A new certificate is a renewal, not a correction.
export function EditDocument({ doc, open, onClose }: { doc: Doc; open: boolean; onClose: () => void }) {
  const { s, updateDocument, ownerName } = useStore()
  const toast = useToast()
  const type = s.docTypes.find((t) => t.id === doc.typeId)!
  const init = () => ({ number: doc.number, issuedAt: doc.issuedAt, expiresAt: doc.expiresAt ?? '', issuer: doc.issuer, level: doc.level ?? '', notes: doc.notes ?? '' })
  const [f, setF] = useState(init)
  useEffect(() => { if (open) setF(init()) }, [open, doc]) // eslint-disable-line react-hooks/exhaustive-deps
  const valid = f.number.trim() && f.issuedAt && (!type.hasExpiry || f.expiresAt)
  const submit = () => {
    updateDocument(doc.id, {
      number: f.number.trim(), issuedAt: f.issuedAt, expiresAt: type.hasExpiry ? f.expiresAt : null, issuer: f.issuer.trim(),
      level: f.level.trim() || undefined, notes: f.notes.trim() || undefined,
    })
    toast('Document corrected. Status and reminders were recalculated from the new dates.')
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={`Correct ${type.name}`} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!valid} onClick={submit}>Save correction</Button></>}>
      <p className="mb-4 rounded bg-surface-2 p-3 text-sm text-ink">{ownerName(doc)} · version {doc.version}. Use this to fix a typing mistake. For a newly issued certificate, use Renew so the old version is archived.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Document number" className="sm:col-span-2"><Input value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} /></Field>
        <Field label="Issued on"><Input type="date" value={f.issuedAt} onChange={(e) => setF({ ...f, issuedAt: e.target.value })} /></Field>
        {type.hasExpiry && <Field label="Valid until"><Input type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></Field>}
        <Field label="Issued by" className="sm:col-span-2"><Input value={f.issuer} onChange={(e) => setF({ ...f, issuer: e.target.value })} /></Field>
        {type.code === 'COC' && <Field label="Level" hint="e.g. ANT-III or ATT-IV"><Input value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })} /></Field>}
        <Field label="Notes" className="sm:col-span-2"><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}

export function DeleteDocument({ doc, open, onClose, onDone }: { doc: Doc; open: boolean; onClose: () => void; onDone?: (restoredId: string | null) => void }) {
  const { s, deleteDocument, ownerName } = useStore()
  const toast = useToast()
  const type = s.docTypes.find((t) => t.id === doc.typeId)!
  return (
    <ConfirmDelete open={open} onClose={onClose} title={`Delete this ${type.name}?`} confirmLabel="Delete document" onConfirm={(reason) => {
      deleteDocument(doc.id, reason)
      toast(doc.previousId ? `Deleted. Version ${doc.version - 1} is current again.` : 'Deleted. The vessel or crew member now shows this document as missing.')
      onClose()
      onDone?.(doc.previousId)
    }}>
      <p>{ownerName(doc)} · No. {doc.number}. {doc.previousId ? `Version ${doc.version - 1} becomes the current document again.` : 'If this document is required, readiness turns red until a new one is recorded.'} Its pending reminders stop.</p>
    </ConfirmDelete>
  )
}
