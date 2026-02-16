import { useState, useEffect } from 'react'
import {
  Card,
  Typography,
  Form,
  Input,
  DatePicker,
  Button,
  Table,
  Tag,
  message,
  Select,
  Space,
  Modal,
  Upload,
} from 'antd'
import { SendOutlined, PlusOutlined, CheckOutlined, CloseOutlined, EditOutlined, InboxOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { delegationApi, type DelegationTask } from '../../api/delegation'
import { uploadAttachment } from '../../api/upload'

const { Title, Text } = Typography
const { Dragger } = Upload

const STATUS_COLORS: Record<string, string> = {
  pending: 'orange',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'default',
}

export const DelegationPage = () => {
  const { user } = useAuth()
  const { isAdmin, isApprover, isMasterAdmin } = useRole()
  const canManage = isAdmin || isApprover
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [tasks, setTasks] = useState<DelegationTask[]>([])
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [userFilter, setUserFilter] = useState<string | undefined>(undefined)
  const [referenceNoFilter, setReferenceNoFilter] = useState<string>('__all__')
  const [completeModalTask, setCompleteModalTask] = useState<DelegationTask | null>(null)
  const [completeDocumentUrl, setCompleteDocumentUrl] = useState<string | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [editModalTask, setEditModalTask] = useState<DelegationTask | null>(null)

  useEffect(() => {
    setReferenceNoFilter('__all__')
    loadTasks()
  }, [statusFilter, userFilter])

  useEffect(() => {
    if (canManage) {
      delegationApi.getUsers().then((r) => setUsers(r.users || [])).catch(() => setUsers([]))
    }
  }, [canManage])

  const loadTasks = () => {
    setLoading(true)
    const params: { status?: string; assignee_id?: string } = {}
    params.status = statusFilter
    if (canManage && userFilter && userFilter !== '__all__') params.assignee_id = userFilter
    delegationApi
      .getTasks(params)
      .then((r) => setTasks(r.tasks || []))
      .catch(() => message.error('Failed to load delegation tasks'))
      .finally(() => setLoading(false))
  }

  const displayTasks = referenceNoFilter && referenceNoFilter !== '__all__'
    ? tasks.filter((t) => t.reference_no === referenceNoFilter)
    : tasks
  const referenceNoOptions = [
    { value: '__all__', label: 'All' },
    ...Array.from(new Set(tasks.map((t) => t.reference_no).filter(Boolean)))
      .sort()
      .map((ref) => ({ value: ref!, label: ref! })),
  ]

  const onFinish = (values: {
    title: string
    delegation_on?: dayjs.Dayjs | null
    submission_date?: dayjs.Dayjs | null
    has_document?: 'yes' | 'no'
    submitted_by?: string
  }) => {
    if (!values.submission_date) {
      message.error('Please select submission date')
      return
    }
    setLoading(true)
    delegationApi
      .createTask({
        title: values.title,
        assignee_id: values.submitted_by!,
        due_date: values.submission_date.format('YYYY-MM-DD'),
        submission_date: values.submission_date.format('YYYY-MM-DD'),
        delegation_on: values.delegation_on?.format('YYYY-MM-DD'),
        has_document: values.has_document,
        submitted_by: values.submitted_by,
      })
      .then(() => {
        message.success('Delegation task created')
        form.resetFields()
        setModalOpen(false)
        loadTasks()
      })
      .catch((e) => message.error(e?.response?.data?.detail || 'Failed to create'))
      .finally(() => setLoading(false))
  }

  const canActOnTask = (task: DelegationTask) =>
    user?.id && (task.assignee_id === user.id || isAdmin)

  const openCompleteModal = (task: DelegationTask) => {
    if (task.has_document === 'yes') {
      setCompleteModalTask(task)
      setCompleteDocumentUrl(null)
    } else {
      doComplete(task.id, undefined)
    }
  }

  const doComplete = (taskId: string, document_url?: string) => {
    setLoading(true)
    delegationApi
      .updateTask(taskId, { status: 'completed', ...(document_url && { document_url }) })
      .then(() => {
        message.success('Marked as completed')
        setCompleteModalTask(null)
        setCompleteDocumentUrl(null)
        loadTasks()
      })
      .catch((e) => message.error(e?.response?.data?.detail || 'Failed to update'))
      .finally(() => setLoading(false))
  }

  const handleCompleteWithDoc = () => {
    if (!completeModalTask) return
    if (!completeDocumentUrl) {
      message.error('Please upload the document before completing.')
      return
    }
    doComplete(completeModalTask.id, completeDocumentUrl)
  }

  const markCancel = (task: DelegationTask) => {
    delegationApi
      .updateTask(task.id, { status: 'cancelled' })
      .then(() => {
        message.success('Task cancelled')
        loadTasks()
      })
      .catch((e) => message.error(e?.response?.data?.detail || 'Failed to cancel'))
  }

  const openEditModal = (task: DelegationTask) => {
    setEditModalTask(task)
    editForm.setFieldsValue({
      title: task.title,
      delegation_on: task.delegation_on ? dayjs(task.delegation_on) : null,
      submission_date: task.submission_date ? dayjs(task.submission_date) : null,
      due_date: task.due_date ? dayjs(task.due_date) : null,
      has_document: task.has_document,
      submitted_by: task.submitted_by,
      assignee_id: task.assignee_id,
    })
  }

  const onEditFinish = (values: Record<string, unknown>) => {
    if (!editModalTask) return
    const payload: Record<string, string> = {}
    if (values.title != null) payload.title = String(values.title)
    const due = (values.due_date as dayjs.Dayjs)?.format('YYYY-MM-DD')
    if (due) payload.due_date = due
    const delOn = (values.delegation_on as dayjs.Dayjs)?.format('YYYY-MM-DD')
    if (delOn) payload.delegation_on = delOn
    const subDate = (values.submission_date as dayjs.Dayjs)?.format('YYYY-MM-DD')
    if (subDate) payload.submission_date = subDate
    if (values.has_document != null) payload.has_document = String(values.has_document)
    if (values.submitted_by != null) payload.submitted_by = String(values.submitted_by)
    if (values.assignee_id != null) payload.assignee_id = String(values.assignee_id)
    if (Object.keys(payload).length === 0) return
    setLoading(true)
    delegationApi
      .updateTask(editModalTask.id, payload)
      .then(() => {
        message.success('Task updated')
        setEditModalTask(null)
        loadTasks()
      })
      .catch((e) => message.error(e?.response?.data?.detail || 'Failed to update'))
      .finally(() => setLoading(false))
  }

  const columns = [
    { title: 'Reference No', dataIndex: 'reference_no', key: 'reference_no', render: (v: string) => v || '-' },
    { title: 'Task Name', dataIndex: 'title', key: 'title', render: (t: string) => t || '-' },
    {
      title: 'Delegation On',
      dataIndex: 'delegation_on',
      key: 'delegation_on',
      render: (d: string) => (d ? dayjs(d).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Submission Date',
      dataIndex: 'submission_date',
      key: 'submission_date',
      render: (d: string) => (d ? dayjs(d).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Document',
      dataIndex: 'has_document',
      key: 'has_document',
      render: (v: string) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : '-'),
    },
    {
      title: 'Submitted Attachment',
      dataIndex: 'document_url',
      key: 'document_url',
      render: (url: string) => {
        if (!url) return '-'
        return (
          <a href={url} target="_blank" rel="noopener noreferrer">
            View document
          </a>
        )
      },
    },
    {
      title: 'Submitted By',
      dataIndex: 'submitted_by_name',
      key: 'submitted_by',
      render: (n: string, r: DelegationTask) => n || r.submitted_by?.slice(0, 8) || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={STATUS_COLORS[s] || 'default'}>{s || 'pending'}</Tag>,
    },
    {
      title: 'Actual',
      dataIndex: 'completed_at',
      key: 'completed_at',
      render: (d: string) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '-'),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, r: DelegationTask) => {
        const canAct = canActOnTask(r)
        if (!canAct) return null
        if (r.status === 'completed') return null
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => openCompleteModal(r)}
            >
              Complete
            </Button>
            <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => markCancel(r)}>
              Cancel
            </Button>
            {isMasterAdmin && (
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(r)}>
                Edit
              </Button>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            <SendOutlined style={{ marginRight: 8 }} />
            Delegation
          </Title>
          <Space wrap>
            <Select
              placeholder="Status"
              style={{ width: 130 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
                { value: 'all', label: 'All Tasks' },
              ]}
            />
            <Select
              placeholder="Reference No"
              style={{ width: 150 }}
              value={referenceNoFilter}
              onChange={setReferenceNoFilter}
              options={referenceNoOptions}
            />
            {canManage && (
              <Select
                placeholder="Filter by user"
                allowClear
                style={{ width: 160 }}
                value={userFilter ?? '__all__'}
                onChange={(v) => setUserFilter(v === '__all__' ? undefined : v)}
                options={[{ value: '__all__', label: 'All' }, ...users.map((u) => ({ value: u.id, label: u.full_name }))]}
              />
            )}
            {canManage && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  form.resetFields()
                  setModalOpen(true)
                }}
              >
                Add Task
              </Button>
            )}
          </Space>
        </div>
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          Manage delegation tasks. By default pending tasks are shown.
        </Text>
        <Table
          dataSource={displayTasks}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          style={{ marginTop: 16 }}
        />
      </Card>

      <Modal
        title="Add Delegation Task"
        open={modalOpen}
        destroyOnClose
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="title" label="Task Name" rules={[{ required: true, message: 'Please enter task name' }]}>
            <Input placeholder="Enter task name" />
          </Form.Item>
          <Form.Item name="delegation_on" label="Delegation On" rules={[{ required: true, message: 'Please select date' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="submission_date" label="Submission Date" rules={[{ required: true, message: 'Please select date' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="has_document" label="Document" rules={[{ required: true, message: 'Please select' }]}>
            <Select placeholder="Select Yes or No" options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
          </Form.Item>
          <Form.Item name="submitted_by" label="Submitted By" rules={[{ required: true, message: 'Please select submitter' }]}>
            <Select
              placeholder="Select who submitted"
              options={users.map((u) => ({ value: u.id, label: u.full_name }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create
              </Button>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Upload document to complete"
        open={!!completeModalTask}
        onCancel={() => { setCompleteModalTask(null); setCompleteDocumentUrl(null) }}
        onOk={handleCompleteWithDoc}
        okText="Complete"
        okButtonProps={{ disabled: !completeDocumentUrl }}
      >
        <p>This task requires a document. Please upload it before completing.</p>
        <Dragger
          multiple={false}
          maxCount={1}
          showUploadList={{ showRemoveIcon: true }}
          beforeUpload={(file) => {
            setUploadingDoc(true)
            uploadAttachment(file)
              .then((res) => {
                setCompleteDocumentUrl(res.url)
                message.success(`${file.name} uploaded`)
              })
              .catch((e) => message.error(e?.response?.data?.detail || 'Upload failed'))
              .finally(() => setUploadingDoc(false))
            return false
          }}
          onRemove={() => setCompleteDocumentUrl(null)}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">Click or drag file to upload</p>
        </Dragger>
      </Modal>

      {isMasterAdmin && (
        <Modal
          title="Edit Task"
          open={!!editModalTask}
          destroyOnClose
          onCancel={() => setEditModalTask(null)}
          footer={null}
        >
          <Form form={editForm} layout="vertical" onFinish={onEditFinish}>
            <Form.Item name="title" label="Task Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="delegation_on" label="Delegation On">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="submission_date" label="Submission Date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="due_date" label="Due Date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="has_document" label="Document">
              <Select options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
            </Form.Item>
            <Form.Item name="submitted_by" label="Submitted By">
              <Select options={users.map((u) => ({ value: u.id, label: u.full_name }))} showSearch optionFilterProp="label" />
            </Form.Item>
            <Form.Item name="assignee_id" label="Assignee">
              <Select options={users.map((u) => ({ value: u.id, label: u.full_name }))} showSearch optionFilterProp="label" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>Save</Button>
              <Button style={{ marginLeft: 8 }} onClick={() => setEditModalTask(null)}>Cancel</Button>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  )
}
