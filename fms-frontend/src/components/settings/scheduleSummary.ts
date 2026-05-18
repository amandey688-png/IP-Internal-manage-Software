import type { EmailJobSchedule } from '../../api/emailScheduler'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function buildCronExpression(row: Pick<
  EmailJobSchedule,
  'schedule_type' | 'interval_minutes' | 'hour' | 'minute' | 'day_of_month' | 'month' | 'cron_expression'
>): string {
  const st = row.schedule_type || 'daily'
  if (st === 'custom' && row.cron_expression) return row.cron_expression.trim()
  const m = row.minute ?? 0
  const h = row.hour ?? 8
  if (st === 'every_minutes') {
    const iv = row.interval_minutes ?? 15
    return `*/${iv} * * * *`
  }
  if (st === 'daily') return `${m} ${h} * * *`
  if (st === 'monthly') return `${m} ${h} ${row.day_of_month ?? 1} * *`
  if (st === 'yearly') return `${m} ${h} ${row.day_of_month ?? 1} ${row.month ?? 1} *`
  return `${m} ${h} * * *`
}

export function buildScheduleSummary(row: Pick<
  EmailJobSchedule,
  'schedule_type' | 'interval_minutes' | 'hour' | 'minute' | 'day_of_month' | 'month' | 'timezone' | 'cron_expression'
>): string {
  const st = row.schedule_type || 'daily'
  const tz = row.timezone || 'Asia/Kolkata'
  const t = `${row.hour ?? 0}:${String(row.minute ?? 0).padStart(2, '0')}`
  if (st === 'every_minutes') return `Every ${row.interval_minutes ?? 15} minutes (${tz})`
  if (st === 'daily') return `Every day at ${t} (${tz})`
  if (st === 'monthly') return `Day ${row.day_of_month ?? 1} of each month at ${t} (${tz})`
  if (st === 'yearly') {
    const mon = MONTHS[(row.month ?? 1) - 1] || String(row.month)
    return `Every year on ${row.day_of_month ?? 1} ${mon} at ${t} (${tz})`
  }
  if (st === 'custom') return `Custom: ${buildCronExpression(row)} (${tz})`
  return t
}
