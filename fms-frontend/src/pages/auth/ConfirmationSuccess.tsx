import { useEffect, useState } from 'react'
import { Card, Typography, Button, message } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '../../utils/constants'

const { Title, Text } = Typography

export const ConfirmationSuccess = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [, setConfirmed] = useState(false)

  useEffect(() => {
    // Check if this is coming from email confirmation link
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    
    if (token && type === 'signup') {
      // Email confirmation callback
      setConfirmed(true)
      message.success('Email confirmed successfully! You can now log in.')
    } else {
      // Coming from registration success page
      setConfirmed(true)
    }

    const timer = setTimeout(() => {
      navigate(ROUTES.LOGIN)
    }, 5000)

    return () => clearTimeout(timer)
  }, [navigate, searchParams])

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
          style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }}
        />
        <Title level={3}>Email Confirmed! ✅</Title>
        <Text type="success" style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>
          Your email has been successfully confirmed.
        </Text>
        <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 24 }}>
          Your account is now active. You can log in to access the application.
        </Text>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 24 }}>
          Redirecting to login page in 5 seconds...
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
