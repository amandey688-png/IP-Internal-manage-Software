import { useState } from 'react'
import { Modal } from 'antd'
import type { WeeklyRow } from './types'

interface WeeklyTableProps {
  rows: WeeklyRow[]
}

interface PreviewState {
  title: string
  content: string
}

export function WeeklyTable({ rows }: WeeklyTableProps) {
  const [preview, setPreview] = useState<PreviewState | null>(null)

  const openFull = (title: string, content: string) => {
    setPreview({ title, content: (content || '').trim() || '—' })
  }

  return (
    <>
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
            {rows.length ? (
              rows.map((row, idx) => (
                <tr key={`${row.companyName}-${idx}`}>
                  <td
                    className="su-table__company-cell su-table__click-cell"
                    role="button"
                    tabIndex={0}
                    onClick={() => openFull('Company Name', row.companyName)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openFull('Company Name', row.companyName)
                      }
                    }}
                  >
                    {row.companyName}
                  </td>
                  <td
                    className="su-table__short-cell su-table__click-cell"
                    role="button"
                    tabIndex={0}
                    title="Click for full text"
                    onClick={() =>
                      openFull('Score / Status', row.scoreStatusFull || row.scoreStatus)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openFull('Score / Status', row.scoreStatusFull || row.scoreStatus)
                      }
                    }}
                  >
                    {row.scoreStatus}
                  </td>
                  <td
                    className="su-table__short-cell su-table__click-cell"
                    role="button"
                    tabIndex={0}
                    title="Click for full text"
                    onClick={() =>
                      openFull('Feature Name', row.featureNameFull || row.featureName)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openFull('Feature Name', row.featureNameFull || row.featureName)
                      }
                    }}
                  >
                    {row.featureName}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="su-empty-cell">
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={preview?.title}
        open={!!preview}
        onCancel={() => setPreview(null)}
        footer={null}
        width={560}
        destroyOnClose
        centered
      >
        <div className="su-cell-preview-body">{preview?.content}</div>
      </Modal>
    </>
  )
}
