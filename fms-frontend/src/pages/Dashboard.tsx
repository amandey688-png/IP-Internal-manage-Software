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
  open: '#3b82f6',
  in_progress: '#eab308',
  resolved: '#22c55e',
  closed: '#6b7280',
  overdue: '#ef4444',
  pending: '#eab308',
  completed: '#22c55e',
}

const hudPanel = {
  background: 'rgba(13, 27, 42, 0.9)',
  border: '1px solid rgba(59, 130, 246, 0.3)',
  boxShadow: '0 0 20px rgba(59, 130, 246, 0.08), inset 0 1px 0 rgba(255,255,255,0.03)',
}
const metricCardColors = [
  { borderLeft: '3px solid #3b82f6', iconColor: '#3b82f6', ...hudPanel },
  { borderLeft: '3px solid #06b6d4', iconColor: '#06b6d4', ...hudPanel },
  { borderLeft: '3px solid #eab308', iconColor: '#eab308', ...hudPanel },
  { borderLeft: '3px solid #22c55e', iconColor: '#22c55e', ...hudPanel },
  { borderLeft: '3px solid #3b82f6', iconColor: '#3b82f6', ...hudPanel },
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
    { title: 'Feature Pending', value: Number(safeMetrics.staging_pending_feature) || 0, icon: <RocketOutlined />, color: '#3b82f6' },
    { title: 'Chores & Bug Pending', value: Number(safeMetrics.staging_pending_chores_bugs) || 0, icon: <FileTextOutlined />, color: '#22c55e' },
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

      {/* Metric cards - static, informational only (non-clickable) */}
      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        {metricCards.map((card, i) => {
          const cardStyle = metricCardColors[i] || metricCardColors[0]
          return (
            <Col xs={24} sm={12} md={8} lg={6} key={i}>
              <Card
                style={{
                  borderRadius: 8,
                  border: cardStyle.border,
                  borderLeft: cardStyle.borderLeft,
                  background: cardStyle.background,
                  boxShadow: cardStyle.boxShadow,
                  cursor: 'default',
                }}
                bodyStyle={{ padding: 22 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minWidth: 0 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'normal', wordBreak: 'break-word', display: 'block', color: 'rgba(255,255,255,0.6)' }}>
                      {card.title}
                    </Text>
                    <Statistic
                      value={card.value}
                      valueStyle={{ fontSize: 28, fontWeight: 700, color: '#fff', marginTop: 4 }}
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
      <Title level={4} style={{ marginBottom: 16, color: '#fff', fontWeight: 600, letterSpacing: 0.5 }}>
        In Staging
      </Title>
      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        {stagingCards.map((card, i) => (
          <Col xs={24} sm={12} key={`staging-${i}`}>
            <Card
              style={{
                borderRadius: 8,
                border: '1px solid rgba(59, 130, 246, 0.3)',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.08)',
                background: 'rgba(13, 27, 42, 0.9)',
                borderTop: `3px solid ${card.color}`,
              }}
              bodyStyle={{ padding: 22 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minWidth: 0 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'normal', wordBreak: 'break-word', display: 'block', color: 'rgba(255,255,255,0.6)' }}>
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
            title={<span style={{ color: '#fff', fontWeight: 600, letterSpacing: 0.5 }}>Response Delay Trend</span>}
            style={{ borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.3)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.08)', background: 'rgba(13, 27, 42, 0.9)' }}
            bodyStyle={{ padding: 24, height: 200 }}
          >
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Monthly trend (Chores & Bug)</Text>
            <div style={{ marginTop: 16, padding: 24, background: 'rgba(10, 22, 40, 0.6)', borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.15)' }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Chart placeholder — metrics loaded</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ color: '#fff', fontWeight: 600, letterSpacing: 0.5 }}>Completion Delay Trend</span>}
            style={{ borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.3)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.08)', background: 'rgba(13, 27, 42, 0.9)' }}
            bodyStyle={{ padding: 24, height: 200 }}
          >
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Monthly trend (Chores & Bug)</Text>
            <div style={{ marginTop: 16, padding: 24, background: 'rgba(10, 22, 40, 0.6)', borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.15)' }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Chart placeholder — metrics loaded</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ color: '#fff', fontWeight: 600 }}>Average tickets created</span>}
            style={{ borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.3)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.08)', background: 'rgba(13, 27, 42, 0.9)' }}
            bodyStyle={{ padding: 24, height: 200 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Based on recent Chores & Bug tickets</Text>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ color: '#fff', fontWeight: 600 }}>Recent tickets (Chores & Bug)</span>}
            extra={
              <Button type="link" size="small" onClick={goToChoresBugs} style={{ fontWeight: 500, color: '#3b82f6' }}>
                View all
              </Button>
            }
            style={{ borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.3)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.08)', background: 'rgba(13, 27, 42, 0.9)' }}
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
