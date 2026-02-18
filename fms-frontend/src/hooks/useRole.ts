import { useAuth } from './useAuth'
import { ROLES } from '../utils/constants'
import { hasRole, canAccessApproval, canAccessSettings, canAccessUsers, canViewSection, canEditSection } from '../utils/helpers'
import type { UserRole } from '../types/auth'

export const useRole = () => {
  const { user } = useAuth()
  const role = user?.role ?? 'user'
  const sectionPermissions = user?.section_permissions

  const checkRole = (requiredRole: UserRole): boolean => {
    if (!user) return false
    return hasRole(user.role, requiredRole)
  }

  const isUser = role === ROLES.USER
  const isApprover = role === ROLES.APPROVER
  const isAdmin = role === ROLES.ADMIN || role === ROLES.MASTER_ADMIN
  const isMasterAdmin = role === ROLES.MASTER_ADMIN

  return {
    user,
    role,
    checkRole,
    isUser,
    isApprover,
    isAdmin,
    isMasterAdmin,
    canAccessApproval: canAccessApproval(role) && canViewSection('approval_status', role as UserRole, sectionPermissions),
    canAccessSettings: canAccessSettings(role) && canViewSection('settings', role as UserRole, sectionPermissions),
    canAccessUsers: canAccessUsers(role) && canViewSection('users', role as UserRole, sectionPermissions),
    canViewSectionByKey: (sectionKey: string) => canViewSection(sectionKey, role as UserRole, sectionPermissions),
    canEditSectionByKey: (sectionKey: string) => canEditSection(sectionKey, role as UserRole, sectionPermissions),
  }
}
