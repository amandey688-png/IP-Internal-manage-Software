import { Select, Typography } from 'antd'

/** Dropdown-style pagination (matches filter Selects on Performance pages). */
export function PerformanceTablePaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (p: number) => void
  onPageSizeChange: (size: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const pageOptions = Array.from({ length: totalPages }, (_, i) => ({
    value: i + 1,
    label: `Page ${i + 1} of ${totalPages}`,
  }))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div
      style={{
        marginTop: 16,
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        Page
      </Typography.Text>
      <Select
        value={page}
        onChange={onPageChange}
        options={pageOptions}
        disabled={total === 0}
        style={{ minWidth: 168 }}
        aria-label="Select page"
        showSearch={totalPages > 8}
        optionFilterProp="label"
      />
      <Select
        value={pageSize}
        onChange={(v) => {
          onPageSizeChange(v)
          onPageChange(1)
        }}
        options={[
          { value: 10, label: '10 / page' },
          { value: 20, label: '20 / page' },
          { value: 50, label: '50 / page' },
          { value: 100, label: '100 / page' },
        ]}
        style={{ width: 120 }}
        aria-label="Rows per page"
      />
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        {total === 0 ? 'No rows' : `${start}–${end} of ${total}`}
      </Typography.Text>
    </div>
  )
}
