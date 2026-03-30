import type { MainDashboardRow } from './types'

interface DashboardTableProps {
  rows: MainDashboardRow[]
}

export function DashboardTable({ rows }: DashboardTableProps) {
  return (
    <div className="su-main-table-card">
      <div className="su-main-table-scroll">
        <table className="su-table su-table--main">
          <thead>
            <tr>
              <th>Reference number</th>
              <th>Company Name</th>
              <th>Score %</th>
              <th>Not Using Feature</th>
              <th>Done Feature Name</th>
              <th>Training Date</th>
              <th>Status</th>
              <th>POC Contact Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, idx) => (
                <tr key={`${row.referenceNo}-${row.companyName}-${idx}`}>
                  <td>{row.referenceNo}</td>
                  <td>{row.companyName}</td>
                  <td>{row.scorePercent}</td>
                  <td>{row.notUsingFeature}</td>
                  <td>{row.doneFeatureName}</td>
                  <td>{row.trainingDate}</td>
                  <td>{row.status}</td>
                  <td>{row.pocContactDate}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="su-empty-cell su-empty-cell--large">
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
