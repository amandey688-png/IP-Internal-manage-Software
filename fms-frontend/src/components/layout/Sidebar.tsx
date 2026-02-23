import { Menu, Drawer } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  RocketOutlined,
  UserOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  CheckSquareOutlined,
  SendOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useRole } from '../../hooks/useRole'
import { ROUTES } from '../../utils/constants'
import { useState, useEffect } from 'react'


const isSupportPage = (pathname: string) =>
  pathname.startsWith(ROUTES.TICKETS) ||
  pathname === ROUTES.STAGING ||
  pathname === ROUTES.SUPPORT_DASHBOARD

const isTaskPage = (pathname: string) =>
  pathname === ROUTES.CHECKLIST || pathname === ROUTES.DELEGATION

interface SidebarProps {
  className?: string
  open?: boolean
  onClose?: () => void
}

export const Sidebar = ({ className, open, onClose }: SidebarProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { canAccessApproval, canAccessSettings, canAccessUsers, canViewSectionByKey } = useRole()
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
    { key: ROUTES.SUPPORT_DASHBOARD, icon: <DashboardOutlined />, label: <Link to={ROUTES.SUPPORT_DASHBOARD} style={linkStyle}>Support Dashboard</Link>, sectionKey: 'support_dashboard' },
    { key: ROUTES.TICKETS, icon: <FileTextOutlined />, label: <Link to={ROUTES.TICKETS} style={linkStyle}>All Tickets</Link>, sectionKey: 'all_tickets' },
    { key: `${ROUTES.TICKETS}?section=chores-bugs`, icon: <FileTextOutlined />, label: <Link to={{ pathname: ROUTES.TICKETS, search: 'section=chores-bugs' }} style={linkStyle}>Chores & Bugs</Link>, sectionKey: 'chores_bugs' },
    { key: ROUTES.STAGING, icon: <RocketOutlined />, label: <Link to={ROUTES.STAGING} style={linkStyle}>Staging</Link>, sectionKey: 'staging' },
    { key: `${ROUTES.TICKETS}?type=feature`, icon: <FileTextOutlined />, label: <Link to={`${ROUTES.TICKETS}?type=feature`} style={linkStyle}>Feature</Link>, sectionKey: 'feature' },
    { key: `${ROUTES.TICKETS}?type=feature&view=approval`, icon: <FileTextOutlined />, label: <Link to={`${ROUTES.TICKETS}?type=feature&view=approval`} style={linkStyle}>Approval Status</Link>, sectionKey: 'approval_status' },
    { key: `${ROUTES.TICKETS}?section=completed-chores-bugs`, icon: <FileTextOutlined />, label: <Link to={`${ROUTES.TICKETS}?section=completed-chores-bugs`} style={linkStyle}>Completed Chores & Bugs</Link>, sectionKey: 'completed_chores_bugs' },
    { key: `${ROUTES.TICKETS}?section=completed-feature`, icon: <FileTextOutlined />, label: <Link to={`${ROUTES.TICKETS}?section=completed-feature`} style={linkStyle}>Completed Feature</Link>, sectionKey: 'completed_feature' },
  ]
  const supportItems: MenuProps['items'] = allSupportItems?.filter((item) => {
    const key = item?.key as string
    const sectionKey = (item as { sectionKey?: string })?.sectionKey
    if (sectionKey && !canViewSectionByKey(sectionKey)) return false
    if (key?.includes('view=approval')) return canAccessApproval
    return true
  }) ?? []

  const taskItems: MenuProps['items'] = [
    { key: ROUTES.CHECKLIST, icon: <CheckSquareOutlined />, label: <Link to={ROUTES.CHECKLIST} style={linkStyle}>Checklist</Link> },
    { key: ROUTES.DELEGATION, icon: <SendOutlined />, label: <Link to={ROUTES.DELEGATION} style={linkStyle}>Delegation</Link> },
  ]

  const showDashboard = canViewSectionByKey('dashboard')
  const hasAnySupportSection = (supportItems?.length ?? 0) > 0

  const menuItems: MenuProps['items'] = [
    ...(showDashboard ? [{ key: ROUTES.DASHBOARD, icon: <DashboardOutlined />, label: <Link to={ROUTES.DASHBOARD} style={linkStyle}>Dashboard</Link> }] : []),
    ...(hasAnySupportSection ? [{
      key: 'support',
      icon: <FileTextOutlined />,
      label: 'Support',
      children: supportItems,
      onTitleClick: () => setSupportOpen(!supportOpen),
    }] : []),
    ...(canViewSectionByKey('task') ? [{
      key: 'task',
      icon: <UnorderedListOutlined />,
      label: 'Task',
      children: taskItems,
      onTitleClick: () => setTaskOpen(!taskOpen),
    }] : []),
    ...(canAccessUsers ? [{ key: ROUTES.USERS, icon: <UserOutlined />, label: <Link to={ROUTES.USERS} style={linkStyle}>Users</Link> }] : []),
    ...(canAccessSettings ? [{ key: ROUTES.SETTINGS, icon: <SettingOutlined />, label: <Link to={ROUTES.SETTINGS} style={linkStyle}>Settings</Link> }] : []),
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      label: 'Need Help?',
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'help') return
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

  return (
    <Drawer
      title={null}
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
