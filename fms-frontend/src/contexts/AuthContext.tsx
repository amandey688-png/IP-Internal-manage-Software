import { createContext } from 'react'
import type { User, AuthState } from '../types/auth'

export interface AuthContextType extends AuthState {
  login: (token: string, user: User, refreshToken?: string) => void
  logout: () => void
  register: (token: string, user: User, refreshToken?: string) => void
  verifyOTP: (token: string, user: User, refreshToken?: string) => void
  refreshUser: (user: User) => void
  setLoading: (loading: boolean) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
