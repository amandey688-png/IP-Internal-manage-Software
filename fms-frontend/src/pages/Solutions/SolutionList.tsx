import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Table, Card, Typography, Tag, Space } from 'antd'
import { solutionsApi } from '../../api/solutions'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
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

  return (
    <div>
      <Title level={2}>Solutions</Title>
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
