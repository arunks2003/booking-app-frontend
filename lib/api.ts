/**
 * Central API client for the Booking App backend.
 * Automatically attaches the Authorization header when a token is present.
 * Throws a typed ApiError on non-2xx responses.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("roombook_token")
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  // 401 → token expired or missing; clear storage
  if (res.status === 401 && !path.startsWith("/v1/auth/")) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("roombook_token")
      localStorage.removeItem("roombook_user")
      window.location.href = "/"
    }
  }

  let body: unknown
  const contentType = res.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    body = await res.json()
  } else {
    body = await res.text()
  }

  if (!res.ok) {
    const message =
      (body as { message?: string })?.message ?? res.statusText
    throw new ApiError(res.status, message, body)
  }

  return body as T
}

// ──────────────────────────────────────────────
// Convenience methods
// ──────────────────────────────────────────────

export const api = {
  get: <T>(path: string) =>
    request<T>(path, { method: "GET" }),

  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  put: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
}

// ──────────────────────────────────────────────
// Backend response shape helpers
// ──────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
