import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Table, Card, Typography, Tag, Select, Space } from 'antd'
import { PhoneOutlined, MailOutlined, MessageOutlined, LinkOutlined } from '@ant-design/icons'
import { ticketsApi } from '../../api/tickets'
import { formatDateTable, formatReplySla, getStagingCurrentStage, TICKET_EXPORT_COLUMNS, buildTicketExportRow } from '../../utils/helpers'
import type { Ticket } from '../../api/tickets'
import { StagingDetailDrawer } from '../../components/tickets/StagingDetailDrawer'
import { PrintExport } from '../../components/common/PrintExport'

const { Option } = Select

const { Title } = Typography

const getTypeColor = (type: string) => (type === 'chore' ? 'green' : type === 'bug' ? 'red' : 'blue')
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

/** Columns up to and including Reference No (tickets with Stage 2 Status = Staging) */
const stagingTicketColumns = [
  {
    title: 'Timestamp',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 140,
    render: (v: string) => formatDateTable(v),
  },
  {
    title: 'Company Name',
    dataIndex: 'company_name',
    key: 'company_name',
    width: 120,
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
      const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (url.startsWith('http://') || url.startsWith('https://')) {
          window.open(url, '_blank', 'noopener,noreferrer')
        }
      }
      return (
        <a href={url.startsWith('http') ? url : '#'} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
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
    render: (v: string) => (
      <Tag color={getTypeColor(v)}>{v === 'chore' ? 'Chores' : v === 'bug' ? 'Bug' : 'Feature'}</Tag>
    ),
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
  {
    title: 'Reference No',
    dataIndex: 'reference_no',
    key: 'reference_no',
    width: 100,
    render: (v: string) => v || '-',
  },
  {
    title: 'Current Stage',
    key: 'current_stage',
    width: 140,
    ellipsis: false,
    render: (_: unknown, r: Ticket) => {
      const stage = getStagingCurrentStage(r)
      return <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{stage.stageLabel}</span>
    },
  },
  {
    title: 'Planned',
    key: 'staging_planned',
    width: 120,
    ellipsis: false,
    render: (_: unknown, r: Ticket) => {
      const stage = getStagingCurrentStage(r)
      return <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{stage.planned}</span>
    },
  },
  {
    title: 'Actual',
    key: 'staging_actual',
    width: 120,
    ellipsis: false,
    render: (_: unknown, r: Ticket) => {
      const stage = getStagingCurrentStage(r)
      return <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{stage.actual}</span>
    },
  },
  {
    title: 'Status',
    key: 'staging_status',
    width: 100,
    ellipsis: false,
    render: (_: unknown, r: Ticket) => {
      const stage = getStagingCurrentStage(r)
      return <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{stage.status}</span>
    },
  },
  {
    title: 'Time Delay',
    key: 'staging_time_delay',
    width: 100,
    ellipsis: false,
    render: (_: unknown, r: Ticket) => {
      const stage = getStagingCurrentStage(r)
      return <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{stage.timeDelay}</span>
    },
  },
]

export const StagingList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const openId = searchParams.get('open')
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [drawerTicketId, setDrawerTicketId] = useState<string | null>(openId || null)
  /** Stage filter: applies to table, Export and Print */
  const [stageFilter, setStageFilter] = useState<string>('')
  const [allStagingTicketsForStageFilter, setAllStagingTicketsForStageFilter] = useState<Ticket[]>([])
  const [exportTickets, setExportTickets] = useState<Ticket[]>([])

  useEffect(() => {
    if (openId) setDrawerTicketId(openId)
  }, [openId])

  useEffect(() => {
    if (stageFilter) {
      // When stage filter is active, fetch all pages then filter client-side
      fetchAllStagingTicketsForStageFilter()
    } else {
      // Reset stage filter state when filter is cleared
      if (allStagingTicketsForStageFilter.length > 0) {
        setAllStagingTicketsForStageFilter([])
      }
      fetchStagingTickets()
    }
  }, [page, pageSize, stageFilter])

  const fetchStagingTickets = async () => {
    setLoading(true)
    try {
      const response = await ticketsApi.list({
        section: 'staging',
        page,
        limit: pageSize,
        sort_by: 'created_at',
        sort_order: 'desc',
      })
      const raw = response && typeof response === 'object' ? (response as { data?: Ticket[] }).data : undefined
      setTickets(Array.isArray(raw) ? raw : [])
      setTotal((response as { total?: number })?.total ?? 0)
    } catch (error) {
      console.error('Failed to fetch staging tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  /** Fetches all staging tickets across pages (section: staging, fixed sort). Used for stage filter and export. */
  const fetchAllStagingPages = async (): Promise<Ticket[]> => {
    const allTickets: Ticket[] = []
    let currentPage = 1
    const limit = 100
    let hasMore = true
    while (hasMore) {
      const response = await ticketsApi.list({
        section: 'staging',
        page: currentPage,
        limit,
        sort_by: 'created_at',
        sort_order: 'desc',
      })
      const raw = response && typeof response === 'object' ? (response as { data?: Ticket[] }).data : undefined
      const pageTickets: Ticket[] = Array.isArray(raw) ? raw : []
      allTickets.push(...pageTickets)
      hasMore = pageTickets.length === limit
      currentPage++
    }
    return allTickets
  }

  const fetchAllStagingTicketsForStageFilter = async () => {
    setLoading(true)
    try {
      const allTickets = await fetchAllStagingPages()
      setAllStagingTicketsForStageFilter(allTickets)
      const filtered = stageFilter
        ? allTickets.filter((t) => getStagingCurrentStage(t).stageLabel === stageFilter)
        : allTickets
      setTickets(filtered.slice((page - 1) * pageSize, page * pageSize))
      setTotal(filtered.length)
    } catch (error) {
      console.error('Failed to fetch all staging tickets for stage filter:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllForExport = async (): Promise<Ticket[]> => fetchAllStagingPages()

  const stagingStageLabels = ['Stage 1: Staging', 'Stage 2: Live', 'Stage 3: Live Review']
  const ticketsForDisplay = tickets
  const getStageForExport = (t: Record<string, unknown>) => getStagingCurrentStage(t as Parameters<typeof getStagingCurrentStage>[0])
  const exportColumns = [...TICKET_EXPORT_COLUMNS]
  const exportRows = (exportTickets.length > 0 ? exportTickets : ticketsForDisplay).map((t) => buildTicketExportRow(t as unknown as Record<string, unknown>, getStageForExport))

  const handleExportClick = async () => {
    const allTickets = await fetchAllForExport()
    const filteredForExport = stageFilter
      ? allTickets.filter((t) => getStagingCurrentStage(t).stageLabel === stageFilter)
      : allTickets
    setExportTickets(filteredForExport)
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          Staging
        </Title>
        <PrintExport pageTitle="Staging" exportData={{ columns: exportColumns, rows: exportRows }} exportFilename="staging_tickets" onExportClick={handleExportClick} />
      </div>
      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
            Tickets in Staging workflow (Stage 1–3). All columns up to Reference No. Click a row to open staging details.
          </Typography.Paragraph>
          <Select
            placeholder="Stage"
            style={{ width: 180 }}
            value={stageFilter || undefined}
            onChange={(v) => {
              setStageFilter(v ?? '')
              setPage(1)
            }}
            allowClear
            aria-label="Stage filter"
          >
            {stagingStageLabels.map((label) => (
              <Option key={label} value={label}>{label}</Option>
            ))}
          </Select>
        </Space>
        <Table
          columns={stagingTicketColumns}
          dataSource={ticketsForDisplay}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          onRow={(record) => ({
            onClick: () => setDrawerTicketId(record.id),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: page,
            pageSize,
            total: stageFilter ? allStagingTicketsForStageFilter.filter((t) => getStagingCurrentStage(t).stageLabel === stageFilter).length : total,
            showSizeChanger: true,
            showTotal: (t) => `Total ${t} tickets`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage)
              setPageSize(newPageSize ?? pageSize)
            },
          }}
        />
      </Card>
      <StagingDetailDrawer
        ticketId={drawerTicketId}
        open={!!drawerTicketId}
        onClose={() => {
          setDrawerTicketId(null)
          if (openId) setSearchParams({})
        }}
        onUpdate={() => {
          setDrawerTicketId(null)
          if (openId) setSearchParams({})
          fetchStagingTickets()
        }}
      />
    </div>
  )
}
