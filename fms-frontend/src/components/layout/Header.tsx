import { Layout, Dropdown, Avatar, Space, Typography, Button, Badge } from 'antd'
import { UserOutlined, LogoutOutlined, PlusOutlined, MenuOutlined, BellOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getInitials } from '../../utils/helpers'
import { ROUTES, APP_NAME } from '../../utils/constants'
import { dashboardApi } from '../../api/dashboard'

const { Header: AntHeader } = Layout
const { Text } = Typography

interface HeaderProps {
  onAddNew?: () => void
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export const Header = ({ onAddNew, onMenuClick, showMenuButton }: HeaderProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [activityCount, setActivityCount] = useState(0)
  const searchParams = new URLSearchParams(location.search)
  const section = searchParams.get('section')
  const viewApproval = searchParams.get('view') === 'approval'
  const hideAddNew = section === 'chores-bugs' || section === 'completed-chores-bugs' || section === 'completed-feature' || section === 'solutions' || location.pathname === ROUTES.STAGING || location.pathname === ROUTES.CHECKLIST || location.pathname === ROUTES.DELEGATION || viewApproval

  useEffect(() => {
    dashboardApi.getActivityCount().then(setActivityCount).catch(() => setActivityCount(0))
  }, [])

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate(ROUTES.SETTINGS),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ]

  const sectionLabel = viewApproval ? 'Approval Status' : section === 'chores-bugs' ? 'Chores & Bugs' : section === 'completed-chores-bugs' ? 'Completed Chores & Bugs' : section === 'completed-feature' ? 'Completed Feature' : section === 'solutions' ? 'Solution' : ''
  const breadcrumb = location.pathname === ROUTES.DASHBOARD
    ? 'Support / Support Overview'
    : location.pathname.startsWith(ROUTES.TICKETS)
      ? sectionLabel ? `Support / ${sectionLabel}` : 'Support / Tickets'
      : location.pathname.startsWith('/solutions')
        ? 'Support / Solutions'
        : location.pathname === ROUTES.STAGING
          ? 'Support / Staging'
          : location.pathname === ROUTES.CHECKLIST
            ? 'Task / Checklist'
            : location.pathname === ROUTES.DELEGATION
              ? 'Task / Delegation'
              : location.pathname

  return (
    <AntHeader
      className="no-print app-header"
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        position: 'fixed',
        top: 0,
        right: 0,
        left: 'var(--sidebar-width, 220px)',
        zIndex: 1000,
        height: 64,
      }}
    >
      <Space size="middle">
        {showMenuButton && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={onMenuClick}
            style={{ fontSize: 18 }}
            aria-label="Open menu"
          />
        )}
        <Space>
          <Text strong style={{ fontSize: 16 }}>{APP_NAME}</Text>
          <Text type="secondary" className="breadcrumb-text" style={{ marginLeft: 16 }}>{breadcrumb}</Text>
        </Space>
      </Space>
      <Space size="middle">
        {!hideAddNew && onAddNew && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAddNew}
            style={{ fontWeight: 500 }}
            className="submit-btn"
          >
            <span className="submit-btn-text">Submit Support Ticket</span>
          </Button>
        )}
        <Dropdown
          trigger={['click']}
          dropdownRender={() => (
            <div
              style={{
                background: '#fff',
                borderRadius: 8,
                boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                minWidth: 320,
                maxWidth: 400,
                maxHeight: 400,
                overflow: 'auto',
              }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>
                Activity
              </div>
              <div style={{ padding: 24, color: '#8c8c8c', textAlign: 'center' }}>
                Recent activity will appear here.
              </div>
            </div>
          )}
        >
          <Badge count={activityCount} size="small" offset={[-2, 2]}>
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{ fontSize: 18 }}
              aria-label="Activity"
            />
          </Badge>
        </Dropdown>
        <Space>
          <div style={{ textAlign: 'right' }}>
            <Text strong style={{ display: 'block' }}>{user?.full_name}</Text>
          </div>
          <Dropdown menu={{ items: menuItems }} placement="bottomRight">
            <Avatar
              style={{ backgroundColor: '#2c3e50', cursor: 'pointer' }}
              icon={user?.avatar_url ? undefined : <UserOutlined />}
              src={user?.avatar_url}
            >
              {!user?.avatar_url && user?.full_name ? getInitials(user.full_name) : null}
            </Avatar>
          </Dropdown>
        </Space>
      </Space>
    </AntHeader>
  )
}
