import { Typography, Row, Col, Card, Statistic, Button, Alert, Modal, Table, Spin, Tag, Form, Input, message, Space } from 'antd'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  FileTextOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { dashboardApi, type DashboardDetailTicket, type TrendPoint } from '../api/dashboard'
import { ticketsApi } from '../api/tickets'
import { leadsApi, type ActiveLeadRow } from '../api/leads'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { PrintExport } from '../components/common/PrintExport'
import { TICKET_EXPORT_COLUMNS, buildTicketExportRow, getChoresBugsCurrentStage } from '../utils/helpers'
import { ROUTES } from '../utils/constants'
import { useAuth } from '../hooks/useAuth'
import type { Ticket } from '../api/tickets'
import type { DashboardMetrics } from '../api/dashboard'

const ACTIVE_LEAD_STAGE_COLORS: Record<string, string> = {
  'Demo Completed': '#22c55e',
  'Demo Schedule': '#f97316',
  'Brochure': '#86efac',
  'Account Setup': '#86efac',
  'Quotation': '#22d3ee',
  'Lead': '#e0f2fe',
  'Contacted': '#bae6fd',
  'PO': '#a78bfa',
  'Implementation Invoice': '#fbbf24',
  'Item Setup': '#c4b5fd',
  'Training': '#67e8f9',
  'First Invoice': '#34d399',
  'First Invoice Payment': '#10b981',
}

const { Title, Text } = Typography

function formatINR(n: number): string {
  try {
    return new Intl.NumberFormat('en-IN').format(n)
  } catch {
    return String(n)
  }
}

/** Same display for Tag (T1) and Tag (T2): name + email when both exist */
function formatTagColumn(name?: string | null, email?: string | null) {
  const n = (name || '').trim()
  const e = (email || '').trim()
  if (n && e) return `${n} (${e})`
  return n || e || '—'
}

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
  { borderLeft: '3px solid #0ea5e9', iconColor: '#0ea5e9', ...lightPanel },
  { borderLeft: '3px solid #14b8a6', iconColor: '#14b8a6', ...lightPanel },
  { borderLeft: '3px solid #ef4444', iconColor: '#ef4444', ...lightPanel },
  { borderLeft: '3px solid #8b5cf6', iconColor: '#8b5cf6', ...lightPanel },
  { borderLeft: '3px solid #14b8a6', iconColor: '#14b8a6', ...lightPanel },
]

