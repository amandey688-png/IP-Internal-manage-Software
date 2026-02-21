import { useState } from 'react'
import { Layout } from 'antd'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { SupportFormModal } from '../forms/SupportFormModal'

const { Content } = Layout

interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [supportModalOpen, setSupportModalOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f6f8' }}>
      <Sidebar
        className="no-print"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Layout style={{ marginLeft: 0 }}>
        <Header
          onAddNew={() => setSupportModalOpen(true)}
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
