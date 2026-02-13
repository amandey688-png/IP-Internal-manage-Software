import { useState } from 'react'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { validateEmail } from '../../utils/validation'
import { storage } from '../../utils/storage'
import { ROUTES } from '../../utils/constants'
import { useAuth } from '../../hooks/useAuth'
import type { LoginRequest } from '../../types/auth'

const { Title, Text } = Typography

export const Login = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const onFinish = async (values: LoginRequest) => {
    setLoading(true)
    try {
      const response = await authApi.login(values)

      if (response.error) {
        message.error(response.error.message || 'Invalid email or password')
        return
      }

      if (response.data) {
        const { access_token, user, requires_otp } = response.data

        if (requires_otp || !user) {
          // First-time login, requires OTP
          storage.setOTPEmail(values.email)
          navigate(ROUTES.OTP)
        } else {
          // Already verified, login directly
          login(access_token, user)
          navigate(ROUTES.DASHBOARD)
        }
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message ||
        'Login failed. Please check your credentials.'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      <Card className="auth-card" style={{ width: 400, maxWidth: 'calc(100% - 32px)' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
          Login
        </Title>

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              {
                validator: (_, value) => {
                  if (!value) {
                    return Promise.reject(new Error('Please enter your email'))
                  }
                  if (!validateEmail(value)) {
                    return Promise.reject(new Error('Please enter a valid email address'))
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Enter your email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              Login
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text>
            Don't have an account?{' '}
            <a href={ROUTES.REGISTER}>Register</a>
          </Text>
        </div>
      </Card>
    </div>
  )
}