export const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const emailLower = (user?.email || '').trim().toLowerCase()
  /** Full custom KPIs: payments + delegation */
  const customDashboardFullEmails = new Set(['ad@ip.com', 'ayush@industryprime.com'])
  /** Payment KPIs only (Total Rec Amount + Total Due) */
  const customDashboardPaymentOnlyEmails = new Set(['ea@industryprime.com'])
  const isCustomDashboardFullUser = emailLower ? customDashboardFullEmails.has(emailLower) : false
  const isCustomDashboardPaymentOnlyUser = emailLower ? customDashboardPaymentOnlyEmails.has(emailLower) : false
  const isCustomDashboardUser = isCustomDashboardFullUser || isCustomDashboardPaymentOnlyUser
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [allFetchedTickets, setAllFetchedTickets] = useState<Ticket[]>([])
  const [error, setError] = useState<string | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailMetric, setDetailMetric] = useState<string | null>(null)
  const [detailTitle, setDetailTitle] = useState('')
  const [detailData, setDetailData] = useState<DashboardDetailTicket[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const hideCompanyColumnInDelegation = detailMetric === 'custom_pending_delegation'
  const isPaymentKpiDetail =
    detailMetric === 'custom_total_rec_amount' || detailMetric === 'custom_total_due'
  const [activeLeads, setActiveLeads] = useState<ActiveLeadRow[]>([])
  const [activeLeadsLoading, setActiveLeadsLoading] = useState(false)
  const [paymentActions, setPaymentActions] = useState<
    Array<{
      client_payment_id: string
      company_name?: string
      invoice_number?: string
      reference_no?: string
      tagged_user_name?: string | null
      tagged_user_email?: string | null
      tagged_user_2_name?: string | null
      tagged_user_2_email?: string | null
      pending_payment_tag?: 't1' | 't2' | 'completed'
    }>
  >([])
  const [paymentActionsLoading, setPaymentActionsLoading] = useState(false)
  const [paymentActionModalOpen, setPaymentActionModalOpen] = useState(false)
  const [paymentActionRow, setPaymentActionRow] = useState<{
    client_payment_id: string
    company_name?: string
    reference_no?: string
    pending_payment_tag?: 't1' | 't2' | 'completed'
  } | null>(null)
  const [paymentActionSubmitting, setPaymentActionSubmitting] = useState(false)
  const [paymentActionForm] = Form.useForm<{ person: string; remarks: string }>()
  const [trendPoints, setTrendPoints] = useState<TrendPoint[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    setPaymentActionsLoading(true)
    setActiveLeadsLoading(true)
    const promises: Promise<void>[] = [
      leadsApi.listActive().then((res) => setActiveLeads(res.leads || [])).catch(() => setActiveLeads([])),
    ]
    if (user) {
      promises.push(
        dashboardApi.getPaymentActions().then((res) => setPaymentActions(res.items || [])).catch(() => setPaymentActions([]))
      )
    } else {
      setPaymentActions([])
    }
    Promise.all(promises).finally(() => {
      setPaymentActionsLoading(false)
      setActiveLeadsLoading(false)
    })
  }, [user?.role, user?.email, user?.id])

  const isFullPaymentViewer =
    user?.role === 'master_admin' ||
    user?.role === 'admin' ||
    (user?.email || '').toLowerCase() === 'sk@industryprime.com'

  const paymentActionColumns = useMemo(
    () => [
      { title: 'Company', dataIndex: 'company_name', key: 'company_name', render: (v: string) => v || '—' },
      { title: 'Invoice Number', dataIndex: 'invoice_number', key: 'invoice_number', render: (v: string) => v || '—' },
      { title: 'Reference', dataIndex: 'reference_no', key: 'reference_no', render: (v: string) => v || '—' },
      {
        title: 'Tags (T1 & T2)',
        key: 'tags',
        width: 280,
        render: (
          _: unknown,
          r: {
            tagged_user_name?: string | null
            tagged_user_email?: string | null
            tagged_user_2_name?: string | null
            tagged_user_2_email?: string | null
          }
        ) => (
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>
            <div>
              <Text type="secondary">T1: </Text>
              {formatTagColumn(r.tagged_user_name, r.tagged_user_email)}
            </div>
            <div style={{ marginTop: 4 }}>
              <Text type="secondary">T2: </Text>
              {formatTagColumn(r.tagged_user_2_name, r.tagged_user_2_email)}
            </div>
          </div>
        ),
      },
      {
        title: 'Step',
        key: 'step',
        width: 100,
        render: (_: unknown, r: { pending_payment_tag?: 't1' | 't2' | 'completed' }) => {
          if (r.pending_payment_tag === 'completed') {
            return <Tag color="success">Done</Tag>
          }
          return (
            <Tag color={r.pending_payment_tag === 't2' ? 'blue' : 'default'}>
              {r.pending_payment_tag === 't2' ? 'T2' : 'T1'}
            </Tag>
          )
        },
      },
      {
        title: 'Action',
        key: 'action',
        render: (
          _: unknown,
          row: {
            client_payment_id: string
            company_name?: string
            reference_no?: string
            pending_payment_tag?: 't1' | 't2' | 'completed'
          }
        ) =>
          row.pending_payment_tag === 'completed' ? (
            <Text type="secondary">Recorded</Text>
          ) : (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                setPaymentActionRow(row)
                paymentActionForm.resetFields()
                setPaymentActionModalOpen(true)
              }}
            >
              Submit
            </Button>
          ),
      },
    ],
    []
  )

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [metricsRes, ticketsRes, trendsRes] = await Promise.allSettled([
        dashboardApi.getMetrics(),
        ticketsApi.list({ limit: 100, types_in: 'chore,bug' }),
        dashboardApi.getTrends(),
      ])
      setMetrics(metricsRes.status === 'fulfilled' ? metricsRes.value : null)
      if (trendsRes.status === 'fulfilled' && trendsRes.value?.data?.length) {
        setTrendPoints(trendsRes.value.data)
      } else {
        setTrendPoints([])
      }
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
    feature_excluding_demo_c: 0,
    feature_with_demo_c: 0,
    response_delay: 0,
    completion_delay: 0,
    total_last_week: 0,
    pending_last_week: 0,
    staging_pending_feature: 0,
    staging_pending_chores_bugs: 0,
    custom_received_monthly: 0,
    custom_received_quarterly: 0,
    custom_received_half_yearly: 0,
    custom_received_yearly: 0,
    custom_total_due: 0,
    custom_pending_delegation: 0,
  }

  const customReceivedTotal =
    Number(safeMetrics.custom_received_monthly) +
    Number(safeMetrics.custom_received_quarterly) +
    Number(safeMetrics.custom_received_half_yearly) +
    Number(safeMetrics.custom_received_yearly)

  const baseMetricCards = [
    { title: 'Total Pending Bug (till date)', metricKey: 'total_pending_bug', value: Number(safeMetrics.total_pending_bug_till_date) ?? 0, icon: <FileTextOutlined /> },
    { title: 'Response Delay', metricKey: 'response_delay', value: Number(safeMetrics.response_delay) || 0, icon: <ClockCircleOutlined /> },
    { title: 'Completion Delay', metricKey: 'completion_delay', value: Number(safeMetrics.completion_delay) || 0, icon: <WarningOutlined /> },
    { title: 'Total (Last Week)', metricKey: 'total_last_week', value: Number(safeMetrics.total_last_week) || 0, icon: <FileTextOutlined /> },
    { title: 'Pending (till date) Excl. Demo C', metricKey: 'pending_exclude_demo_c', value: Number(safeMetrics.pending_till_date_exclude_demo_c) ?? 0, icon: <CheckCircleOutlined /> },
    { title: 'Pending Chores (Demo C)', metricKey: 'pending_chores_demo_c', value: Number(safeMetrics.pending_chores_include_demo_c) ?? 0, icon: <CheckCircleOutlined /> },
    { title: 'Feature Excluding Demo C', metricKey: 'feature_exclude_demo_c', value: Number(safeMetrics.feature_excluding_demo_c) ?? 0, icon: <RocketOutlined /> },
    { title: 'Feature with Demo C', metricKey: 'feature_with_demo_c', value: Number(safeMetrics.feature_with_demo_c) ?? 0, icon: <RocketOutlined /> },
  ]

  const paymentOnlyCards = [
    {
      title: 'Total Rec Ammount',
      metricKey: 'custom_total_rec_amount',
      value: Number(customReceivedTotal) || 0,
      icon: <FileTextOutlined />,
    },
    {
      title: 'Total Due',
      metricKey: 'custom_total_due',
      value: Number(safeMetrics.custom_total_due) || 0,
      icon: <WarningOutlined />,
    },
  ]
  const delegationCard = {
    title: 'Total Pending Delegation',
    metricKey: 'custom_pending_delegation',
    value: Number(safeMetrics.custom_pending_delegation) || 0,
    icon: <CheckCircleOutlined />,
  }
  const customMetricCards = isCustomDashboardPaymentOnlyUser
    ? paymentOnlyCards
    : isCustomDashboardFullUser
      ? [...paymentOnlyCards, delegationCard]
      : []

  const metricCards = [...baseMetricCards, ...customMetricCards]

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
    if (type === 'payment' || type === 'delegation') {
      return
    }
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
          const clickable = card.clickable !== false
          const paymentRupeeCard =
            card.metricKey === 'custom_total_due' || card.metricKey === 'custom_total_rec_amount'
          return (
            <Col xs={24} sm={12} md={8} lg={6} key={i}>
              <Card
                onClick={clickable ? () => loadDetail(card.metricKey, card.title) : undefined}
                style={{
                  borderRadius: 8,
                  border: cardStyle.border,
                  borderLeft: cardStyle.borderLeft,
                  background: cardStyle.background,
                  boxShadow: cardStyle.boxShadow,
                  cursor: clickable ? 'pointer' : 'default',
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
                      formatter={paymentRupeeCard ? (val) => <span style={{ fontSize: 28, fontWeight: 700, color: '#1e293b' }}>₹{formatINR(Number(val))}</span> : undefined}
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

      {user && (
        <>
          <Title level={4} style={{ marginBottom: 8, color: '#1e293b', fontWeight: 600, letterSpacing: 0.5 }}>
            Payment Action
          </Title>
          {!isFullPaymentViewer && (
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Rows where you are tagged for T1 or T2 (pending). Master Admin / Admin sees all intercepts.
            </Text>
          )}
          {!isFullPaymentViewer &&
            !paymentActionsLoading &&
            paymentActions.length === 0 && (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message="No payment actions for your login. If you should be tagged, check that Client Payment has your user id or email saved on the intercept."
              />
            )}
          {isFullPaymentViewer && (
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Pending steps only: when T1 (and T2 if tagged) are submitted, the row leaves this list — details stay under Client Payment on the invoice.
            </Text>
          )}
          <Title level={5} style={{ marginBottom: 12, color: '#1e293b', fontWeight: 600 }}>
            Tag (T1) — Client Payment actions
          </Title>
          <Card
            style={{ borderRadius: 8, border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)', background: '#ffffff', marginBottom: 28 }}
            bodyStyle={{ padding: 16 }}
          >
            <Table
              size="small"
              loading={paymentActionsLoading}
              dataSource={paymentActions}
              rowKey={(r) => `${r.client_payment_id}-${r.pending_payment_tag || 't1'}`}
              pagination={false}
              columns={paymentActionColumns}
              locale={{
                emptyText: isFullPaymentViewer
                  ? 'No payment actions. Add intercept + Tag (T1) on Client Payment, run docs/CLIENT_PAYMENT_INTERCEPT_TAG2.sql in Supabase if T2 columns are missing.'
                  : 'No rows for your account. You must be tagged for T1 or T2 on an intercept with pending payment action.',
              }}
            />
          </Card>
        </>
      )}

      {/* Trends row — data from GET /dashboard/trends (monthly Chores & Bug counts) */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ color: '#1e293b', fontWeight: 600, letterSpacing: 0.5 }}>Response Delay Trend</span>}
            style={{ borderRadius: 8, border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)', background: '#ffffff' }}
            bodyStyle={{ padding: '12px 16px 16px', minHeight: 280 }}
          >
            <Text style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 8 }}>
              Monthly trend (Chores & Bug) — tickets without assignee
            </Text>
            {trendPoints.length > 0 ? (
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendPoints} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis allowDecimals={false} width={36} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      formatter={(v: number) => [v, 'Count']}
                      labelStyle={{ color: '#334155' }}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="response_delay"
                      name="Response delay"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#3b82f6' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ padding: 32, textAlign: 'center', background: '#f8fafc', borderRadius: 8 }}>
                <Text type="secondary">No trend data yet (last 7 months).</Text>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ color: '#1e293b', fontWeight: 600, letterSpacing: 0.5 }}>Completion Delay Trend</span>}
            style={{ borderRadius: 8, border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)', background: '#ffffff' }}
            bodyStyle={{ padding: '12px 16px 16px', minHeight: 280 }}
          >
            <Text style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 8 }}>
              Monthly trend (Chores & Bug) — Stage 2 delay (TAT exceeded after Stage 2 completed)
            </Text>
            {trendPoints.length > 0 ? (
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendPoints} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis allowDecimals={false} width={36} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      formatter={(v: number) => [v, 'Count']}
                      labelStyle={{ color: '#334155' }}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completion_delay"
                      name="Completion delay"
                      stroke="#d97706"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#d97706' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ padding: 32, textAlign: 'center', background: '#f8fafc', borderRadius: 8 }}>
                <Text type="secondary">No trend data yet (last 7 months).</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Active Leads - from Client to Lead (last, after trends) */}
      <Title level={4} style={{ marginBottom: 16, marginTop: 28, color: '#1e293b', fontWeight: 600, letterSpacing: 0.5 }}>
        Active Leads
      </Title>
      <style>{`.dashboard-active-leads .ant-table-thead > tr > th { background: #22c55e !important; color: #fff !important; border-bottom-color: rgba(255,255,255,0.3) !important; font-weight: 600; }`}</style>
      <Card
        className="dashboard-active-leads"
        style={{ marginBottom: 28, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          loading={activeLeadsLoading}
          dataSource={activeLeads}
          rowKey="id"
          size="small"
          scroll={{ x: 720 }}
          pagination={activeLeads.length > 10 ? { pageSize: 10, showSizeChanger: false, showTotal: (t) => `Total ${t} leads` } : false}
          onRow={(record) => ({
            onClick: () => navigate(ROUTES.LEAD_DETAIL.replace(':id', record.reference_no)),
            style: { cursor: 'pointer' },
          })}
          columns={[
            {
              title: 'Company Name',
              dataIndex: 'company_name',
              key: 'company_name',
              width: 180,
              render: (v: string) => v || '—',
            },
            {
              title: 'Stage',
              dataIndex: 'stage',
              key: 'stage',
              width: 160,
              render: (stage: string) => {
                const color = ACTIVE_LEAD_STAGE_COLORS[stage] || '#94a3b8'
                const isLight = ['#86efac', '#bae6fd', '#e0f2fe'].includes(color)
                return <Tag style={{ margin: 0, border: 'none', background: color, color: isLight ? '#0f172a' : '#fff' }}>{stage || '—'}</Tag>
              },
            },
            {
              title: 'Person Name',
              dataIndex: 'person_name',
              key: 'person_name',
              width: 140,
              render: (v: string) => v || '—',
            },
            {
              title: 'City',
              dataIndex: 'city',
              key: 'city',
              width: 120,
              render: (v: string) => v || '—',
            },
            {
              title: 'State',
              dataIndex: 'state',
              key: 'state',
              width: 120,
              render: (v: string) => v || '—',
            },
          ]}
        />
      </Card>

      <Modal
        title={
          isPaymentKpiDetail ? (
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <span>{detailTitle}</span>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
                Same raised-invoice rows as{' '}
                <Button type="link" size="small" style={{ padding: 0, height: 'auto' }} onClick={() => { setDetailModalOpen(false); navigate(ROUTES.CLIENT_PAYMENT) }}>
                  Client Payment → Payment Management
                </Button>
              </Text>
            </Space>
          ) : (
            detailTitle
          )
        }
        open={detailModalOpen}
        onCancel={() => { setDetailModalOpen(false); setDetailData([]) }}
        footer={
          isPaymentKpiDetail ? (
            <Button type="primary" onClick={() => { setDetailModalOpen(false); navigate(ROUTES.CLIENT_PAYMENT) }}>
              Open Client Payment
            </Button>
          ) : null
        }
        width={isPaymentKpiDetail ? 1100 : 800}
      >
        {detailLoading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Spin size="large" />
          </div>
        ) : isPaymentKpiDetail ? (
          <Table
            dataSource={detailData}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total ${t} invoices` }}
            scroll={{ x: 1000 }}
            columns={[
              {
                title: 'Reference',
                dataIndex: 'referenceNo',
                key: 'referenceNo',
                width: 130,
                ellipsis: true,
                render: (v: string) => v || '—',
              },
              {
                title: 'Company Name',
                dataIndex: 'company',
                key: 'company',
                width: 220,
                ellipsis: true,
                render: (v: string) => v || '—',
              },
              {
                title: 'Invoice Date',
                dataIndex: 'invoiceDate',
                key: 'invoiceDate',
                width: 120,
                render: (v: string) => (v && dayjs(v).isValid() ? dayjs(v).format('DD-MMM-YYYY') : '—'),
              },
              {
                title: 'Invoice Amount',
                dataIndex: 'invoiceAmount',
                key: 'invoiceAmount',
                width: 120,
                align: 'right' as const,
                render: (v: number | undefined) => (v != null ? `₹${formatINR(Number(v))}` : '—'),
              },
              {
                title: 'Invoice Number',
                dataIndex: 'invoiceNumber',
                key: 'invoiceNumber',
                width: 130,
                ellipsis: true,
                render: (v: string) => v || '—',
              },
              {
                title: 'Stage',
                dataIndex: 'stage',
                key: 'stage',
                width: 150,
                ellipsis: true,
                render: (v: string) => v || '—',
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                width: 100,
                render: (v: string) => v || '—',
              },
              {
                title: 'Aging (days)',
                dataIndex: 'agingDays',
                key: 'agingDays',
                width: 100,
                align: 'center' as const,
                render: (v: number | null | undefined) => (v != null ? String(v) : '—'),
              },
              {
                title: 'Genre',
                dataIndex: 'genre',
                key: 'genre',
                width: 100,
                render: (v: string) => v || '—',
              },
            ]}
          />
        ) : (
          <Table
            dataSource={detailData}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total ${t} tickets` }}
            scroll={{ x: 'max-content' }}
            columns={[
              ...(!hideCompanyColumnInDelegation
                ? [
                    {
                      title: 'Company',
                      dataIndex: 'company',
                      key: 'company',
                      width: 140,
                      onCell: () => ({ style: { whiteSpace: 'normal', wordBreak: 'break-word' } }),
                    },
                  ]
                : []),
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
                  (record.type || '').toLowerCase() === 'feature' ||
                  (record.type || '').toLowerCase() === 'bug' ||
                  (record.type || '').toLowerCase() === 'chore' ? (
                    <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openTicket(record)}>
                      {record.referenceNo}
                    </Button>
                  ) : (
                    <span>{record.referenceNo}</span>
                  )
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

      <Modal
        title={
          paymentActionRow?.pending_payment_tag === 't2'
            ? 'Payment Action — Tag T2'
            : paymentActionRow?.pending_payment_tag === 't1'
              ? 'Payment Action — Tag T1'
              : 'Payment Action'
        }
        open={paymentActionModalOpen}
        onCancel={() => {
          setPaymentActionModalOpen(false)
          setPaymentActionRow(null)
          paymentActionForm.resetFields()
        }}
        footer={null}
        destroyOnClose
        width={480}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          {paymentActionRow?.company_name || '—'} · {paymentActionRow?.reference_no || '—'}
        </Text>
        <Form
          form={paymentActionForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!paymentActionRow?.client_payment_id) return
            if (paymentActionRow.pending_payment_tag === 'completed') return
            setPaymentActionSubmitting(true)
            try {
              await dashboardApi.submitPaymentAction({
                client_payment_id: paymentActionRow.client_payment_id,
                person: values.person?.trim() || '',
                remarks: values.remarks?.trim() || '',
                tag: paymentActionRow.pending_payment_tag === 't2' ? 't2' : 't1',
              })
              message.success('Saved. This row is cleared from Payment Action and visible under Client Payment.')
              const res = await dashboardApi.getPaymentActions()
              setPaymentActions(res.items || [])
              setPaymentActionModalOpen(false)
              setPaymentActionRow(null)
              paymentActionForm.resetFields()
            } catch (e: unknown) {
              const err = e as { response?: { data?: { detail?: string } } }
              message.error(err?.response?.data?.detail || 'Submit failed')
            } finally {
              setPaymentActionSubmitting(false)
            }
          }}
        >
          <Form.Item name="person" label="Person" rules={[{ required: true, message: 'Enter person name' }]}>
            <Input placeholder="Person" />
          </Form.Item>
          <Form.Item name="remarks" label="Remarks" rules={[{ required: true, message: 'Enter remarks' }]}>
            <Input.TextArea placeholder="Remarks" rows={4} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => { setPaymentActionModalOpen(false); setPaymentActionRow(null) }} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={paymentActionSubmitting}>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  )
}
