"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react"
import { toast } from "sonner"
import {
  Bell,
  Calendar,
  XCircle,
  Clock,
  UserCheck,
  Check,
  AlertCircle,
} from "lucide-react"
import { api } from "@/lib/api"
import { getSocket } from "@/lib/socket"
import { getToken } from "@/lib/auth"

// ──────────────────────────────────────────────
// Types (mirrors backend snake_case response)
// ──────────────────────────────────────────────

export type NotificationType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "approval_needed"
  | "approval_granted"
  | "approval_rejected"
  | "meeting_reminder"
  | "attendee_added"

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  related_id: string | null
  is_read: boolean
  created_at: string
}

// ──────────────────────────────────────────────
// Context value
// ──────────────────────────────────────────────

interface NotificationContextValue {
  notifications: AppNotification[]
  unreadCount: number
  isLoading: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  removeNotification: (id: string) => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

// ──────────────────────────────────────────────
// Toast icon helper
// ──────────────────────────────────────────────

function getToastIcon(type: NotificationType) {
  const iconProps = { className: "h-4 w-4", strokeWidth: 2 }
  switch (type) {
    case "booking_confirmed":
      return <Calendar {...iconProps} />
    case "booking_cancelled":
      return <XCircle {...iconProps} />
    case "approval_needed":
      return <Clock {...iconProps} />
    case "approval_granted":
      return <UserCheck {...iconProps} />
    case "approval_rejected":
      return <XCircle {...iconProps} />
    case "meeting_reminder":
      return <Bell {...iconProps} />
    case "attendee_added":
      return <Check {...iconProps} />
    default:
      return <AlertCircle {...iconProps} />
  }
}

// ──────────────────────────────────────────────
// Polling fallback interval (30 s)
// ──────────────────────────────────────────────
const POLL_INTERVAL_MS = 30_000

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const mountedRef = useRef(true)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  // ── Fetch from REST API ──────────────────
  const fetchNotifications = useCallback(async () => {
    // Only attempt if we have a token
    if (!getToken()) return

    try {
      const res = await api.get<{
        success: boolean
        data: { notifications: AppNotification[] }
      }>("/v1/notifications?limit=50")
      if (mountedRef.current) {
        setNotifications(res.data.notifications ?? [])
      }
    } catch {
      // silently fail — user may not be logged in yet
    }
  }, [])

  // ── Initial fetch ────────────────────────
  useEffect(() => {
    mountedRef.current = true
    setIsLoading(true)
    fetchNotifications().finally(() => {
      if (mountedRef.current) setIsLoading(false)
    })
    return () => {
      mountedRef.current = false
    }
  }, [fetchNotifications])

  // ── Polling fallback ─────────────────────
  useEffect(() => {
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // ── Socket.IO real-time listener ─────────
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleNewNotification = (notification: AppNotification) => {
      // Prepend new notification (avoid duplicates)
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev
        return [notification, ...prev]
      })

      // Show a toast
      toast(notification.title, {
        description: notification.message,
        icon: getToastIcon(notification.type),
        duration: 5000,
      })
    }

    socket.on("notification:new", handleNewNotification)

    // Also re-fetch after reconnection to catch anything missed
    const handleReconnect = () => {
      fetchNotifications()
    }
    socket.on("connect", handleReconnect)

    return () => {
      socket.off("notification:new", handleNewNotification)
      socket.off("connect", handleReconnect)
    }
  }, [fetchNotifications])

  // ── Mark single as read ──────────────────
  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.patch(`/v1/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch {
      /* ignore */
    }
  }, [])

  // ── Mark all as read ─────────────────────
  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch("/v1/notifications/read-all")
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch {
      /* ignore */
    }
  }, [])

  // ── Remove notification ──────────────────
  const removeNotification = useCallback(async (id: string) => {
    try {
      await api.delete(`/v1/notifications/${id}`)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx)
    throw new Error(
      "useNotifications must be used inside <NotificationProvider>"
    )
  return ctx
}
