import dayjs from 'dayjs'
import type { MainDashboardRow, WeeklyRow } from './types'

/** Row shape from GET /success/performance/list */
export interface PerformanceListItem {
  id: string
  reference_no?: string
  company_name?: string
  completion_status?: string | null
  created_at?: string
  total_percentage?: number | null
  current_stage?: string
  contact?: string
  training_schedule_date?: string | null
}

/** Week 1–4 within selected month; days 22+ (including “week 5”) map to week 4. */
export function weekOfMonthInSelection(createdAt: string | undefined, month: dayjs.Dayjs): 1 | 2 | 3 | 4 {
  const d = createdAt ? dayjs(createdAt) : null
  if (!d || !d.isValid() || !d.isSame(month, 'month')) return 4
  const day = d.date()
  if (day <= 7) return 1
  if (day <= 14) return 2
  if (day <= 21) return 3
  return 4
}

function parseStageForColumns(stage: string | undefined, completion: string | undefined) {
  const cs = (completion || '').toLowerCase()
  const s = (stage || '').trim()
  if (cs === 'completed') {
    return { notUsing: '—', done: 'Completed' }
  }
  const pendingMatch = s.match(/Pending:\s*(.+)$/i)
  let notUsing = '—'
  if (pendingMatch) {
    notUsing = pendingMatch[1].trim() || '—'
  } else if (s.includes('Pending')) {
    notUsing = s
  }
  const fu = s.match(/Followup:\s*(\d+)\/(\d+)\s*completed/i)
  let done = '—'
  if (fu) {
    const a = Number(fu[1])
    const b = Number(fu[2])
    if (a >= b && b > 0) {
      done = 'All features'
    } else if (b > 0) {
      done = `${a}/${b} done`
    }
  }
  return { notUsing, done }
}

function formatDisplayDate(iso: string | undefined | null): string {
  if (!iso) return '—'
  const d = dayjs(iso)
  return d.isValid() ? d.format('DD/MM/YYYY') : '—'
}

/** Weekly boxes: Score / Status and Feature Name show max this many characters (+ "…" if trimmed). */
export const WEEKLY_SCORE_FEATURE_MAX_CHARS = 20

function truncateWeeklyCell(text: string, maxLen: number): { short: string; full?: string } {
  const t = (text || '').trim() || '—'
  if (t === '—' || t.length <= maxLen) return { short: t }
  return { short: `${t.slice(0, maxLen)}…`, full: t }
}

export function performanceItemToWeeklyRow(item: PerformanceListItem): WeeklyRow {
  const pct = item.total_percentage != null ? `${Number(item.total_percentage)}%` : '—'
  const stage = (item.current_stage || '').trim()
  const scoreStatusFull = [pct !== '—' ? pct : null, stage || null].filter(Boolean).join(' · ') || '—'
  const score = truncateWeeklyCell(scoreStatusFull, WEEKLY_SCORE_FEATURE_MAX_CHARS)

  const { notUsing } = parseStageForColumns(item.current_stage, item.completion_status || undefined)
  const featureNameFull = notUsing !== '—' ? notUsing : '—'
  const feat = truncateWeeklyCell(featureNameFull, WEEKLY_SCORE_FEATURE_MAX_CHARS)

  return {
    companyName: item.company_name || '—',
    scoreStatus: score.short,
    ...(score.full ? { scoreStatusFull: score.full } : {}),
    featureName: feat.short,
    ...(feat.full ? { featureNameFull: feat.full } : {}),
  }
}

export function performanceItemToMainRow(item: PerformanceListItem): MainDashboardRow {
  const { notUsing, done } = parseStageForColumns(item.current_stage, item.completion_status || undefined)
  const score =
    item.total_percentage != null && item.total_percentage !== undefined
      ? `${Number(item.total_percentage)}%`
      : '—'
  const status =
    (item.completion_status || '').toLowerCase() === 'completed' ? 'Completed' : 'In progress'
  return {
    referenceNo: item.reference_no || '—',
    companyName: item.company_name || '—',
    scorePercent: score,
    notUsingFeature: notUsing,
    doneFeatureName: done,
    trainingDate: formatDisplayDate(item.training_schedule_date),
    status,
    pocContactDate: formatDisplayDate(item.created_at),
  }
}

export function filterItemsByMonth(items: PerformanceListItem[], month: dayjs.Dayjs): PerformanceListItem[] {
  return items.filter((i) => {
    if (!i.created_at) return false
    const d = dayjs(i.created_at)
    return d.isValid() && d.isSame(month, 'month')
  })
}

export function sortByCreatedDesc(items: PerformanceListItem[]): PerformanceListItem[] {
  return [...items].sort((a, b) => {
    const ta = dayjs(a.created_at).valueOf()
    const tb = dayjs(b.created_at).valueOf()
    return tb - ta
  })
}
