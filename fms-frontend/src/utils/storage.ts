import { STORAGE_KEYS } from './constants'
import { User } from '../types/auth'

/**
 * Auth state (token, refresh token, user) is stored in sessionStorage:
 * - Survives normal reload/refresh in the same tab (session is not wiped on F5).
 * - Clears when the tab/window is closed (and when the browser session ends), so users sign in again
 *   after fully closing the browser, matching “stay logged in until I close the browser”.
 *
 * sessionStorage is not shared across tabs; a brand-new tab to the same URL starts without auth
 * unless opened via duplicate tab. OTP email uses the same sessionStorage.
 */

const AUTH_KEYS = [STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.REFRESH_TOKEN, STORAGE_KEYS.USER] as const

function getSession(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/** One-time move from pre–session-only builds (localStorage) into sessionStorage for this session. */
let legacyAuthMigrated = false
function ensureLegacyAuthMigrated(): void {
  if (legacyAuthMigrated) return
  legacyAuthMigrated = true
  const sess = getSession()
  if (!sess) return
  try {
    for (const key of AUTH_KEYS) {
      if (sess.getItem(key)) continue
      const legacy = localStorage.getItem(key)
      if (legacy) {
        sess.setItem(key, legacy)
        localStorage.removeItem(key)
      }
    }
  } catch {
    // ignore
  }
}

function removeLegacyAuthKeys(): void {
  try {
    for (const key of AUTH_KEYS) {
      localStorage.removeItem(key)
    }
  } catch {
    // ignore
  }
}

export const storage = {
  getToken: (): string | null => {
    try {
      ensureLegacyAuthMigrated()
      return getSession()?.getItem(STORAGE_KEYS.AUTH_TOKEN) ?? null
    } catch {
      return null
    }
  },

  setToken: (token: string): void => {
    try {
      removeLegacyAuthKeys()
      getSession()?.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
    } catch (error) {
      console.error('Failed to save token:', error)
    }
  },

  removeToken: (): void => {
    try {
      getSession()?.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    } catch (error) {
      console.error('Failed to remove token:', error)
    }
  },

  getRefreshToken: (): string | null => {
    try {
      ensureLegacyAuthMigrated()
      return getSession()?.getItem(STORAGE_KEYS.REFRESH_TOKEN) ?? null
    } catch {
      return null
    }
  },

  setRefreshToken: (token: string): void => {
    try {
      removeLegacyAuthKeys()
      getSession()?.setItem(STORAGE_KEYS.REFRESH_TOKEN, token)
    } catch (error) {
      console.error('Failed to save refresh token:', error)
    }
  },

  removeRefreshToken: (): void => {
    try {
      getSession()?.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    } catch (error) {
      console.error('Failed to remove refresh token:', error)
    }
  },

  getUser: (): User | null => {
    try {
      ensureLegacyAuthMigrated()
      const userStr = getSession()?.getItem(STORAGE_KEYS.USER)
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  },

  setUser: (user: User): void => {
    try {
      removeLegacyAuthKeys()
      getSession()?.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
    } catch (error) {
      console.error('Failed to save user:', error)
    }
  },

  removeUser: (): void => {
    try {
      getSession()?.removeItem(STORAGE_KEYS.USER)
      localStorage.removeItem(STORAGE_KEYS.USER)
    } catch (error) {
      console.error('Failed to remove user:', error)
    }
  },

  getOTPEmail: (): string | null => {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.OTP_EMAIL)
    } catch {
      return null
    }
  },

  setOTPEmail: (email: string): void => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.OTP_EMAIL, email)
    } catch (error) {
      console.error('Failed to save OTP email:', error)
    }
  },

  removeOTPEmail: (): void => {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.OTP_EMAIL)
    } catch (error) {
      console.error('Failed to remove OTP email:', error)
    }
  },

  clear: (): void => {
    storage.removeToken()
    storage.removeRefreshToken()
    storage.removeUser()
    storage.removeOTPEmail()
  },
}
