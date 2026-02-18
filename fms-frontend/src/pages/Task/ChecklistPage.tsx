import { useState, useEffect } from 'react'
import {
  Card,
  Typography,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Table,
  Tag,
  message,
  Select as AntSelect,
  Space,
  Modal,
} from 'antd'
import { CheckSquareOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import {
  checklistApi,
  DEPARTMENTS,
  FREQUENCY_OPTIONS,
  type ChecklistTask,
  type ChecklistOccurrence,
} from '../../api/checklist'

const { Title, Text } = Typography

type FilterType = 'today' | 'completed' | 'overdue' | 'upcoming'

const formatDate = (d: string) => dayjs(d).format('DD/MM/YYYY')
const formatDay = (d: string) => dayjs(d).format('dddd')

const isToday = (d: string) => dayjs(d).isSame(dayjs(), 'day')

export const ChecklistPage = () => {
  const { user } = useAuth()
  const { isAdmin } = useRole()
  const [form] = Form.useForm()
  const [tasks, setTasks] = useState<ChecklistTask[]>([])
  const [occurrences, setOccurrences] = useState<ChecklistOccurrence[]>([])
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined)
  const [referenceNoFilter, setReferenceNoFilter] = useState<string>('__all__')
  const [filter, setFilter] = useState<FilterType>('today')
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState<string | null>(null)
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false)
  const [holidayModalOpen, setHolidayModalOpen] = useState(false)
  const [holidayUploadLoading, setHolidayUploadLoading] = useState(false)
  const today = new Date()
  const canUploadHolidays = today.getMonth() === 11 && today.getDate() >= 15

  useEffect(() => {
    setReferenceNoFilter('__all__')
  }, [selectedUserId])

  useEffect(() => {
    loadTasks()
    loadOccurrences()
  }, [selectedUserId, referenceNoFilter, filter])

  useEffect(() => {
    if (isAdmin) {
      checklistApi.getUsers().then((r) => setUsers(r.users || [])).catch(() => setUsers([]))
    }
  }, [isAdmin])

  const refNoParam = referenceNoFilter && referenceNoFilter !== '__all__' ? referenceNoFilter : undefined

  const loadTasks = () => {
    setLoading(true)
    checklistApi
      .getTasks(selectedUserId, refNoParam)
      .then((r) => setTasks(r.tasks || []))
      .catch(() => message.error('Failed to load tasks'))
      .finally(() => setLoading(false))
  }

  const loadOccurrences = () => {
    setLoading(true)
    checklistApi
      .getOccurrences(filter, selectedUserId, refNoParam)
      .then((r) => setOccurrences(r.occurrences || []))
      .catch(() => message.error('Failed to load occurrences'))
      .finally(() => setLoading(false))
  }

  const referenceNoOptions = [
    { label: 'All', value: '__all__' },
    ...Array.from(new Set(tasks.map((t) => t.reference_no).filter(Boolean)))
      .sort()
      .map((ref) => ({ label: ref!, value: ref! })),
  ]

  const onFinish = (values: { task_name: string; department: string; frequency: string; start_date: dayjs.Dayjs | null }) => {
    if (!values.start_date) {
      message.error('Please select Day & Date')
      return
    }
    setLoading(true)
    checklistApi
      .createTask({
        task_name: values.task_name,
        department: values.department,
        frequency: values.frequency,
        start_date: values.start_date.format('YYYY-MM-DD'),
      })
      .then(() => {
        message.success('Task created')
        form.resetFields()
        setAddTaskModalOpen(false)
        loadTasks()
        loadOccurrences()
      })
      .catch((e: any) => message.error(e.response?.data?.detail || 'Failed to create task'))
      .finally(() => setLoading(false))
  }

  const handleComplete = (taskId: string, occurrenceDate: string) => {
    setSubmitLoading(`${taskId}-${occurrenceDate}`)
    checklistApi
      .completeTask(taskId, occurrenceDate)
      .then(() => {
        message.success('Marked as Completed')
        loadOccurrences()
      })
      .catch((e: any) => message.error(e.response?.data?.detail || 'Failed to complete'))
      .finally(() => setSubmitLoading(null))
  }

  const columns = [
    {
      title: 'Reference No',
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: 'Date',
      dataIndex: 'occurrence_date',
      key: 'occurrence_date',
      width: 110,
      render: (d: string) => formatDate(d),
    },
    {
      title: 'Day',
      key: 'day',
      width: 100,
      render: (_: any, r: ChecklistOccurrence) => formatDay(r.occurrence_date),
    },
    {
      title: 'Task',
      dataIndex: 'task_name',
      key: 'task_name',
    },
    ...(isAdmin
      ? [
          {
            title: 'Doer',
            dataIndex: 'doer_name',
            key: 'doer_name',
            width: 140,
          },
        ]
      : []),
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 180,
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_: any, r: ChecklistOccurrence) =>
        r.completed_at ? (
          <Tag color="green">Completed</Tag>
        ) : (
          <Tag color="default">Not Completed</Tag>
        ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_: any, r: ChecklistOccurrence) => {
        if (r.completed_at) return null
        const canSubmit = r.doer_id === user?.id && isToday(r.occurrence_date)
        return canSubmit ? (
          <Button
            type="primary"
            size="small"
            loading={submitLoading === `${r.task_id}-${r.occurrence_date}`}
            onClick={() => handleComplete(r.task_id, r.occurrence_date)}
          >
            Submit
          </Button>
        ) : null
      },
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>
        <CheckSquareOutlined style={{ marginRight: 8 }} />
        Checklist
      </Title>

      {/* Add Task button only - form opens in modal */}
      <div style={{ marginBottom: 24 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddTaskModalOpen(true)}>
          Add Task
        </Button>
      </div>

      {/* Upload Holiday List - from Dec 15 for next year (Admin only) */}
      {isAdmin && canUploadHolidays && (
        <Card style={{ marginBottom: 24 }}>
          <Button
            icon={<UploadOutlined />}
            onClick={() => setHolidayModalOpen(true)}
          >
            Upload Holiday List
          </Button>
          <Text type="secondary" style={{ marginLeft: 12 }}>
            Available from Dec 15th. Upload holidays for next year.
          </Text>
        </Card>
      )}

      {/* User filter for Admin / Master Admin */}
      {isAdmin && users.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <Space>
            <Text>Filter by User:</Text>
            <AntSelect
              placeholder="All users"
              allowClear
              style={{ width: 220 }}
              value={selectedUserId || undefined}
              onChange={setSelectedUserId}
              options={[
                { label: 'All Users', value: undefined },
                ...users.map((u) => ({ label: u.full_name, value: u.id })),
              ]}
            />
          </Space>
        </Card>
      )}

      {/* Task List with filter dropdown */}
      <Card
        title="Task List"
        extra={
          <Space wrap>
            <Text type="secondary">Reference No:</Text>
            <AntSelect
              value={referenceNoFilter}
              onChange={setReferenceNoFilter}
              style={{ width: 140 }}
              options={referenceNoOptions}
            />
            <Text type="secondary">Filter:</Text>
            <AntSelect
              value={filter}
              onChange={(v) => setFilter(v as FilterType)}
              style={{ width: 240 }}
              options={[
                { value: 'today', label: "Today's Tasks" },
                { value: 'completed', label: 'Completed' },
                { value: 'overdue', label: 'Not Completed (Date Crossed)' },
                { value: 'upcoming', label: 'Upcoming' },
              ]}
            />
          </Space>
        }
      >
        <Table
          dataSource={occurrences}
          columns={columns}
          rowKey={(r) => `${r.task_id}-${r.occurrence_date}`}
          loading={loading}
          pagination={{ pageSize: 20 }}
          size="small"
        />
      </Card>

      {/* Add Task Modal */}
      <Modal
        title="Add Task"
        open={addTaskModalOpen}
        onCancel={() => { setAddTaskModalOpen(false); form.resetFields() }}
        footer={null}
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="task_name"
            label="Name of Task"
            rules={[{ required: true, message: 'Enter task name' }]}
          >
            <Input placeholder="Task name" />
          </Form.Item>
          <Form.Item label="Doer Name">
            <Input disabled value={user?.full_name || ''} placeholder="Auto from logged-in user" />
          </Form.Item>
          <Form.Item
            name="department"
            label="Department"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Select department"
              options={DEPARTMENTS.map((d) => ({ label: d, value: d }))}
            />
          </Form.Item>
          <Form.Item
            name="frequency"
            label="Frequency"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Select frequency (D=Daily, W=Weekly, M=Monthly, Q=Quarterly, F=Half-yearly, Y=Yearly)"
              options={FREQUENCY_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            />
          </Form.Item>
          <Form.Item
            name="start_date"
            label="Day & Date (First date when task will occur)"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={loading}>
                Add Task
              </Button>
              <Button onClick={() => { setAddTaskModalOpen(false); form.resetFields() }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Upload Holiday List"
        open={holidayModalOpen}
        onCancel={() => setHolidayModalOpen(false)}
        footer={null}
        width={520}
      >
        <HolidayUploadForm
          nextYear={today.getFullYear() + 1}
          onSuccess={() => {
            setHolidayModalOpen(false)
            message.success('Holiday list uploaded')
          }}
          onCancel={() => setHolidayModalOpen(false)}
          loading={holidayUploadLoading}
          setLoading={setHolidayUploadLoading}
        />
      </Modal>
    </div>
  )
}

