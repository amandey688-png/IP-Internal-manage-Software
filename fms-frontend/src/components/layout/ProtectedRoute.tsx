import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { ROUTES } from '../../utils/constants'
import type { UserRole } from '../../types/auth'
import { canViewSection } from '../../utils/helpers'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: UserRole
  /** User must have View on at least one of these sections (OR). Same rules as sidebar (API section_permissions). */
  sectionKeys?: string[]
}

export const ProtectedRoute = ({ children, requiredRole, sectionKeys }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return <LoadingSpinner fullPage />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (requiredRole && user) {
    const roleHierarchy: Record<string, number> = {
      user: 1,
      approver: 2,
      admin: 3,
      master_admin: 4,
    }
    const userLevel = roleHierarchy[user.role] ?? 0
    const requiredLevel = roleHierarchy[requiredRole] ?? 0
    if (userLevel < requiredLevel) {
      return <Navigate to={ROUTES.DASHBOARD} replace />
    }
  }

  if (sectionKeys?.length && user) {
    const ok = sectionKeys.some((key) =>
      canViewSection(key, user.role as UserRole, user.section_permissions)
    )
    if (!ok) {
      return <Navigate to={ROUTES.ACCESS_DENIED} replace />
    }
  }

  return <>{children}</>
}
