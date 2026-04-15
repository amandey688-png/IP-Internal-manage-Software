export type ExportColumn<T> = {
  key: string
  label: string
  getValue: (row: T) => string | number | null | undefined
}

function csvEscape(value: string): string {
  const escaped = value.replace(/"/g, '""')
  if (/[",\n]/.test(escaped)) return `"${escaped}"`
  return escaped
}

export function exportRowsToCsv<T>(params: {
  filename: string
  columns: ExportColumn<T>[]
  rows: T[]
}) {
  const { filename, columns, rows } = params
  const header = columns.map((c) => csvEscape(c.label)).join(',')
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const raw = c.getValue(row)
          const asText = raw === null || raw === undefined ? '' : String(raw)
          return csvEscape(asText)
        })
        .join(','),
    )
    .join('\n')

  const csv = `${header}\n${body}`
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
