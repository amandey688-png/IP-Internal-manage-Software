import { Result, Button, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getFirstAllowedRoute } from '../utils/helpers'

/** Shown when a signed-in user hits a route for a section they are not allowed to view. */
export const AccessDeniedPage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const landing = user ? getFirstAllowedRoute(user) : null

  return (
    <div style={{ padding: 48, maxWidth: 560, margin: '0 auto' }}>
      <Result
        status="403"
        title="No access to this section"
        subTitle="Your account does not have permission to open this page. Ask a Master Admin to grant the section under Users → Edit user → Section permissions."
        extra={
          <Space>
            {landing ? (
              <Button type="primary" onClick={() => navigate(landing, { replace: true })}>
                Go to an allowed page
              </Button>
            ) : null}
            <Button onClick={() => logout()}>Sign out</Button>
          </Space>
        }
      />
    </div>
  )
}
