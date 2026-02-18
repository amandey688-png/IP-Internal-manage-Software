import { apiClient } from './axios'

export interface DashboardMetrics {
  all_tickets: number
  pending_till_date: number
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

export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const r = await apiClient.get<DashboardMetrics>('/dashboard/metrics')
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
}
