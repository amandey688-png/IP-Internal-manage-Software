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
  RiseOutlined,
  LineChartOutlined,
  TeamOutlined,
  UserAddOutlined,
  AuditOutlined,
  ReadOutlined,
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

const isSuccessPage = (pathname: string) =>
  pathname === ROUTES.SUCCESS_PERFORMANCE || pathname === ROUTES.SUCCESS_COMP_PERFORM

const isClientToLeadPage = (pathname: string) =>
  pathname === ROUTES.LEADS || pathname.startsWith(ROUTES.LEADS + '/') || pathname === ROUTES.LEADS_IMPORT

const isOnboardingPage = (pathname: string) =>
  pathname.startsWith(ROUTES.ONBOARDING)

const isTrainingPage = (pathname: string) =>
  pathname.startsWith(ROUTES.TRAINING)

const isClientPaymentPage = (pathname: string) =>
  pathname === ROUTES.CLIENT_PAYMENT || pathname.startsWith(ROUTES.CLIENT_PAYMENT + '/')

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
  const [successOpen, setSuccessOpen] = useState(isSuccessPage(location.pathname))
  const [clientToLeadOpen, setClientToLeadOpen] = useState(isClientToLeadPage(location.pathname))
  const [onboardingOpen, setOnboardingOpen] = useState(isOnboardingPage(location.pathname))
  const [trainingOpen, setTrainingOpen] = useState(isTrainingPage(location.pathname))
  const [dbClientOpen, setDbClientOpen] = useState(false)
  const [clientPaymentOpen, setClientPaymentOpen] = useState(isClientPaymentPage(location.pathname))
  useEffect(() => {
    if (isSupportPage(location.pathname)) setSupportOpen(true)
  }, [location.pathname])
  useEffect(() => {
    if (isClientPaymentPage(location.pathname)) setClientPaymentOpen(true)
  }, [location.pathname])
  useEffect(() => {
    if (isTaskPage(location.pathname)) setTaskOpen(true)
  }, [location.pathname])
  useEffect(() => {
    if (isSuccessPage(location.pathname)) setSuccessOpen(true)
  }, [location.pathname])
  useEffect(() => {
    if (isClientToLeadPage(location.pathname)) setClientToLeadOpen(true)
  }, [location.pathname])
  useEffect(() => {
    if (isOnboardingPage(location.pathname)) setOnboardingOpen(true)
  }, [location.pathname])
  useEffect(() => {
    if (isTrainingPage(location.pathname)) setTrainingOpen(true)
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
    { key: `${ROUTES.TICKETS}?section=rejected-tickets`, icon: <FileTextOutlined />, label: <Link to={`${ROUTES.TICKETS}?section=rejected-tickets`} style={linkStyle}>Rejected Tickets</Link>, sectionKey: 'rejected_tickets' },
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

  const successItems: MenuProps['items'] = [
    { key: ROUTES.SUCCESS_PERFORMANCE, icon: <LineChartOutlined />, label: <Link to={ROUTES.SUCCESS_PERFORMANCE} style={linkStyle}>Performance Monitoring</Link>, sectionKey: 'success_performance' },
    { key: ROUTES.SUCCESS_COMP_PERFORM, icon: <LineChartOutlined />, label: <Link to={ROUTES.SUCCESS_COMP_PERFORM} style={linkStyle}>Comp- Perform</Link>, sectionKey: 'success_performance' },
  ]
  const filteredSuccessItems: MenuProps['items'] = successItems?.filter((item) => {
    const sectionKey = (item as { sectionKey?: string })?.sectionKey
    if (sectionKey && !canViewSectionByKey(sectionKey)) return false
    return true
  }) ?? []

  const onboardingItems: MenuProps['items'] = [
    { key: ROUTES.ONBOARDING_PAYMENT_STATUS, icon: <FileTextOutlined />, label: <Link to={ROUTES.ONBOARDING_PAYMENT_STATUS} style={linkStyle}>Payment Status</Link> },
  ]

  const trainingItems: MenuProps['items'] = [
    { key: ROUTES.TRAINING_CLIENT, icon: <ReadOutlined />, label: <Link to={ROUTES.TRAINING_CLIENT} style={linkStyle}>Client Training</Link> },
  ]

  const dbClientItems: MenuProps['items'] = [
    { key: ROUTES.DB_CLIENT_CLIENTS, icon: <ReadOutlined />, label: <Link to={ROUTES.DB_CLIENT_CLIENTS} style={linkStyle}>Clients (New)</Link> },
  ]

  const clientPaymentItems: MenuProps['items'] = [
    { key: ROUTES.CLIENT_PAYMENT, icon: <FileTextOutlined />, label: <Link to={ROUTES.CLIENT_PAYMENT} style={linkStyle}>Payment Management</Link> },
    { key: ROUTES.CLIENT_PAYMENT_Q_COMP, icon: <FileTextOutlined />, label: <Link to={ROUTES.CLIENT_PAYMENT_Q_COMP} style={linkStyle}>Q-Comp</Link> },
    { key: ROUTES.CLIENT_PAYMENT_M_COMP, icon: <FileTextOutlined />, label: <Link to={ROUTES.CLIENT_PAYMENT_M_COMP} style={linkStyle}>M-Comp</Link> },
    { key: ROUTES.CLIENT_PAYMENT_HF_COMP, icon: <FileTextOutlined />, label: <Link to={ROUTES.CLIENT_PAYMENT_HF_COMP} style={linkStyle}>HF-Comp</Link> },
  ]

  const leadItems: MenuProps['items'] = [
    { key: ROUTES.LEADS, icon: <UserAddOutlined />, label: <Link to={ROUTES.LEADS} style={linkStyle}>Lead</Link> },
    { key: ROUTES.LEADS_CLOSED, icon: <UserAddOutlined />, label: <Link to={ROUTES.LEADS_CLOSED} style={linkStyle}>Closed Leads</Link> },
    { key: ROUTES.LEADS_IMPORT, icon: <FileTextOutlined />, label: <Link to={ROUTES.LEADS_IMPORT} style={linkStyle}>Import from sheet (Generate SQL)</Link> },
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
    ...(filteredSuccessItems.length > 0 ? [{
      key: 'success',
      icon: <RiseOutlined />,
      label: 'Success',
      children: filteredSuccessItems,
      onTitleClick: () => setSuccessOpen(!successOpen),
    }] : []),
    {
      key: 'client-to-lead',
      icon: <TeamOutlined />,
      label: 'Client to Lead',
      children: leadItems,
      onTitleClick: () => setClientToLeadOpen(!clientToLeadOpen),
    },
    {
      key: 'onboarding',
      icon: <AuditOutlined />,
      label: 'Onboarding',
      children: onboardingItems,
      onTitleClick: () => setOnboardingOpen(!onboardingOpen),
    },
    {
      key: 'training',
      icon: <ReadOutlined />,
      label: 'Training',
      children: trainingItems,
      onTitleClick: () => setTrainingOpen(!trainingOpen),
    },
    {
      key: 'client-payment',
      icon: <FileTextOutlined />,
      label: 'Client Payment',
      children: clientPaymentItems,
      onTitleClick: () => setClientPaymentOpen(!clientPaymentOpen),
    },
    {
      key: 'db-client',
      icon: <ReadOutlined />,
      label: 'DB Client',
      children: dbClientItems,
      onTitleClick: () => setDbClientOpen(!dbClientOpen),
    },
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
    ...(successOpen ? ['success'] : []),
    ...(clientToLeadOpen ? ['client-to-lead'] : []),
    ...(onboardingOpen ? ['onboarding'] : []),
    ...(trainingOpen ? ['training'] : []),
    ...(clientPaymentOpen ? ['client-payment'] : []),
  ]

  const handleOpenChange = (keys: string[]) => {
    setSupportOpen(keys.includes('support'))
    setTaskOpen(keys.includes('task'))
    setSuccessOpen(keys.includes('success'))
    setClientToLeadOpen(keys.includes('client-to-lead'))
    setOnboardingOpen(keys.includes('onboarding'))
    setTrainingOpen(keys.includes('training'))
    setDbClientOpen(keys.includes('db-client'))
    setClientPaymentOpen(keys.includes('client-payment'))
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
