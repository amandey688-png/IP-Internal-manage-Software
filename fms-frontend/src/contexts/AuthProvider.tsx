import { useState, useEffect, ReactNode } from 'react'
import { AuthContext, AuthContextType } from './AuthContext'
import { storage } from '../utils/storage'
import { authApi } from '../api/auth'
import type { User } from '../types/auth'

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = storage.getToken()
      const storedUser = storage.getUser()

      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(storedUser)

        // Verify token is still valid by fetching current user
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
            }
          } else {
            storage.clear()
            setToken(null)
            setUser(null)
          }
        } catch (error) {
          // Token invalid, clear storage
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
