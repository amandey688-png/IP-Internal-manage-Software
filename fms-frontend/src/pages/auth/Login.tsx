import { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { validateEmail } from '../../utils/validation'
import { storage } from '../../utils/storage'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { ROUTES } from '../../utils/constants'
import { useAuth } from '../../hooks/useAuth'
import type { LoginRequest } from '../../types/auth'

const colors = {
  darkBlue: '#1e3a5f',
  lightBlue: '#7eb8da',
  white: '#ffffff',
  accent: '#f59e0b',
}

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
        const { access_token, refresh_token, user, requires_otp } = response.data

        if (requires_otp || !user) {
          storage.setOTPEmail(values.email)
          navigate(ROUTES.OTP)
        } else {
          login(access_token, user, refresh_token ?? undefined)
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
    <AuthLayout variant="login">
      <div style={{ width: '100%', maxWidth: 360 }}>
        <h1 style={{ color: colors.white, fontSize: 32, fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>
          Welcome back!
        </h1>

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
          autoComplete="off"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.reject(new Error('Please enter your email'))
                  if (!validateEmail(value)) return Promise.reject(new Error('Enter a valid email address'))
                  return Promise.resolve()
                },
              },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: colors.lightBlue, marginRight: 8 }} />}
              placeholder="Your e-mail"
              size="large"
              style={{
                borderRadius: 8,
                padding: '12px 16px',
                background: colors.white,
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: colors.lightBlue, marginRight: 8 }} />}
              placeholder="Password"
              size="large"
              style={{
                borderRadius: 8,
                padding: '12px 16px',
                background: colors.white,
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              style={{
                background: colors.accent,
                borderColor: colors.accent,
                borderRadius: 8,
                height: 48,
                fontWeight: 600,
              }}
            >
              Sign in
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              block
              size="large"
              onClick={() => navigate(ROUTES.REGISTER)}
              style={{
                borderRadius: 8,
                height: 48,
                border: `2px solid ${colors.white}`,
                color: colors.white,
                background: 'transparent',
              }}
            >
              Create account
            </Button>
          </Form.Item>
        </Form>
      </div>
    </AuthLayout>
  )
}
