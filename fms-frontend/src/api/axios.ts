import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"
import { storage } from "../utils/storage"
import { ROUTES } from "../utils/constants"

/**
 * Backend base URL
 * MUST match FastAPI exactly
 *
 * Priority:
 * 1) VITE_API_BASE_URL (preferred)
 * 2) VITE_API_URL      (fallback)
 * 3) http://127.0.0.1:8000 (local dev default)
 *
 * Trailing slash is stripped so Vercel env "https://...onrender.com/" works.
 */
const _raw =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000"
export const API_BASE_URL = typeof _raw === "string" ? _raw.replace(/\/+$/, "") : _raw

export const isLocalBackend =
  API_BASE_URL.includes("127.0.0.1") || API_BASE_URL.includes("localhost")

// Log API base URL for debugging
console.log("🔗 API Base URL:", API_BASE_URL)

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
})

/**
 * Attach JWT token (if exists) and log requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // For FormData (e.g. file upload), omit Content-Type so browser sets multipart/form-data with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"]
    }
    // Log outgoing requests for debugging
    console.log("📤 API Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
    })
    return config
  },
  (error) => Promise.reject(error)
)

/** Track if we're in a refresh attempt to avoid retry loop */
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

const addRefreshSubscriber = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb)
}

/**
 * Global response handling - on 401 try token refresh, then retry or redirect
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const isRefreshRequest = originalRequest.url?.includes("/auth/refresh")
      if (isRefreshRequest) {
        storage.clear()
        if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/register")) {
          window.location.href = ROUTES.LOGIN
        }
        return Promise.reject(error)
      }

      const refreshToken = storage.getRefreshToken()
      if (refreshToken) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            addRefreshSubscriber((token: string) => {
              if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(apiClient(originalRequest))
            })
          })
        }
        isRefreshing = true
        let result: { access_token?: string; refresh_token?: string } | null = null
        try {
          const res = await axios.post<{ access_token: string; refresh_token?: string }>(
            `${API_BASE_URL}/auth/refresh`,
            { refresh_token: refreshToken },
            { headers: { "Content-Type": "application/json" }, timeout: 10000 }
          )
          result = res.data
        } catch {
          result = null
        }
        isRefreshing = false
        if (result?.access_token) {
          storage.setToken(result.access_token)
          if (result.refresh_token) storage.setRefreshToken(result.refresh_token)
          if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${result.access_token}`
          originalRequest._retry = true
          return apiClient(originalRequest)
        }
        onRefreshed("")
      }

      storage.clear()
      if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/register")) {
        window.location.href = ROUTES.LOGIN
      }
    } else if (error.request) {
      console.error("❌ Network error: backend not reachable at", API_BASE_URL)
      console.error("Request details:", {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
      })
      console.error("Make sure backend is running on:", API_BASE_URL)
    } else {
      console.error("❌ Request setup error:", error.message)
    }

    return Promise.reject(error)
  }
)

export default apiClient
