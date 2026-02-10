import { apiClient, isLocalBackend } from './axios'
import type { ApiResponse } from '../types/common'
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  OTPVerifyRequest,
  OTPVerifyResponse,
  User,
} from '../types/auth'

export const authApi = {
  /**
   * Register new user
   * Backend returns: { user_id, email, confirmation_sent, message }
   */
  register: async (
    data: RegisterRequest
  ): Promise<ApiResponse<RegisterResponse>> => {
    try {
      console.log('📤 Register payload:', data)

      const response = await apiClient.post<RegisterResponse>(
        '/auth/register',
        data
      )

      console.log('📥 Register response:', response.data)

      // Backend returns RegisterResponse directly
      return {
        data: response.data,
        error: undefined,
      }
    } catch (err: any) {
      console.error('❌ Register error:', err)
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        code: err.code,
        request: err.request,
      })

      // Handle network errors (backend not reachable)
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || !err.response) {
        const defaultMsg = err.message?.includes('Network Error') || err.code === 'ERR_NETWORK'
          ? 'Cannot connect to backend server.'
          : `Network Error: ${err.message || 'Backend server is not reachable'}`
        const errorMessage = isLocalBackend
          ? `${defaultMsg} Start the backend: cd backend && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`
          : `${defaultMsg} The server may be down or check your connection.`

        return {
          data: undefined,
          error: {
            message: errorMessage,
            code: 'NETWORK_ERROR',
          },
        }
      }

      // Extract error message from FastAPI response (detail can be string or array)
      const rawDetail = err.response?.data?.detail
      const errorMessage =
        (typeof rawDetail === 'string' ? rawDetail : Array.isArray(rawDetail) ? rawDetail[0]?.msg : null) ||
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please try again.'

      return {
        data: undefined,
        error: {
          message: errorMessage,
          code: err.response?.status?.toString() || 'UNKNOWN',
        },
      }
    }
  },

  /**
   * Login user
   */
  login: async (
    data: LoginRequest
  ): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await apiClient.post<LoginResponse>(
        '/auth/login',
        data
      )

      return {
        data: response.data,
        error: undefined,
      }
    } catch (err: any) {
      // Handle network errors (backend not reachable or timeout)
      const isNetworkError =
        err.code === 'ECONNREFUSED' ||
        err.code === 'ERR_NETWORK' ||
        err.code === 'ECONNABORTED' ||
        !err.response
      if (isNetworkError) {
        const hint = isLocalBackend
          ? 'Ensure the backend is running: cd backend then run: uvicorn app.main:app --reload --host 127.0.0.1 --port 8000'
          : 'The server may be down or check your connection.'
        const errorMessage =
          err.code === 'ECONNABORTED'
            ? `Connection timed out (30s). ${hint}`
            : err.message?.includes('Network Error') || err.code === 'ERR_NETWORK'
              ? `Connection failed. ${hint}`
              : `Connection failed: ${err.message || 'Backend not reachable'}. ${hint}`
        return {
          data: undefined,
          error: {
            message: errorMessage,
            code: 'NETWORK_ERROR',
          },
        }
      }
      return {
        data: undefined,
        error: {
          message:
            err.response?.data?.detail ||
            err.response?.data?.message ||
            'Login failed',
          code: err.response?.status?.toString(),
        },
      }
    }
  },

  /**
   * Get current user (requires Bearer token)
   */
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await apiClient.get<User>('/users/me')
      return { data: response.data, error: undefined }
    } catch (err: any) {
      return {
        data: undefined,
        error: {
          message: err.response?.data?.detail || 'Failed to get user',
          code: err.response?.status?.toString(),
        },
      }
    }
  },

  /**
   * Verify OTP (after login when requires_otp is true)
   */
  verifyOTP: async (data: OTPVerifyRequest): Promise<ApiResponse<OTPVerifyResponse>> => {
    try {
      const response = await apiClient.post<OTPVerifyResponse>('/auth/verify-otp', data)
      return { data: response.data, error: undefined }
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED' || !err.response) {
        return {
          data: undefined,
          error: {
            message: 'Unable to reach backend — please ensure the server is running',
            code: 'NETWORK_ERROR',
          },
        }
      }
      return {
        data: undefined,
        error: {
          message: err.response?.data?.detail || err.response?.data?.message || 'OTP verification failed',
          code: err.response?.status?.toString(),
        },
      }
    }
  },

  /**
   * Logout - clears session. Backend call optional.
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Ignore - client clears storage anyway
    }
  },
}
