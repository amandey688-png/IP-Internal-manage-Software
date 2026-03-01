import { useState, useEffect } from 'react'
import {
  Card,
  Typography,
  Form,
  Input,
  Select,
  Button,
  Table,
  message,
  Modal,
  Alert,
  Descriptions,
  Tabs,
  InputNumber,
} from 'antd'
import { PlusOutlined, LineChartOutlined, EditOutlined, FormOutlined, EyeOutlined } from '@ant-design/icons'
import { API_BASE_URL } from '../../api/axios'

const { Title } = Typography

const FETCH_TIMEOUT_MS = 15000

interface Company {
  id: string
  name: string
}

interface FeatureOption {
  id: string
  name: string
  display_order?: number
}

interface POCItem {
  id: string
  reference_no: string
  company_name: string
  message_owner: string
  response?: string
  contact?: string
  completion_status: string
  created_at: string
  total_percentage?: number | null
  has_training?: boolean
  feature_count?: number
  current_stage?: string
}

interface TicketDetails {
  id: string
  reference_no: string
  company_name: string
  message_owner: string
  response?: string
  contact?: string
  completion_status: string
  total_percentage?: number | null
  current_stage: string
  pending_features: string[]
  training?: Record<string, unknown>
  feature_ids: string[]
  features_locked?: boolean
  features_with_followups?: Array<{
    ticket_feature_id: string
    feature_name: string
    status: string
    followups: Array<Record<string, unknown>>
  }>
}

interface FollowupFeature {
  ticket_feature_id: string
  feature_id: string
  feature_name: string
  status: string
  followups: Array<{
    id: string
    previous_percentage?: number
    added_percentage?: number
    total_percentage?: number
    status: string
    remarks?: string
    created_at: string
  }>
}

