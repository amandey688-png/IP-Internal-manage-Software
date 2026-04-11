import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import {
  Typography,
  Card,
  Button,
  Select,
  Row,
  Col,
  Table,
  Progress,
  Tag,
  Space,
  message,
  Modal,
  Alert,
  Spin,
  Tabs,
  Input,
  InputNumber,
  DatePicker,
} from 'antd'
import {
  DashboardOutlined,
  ArrowLeftOutlined,
  CheckSquareOutlined,
  SwapOutlined,
  CustomerServiceOutlined,
  UnorderedListOutlined,
  PieChartOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import './dashboard-kpi.css'
import {
  dashboardKpiApi,
  MONTHS,
  WEEKS,
  YEARS,
  type DashboardKpiPerson,
  type DashboardKpiResponse,
  type SupportFmsDelayItem,
  type AkashCustomerSupportBlock,
  type KpiDailyLogApiRow,
} from '../../api/dashboardKpi'
import { DashboardBlockSkeleton } from '../../components/common/skeletons'
import { getDefaultPreviousWeekFilter, maxWeekOfMonth, weekOfMonth } from './kpiWeekUtils'

const LazyWeeklyBarChart = lazy(() => import('./DashboardKPIWeeklyBarChart'))

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
  { key: 'Akash', label: 'Akash Dashboard' },
]

/** Pastel inner cards for Akash KPI pillars — same classes as Rimpa Success KPI */
const AKASH_KPI_PILLAR_CARD_CLASS: Record<string, string> = {
  item_cleaning: 'kpi-success-card--poc',
  customer_support: 'kpi-success-card--training',
  video_content: 'kpi-success-card--followup',
  ai_learning: 'kpi-success-card--increase',
}

/** Format ISO date/time as 'YYYY-MM-DD hh:mm AM/PM' for Query Arrival display */
const formatQueryArrival = (val: string | null | undefined): string => {
  if (!val) return '—'
  const d = dayjs(val)
  return d.isValid() ? d.format('YYYY-MM-DD hh:mm A') : String(val)
}

/** Table columns for Akash Customer Support ticket lists (tabs modal) */
const AKASH_CS_TABLE_COLUMNS = [
  { title: 'Ref', dataIndex: 'reference_no', key: 'reference_no', width: 100 },
  { title: 'Type', dataIndex: 'type', key: 'type', width: 80 },
  {
    title: 'Company',
    dataIndex: 'company',
    key: 'company',
    width: 140,
    ellipsis: false,
    render: (val: string) => (
      <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: 'block' }}>{val ?? '—'}</span>
    ),
  },
  {
    title: 'Submitted by',
    dataIndex: 'submitted_by',
    key: 'submitted_by',
    width: 110,
    ellipsis: true,
    render: (v: string) => v ?? '—',
  },
  {
    title: 'Status',
    dataIndex: 'ticket_status',
    key: 'ticket_status',
    width: 110,
    ellipsis: true,
    render: (v: string) => v ?? '—',
  },
  {
    title: 'Title & Description',
    key: 'title_description',
    width: 240,
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
  {
    title: 'Query Arrival',
    dataIndex: 'query_arrival',
    key: 'query_arrival',
    width: 140,
    render: (v: string) => formatQueryArrival(v),
  },
  {
    title: 'Note',
    dataIndex: 'delay_time',
    key: 'delay_note',
    width: 130,
    render: (v: string) => v ?? '—',
  },
]

type KpiDailyLogTableRow = KpiDailyLogApiRow & { dayName: string }

