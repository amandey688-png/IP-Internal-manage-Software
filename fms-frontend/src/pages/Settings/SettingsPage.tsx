import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Typography, message, Space, Avatar, Divider } from 'antd'
import { UserOutlined, MailOutlined } from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { usersApi } from '../../api/users'
import { approvalApi } from '../../api/approval'
import { getInitials } from '../../utils/helpers'
import { PrintExport } from '../../components/common/PrintExport'

const { Title } = Typography
const { TextArea } = Input

export const SettingsPage = () => {
  const { user, refreshUser } = useAuth()
  const { canAccessSettings } = useRole()
  const [form] = Form.useForm()
  const [approvalForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState(false)

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        full_name: user.full_name,
        email: user.email,
      })
    }
  }, [user, form])

  useEffect(() => {
    if (canAccessSettings) {
      approvalApi.getSettings().then((s) => {
        approvalForm.setFieldsValue({ approval_emails: s.approval_emails || '' })
      }).catch(() => {})
    }
  }, [canAccessSettings, approvalForm])

  const onFinish = async (values: { full_name: string }) => {
    if (!user) return
    setLoading(true)
    try {
      const response = await usersApi.update(user.id, values)
      if (response.data) {
        refreshUser(response.data)
        message.success('Profile updated successfully')
      }
    } catch (error) {
      message.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const onApprovalEmailsFinish = async (values: { approval_emails: string }) => {
    setApprovalLoading(true)
    try {
      await approvalApi.updateSettings(values.approval_emails || '')
      message.success('Approval emails updated')
    } catch (error) {
      message.error('Failed to update approval emails')
    } finally {
      setApprovalLoading(false)
    }
  }

  if (!user) return null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Settings</Title>
        <PrintExport pageTitle="Settings" />
      </div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>Profile</Title>
            <Space>
              <Avatar
                size={64}
                icon={<UserOutlined />}
                src={user.avatar_url}
              >
                {!user.avatar_url && getInitials(user.full_name)}
              </Avatar>
              <div>
                <div style={{ fontWeight: 'bold' }}>{user.full_name}</div>
                <div style={{ color: '#999' }}>{user.email}</div>
                <div style={{ color: '#999' }}>Role: {user.role.toUpperCase()}</div>
              </div>
            </Space>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{ maxWidth: 500 }}
          >
            <Form.Item
              name="full_name"
              label="Full Name"
              rules={[{ required: true, message: 'Please enter your full name' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item name="email" label="Email">
              <Input disabled />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Profile
              </Button>
            </Form.Item>
          </Form>

          {canAccessSettings && (
            <>
              <Divider />
              <div>
                <Title level={4}>
                  <MailOutlined style={{ marginRight: 8 }} />
                  Approval Email Configuration
                </Title>
                <Typography.Paragraph type="secondary">
                  Comma-separated email addresses that receive approval requests for Feature tickets.
                </Typography.Paragraph>
                <Form
                  form={approvalForm}
                  layout="vertical"
                  onFinish={onApprovalEmailsFinish}
                  style={{ maxWidth: 560 }}
                >
                  <Form.Item
                    name="approval_emails"
                    label="Approval emails"
                    rules={[{ required: false }]}
                  >
                    <TextArea
                      rows={3}
                      placeholder="e.g. approvals@company.com, manager@company.com"
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={approvalLoading}>
                      Save approval emails
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            </>
          )}
        </Space>
      </Card>
    </div>
  )
}
