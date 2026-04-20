import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Layout } from 'antd'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { SupportFormModal } from '../forms/SupportFormModal'
import { ROUTES, canViewDbClientDbDash, canViewPendingPaymentDetails } from '../../utils/constants'
import { useRole } from '../../hooks/useRole'
import { useAuth } from '../../hooks/useAuth'
import { startIdleRoutePrefetch } from '../../utils/routePrefetch'

const { Content } = Layout

const HIDDEN_ADD_NEW_SECTIONS = ['completed-chores-bugs', 'completed-feature', 'solutions']

interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [supportModalOpen, setSupportModalOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const { canAccessApproval, canAccessUsers, canAccessSettings, canViewSectionByKey } = useRole()
  const section = new URLSearchParams(location.search).get('section')
  const showAddNew =
    location.pathname === ROUTES.SUPPORT_DASHBOARD ||
    (location.pathname === ROUTES.TICKETS && !HIDDEN_ADD_NEW_SECTIONS.includes(section ?? ''))

  useEffect(() => {
    if (!user) return
    const routeKeys: string[] = []

    if (canViewSectionByKey('dashboard')) routeKeys.push(ROUTES.DASHBOARD)
    if (canViewSectionByKey('dashboard_kpi') || canViewSectionByKey('dashboard')) routeKeys.push(ROUTES.DASHBOARD_KPI)
    if (canViewSectionByKey('support_dashboard')) routeKeys.push(ROUTES.SUPPORT_DASHBOARD)
    if (canViewSectionByKey('all_tickets')) routeKeys.push(ROUTES.TICKETS)
    if (canViewSectionByKey('chores_bugs')) routeKeys.push(`${ROUTES.TICKETS}?section=chores-bugs`)
    if (canViewSectionByKey('staging')) routeKeys.push(ROUTES.STAGING)
    if (canViewSectionByKey('feature')) routeKeys.push(`${ROUTES.TICKETS}?type=feature`)
    if (canAccessApproval && canViewSectionByKey('approval_status')) routeKeys.push(`${ROUTES.TICKETS}?type=feature&view=approval`)
    if (canViewSectionByKey('completed_chores_bugs')) routeKeys.push(`${ROUTES.TICKETS}?section=completed-chores-bugs`)
    if (canViewSectionByKey('rejected_tickets')) routeKeys.push(`${ROUTES.TICKETS}?section=rejected-tickets`)
    if (canViewSectionByKey('completed_feature')) routeKeys.push(`${ROUTES.TICKETS}?section=completed-feature`)

    if (canViewSectionByKey('task')) {
      routeKeys.push(ROUTES.CHECKLIST, ROUTES.DELEGATION)
    }
    if (canViewSectionByKey('success_performance')) {
      routeKeys.push(ROUTES.SU_DASH, ROUTES.SUCCESS_DASHBOARD, ROUTES.SUCCESS_PERFORMANCE)
    }
    if (canViewSectionByKey('success_comp_perform')) routeKeys.push(ROUTES.SUCCESS_COMP_PERFORM)

    if (canViewSectionByKey('leads') || canViewSectionByKey('client_to_lead')) {
      routeKeys.push(ROUTES.LEADS, ROUTES.LEADS_CLOSED)
    }
    if (canViewSectionByKey('onboarding') || canViewSectionByKey('onboarding_payment_status')) {
      routeKeys.push(ROUTES.ONBOARDING_PAYMENT_STATUS)
    }
    if (canViewSectionByKey('training')) routeKeys.push(ROUTES.TRAINING_CLIENT)
    if (canViewSectionByKey('db_client')) {
      routeKeys.push(ROUTES.DB_CLIENT_CLIENT_ONB, ROUTES.DB_CLIENT_CLIENT_ONB_INACTIVE)
      if (canViewDbClientDbDash(user?.email)) routeKeys.push(ROUTES.DB_CLIENT_DB_DASH)
    }
    if (canViewSectionByKey('client_payment')) {
      routeKeys.push(
        ROUTES.CLIENT_PAYMENT,
        ROUTES.CLIENT_PAYMENT_Q_COMP,
        ROUTES.CLIENT_PAYMENT_M_COMP,
        ROUTES.CLIENT_PAYMENT_HF_COMP,
        ROUTES.CLIENT_PAYMENT_PAYMENT_AGEING,
      )
    }
    if (canViewPendingPaymentDetails(user?.email)) routeKeys.push(ROUTES.CLIENT_PAYMENT_PENDING_DETAILS)
    if (canAccessUsers) routeKeys.push(ROUTES.USERS)
    if (canAccessSettings) routeKeys.push(ROUTES.SETTINGS)

    startIdleRoutePrefetch(routeKeys)
  }, [user, canAccessApproval, canAccessUsers, canAccessSettings, canViewSectionByKey])

  return (
    <Layout style={{ minHeight: '100vh', background: '#F5F7FB' }}>
      <Sidebar
        className="no-print"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Layout style={{ marginLeft: 0 }}>
        <Header
          onAddNew={showAddNew ? () => setSupportModalOpen(true) : undefined}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
          showMenuButton
        />
        <Content
          className="printable-content app-content"
          style={{
            margin: '88px 24px 24px',
            padding: 24,
            background: 'transparent',
            minHeight: 280,
            fontSize: 12,
          }}
        >
          {children}
        </Content>
      </Layout>
      <SupportFormModal
        open={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        onSuccess={() => setSupportModalOpen(false)}
      />
    </Layout>
  )
}
