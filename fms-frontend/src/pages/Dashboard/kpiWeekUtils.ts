import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

/** Same IST offset as legacy `getDefaultPreviousWeekFilter` — KPIs are reviewed on India calendar. */
export function dayjsFromIstNow(): Dayjs {
  const nowIst = new Date(Date.now() + (330 - new Date().getTimezoneOffset()) * 60_000)
  return dayjs(nowIst)
}

/**
 * KPI week index (1-based) aligned with backend `week_of_month_for_date`:
 * anchor = Monday of the ISO week containing the 1st of the month → full Mon–Sun weeks (may overlap adjacent months).
 */
export function weekOfMonth(d: Dayjs): number {
  const ref = d.startOf('day')
  const first = ref.startOf('month')
  const jsDow = first.day()
  const pyWd = (jsDow + 6) % 7
  const anchor = first.subtract(pyWd, 'day')
  const diffDays = ref.diff(anchor.startOf('day'), 'day')
  return Math.max(1, Math.floor(diffDays / 7) + 1)
}

export function maxWeekOfMonth(reference: Dayjs): number {
  const end = reference.daysInMonth()
  let maxWeek = 1
  for (let day = 1; day <= end; day += 1) {
    const d = reference.date(day)
    maxWeek = Math.max(maxWeek, weekOfMonth(d))
  }
  return maxWeek
}

/** Monday-start / Sunday-end KPI week bounds for filters (aligned with backend). */
export function getKpiCalendarWeekBounds(
  year: number,
  monthIndexZero: number,
  weekIndexOne: number,
): { start: Dayjs; end: Dayjs } | null {
  if (
    !Number.isFinite(year) ||
    monthIndexZero < 0 ||
    monthIndexZero > 11 ||
    weekIndexOne < 1
  )
    return null
  const ref = dayjs().year(year).month(monthIndexZero).date(1)
  const maxW = maxWeekOfMonth(ref)
  if (weekIndexOne > maxW) return null
  const first = ref.startOf('month').startOf('day')
  const pyWd = (first.day() + 6) % 7
  const anchor = first.subtract(pyWd, 'day')
  const start = anchor.add((weekIndexOne - 1) * 7, 'day')
  const end = start.add(6, 'day').endOf('day')
  return { start: start.startOf('day'), end }
}

/** True when selected month filter’s KPI week overlaps a different calendar month (merged week UX). */
export function isKpiMergedWeekAcrossMonths(
  year: number,
  monthIndexZero: number,
  weekIndexOne: number,
): boolean {
  const b = getKpiCalendarWeekBounds(year, monthIndexZero, weekIndexOne)
  if (!b) return false
  const ym = refMonthYear(year, monthIndexZero)
  return monthYearOf(b.start) !== ym || monthYearOf(b.end) !== ym
}

function refMonthYear(year: number, monthIndexZero: number): string {
  return `${year}-${monthIndexZero}`
}

function monthYearOf(d: Dayjs): string {
  return `${d.year()}-${d.month()}`
}

export function getDefaultPreviousWeekFilter() {
  const safe = dayjsFromIstNow().subtract(7, 'day')
  const monthIndex = safe.month()
  const year = String(safe.year())
  const week = weekOfMonth(safe)
  return { monthIndex, year, week }
}
