import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"
import { storage } from "../utils/storage"
import { ROUTES } from "../utils/constants"

/**
 * Backend base URL
 * MUST match FastAPI exactly
 * Defaults to http://127.0.0.1:8000 if env var not set
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

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

/**
 * Global response handling
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      if (error.response.status === 401) {
        // Token expired or invalid
        storage.clear()

        // Prevent redirect loop
        if (
          !window.location.pathname.includes("/login") &&
          !window.location.pathname.includes("/register")
        ) {
          window.location.href = ROUTES.LOGIN
        }
      }
    } else if (error.request) {
      console.error("❌ Network error: backend not reachable")
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
