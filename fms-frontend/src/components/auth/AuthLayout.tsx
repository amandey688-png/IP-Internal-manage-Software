import { ReactNode } from 'react'
import { AuthIllustration } from './AuthIllustration'
import './auth.css'

const colors = {
  darkBlue: '#1e3a5f',
  lightBlue: '#7eb8da',
  white: '#ffffff',
  accent: '#f59e0b',
}

interface AuthLayoutProps {
  children: ReactNode
  variant?: 'register' | 'login'
}

export const AuthLayout = ({ children, variant = 'register' }: AuthLayoutProps) => {
  return (
    <div className="auth-split-layout" style={{ minHeight: '100vh' }}>
      <div
        className="auth-left-panel"
        style={{
          background: colors.white,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <img
          src="/logo.png"
          alt="Logo"
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            height: 40,
            width: 'auto',
            objectFit: 'contain',
            zIndex: 1,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: 32,
          }}
        >
          <AuthIllustration variant={variant} />
        </div>
      </div>
      <div
        className="auth-right-panel"
        style={{
          background: colors.darkBlue,
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  )
}
