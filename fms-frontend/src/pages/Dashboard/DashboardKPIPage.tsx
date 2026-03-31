import { useState, useEffect, useCallback } from 'react'
import { Typography, Card, Button, Select, Row, Col, Table, Progress, Tag, Space, Spin, message, Modal, Alert } from 'antd'
import { DashboardOutlined, ArrowLeftOutlined, CheckSquareOutlined, SwapOutlined, CustomerServiceOutlined, UnorderedListOutlined } from '@ant-design/icons'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import dayjs from 'dayjs'
import './dashboard-kpi.css'
import {
  DASHBOARD_KPI_NAMES,
  dashboardKpiApi,
  MONTHS,
  WEEKS,
  YEARS,
  type DashboardKpiPerson,
  type DashboardKpiResponse,
  type SupportFmsDelayItem,
} from '../../api/dashboardKpi'
import { weekOfMonth } from './kpiWeekUtils'

const { Title, Text } = Typography

interface DashboardKPIPageProps {
  /** Open dashboard directly without dashboard chooser cards. */
  forceOpen?: boolean
  /** Default person when forceOpen is enabled. */
  defaultPerson?: DashboardKpiPerson
}

const DASHBOARD_OPTIONS: { key: DashboardKpiPerson; label: string }[] = [
  { key: 'Shreyasi', label: 'Shreyasi Dashboard' },
  { key: 'Rimpa', label: 'Rimpa Dashboard' },
]

/** Format ISO date/time as 'YYYY-MM-DD hh:mm AM/PM' for Query Arrival display */
const formatQueryArrival = (val: string | null | undefined): string => {
  if (!val) return '—'
  const d = dayjs(val)
  return d.isValid() ? d.format('YYYY-MM-DD hh:mm A') : String(val)
}

const getPerformanceLevel = (value?: number) => {
  const pct = typeof value === 'number' ? value : 0
  if (pct >= 80) {
    return { label: 'High', background: 'rgba(40,167,69,0.15)', color: '#28A745' }
  }
  if (pct >= 50) {
    return { label: 'Medium', background: 'rgba(255,193,7,0.15)', color: '#FFC107' }
  }
  return { label: 'Low', background: 'rgba(220,53,69,0.15)', color: '#DC3545' }
}

