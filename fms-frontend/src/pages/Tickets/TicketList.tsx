import React, { useState, useEffect, useRef } from 'react'
import {
  Table,
  Input,
  Select,
  Space,
  Card,
  Typography,
  Tag,
  DatePicker,
  Button,
} from 'antd'
import { SearchOutlined, PhoneOutlined, MailOutlined, MessageOutlined, LinkOutlined } from '@ant-design/icons'
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom'
import { ticketsApi } from '../../api/tickets'
import { supportApi } from '../../api/support'
import { TicketDetailDrawer } from '../../components/tickets/TicketDetailDrawer'
import { ChoresBugsDetailDrawer } from '../../components/tickets/ChoresBugsDetailDrawer'
import { PrintExport } from '../../components/common/PrintExport'
import { formatDateTable, formatDuration, formatReplySla, getChoresBugsCurrentStage, TICKET_EXPORT_COLUMNS, buildTicketExportRow } from '../../utils/helpers'
import { useRole } from '../../hooks/useRole'
import type { Ticket } from '../../api/tickets'
import type { Company } from '../../api/support'
import { ROUTES } from '../../utils/constants'

const { Title } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

const cardStyle = {
  borderRadius: 12,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  border: 'none',
}

const getTypeColor = (type: string) => (type === 'chore' ? 'green' : type === 'bug' ? 'red' : 'blue')
const getPriorityColor = (p: string) => (p === 'high' ? 'red' : p === 'medium' ? 'gold' : 'green')
const getCommIcon = (v: string) => {
  if (v === 'phone') return <PhoneOutlined title="Phone" />
  if (v === 'mail') return <MailOutlined title="Mail" />
  if (v === 'whatsapp') return <MessageOutlined title="WhatsApp" />
  return '-'
}

const truncate = (text: string | undefined, len = 40) => {
  if (!text) return '-'
  return text.length > len ? `${text.slice(0, len)}...` : text
}

