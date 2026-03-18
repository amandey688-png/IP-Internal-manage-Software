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
  rejected_tickets: 'Rejected Tickets',
  completed_feature: 'Completed Feature',
  solution: 'Solution',
  task: 'Task',
  success_performance: 'Performance Monitoring',
  success_comp_perform: 'Comp- Perform',
  client_to_lead: 'Client to Lead',
  leads: 'Lead',
  onboarding: 'Onboarding',
  onboarding_payment_status: 'Payment Status',
  client_payment: 'Client Payment',
  settings: 'Settings',
  users: 'Users',
}

export const ROUTES = {
  REGISTER: '/register',
  LOGIN: '/login',
  OTP: '/otp',
  CONFIRMATION_SUCCESS: '/confirmation-success',
  DASHBOARD: '/dashboard',
  DASHBOARD_KPI: '/dashboard/kpi',
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
  SUCCESS_COMP_PERFORM: '/success/comp-perform',
  /** Client to Lead module */
  CLIENT_TO_LEAD: '/client-to-lead',
  LEADS: '/client-to-lead/leads',
  LEADS_CLOSED: '/client-to-lead/leads?status=Closed',
  LEAD_DETAIL: '/client-to-lead/leads/:id',
  LEADS_IMPORT: '/client-to-lead/import',
  /** Onboarding module */
  ONBOARDING: '/onboarding',
  ONBOARDING_PAYMENT_STATUS: '/onboarding/payment-status',
  CLIENT_PAYMENT: '/onboarding/client-payment',
  /** Client Payment completed sections (moved from Payment Management after Paym-Rec) */
  CLIENT_PAYMENT_Q_COMP: '/onboarding/client-payment/completed/Q-Comp',
  CLIENT_PAYMENT_M_COMP: '/onboarding/client-payment/completed/M-Comp',
  CLIENT_PAYMENT_HF_COMP: '/onboarding/client-payment/completed/HF-Comp',
  /** Training module */
  TRAINING: '/training',
  TRAINING_CLIENT: '/training/client-training',
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
  ONBOARDING_PAYMENT_STATUS: {
    LIST: '/onboarding/payment-status',
    CREATE: '/onboarding/payment-status',
    PRE_ONBOARDING: (id: string) => `/onboarding/payment-status/${id}/pre-onboarding`,
    PRE_ONBOARDING_CHECKLIST: (id: string) => `/onboarding/payment-status/${id}/pre-onboarding-checklist`,
    POC_CHECKLIST: (id: string) => `/onboarding/payment-status/${id}/poc-checklist`,
    POC_DETAILS: (id: string) => `/onboarding/payment-status/${id}/poc-details`,
    DETAILS_COLLECTED_CHECKLIST: (id: string) => `/onboarding/payment-status/${id}/details-collected-checklist`,
    ITEM_CLEANING: (id: string) => `/onboarding/payment-status/${id}/item-cleaning`,
    ITEM_CLEANING_CHECKLIST: (id: string) => `/onboarding/payment-status/${id}/item-cleaning-checklist`,
    ORG_MASTER_ID: (id: string) => `/onboarding/payment-status/${id}/org-master-id`,
    ORG_MASTER_CHECKLIST: (id: string) => `/onboarding/payment-status/${id}/org-master-checklist`,
    SETUP_CHECKLIST: (id: string) => `/onboarding/payment-status/${id}/setup-checklist`,
    ITEM_STOCK_CHECKLIST: (id: string) => `/onboarding/payment-status/${id}/item-stock-checklist`,
    FINAL_SETUP: (id: string) => `/onboarding/payment-status/${id}/final-setup`,
  },
  CLIENT_PAYMENT: {
    LIST: '/onboarding/client-payment',
    LIST_OPEN: '/onboarding/client-payment?status=open',
    LIST_COMPLETED: (section: string) => `/onboarding/client-payment?status=completed&section=${encodeURIComponent(section)}`,
    CREATE: '/onboarding/client-payment',
  },
  LEADS: {
    LIST: '/leads',
    ACTIVE: '/leads/active',
    STAGES: '/leads/stages',
    USERS: '/leads/users',
    DETAIL: (id: string) => `/leads/${id}`,
    BY_REFERENCE: (ref: string) => `/leads/by-reference/${ref}`,
    STAGE: (id: string, slug: string) => `/leads/${id}/stages/${slug}`,
  },
  TRAINING: {
    CLIENTS: '/training/clients',
    ASSIGN: (id: string) => `/training/clients/${id}/assignment`,
    USERS: '/training/users',
    DAY0: (id: string) => `/training/clients/${id}/day0-checklist`,
    STAGES_CONFIG: '/training/stages-config',
    TRAINING_STATUS: (id: string) => `/training/clients/${id}/training-status`,
    STAGE: (id: string, stageKey: string) => `/training/clients/${id}/stages/${stageKey}`,
    AVAILABLE_FOR_MANUAL: '/training/clients/available-for-manual',
    MANUAL_ADD: '/training/clients/manual',
  },
} as const

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  OTP_EMAIL: 'otp_email',
} as const
