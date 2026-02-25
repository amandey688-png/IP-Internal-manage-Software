import { useState, useEffect, useRef, useCallback, ReactNode } from 'react'
import { AuthContext, AuthContextType } from './AuthContext'
import { storage } from '../utils/storage'
import { authApi } from '../api/auth'
import type { User } from '../types/auth'

/** Refresh access token every 50 min so session does not expire until user logs out (JWT often expires in 1 hr). */
const PROACTIVE_REFRESH_INTERVAL_MS = 50 * 60 * 1000

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const doProactiveRefresh = useCallback(async () => {
    const result = await authApi.refresh()
    if (result?.access_token) {
      storage.setToken(result.access_token)
      setToken(result.access_token)
      if (result.refresh_token) storage.setRefreshToken(result.refresh_token)
    }
  }, [])

  // Proactive token refresh: keep session alive while user has not logged out
  useEffect(() => {
    if (!token || !user) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
      return
    }
    const id = setInterval(doProactiveRefresh, PROACTIVE_REFRESH_INTERVAL_MS)
    refreshIntervalRef.current = id
    return () => {
      clearInterval(id)
      refreshIntervalRef.current = null
    }
  }, [token, user, doProactiveRefresh])

  // When user returns to tab, refresh once so idle tab stays logged in
  useEffect(() => {
    if (!token || !user) return
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') doProactiveRefresh()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [token, user, doProactiveRefresh])

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = storage.getToken()
      const storedUser = storage.getUser()

      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(storedUser)

        // Verify token is still valid by fetching current user (or refresh will run on 401)
        try {
          const response = await authApi.getCurrentUser()
          if (response.data) {
            if (response.data.is_active === false) {
              storage.clear()
              setToken(null)
              setUser(null)
            } else {
              setUser(response.data)
              storage.setUser(response.data)
              // Sync token state (interceptor may have refreshed and updated storage)
              const currentToken = storage.getToken()
              if (currentToken) setToken(currentToken)
            }
          } else {
            storage.clear()
            setToken(null)
            setUser(null)
          }
        } catch (error) {
          // Token invalid and refresh failed (or no refresh token); clear storage
          storage.clear()
          setToken(null)
          setUser(null)
        }
      }

      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = (newToken: string, newUser: User, refreshToken?: string) => {
    setToken(newToken)
    setUser(newUser)
    storage.setToken(newToken)
    storage.setUser(newUser)
    if (refreshToken) storage.setRefreshToken(refreshToken)
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setToken(null)
      setUser(null)
      storage.clear()
    }
  }

  const register = (newToken: string, newUser: User, refreshToken?: string) => {
    setToken(newToken)
    setUser(newUser)
    storage.setToken(newToken)
    storage.setUser(newUser)
    if (refreshToken) storage.setRefreshToken(refreshToken)
  }

  const verifyOTP = (newToken: string, newUser: User, refreshToken?: string) => {
    setToken(newToken)
    setUser(newUser)
    storage.setToken(newToken)
    storage.setUser(newUser)
    if (refreshToken) storage.setRefreshToken(refreshToken)
    storage.removeOTPEmail() // Clear OTP email after successful verification
  }

  const refreshUser = (updatedUser: User) => {
    setUser(updatedUser)
    storage.setUser(updatedUser)
  }

  const setLoading = (loading: boolean) => {
    setIsLoading(loading)
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    register,
    verifyOTP,
    refreshUser,
    setLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
