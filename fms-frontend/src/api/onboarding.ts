import { apiClient } from './axios'
import { API_ENDPOINTS } from '../utils/constants'

export interface PaymentStatusRecord {
  id: string
  timestamp: string
  reference_no: string
  company_name: string
  payment_status: 'Done' | 'Not Done'
  payment_received_date: string | null
  poc_name: string | null
  poc_contact: string | null
  accounts_remarks: string | null
  created_at: string
}

export const onboardingApi = {
  listPaymentStatus: () =>
    apiClient
      .get<{ items: PaymentStatusRecord[] }>(API_ENDPOINTS.ONBOARDING_PAYMENT_STATUS.LIST)
      .then((r) => r.data),

  createPaymentStatus: (payload: {
    company_name: string
    payment_status: 'Done' | 'Not Done'
    payment_received_date?: string | null
    poc_name?: string | null
    poc_contact?: string | null
    accounts_remarks?: string | null
  }) =>
    apiClient
      .post<PaymentStatusRecord>(API_ENDPOINTS.ONBOARDING_PAYMENT_STATUS.CREATE, payload)
      .then((r) => r.data),
}