export const PerformanceMonitoringPage = () => {
  const [form] = Form.useForm()
  const [trainingForm] = Form.useForm()
  const [followupForm] = Form.useForm()
  const [companies, setCompanies] = useState<Company[]>([])
  const [items, setItems] = useState<POCItem[]>([])
  const [features, setFeatures] = useState<FeatureOption[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [trainingModalOpen, setTrainingModalOpen] = useState(false)
  const [followupModalOpen, setFollowupModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<POCItem | null>(null)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('active')
  const [followupData, setFollowupData] = useState<{ features: FollowupFeature[]; total_percentage: number | null; initial_percentage: number | null; is_first_followup: boolean }>({ features: [], total_percentage: null, initial_percentage: null, is_first_followup: false })
  const [followupSubmitting, setFollowupSubmitting] = useState(false)
  const [featuresLocked, setFeaturesLocked] = useState(false)
  const [detailsData, setDetailsData] = useState<TicketDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [filterRef, setFilterRef] = useState<string>('')
  const [filterCompany, setFilterCompany] = useState<string>('')

  useEffect(() => {
    loadCompanies()
    loadItems()
    loadFeatures()
  }, [])

  useEffect(() => {
    loadItems()
  }, [activeTab])

  const fetchWithTimeout = (url: string, options: RequestInit = {}) => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id))
  }

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
  })
  const getAuthHeadersWithJson = () => ({
    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    'Content-Type': 'application/json',
  })

  const loadCompanies = async () => {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/companies`, { headers: getAuthHeaders() })
      if (res.ok) setCompanies((await res.json()) || [])
    } catch {
      message.error('Failed to load companies')
    }
  }

  const loadFeatures = async () => {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/success/performance/features`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setFeatures(data.items || [])
      }
    } catch {
      message.error('Failed to load features')
    }
  }

  const loadItems = async () => {
    setLoading(true)
    setSetupError(null)
    const status = activeTab === 'completed' ? 'completed' : 'in_progress'
    try {
      const res = await fetchWithTimeout(
        `${API_BASE_URL}/success/performance/list?completion_status=${status}`,
        { headers: getAuthHeaders() }
      )
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      } else if (res.status === 503) {
        const err = await res.json().catch(() => ({}))
        setSetupError(err?.detail || 'Database tables not set up.')
        setItems([])
      } else {
        setItems([])
      }
    } catch (e) {
      setItems([])
      if ((e as Error)?.name === 'AbortError') {
        setSetupError('Request timed out. Check backend and Supabase.')
      } else {
        setSetupError('Failed to load. Run database/SUCCESS_PERFORMANCE_MONITORING.sql in Supabase.')
      }
    } finally {
      setLoading(false)
    }
  }

  const openTrainingModal = async (record: POCItem) => {
    setSelectedItem(record)
    setTrainingModalOpen(true)
    setFeaturesLocked(false)
    try {
      const res = await fetchWithTimeout(
        `${API_BASE_URL}/success/performance/training?ticket_id=${record.id}`,
        { headers: getAuthHeaders() }
      )
      if (res.ok) {
        const data = await res.json()
        const t = data.training
        setFeaturesLocked(data.features_locked ?? false)
        if (t) {
          trainingForm.setFieldsValue({
            call_poc: t.call_poc ?? 'no',
            message_poc: t.message_poc ?? 'no',
            message_owner: t.message_owner ?? 'no',
            training_schedule_date: t.training_schedule_date || undefined,
            training_status: t.training_status ?? 'no',
            remarks: t.remarks,
            feature_ids: data.feature_ids || [],
          })
        } else {
          trainingForm.resetFields()
          trainingForm.setFieldsValue({
            call_poc: 'no',
            message_poc: 'no',
            message_owner: 'no',
            training_status: 'no',
            feature_ids: [],
          })
        }
      }
    } catch {
      message.error('Failed to load training data')
    }
  }

  const openFollowupModal = async (record: POCItem) => {
    setSelectedItem(record)
    setFollowupModalOpen(true)
    setFollowupData({ features: [], total_percentage: null, initial_percentage: null, is_first_followup: false })
    try {
      const res = await fetchWithTimeout(
        `${API_BASE_URL}/success/performance/followups?ticket_id=${record.id}`,
        { headers: getAuthHeaders() }
      )
      if (res.ok) {
        const data = await res.json()
        setFollowupData({
          features: data.features || [],
          total_percentage: data.total_percentage ?? null,
          initial_percentage: data.initial_percentage ?? null,
          is_first_followup: data.is_first_followup ?? false,
        })
        const lastTotal = data.total_percentage ?? 0
        followupForm.setFieldsValue({ previous_percentage: lastTotal, initial_percentage: data.initial_percentage ?? '' })
      }
    } catch {
      message.error('Failed to load followup data')
    }
  }

  const onFinish = async (values: {
    company_id: string
    message_owner: 'yes' | 'no'
    response: string
    contact: string
  }) => {
    setSubmitting(true)
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/success/performance/poc`, {
        method: 'POST',
        headers: getAuthHeadersWithJson(),
        body: JSON.stringify(values),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.id) {
        message.success(`POC created: ${data.reference_no}`)
        form.resetFields()
        setFormModalOpen(false)
        loadItems()
      } else {
        message.error(data?.detail || 'Failed to create POC')
      }
    } catch {
      message.error('Failed to create POC.')
    } finally {
      setSubmitting(false)
    }
  }

  const onTrainingFinish = async (values: {
    call_poc: string
    message_poc: string
    message_owner: string
    training_schedule_date?: string
    training_status: string
    remarks?: string
    feature_ids: string[]
  }) => {
    if (!selectedItem) return
    setSubmitting(true)
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/success/performance/training`, {
        method: 'POST',
        headers: getAuthHeadersWithJson(),
        body: JSON.stringify({
          ticket_id: selectedItem.id,
          call_poc: values.call_poc,
          message_poc: values.message_poc,
          message_owner: values.message_owner,
          training_schedule_date: values.training_schedule_date || null,
          training_status: values.training_status,
          remarks: values.remarks || null,
          feature_ids: values.feature_ids || [],
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        if (data.features_locked != null) setFeaturesLocked(data.features_locked)
        message.success('Training saved.')
        setTrainingModalOpen(false)
        loadItems()
      } else {
        message.error((data as { detail?: string })?.detail || 'Failed to save training')
      }
    } catch {
      message.error('Failed to save training')
    } finally {
      setSubmitting(false)
    }
  }

  const submitFollowup = async (ticketFeatureId: string) => {
    if (!selectedItem) return
    followupForm.setFieldsValue({ previous_percentage: followupData.total_percentage ?? 0 })
    const values = followupForm.getFieldsValue()
    const status = values.status || 'pending'
    setFollowupSubmitting(true)
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/success/performance/followup`, {
        method: 'POST',
        headers: getAuthHeadersWithJson(),
        body: JSON.stringify({
          ticket_id: selectedItem.id,
          ticket_feature_id: ticketFeatureId,
          initial_percentage: followupData.is_first_followup ? Number(values.initial_percentage) : undefined,
          status,
          remarks: values.remarks || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        message.success(`Followup saved. Total: ${data.total_percentage}%`)
        followupForm.setFieldsValue({ previous_percentage: data.total_percentage })
        setFollowupData((d) => ({ ...d, total_percentage: data.total_percentage }))
        const r = await fetchWithTimeout(
          `${API_BASE_URL}/success/performance/followups?ticket_id=${selectedItem.id}`,
          { headers: getAuthHeaders() }
        )
        if (r.ok) {
          const j = await r.json()
          setFollowupData({ features: j.features || [], total_percentage: j.total_percentage })
        }
        loadItems()
      } else {
        message.error(data?.detail || 'Failed to save followup')
      }
    } catch {
      message.error('Failed to save followup')
    } finally {
      setFollowupSubmitting(false)
    }
  }

  const openViewDetails = async (record: POCItem) => {
    setSelectedItem(record)
    setDetailModalOpen(true)
    setDetailsData(null)
    setDetailsLoading(true)
    try {
      const res = await fetchWithTimeout(
        `${API_BASE_URL}/success/performance/details?ticket_id=${record.id}`,
        { headers: getAuthHeaders() }
      )
      if (res.ok) {
        const data = await res.json()
        setDetailsData(data)
      }
    } catch {
      message.error('Failed to load details')
    } finally {
      setDetailsLoading(false)
    }
  }

  const tableColumns = [
    { title: 'Reference Number', dataIndex: 'reference_no', key: 'reference_no', width: 120 },
    { title: 'Company Name', dataIndex: 'company_name', key: 'company_name', width: 160 },
    { title: 'Response', dataIndex: 'response', key: 'response', ellipsis: true, render: (v: string) => (v ? String(v).slice(0, 40) + (String(v).length > 40 ? '...' : '') : '-') },
    { title: 'Contact', dataIndex: 'contact', key: 'contact', width: 120 },
    {
      title: 'Total Completion %',
      dataIndex: 'total_percentage',
      key: 'total_percentage',
      width: 120,
      render: (v: number | null | undefined) => (v != null ? `${Number(v)}%` : '-'),
    },
    {
      title: 'Current Stage',
      dataIndex: 'current_stage',
      key: 'current_stage',
      width: 220,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_: unknown, record: POCItem) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Button
            type="link"
            size="small"
            icon={record.has_training ? <EditOutlined /> : <FormOutlined />}
            onClick={() => openTrainingModal(record)}
          >
            {record.has_training ? 'Edit Training' : 'Training'}
          </Button>
          {record.feature_count != null && record.feature_count > 0 && (
            <Button type="link" size="small" icon={<FormOutlined />} onClick={() => openFollowupModal(record)}>
              Followup
            </Button>
          )}
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openViewDetails(record)}>
            View Details
          </Button>
        </span>
      ),
    },
  ]

  const displayItems = items.filter((i) => {
    if (filterRef && !String(i.reference_no || '').toLowerCase().includes(filterRef.toLowerCase())) return false
    if (filterCompany && !String(i.company_name || '').toLowerCase().includes(filterCompany.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        <LineChartOutlined style={{ marginRight: 8 }} />
        Performance Monitoring
      </Title>

      <Card style={{ marginBottom: 24 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormModalOpen(true)}>
          Add POC Details
        </Button>
      </Card>

      {setupError && (
        <Alert type="warning" message="Setup Required" description={setupError} showIcon style={{ marginBottom: 16 }} />
      )}

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="Filter by Reference"
            value={filterRef}
            onChange={(e) => setFilterRef(e.target.value)}
            style={{ width: 160 }}
            allowClear
          />
          <Input
            placeholder="Filter by Company"
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k)}
          items={[
            { key: 'active', label: 'Active Company' },
            { key: 'completed', label: 'Completed Company' },
          ]}
        />
        <Table
          dataSource={displayItems}
          rowKey="id"
          loading={loading}
          onRow={(record) => ({
            onClick: () => openViewDetails(record),
            style: { cursor: 'pointer' },
          })}
          columns={tableColumns}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title="Add POC Details"
        open={formModalOpen}
        onCancel={() => { setFormModalOpen(false); form.resetFields() }}
        footer={null}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="company_id" label="Company Name" rules={[{ required: true, message: 'Select company' }]}>
            <Select
              placeholder="Select company"
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="message_owner" label="Message Owner" rules={[{ required: true }]} initialValue="no">
            <Select options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
          </Form.Item>
          <Form.Item name="response" label="Response *" rules={[{ required: true, message: 'Required' }]}>
            <Input.TextArea rows={3} placeholder="Response" />
          </Form.Item>
          <Form.Item name="contact" label="Contact *" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="Contact" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} icon={<PlusOutlined />}>
              Add POC Details
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={selectedItem?.has_training ? `Edit Training - ${selectedItem?.reference_no}` : `Training - ${selectedItem?.reference_no}`}
        open={trainingModalOpen}
        onCancel={() => { setTrainingModalOpen(false); setSelectedItem(null) }}
        footer={null}
        destroyOnClose
        width={560}
      >
        {selectedItem && (
          <Form form={trainingForm} layout="vertical" onFinish={onTrainingFinish}>
            <Form.Item name="call_poc" label="Call POC" rules={[{ required: true }]} initialValue="no">
              <Select options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
            </Form.Item>
            <Form.Item name="message_poc" label="Message POC" rules={[{ required: true }]} initialValue="no">
              <Select options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
            </Form.Item>
            <Form.Item name="message_owner" label="Message Owner" rules={[{ required: true }]} initialValue="no">
              <Select options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
            </Form.Item>
            <Form.Item name="training_schedule_date" label="Training Schedule Date *" rules={[{ required: true, message: 'Required' }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item name="training_status" label="Training Status" rules={[{ required: true }]} initialValue="no">
              <Select options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
            </Form.Item>
            <Form.Item name="remarks" label="Remarks">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item
              name="feature_ids"
              label="Feature Committed for Use *"
              rules={[{ required: !featuresLocked, message: 'Required (locked after 24hr)' }]}
              help={featuresLocked ? 'Locked: cannot edit after 24 hours' : undefined}
            >
              <Select
                mode="multiple"
                placeholder="Select features"
                options={features.map((f) => ({ value: f.id, label: f.name }))}
                optionFilterProp="label"
                disabled={featuresLocked}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Submit
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title={`Followup - ${selectedItem?.reference_no}`}
        open={followupModalOpen}
        onCancel={() => { setFollowupModalOpen(false); setSelectedItem(null) }}
        footer={null}
        width={640}
      >
        {followupData.total_percentage != null && (
          <p><strong>Total Completion: {followupData.total_percentage}%</strong></p>
        )}
        <Form form={followupForm} layout="vertical" initialValues={{ status: 'pending', previous_percentage: 0, initial_percentage: '' }}>
          {followupData.is_first_followup && (
            <Form.Item
              name="initial_percentage"
              label="Initial % (1st time only) *"
              rules={[{ required: true, message: 'Enter base % already completed' }]}
              help="Enter the percentage you have already completed. Remaining (100 - this) will be divided equally among features."
            >
              <InputNumber min={0} max={100} step={0.01} style={{ width: 120 }} placeholder="e.g. 20" />
            </Form.Item>
          )}
          <Form.Item
            name="previous_percentage"
            label="Current total %"
            help="Calculated from server. New total = this + feature share when marked Completed."
          >
            <InputNumber min={0} max={100} step={0.01} style={{ width: 120 }} disabled />
          </Form.Item>
          <Form.Item name="status" label="Status *" rules={[{ required: true }]}>
            <Select options={[{ value: 'pending', label: 'Pending' }, { value: 'completed', label: 'Completed' }]} />
          </Form.Item>
          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={1} />
          </Form.Item>
        </Form>
        {followupData.features.map((f) => (
          <Card key={f.ticket_feature_id} size="small" title={f.feature_name} style={{ marginBottom: 8 }}>
            <div>Status: {f.status}</div>
            {f.followups.length > 0 && (
              <ul style={{ marginTop: 4, paddingLeft: 16 }}>
                {f.followups.map((fu) => (
                  <li key={fu.id}>
                    Prev: {fu.previous_percentage}% → +{fu.added_percentage}% = {fu.total_percentage}% ({fu.status}) {fu.remarks && `- ${fu.remarks}`}
                  </li>
                ))}
              </ul>
            )}
            {f.status !== 'Completed' && (
              <Button
                type="primary"
                size="small"
                style={{ marginTop: 8 }}
                loading={followupSubmitting}
                onClick={() => submitFollowup(f.ticket_feature_id)}
              >
                Add followup for this feature
              </Button>
            )}
          </Card>
        ))}
      </Modal>

      <Modal
        title={`View Details - ${selectedItem?.reference_no || ''}`}
        open={detailModalOpen}
        onCancel={() => { setDetailModalOpen(false); setSelectedItem(null); setDetailsData(null) }}
        footer={null}
        width={640}
      >
        {selectedItem && (
          <>
            {detailsLoading ? (
              <p>Loading...</p>
            ) : detailsData ? (
              <>
                <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="Reference">{detailsData.reference_no}</Descriptions.Item>
                  <Descriptions.Item label="Company">{detailsData.company_name}</Descriptions.Item>
                  <Descriptions.Item label="Message Owner">{detailsData.message_owner === 'yes' ? 'Yes' : 'No'}</Descriptions.Item>
                  <Descriptions.Item label="Response">{detailsData.response || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Contact">{detailsData.contact || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Total Completion %">{detailsData.total_percentage != null ? `${detailsData.total_percentage}%` : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Current Stage">
                    <strong>{detailsData.current_stage}</strong>
                    {detailsData.pending_features && detailsData.pending_features.length > 0 && (
                      <div style={{ marginTop: 4, color: '#d4380d' }}>Pending: {detailsData.pending_features.join(', ')}</div>
                    )}
                  </Descriptions.Item>
                </Descriptions>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  <Button size="small" icon={<FormOutlined />} onClick={() => { setDetailModalOpen(false); openTrainingModal(selectedItem) }}>
                    {selectedItem.has_training ? 'Edit Training' : 'Training'}
                  </Button>
                  {selectedItem.feature_count != null && selectedItem.feature_count > 0 && (
                    <Button size="small" icon={<FormOutlined />} onClick={() => { setDetailModalOpen(false); openFollowupModal(selectedItem) }}>
                      Followup
                    </Button>
                  )}
                </div>
                {detailsData.features_with_followups && detailsData.features_with_followups.length > 0 && (
                  <Card size="small" title="Features & Followups">
                    {detailsData.features_with_followups.map((f: { ticket_feature_id: string; feature_name: string; status: string; followups: Array<Record<string, unknown>> }) => (
                      <div key={f.ticket_feature_id} style={{ marginBottom: 8 }}>
                        <strong>{f.feature_name}</strong> – {f.status}
                        {f.followups && f.followups.length > 0 && (
                          <ul style={{ marginTop: 4, paddingLeft: 16 }}>
                            {f.followups.map((fu: Record<string, unknown>, idx: number) => (
                              <li key={idx}>
                                Prev: {fu.previous_percentage}% → +{fu.added_percentage}% = {fu.total_percentage}% ({fu.status}) {fu.remarks && `- ${fu.remarks}`}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </Card>
                )}
              </>
            ) : (
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Reference">{selectedItem.reference_no}</Descriptions.Item>
                <Descriptions.Item label="Company">{selectedItem.company_name}</Descriptions.Item>
                <Descriptions.Item label="Total Completion %">{selectedItem.total_percentage != null ? `${selectedItem.total_percentage}%` : '-'}</Descriptions.Item>
                <Descriptions.Item label="Status">{selectedItem.completion_status === 'completed' ? 'Completed' : 'Active'}</Descriptions.Item>
              </Descriptions>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
