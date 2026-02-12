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
} from 'antd'
import { SendOutlined, PlusOutlined, CheckOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { delegationApi, type DelegationTask } from '../../api/delegation'

const { Title, Text } = Typography

const STATUS_COLORS: Record<string, string> = {
  pending: 'orange',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'default',
}

export const DelegationPage = () => {
  const { user } = useAuth()
  const { isAdmin, isApprover } = useRole()
  const canManage = isAdmin || isApprover
  const [form] = Form.useForm()
  const [tasks, setTasks] = useState<DelegationTask[]>([])
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  useEffect(() => {
    loadTasks()
  }, [statusFilter])

  useEffect(() => {
    if (canManage) {
      delegationApi.getUsers().then((r) => setUsers(r.users || [])).catch(() => setUsers([]))
    }
  }, [canManage])

  const loadTasks = () => {
    setLoading(true)
    delegationApi
      .getTasks(statusFilter ? { status: statusFilter } : undefined)
      .then((r) => setTasks(r.tasks || []))
      .catch(() => message.error('Failed to load delegation tasks'))
      .finally(() => setLoading(false))
  }

  const onFinish = (values: { title: string; assignee_id: string; due_date: dayjs.Dayjs | null }) => {
    if (!values.due_date) {
      message.error('Please select due date')
      return
    }
    setLoading(true)
    delegationApi
      .createTask({
        title: values.title,
        assignee_id: values.assignee_id,
        due_date: values.due_date.format('YYYY-MM-DD'),
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

  const markComplete = (task: DelegationTask) => {
    delegationApi
      .updateTask(task.id, { status: 'completed' })
      .then(() => {
        message.success('Marked as completed')
        loadTasks()
      })
      .catch(() => message.error('Failed to update'))
  }

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', render: (t: string) => t || '-' },
    {
      title: 'Assignee',
      dataIndex: 'assignee_name',
      key: 'assignee',
      render: (n: string, r: DelegationTask) => n || r.assignee_id?.slice(0, 8) || '-',
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (d: string) => (d ? dayjs(d).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={STATUS_COLORS[s] || 'default'}>{s || 'pending'}</Tag>,
    },
    ...(canManage
      ? [
          {
            title: 'Action',
            key: 'action',
            render: (_: unknown, r: DelegationTask) =>
              r.status !== 'completed' ? (
                <Button
                  type="link"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => markComplete(r)}
                >
                  Complete
                </Button>
              ) : null,
          },
        ]
      : []),
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            <SendOutlined style={{ marginRight: 8 }} />
            Delegation
          </Title>
          <Space>
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: 140 }}
              value={statusFilter || undefined}
              onChange={setStatusFilter}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
            {canManage && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                Add Task
              </Button>
            )}
          </Space>
        </div>
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          Manage delegation tasks. Pending tasks appear in the daily reminder digest (Level 1 & 2).
        </Text>
        <Table
          dataSource={tasks}
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
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Task title" />
          </Form.Item>
          <Form.Item name="assignee_id" label="Assignee" rules={[{ required: true }]}>
            <Select
              placeholder="Select assignee"
              options={users.map((u) => ({ value: u.id, label: u.full_name }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="due_date" label="Due Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
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
    </div>
  )
}
