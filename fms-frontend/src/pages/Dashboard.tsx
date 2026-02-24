import { Typography, Row, Col, Card, Statistic, Button, Alert, Modal, Table, Spin } from 'antd'
import {
  FileTextOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardApi, type DashboardDetailTicket } from '../api/dashboard'
import { ticketsApi } from '../api/tickets'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { PrintExport } from '../components/common/PrintExport'
import { TICKET_EXPORT_COLUMNS, buildTicketExportRow, getChoresBugsCurrentStage } from '../utils/helpers'
import { ROUTES } from '../utils/constants'
import type { Ticket } from '../api/tickets'
import type { DashboardMetrics } from '../api/dashboard'

const { Title, Text } = Typography

const lightPanel = {
  background: '#ffffff',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
}
const metricCardColors = [
  { borderLeft: '3px solid #3b82f6', iconColor: '#3b82f6', ...lightPanel },
  { borderLeft: '3px solid #06b6d4', iconColor: '#06b6d4', ...lightPanel },
  { borderLeft: '3px solid #eab308', iconColor: '#eab308', ...lightPanel },
  { borderLeft: '3px solid #22c55e', iconColor: '#22c55e', ...lightPanel },
  { borderLeft: '3px solid #3b82f6', iconColor: '#3b82f6', ...lightPanel },
  { borderLeft: '3px solid #8b5cf6', iconColor: '#8b5cf6', ...lightPanel },
]

