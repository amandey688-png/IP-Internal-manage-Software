/** Extract a user-visible message from axios/FastAPI errors. */
export function apiErrorMessage(err: unknown, fallback = 'Request failed'): string {
  const data = (err as { response?: { data?: { detail?: unknown } } })?.response?.data
  const detail = data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    return detail
      .map((x) => (typeof x === 'object' && x && 'msg' in x ? String((x as { msg: string }).msg) : String(x)))
      .join('; ')
  }
  const msg = (err as { message?: string })?.message
  if (msg && msg !== 'Network Error') return msg
  return fallback
}
