import { apiClient } from './axios'
import { API_ENDPOINTS } from '../utils/constants'
import {
  API_CACHE_TTL_MS,
  sessionApiCacheGet,
  sessionApiCacheSet,
  sessionApiCacheRemove,
} from '../utils/sessionApiCache'

const LEADS_ACTIVE_CACHE_KEY = 'leads:list-active'

export interface Lead {
  id: string
  company_name: string
  stage: string
  assigned_poc_id?: string
  assigned_poc_name?: string
  reference_no: string
  status: 'Open' | 'Closed'
  created_at: string
  stage_data?: Record<string, { data: Record<string, unknown>; updated_at?: string }>
}

export interface ActiveLeadRow {
  id: string
  reference_no: string
  company_name: string
  stage: string
  assigned_poc_name: string
  person_name: string
  city: string
  state: string
}

export const leadsApi = {
  getStages: () =>
    apiClient.get<{ stages: string[] }>(API_ENDPOINTS.LEADS.STAGES).then((r) => r.data),

  getUsers: () =>
    apiClient.get<{ users: { id: string; full_name: string }[] }>(API_ENDPOINTS.LEADS.USERS).then((r) => r.data),

  list: (params?: { status?: string; company?: string; stage?: string; reference_no?: string; date_from?: string; date_to?: string }) =>
    apiClient
      .get<{ leads: Lead[] }>(API_ENDPOINTS.LEADS.LIST, { params: params || {} })
      .then((r) => r.data),

  /** Active (Open) leads with person_name, city, state for dashboard */
  listActive: async (): Promise<{ leads: ActiveLeadRow[] }> => {
    const cached = sessionApiCacheGet<{ leads: ActiveLeadRow[] }>(LEADS_ACTIVE_CACHE_KEY)
    if (cached) return cached
    const r = await apiClient.get<{ leads: ActiveLeadRow[] }>(API_ENDPOINTS.LEADS.ACTIVE)
    const data = r.data
    sessionApiCacheSet(LEADS_ACTIVE_CACHE_KEY, data, API_CACHE_TTL_MS.leadsListActive)
    return data
  },

  get: (id: string) => apiClient.get<Lead>(API_ENDPOINTS.LEADS.DETAIL(id)).then((r) => r.data),

  /** Get lead by reference number (for pretty URL /client-to-lead/leads/DEMO0001) */
  getByReference: (ref: string) =>
    apiClient.get<Lead>(API_ENDPOINTS.LEADS.BY_REFERENCE(ref)).then((r) => r.data),

  create: async (payload: { company_name: string; stage: string; assigned_poc_id?: string }) => {
    const r = await apiClient.post<Lead>(API_ENDPOINTS.LEADS.LIST, payload)
    sessionApiCacheRemove(LEADS_ACTIVE_CACHE_KEY)
    return r.data
  },

  update: async (id: string, payload: Partial<Pick<Lead, 'stage' | 'status' | 'assigned_poc_id' | 'company_name'>>) => {
    const r = await apiClient.patch<Lead>(API_ENDPOINTS.LEADS.DETAIL(id), payload)
    sessionApiCacheRemove(LEADS_ACTIVE_CACHE_KEY)
    return r.data
  },

  upsertStage: async (leadId: string, stageSlug: string, data: Record<string, unknown>) => {
    const r = await apiClient.put<{ success: boolean; stage_slug: string }>(
      API_ENDPOINTS.LEADS.STAGE(leadId, stageSlug),
      data,
    )
    sessionApiCacheRemove(LEADS_ACTIVE_CACHE_KEY)
    return r.data
  },
}

export const LEAD_STAGE_ORDER = [
  'lead_details',
  'contacted',
  'brochure',
  'demo_schedule',
  'demo_completed',
  'google_form',
  'offer_letter',
  'po',
  'performa_invoice',
  'implementation_invoice',
  'whatsapp_group',
  'setup_data',
  'account_setup',
  'item_setup',
  'training_stage',
  'first_invoice',
  'first_invoice_payment',
  'final_closing',
] as const

export const LEAD_STAGE_LABELS: Record<string, string> = {
  lead_details: 'Lead',
  contacted: 'Contacted',
  brochure: 'Brochure',
  demo_schedule: 'Demo Schedule',
  demo_completed: 'Demo Completed',
  google_form: 'Client Details Google Form',
  offer_letter: 'Offer Letter',
  po: 'PO',
  performa_invoice: 'Performa Invoice',
  implementation_invoice: 'Implementation Invoice',
  whatsapp_group: 'WhatsApp Group',
  setup_data: 'Setup Data',
  account_setup: 'Account Setup',
  item_setup: 'Item Setup',
  training_stage: 'Training Stage',
  first_invoice: 'First Invoice',
  first_invoice_payment: 'First Invoice Payment',
  final_closing: 'Final Closing',
}