export const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [allFetchedTickets, setAllFetchedTickets] = useState<Ticket[]>([])
  const [error, setError] = useState<string | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailMetric, setDetailMetric] = useState<string | null>(null)
  const [detailTitle, setDetailTitle] = useState('')
  const [detailData, setDetailData] = useState<DashboardDetailTicket[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [metricsRes, ticketsRes] = await Promise.allSettled([
        dashboardApi.getMetrics(),
        ticketsApi.list({ limit: 100, types_in: 'chore,bug' }),
      ])
      setMetrics(metricsRes.status === 'fulfilled' ? metricsRes.value : null)
      const ticketsResVal = ticketsRes.status === 'fulfilled' ? ticketsRes.value : null
      const raw = ticketsResVal && typeof ticketsResVal === 'object' ? (ticketsResVal as { data?: unknown }).data : undefined
      const tickets: Ticket[] = Array.isArray(raw) ? raw as Ticket[] : []
      setAllFetchedTickets(tickets)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError('Failed to load dashboard. Check backend connection.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner fullPage />
  }

  const safeMetrics: DashboardMetrics = metrics ?? {
    all_tickets: 0,
    pending_till_date: 0,
    total_pending_bug_till_date: 0,
    pending_till_date_exclude_demo_c: 0,
    pending_chores_include_demo_c: 0,
    response_delay: 0,
    completion_delay: 0,
    total_last_week: 0,
    pending_last_week: 0,
    staging_pending_feature: 0,
    staging_pending_chores_bugs: 0,
  }

  const metricCards = [
    { title: 'Total Pending Bug (till date)', metricKey: 'total_pending_bug', value: Number(safeMetrics.total_pending_bug_till_date) ?? 0, icon: <FileTextOutlined /> },
    { title: 'Response Delay', metricKey: 'response_delay', value: Number(safeMetrics.response_delay) || 0, icon: <ClockCircleOutlined /> },
    { title: 'Completion Delay', metricKey: 'completion_delay', value: Number(safeMetrics.completion_delay) || 0, icon: <WarningOutlined /> },
    { title: 'Total (Last Week)', metricKey: 'total_last_week', value: Number(safeMetrics.total_last_week) || 0, icon: <FileTextOutlined /> },
    { title: 'Pending (till date) Excl. Demo C', metricKey: 'pending_exclude_demo_c', value: Number(safeMetrics.pending_till_date_exclude_demo_c) ?? 0, icon: <CheckCircleOutlined /> },
    { title: 'Pending Chores (Demo C)', metricKey: 'pending_chores_demo_c', value: Number(safeMetrics.pending_chores_include_demo_c) ?? 0, icon: <CheckCircleOutlined /> },
  ]

  const stagingCards = [
    { title: 'Feature Pending', metricKey: 'staging_feature', value: Number(safeMetrics.staging_pending_feature) || 0, icon: <RocketOutlined />, color: '#3b82f6' },
    { title: 'Chores & Bug Pending', metricKey: 'staging_chores_bugs', value: Number(safeMetrics.staging_pending_chores_bugs) || 0, icon: <FileTextOutlined />, color: '#22c55e' },
  ]

  const loadDetail = async (metricKey: string, title: string) => {
    setDetailMetric(metricKey)
    setDetailTitle(title)
    setDetailModalOpen(true)
    setDetailLoading(true)
    setDetailData([])
    try {
      const res = await dashboardApi.getDetail(metricKey)
      setDetailData(res.tickets || [])
    } catch {
      setDetailData([])
    } finally {
      setDetailLoading(false)
    }
  }

  const openTicket = (t: DashboardDetailTicket) => {
    setDetailModalOpen(false)
    const type = (t.type || '').toLowerCase()
    if (type === 'feature') {
      navigate(ROUTES.TICKETS + '?type=feature', { state: { openTicketId: t.id, openTicketType: 'feature' } })
    } else {
      navigate(ROUTES.TICKETS + '?section=chores-bugs', { state: { openTicketId: t.id, openTicketType: type === 'bug' ? 'bug' : 'chore' } })
    }
  }

  const exportData = allFetchedTickets.length
    ? {
        columns: [...TICKET_EXPORT_COLUMNS],
        rows: allFetchedTickets.map((t) => buildTicketExportRow(t, getChoresBugsCurrentStage)),
      }
    : undefined

  return (
    <div
      style={{
        maxWidth: 1400,
        margin: '0 auto',
        minHeight: 400,
        padding: '8px 0',
        background: 'transparent',
        borderRadius: 16,
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <PrintExport pageTitle="Dashboard" exportData={exportData} exportFilename="dashboard_recent_tickets" />
      </div>
      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          action={<Button size="small" onClick={fetchData}>Retry</Button>}
          style={{ marginBottom: 24, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)' }}
        />
      )}

      {/* Metric cards - clickable, open detail modal */}
      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        {metricCards.map((card, i) => {
          const cardStyle = metricCardColors[i] || metricCardColors[0]
          return (
            <Col xs={24} sm={12} md={8} lg={6} key={i}>
              <Card
                onClick={() => loadDetail(card.metricKey, card.title)}
                style={{
                  borderRadius: 8,
                  border: cardStyle.border,
                  borderLeft: cardStyle.borderLeft,
                  background: cardStyle.background,
                  boxShadow: cardStyle.boxShadow,
                  cursor: 'pointer',
                }}
                bodyStyle={{ padding: 22 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minWidth: 0 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'normal', wordBreak: 'break-word', display: 'block', color: '#64748b' }}>
                      {card.title}
                    </Text>
                    <Statistic
                      value={card.value}
                      valueStyle={{ fontSize: 28, fontWeight: 700, color: '#1e293b', marginTop: 4 }}
                    />
                  </div>
                  <div style={{ fontSize: 28, color: cardStyle.iconColor, opacity: 0.9, flexShrink: 0 }}>{card.icon}</div>
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>

      {/* In Staging */}
      <Title level={4} style={{ marginBottom: 16, color: '#1e293b', fontWeight: 600, letterSpacing: 0.5 }}>
        In Staging
      </Title>
      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        {stagingCards.map((card, i) => (
          <Col xs={24} sm={12} key={`staging-${i}`}>
            <Card
              onClick={() => loadDetail(card.metricKey, card.title)}
              style={{
                borderRadius: 8,
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
                background: '#ffffff',
                borderTop: `3px solid ${card.color}`,
                cursor: 'pointer',
              }}
              bodyStyle={{ padding: 22 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minWidth: 0 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'normal', wordBreak: 'break-word', display: 'block', color: '#64748b' }}>
                    {card.title}
                  </Text>
                  <Statistic value={card.value} valueStyle={{ fontSize: 28, fontWeight: 700, color: card.color }} style={{ marginTop: 4 }} />
                </div>
                <div style={{ fontSize: 26, color: card.color, flexShrink: 0 }}>{card.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Trends row */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ color: '#1e293b', fontWeight: 600, letterSpacing: 0.5 }}>Response Delay Trend</span>}
            style={{ borderRadius: 8, border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)', background: '#ffffff' }}
            bodyStyle={{ padding: 24, height: 200 }}
          >
            <Text style={{ fontSize: 12, color: '#64748b' }}>Monthly trend (Chores & Bug)</Text>
            <div style={{ marginTop: 16, padding: 24, background: '#f8fafc', borderRadius: 8, border: '1px solid rgba(0, 0, 0, 0.06)' }}>
              <Text style={{ color: '#64748b' }}>Chart placeholder — metrics loaded</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ color: '#1e293b', fontWeight: 600, letterSpacing: 0.5 }}>Completion Delay Trend</span>}
            style={{ borderRadius: 8, border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)', background: '#ffffff' }}
            bodyStyle={{ padding: 24, height: 200 }}
          >
            <Text style={{ fontSize: 12, color: '#64748b' }}>Monthly trend (Chores & Bug)</Text>
            <div style={{ marginTop: 16, padding: 24, background: '#f8fafc', borderRadius: 8, border: '1px solid rgba(0, 0, 0, 0.06)' }}>
              <Text style={{ color: '#64748b' }}>Chart placeholder — metrics loaded</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title={detailTitle}
        open={detailModalOpen}
        onCancel={() => { setDetailModalOpen(false); setDetailData([]) }}
        footer={null}
        width={800}
      >
        {detailLoading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            dataSource={detailData}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total ${t} tickets` }}
            scroll={{ x: 'max-content' }}
            columns={[
              {
                title: 'Company',
                dataIndex: 'company',
                key: 'company',
                width: 140,
                onCell: () => ({ style: { whiteSpace: 'normal', wordBreak: 'break-word' } }),
              },
              {
                title: <span style={{ fontWeight: 600 }}>Title & Description</span>,
                key: 'title_description',
                onCell: () => ({ style: { whiteSpace: 'pre-line', wordBreak: 'break-word' } }),
                render: (_: unknown, record: DashboardDetailTicket) => {
                  const wrapAfterWords = (text: string, n: number) =>
                    text.trim().split(/\s+/).filter(Boolean).reduce<string[]>((lines, word, i) => {
                      if (i % n === 0) lines.push(word)
                      else lines[lines.length - 1] += ' ' + word
                      return lines
                    }, []).join('\n')
                  return (
                    <div style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                      {record.title && <div style={{ fontWeight: 600 }}>{wrapAfterWords(record.title, 10)}</div>}
                      {record.description && <div style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>{wrapAfterWords(record.description, 10)}</div>}
                    </div>
                  )
                },
              },
              {
                title: 'Reference',
                dataIndex: 'referenceNo',
                key: 'referenceNo',
                width: 120,
                onCell: () => ({ style: { whiteSpace: 'normal', wordBreak: 'break-word' } }),
                render: (_: unknown, record: DashboardDetailTicket) => (
                  <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openTicket(record)}>
                    {record.referenceNo}
                  </Button>
                ),
              },
              {
                title: 'Type',
                dataIndex: 'type',
                key: 'type',
                width: 90,
                onCell: () => ({ style: { whiteSpace: 'normal', wordBreak: 'break-word' } }),
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                width: 100,
                onCell: () => ({ style: { whiteSpace: 'normal', wordBreak: 'break-word' } }),
              },
            ]}
          />
        )}
      </Modal>

    </div>
  )
}
