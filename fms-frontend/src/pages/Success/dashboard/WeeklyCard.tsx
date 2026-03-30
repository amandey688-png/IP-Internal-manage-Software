import { WeeklyTable } from './WeeklyTable'
import type { WeeklyRow } from './types'

interface WeeklyCardProps {
  title: string
  rows: WeeklyRow[]
}

export function WeeklyCard({ title, rows }: WeeklyCardProps) {
  return (
    <section className="su-week-card">
      <header className="su-week-card__header">{title}</header>
      <div className="su-week-card__body">
        <WeeklyTable rows={rows} />
      </div>
    </section>
  )
}
