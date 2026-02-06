import { useAuth } from './useAuth'
import { ROLES } from '../utils/constants'
import { hasRole, canAccessApproval, canAccessSettings, canAccessUsers } from '../utils/helpers'
import type { UserRole } from '../types/auth'

export const useRole = () => {
  const { user } = useAuth()
  const role = user?.role ?? 'user'

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
    canAccessApproval: canAccessApproval(role),
    canAccessSettings: canAccessSettings(role),
    canAccessUsers: canAccessUsers(role),
  }
}
