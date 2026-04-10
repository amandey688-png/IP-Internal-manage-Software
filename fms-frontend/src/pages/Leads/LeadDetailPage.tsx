import { useState, useEffect } from 'react'
import {
  Card,
  Typography,
  Button,
  Space,
  Modal,
  Form,
  message,
  Input,
  Descriptions,
  Segmented,
} from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { ROUTES } from '../../utils/constants'
import { leadsApi, LEAD_STAGE_ORDER, LEAD_STAGE_LABELS, type Lead } from '../../api/leads'
import {
  renderStageFormItems,
  getStageFormValuesForPayload,
  getInitialValuesFromData,
  getStageDisplayItems,
  STAGE_FIELDS,
} from './leadStageFields'
import { DetailPageSkeleton } from '../../components/common/skeletons'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'

const { Title, Text } = Typography

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000

export const LeadDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isUser } = useRole()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [stageModal, setStageModal] = useState<{ slug: string; title: string } | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [form] = Form.useForm()

  const loadLead = () => {
    if (!id) return
    setLoading(true)
    leadsApi
      .getByReference(id)
      .then(setLead)
      .catch(() => message.error('Failed to load lead'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadLead()
  }, [id])

  const filledSlugs = new Set(
    Object.keys(lead?.stage_data || {})
  )
  const nextSlugIndex = LEAD_STAGE_ORDER.findIndex((s) => !filledSlugs.has(s))
  const nextSlug = nextSlugIndex >= 0 ? LEAD_STAGE_ORDER[nextSlugIndex] : null

  const openStageModal = (slug: string) => {
    const title = LEAD_STAGE_LABELS[slug] || slug
    setStageModal({ slug, title })
    const data = lead?.stage_data?.[slug]?.data as Record<string, unknown> | undefined
    const initial = getInitialValuesFromData(data, slug)
    if (slug === 'demo_completed' && user?.full_name && !(initial as Record<string, string>)['demo_conducted_by'])
      (initial as Record<string, string>)['demo_conducted_by'] = user.full_name
    form.setFieldsValue(initial)
  }

  const handleStageSubmit = () => {
    if (!id || !lead || !stageModal || !canEditLead) return
    form.validateFields().then((values) => {
      const payload = getStageFormValuesForPayload(values, stageModal.slug)
      if (stageModal.slug === 'demo_completed' && user?.full_name && !payload['demo_conducted_by'])
        payload['demo_conducted_by'] = user.full_name
      setSubmitLoading(true)
      leadsApi
        .upsertStage(lead.id, stageModal.slug, payload)
        .then(() => {
          message.success('Saved')
          setStageModal(null)
          form.resetFields()
          loadLead()
        })
        .catch((err: { response?: { data?: { detail?: string } } }) => {
          const msg = err?.response?.data?.detail || 'Failed to save'
          message.error(msg)
        })
        .finally(() => setSubmitLoading(false))
    })
  }

  if (!id) {
    navigate(ROUTES.LEADS)
    return null
  }

  if (loading && !lead) {
    return <DetailPageSkeleton />
  }

  if (!lead) {
    return (
      <div style={{ padding: 24 }}>
        <Text type="danger">Lead not found.</Text>
        <Button type="link" onClick={() => navigate(ROUTES.LEADS)}>Back to list</Button>
      </div>
    )
  }

  const hasFields = (slug: string) => (STAGE_FIELDS[slug]?.length ?? 0) > 0

  // User role: not editable after 4 hours from lead creation (backend enforces same rule)
  const leadCreatedAt = lead?.created_at ? dayjs(lead.created_at).valueOf() : 0
  const now = dayjs().valueOf()
  const isWithin4Hours = now - leadCreatedAt <= FOUR_HOURS_MS
  const canEditLead = !isUser || isWithin4Hours

  // Completed stages in order (for display as separate cards, Support-style)
  const completedSlugs = LEAD_STAGE_ORDER.filter((s) => filledSlugs.has(s) && hasFields(s))

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }} wrap>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(ROUTES.LEADS)}>
          Back to Lead list
        </Button>
      </Space>

      <Card style={{ marginBottom: 24 }}>
        <Space wrap align="center" size="middle">
          <Text strong style={{ fontSize: 16 }}>
            {dayjs(lead.created_at).format('DD MMM YYYY HH:mm')}
          </Text>
          <Title level={4} style={{ margin: 0 }}>
            {lead.reference_no} – {lead.company_name}
          </Title>
          <Segmented
            value={lead.status}
            options={[
              { label: 'Open', value: 'Open' },
              { label: 'Closed', value: 'Closed' },
            ]}
            disabled={statusUpdating}
            onChange={async (value) => {
              const newStatus = value as string
              if (newStatus !== 'Open' && newStatus !== 'Closed' || newStatus === lead.status) return
              setStatusUpdating(true)
              try {
                await leadsApi.update(lead.id, { status: newStatus })
                message.success(newStatus === 'Closed' ? 'Lead marked as Closed. It will appear under Closed Leads.' : 'Lead reopened.')
                loadLead()
                if (newStatus === 'Closed') {
                  navigate(ROUTES.LEADS_CLOSED)
                }
              } catch {
                message.error('Failed to update status')
              } finally {
                setStatusUpdating(false)
              }
            }}
          />
          <Text type="secondary">Stage: {lead.stage}</Text>
          {lead.assigned_poc_name && <Text type="secondary">POC: {lead.assigned_poc_name}</Text>}
        </Space>
      </Card>

      {/* Completed stages: one card per stage with data (Support-style, 1 by 1) */}
      {completedSlugs.map((slug) => {
        const label = LEAD_STAGE_LABELS[slug] || slug
        const data = lead.stage_data?.[slug]?.data as Record<string, unknown> | undefined
        const items = getStageDisplayItems(slug, data)
        if (items.length === 0) return null
        return (
          <Card
            key={slug}
            style={{ marginBottom: 16, borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)' }}
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#22c55e' }} />
                <span>{label}</span>
                {canEditLead && (
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); openStageModal(slug) }}>
                    Edit
                  </Button>
                )}
              </Space>
            }
            size="small"
          >
            <Descriptions column={1} size="small" bordered>
              {items.map((item) => (
                <Descriptions.Item key={item.label} label={item.label}>
                  {item.value}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>
        )
      })}

      {/* Next stage: single button to open form (hidden if User and lead older than 4 hr) */}
      {nextSlug && hasFields(nextSlug) && (
        <Card title="Next step" style={{ marginBottom: 24, borderRadius: 8 }}>
          {canEditLead ? (
            <Button type="primary" icon={<EditOutlined />} onClick={() => openStageModal(nextSlug)}>
              {LEAD_STAGE_LABELS[nextSlug] || nextSlug} – Fill details
            </Button>
          ) : (
            <Text type="secondary">This lead can no longer be edited (4-hour limit for User role).</Text>
          )}
        </Card>
      )}

      {!canEditLead && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          This lead is read-only. Edits are allowed only within 4 hours of creation for User role.
        </Text>
      )}

      <Modal
        title={stageModal ? `${stageModal.title} – ${lead.reference_no}` : ''}
        open={!!stageModal}
        onOk={handleStageSubmit}
        onCancel={() => { setStageModal(null); form.resetFields() }}
        confirmLoading={submitLoading}
        destroyOnClose
        width={560}
      >
        {stageModal && (
          <Form form={form} layout="vertical">
            {stageModal.slug === 'demo_completed' && (
              <Form.Item label="Demo Conducted By" name="demo_conducted_by">
                <Input disabled placeholder="Logged-in user" />
              </Form.Item>
            )}
            {renderStageFormItems(stageModal.slug)}
          </Form>
        )}
      </Modal>
    </div>
  )
}
