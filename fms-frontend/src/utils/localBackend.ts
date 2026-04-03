/**
 * Local API URL defaults and copy for error hints.
 * Default port must match vite.config.ts proxy fallback (search DEFAULT_BACKEND_TARGET there).
 */
export const DEFAULT_LOCAL_BACKEND_ORIGIN = "http://127.0.0.1:8020"

export function getViteApiBaseFromEnv(): string {
  return (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "")
}

/** True for http://127.0.0.1:* or http://localhost:* (any port). */
export function isHttpLoopbackApiUrl(s: string): boolean {
  if (!s) return false
  try {
    const u = new URL(s.startsWith("http") ? s : `http://${s}`)
    return u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1")
  } catch {
    return false
  }
}

/** Backend origin used when env is empty (SSR/tests) or for hints. */
export function resolveDefaultLocalBackendUrl(): string {
  const v = getViteApiBaseFromEnv()
  return v || DEFAULT_LOCAL_BACKEND_ORIGIN
}

function defaultBackendPort(): string {
  try {
    return new URL(DEFAULT_LOCAL_BACKEND_ORIGIN).port || "8020"
  } catch {
    return "8020"
  }
}

/** Uvicorn command matching VITE_API_BASE_URL host/port (same default port as DEFAULT_LOCAL_BACKEND_ORIGIN). */
export function getLocalUvicornStartCommand(): string {
  const base = resolveDefaultLocalBackendUrl()
  const fallbackPort = defaultBackendPort()
  try {
    const u = new URL(base.startsWith("http") ? base : `http://${base}`)
    const host =
      u.hostname === "localhost" || u.hostname === "127.0.0.1" ? u.hostname : "127.0.0.1"
    const port = u.port || fallbackPort
    return `cd backend && uvicorn app.main:app --reload --host ${host} --port ${port}`
  } catch {
    return `cd backend && uvicorn app.main:app --reload --host 127.0.0.1 --port ${fallbackPort}`
  }
}