function HolidayUploadForm({
  nextYear,
  onSuccess,
  onCancel,
  loading,
  setLoading,
}: {
  nextYear: number
  onSuccess: () => void
  onCancel: () => void
  loading: boolean
  setLoading: (v: boolean) => void
}) {
  const [year, setYear] = useState(nextYear)
  const [text, setText] = useState('')
  const handleSubmit = () => {
    const lines = text.split('\n').filter((s) => s.trim())
    const holidays = lines
      .map((line) => {
        const idx = line.indexOf(',')
        if (idx < 0) return null
        const dateStr = line.slice(0, idx).trim()
        const name = line.slice(idx + 1).trim()
        if (!dateStr || !name) return null
        return { holiday_date: dateStr, holiday_name: name }
      })
      .filter((h): h is { holiday_date: string; holiday_name: string } => h !== null)
    if (holidays.length === 0) {
      message.error('Enter holidays as: YYYY-MM-DD, Holiday Name (one per line)')
      return
    }
    setLoading(true)
    checklistApi
      .uploadHolidays(year, holidays)
      .then(onSuccess)
      .catch((e: any) => message.error(e.response?.data?.detail || 'Upload failed'))
      .finally(() => setLoading(false))
  }
  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text>Year:</Text>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value) || nextYear)}
            style={{ width: 100, marginLeft: 8 }}
          />
        </div>
        <div>
          <Text>Holidays (one per line: YYYY-MM-DD, Holiday Name)</Text>
          <Input.TextArea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"2027-01-01, New Year's Day\n2027-01-26, Republic Day"}
            style={{ marginTop: 8 }}
          />
        </div>
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            Upload
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Space>
    </div>
  )
}
