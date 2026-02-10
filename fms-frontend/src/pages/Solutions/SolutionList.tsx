import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Table, Card, Typography, Tag } from 'antd'
import { solutionsApi } from '../../api/solutions'
import { PrintExport } from '../../components/common/PrintExport'
import { formatDate } from '../../utils/helpers'
import type { Solution } from '../../api/solutions'

const { Title } = Typography

export const SolutionList = () => {
  const { ticketId } = useParams<{ ticketId: string }>()
  const [loading, setLoading] = useState(true)
  const [solutions, setSolutions] = useState<Solution[]>([])

  useEffect(() => {
    if (ticketId) {
      fetchSolutions()
    }
  }, [ticketId])

  const fetchSolutions = async () => {
    if (!ticketId) return
    setLoading(true)
    try {
      const response = await solutionsApi.list(ticketId)
      if (Array.isArray(response)) {
        setSolutions(response)
      }
    } catch (error) {
      console.error('Failed to fetch solutions:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Solution',
      dataIndex: 'solution_number',
      key: 'solution_number',
      render: (num: number) => `Solution ${num}`,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Status',
      dataIndex: 'is_selected',
      key: 'is_selected',
      render: (selected: boolean) => (
        <Tag color={selected ? 'green' : 'default'}>
          {selected ? 'Selected' : 'Not Selected'}
        </Tag>
      ),
    },
    {
      title: 'Quality Score',
      dataIndex: 'quality_score',
      key: 'quality_score',
      render: (score?: number) => score ? `${score}/10` : '-',
    },
    {
      title: 'Proposed',
      dataIndex: 'proposed_at',
      key: 'proposed_at',
      render: (date: string) => formatDate(date),
    },
  ]

  const exportColumns = [
    { key: 'solution_number', label: 'Solution' },
    { key: 'title', label: 'Title' },
    { key: 'is_selected', label: 'Selected' },
    { key: 'quality_score', label: 'Quality Score' },
    { key: 'proposed_at', label: 'Proposed' },
  ]
  const exportRows = solutions.map((s) => ({
    solution_number: `Solution ${s.solution_number}`,
    title: s.title ?? '-',
    is_selected: s.is_selected ? 'Yes' : 'No',
    quality_score: s.quality_score != null ? `${s.quality_score}/10` : '-',
    proposed_at: formatDate(s.proposed_at ?? ''),
  }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Solutions</Title>
        <PrintExport pageTitle="Solutions" exportData={{ columns: exportColumns, rows: exportRows }} exportFilename="solutions" />
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={solutions}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  )
}
