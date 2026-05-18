import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, Result, Skeleton, Typography, Input, Button, Form, message } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { apiClient } from '../../api/axios'
import { PrintExport } from '../../components/common/PrintExport'

const { Text, Paragraph } = Typography
const { TextArea } = Input

export const ApprovalConfirmPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const action = searchParams.get('action')
  const [status, setStatus] = useState<'form' | 'loading' | 'success' | 'error'>('loading')
  const [resultMessage, setResultMessage] = useState<string>('')
  const [remarks, setRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const runAction = async (remarksValue?: string) => {
    if (!token || !action) return
    setSubmitting(true)
    setStatus('loading')
    try {
      const res = await apiClient.post('/approval/execute-by-token', {
        token,
        action,
        remarks: remarksValue?.trim() || undefined,
      })
      const data = res?.data as { success?: boolean; message?: string; status?: string }
      if (data?.success) {
        setStatus('success')
        setResultMessage(
          data.message ||
            (data.status === 'approved'
              ? 'Feature ticket has been approved. Thank you, Approver.'
              : 'Feature ticket has been rejected. Remarks were saved.')
        )
      } else {
        setStatus('error')
        setResultMessage('Could not complete the action.')
      }
    } catch (err: unknown) {
      setStatus('error')
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setResultMessage(
        typeof detail === 'string' ? detail : Array.isArray(detail) ? String(detail[0]) : 'Invalid or expired link.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!token || !action || !['approve', 'reject'].includes(action)) {
      setStatus('error')
      setResultMessage('Invalid or missing token or action.')
      return
    }
    if (action === 'reject') {
      setStatus('form')
      return
    }
    runAction()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, action])

  const onRejectSubmit = () => {
    if (!remarks.trim()) {
      message.warning('Please enter remarks explaining why this feature is rejected.')
      return
    }
    runAction(remarks)
  }

  if (status === 'loading' || (status === 'form' && submitting)) {
    return (
      <div style={{ maxWidth: 480, margin: '48px auto', padding: 24 }}>
        <Card>
          <Skeleton active title={{ width: '55%' }} paragraph={{ rows: 4 }} />
          <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
            Processing…
          </Text>
        </Card>
      </div>
    )
  }

  if (status === 'form' && action === 'reject') {
    return (
      <div style={{ maxWidth: 520, margin: '48px auto', padding: 24 }}>
        <Card
          style={{
            borderRadius: 16,
            border: '1px solid rgba(56,189,248,.25)',
            boxShadow: '0 12px 40px rgba(15,23,42,.12)',
          }}
        >
          <Typography.Title level={4} style={{ marginTop: 0 }}>
            Reject feature request
          </Typography.Title>
          <Paragraph type="secondary">
            Remarks are required. They will appear on the ticket in Approval Status as{' '}
            <Text strong>Rejected</Text>.
          </Paragraph>
          <Form layout="vertical" onFinish={onRejectSubmit}>
            <Form.Item label="Remarks" required>
              <TextArea
                rows={4}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Why is this feature request rejected?"
              />
            </Form.Item>
            <Button type="primary" danger htmlType="submit" loading={submitting} block>
              Confirm rejection
            </Button>
          </Form>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560, margin: '48px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <PrintExport pageTitle="Approval Confirm" />
      </div>
      <Card
        style={{
          borderRadius: 16,
          border: status === 'success' ? '1px solid #b7eb8f' : '1px solid #ffa39e',
        }}
      >
        {status === 'success' ? (
          <Result
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title="Thank you, Approver"
            subTitle={resultMessage}
          />
        ) : (
          <Result
            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            title="Action failed"
            subTitle={resultMessage}
          />
        )}
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>
          You can close this window.
        </Text>
      </Card>
    </div>
  )
}
