import { apiClient } from './axios'

export interface UploadAttachmentResponse {
  url: string
}

/**
 * Upload a file for ticket attachment. Returns public URL to store in attachment_url.
 * Uses FormData; do not set Content-Type so axios/browser sets multipart/form-data with boundary.
 */
export async function uploadAttachment(file: File): Promise<UploadAttachmentResponse> {
  const formData = new FormData()
  formData.append('file', file)
  // Content-Type is omitted by axios interceptor for FormData so browser sets multipart/form-data with boundary
  const { data } = await apiClient.post<UploadAttachmentResponse>('/upload', formData)
  return data
}