export const DashboardKPIPage = ({ forceOpen = false, defaultPerson = 'Shreyasi' }: DashboardKPIPageProps) => {
  const [selectedPerson, setSelectedPerson] = useState<DashboardKpiPerson | null>(forceOpen ? defaultPerson : null)
  const [month, setMonth] = useState<string>(MONTHS[dayjs().month()])
  const [year, setYear] = useState<string>(String(dayjs().year()))
  const [week, setWeek] = useState<string>('week 2')
  const [data, setData] = useState<DashboardKpiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [detailModal, setDetailModal] = useState<{ title: string; items: SupportFmsDelayItem[] } | null>(null)
  const [successModal, setSuccessModal] = useState<
    | null
    | {
        type: 'poc' | 'training' | 'followup' | 'increase'
        title: string
      }
  >(null)
  const [graphModal, setGraphModal] = useState<'checklist' | 'delegation' | 'supportFMS' | 'successKpi' | null>(null)

  // Default filters: same calendar week as ~7 days ago (week-of-month matches backend _week_of_month)
  useEffect(() => {
    const today = dayjs()
    const previousWeekDate = today.subtract(7, 'day')
    setMonth(MONTHS[previousWeekDate.month()])
    setYear(String(previousWeekDate.year()))
    setWeek(`week ${weekOfMonth(previousWeekDate)}`)
  }, [])

  const loadData = useCallback(() => {
    if (!selectedPerson) return
    setLoading(true)
    dashboardKpiApi
      .getData({ name: selectedPerson, month, year, week })
      .then((res) => {
        setData(res)
      })
      .catch(() => {
        message.error('Failed to load dashboard data')
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [selectedPerson, month, year, week])

  useEffect(() => {
    if (selectedPerson) loadData()
    else setData(null)
  }, [selectedPerson, loadData])

  // List view: show Shreyasi & Rimpa cards
  if (!forceOpen && selectedPerson === null) {
    return (
      <div className="dashboard-kpi-page">
        <div className="dashboard-kpi-hero">
          <div className="dashboard-kpi-hero-content">
            <div className="dashboard-kpi-hero-icon">
              <DashboardOutlined />
            </div>
            <div>
              <Title level={3} className="dashboard-kpi-title">
                Dashboard - KPI
              </Title>
              <Text className="dashboard-kpi-subtitle">
                Track Checklist, Delegation and Support FMS performance across dashboards.
              </Text>
            </div>
          </div>
        </div>

        <Row gutter={[24, 24]} className="dashboard-kpi-grid">
          {DASHBOARD_OPTIONS.map((opt) => (
            <Col key={opt.key} xs={24} sm={24} md={12} lg={8}>
              <Card
                hoverable
                onClick={() => setSelectedPerson(opt.key)}
                className={`kpi-card kpi-card--${String(opt.key).toLowerCase()}`}
                style={{ cursor: 'pointer', textAlign: 'left', minHeight: 160 }}
              >
                <div className="kpi-card-header">
                  <div className="kpi-card-icon">
                    <DashboardOutlined />
                  </div>
                  <div>
                    <Title level={5} style={{ margin: 0 }}>
                      {opt.label}
                    </Title>
                    <Text type="secondary">Open detailed KPIs for this dashboard</Text>
                  </div>
                </div>
                <div className="kpi-card-footer">
                  <Text className="kpi-card-pill">View KPI details</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    )
  }

  // Data view for selected person
  const applied = data?.meta?.applied
  const monthly = data?.monthlyPercentages
  const checklist = data?.checklist
  const delegation = data?.delegation
  const supportFMS = data?.supportFMS
  const successKpi = data?.successKpi

  return (
    <div className="dashboard-kpi-page">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {!forceOpen && (
          <Space wrap>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setSelectedPerson(null)}>
              Back to dashboards
            </Button>
          </Space>
        )}

        <Title level={4} style={{ marginBottom: 0 }}>
          {selectedPerson} Dashboard
        </Title>

        <Space wrap size="middle">
          <span>
            <Text type="secondary">Month:</Text>
            <Select
              value={month}
              onChange={setMonth}
              options={MONTHS.map((m) => ({ label: m, value: m }))}
              style={{ width: 100, marginLeft: 8 }}
            />
          </span>
          <span>
            <Text type="secondary">Year:</Text>
            <Select
              value={year}
              onChange={setYear}
              options={YEARS.map((y) => ({ label: y, value: y }))}
              style={{ width: 100, marginLeft: 8 }}
            />
          </span>
          <span>
            <Text type="secondary">Week:</Text>
            <Select
              value={week}
              onChange={setWeek}
              options={WEEKS.map((w) => ({ label: w, value: w }))}
              style={{ width: 120, marginLeft: 8 }}
            />
          </span>
        </Space>

        {loading && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        )}

        {!loading && data && data.success !== false && (
          <>
            {/* Monthly KPI summary – click to show weekly % graph */}
            {monthly && (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={24} md={8}>
                  <Card
                    size="small"
                    title="Checklist (Monthly %)"
                    className="kpi-summary-card kpi-summary-card--checklist kpi-summary-card--clickable"
                    style={{ borderTop: '3px solid #4A6BFF', cursor: 'pointer' }}
                    onClick={() => setGraphModal('checklist')}
                  >
                    <Space direction="vertical" align="center">
                      <Progress type="circle" percent={monthly.checklist ?? 0} size={80} strokeColor="#4A6BFF" />
                      <div
                        className="kpi-performance-pill"
                        style={getPerformanceLevel(monthly.checklist)}
                      >
                        {getPerformanceLevel(monthly.checklist).label} Performance
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Click to see weekly %</Text>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} sm={24} md={8}>
                  <Card
                    size="small"
                    title="Delegation (Monthly %)"
                    className="kpi-summary-card kpi-summary-card--delegation kpi-summary-card--clickable"
                    style={{ borderTop: '3px solid #28A745', cursor: 'pointer' }}
                    onClick={() => setGraphModal('delegation')}
                  >
                    <Space direction="vertical" align="center">
                      <Progress type="circle" percent={monthly.delegation ?? 0} size={80} strokeColor="#28A745" />
                      <div
                        className="kpi-performance-pill"
                        style={getPerformanceLevel(monthly.delegation)}
                      >
                        {getPerformanceLevel(monthly.delegation).label} Performance
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Click to see weekly %</Text>
                    </Space>
                  </Card>
                </Col>
                {selectedPerson === 'Shreyasi' && (
                <Col xs={24} sm={24} md={8}>
                  <Card
                    size="small"
                    title="Support FMS (Monthly %)"
                    className="kpi-summary-card kpi-summary-card--support kpi-summary-card--clickable"
                    style={{ borderTop: '3px solid #FFC107', cursor: 'pointer' }}
                    onClick={() => setGraphModal('supportFMS')}
                  >
                    <Space direction="vertical" align="center">
                      <Progress type="circle" percent={monthly.supportFMS ?? 0} size={80} strokeColor="#FFC107" />
                      <div
                        className="kpi-performance-pill"
                        style={getPerformanceLevel(monthly.supportFMS)}
                      >
                        {getPerformanceLevel(monthly.supportFMS).label} Performance
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Click to see weekly %</Text>
                    </Space>
                  </Card>
                </Col>
                )}
                {selectedPerson === 'Rimpa' && data?.successKpi != null && (
                <Col xs={24} sm={24} md={8}>
                  <Card
                    size="small"
                    title="Success KPI (Monthly %)"
                    className="kpi-summary-card kpi-summary-card--support kpi-summary-card--clickable"
                    style={{ borderTop: '3px solid #FAAD14', cursor: 'pointer' }}
                    onClick={() => setGraphModal('successKpi')}
                  >
                    <Space direction="vertical" align="center">
                      <Progress type="circle" percent={data.successKpi.overallPercentage ?? 0} size={80} strokeColor="#FAAD14" />
                      <div
                        className="kpi-performance-pill"
                        style={getPerformanceLevel(data.successKpi.overallPercentage)}
                      >
                        {getPerformanceLevel(data.successKpi.overallPercentage).label} Performance
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Click to see weekly %</Text>
                    </Space>
                  </Card>
                </Col>
                )}
              </Row>
            )}

            {/* Checklist */}
            {checklist && (
              <Card
                className="kpi-section-card"
                title={
                  <Space>
                    <CheckSquareOutlined />
                    Checklist (Weekly: {checklist.weeklyPercentage ?? 0}%)
                  </Space>
                }
              >
                {(checklist.rows?.length ?? 0) > 0 ? (
                  <Table
                    size="small"
                    dataSource={checklist.rows?.map((r, i) => ({ ...r, key: i })) ?? []}
                    columns={[
                      { title: 'Task', dataIndex: 'task_name', key: 'task_name' },
                      { title: 'Frequency', dataIndex: 'frequency', key: 'frequency', width: 100 },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        width: 120,
                        render: (s: string) => {
                          const done = (s || '').toLowerCase() === 'done'
                          return (
                            <Tag
                              style={done
                                ? {
                                    background: 'rgba(40,167,69,0.1)',
                                    color: '#28A745',
                                    borderColor: 'rgba(40,167,69,0.2)',
                                  }
                                : {
                                    background: 'rgba(255,193,7,0.1)',
                                    color: '#FFC107',
                                    borderColor: 'rgba(255,193,7,0.2)',
                                  }}
                            >
                              {done ? 'Completed' : 'Pending'}
                            </Tag>
                          )
                        },
                      },
                    ]}
                    pagination={false}
                  />
                ) : (
                  <Text type="secondary">No checklist occurrences for this week. Try another week or month.</Text>
                )}
              </Card>
            )}

            {/* Delegation */}
            {delegation && (
              <Card
                className="kpi-section-card"
                title={
                  <Space>
                    <SwapOutlined />
                    Delegation (Weekly: {delegation.weeklyPercentage ?? 0}%)
                  </Space>
                }
              >
                {(delegation.rows?.length ?? 0) > 0 ? (
                  <Table
                    size="small"
                    dataSource={delegation.rows?.map((r, i) => ({ ...r, key: i })) ?? []}
                    columns={[
                      { title: 'Task', dataIndex: 'task', key: 'task' },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        width: 140,
                        render: (s: string) => {
                          const v = (s || '').toLowerCase()
                          if (v === 'completed') {
                            return (
                              <Tag
                                style={{
                                  background: 'rgba(40,167,69,0.1)',
                                  color: '#28A745',
                                  borderColor: 'rgba(40,167,69,0.2)',
                                }}
                              >
                                Completed
                              </Tag>
                            )
                          }
                          if (v === 'in progress') {
                            return (
                              <Tag
                                style={{
                                  background: 'rgba(23,162,184,0.1)',
                                  color: '#17A2B8',
                                  borderColor: 'rgba(23,162,184,0.2)',
                                }}
                              >
                                In Progress
                              </Tag>
                            )
                          }
                          return (
                            <Tag
                              style={{
                                background: 'rgba(255,193,7,0.1)',
                                color: '#FFC107',
                                borderColor: 'rgba(255,193,7,0.2)',
                              }}
                            >
                              Pending
                            </Tag>
                          )
                        },
                      },
                      { title: 'Shifted Week', dataIndex: 'shifted_week', key: 'shifted_week', width: 100 },
                      { title: 'Month', dataIndex: 'month', key: 'month', width: 80 },
                    ]}
                    pagination={false}
                  />
                ) : (
                  <Text type="secondary">No delegation tasks for this week. Try another week or month.</Text>
                )}
              </Card>
            )}

            {/* Support FMS – Shreyasi only; clickable cards open detail modal; show Weekly % in title */}
            {supportFMS && selectedPerson === 'Shreyasi' && (
              <Card className="kpi-section-card kpi-section-card--support-fms" title={<Space><CustomerServiceOutlined /><span className="support-fms-heading">Support FMS (Weekly: {supportFMS.weeklyPercentage ?? 0}%)</span></Space>}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Card
                      size="small"
                      title="Response Delay"
                      hoverable
                      onClick={() => {
                        const items = supportFMS.responseDelay?.details ?? []
                        setDetailModal({ title: 'Response Delay – Details', items })
                      }}
                      className="kpi-support-card kpi-support-card--response"
                      style={{ cursor: 'pointer', borderTop: '3px solid #FFC107' }}
                      extra={((supportFMS.responseDelay?.details?.length) ?? 0) > 0 ? <UnorderedListOutlined title="Click to view list" /> : null}
                    >
                      <Text strong style={{ color: '#FFC107' }}>{supportFMS.responseDelay?.value ?? 0}</Text> / {supportFMS.responseDelay?.target ?? 0}
                      {supportFMS.responseDelay?.percentage != null && (
                        <Text type="secondary"> ({supportFMS.responseDelay.percentage})</Text>
                      )}
                      {((supportFMS.responseDelay?.details?.length) ?? 0) > 0 && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#FFC107' }}>Click to view list ({supportFMS.responseDelay!.details!.length})</div>
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card
                      size="small"
                      title="Completion Delay"
                      hoverable
                      onClick={() => {
                        const items = supportFMS.completionDelay?.details ?? []
                        setDetailModal({ title: 'Completion Delay – Details', items })
                      }}
                      className="kpi-support-card kpi-support-card--completion"
                      style={{ cursor: 'pointer', borderTop: '3px solid #FFC107' }}
                      extra={((supportFMS.completionDelay?.details?.length) ?? 0) > 0 ? <UnorderedListOutlined title="Click to view list" /> : null}
                    >
                      <Text strong style={{ color: '#FFC107' }}>{supportFMS.completionDelay?.value ?? 0}</Text> / {supportFMS.completionDelay?.target ?? 0}
                      {supportFMS.completionDelay?.percentage != null && (
                        <Text type="secondary"> ({supportFMS.completionDelay.percentage})</Text>
                      )}
                      {((supportFMS.completionDelay?.details?.length) ?? 0) > 0 && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#FFC107' }}>Click to view list ({supportFMS.completionDelay!.details!.length})</div>
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card
                      size="small"
                      title="Pending Chores & Bugs"
                      hoverable
                      onClick={() => {
                        const items = supportFMS.pendingChores?.details ?? []
                        setDetailModal({ title: 'Pending Chores & Bugs – Details', items })
                      }}
                      className="kpi-support-card kpi-support-card--pending"
                      style={{ cursor: 'pointer', borderTop: '3px solid #FFC107' }}
                      extra={((supportFMS.pendingChores?.details?.length) ?? 0) > 0 ? <UnorderedListOutlined title="Click to view list" /> : null}
                    >
                      <Text strong style={{ color: '#FFC107' }}>{supportFMS.pendingChores?.value ?? 0}</Text> / {supportFMS.pendingChores?.target ?? 0}
                      {supportFMS.pendingChores?.percentage != null && (
                        <Text type="secondary"> ({supportFMS.pendingChores.percentage})</Text>
                      )}
                      {((supportFMS.pendingChores?.details?.length) ?? 0) > 0 && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#FFC107' }}>Click to view list ({supportFMS.pendingChores!.details!.length})</div>
                      )}
                    </Card>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Success KPI – Rimpa (Performance Monitoring): monthly % + detail cards */}
            {selectedPerson === 'Rimpa' && successKpi != null && (
              <Card
                className="kpi-section-card"
                title={
                  <Space>
                    <CustomerServiceOutlined />
                    Success KPI
                    <Tag color="gold" style={{ marginLeft: 8 }}>
                      {successKpi.overallPercentage ?? 0}% Overall (selected week)
                    </Tag>
                    {successKpi.meta?.weekLabel && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {successKpi.meta.weekLabel}
                      </Text>
                    )}
                  </Space>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={6}>
                    <Card
                      size="small"
                      className="kpi-success-card kpi-success-card--poc"
                      bordered={false}
                      title="POC Collected"
                      hoverable
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSuccessModal({ type: 'poc', title: 'POC Collected – Details' })}
                    >
                      <Title level={4} style={{ marginBottom: 4 }}>
                        {successKpi.pocCollected.currentValue}/{successKpi.pocCollected.targetValue || 0}
                      </Title>
                      <Text type="secondary">POC entries added this week</Text>
                    </Card>
                  </Col>
                  <Col xs={24} md={6}>
                    <Card
                      size="small"
                      className="kpi-success-card kpi-success-card--training"
                      bordered={false}
                      title="Weekly Training Target"
                      hoverable
                      onClick={() => setSuccessModal({ type: 'training', title: 'Weekly Training Target – Details' })}
                    >
                      <Title level={4} style={{ marginBottom: 4 }}>
                        {successKpi.weeklyTrainingTarget.currentValue}/{successKpi.weeklyTrainingTarget.targetValue || 0}
                      </Title>
                      <Text type="secondary">Trainings completed this week</Text>
                    </Card>
                  </Col>
                  <Col xs={24} md={6}>
                    <Card
                      size="small"
                      className="kpi-success-card kpi-success-card--followup"
                      bordered={false}
                      title="Training Follow-up"
                      hoverable
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSuccessModal({ type: 'followup', title: 'Training Follow-up – Details' })}
                    >
                      <Title level={4} style={{ marginBottom: 4 }}>
                        {successKpi.trainingFollowUp.currentValue}/{successKpi.trainingFollowUp.targetValue || 0}
                      </Title>
                      <Text type="secondary">Follow-up calls logged</Text>
                    </Card>
                  </Col>
                  <Col xs={24} md={6}>
                    <Card
                      size="small"
                      className="kpi-success-card kpi-success-card--increase"
                      bordered={false}
                      title="Success Increase"
                      hoverable
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSuccessModal({ type: 'increase', title: 'Success Increase – Details' })}
                    >
                      <Title level={4} style={{ marginBottom: 4 }}>
                        {successKpi.successIncrease.currentValue}/{successKpi.successIncrease.targetValue || 0}
                      </Title>
                      <Text type="secondary">Companies with usage increase</Text>
                    </Card>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Detail modal for Success KPI cards */}
            {successKpi && successModal && selectedPerson === 'Rimpa' && (
              <Modal
                title={successModal.title}
                open={!!successModal}
                onCancel={() => setSuccessModal(null)}
                footer={null}
                width={900}
                className="kpi-modal"
              >
                {successModal.type === 'poc' && (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Alert
                      type="info"
                      showIcon
                      message="POC Collected (selected week)"
                      description={
                        <>
                          Count on the card ={' '}
                          <strong>
                            {successKpi.pocCollected.currentValue}/{successKpi.pocCollected.targetValue ?? 16}
                          </strong>
                          : every Performance Monitoring POC with <strong>created date</strong> in this week. Rows
                          below match that count.
                        </>
                      }
                    />
                    <Table
                      size="small"
                      dataSource={(successKpi.pocCollected.details?.companies ?? []).map((company, i) => ({
                        key: i,
                        reference: successKpi.pocCollected.details.referenceNumbers?.[i] ?? '',
                        company,
                        messageOwner: successKpi.pocCollected.details.messageOwner?.[i] ?? '',
                        date: successKpi.pocCollected.details.dates?.[i] ?? '',
                        response: successKpi.pocCollected.details.responses?.[i] ?? '',
                        contact: successKpi.pocCollected.details.contacts?.[i] ?? '',
                      }))}
                      columns={[
                        { title: 'Reference', dataIndex: 'reference', key: 'reference', width: 120 },
                        { title: 'Company', dataIndex: 'company', key: 'company', width: 160, ellipsis: false, render: (v: string) => <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: 'block' }}>{v ?? '—'}</span> },
                        { title: 'Message Owner', dataIndex: 'messageOwner', key: 'messageOwner', width: 110 },
                        {
                          title: 'Entered at',
                          dataIndex: 'date',
                          key: 'date',
                          width: 160,
                          render: (v: string) => formatQueryArrival(v),
                        },
                        { title: 'Response', dataIndex: 'response', key: 'response' },
                        { title: 'Contact', dataIndex: 'contact', key: 'contact', width: 140 },
                      ]}
                      pagination={{ pageSize: 10 }}
                    />
                  </Space>
                )}
                {successModal.type === 'training' && (
                  <Table
                    size="small"
                    dataSource={(successKpi.weeklyTrainingTarget.details?.companies ?? []).map((company, i) => ({
                      key: i,
                      company,
                      callPOC: successKpi.weeklyTrainingTarget.details.callPOC?.[i] ?? '',
                      messagePOC: successKpi.weeklyTrainingTarget.details.messagePOC?.[i] ?? '',
                      trainingDate: successKpi.weeklyTrainingTarget.details.trainingDates?.[i] ?? '',
                      status: successKpi.weeklyTrainingTarget.details.trainingStatus?.[i] ?? '',
                      remarks: successKpi.weeklyTrainingTarget.details.remarks?.[i] ?? '',
                    }))}
                    columns={[
                      { title: 'Company', dataIndex: 'company', key: 'company', width: 160, ellipsis: false, render: (v: string) => <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: 'block' }}>{v ?? '—'}</span> },
                      { title: 'Call POC', dataIndex: 'callPOC', key: 'callPOC', width: 90 },
                      { title: 'Message POC', dataIndex: 'messagePOC', key: 'messagePOC', width: 110 },
                      { title: 'Training Date', dataIndex: 'trainingDate', key: 'trainingDate', width: 130 },
                      { title: 'Status', dataIndex: 'status', key: 'status', width: 100 },
                      { title: 'Remarks', dataIndex: 'remarks', key: 'remarks' },
                    ]}
                    pagination={{ pageSize: 10 }}
                  />
                )}
                {successModal.type === 'followup' && (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Alert
                      type="info"
                      showIcon
                      message="Training Follow-up (selected week)"
                      description={
                        <>
                          Total toward KPI:{' '}
                          <strong>
                            {successKpi.trainingFollowUp.currentValue}/{successKpi.trainingFollowUp.targetValue ?? 25}
                          </strong>{' '}
                          = follow-up rows logged (
                          {successKpi.trainingFollowUp.details?.followupRowsWeek ?? '—'}) + &quot;Add follow-up&quot; button
                          clicks ({successKpi.trainingFollowUp.details?.clickCountWeek ?? '—'}).
                        </>
                      }
                    />
                    <Title level={5} style={{ margin: 0 }}>
                      Follow-up rows
                    </Title>
                    <Table
                      size="small"
                      dataSource={(successKpi.trainingFollowUp.details?.companies ?? []).map((company, i) => ({
                        key: `fu-${i}`,
                        company,
                        callDate: successKpi.trainingFollowUp.details.followupDates?.[i] ?? '',
                        before: successKpi.trainingFollowUp.details.beforePercentages?.[i] ?? null,
                        after: successKpi.trainingFollowUp.details.afterPercentages?.[i] ?? null,
                        feature: successKpi.trainingFollowUp.details.features?.[i]?.[0] ?? '',
                      }))}
                      columns={[
                        { title: 'Company', dataIndex: 'company', key: 'company', width: 160, ellipsis: false, render: (v: string) => <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: 'block' }}>{v ?? '—'}</span> },
                        { title: 'Feature', dataIndex: 'feature', key: 'feature', width: 120, ellipsis: true },
                        { title: 'Call Date', dataIndex: 'callDate', key: 'callDate', width: 130 },
                        { title: 'Before %', dataIndex: 'before', key: 'before', width: 100 },
                        { title: 'After %', dataIndex: 'after', key: 'after', width: 100 },
                      ]}
                      pagination={{ pageSize: 10 }}
                    />
                    {(successKpi.trainingFollowUp.details?.clickEventsWeek?.length ?? 0) > 0 && (
                      <>
                        <Title level={5} style={{ margin: 0 }}>
                          Follow-up button clicks (timestamps)
                        </Title>
                        <Table
                          size="small"
                          dataSource={(successKpi.trainingFollowUp.details.clickEventsWeek ?? []).map((row, i) => ({
                            key: `clk-${i}`,
                            company: row.company ?? '',
                            feature: row.feature ?? '',
                            clickedAt: row.clickedAt ?? '',
                          }))}
                          columns={[
                            { title: 'Company', dataIndex: 'company', key: 'company', width: 160, ellipsis: false, render: (v: string) => <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: 'block' }}>{v ?? '—'}</span> },
                            { title: 'Feature', dataIndex: 'feature', key: 'feature', width: 140 },
                            {
                              title: 'Clicked at',
                              dataIndex: 'clickedAt',
                              key: 'clickedAt',
                              width: 180,
                              render: (v: string) => formatQueryArrival(v),
                            },
                          ]}
                          pagination={{ pageSize: 10 }}
                        />
                      </>
                    )}
                  </Space>
                )}
                {successModal.type === 'increase' && (
                  <Table
                    size="small"
                    dataSource={(successKpi.successIncrease.details?.companies ?? []).map((company, i) => ({
                      key: i,
                      company,
                      callDate: successKpi.successIncrease.details.followupDates?.[i] ?? '',
                      before: successKpi.successIncrease.details.beforePercentages?.[i] ?? null,
                      after: successKpi.successIncrease.details.afterPercentages?.[i] ?? null,
                    }))}
                    columns={[
                      { title: 'Company', dataIndex: 'company', key: 'company', width: 160, ellipsis: false, render: (v: string) => <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: 'block' }}>{v ?? '—'}</span> },
                      { title: 'Call Date', dataIndex: 'callDate', key: 'callDate', width: 130 },
                      { title: 'Before %', dataIndex: 'before', key: 'before', width: 100 },
                      { title: 'After %', dataIndex: 'after', key: 'after', width: 100 },
                    ]}
                    pagination={{ pageSize: 10 }}
                  />
                )}
              </Modal>
            )}

            {/* Weekly % graph modal – opened when user clicks a monthly summary card */}
            <Modal
              title={graphModal ? `Weekly % – ${graphModal === 'checklist' ? 'Checklist' : graphModal === 'delegation' ? 'Delegation' : graphModal === 'supportFMS' ? 'Support FMS' : 'Success KPI'} (${month} ${year})` : ''}
              open={!!graphModal}
              onCancel={() => setGraphModal(null)}
              footer={null}
              width="min(96vw, 640)"
              className="kpi-modal kpi-graph-modal"
            >
              {graphModal && data?.weeklyProgress && (
                <div style={{ width: '100%', minHeight: 320 }}>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={(data.weeklyProgress.weeks ?? []).map((weekName, i) => ({
                        name: weekName,
                        percentage: graphModal === 'checklist'
                          ? (data.weeklyProgress!.checklist?.[i] ?? 0)
                          : graphModal === 'delegation'
                            ? (data.weeklyProgress!.delegation?.[i] ?? 0)
                            : graphModal === 'supportFMS'
                              ? (data.weeklyProgress!.supportFMS?.[i] ?? 0)
                              : (data.weeklyProgress!.successKpi?.[i] ?? 0),
                      }))}
                      margin={{ top: 16, right: 24, left: 0, bottom: 24 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                      <Tooltip formatter={(value: number) => [`${value}%`, 'Weekly %']} labelFormatter={(label) => `${label}`} />
                      <Bar
                        dataKey="percentage"
                        name="Weekly %"
                        fill={graphModal === 'checklist' ? '#4A6BFF' : graphModal === 'delegation' ? '#28A745' : graphModal === 'supportFMS' ? '#FFC107' : '#FAAD14'}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {graphModal && (!data?.weeklyProgress || (data.weeklyProgress.weeks?.length ?? 0) === 0) && (
                <Text type="secondary">No weekly data available for this month.</Text>
              )}
            </Modal>

            {/* Detail modal for Support FMS cards */}
            <Modal
              title={detailModal?.title}
              open={!!detailModal}
              onCancel={() => setDetailModal(null)}
              footer={null}
              width="min(96vw, 900px)"
              className="kpi-modal"
            >
              {detailModal && (
                <Table
                  size="small"
                  dataSource={detailModal.items.map((item, i) => ({ ...item, key: i }))}
                  scroll={{ x: 'max-content' }}
                  columns={[
                    { title: 'Ref', dataIndex: 'reference_no', key: 'reference_no', width: 100 },
                    { title: 'Type', dataIndex: 'type', key: 'type', width: 80 },
                    {
                      title: 'Company',
                      dataIndex: 'company',
                      key: 'company',
                      width: 160,
                      ellipsis: false,
                      render: (val: string) => (
                        <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: 'block' }}>
                          {val ?? '—'}
                        </span>
                      ),
                    },
                    {
                      title: 'Title & Description',
                      key: 'title_description',
                      width: 280,
                      ellipsis: true,
                      render: (_: unknown, record: SupportFmsDelayItem) => (
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          <span style={{ fontWeight: 600 }}>{record.title ?? '—'}</span>
                          {record.description ? (
                            <>
                              <br />
                              <span style={{ fontWeight: 400 }}>{record.description}</span>
                            </>
                          ) : null}
                        </div>
                      ),
                    },
                    { title: 'Query Arrival', dataIndex: 'query_arrival', key: 'query_arrival', width: 160, render: (v: string) => formatQueryArrival(v) },
                    ...(detailModal.title.startsWith('Pending Chores')
                      ? [
                          {
                            title: 'Delay (Stage 2)',
                            dataIndex: 'delay_time',
                            key: 'stage2_delay',
                            width: 140,
                            render: (v: string) => v ?? '—',
                          },
                        ]
                      : []),
                    ...(detailModal.title.startsWith('Response Delay') || detailModal.title.startsWith('Completion Delay')
                      ? [{ title: 'Delay / Note', dataIndex: 'delay_time', key: 'delay_time', width: 120, render: (v: string) => v ?? '—' }]
                      : []),
                  ]}
                  pagination={detailModal.items.length > 10 ? { pageSize: 10 } : false}
                />
              )}
              {detailModal && detailModal.items.length === 0 && (
                <Text type="secondary">No items in this list.</Text>
              )}
            </Modal>

            {!checklist && !delegation && !supportFMS && data.success && (
              <Card>
                <Text type="secondary">No data for the selected filters. Try another month, year, or week.</Text>
              </Card>
            )}
          </>
        )}

        {!loading && data?.success === false && (
          <Card>
            <Text type="danger">{data.error || 'Failed to load dashboard data.'}</Text>
          </Card>
        )}
      </Space>
    </div>
  )
}
