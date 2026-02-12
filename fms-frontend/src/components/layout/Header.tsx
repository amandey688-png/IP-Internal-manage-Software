import { Layout, Dropdown, Avatar, Space, Typography, Button } from 'antd'
import { UserOutlined, LogoutOutlined, PlusOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getInitials } from '../../utils/helpers'
import { ROUTES, APP_NAME } from '../../utils/constants'

const { Header: AntHeader } = Layout
const { Text } = Typography

interface HeaderProps {
  onAddNew?: () => void
}

export const Header = ({ onAddNew }: HeaderProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const searchParams = new URLSearchParams(location.search)
  const section = searchParams.get('section')
  const viewApproval = searchParams.get('view') === 'approval'
  const hideAddNew = section === 'chores-bugs' || section === 'completed-chores-bugs' || section === 'completed-feature' || section === 'solutions' || location.pathname === ROUTES.STAGING || location.pathname === ROUTES.CHECKLIST || location.pathname === ROUTES.DELEGATION || viewApproval

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
      className="no-print"
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        right: 0,
        left: 220,
        zIndex: 1000,
      }}
    >
      <Space>
        <Text strong style={{ fontSize: 16 }}>{APP_NAME}</Text>
        <Text type="secondary" style={{ marginLeft: 16 }}>{breadcrumb}</Text>
      </Space>
      <Space size="middle">
        {!hideAddNew && onAddNew && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAddNew}
            style={{ fontWeight: 500 }}
          >
            Submit Support Ticket
          </Button>
        )}
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
