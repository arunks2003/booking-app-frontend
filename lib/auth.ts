/**
 * Auth helpers — token & user stored in localStorage.
 */

const TOKEN_KEY = "roombook_token"
const USER_KEY = "roombook_user"

export interface StoredUser {
  id: string
  name: string
  email: string
  role: string
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function setStoredUser(user: StoredUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY)
}

export function clearAuth(): void {
  clearToken()
  clearStoredUser()
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
