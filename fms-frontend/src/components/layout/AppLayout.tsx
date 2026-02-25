import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Layout } from 'antd'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { SupportFormModal } from '../forms/SupportFormModal'
import { ROUTES } from '../../utils/constants'

const { Content } = Layout

const HIDDEN_ADD_NEW_SECTIONS = ['completed-chores-bugs', 'completed-feature', 'solutions']

interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [supportModalOpen, setSupportModalOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const section = new URLSearchParams(location.search).get('section')
  const showAddNew =
    location.pathname === ROUTES.SUPPORT_DASHBOARD ||
    (location.pathname === ROUTES.TICKETS && !HIDDEN_ADD_NEW_SECTIONS.includes(section ?? ''))

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f6f8' }}>
      <Sidebar
        className="no-print"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Layout style={{ marginLeft: 0 }}>
        <Header
          onAddNew={showAddNew ? () => setSupportModalOpen(true) : undefined}
          onMenuClick={() => setSidebarOpen(true)}
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