export const TicketList = () => {
  const navigate = useNavigate()
  const { canAccessApproval } = useRole()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [allTicketsForStageFilter, setAllTicketsForStageFilter] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [exportTickets, setExportTickets] = useState<Ticket[]>([])
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const typeFromUrl = searchParams.get('type') || new URLSearchParams(location.search).get('type') || ''
  const sectionFromUrl = searchParams.get('section') || new URLSearchParams(location.search).get('section') || ''
  const viewFromUrl = searchParams.get('view') === 'approval'
  const showStageFilter = sectionFromUrl === 'chores-bugs'

  useEffect(() => {
    if (viewFromUrl && !canAccessApproval) {
      navigate(ROUTES.DASHBOARD, { replace: true })
    }
  }, [viewFromUrl, canAccessApproval, navigate])
  const [searchInput, setSearchInput] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [drawerTicketId, setDrawerTicketId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: typeFromUrl,
    types_in: sectionFromUrl === 'chores-bugs' ? 'chore,bug' : sectionFromUrl === 'completed-chores-bugs' ? 'chore,bug' : '',
    company_id: '',
    priority: '',
    date_from: '',
    date_to: '',
    sort_by: 'created_at',
    sort_order: 'desc' as 'asc' | 'desc',
  })
  /** Stage filter: applies to table, Export and Print (filters current result set) */
  const [stageFilter, setStageFilter] = useState<string>('')

  useEffect(() => {
    const t = searchParams.get('type') || ''
    const s = searchParams.get('section') || ''
    const urlStatus = searchParams.get('status') || new URLSearchParams(location.search).get('status') || ''
    const urlDateFrom = searchParams.get('date_from') || new URLSearchParams(location.search).get('date_from') || ''
    const urlDateTo = searchParams.get('date_to') || new URLSearchParams(location.search).get('date_to') || ''
    const viewApproval = searchParams.get('view') === 'approval'
    setFilters((f) => {
      const next = { ...f }
      if (viewApproval) {
        next.type = 'feature'
        next.types_in = ''
        next.status = ''
        next.date_from = ''
        next.date_to = ''
      } else if (s === 'chores-bugs') {
        next.type = ''
        next.types_in = 'chore,bug'
        next.status = urlStatus || ''
        next.date_from = urlDateFrom || ''
        next.date_to = urlDateTo || ''
      } else if (s === 'completed-chores-bugs') {
        next.type = ''
        next.types_in = 'chore,bug'
        next.status = ''
        next.date_from = ''
        next.date_to = ''
      } else if (s === 'completed-feature') {
        next.type = 'feature'
        next.types_in = ''
        next.status = ''
        next.date_from = ''
        next.date_to = ''
      } else if (s === 'solutions') {
        next.type = ''
        next.types_in = ''
        next.status = ''
        next.date_from = ''
        next.date_to = ''
      } else if (t) {
        next.type = t
        next.types_in = ''
        next.date_from = ''
        next.date_to = ''
      }
      return next
    })
  }, [searchParams])

  useEffect(() => {
    supportApi.getCompanies().then(setCompanies).catch(() => setCompanies([]))
  }, [])

  useEffect(() => {
    if (showStageFilter && stageFilter) {
      // When stage filter is active, fetch all pages then filter client-side
      fetchAllTicketsForStageFilter()
    } else {
      // Reset stage filter state when filter is cleared
      if (allTicketsForStageFilter.length > 0) {
        setAllTicketsForStageFilter([])
      }
      fetchTickets()
    }
  }, [page, pageSize, filters, viewFromUrl, stageFilter, showStageFilter])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const response = await ticketsApi.list({
        page,
        limit: pageSize,
        ...(filters.search && { search: filters.search }),
        ...(sectionFromUrl !== 'completed-chores-bugs' && sectionFromUrl !== 'solutions' && sectionFromUrl !== 'completed-feature' && filters.status && { status: filters.status }),
        ...(sectionFromUrl !== 'completed-chores-bugs' && sectionFromUrl !== 'solutions' && sectionFromUrl !== 'completed-feature' && filters.types_in && { types_in: filters.types_in }),
        ...(sectionFromUrl !== 'completed-chores-bugs' && sectionFromUrl !== 'solutions' && sectionFromUrl !== 'completed-feature' && !filters.types_in && filters.type && { type: filters.type }),
        ...(sectionFromUrl === 'chores-bugs' && { section: 'chores-bugs' }),
        ...(sectionFromUrl === 'completed-chores-bugs' && { section: 'completed-chores-bugs' }),
        ...(sectionFromUrl === 'solutions' && { section: 'solutions' }),
        ...(viewFromUrl && { section: 'approval-status' }),
        ...(filters.company_id && { company_id: filters.company_id }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to }),
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      })
      const raw = response && typeof response === 'object' ? (response as { data?: Ticket[] }).data : undefined
      setTickets(Array.isArray(raw) ? raw : [])
      setTotal((response as { total?: number })?.total ?? 0)
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  /** Fetches all tickets across pages with current filters/section/view. Used for stage filter and export. */
  const fetchAllTicketsWithFilters = async (): Promise<Ticket[]> => {
    const allTickets: Ticket[] = []
    let currentPage = 1
    const limit = 100
    let hasMore = true
    while (hasMore) {
      const response = await ticketsApi.list({
        page: currentPage,
        limit,
        ...(filters.search && { search: filters.search }),
        ...(sectionFromUrl !== 'completed-chores-bugs' && sectionFromUrl !== 'solutions' && sectionFromUrl !== 'completed-feature' && filters.status && { status: filters.status }),
        ...(sectionFromUrl !== 'completed-chores-bugs' && sectionFromUrl !== 'solutions' && sectionFromUrl !== 'completed-feature' && filters.types_in && { types_in: filters.types_in }),
        ...(sectionFromUrl !== 'completed-chores-bugs' && sectionFromUrl !== 'solutions' && sectionFromUrl !== 'completed-feature' && !filters.types_in && filters.type && { type: filters.type }),
        ...(sectionFromUrl === 'chores-bugs' && { section: 'chores-bugs' }),
        ...(sectionFromUrl === 'completed-chores-bugs' && { section: 'completed-chores-bugs' }),
        ...(sectionFromUrl === 'solutions' && { section: 'solutions' }),
        ...(viewFromUrl && { section: 'approval-status' }),
        ...(filters.company_id && { company_id: filters.company_id }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to }),
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      })
      const raw = response && typeof response === 'object' ? (response as { data?: Ticket[] }).data : undefined
      const pageTickets: Ticket[] = Array.isArray(raw) ? raw : []
      allTickets.push(...pageTickets)
      hasMore = pageTickets.length === limit
      currentPage++
    }
    return allTickets
  }

  const fetchAllTicketsForStageFilter = async () => {
    setLoading(true)
    try {
      const allTickets = await fetchAllTicketsWithFilters()
      setAllTicketsForStageFilter(allTickets)
      const filtered = stageFilter
        ? allTickets.filter((t) => getChoresBugsCurrentStage(t).stageLabel === stageFilter)
        : allTickets
      setTickets(filtered.slice((page - 1) * pageSize, page * pageSize))
      setTotal(filtered.length)
    } catch (error) {
      console.error('Failed to fetch all tickets for stage filter:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllForExport = async (): Promise<Ticket[]> => fetchAllTicketsWithFilters()

  const fetchTicketsRef = useRef(fetchTickets)
  fetchTicketsRef.current = fetchTickets
  useEffect(() => {
    const onTicketCreated = () => fetchTicketsRef.current()
    window.addEventListener('support-ticket-created', onTicketCreated)
    return () => window.removeEventListener('support-ticket-created', onTicketCreated)
  }, [])

  const handleSearch = () => {
    setFilters((f) => ({ ...f, search: searchInput }))
    setPage(1)
  }

  const handleDateRange = (_: unknown, dateStrings: [string, string]) => {
    const from = dateStrings[0] ? `${dateStrings[0]}T00:00:00.000Z` : ''
    const to = dateStrings[1] ? `${dateStrings[1]}T23:59:59.999Z` : ''
    setFilters((f) => ({ ...f, date_from: from, date_to: to }))
    setPage(1)
  }

  const isChoresBugs = sectionFromUrl === 'chores-bugs' || sectionFromUrl === 'completed-chores-bugs' || sectionFromUrl === 'solutions'
  const isSolutionsSection = sectionFromUrl === 'solutions'

  /** When stage filter is set (Chores & Bugs only), filter tickets for table, Export and Print */
  const ticketsForDisplay =
    showStageFilter && stageFilter
      ? tickets.filter((t) => getChoresBugsCurrentStage(t).stageLabel === stageFilter)
      : tickets

  const getStageForExport = isChoresBugs
    ? (t: Record<string, unknown>) => getChoresBugsCurrentStage(t as Parameters<typeof getChoresBugsCurrentStage>[0])
    : undefined

  const handleExportClick = async () => {
    const allTickets = await fetchAllForExport()
    const filteredForExport = showStageFilter && stageFilter
      ? allTickets.filter((t) => getChoresBugsCurrentStage(t).stageLabel === stageFilter)
      : allTickets
    setExportTickets(filteredForExport)
  }

  const baseColumns = [
    {
      title: 'Timestamp',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      fixed: 'left' as const,
      sorter: true,
      render: (v: string) => formatDateTable(v),
    },
    {
      title: 'Company Name',
      dataIndex: 'company_name',
      key: 'company_name',
      width: 120,
      fixed: 'left' as const,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: 'User Name',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 100,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: 'Page',
      dataIndex: 'page_name',
      key: 'page_name',
      width: 100,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: 'Division',
      dataIndex: 'division_name',
      key: 'division_name',
      width: 100,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: 'Other Division',
      dataIndex: 'division_other',
      key: 'division_other',
      width: 110,
      ellipsis: true,
      render: (_: unknown, r: Ticket) => (r.division_name === 'Other' ? (r.division_other || '-') : ''),
    },
    {
      title: 'Attachment',
      dataIndex: 'attachment_url',
      key: 'attachment_url',
      width: 100,
      render: (v: string) => {
        if (!v || !v.trim()) return '-'
        const url = v.trim()
        const isExternal = url.startsWith('http://') || url.startsWith('https://')
        const handleClick = (e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
          if (isExternal) {
            window.open(url, '_blank', 'noopener,noreferrer')
          }
        }
        return (
          <a
            href={isExternal ? url : '#'}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            onClick={handleClick}
            title="View attachment (opens in new tab)"
          >
            <LinkOutlined /> View
          </a>
        )
      },
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 150,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 120,
      ellipsis: true,
      render: (v: string) => truncate(v, 30),
    },
    {
      title: 'Type of Request',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (v: string) => <Tag color={getTypeColor(v)}>{v === 'chore' ? 'Chores' : v === 'bug' ? 'Bug' : 'Feature'}</Tag>,
    },
    {
      title: 'Communicated Through',
      dataIndex: 'communicated_through',
      key: 'communicated_through',
      width: 100,
      render: (v: string) => getCommIcon(v),
    },
    {
      title: 'Submitted By',
      dataIndex: 'submitted_by',
      key: 'submitted_by',
      width: 110,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: 'Query Arrival',
      dataIndex: 'query_arrival_at',
      key: 'query_arrival_at',
      width: 140,
      render: (v: string) => formatDateTable(v),
    },
    {
      title: 'Quality of Response',
      dataIndex: 'quality_of_response',
      key: 'quality_of_response',
      width: 120,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: 'Customer Questions',
      dataIndex: 'customer_questions',
      key: 'customer_questions',
      width: 130,
      ellipsis: true,
      render: (v: string) => truncate(v, 25),
    },
    {
      title: 'Query Response',
      dataIndex: 'query_response_at',
      key: 'query_response_at',
      width: 140,
      render: (v: string) => formatDateTable(v),
    },
    ...(isChoresBugs
      ? [
          {
            title: 'Reply Status',
            key: 'reply_status',
            width: 120,
            render: (_: unknown, r: Ticket) => {
              const sla = formatReplySla(r.query_arrival_at, r.query_response_at)
              return (
                <Tag color={sla.status === 'on-time' ? 'green' : 'red'}>
                  {sla.text}
                </Tag>
              )
            },
          },
        ]
      : []),
    ...(!isChoresBugs
      ? [
          {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            width: 90,
            render: (_: unknown, r: Ticket) =>
              r.type === 'feature' ? (
                <Tag color={getPriorityColor(r.priority)}>{r.priority === 'high' ? 'Red' : r.priority === 'medium' ? 'Yellow' : 'Green'}</Tag>
              ) : (
                '-'
              ),
          },
          {
            title: 'Why Feature?',
            dataIndex: 'why_feature',
            key: 'why_feature',
            width: 100,
            ellipsis: true,
            render: (_: unknown, r: Ticket) => (r.type === 'feature' ? truncate(r.why_feature, 20) : ''),
          },
        ]
      : []),
    {
      title: 'Reference No',
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 100,
      render: (v: string) => v || '-',
    },
    ...(viewFromUrl
      ? [
          {
            title: 'Approval Status',
            key: 'approval_status',
            width: 120,
            render: (_: unknown, r: Ticket) => {
              const s = r.approval_status ?? 'Pending'
              const color = s === 'approved' ? 'green' : s === 'unapproved' ? 'orange' : 'default'
              return <Tag color={color}>{s}</Tag>
            },
          },
          {
            title: 'Approved By',
            dataIndex: 'approved_by_name',
            key: 'approved_by_name',
            width: 120,
            render: (v: string) => v || '-',
          },
          {
            title: 'Approved At',
            dataIndex: 'approval_actual_at',
            key: 'approval_actual_at',
            width: 140,
            render: (_: unknown, r: Ticket) =>
              formatDateTable(r.approval_actual_at || r.unapproval_actual_at) || '-',
          },
          {
            title: 'Source',
            dataIndex: 'approval_source',
            key: 'approval_source',
            width: 80,
            render: (v: string) => (v ? v.toUpperCase() : '-'),
          },
        ]
      : []),
  ]

  const choresBugsSlaColumns = sectionFromUrl === 'chores-bugs'
    ? [
        {
          title: 'Current Stage',
          key: 'current_stage',
          width: 100,
          ellipsis: false,
          render: (_: unknown, r: Ticket) => {
            const stage = getChoresBugsCurrentStage(r)
            return <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{stage.stageLabel}</span>
          },
        },
        {
          title: 'Planned',
          key: 'planned',
          width: 120,
          ellipsis: false,
          render: (_: unknown, r: Ticket) => {
            const stage = getChoresBugsCurrentStage(r)
            return <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{stage.planned}</span>
          },
        },
        {
          title: 'Actual',
          key: 'actual',
          width: 120,
          ellipsis: false,
          render: (_: unknown, r: Ticket) => {
            const stage = getChoresBugsCurrentStage(r)
            return <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{stage.actual}</span>
          },
        },
        {
          title: 'Status',
          key: 'sla_status',
          width: 100,
          ellipsis: false,
          render: (_: unknown, r: Ticket) => {
            const stage = getChoresBugsCurrentStage(r)
            return <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{stage.status}</span>
          },
        },
        {
          title: 'Time Delay',
          key: 'time_delay',
          width: 100,
          ellipsis: false,
          render: (_: unknown, r: Ticket) => {
            const stage = getChoresBugsCurrentStage(r)
            return <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{stage.timeDelay}</span>
          },
        },
      ]
    : []

  const completedChoresBugsQualityColumn = sectionFromUrl === 'completed-chores-bugs'
    ? [
        {
          title: 'Quality of Solution',
          dataIndex: 'quality_solution',
          key: 'quality_solution',
          width: 180,
          ellipsis: false,
          render: (v: string) => (
            <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{v || '-'}</span>
          ),
        },
      ]
    : []

  const solutionColumns = [
    {
      title: 'Timestamp',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => formatDateTable(v),
    },
    {
      title: 'Company Name',
      dataIndex: 'company_name',
      key: 'company_name',
      width: 140,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: 'Reference No',
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 110,
      render: (v: string) => v || '-',
    },
    {
      title: 'Quality of Solution',
      dataIndex: 'quality_solution',
      key: 'quality_solution',
      width: 200,
      ellipsis: true,
      render: (v: string) => truncate(v, 60),
    },
    {
      title: 'Submitted By',
      dataIndex: 'quality_solution_submitted_by',
      key: 'quality_solution_submitted_by',
      width: 130,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
  ]

  const columns = isSolutionsSection ? solutionColumns : [
    ...baseColumns,
    ...choresBugsSlaColumns,
    ...completedChoresBugsQualityColumn,
    ...(!isChoresBugs
      ? [
          {
            title: 'Approval Status',
            dataIndex: 'approval_status',
            key: 'approval_status',
            width: 110,
            render: (_: unknown, r: Ticket) =>
              r.type === 'feature' ? (
                <Tag color={r.approval_status === 'approved' ? 'green' : 'default'}>
                  {r.approval_status === 'approved' ? 'Approved' : 'Unapproved'}
                </Tag>
              ) : (
                '-'
              ),
          },
          {
            title: 'Actual Time',
            dataIndex: 'actual_time_seconds',
            key: 'actual_time_seconds',
            width: 100,
            render: (_: unknown, r: Ticket) => (r.type === 'feature' ? formatDuration(r.actual_time_seconds) : '-'),
          },
          {
            title: 'Remarks',
            dataIndex: 'remarks',
            key: 'remarks',
            width: 100,
            ellipsis: true,
            render: (_: unknown, r: Ticket) => (r.type === 'feature' ? truncate(r.remarks, 20) : '-'),
          },
        ]
      : []),
  ]

  const pageTitle =
    viewFromUrl
      ? 'Approval Status'
      : sectionFromUrl === 'chores-bugs'
        ? 'Chores & Bugs'
        : sectionFromUrl === 'completed-chores-bugs'
          ? 'Completed Chores & Bugs'
          : sectionFromUrl === 'completed-feature'
            ? 'Completed Feature'
            : sectionFromUrl === 'solutions'
              ? 'Solution'
              : typeFromUrl === 'feature'
                ? 'Feature'
                : 'All Tickets'

  const isCompletedChoresBugs = sectionFromUrl === 'completed-chores-bugs'

  const exportColumns = [...TICKET_EXPORT_COLUMNS]
  const exportRows = (exportTickets.length > 0 ? exportTickets : ticketsForDisplay).map((t) => buildTicketExportRow(t as unknown as Record<string, unknown>, getStageForExport))

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto' }}>
      {isCompletedChoresBugs && (
        <style>{`.completed-chores-bugs-wrap .ant-table-cell,
.completed-chores-bugs-wrap .ant-table-thead > tr > th { white-space: normal !important; word-break: break-word !important; }`}</style>
      )}
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Title
          level={2}
          style={{
            margin: 0,
            ...(isCompletedChoresBugs ? { whiteSpace: 'normal' as const, wordBreak: 'break-word' as const } : {}),
          }}
        >
          {pageTitle}
        </Title>
        <PrintExport pageTitle={pageTitle} exportData={{ columns: exportColumns, rows: exportRows }} exportFilename={`tickets_${sectionFromUrl || 'all'}`} onExportClick={handleExportClick} />
      </Space>

      <Card style={cardStyle} bodyStyle={{ padding: 24 }}>
        <Space style={{ marginBottom: 16, width: '100%' }} wrap>
          <Input
            placeholder="Global search..."
            prefix={<SearchOutlined />}
            style={{ width: 220 }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
          <Button type="primary" onClick={handleSearch}>
            Search
          </Button>
          <Select
            placeholder="Company"
            style={{ width: 150 }}
            value={filters.company_id || undefined}
            onChange={(v) => setFilters((f) => ({ ...f, company_id: v || '' }))}
            allowClear
          >
            {companies.map((c) => (
              <Option key={c.id} value={c.id}>
                {c.name}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Status"
            style={{ width: 130 }}
            value={filters.status || undefined}
            onChange={(v) => setFilters((f) => ({ ...f, status: v || '' }))}
            allowClear
          >
            <Option value="open">Open</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="resolved">Resolved</Option>
            <Option value="closed">Closed</Option>
            <Option value="cancelled">Cancelled</Option>
            <Option value="on_hold">On Hold</Option>
          </Select>
          <Select
            placeholder="Type"
            style={{ width: 120 }}
            value={filters.type || undefined}
            onChange={(v) => setFilters((f) => ({ ...f, type: v || '' }))}
            allowClear
          >
            <Option value="chore">Chores</Option>
            <Option value="bug">Bug</Option>
            <Option value="feature">Feature</Option>
          </Select>
          <Select
            placeholder="Priority"
            style={{ width: 110 }}
            value={filters.priority || undefined}
            onChange={(v) => setFilters((f) => ({ ...f, priority: v || '' }))}
            allowClear
          >
            <Option value="high">High</Option>
            <Option value="medium">Medium</Option>
            <Option value="low">Low</Option>
          </Select>
          {showStageFilter && (
            <Select
              placeholder="Stage"
              style={{ width: 140 }}
              value={stageFilter || undefined}
              onChange={(v) => {
                setStageFilter(v ?? '')
                setPage(1)
              }}
              allowClear
              aria-label="Filter by stage"
            >
              <Option value="Stage 1">Stage 1</Option>
              <Option value="Stage 2">Stage 2</Option>
              <Option value="Stage 3">Stage 3</Option>
              <Option value="Stage 4">Stage 4</Option>
            </Select>
          )}
          <RangePicker
            placeholder={['From', 'To']}
            onChange={handleDateRange}
            style={{ width: 240 }}
          />
        </Space>

        <Table
          className={isCompletedChoresBugs ? 'completed-chores-bugs-wrap' : undefined}
          columns={columns}
          dataSource={ticketsForDisplay}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: 'No tickets yet.' }}
          scroll={{ x: 2400, y: 'calc(100vh - 320px)' }}
          pagination={{
            current: page,
            pageSize,
            total: showStageFilter && stageFilter ? allTicketsForStageFilter.filter((t) => getChoresBugsCurrentStage(t).stageLabel === stageFilter).length : total,
            showSizeChanger: true,
            showTotal: (t) => `Total ${t} tickets`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (newPage, newPageSize) => {
              setPage(newPage)
              setPageSize(newPageSize || 20)
            },
          }}
          onChange={(_, __, sorter) => {
            const s = Array.isArray(sorter) ? sorter[0] : sorter
            if (s && 'field' in s && s.field) {
              setFilters((f) => ({
                ...f,
                sort_by: String(s.field),
                sort_order: s.order === 'ascend' ? 'asc' : 'desc',
              }))
              setPage(1)
            }
          }}
          onRow={(record) => ({
            onClick: () => setDrawerTicketId(record.id),
            style: { cursor: 'pointer' },
          })}
          size="small"
        />
      </Card>

      {isChoresBugs ? (
        <ChoresBugsDetailDrawer
          ticketId={drawerTicketId}
          open={!!drawerTicketId}
          onClose={() => setDrawerTicketId(null)}
          onUpdate={fetchTickets}
          readOnly={sectionFromUrl === 'completed-chores-bugs' || sectionFromUrl === 'solutions'}
        />
      ) : (
        <TicketDetailDrawer
          ticketId={drawerTicketId}
          open={!!drawerTicketId}
          onClose={() => setDrawerTicketId(null)}
          onUpdate={fetchTickets}
          readOnly={sectionFromUrl === 'completed-feature'}
          approvalMode={viewFromUrl}
        />
      )}
    </div>
  )
}
