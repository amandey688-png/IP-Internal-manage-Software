import { apiClient } from './axios'

export const DASHBOARD_KPI_NAMES = ['Shreyasi', 'Rimpa'] as const
export type DashboardKpiPerson = (typeof DASHBOARD_KPI_NAMES)[number]

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const
export const WEEKS = ['week 1', 'week 2', 'week 3', 'week 4', 'week 5'] as const
export const YEARS = ['2024', '2025', '2026', '2027'] as const

export interface DashboardKpiFilters {
  name: string
  month: string
  year: string
  week: string
}

export interface ChecklistRow {
  task_name: string
  frequency: string
  status: string
  details?: string
}

export interface DelegationRow {
  task: string
  status: string
  shifted_week?: string
  month?: string
  button_url?: string
}

export interface SupportFmsDelayItem {
  type: string
  company?: string
  requested_person?: string
  submitted_by?: string
  title?: string
  description?: string
  reference_no?: string
  delay_time?: string
  query_arrival?: string
  month?: string
}

export interface SupportFmsSection {
  value: number
  target: number
  percentage?: string
  details?: SupportFmsDelayItem[]
}

export interface SuccessKpiClickEventRow {
  company?: string
  feature?: string
  clickedAt?: string
}

export interface SuccessKpiDetailLists {
  /** POC Collected: reference numbers for rows in the selected week */
  referenceNumbers?: string[]
  companies: string[]
  messageOwner?: string[]
  dates?: string[]
  responses?: string[]
  contacts?: string[]
  callPOC?: string[]
  messagePOC?: string[]
  trainingDates?: string[]
  trainingStatus?: string[]
  remarks?: string[]
  features?: (string[])[]
  followupDates?: string[]
  beforePercentages?: (number | null)[]
  afterPercentages?: (number | null)[]
  /** Training Follow-up: follow-up rows logged in selected week */
  followupRowsWeek?: number
  /** Training Follow-up: "Add follow-up" button clicks in selected week */
  clickCountWeek?: number
  /** Training Follow-up: per-click rows for the modal (selected week) */
  clickEventsWeek?: SuccessKpiClickEventRow[]
}

export interface SuccessKpiSection {
  currentValue: number
  targetValue: number
  percentage: string
  details: SuccessKpiDetailLists
}

export interface SuccessKpiResponse {
  pocCollected: SuccessKpiSection
  weeklyTrainingTarget: SuccessKpiSection
  trainingFollowUp: SuccessKpiSection
  successIncrease: SuccessKpiSection
  overallPercentage: number
  meta?: {
    weekLabel?: string
    targets?: { poc: number; training: number; followup: number; increase: number }
  }
}

export interface DashboardKpiResponse {
  success: boolean
  error?: string
  meta?: {
    applied: DashboardKpiFilters
    availableMonths: string[]
    availableWeeks: string[]
    availableYears: string[]
  }
  checklist?: {
    rows: ChecklistRow[]
    totals?: { done: number; pending: number }
    weeklyPercentage: number
  }
  delegation?: {
    rows: DelegationRow[]
    weeklyPercentage: number
  }
  supportFMS?: {
    responseDelay: SupportFmsSection
    completionDelay: SupportFmsSection
    pendingChores: SupportFmsSection
    weeklyPercentage?: number
  }
  successKpi?: SuccessKpiResponse
  monthlyPercentages?: {
    checklist: number
    delegation: number
    supportFMS: number
  }
  weeklyProgress?: {
    weeks: string[]
    checklist: number[]
    delegation: number[]
    supportFMS: number[]
    successKpi?: number[]
  }
}

export const dashboardKpiApi = {
  getData: (filters: { name: string; month: string; year: string; week: string }) =>
    apiClient
      .get<DashboardKpiResponse>('/dashboard/kpi', {
        params: {
          name: filters.name,
          month: filters.month,
          year: filters.year,
          week: filters.week,
        },
      })
      .then((r) => r.data),
}
