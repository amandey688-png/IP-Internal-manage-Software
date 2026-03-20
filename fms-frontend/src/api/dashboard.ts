import { apiClient } from './axios'

export interface DashboardMetrics {
  all_tickets: number
  pending_till_date: number
  total_pending_bug_till_date: number
  pending_till_date_exclude_demo_c: number
  pending_chores_include_demo_c: number
  response_delay: number
  completion_delay: number
  total_last_week: number
  pending_last_week: number
  staging_pending_feature: number
  staging_pending_chores_bugs: number
}

export interface TrendPoint {
  month: string
  response_delay: number
  completion_delay: number
}

export interface DashboardDetailTicket {
  id: string
  referenceNo: string
  title: string
  description?: string
  type: string
  company: string
  status: string
}

export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const r = await apiClient.get<DashboardMetrics>('/dashboard/metrics')
    return r.data
  },
  getDetail: async (metric: string): Promise<{ success: boolean; metric: string; tickets: DashboardDetailTicket[]; total: number }> => {
    const r = await apiClient.get<{ success: boolean; metric: string; tickets: DashboardDetailTicket[]; total: number }>('/dashboard/detail', { params: { metric } })
    return r.data
  },
  getTrends: async (): Promise<{ data: TrendPoint[] }> => {
    const r = await apiClient.get<{ data: TrendPoint[] }>('/dashboard/trends')
    return r.data
  },
  getActivityCount: async (): Promise<number> => {
    const r = await apiClient.get<{ count: number }>('/activity/count')
    return r.data?.count ?? 0
  },
  getPaymentActions: async (): Promise<{
    items: Array<{
      client_payment_id: string
      company_name?: string
      invoice_number?: string
      reference_no?: string
      invoice_date?: string | null
      invoice_amount?: string | null
      genre?: string | null
      tagged_user_id?: string | null
      tagged_user_name?: string | null
      tagged_user_email?: string | null
    }>
  }> => {
    const r = await apiClient.get<{
      items: Array<{
        client_payment_id: string
        company_name?: string
        invoice_number?: string
        reference_no?: string
        invoice_date?: string | null
        invoice_amount?: string | null
        genre?: string | null
        tagged_user_id?: string | null
        tagged_user_name?: string | null
        tagged_user_email?: string | null
      }>
    }>('/dashboard/payment-actions')
    return r.data
  },
  submitPaymentAction: async (body: { client_payment_id: string; person: string; remarks: string }): Promise<{ success: boolean }> => {
    const r = await apiClient.post<{ success: boolean }>('/dashboard/payment-actions/submit', body)
    return r.data
  },
}
