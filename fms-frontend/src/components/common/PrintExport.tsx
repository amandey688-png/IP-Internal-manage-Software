import { Button, Space } from 'antd'
import { PrinterOutlined, DownloadOutlined } from '@ant-design/icons'
import { message } from 'antd'

export interface ExportColumn {
  key: string
  label: string
}

export interface PrintExportProps {
  /** Page title used in print and as default export filename */
  pageTitle: string
  /** If provided, Export button is shown and exports this data as CSV */
  exportData?: {
    columns: ExportColumn[]
    rows: Record<string, unknown>[]
  }
  /** Optional custom filename (without extension) for CSV export */
  exportFilename?: string
}

function escapeCsvCell(value: unknown): string {
  if (value == null) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadCsv(columns: ExportColumn[], rows: Record<string, unknown>[], filename: string) {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(',')
  const lines = rows.map((row) =>
    columns.map((col) => escapeCsvCell(row[col.key])).join(',')
  )
  const csv = [header, ...lines].join('\r\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function PrintExport({ pageTitle, exportData, exportFilename }: PrintExportProps) {
  const handlePrint = () => {
    const prevTitle = document.title
    document.title = `${pageTitle} - ${new Date().toLocaleDateString()}`
    window.print()
    document.title = prevTitle
  }

  const handleExport = () => {
    if (!exportData || !exportData.columns.length || !exportData.rows.length) {
      message.warning('No data to export')
      return
    }
    const name = exportFilename || pageTitle.replace(/\s+/g, '_')
    downloadCsv(exportData.columns, exportData.rows, name)
    message.success('Export downloaded')
  }

  const canExport = exportData && exportData.columns.length > 0 && exportData.rows.length > 0

  return (
    <Space className="no-print" size="middle" style={{ marginBottom: 16 }}>
      <Button type="default" icon={<PrinterOutlined />} onClick={handlePrint}>
        Print
      </Button>
      {canExport && (
        <Button type="default" icon={<DownloadOutlined />} onClick={handleExport}>
          Export
        </Button>
      )}
    </Space>
  )
}
