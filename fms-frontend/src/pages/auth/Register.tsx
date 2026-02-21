import { useState, useEffect } from "react"
import { Form, Input, Button, Typography, message } from "antd"
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import { authApi } from "../../api/auth"
import { validateEmail } from "../../utils/validation"
import { getPasswordStrength } from "../../utils/passwordStrength"
import { AuthLayout } from "../../components/auth/AuthLayout"
import { ROUTES } from "../../utils/constants"
import type { RegisterRequest } from "../../types/auth"

const { Text } = Typography

const colors = {
  darkBlue: '#1e3a5f',
  lightBlue: '#7eb8da',
  white: '#ffffff',
  accent: '#f59e0b',
}

export const Register = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")
  const [resendLoading, setResendLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => navigate(ROUTES.LOGIN), 5000)
      return () => clearTimeout(timer)
    }
  }, [success, navigate])

  const onFinish = async (values: RegisterRequest) => {
    if (!values.email || !values.password || !values.full_name) {
      message.error("Please fill in all fields")
      return
    }
    setLoading(true)
    try {
      const response = await authApi.register(values)
      if (response?.error) {
        const displayMsg = response.error.code === '500'
          ? `${response.error.message} (Backend error)`
          : response.error.message
        message.error(displayMsg, 10)
        setLoading(false)
        return
      }
      if (response?.data) {
        setRegisteredEmail(response.data.email || values.email)
        message.success(response.data.message || "Registration successful! Please check your email.")
        setSuccess(true)
        form.resetFields()
      } else {
        message.error("Unexpected response from server. Please try again.")
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail
      const msg = typeof detail === 'string' ? detail : err.message || "Something went wrong"
      message.error(msg, 8)
    } finally {
      setLoading(false)
    }
  }

  const onFinishFailed = () => {
    message.error("Please fix the form errors before submitting")
  }

  if (success) {
    return (
      <AuthLayout>
        <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
          <h1 style={{ color: colors.white, fontSize: 28, marginBottom: 16 }}>Registration Successful</h1>
          <Text style={{ color: colors.lightBlue, display: 'block', marginBottom: 8 }}>
            Check your email for a confirmation link.
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 24 }}>
            Click the link to activate your account, then log in.
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 24 }}>
            Redirecting to login in 5 seconds…
          </Text>
          {registeredEmail && (
            <Button
              type="link"
              loading={resendLoading}
              style={{ color: colors.lightBlue }}
              onClick={async () => {
                setResendLoading(true)
                try {
                  const res = await authApi.resendConfirmation(registeredEmail)
                  message.success(res?.message || "Email resent. Check inbox and spam.")
                } catch (e: any) {
                  message.error(e.response?.data?.detail || "Failed to resend.")
                } finally {
                  setResendLoading(false)
                }
              }}
            >
              Didn't receive the email? Resend
            </Button>
          )}
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout variant="register">
      <div style={{ width: '100%', maxWidth: 360 }}>
        <h1 style={{ color: colors.white, fontSize: 32, fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>
          Welcome!
        </h1>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          requiredMark={false}
        >
          <Form.Item
            name="full_name"
            rules={[
              { required: true, message: "Please enter your name" },
              { min: 2, message: "Minimum 2 characters" },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: colors.lightBlue, marginRight: 8 }} />}
              placeholder="Your name"
              size="large"
              style={{
                borderRadius: 8,
                padding: '12px 16px',
                background: colors.white,
              }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              {
                validator: (_, value) =>
                  !value || validateEmail(value)
                    ? Promise.resolve()
                    : Promise.reject(new Error("Enter a valid email")),
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
            rules={[
              { required: true, message: "Please create a password" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.reject(new Error("Please create a password"))
                  if (value.length < 8) return Promise.reject(new Error("At least 8 characters"))
                  if (!/[a-z]/.test(value)) return Promise.reject(new Error("One lowercase letter"))
                  if (!/[A-Z]/.test(value)) return Promise.reject(new Error("One uppercase letter"))
                  if (!/\d/.test(value)) return Promise.reject(new Error("One number"))
                  if (!/[@$!%*?&]/.test(value)) return Promise.reject(new Error("One special char (@$!%*?&)"))
                  return Promise.resolve()
                },
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: colors.lightBlue, marginRight: 8 }} />}
              placeholder="Create password"
              size="large"
              style={{
                borderRadius: 8,
                padding: '12px 16px',
                background: colors.white,
              }}
            />
          </Form.Item>

          <Form.Item noStyle dependencies={['password']}>
            {() => {
              const pwd = form.getFieldValue('password') || ''
              const s = getPasswordStrength(pwd)
              return pwd ? (
                <div style={{ marginBottom: 24 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Password strength
                  </Text>
                  <div
                    style={{
                      height: 6,
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${s * 33.33}%`,
                        background: s <= 1 ? '#ef4444' : s <= 2 ? colors.accent : '#22c55e',
                        borderRadius: 3,
                        transition: 'width 0.2s',
                      }}
                    />
                  </div>
                </div>
              ) : null
            }}
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
              Create account
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              block
              size="large"
              onClick={() => navigate(ROUTES.LOGIN)}
              style={{
                borderRadius: 8,
                height: 48,
                border: `2px solid ${colors.white}`,
                color: colors.white,
                background: 'transparent',
              }}
            >
              Sign in
            </Button>
          </Form.Item>
        </Form>
      </div>
    </AuthLayout>
  )
}
