// Shared UI vocabulary. Kept in one place so an Indonesian (id.ts) file can be added later.
import type { CrewStatus, DocStatus, Employment, FollowUp, OpStatus, Readiness, RoleId } from '../data/types'

export const readinessLabel: Record<Readiness, string> = {
  green: 'Ready',
  yellow: 'Attention',
  red: 'Not ready',
}

export const docStatusLabel: Record<DocStatus, string> = {
  valid: 'Valid',
  soon: 'Expiring soon',
  expired: 'Expired',
}

export const opStatusLabel: Record<OpStatus, string> = {
  operating: 'Operating',
  standby: 'Standby',
  docking: 'Docking',
  repair: 'Repair',
}

export const crewStatusLabel: Record<CrewStatus, string> = {
  on_duty: 'On duty',
  leave: 'On leave',
  standby: 'Standby',
  inactive: 'Inactive',
}

export const employmentLabel: Record<Employment, string> = {
  permanent: 'Permanent',
  contract: 'Contract',
}

export const followUpLabel: Record<FollowUp, string> = {
  pending: 'Not started',
  in_progress: 'In progress',
  done: 'Done',
}

export const roleLabel: Record<RoleId, string> = {
  doc_admin: 'Document Admin',
  crewing: 'Crewing / HR',
  operation: 'Operation',
  it: 'IT',
  management: 'Management',
  asset: 'Asset',
}

export const vesselKindLabel = { TB: 'Tug Boat', BG: 'Barge' } as const
