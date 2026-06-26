"use client"

import { useEffect, useState, useCallback } from "react"
import { Check, X, Clock, CheckCircle2, Loader2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { api, type ApiResponse } from "@/lib/api"
import { toast } from "sonner"
import { formatDistanceToNow, parseISO, format } from "date-fns"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"

/** Append Z when the backend omits the UTC suffix. */
function toUTC(ts: string | undefined | null): string {
  if (!ts) return new Date().toISOString()
  return ts.endsWith("Z") ? ts : ts + "Z"
}

interface ApprovalRequester {
  id: string
  name: string
  email: string
}

interface ApprovalBooking {
  id: string
  title: string
  start_time: string
  end_time: string
  rooms?: { id: string; name: string; floor?: number }
}

interface ApprovalItem {
  id: string
  status: "pending" | "approved" | "rejected"
  requester: ApprovalRequester
  bookings: ApprovalBooking
  created_at: string
}

interface ApprovalSummary {
  pendingCount: number
  recentApprovals: ApprovalItem[]
}

function getInitials(name?: string): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function PendingApprovals() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<ApprovalSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const isManager = user?.role === "admin" || user?.role === "manager"

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<ApprovalSummary>>("/v1/approvals/summary")
      setSummary(res.data)
    } catch {
      // silently fail — widget shouldn't break the dashboard
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const handleApprove = async (approvalId: string) => {
    setProcessingId(approvalId)
    try {
      await api.patch(`/v1/approvals/${approvalId}/approve`)
      toast.success("Request approved")
      setSummary((prev) =>
        prev
          ? {
              ...prev,
              pendingCount: Math.max(0, prev.pendingCount - 1),
              recentApprovals: prev.recentApprovals.filter((a) => a.id !== approvalId),
            }
          : prev
      )
    } catch {
      toast.error("Failed to approve request")
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (approvalId: string) => {
    setProcessingId(approvalId)
    try {
      await api.patch(`/v1/approvals/${approvalId}/reject`, { rejection_reason: "Declined" })
      toast.success("Request declined")
      setSummary((prev) =>
        prev
          ? {
              ...prev,
              pendingCount: Math.max(0, prev.pendingCount - 1),
              recentApprovals: prev.recentApprovals.filter((a) => a.id !== approvalId),
            }
          : prev
      )
    } catch {
      toast.error("Failed to decline request")
    } finally {
      setProcessingId(null)
    }
  }

  const pendingCount = summary?.pendingCount ?? 0
  const approvals = summary?.recentApprovals ?? []

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-medium">Pending Approvals</CardTitle>
          {!isLoading && pendingCount > 0 && (
            <Badge className="bg-primary text-primary-foreground text-xs">
              {pendingCount}
            </Badge>
          )}
        </div>
        <CardDescription>
          {isLoading
            ? "Loading..."
            : pendingCount === 0
            ? isManager
              ? "No requests awaiting review"
              : "No pending approvals on your bookings"
            : isManager
            ? `${pendingCount} request${pendingCount !== 1 ? "s" : ""} awaiting review`
            : `${pendingCount} of your booking${pendingCount !== 1 ? "s" : ""} pending approval`}
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
            <Link href="/approvals">View all</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))
        ) : approvals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">All caught up!</p>
          </div>
        ) : (
          approvals.map((request) => {
            const booking = request.bookings
            const isProcessing = processingId === request.id
            return (
              <div
                key={request.id}
                className="rounded-lg border border-border bg-secondary/30 p-4"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                      {getInitials(request.requester?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {request.requester?.name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking?.title ?? "Booking"}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(parseISO(toUTC(request.created_at)), { addSuffix: true })}
                      </span>
                    </div>

                    {booking && (
                      <div className="mt-2 rounded-md bg-muted/50 px-3 py-2 text-xs">
                        <p className="font-medium text-foreground">
                          {booking.rooms?.name ?? "Unknown room"}
                        </p>
                        <p className="mt-0.5 text-muted-foreground">
                          {format(parseISO(toUTC(booking.start_time)), "MMM d")} •{" "}
                          {format(parseISO(toUTC(booking.start_time)), "h:mm a")} –{" "}
                          {format(parseISO(toUTC(booking.end_time)), "h:mm a")}
                        </p>
                      </div>
                    )}

                    {isManager && (
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-7 gap-1.5 bg-success text-success-foreground hover:bg-success/90"
                          onClick={() => handleApprove(request.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 gap-1.5 text-muted-foreground"
                          onClick={() => handleReject(request.id)}
                          disabled={isProcessing}
                        >
                          <X className="h-3 w-3" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
