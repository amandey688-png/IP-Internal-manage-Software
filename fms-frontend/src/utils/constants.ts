export const APP_NAME = 'IP Internal Management Software'

export const ROLES = {
  USER: 'user',
  APPROVER: 'approver',
  ADMIN: 'admin',
  MASTER_ADMIN: 'master_admin',
} as const

export type RoleType = (typeof ROLES)[keyof typeof ROLES]

/** Display labels for Role column and dropdowns */
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  master_admin: 'Master Admin',
  admin: 'Admin',
  approver: 'Approver',
  user: 'User',
}

/** Section keys and labels for Edit User permissions (View / Edit checkboxes). Add new app sections here and in backend SECTION_KEYS. */
export const SECTION_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  support_dashboard: 'Support Dashboard',
  all_tickets: 'All Tickets',
  chores_bugs: 'Chores & Bugs',
  staging: 'Staging',
  feature: 'Feature',
  approval_status: 'Approval Status',
  completed_chores_bugs: 'Completed Chores & Bugs',
  completed_feature: 'Completed Feature',
  solution: 'Solution',
  task: 'Task',
  success_performance: 'Performance Monitoring',
  settings: 'Settings',
  users: 'Users',
}

export const ROUTES = {
  REGISTER: '/register',
  LOGIN: '/login',
  OTP: '/otp',
  CONFIRMATION_SUCCESS: '/confirmation-success',
  DASHBOARD: '/dashboard',
  SUPPORT_DASHBOARD: '/support/dashboard',
  TICKETS: '/tickets',
  TICKET_DETAIL: '/tickets/:id',
  SOLUTIONS: '/solutions/:ticketId',
  STAGING: '/staging',
  /** Task module (separate from Support) */
  CHECKLIST: '/task/checklist',
  DELEGATION: '/task/delegation',
  /** Success module */
  SUCCESS_PERFORMANCE: '/success/performance',
  USERS: '/users',
  SETTINGS: '/settings',
} as const

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VERIFY_OTP: '/auth/verify-otp',
    REFRESH: '/auth/refresh',
    CURRENT_USER: '/users/me',
  },
  TICKETS: {
    LIST: '/tickets',
    DETAIL: (id: string) => `/tickets/${id}`,
    CREATE: '/tickets',
    UPDATE: (id: string) => `/tickets/${id}`,
    DELETE: (id: string) => `/tickets/${id}`,
  },
  SOLUTIONS: {
    LIST: (ticketId: string) => `/solutions/ticket/${ticketId}`,
    CREATE: '/solutions',
    UPDATE: (id: string) => `/solutions/${id}`,
  },
  STAGING: {
    LIST: '/staging/deployments',
    CREATE: '/staging/deployments',
    UPDATE: (id: string) => `/staging/deployments/${id}`,
  },
  USERS: {
    LIST: '/users',
    DETAIL: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
  },
} as const

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  OTP_EMAIL: 'otp_email',
} as const
