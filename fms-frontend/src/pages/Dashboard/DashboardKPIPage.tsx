import { useState, useEffect, useCallback } from 'react'
import { Typography, Card, Button, Select, Row, Col, Table, Progress, Tag, Space, Spin, message, Modal } from 'antd'
import { DashboardOutlined, ArrowLeftOutlined, CheckSquareOutlined, SwapOutlined, CustomerServiceOutlined, UnorderedListOutlined } from '@ant-design/icons'
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

const { Title, Text } = Typography

const DASHBOARD_OPTIONS: { key: DashboardKpiPerson; label: string }[] = [
  { key: 'Shreyasi', label: 'Shreyasi Dashboard' },
  { key: 'Rimpa', label: 'Rimpa Dashboard' },
]

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

export const DashboardKPIPage = () => {
  const [selectedPerson, setSelectedPerson] = useState<DashboardKpiPerson | null>(null)
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

  // Default filters: show data for the week prior to the current week
  useEffect(() => {
    const today = dayjs()
    const previousWeekDate = today.subtract(7, 'day')
    setMonth(MONTHS[previousWeekDate.month()])
    setYear(String(previousWeekDate.year()))
    const w = Math.ceil(previousWeekDate.date() / 7)
    setWeek(`week ${Math.min(w, 5)}`)
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
  if (selectedPerson === null) {
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
        <Space wrap>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setSelectedPerson(null)}>
            Back to dashboards
          </Button>
        </Space>

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
            {/* Monthly KPI summary */}
            {monthly && (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card
                    size="small"
                    title="Checklist (Monthly %)"
                    className="kpi-summary-card kpi-summary-card--checklist"
                    style={{ borderTop: '3px solid #4A6BFF' }}
                  >
                    <Space direction="vertical" align="center">
                      <Progress type="circle" percent={monthly.checklist ?? 0} size={80} strokeColor="#4A6BFF" />
                      <div
                        className="kpi-performance-pill"
                        style={getPerformanceLevel(monthly.checklist)}
                      >
                        {getPerformanceLevel(monthly.checklist).label} Performance
                      </div>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card
                    size="small"
                    title="Delegation (Monthly %)"
                    className="kpi-summary-card kpi-summary-card--delegation"
                    style={{ borderTop: '3px solid #28A745' }}
                  >
                    <Space direction="vertical" align="center">
                      <Progress type="circle" percent={monthly.delegation ?? 0} size={80} strokeColor="#28A745" />
                      <div
                        className="kpi-performance-pill"
                        style={getPerformanceLevel(monthly.delegation)}
                      >
                        {getPerformanceLevel(monthly.delegation).label} Performance
                      </div>
                    </Space>
                  </Card>
                </Col>
                {selectedPerson === 'Shreyasi' && (
                <Col xs={24} sm={8}>
                  <Card
                    size="small"
                    title="Support FMS (Monthly %)"
                    className="kpi-summary-card kpi-summary-card--support"
                    style={{ borderTop: '3px solid #FFC107' }}
                  >
                    <Space direction="vertical" align="center">
                      <Progress type="circle" percent={monthly.supportFMS ?? 0} size={80} strokeColor="#FFC107" />
                      <div
                        className="kpi-performance-pill"
                        style={getPerformanceLevel(monthly.supportFMS)}
                      >
                        {getPerformanceLevel(monthly.supportFMS).label} Performance
                      </div>
                    </Space>
                  </Card>
                </Col>
                )}
                {selectedPerson === 'Rimpa' && data?.successKpi != null && (
                <Col xs={24} sm={8}>
                  <Card
                    size="small"
                    title="Success KPI (Monthly %)"
                    className="kpi-summary-card kpi-summary-card--support"
                    style={{ borderTop: '3px solid #FAAD14' }}
                  >
                    <Space direction="vertical" align="center">
                      <Progress type="circle" percent={data.successKpi.overallPercentage ?? 0} size={80} strokeColor="#FAAD14" />
                      <div
                        className="kpi-performance-pill"
                        style={getPerformanceLevel(data.successKpi.overallPercentage)}
                      >
                        {getPerformanceLevel(data.successKpi.overallPercentage).label} Performance
                      </div>
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

            {/* Support FMS – Shreyasi only; clickable cards open detail modal */}
            {supportFMS && selectedPerson === 'Shreyasi' && (
              <Card className="kpi-section-card" title={<Space><CustomerServiceOutlined />Support FMS</Space>}>
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
                      {successKpi.overallPercentage ?? 0}% Overall (Monthly)
                    </Tag>
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
                      <Text type="secondary">Message owner confirmed</Text>
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
                  <Table
                    size="small"
                    dataSource={(successKpi.pocCollected.details?.companies ?? []).map((company, i) => ({
                      key: i,
                      company,
                      messageOwner: successKpi.pocCollected.details.messageOwner?.[i] ?? '',
                      date: successKpi.pocCollected.details.dates?.[i] ?? '',
                      response: successKpi.pocCollected.details.responses?.[i] ?? '',
                      contact: successKpi.pocCollected.details.contacts?.[i] ?? '',
                    }))}
                    columns={[
                      { title: 'Company', dataIndex: 'company', key: 'company', width: 150 },
                      { title: 'Message Owner', dataIndex: 'messageOwner', key: 'messageOwner', width: 120 },
                      { title: 'Date', dataIndex: 'date', key: 'date', width: 140 },
                      { title: 'Response', dataIndex: 'response', key: 'response' },
                      { title: 'Contact', dataIndex: 'contact', key: 'contact', width: 160 },
                    ]}
                    pagination={{ pageSize: 10 }}
                  />
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
                      { title: 'Company', dataIndex: 'company', key: 'company', width: 150 },
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
                  <Table
                    size="small"
                    dataSource={(successKpi.trainingFollowUp.details?.companies ?? []).map((company, i) => ({
                      key: i,
                      company,
                      callDate: successKpi.trainingFollowUp.details.followupDates?.[i] ?? '',
                      before: successKpi.trainingFollowUp.details.beforePercentages?.[i] ?? null,
                      after: successKpi.trainingFollowUp.details.afterPercentages?.[i] ?? null,
                    }))}
                    columns={[
                      { title: 'Company', dataIndex: 'company', key: 'company', width: 150 },
                      { title: 'Call Date', dataIndex: 'callDate', key: 'callDate', width: 130 },
                      { title: 'Before %', dataIndex: 'before', key: 'before', width: 100 },
                      { title: 'After %', dataIndex: 'after', key: 'after', width: 100 },
                    ]}
                    pagination={{ pageSize: 10 }}
                  />
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
                      { title: 'Company', dataIndex: 'company', key: 'company', width: 150 },
                      { title: 'Call Date', dataIndex: 'callDate', key: 'callDate', width: 130 },
                      { title: 'Before %', dataIndex: 'before', key: 'before', width: 100 },
                      { title: 'After %', dataIndex: 'after', key: 'after', width: 100 },
                    ]}
                    pagination={{ pageSize: 10 }}
                  />
                )}
              </Modal>
            )}

            {/* Detail modal for Support FMS cards */}
            <Modal
              title={detailModal?.title}
              open={!!detailModal}
              onCancel={() => setDetailModal(null)}
              footer={null}
              width={800}
              className="kpi-modal"
            >
              {detailModal && (
                <Table
                  size="small"
                  dataSource={detailModal.items.map((item, i) => ({ ...item, key: i }))}
                  columns={[
                    { title: 'Ref', dataIndex: 'reference_no', key: 'reference_no', width: 100 },
                    { title: 'Type', dataIndex: 'type', key: 'type', width: 80 },
                    { title: 'Company', dataIndex: 'company', key: 'company', ellipsis: true },
                    { title: 'Title', dataIndex: 'title', key: 'title', ellipsis: true },
                    { title: 'Query Arrival', dataIndex: 'query_arrival', key: 'query_arrival', width: 140 },
                    { title: 'Delay / Note', dataIndex: 'delay_time', key: 'delay_time', width: 100 },
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
