import { useEffect, useState } from 'react'
import { Form, Input, Button, Alert, Typography } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { ROUTES } from '../../utils/constants'

const { Text } = Typography

const colors = {
  darkBlue: '#1e3a5f',
  lightBlue: '#7eb8da',
  white: '#ffffff',
  accent: '#f59e0b',
}

/** Parse Supabase recovery redirect: #access_token=...&type=recovery&... */
function parseRecoveryTokenFromHash(): string | null {
  const raw = (window.location.hash || '').replace(/^#/, '')
  if (!raw) return null
  const params = new URLSearchParams(raw)
  const accessToken = params.get('access_token')
  const type = params.get('type')
  if (!accessToken) return null
  if (type && type !== 'recovery') return null
  return accessToken
}

export const ResetPassword = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = parseRecoveryTokenFromHash()
    setToken(t)
    if (t) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [])

  const onFinish = async (values: { password: string }) => {
    if (!token) return
    setLoading(true)
    setError(null)
    const res = await authApi.recoveryPassword(token, values.password)
    setLoading(false)
    if (res.error) {
      setError(res.error.message)
      return
    }
    setDone(true)
    setTimeout(() => navigate(ROUTES.LOGIN), 2500)
  }

  if (token === undefined) {
    return (
      <AuthLayout variant="login">
        <Text style={{ color: colors.white }}>Loading…</Text>
      </AuthLayout>
    )
  }

  if (!token) {
    return (
      <AuthLayout variant="login">
        <div style={{ width: '100%', maxWidth: 560, textAlign: 'center' }}>
          <h1 style={{ color: colors.white, fontSize: 28, marginBottom: 16 }}>Invalid or expired link</h1>
          <Text style={{ color: colors.lightBlue, display: 'block', marginBottom: 24 }}>
            Open the password reset link from your email, or request a new one from the login page.
          </Text>
          <Link to={ROUTES.LOGIN} style={{ color: colors.accent, fontWeight: 600 }}>
            Back to Sign in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout variant="login">
      <div style={{ width: '100%', maxWidth: 560 }}>
        <h1 style={{ color: colors.white, fontSize: 40, fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>
          Set new password
        </h1>
        <Text style={{ color: colors.lightBlue, display: 'block', textAlign: 'center', marginBottom: 28 }}>
          Choose a strong password (at least 8 characters).
        </Text>

        {done && (
          <Alert
            type="success"
            showIcon
            message="Password updated"
            description="Redirecting to sign in…"
            style={{ marginBottom: 24 }}
          />
        )}

        {error && (
          <Alert type="error" showIcon message={error} style={{ marginBottom: 24 }} closable onClose={() => setError(null)} />
        )}

        {!done && (
          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Enter a new password' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: colors.lightBlue, marginRight: 8, fontSize: 20 }} />}
                placeholder="New password"
                size="large"
                autoComplete="new-password"
                style={{
                  borderRadius: 15,
                  padding: '16px 20px',
                  background: colors.white,
                  fontSize: 18,
                }}
              />
            </Form.Item>
            <Form.Item
              name="confirm"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve()
                    return Promise.reject(new Error('Passwords do not match'))
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: colors.lightBlue, marginRight: 8, fontSize: 20 }} />}
                placeholder="Confirm new password"
                size="large"
                autoComplete="new-password"
                style={{
                  borderRadius: 15,
                  padding: '16px 20px',
                  background: colors.white,
                  fontSize: 18,
                }}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                style={{
                  background: colors.accent,
                  borderColor: colors.accent,
                  borderRadius: 15,
                  height: 56,
                  fontWeight: 600,
                  fontSize: 18,
                }}
              >
                Update password
              </Button>
            </Form.Item>
          </Form>
        )}

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to={ROUTES.LOGIN} style={{ color: colors.lightBlue }}>
            Back to Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
