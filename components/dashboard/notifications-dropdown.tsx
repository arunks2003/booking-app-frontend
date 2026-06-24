"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  Check,
  Calendar,
  AlertCircle,
  X,
  Inbox,
  XCircle,
  Clock,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  useNotifications,
  type NotificationType,
} from "@/context/notification-context"

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
  return date.toLocaleDateString()
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
      return "bg-emerald-500/10 text-emerald-500"
    case "approval_needed":
    case "meeting_reminder":
      return "bg-amber-500/10 text-amber-500"
    case "booking_cancelled":
    case "approval_rejected":
      return "bg-red-500/10 text-red-500"
    case "attendee_added":
      return "bg-primary/10 text-primary"
    default:
      return "bg-muted text-muted-foreground"
  }
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications()

  // Refresh when dropdown opens
  useEffect(() => {
    if (isOpen) fetchNotifications()
  }, [isOpen, fetchNotifications])

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary p-0 text-[10px] text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right animate-in fade-in-0 zoom-in-95 sm:w-96">
          <div className="flex max-h-[480px] flex-col rounded-lg border border-border bg-popover shadow-lg">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </Button>
              )}
            </div>

            {/* List */}
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length > 0 ? (
              <ScrollArea className="min-h-0 flex-1 overscroll-contain">
                <div className="divide-y divide-border pb-1">
                  {notifications.slice(0, 20).map((notification) => {
                    const Icon = getNotificationIcon(notification.type)
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "group relative flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                          !notification.is_read && "bg-muted/30"
                        )}
                        onClick={() => markAsRead(notification.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            markAsRead(notification.id)
                        }}
                      >
                        {!notification.is_read && (
                          <div className="absolute left-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" />
                        )}
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            getNotificationColor(notification.type)
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                "text-sm",
                                !notification.is_read
                                  ? "font-medium text-foreground"
                                  : "text-foreground/80"
                              )}
                            >
                              {notification.title}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeNotification(notification.id)
                              }}
                              aria-label="Dismiss notification"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground/70">
                            {formatTimestamp(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Inbox className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">
                  No notifications
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {"You're all caught up!"}
                </p>
              </div>
            )}

            {/* Footer */}
            {!isLoading && notifications.length > 0 && (
              <div className="shrink-0 border-t border-border p-2">
                <Button
                  variant="ghost"
                  className="w-full justify-center text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setIsOpen(false)
                    router.push("/notifications")
                  }}
                >
                  View all notifications
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