/** Entire calendar month ended before today (local) — log hidden until user picks a month in the modal. */
const isKpiLogMonthCompleted = (m: Dayjs) => m.endOf('month').isBefore(dayjs(), 'day')

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
  const previousWeekDefaults = getDefaultPreviousWeekFilter()
  const [selectedPerson, setSelectedPerson] = useState<DashboardKpiPerson | null>(forceOpen ? defaultPerson : null)
  const [month, setMonth] = useState<string>(MONTHS[previousWeekDefaults.monthIndex] ?? MONTHS[dayjs().month()])
  const [year, setYear] = useState<string>(previousWeekDefaults.year || String(dayjs().year()))
  const [week, setWeek] = useState<string>(`week ${previousWeekDefaults.week}`)
  const [data, setData] = useState<DashboardKpiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [detailModal, setDetailModal] = useState<{ title: string; items: SupportFmsDelayItem[] } | null>(null)
  const [akashCsModal, setAkashCsModal] = useState<AkashCustomerSupportBlock | null>(null)
  const [successModal, setSuccessModal] = useState<
    | null
    | {
        type: 'poc' | 'training' | 'followup' | 'increase'
        title: string
      }
  >(null)
  const [graphModal, setGraphModal] = useState<'checklist' | 'delegation' | 'supportFMS' | 'successKpi' | null>(null)
  const [kpiDailyLogOpen, setKpiDailyLogOpen] = useState(false)
  const [kpiDailyLogMonth, setKpiDailyLogMonth] = useState<Dayjs | null>(null)
  /** When false, completed (past) months stay hidden until the user changes the month filter. */
  const [kpiDailyLogTableVisible, setKpiDailyLogTableVisible] = useState(true)
  const [kpiDailyLogRows, setKpiDailyLogRows] = useState<KpiDailyLogTableRow[]>([])
  const [kpiDailyLogLoading, setKpiDailyLogLoading] = useState(false)
  const kpiDailyLogDirtyRef = useRef<Set<string>>(new Set())
  const kpiDailyLogRowsRef = useRef<KpiDailyLogTableRow[]>([])
  kpiDailyLogRowsRef.current = kpiDailyLogRows

  const loadKpiDailyLogMonth = useCallback(async () => {
    if (!kpiDailyLogMonth) return
    const y = kpiDailyLogMonth.year()
    const mi = kpiDailyLogMonth.month()
    setKpiDailyLogLoading(true)
    try {
      const res = await dashboardKpiApi.getKpiDailyLog(y, mi + 1)
      const byDate = new Map((res.rows ?? []).map((r) => [r.work_date, r]))
      const base = kpiDailyLogMonth.date(1)
      const n = base.daysInMonth()
      const next: KpiDailyLogTableRow[] = []
      for (let d = 1; d <= n; d += 1) {
        const dj = base.date(d)
        const iso = dj.format('YYYY-MM-DD')
        const ex = byDate.get(iso)
        next.push({
          work_date: iso,
          dayName: dj.format('dddd'),
          items_cleaned: ex?.items_cleaned ?? null,
          errors_found: ex?.errors_found ?? null,
          accuracy_pct: ex?.accuracy_pct ?? null,
          videos_created: ex?.videos_created ?? null,
          video_type: ex?.video_type ?? null,
          ai_tasks_used: ex?.ai_tasks_used ?? null,
          process_improved: ex?.process_improved ?? null,
        })
      }
      setKpiDailyLogRows(next)
      kpiDailyLogDirtyRef.current = new Set()
    } catch {
      message.error('Failed to load KPI daily work log')
    } finally {
      setKpiDailyLogLoading(false)
    }
  }, [kpiDailyLogMonth])

  const openKpiDailyLog = useCallback(() => {
    const y = Number(year)
    const mi = MONTHS.indexOf(month as (typeof MONTHS)[number])
    if (!Number.isFinite(y) || mi < 0) {
      message.error('Pick month and year on the dashboard first')
      return
    }
    const m = dayjs().year(y).month(mi).date(1)
    setKpiDailyLogMonth(m)
    const completed = isKpiLogMonthCompleted(m)
    setKpiDailyLogTableVisible(!completed)
    if (completed) {
      setKpiDailyLogRows([])
      kpiDailyLogDirtyRef.current = new Set()
    }
    setKpiDailyLogOpen(true)
  }, [month, year])

  useEffect(() => {
    if (!kpiDailyLogOpen || !kpiDailyLogMonth || !kpiDailyLogTableVisible) return
    void loadKpiDailyLogMonth()
  }, [kpiDailyLogOpen, kpiDailyLogMonth, kpiDailyLogTableVisible, loadKpiDailyLogMonth])

  const patchKpiDailyLogRow = (workDate: string, patch: Partial<KpiDailyLogApiRow>) => {
    kpiDailyLogDirtyRef.current.add(workDate)
    setKpiDailyLogRows((rows) => rows.map((r) => (r.work_date === workDate ? { ...r, ...patch } : r)))
  }

  const saveKpiDailyLogChanges = async () => {
    if (!kpiDailyLogTableVisible) {
      message.info('Choose a month in the date filter to show the log before saving.')
      return
    }
    const dirty = new Set(kpiDailyLogDirtyRef.current)
    if (dirty.size === 0) {
      message.info('No changes to save')
      return
    }
    try {
      for (const wd of dirty) {
        const r = kpiDailyLogRowsRef.current.find((x) => x.work_date === wd)
        if (!r) continue
        await dashboardKpiApi.putKpiDailyLog({
          work_date: r.work_date,
          items_cleaned: r.items_cleaned ?? null,
          errors_found: r.errors_found ?? null,
          accuracy_pct: r.accuracy_pct ?? null,
          videos_created: r.videos_created ?? null,
          video_type: r.video_type?.trim() || null,
          ai_tasks_used: r.ai_tasks_used ?? null,
          process_improved: r.process_improved ?? null,
        })
      }
      kpiDailyLogDirtyRef.current.clear()
      message.success('KPI daily log saved')
      loadData()
    } catch {
      message.error('Could not save KPI daily log')
      throw new Error('save failed')
    }
  }

  // Keep week valid for selected month/year; avoids stale week value after filter changes.
  useEffect(() => {
    const monthIndex = MONTHS.findIndex((m) => m === month)
    if (monthIndex < 0) return
    const y = Number(year)
    if (!Number.isFinite(y)) return
    const maxWeek = maxWeekOfMonth(dayjs().year(y).month(monthIndex).date(1))
    const parsed = Number((week || '').replace(/[^\d]/g, '')) || weekOfMonth(dayjs())
    if (parsed > maxWeek) setWeek(`week ${maxWeek}`)
  }, [month, year, week])

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
  const monthly = data?.monthlyPercentages
  const checklist = data?.checklist
  const delegation = data?.delegation
  const supportFMS = data?.supportFMS
  const successKpi = data?.successKpi
  const akashKpi = data?.akashKpi
  const isAkashLayout = selectedPerson === 'Akash' && akashKpi != null

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

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 0,
          }}
        >
          <Title level={4} style={{ marginBottom: 0 }}>
            {selectedPerson} Dashboard
          </Title>
          {selectedPerson === 'Akash' && akashKpi?.kpiDailyLogEditor && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openKpiDailyLog}>
              Add KPI
            </Button>
          )}
        </div>

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

        {loading && <DashboardBlockSkeleton />}

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
                {selectedPerson === 'Akash' && akashKpi != null && (
                  <Col xs={24} sm={24} md={8}>
                    <Card
                      size="small"
                      title="KPI overall (weekly)"
                      className="kpi-summary-card kpi-summary-card--akash-overall"
                      style={{ borderTop: '3px solid #0d9488', cursor: 'default' }}
                    >
                      <Space direction="vertical" align="center">
                        <Progress
                          type="circle"
                          percent={akashKpi.overall_score_percent ?? 0}
                          size={80}
                          strokeColor="#0d9488"
                        />
                        <div
                          className="kpi-performance-pill"
                          style={getPerformanceLevel(akashKpi.overall_score_percent)}
                        >
                          {getPerformanceLevel(akashKpi.overall_score_percent).label} Performance
                        </div>
                        <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
                          {akashKpi.dailyLogWeekApplied
                            ? 'Includes Item cleaning / Video / AI from your KPI daily work log for the filter week (weights renormalize when categories are blank).'
                            : 'Same week as your filters: checklist + support chores/bugs (video and AI use daily log when entered).'}
                        </Text>
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

            <>
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

              {isAkashLayout && akashKpi && (
                <Card
                  className="kpi-section-card"
                  title={
                    <Space wrap>
                      <PieChartOutlined />
                      KPI
                      <Tag color="cyan" style={{ marginLeft: 4 }}>
                        {akashKpi.overall_score_percent ?? 0}% weekly overall ({week})
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Overall uses your filter week for checklist + support. Customer Support counts below use the
                        prior KPI week vs your filter (see Support data window).
                      </Text>
                    </Space>
                  }
                >
                  {akashKpi.customerSupport?.meta?.helpNote && (
                    <Alert
                      type="info"
                      showIcon
                      style={{ marginBottom: 12 }}
                      message="Support data window"
                      description={akashKpi.customerSupport.meta.helpNote}
                    />
                  )}
                  <Row gutter={[16, 16]}>
                    {akashKpi.pillars.map((pillar) => {
                      const cs = akashKpi.customerSupport
                      const isCs = pillar.key === 'customer_support'
                      const rd = cs?.responseDelayCount ?? 0
                      const cd = cs?.completionDelayCount ?? 0
                      const pd = cs?.pendingCount ?? 0
                      const total = cs?.totalIssues ?? 0
                      return (
                        <Col xs={24} md={6} key={pillar.key}>
                          <Card
                            size="small"
                            className={`kpi-success-card ${AKASH_KPI_PILLAR_CARD_CLASS[pillar.key] ?? 'kpi-success-card--poc'}${isCs ? ' kpi-akash-cs-card' : ''}`}
                            bordered={false}
                            title={pillar.title}
                            styles={
                              isCs
                                ? {
                                    header: { minHeight: 44, paddingTop: 10, paddingBottom: 10 },
                                    body: { paddingTop: 10 },
                                  }
                                : undefined
                            }
                            hoverable
                            style={{ cursor: isCs ? 'pointer' : 'default' }}
                            onClick={isCs ? () => setAkashCsModal(cs ?? null) : undefined}
                            extra={
                              isCs ? (
                                <UnorderedListOutlined title="View response / completion / pending lists" />
                              ) : null
                            }
                          >
                            {pillar.metrics.map((m) => (
                              <div key={m.label} style={{ fontSize: isCs ? 11 : 12, marginTop: 3, lineHeight: 1.35 }}>
                                <Text type="secondary">{m.label}: </Text>
                                <Text>{m.value}</Text>
                              </div>
                            ))}
                            {isCs && (
                              <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 8, lineHeight: 1.35 }}>
                                Click for lists · {total} in data week · resp delay {rd}, completion delay {cd},
                                pending {pd}
                              </Text>
                            )}
                          </Card>
                        </Col>
                      )
                    })}
                  </Row>
                </Card>
              )}
            </>

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
                <Suspense
                  fallback={
                    <div style={{ width: '100%', minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Spin tip="Loading chart…" />
                    </div>
                  }
                >
                  <LazyWeeklyBarChart graphModal={graphModal} weeklyProgress={data.weeklyProgress} />
                </Suspense>
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

            <Modal
              title="KPI daily work log"
              open={kpiDailyLogOpen}
              onCancel={() => setKpiDailyLogOpen(false)}
              width="min(98vw, 1280px)"
              className="kpi-modal"
              okText="Save changes"
              cancelText="Close"
              okButtonProps={{ disabled: !kpiDailyLogTableVisible }}
              onOk={() => saveKpiDailyLogChanges()}
              destroyOnClose
            >
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 12 }}
                message="One month at a time"
                description={
                  <>
                    Rows are generated for the full calendar month you select. When you first open this dialog, the
                    month comes from the dashboard <strong>{month}</strong> <strong>{year}</strong> filters. Past
                    months stay hidden until you change the <strong>Log month</strong> picker. The Akash KPI week still
                    uses rows whose dates fall in the selected KPI week.
                  </>
                }
              />
              <Row gutter={[16, 12]} align="middle" style={{ marginBottom: 12 }}>
                <Col xs={24} sm={12}>
                  <Text strong>Log month</Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Change the month to show the table (including completed months).
                    </Text>
                  </div>
                </Col>
                <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
                  <DatePicker
                    picker="month"
                    value={kpiDailyLogMonth}
                    format="MMM YYYY"
                    allowClear={false}
                    onChange={(d) => {
                      if (!d) return
                      const next = d.startOf('month')
                      setKpiDailyLogMonth(next)
                      setKpiDailyLogTableVisible(true)
                    }}
                  />
                </Col>
              </Row>
              {!kpiDailyLogTableVisible && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message="Table hidden for this completed month"
                  description="Pick another month above, or re-select the same month, to load the daily log."
                />
              )}
              <Spin spinning={kpiDailyLogLoading}>
                <Table<KpiDailyLogTableRow>
                  size="small"
                  rowKey="work_date"
                  dataSource={kpiDailyLogTableVisible ? kpiDailyLogRows : []}
                  scroll={{ x: 1180 }}
                  pagination={
                    kpiDailyLogTableVisible && kpiDailyLogRows.length > 0
                      ? { pageSize: 31, showSizeChanger: false, hideOnSinglePage: true }
                      : false
                  }
                  columns={[
                    {
                      title: 'Date',
                      dataIndex: 'work_date',
                      key: 'work_date',
                      width: 108,
                      fixed: 'left',
                      render: (iso: string) => dayjs(iso).format('D-MMM-YY'),
                    },
                    { title: 'Day', dataIndex: 'dayName', key: 'dayName', width: 92 },
                    {
                      title: 'Items cleaned',
                      key: 'items_cleaned',
                      width: 118,
                      render: (_: unknown, row) => (
                        <InputNumber
                          min={0}
                          controls={false}
                          style={{ width: '100%' }}
                          value={row.items_cleaned ?? undefined}
                          onChange={(v) => patchKpiDailyLogRow(row.work_date, { items_cleaned: v ?? null })}
                        />
                      ),
                    },
                    {
                      title: 'Errors found',
                      key: 'errors_found',
                      width: 110,
                      render: (_: unknown, row) => (
                        <InputNumber
                          min={0}
                          step={0.1}
                          controls={false}
                          style={{ width: '100%' }}
                          value={row.errors_found ?? undefined}
                          onChange={(v) => patchKpiDailyLogRow(row.work_date, { errors_found: v ?? null })}
                        />
                      ),
                    },
                    {
                      title: 'Videos created',
                      key: 'videos_created',
                      width: 118,
                      render: (_: unknown, row) => (
                        <InputNumber
                          min={0}
                          controls={false}
                          style={{ width: '100%' }}
                          value={row.videos_created ?? undefined}
                          onChange={(v) => patchKpiDailyLogRow(row.work_date, { videos_created: v ?? null })}
                        />
                      ),
                    },
                    {
                      title: 'Video type',
                      dataIndex: 'video_type',
                      key: 'video_type',
                      width: 120,
                      render: (_: string | null | undefined, row) => (
                        <Input
                          size="small"
                          placeholder="e.g. Short"
                          value={row.video_type ?? ''}
                          onChange={(e) => patchKpiDailyLogRow(row.work_date, { video_type: e.target.value || null })}
                        />
                      ),
                    },
                    {
                      title: 'AI tasks used',
                      key: 'ai_tasks_used',
                      width: 112,
                      render: (_: unknown, row) => (
                        <InputNumber
                          min={0}
                          controls={false}
                          style={{ width: '100%' }}
                          value={row.ai_tasks_used ?? undefined}
                          onChange={(v) => patchKpiDailyLogRow(row.work_date, { ai_tasks_used: v ?? null })}
                        />
                      ),
                    },
                    {
                      title: 'Process improved',
                      key: 'process_improved',
                      width: 120,
                      render: (_: unknown, row) => (
                        <InputNumber
                          min={0}
                          controls={false}
                          style={{ width: '100%' }}
                          value={row.process_improved ?? undefined}
                          onChange={(v) => patchKpiDailyLogRow(row.work_date, { process_improved: v ?? null })}
                        />
                      ),
                    },
                  ]}
                />
              </Spin>
            </Modal>

            <Modal
              title={
                akashCsModal
                  ? `Customer Support – Week ${akashCsModal.meta?.dataWeekNum ?? '—'} (${akashCsModal.meta?.dataRangeLabel ?? ''})`
                  : ''
              }
              open={!!akashCsModal}
              onCancel={() => setAkashCsModal(null)}
              footer={null}
              width="min(96vw, 960px)"
              className="kpi-modal"
            >
              {akashCsModal?.meta?.helpNote && (
                <Alert type="info" showIcon style={{ marginBottom: 12 }} message="Data window" description={akashCsModal.meta.helpNote} />
              )}
              {akashCsModal && (
                <Tabs
                  defaultActiveKey="response"
                  items={[
                    {
                      key: 'response',
                      label: `Response delays (${akashCsModal.responseDelayCount ?? 0})`,
                      children: (
                        <Table
                          size="small"
                          rowKey={(_, i) => `rd-${i}`}
                          dataSource={(akashCsModal.detailsResponseDelay ?? []).map((r, i) => ({ ...r, key: i }))}
                          columns={AKASH_CS_TABLE_COLUMNS.map((c) =>
                            c.key === 'delay_note' ? { ...c, title: 'Response SLA / note' } : c,
                          )}
                          pagination={(akashCsModal.detailsResponseDelay?.length ?? 0) > 10 ? { pageSize: 10 } : false}
                          scroll={{ x: 'max-content' }}
                        />
                      ),
                    },
                    {
                      key: 'completion',
                      label: `Completion delays (${akashCsModal.completionDelayCount ?? 0})`,
                      children: (
                        <Table
                          size="small"
                          rowKey={(_, i) => `cd-${i}`}
                          dataSource={(akashCsModal.detailsCompletionDelay ?? []).map((r, i) => ({ ...r, key: i }))}
                          columns={AKASH_CS_TABLE_COLUMNS.map((c) =>
                            c.key === 'delay_note' ? { ...c, title: 'Stage 2 completion note' } : c,
                          )}
                          pagination={(akashCsModal.detailsCompletionDelay?.length ?? 0) > 10 ? { pageSize: 10 } : false}
                          scroll={{ x: 'max-content' }}
                        />
                      ),
                    },
                    {
                      key: 'pending',
                      label: `Pending (${akashCsModal.pendingCount ?? 0})`,
                      children: (
                        <Table
                          size="small"
                          rowKey={(_, i) => `pd-${i}`}
                          dataSource={(akashCsModal.detailsPending ?? []).map((r, i) => ({ ...r, key: i }))}
                          columns={AKASH_CS_TABLE_COLUMNS.map((c) =>
                            c.key === 'delay_note' ? { ...c, title: 'Open vs Stage 2 SLA' } : c,
                          )}
                          pagination={(akashCsModal.detailsPending?.length ?? 0) > 10 ? { pageSize: 10 } : false}
                          scroll={{ x: 'max-content' }}
                        />
                      ),
                    },
                  ]}
                />
              )}
            </Modal>

            {!checklist && !delegation && !supportFMS && data.success && !akashKpi && (
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
