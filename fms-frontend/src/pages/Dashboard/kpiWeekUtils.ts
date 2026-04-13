import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

/**
 * KPI week-of-month (1–5), matching backend `_week_of_month_kpi_date`:
 * - calendar ranges for each week are Mon–Sun (see API); week-1 bucketing uses first Saturday + Mon-before-first-Monday rule
 */
export function weekOfMonth(d: Dayjs): number {
  const first = d.startOf('month')
  const firstDayJs = first.day() // 0 Sun … 6 Sat
  const pyWeekday = (firstDayJs + 6) % 7 // Mon=0 … Sun=6
  const firstSaturday = ((5 - pyWeekday) % 7) + 1 // day-of-month for first Saturday
  const day = d.date()
  if (day <= firstSaturday) return 1
  const firstMonday = ((7 - pyWeekday) % 7) + 1 // day-of-month for first Monday on/after 1st
  if (day < firstMonday) return 1
  const weekNum = Math.floor((day - firstMonday) / 7) + 2
  return Math.max(1, Math.min(5, weekNum))
}

export function maxWeekOfMonth(reference: Dayjs): number {
  const end = reference.endOf('month').date()
  let maxWeek = 1
  for (let day = 1; day <= end; day += 1) {
    const d = reference.date(day)
    maxWeek = Math.max(maxWeek, weekOfMonth(d))
  }
  return maxWeek
}

export function getDefaultPreviousWeekFilter() {
  // Consistent IST time context for default selection.
  const nowIst = new Date(Date.now() + (330 - new Date().getTimezoneOffset()) * 60_000)
  const prevWeek = new Date(nowIst.getTime() - 7 * 24 * 60 * 60 * 1000)
  const safe = dayjs(prevWeek)
  const monthIndex = safe.month()
  const year = String(safe.year())
  const week = weekOfMonth(safe)
  return { monthIndex, year, week }
}
