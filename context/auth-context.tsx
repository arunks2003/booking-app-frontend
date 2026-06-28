"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { api, type ApiResponse } from "@/lib/api"
import {
  getStoredUser,
  getToken,
  setToken,
  setStoredUser,
  clearAuth,
  type StoredUser,
} from "@/lib/auth"
import { connectSocket, disconnectSocket } from "@/lib/socket"

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface AuthUser extends StoredUser {}

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  email: string
  password: string
  firstName: string
  lastName: string
}

interface AuthResponseData {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  token: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  updateUser: (updates: Partial<AuthUser>) => void
}

// ──────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialise from localStorage on mount
  useEffect(() => {
    const stored = getStoredUser()
    if (stored) {
      setUser(stored)
      // Re-establish socket connection if token exists
      const token = getToken()
      if (token) connectSocket(token)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(
    async ({ email, password }: LoginPayload) => {
      const res = await api.post<ApiResponse<AuthResponseData>>(
        "/v1/auth/login",
        { email, password }
      )
      const { user: apiUser, token } = res.data
      setToken(token)
      connectSocket(token)
      const stored: AuthUser = {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role,
      }
      setStoredUser(stored)
      setUser(stored)
      router.push("/dashboard")
    },
    [router]
  )

  const register = useCallback(
    async ({ email, password, firstName, lastName }: RegisterPayload) => {
      const res = await api.post<ApiResponse<AuthResponseData>>(
        "/v1/auth/register",
        { email, password, firstName, lastName }
      )
      const { user: apiUser, token } = res.data
      setToken(token)
      connectSocket(token)
      const stored: AuthUser = {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role,
      }
      setStoredUser(stored)
      setUser(stored)
      router.push("/dashboard")
    },
    [router]
  )

  const logout = useCallback(async () => {
    try {
      await api.post("/v1/auth/logout")
    } catch {
      // ignore — logout even if request fails
    } finally {
      disconnectSocket()
      clearAuth()
      setUser(null)
      router.push("/")
    }
  }, [router])

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      setStoredUser(updated)
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
