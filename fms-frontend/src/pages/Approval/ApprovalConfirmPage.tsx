import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, Result, Spin, Typography } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { apiClient } from '../../api/axios'

const { Text } = Typography

export const ApprovalConfirmPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const action = searchParams.get('action')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    if (!token || !action || !['approve', 'reject'].includes(action)) {
      setStatus('error')
      setMessage('Invalid or missing token or action.')
      return
    }
    apiClient
      .post('/approval/execute-by-token', { token, action })
      .then((res) => {
        const data = res?.data as { success?: boolean; status?: string }
        if (data?.success) {
          setStatus('success')
          setMessage(data?.status === 'approved' ? 'Ticket has been approved.' : 'Ticket has been rejected.')
        } else {
          setStatus('error')
          setMessage('Could not complete the action.')
        }
      })
      .catch((err: { response?: { data?: { detail?: string } } }) => {
        setStatus('error')
        const detail = err?.response?.data?.detail
        setMessage(typeof detail === 'string' ? detail : Array.isArray(detail) ? detail[0] : 'Invalid or expired link.')
      })
  }, [token, action])

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Processing..." />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560, margin: '48px auto', padding: 24 }}>
      <Card>
        {status === 'success' ? (
          <Result
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title="Done"
            subTitle={message}
          />
        ) : (
          <Result
            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            title="Action failed"
            subTitle={message}
          />
        )}
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>
          You can close this window.
        </Text>
      </Card>
    </div>
  )
}
