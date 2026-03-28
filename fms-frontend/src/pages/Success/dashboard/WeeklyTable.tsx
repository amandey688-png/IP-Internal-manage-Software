import type { WeeklyRow } from './types'

interface WeeklyTableProps {
  rows: WeeklyRow[]
}

export function WeeklyTable({ rows }: WeeklyTableProps) {
  if (!rows.length) {
    return <div className="su-empty-cell">No data</div>
  }

  return (
    <div className="su-table-wrap">
      <table className="su-table su-table--compact">
        <thead>
          <tr>
            <th>Company Name</th>
            <th>Score / Status</th>
            <th>Feature Name</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.companyName}-${idx}`}>
              <td>{row.companyName}</td>
              <td>{row.scoreStatus}</td>
              <td>{row.featureName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
