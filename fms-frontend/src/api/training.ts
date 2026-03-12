import { apiClient } from './axios'
import { API_ENDPOINTS } from '../utils/constants'

export interface TrainingClientRecord {
  payment_status_id: string
  company_name: string
  onboarding_reference_no: string
  timestamp: string
  client_reference_no: string
  has_assignment?: boolean
  poc_name?: string | null
  trainer_user_id?: string | null
  trainer_name?: string | null
  assignment_created_at?: string | null
  expected_day0?: string | null
  day0_status?: 'pending' | 'on_time' | 'delayed'
  day0_completed_in_text?: string | null
  day0_delay_text?: string | null
  day0_submitted_at?: string | null
  day0_skipped?: boolean
  day1_minus2_submitted_at?: string | null
  day1_submitted_at?: string | null
  day1_planed_iso?: string | null
  day1_delay_text?: string | null
  day1_plus1_submitted_at?: string | null
  day1_minus2_skipped?: boolean
  day1_skipped?: boolean
  day1_plus1_skipped?: boolean
  day2_skipped?: boolean
  day3_skipped?: boolean
  feedback_skipped?: boolean
  day2_planed_iso?: string | null
  day2_delay_text?: string | null
  day2_submitted_at?: string | null
  day3_planed_iso?: string | null
  day3_submitted_at?: string | null
  feedback_submitted_at?: string | null
}

export interface TrainingUser {
  id: string
  full_name: string
}

export interface TrainingDay0ChecklistResponse {
  data: Record<string, string>
  submitted_at: string | null
  editable_until?: string | null
  editable_48h?: boolean
  trainer_name?: string | null
}

export interface TrainingStageStatus {
  data: Record<string, string>
  submitted_at: string | null
  editable_48h: boolean
  editable_until?: string | null
}

export interface TrainingStatusResponse {
  day0_submitted: boolean
  day0_submitted_at: string | null
  stages: Record<string, TrainingStageStatus>
  next_stage: string | null
}

export interface TrainingStagesConfigResponse {
  order: string[]
  stages: Record<string, { title: string; fields: [string, string][] }>
}

export const trainingApi = {
  listClients: () =>
    apiClient
      .get<{ items: TrainingClientRecord[] }>(API_ENDPOINTS.TRAINING.CLIENTS)
      .then((r) => r.data),

  createAssignment: (paymentStatusId: string, payload: { poc_name: string; trainer_user_id: string; expected_day0?: string | null }) =>
    apiClient
      .post<{ message: string }>(API_ENDPOINTS.TRAINING.ASSIGN(paymentStatusId), payload)
      .then((r) => r.data),

  updateAssignment: (paymentStatusId: string, payload: { poc_name?: string; trainer_user_id?: string; expected_day0?: string | null }) =>
    apiClient
      .put<{ message: string }>(API_ENDPOINTS.TRAINING.ASSIGN(paymentStatusId), payload)
      .then((r) => r.data),

  listUsers: () =>
    apiClient
      .get<{ users: TrainingUser[] }>(API_ENDPOINTS.TRAINING.USERS)
      .then((r) => r.data),

  getDay0Checklist: (paymentStatusId: string) =>
    apiClient
      .get<TrainingDay0ChecklistResponse>(API_ENDPOINTS.TRAINING.DAY0(paymentStatusId))
      .then((r) => r.data),

  saveDay0Checklist: (paymentStatusId: string, data: Record<string, string>) =>
    apiClient
      .post<TrainingDay0ChecklistResponse>(API_ENDPOINTS.TRAINING.DAY0(paymentStatusId), { data })
      .then((r) => r.data),

  getStagesConfig: () =>
    apiClient
      .get<TrainingStagesConfigResponse>(API_ENDPOINTS.TRAINING.STAGES_CONFIG)
      .then((r) => r.data),

  getTrainingStatus: (paymentStatusId: string) =>
    apiClient
      .get<TrainingStatusResponse>(API_ENDPOINTS.TRAINING.TRAINING_STATUS(paymentStatusId))
      .then((r) => r.data),

  getStage: (paymentStatusId: string, stageKey: string) =>
    apiClient
      .get<{ data: Record<string, string>; submitted_at: string | null; editable_48h: boolean }>(
        API_ENDPOINTS.TRAINING.STAGE(paymentStatusId, stageKey)
      )
      .then((r) => r.data),

  saveStage: (paymentStatusId: string, stageKey: string, data: Record<string, string>) =>
    apiClient
      .post<{ data: Record<string, string>; submitted_at: string }>(
        API_ENDPOINTS.TRAINING.STAGE(paymentStatusId, stageKey),
        { data }
      )
      .then((r) => r.data),

  getAvailableForManual: () =>
    apiClient
      .get<{ items: { payment_status_id: string; company_name: string; reference_no: string; timestamp?: string }[] }>(
        API_ENDPOINTS.TRAINING.AVAILABLE_FOR_MANUAL
      )
      .then((r) => r.data),

  addManualClient: (paymentStatusId: string) =>
    apiClient
      .post<{ message: string; payment_status_id: string }>(API_ENDPOINTS.TRAINING.MANUAL_ADD, {
        payment_status_id: paymentStatusId,
      })
      .then((r) => r.data),
}
