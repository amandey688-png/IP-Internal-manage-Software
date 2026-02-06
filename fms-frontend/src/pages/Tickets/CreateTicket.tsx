import { useState } from 'react'
import { Form, Input, Button, Card, Typography, Select, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { ticketsApi } from '../../api/tickets'
import { ROUTES } from '../../utils/constants'

const { Title } = Typography
const { TextArea } = Input

export const CreateTicket = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values: Record<string, unknown>) => {
    setLoading(true)
    try {
      const ticket = await ticketsApi.create({
        title: values.title as string,
        description: values.description as string,
        type: values.type as 'bug' | 'feature' | 'chore',
        priority: (values.priority as string) || 'medium',
      })
      if (ticket?.id) {
        message.success('Ticket created')
        navigate(`${ROUTES.TICKETS}/${ticket.id}`)
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? err?.message ?? 'Failed to create ticket'
      const msg =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: any) => (d?.msg != null ? d.msg : String(d))).join(' ')
            : 'Failed to create ticket'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Title level={2}>Create Ticket</Title>
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Ticket title" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={4} placeholder="Description" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="bug">Bug</Select.Option>
              <Select.Option value="feature">Feature</Select.Option>
              <Select.Option value="chore">Chore</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <Select defaultValue="medium">
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="high">High</Select.Option>
              <Select.Option value="critical">Critical</Select.Option>
              <Select.Option value="urgent">Urgent</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Create
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => navigate(ROUTES.TICKETS)}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
