import type { Dayjs } from 'dayjs'

/**
 * Week of month (1–5), first Monday–based — matches backend `main._week_of_month`.
 */
export function weekOfMonth(d: Dayjs): number {
  const first = d.startOf('month')
  const firstDayJs = first.day() // 0 Sun … 6 Sat
  const pyWeekday = (firstDayJs + 6) % 7 // Mon=0 … Sun=6 (Python weekday)
  const firstMonday = pyWeekday === 0 ? 1 : 1 + ((7 - pyWeekday) % 7)
  const day = d.date()
  const weekNum = Math.floor((day - firstMonday) / 7) + 1
  return Math.max(1, Math.min(5, weekNum))
}
