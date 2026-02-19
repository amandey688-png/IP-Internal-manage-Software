import { UserRole } from '../types/auth'
import { ROLES } from './constants'

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/** Format for table: DD MMM YYYY, HH:mm */
export const formatDateTable = (date: string | Date | null | undefined): string => {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/** Format actual_time_seconds to human readable (e.g. 2h 30m) */
export const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds == null || seconds < 0) return '-'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${seconds}s`
}

/** Format delay duration: seconds / minutes / hours / days (e.g. "18 min", "2 hr 10 min", "1 day 3 hr") */
export const formatDelay = (seconds: number | null | undefined): string => {
  if (seconds == null || seconds < 0) return '-'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const parts: string[] = []
  if (d > 0) parts.push(`${d} day${d > 1 ? 's' : ''}`)
  if (h > 0) parts.push(`${h} hr`)
  if (m > 0) parts.push(`${m} min`)
  if (s > 0 && parts.length === 0) parts.push(`${s} sec`)
  return parts.join(' ') || '0 sec'
}

/** Feature Stage 1 delay: starts after 1 day from planned. Returns seconds over 1d or 0. */
export const featureStage1DelaySeconds = (
  plannedIso: string | null | undefined,
  status: string | null | undefined,
  actualIso?: string | null
): number => {
  const SLA_1D = 24 * 3600
  if (!plannedIso || status === 'completed') return 0
  const planned = new Date(plannedIso).getTime()
  const end = actualIso ? new Date(actualIso).getTime() : Date.now()
  return Math.max(0, Math.floor((end - planned) / 1000) - SLA_1D)
}

/** Feature Stage 2 delay: starts after 2 hours from planned. Returns seconds over 2h or 0. */
export const featureStage2DelaySeconds = (
  plannedIso: string | null | undefined,
  status: string | null | undefined,
  actualIso?: string | null
): number => {
  const SLA_2H = 2 * 3600
  if (!plannedIso || status === 'completed') return 0
  const planned = new Date(plannedIso).getTime()
  const end = actualIso ? new Date(actualIso).getTime() : Date.now()
  return Math.max(0, Math.floor((end - planned) / 1000) - SLA_2H)
}

/** Staging delay: start after 2 hours from planned. Returns seconds over 2h or 0. */
export const stagingDelaySeconds = (
  plannedIso: string | null | undefined,
  status: string | null | undefined,
  actualIso?: string | null
): number => {
  const SLA_2H = 2 * 3600
  if (!plannedIso || status === 'completed') return 0
  const planned = new Date(plannedIso).getTime()
  const end = actualIso ? new Date(actualIso).getTime() : Date.now()
  return Math.max(0, Math.floor((end - planned) / 1000) - SLA_2H)
}

/** Current stage summary for Staging workflow (Stage 1–3). */
export const getStagingCurrentStage = (t: {
  staging_planned?: string | null
  staging_review_actual?: string | null
  staging_review_status?: string | null
  live_planned?: string | null
  live_actual?: string | null
  live_status?: string | null
  live_review_planned?: string | null
  live_review_actual?: string | null
  live_review_status?: string | null
}): { stageLabel: string; planned: string; actual: string; status: string; timeDelay: string } => {
  const fmt = (d: string | null | undefined) => (d ? formatDateTable(d) : '-')

  if (t.staging_review_status !== 'completed') {
    const delaySec = stagingDelaySeconds(t.staging_planned, t.staging_review_status, t.staging_review_actual)
    return {
      stageLabel: 'Stage 1: Staging Planned',
      planned: fmt(t.staging_planned),
      actual: fmt(t.staging_review_actual),
      status: t.staging_review_status || 'pending',
      timeDelay: delaySec > 0 ? formatDelay(delaySec) : '-',
    }
  }
  if (t.live_status !== 'completed') {
    const delaySec = stagingDelaySeconds(t.live_planned, t.live_status, t.live_actual)
    return {
      stageLabel: 'Stage 2: Live Planned',
      planned: fmt(t.live_planned || t.staging_review_actual),
      actual: fmt(t.live_actual),
      status: t.live_status || 'pending',
      timeDelay: delaySec > 0 ? formatDelay(delaySec) : '-',
    }
  }
  const delaySec = stagingDelaySeconds(t.live_review_planned, t.live_review_status, t.live_review_actual)
  return {
    stageLabel: 'Stage 3: Review Planned',
    planned: fmt(t.live_review_planned || t.live_actual),
    actual: fmt(t.live_review_actual),
    status: t.live_review_status || 'pending',
    timeDelay: delaySec > 0 ? formatDelay(delaySec) : '-',
  }
}

/** Current stage for Feature tickets: Approval + Stage 1 (Planned/Status/Actual) + Stage 2 (Completed/Pending). */
export const getFeatureCurrentStage = (t: {
  status_2?: string
  approval_status?: 'approved' | 'unapproved' | null
  live_status?: string | null
  staging_planned?: string | null
}): { stageLabel: string; status?: string } => {
  if (t.approval_status == null || t.approval_status === undefined) return { stageLabel: 'Approval Pending', status: '-' }
  if (t.approval_status === 'unapproved') return { stageLabel: 'Approval (unapproved)', status: 'unapproved' }
  if (t.status_2 !== 'completed') {
    return { stageLabel: 'Stage 1', status: t.status_2 || 'pending' }
  }
  if (t.live_status !== 'completed') return { stageLabel: 'Stage 2', status: t.live_status || 'pending' }
  return { stageLabel: 'Completed', status: 'completed' }
}

/** Current SLA stage summary for Chores & Bugs table */
export const getChoresBugsCurrentStage = (t: {
  created_at?: string
  status_1?: string
  actual_1?: string
  planned_2?: string
  status_2?: string
  actual_2?: string
  planned_3?: string
  status_3?: string
  actual_3?: string
  planned_4?: string
  status_4?: string
  actual_4?: string
}): { stageNum: number; stageLabel: string; planned: string; actual: string; status: string; timeDelay: string } => {
  const planned1 = t.created_at
  const fmt = (d: string | null | undefined) => (d ? formatDateTable(d) : '-')
  const SLA_2H = 2 * 3600
  const SLA_1D = 24 * 3600
  const now = Date.now()

  if (!t.status_1) {
    const p = planned1 ? new Date(planned1).getTime() : 0
    const delaySec = p ? Math.max(0, Math.floor((now - p) / 1000) - SLA_2H) : 0
    return {
      stageNum: 1,
      stageLabel: 'Stage 1',
      planned: fmt(planned1),
      actual: fmt(t.actual_1),
      status: '-',
      timeDelay: delaySec > 0 ? formatDelay(delaySec) : '-',
    }
  }
  if (t.status_1 === 'yes') {
    const a4 = t.actual_4 ? new Date(t.actual_4).getTime() : 0
    const p4 = t.planned_4 ? new Date(t.planned_4).getTime() : t.actual_1 ? new Date(t.actual_1).getTime() : 0
    const delaySec = a4 && p4 ? Math.max(0, Math.floor((a4 - p4) / 1000)) : 0
    return {
      stageNum: 4,
      stageLabel: 'Stage 4',
      planned: fmt(t.actual_1 || t.planned_4),
      actual: fmt(t.actual_4),
      status: t.status_4 || '-',
      timeDelay: delaySec > 0 ? formatDelay(delaySec) : '-',
    }
  }
  if (t.status_1 === 'no' && !t.status_2) {
    const p2 = t.actual_1 ? new Date(t.actual_1).getTime() : 0
    const delaySec = p2 ? Math.max(0, Math.floor((now - p2) / 1000) - SLA_1D) : 0
    return {
      stageNum: 2,
      stageLabel: 'Stage 2',
      planned: fmt(t.actual_1 || t.planned_2),
      actual: fmt(t.actual_2),
      status: '-',
      timeDelay: delaySec > 0 ? formatDelay(delaySec) : '-',
    }
  }
  if (t.status_2 === 'completed' && !t.status_3) {
    const p3 = t.actual_2 ? new Date(t.actual_2).getTime() : 0
    const delaySec = p3 ? Math.max(0, Math.floor((now - p3) / 1000) - SLA_2H) : 0
    return {
      stageNum: 3,
      stageLabel: 'Stage 3',
      planned: fmt(t.actual_2 || t.planned_3),
      actual: fmt(t.actual_3),
      status: '-',
      timeDelay: delaySec > 0 ? formatDelay(delaySec) : '-',
    }
  }
  if (t.status_2 === 'completed' || t.status_1 === 'yes') {
    const p4 = t.planned_4 || (t.status_3 === 'completed' ? t.actual_3 : t.actual_1)
    const a4 = t.actual_4 ? new Date(t.actual_4).getTime() : 0
    const p4t = p4 ? new Date(p4).getTime() : 0
    const delaySec = a4 && p4t ? Math.max(0, Math.floor((a4 - p4t) / 1000)) : p4t ? Math.max(0, Math.floor((now - p4t) / 1000) - SLA_2H) : 0
    return {
      stageNum: 4,
      stageLabel: 'Stage 4',
      planned: fmt(p4),
      actual: fmt(t.actual_4),
      status: t.status_4 || '-',
      timeDelay: delaySec > 0 ? formatDelay(delaySec) : '-',
    }
  }
  const p2 = t.actual_1 || t.planned_2
  const a2 = t.actual_2 ? new Date(t.actual_2).getTime() : 0
  const p2t = p2 ? new Date(p2).getTime() : 0
  const delaySec = a2 && p2t ? Math.max(0, Math.floor((a2 - p2t) / 1000)) : p2t ? Math.max(0, Math.floor((now - p2t) / 1000) - SLA_1D) : 0
  return {
    stageNum: 2,
    stageLabel: 'Stage 2',
    planned: fmt(p2),
    actual: fmt(t.actual_2),
    status: t.status_2 || '-',
    timeDelay: delaySec > 0 ? formatDelay(delaySec) : '-',
  }
}

/** Overall delay in seconds from query_arrival_at or created_at to now (for display when status-based delay is missing). */
export const getOverallDelaySeconds = (t: {
  query_arrival_at?: string | null
  created_at?: string
}): number => {
  const from = t.query_arrival_at || t.created_at
  if (!from) return 0
  const start = new Date(from).getTime()
  return Math.max(0, Math.floor((Date.now() - start) / 1000))
}

/** Time delay string for ticket: use status-based delay when available. Feature: Stage 1 after 1 day, Stage 2 after 2 hrs. */
export const getTicketTimeDelayDisplay = (t: Parameters<typeof getChoresBugsCurrentStage>[0] & {
  type?: string
  query_arrival_at?: string | null
  created_at?: string
  status_2?: string
  actual_1?: string | null
  live_status?: string | null
  live_planned?: string | null
  live_actual?: string | null
}): string => {
  if (t.type === 'chore' || t.type === 'bug') {
    const stage = getChoresBugsCurrentStage(t)
    if (stage.timeDelay !== '-') return stage.timeDelay
  }
  if (t.type === 'feature') {
    if (t.status_2 !== 'completed') {
      const sec = featureStage1DelaySeconds(t.query_arrival_at || t.created_at, t.status_2, t.actual_1)
      if (sec > 0) return formatDelay(sec)
    } else {
      const sec = featureStage2DelaySeconds(t.actual_1 || t.live_planned, t.live_status, t.live_actual)
      if (sec > 0) return formatDelay(sec)
    }
  }
  const sec = getOverallDelaySeconds(t)
  return sec > 0 ? formatDelay(sec) : '-'
}

/** SLA 30 min: On-time or Delay with format (e.g. Delay: 12 min) */
export const formatReplySla = (
  queryArrival: string | null | undefined,
  queryResponse: string | null | undefined
): { status: 'on-time' | 'delay'; text: string } => {
  if (!queryArrival || !queryResponse) return { status: 'on-time', text: '-' }
  const a = new Date(queryArrival).getTime()
  const r = new Date(queryResponse).getTime()
  const diffMs = r - a
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const SLA_MIN = 30
  if (diffMin <= SLA_MIN) return { status: 'on-time', text: 'On-time' }
  const h = Math.floor(diffMin / 60)
  const m = diffMin % 60
  const d = Math.floor(h / 24)
  const hr = h % 24
  let delayText = 'Delay: '
  if (d > 0) delayText += `${d} day${d > 1 ? 's' : ''} ${hr} hr ${m} min`
  else if (h > 0) delayText += `${h} hr ${m} min`
  else delayText += `${m} min`
  return { status: 'delay', text: delayText }
}

export const formatDateShort = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy: Record<string, number> = {
    [ROLES.USER]: 1,
    [ROLES.APPROVER]: 2,
    [ROLES.ADMIN]: 3,
    [ROLES.MASTER_ADMIN]: 4,
  }
  return (roleHierarchy[userRole] ?? 0) >= (roleHierarchy[requiredRole] ?? 0)
}

/** Can access Approval Status section and approve/reject (Admin, Master Admin, Approver) */
export const canAccessApproval = (userRole: UserRole): boolean =>
  userRole === ROLES.ADMIN || userRole === ROLES.MASTER_ADMIN || userRole === ROLES.APPROVER

/** Can access Settings and configure approval emails (Admin, Master Admin) */
export const canAccessSettings = (userRole: UserRole): boolean =>
  userRole === ROLES.ADMIN || userRole === ROLES.MASTER_ADMIN

/** Can access Users list (Admin = view only, Master Admin = view + edit) */
export const canAccessUsers = (userRole: UserRole): boolean =>
  userRole === ROLES.ADMIN || userRole === ROLES.MASTER_ADMIN

/** Section key to route/sidebar mapping */
export const SECTION_KEY_TO_ROUTE: Record<string, string> = {
  dashboard: '/dashboard',
  support_dashboard: '/support/dashboard',
  all_tickets: '/tickets',
  chores_bugs: '/tickets?section=chores-bugs',
  staging: '/staging',
  feature: '/tickets?type=feature',
  approval_status: '/tickets?type=feature&view=approval',
  completed_chores_bugs: '/tickets?section=completed-chores-bugs',
  completed_feature: '/tickets?section=completed-feature',
  solution: '/tickets?section=solutions',
  task: '/task/checklist',
  settings: '/settings',
  users: '/users',
}

/** Check if user can view a section. Master Admin/Admin/Approver always see all. User role uses section_permissions. */
export const canViewSection = (
  sectionKey: string,
  userRole: UserRole,
  sectionPermissions?: { section_key: string; can_view: boolean; can_edit: boolean }[]
): boolean => {
  if (userRole === ROLES.MASTER_ADMIN || userRole === ROLES.ADMIN || userRole === ROLES.APPROVER) return true
  if (!sectionPermissions || sectionPermissions.length === 0) return true
  const p = sectionPermissions.find((s) => s.section_key === sectionKey)
  return p ? p.can_view : true
}

/** Check if user can edit in a section. Master Admin/Admin/Approver always can edit. User role uses section_permissions. */
export const canEditSection = (
  sectionKey: string,
  userRole: UserRole,
  sectionPermissions?: { section_key: string; can_view: boolean; can_edit: boolean }[]
): boolean => {
  if (userRole === ROLES.MASTER_ADMIN || userRole === ROLES.ADMIN || userRole === ROLES.APPROVER) return true
  if (!sectionPermissions || sectionPermissions.length === 0) return true
  const p = sectionPermissions.find((s) => s.section_key === sectionKey)
  return p ? p.can_edit : false
}

export const canAccessRoute = (userRole: UserRole, route: string): boolean => {
  if (route === '/users') return canAccessUsers(userRole)
  if (route === '/settings') return canAccessSettings(userRole)
  if (route.startsWith('/tickets') && route.includes('view=approval')) return canAccessApproval(userRole)
  return true
}

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/** Standard export column definitions for ticket Print & Export (all ticket-based pages) */
export const TICKET_EXPORT_COLUMNS = [
  { key: 'reference_no', label: 'Reference No' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'attachment', label: 'Attachment' },
  { key: 'type_of_request', label: 'Type of Request' },
  { key: 'page', label: 'Page' },
  { key: 'company_name', label: 'Company Name' },
  { key: 'user_name', label: 'User Name' },
  { key: 'division_name', label: 'Division' },
  { key: 'communicated_through', label: 'Communicated Through' },
  { key: 'stage', label: 'Stage' },
  { key: 'stage_status', label: 'Stage Status' },
] as const

export type StageInfo = { stageLabel: string; status: string }

const TYPE_LABELS: Record<string, string> = {
  chore: 'Chores',
  bug: 'Bug',
  feature: 'Feature',
}

const COMM_LABELS: Record<string, string> = {
  phone: 'Phone',
  mail: 'Mail',
  whatsapp: 'WhatsApp',
}

function getTypeLabel(type?: string): string {
  if (!type) return '-'
  return TYPE_LABELS[type] ?? type
}

function getCommLabel(communicated_through?: string): string {
  if (!communicated_through) return '-'
  return COMM_LABELS[communicated_through] ?? communicated_through
}

/** Minimal shape for ticket export row input; Ticket satisfies this. */
export type TicketExportInput = {
  reference_no?: string
  title?: string
  description?: string
  attachment_url?: string
  type?: string
  page_name?: string
  company_name?: string
  user_name?: string
  division_name?: string
  communicated_through?: string
  [k: string]: unknown
}

/**
 * Build one export row for a ticket using standard fields.
 * getStage(t) should return current stage label and status (e.g. from getChoresBugsCurrentStage or getStagingCurrentStage).
 */
export function buildTicketExportRow<T extends TicketExportInput>(
  t: T,
  getStage?: (t: T) => StageInfo
): Record<string, unknown> {
  const typeLabel = getTypeLabel(t.type)
  const commLabel = getCommLabel(t.communicated_through)
  const stageInfo = getStage ? getStage(t) : { stageLabel: '-', status: '-' }
  return {
    reference_no: t.reference_no ?? '-',
    title: t.title ?? '-',
    description: t.description ?? '-',
    attachment: t.attachment_url && String(t.attachment_url).trim() ? String(t.attachment_url).trim() : '-',
    type_of_request: typeLabel,
    page: t.page_name ?? '-',
    company_name: t.company_name ?? '-',
    user_name: t.user_name ?? '-',
    division_name: t.division_name ?? '-',
    communicated_through: commLabel,
    stage: stageInfo.stageLabel,
    stage_status: stageInfo.status,
  }
}
