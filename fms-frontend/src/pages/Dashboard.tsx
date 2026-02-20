import { Typography, Row, Col, Card, Statistic, List, Tag, Button, Alert } from 'antd'
import {
  FileTextOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { dashboardApi } from '../api/dashboard'
import { ticketsApi } from '../api/tickets'
import { useEffect, useState } from 'react'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { PrintExport } from '../components/common/PrintExport'
import { formatDateShort, TICKET_EXPORT_COLUMNS, buildTicketExportRow, getChoresBugsCurrentStage } from '../utils/helpers'
import { ROUTES } from '../utils/constants'
import type { Ticket } from '../api/tickets'
import type { DashboardMetrics } from '../api/dashboard'

const { Title, Text } = Typography

const statusColors: Record<string, string> = {
  open: '#1890ff',
  in_progress: '#faad14',
  resolved: '#52c41a',
  closed: '#8c8c8c',
  overdue: '#ff4d4f',
  pending: '#faad14',
  completed: '#52c41a',
}

const metricCardColors = [
  { borderLeft: '4px solid #1890ff', iconColor: '#1890ff', bg: 'linear-gradient(135deg, #e6f4ff 0%, #ffffff 100%)' },
  { borderLeft: '4px solid #fa8c16', iconColor: '#fa8c16', bg: 'linear-gradient(135deg, #fff7e6 0%, #ffffff 100%)' },
  { borderLeft: '4px solid #eb2f96', iconColor: '#eb2f96', bg: 'linear-gradient(135deg, #fff0f6 0%, #ffffff 100%)' },
  { borderLeft: '4px solid #52c41a', iconColor: '#52c41a', bg: 'linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)' },
  { borderLeft: '4px solid #722ed1', iconColor: '#722ed1', bg: 'linear-gradient(135deg, #f9f0ff 0%, #ffffff 100%)' },
]

export const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([])
  const [allFetchedTickets, setAllFetchedTickets] = useState<Ticket[]>([])
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

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
      setRecentTickets(tickets.slice(0, 8))
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError('Failed to load dashboard. Check backend connection.')
    } finally {
      setLoading(false)
    }
  }

  const goToChoresBugs = () => navigate(`${ROUTES.TICKETS}?section=chores-bugs`)

  if (loading) {
    return <LoadingSpinner fullPage />
  }

  const safeMetrics: DashboardMetrics = metrics ?? {
    all_tickets: 0,
    pending_till_date: 0,
    response_delay: 0,
    completion_delay: 0,
    total_last_week: 0,
    pending_last_week: 0,
    staging_pending_feature: 0,
    staging_pending_chores_bugs: 0,
  }

  const metricCards = [
    { title: 'Total Ticket (Current Month)', value: Number(safeMetrics.all_tickets) || 0, icon: <FileTextOutlined /> },
    { title: 'Response Delay', value: Number(safeMetrics.response_delay) || 0, icon: <ClockCircleOutlined /> },
    { title: 'Completion Delay', value: Number(safeMetrics.completion_delay) || 0, icon: <WarningOutlined /> },
    { title: 'Total (Last Week)', value: Number(safeMetrics.total_last_week) || 0, icon: <FileTextOutlined /> },
    { title: 'Pending (till date)', value: Number(safeMetrics.pending_till_date) || 0, icon: <CheckCircleOutlined /> },
  ]

  const stagingCards = [
    { title: 'Feature Pending', value: Number(safeMetrics.staging_pending_feature) || 0, icon: <RocketOutlined />, color: '#1890ff' },
    { title: 'Chores & Bug Pending', value: Number(safeMetrics.staging_pending_chores_bugs) || 0, icon: <FileTextOutlined />, color: '#52c41a' },
  ]

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
        background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 120px)',
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
          style={{ marginBottom: 24, borderRadius: 12 }}
        />
      )}

      {/* Metric cards - static, informational only (non-clickable) */}
      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        {metricCards.map((card, i) => {
          const cardStyle = metricCardColors[i] || metricCardColors[0]
          return (
            <Col xs={24} sm={12} md={8} lg={6} key={i}>
              <Card
                style={{
                  borderRadius: 14,
                  border: 'none',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  borderLeft: cardStyle.borderLeft,
                  background: cardStyle.bg,
                  cursor: 'default',
                }}
                bodyStyle={{ padding: 22 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minWidth: 0 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'normal', wordBreak: 'break-word', display: 'block' }}>
                      {card.title}
                    </Text>
                    <Statistic
                      value={card.value}
                      valueStyle={{ fontSize: 30, fontWeight: 700, color: '#1f2937', marginTop: 4 }}
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
      <Title level={4} style={{ marginBottom: 16, color: '#374151', fontWeight: 600 }}>
        In Staging
      </Title>
      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        {stagingCards.map((card, i) => (
          <Col xs={24} sm={12} key={`staging-${i}`}>
            <Card
              style={{
                borderRadius: 14,
                border: 'none',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                background: i === 0 ? 'linear-gradient(135deg, #e6f7ff 0%, #ffffff 100%)' : 'linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)',
                borderTop: `4px solid ${card.color}`,
              }}
              bodyStyle={{ padding: 22 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minWidth: 0 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'normal', wordBreak: 'break-word', display: 'block' }}>
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
            title="Response Delay Trend"
            style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: 24, height: 200 }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>Monthly trend (Chores & Bug)</Text>
            <div style={{ marginTop: 16, padding: 24, background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)', borderRadius: 12 }}>
              <Text>Chart placeholder — metrics loaded</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Completion Delay Trend"
            style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: 24, height: 200 }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>Monthly trend (Chores & Bug)</Text>
            <div style={{ marginTop: 16, padding: 24, background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)', borderRadius: 12 }}>
              <Text>Chart placeholder — metrics loaded</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title="Average tickets created"
            style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: 24, height: 200 }}
          >
            <Text type="secondary">Based on recent Chores & Bug tickets</Text>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Recent tickets (Chores & Bug)"
            extra={
              <Button type="link" size="small" onClick={goToChoresBugs} style={{ fontWeight: 500 }}>
                View all
              </Button>
            }
            style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: 0, maxHeight: 320, overflow: 'auto' }}
          >
            <List
              dataSource={recentTickets}
              locale={{ emptyText: 'No tickets yet' }}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: '14px 24px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => navigate(`${ROUTES.TICKETS}/${item.id}`)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ display: 'block', fontSize: 14, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {item.title}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {formatDateShort(item.created_at)}
                    </Text>
                  </div>
                  <Tag color={statusColors[item.status] || '#default'} style={{ marginRight: 8 }}>
                    {item.status.replace('_', ' ')}
                  </Tag>
                  <ArrowRightOutlined style={{ color: '#bfbfbf', fontSize: 12 }} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
