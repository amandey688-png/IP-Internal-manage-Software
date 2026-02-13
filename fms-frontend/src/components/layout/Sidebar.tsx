import { Layout, Menu, Space, Drawer, Grid } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  RocketOutlined,
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  CheckSquareOutlined,
  SendOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useRole } from '../../hooks/useRole'
import { ROUTES, APP_NAME } from '../../utils/constants'
import { useState, useEffect } from 'react'

const { Sider } = Layout
const { useBreakpoint } = Grid

const isSupportPage = (pathname: string) =>
  pathname.startsWith(ROUTES.TICKETS) ||
  pathname === ROUTES.STAGING

const isTaskPage = (pathname: string) =>
  pathname === ROUTES.CHECKLIST || pathname === ROUTES.DELEGATION

interface SidebarProps {
  className?: string
  open?: boolean
  onClose?: () => void
}

export const Sidebar = ({ className, open, onClose }: SidebarProps) => {
  const screens = useBreakpoint()
  const isDesktop = screens.lg ?? true
  const navigate = useNavigate()
  const location = useLocation()
  const { canAccessApproval, canAccessSettings, canAccessUsers } = useRole()
  const [supportOpen, setSupportOpen] = useState(isSupportPage(location.pathname))
  const [taskOpen, setTaskOpen] = useState(isTaskPage(location.pathname))

  useEffect(() => {
    if (isSupportPage(location.pathname)) setSupportOpen(true)
  }, [location.pathname])
  useEffect(() => {
    if (isTaskPage(location.pathname)) setTaskOpen(true)
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

  const taskItems: MenuProps['items'] = [
    { key: ROUTES.CHECKLIST, icon: <CheckSquareOutlined />, label: <Link to={ROUTES.CHECKLIST} style={linkStyle}>Checklist</Link> },
    { key: ROUTES.DELEGATION, icon: <SendOutlined />, label: <Link to={ROUTES.DELEGATION} style={linkStyle}>Delegation</Link> },
  ]

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
    {
      key: 'task',
      icon: <UnorderedListOutlined />,
      label: 'Task',
      children: taskItems,
      onTitleClick: () => setTaskOpen(!taskOpen),
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
    onClose?.()
  }

  const selectedKeys = [location.pathname, location.pathname + (location.search || '')]
  const openKeys = [
    ...(supportOpen ? ['support'] : []),
    ...(taskOpen ? ['task'] : []),
  ]

  const handleOpenChange = (keys: string[]) => {
    setSupportOpen(keys.includes('support'))
    setTaskOpen(keys.includes('task'))
  }

  const menuContent = (
    <>
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
        onOpenChange={handleOpenChange}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          borderRight: 0,
          background: 'transparent',
          marginTop: 8,
        }}
      />
    </>
  )

  if (isDesktop) {
    return (
      <Sider
        className={`${className ?? ''} sidebar-desktop`}
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
        {menuContent}
      </Sider>
    )
  }

  return (
    <Drawer
      title={APP_NAME}
      placement="left"
      open={open}
      onClose={onClose}
      width={260}
      styles={{ body: { padding: 0 } }}
    >
      {menuContent}
    </Drawer>
  )
}
