"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  Check,
  Calendar,
  AlertCircle,
  Trash2,
  Inbox,
  XCircle,
  Clock,
  UserCheck,
  ArrowLeft,
  CheckCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  useNotifications,
  type NotificationType,
} from "@/context/notification-context"
import { useAuth } from "@/context/auth-context"

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ""
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "booking_confirmed":
      return Calendar
    case "booking_cancelled":
      return XCircle
    case "approval_needed":
      return Clock
    case "approval_granted":
      return UserCheck
    case "approval_rejected":
      return XCircle
    case "meeting_reminder":
      return Bell
    case "attendee_added":
      return Check
    default:
      return AlertCircle
  }
}

function getNotificationColor(type: NotificationType) {
  switch (type) {
    case "booking_confirmed":
    case "approval_granted":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    case "approval_needed":
    case "meeting_reminder":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20"
    case "booking_cancelled":
    case "approval_rejected":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    case "attendee_added":
      return "bg-primary/10 text-primary border-primary/20"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

function getNotificationLabel(type: NotificationType): string {
  switch (type) {
    case "booking_confirmed":
      return "Confirmed"
    case "booking_cancelled":
      return "Cancelled"
    case "approval_needed":
      return "Pending Approval"
    case "approval_granted":
      return "Approved"
    case "approval_rejected":
      return "Rejected"
    case "meeting_reminder":
      return "Reminder"
    case "attendee_added":
      return "Attendee"
    default:
      return "Notification"
  }
}

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [authLoading, user, router])

  // Refresh on page load
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  if (authLoading || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => router.back()}
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <Badge
                  variant="secondary"
                  className="rounded-full px-2 text-xs"
                >
                  {unreadCount} unread
                </Badge>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-lg border border-border bg-card p-4"
              >
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type)
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "group relative flex gap-4 rounded-lg border bg-card p-4 transition-all duration-200",
                    !notification.is_read
                      ? "border-primary/20 bg-primary/[0.02] shadow-sm"
                      : "border-border hover:border-border/80 hover:bg-muted/30"
                  )}
                >
                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <div className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" />
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
                      getNotificationColor(notification.type)
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              "text-sm",
                              !notification.is_read
                                ? "font-semibold text-foreground"
                                : "font-medium text-foreground/80"
                            )}
                          >
                            {notification.title}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 rounded-full px-1.5 py-0 text-[10px] font-medium",
                              getNotificationColor(notification.type)
                            )}
                          >
                            {getNotificationLabel(notification.type)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground/60">
                          {formatTimestamp(notification.created_at)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => markAsRead(notification.id)}
                            aria-label="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeNotification(notification.id)}
                          aria-label="Delete notification"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 text-base font-medium text-foreground">
              No notifications yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {"You're all caught up! We'll notify you when something happens."}
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
