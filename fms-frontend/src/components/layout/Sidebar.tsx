import { Layout, Menu, Space } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  RocketOutlined,
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useRole } from '../../hooks/useRole'
import { ROUTES, APP_NAME } from '../../utils/constants'
import { useState, useEffect } from 'react'

const { Sider } = Layout

const isSupportPage = (pathname: string) =>
  pathname.startsWith(ROUTES.TICKETS) ||
  pathname === ROUTES.STAGING

export const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { canAccessApproval, canAccessSettings, canAccessUsers } = useRole()
  const [supportOpen, setSupportOpen] = useState(isSupportPage(location.pathname))

  useEffect(() => {
    if (isSupportPage(location.pathname)) setSupportOpen(true)
  }, [location.pathname])

  const linkStyle = { color: 'inherit', display: 'block' }
  const allSupportItems: MenuProps['items'] = [
    { key: ROUTES.TICKETS, icon: <FileTextOutlined />, label: <Link to={ROUTES.TICKETS} style={linkStyle}>All Tickets</Link> },
    { key: `${ROUTES.TICKETS}?section=chores-bugs`, icon: <FileTextOutlined />, label: <Link to={{ pathname: ROUTES.TICKETS, search: 'section=chores-bugs' }} style={linkStyle}>Chores & Bugs</Link> },
    { key: ROUTES.STAGING, icon: <RocketOutlined />, label: <Link to={ROUTES.STAGING} style={linkStyle}>Staging</Link> },
    { key: `${ROUTES.TICKETS}?type=feature`, icon: <FileTextOutlined />, label: <Link to={`${ROUTES.TICKETS}?type=feature`} style={linkStyle}>Feature</Link> },
    { key: `${ROUTES.TICKETS}?type=feature&view=approval`, icon: <FileTextOutlined />, label: <Link to={`${ROUTES.TICKETS}?type=feature&view=approval`} style={linkStyle}>Approval Status</Link> },
    { key: `${ROUTES.TICKETS}?section=completed-chores-bugs`, icon: <FileTextOutlined />, label: <Link to={`${ROUTES.TICKETS}?section=completed-chores-bugs`} style={linkStyle}>Completed Chores & Bugs</Link> },
    { key: `${ROUTES.TICKETS}?section=completed-feature`, icon: <FileTextOutlined />, label: <Link to={`${ROUTES.TICKETS}?section=completed-feature`} style={linkStyle}>Completed Feature</Link> },
  ]
  const supportItems: MenuProps['items'] = allSupportItems?.filter((item) => {
    const key = item?.key as string
    if (key?.includes('view=approval')) return canAccessApproval
    return true
  }) ?? []

  const menuItems: MenuProps['items'] = [
    {
      key: 'activity',
      icon: <BellOutlined />,
      label: (
        <Space>
          Activity
          <span style={{
            background: '#ff4d4f',
            color: '#fff',
            borderRadius: 10,
            padding: '0 6px',
            fontSize: 11,
          }}>12</span>
        </Space>
      ),
    },
    { key: ROUTES.DASHBOARD, icon: <DashboardOutlined />, label: 'Dashboard' },
    {
      key: 'support',
      icon: <FileTextOutlined />,
      label: 'Support',
      children: supportItems,
      onTitleClick: () => setSupportOpen(!supportOpen),
    },
    ...(canAccessUsers ? [{ key: ROUTES.USERS, icon: <UserOutlined />, label: 'Users' }] : []),
    ...(canAccessSettings ? [{ key: ROUTES.SETTINGS, icon: <SettingOutlined />, label: 'Settings' }] : []),
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      label: 'Need Help?',
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'activity' || key === 'help') return
    const [path, query] = key.includes('?') ? key.split('?') : [key, '']
    navigate(query ? `${path}?${query}` : path)
  }

  const selectedKeys = [location.pathname, location.pathname + (location.search || '')]
  const openKeys = supportOpen ? ['support'] : []

  return (
    <Sider
      width={220}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: '#fafafa',
        borderRight: '1px solid #f0f0f0',
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 24,
          borderBottom: '1px solid #f0f0f0',
          fontWeight: 600,
          fontSize: 18,
          color: '#2c3e50',
        }}
      >
        {APP_NAME}
      </div>
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onOpenChange={(keys) => setSupportOpen(keys.includes('support'))}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          borderRight: 0,
          background: 'transparent',
          marginTop: 8,
        }}
      />
    </Sider>
  )
}
