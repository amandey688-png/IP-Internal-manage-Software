import { useEffect, useState } from 'react'
import { Card, Typography, Button, message } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '../../utils/constants'

const { Title, Text } = Typography

export const ConfirmationSuccess = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [remainingSeconds, setRemainingSeconds] = useState(5)

  useEffect(() => {
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    if (token && type === 'signup') {
      message.success('Email confirmed successfully! You can now log in.')
    }
  }, [searchParams])

  useEffect(() => {
    if (remainingSeconds <= 0) {
      navigate(ROUTES.LOGIN)
      return
    }
    const timer = setInterval(() => setRemainingSeconds((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [remainingSeconds, navigate])

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
      <Card style={{ width: 400, textAlign: 'center' }}>
        <CheckCircleOutlined
          aria-hidden="true"
          style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }}
        />
        <Title level={3}>Email Confirmed!</Title>
        <Text type="success" style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>
          Your email has been successfully confirmed.
        </Text>
        <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 24 }}>
          Your account is now active. You can log in to access the application.
        </Text>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 24 }}>
          Redirecting to login page in {remainingSeconds} second{remainingSeconds !== 1 ? 's' : ''}...
        </Text>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate(ROUTES.LOGIN)}
          style={{ width: '100%' }}
        >
          Go to Login Now
        </Button>
      </Card>
    </div>
  )
}
