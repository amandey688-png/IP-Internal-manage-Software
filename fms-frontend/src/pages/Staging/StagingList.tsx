import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Table, Card, Typography, Tag } from 'antd'
import { PhoneOutlined, MailOutlined, MessageOutlined, LinkOutlined } from '@ant-design/icons'
import { ticketsApi } from '../../api/tickets'
import { formatDateTable, formatReplySla, getStagingCurrentStage } from '../../utils/helpers'
import type { Ticket } from '../../api/tickets'
import { StagingDetailDrawer } from '../../components/tickets/StagingDetailDrawer'

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

  useEffect(() => {
    if (openId) setDrawerTicketId(openId)
  }, [openId])

  useEffect(() => {
    fetchStagingTickets()
  }, [page, pageSize])

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

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: 16 }}>
        Staging
      </Title>
      <Card>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Tickets in Staging workflow (Stage 1–3). All columns up to Reference No. Click a row to open staging details.
        </Typography.Paragraph>
        <Table
          columns={stagingTicketColumns}
          dataSource={tickets}
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
            total,
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
