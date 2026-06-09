"use client"

import { useState, useEffect, useCallback } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SearchHeader } from "@/components/dashboard/search-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Check,
  X,
  Clock,
  MapPin,
  Calendar,
  Users,
  FileCheck,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { api, ApiError, type ApiResponse } from "@/lib/api"
import { toast } from "sonner"
import { format, parseISO, formatDistanceToNow } from "date-fns"
import { useRequireAuth } from "@/hooks/useRequireAuth"

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface ApprovalUser {
  id: string
  name: string
  email: string
}

interface ApprovalBooking {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  status: string
  rooms?: { id: string; name: string; floor?: number; location?: string }
}

interface ApprovalItem {
  id: string
  status: "pending" | "approved" | "rejected"
  requester: ApprovalUser
  approver?: ApprovalUser
  bookings: ApprovalBooking
  rejection_reason?: string
  responded_at?: string
  created_at: string
}

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function getInitials(name?: string): string {
  if (!name) return "?"
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return <Badge className="bg-emerald-500/10 text-emerald-500 border-0">Approved</Badge>
    case "rejected":
      return <Badge className="bg-red-500/10 text-red-500 border-0">Rejected</Badge>
    case "pending":
      return <Badge className="bg-amber-500/10 text-amber-500 border-0">Pending</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

// ──────────────────────────────────────────────
// Approval Card
// ──────────────────────────────────────────────

function ApprovalCard({
  approval,
  isManager,
  onAction,
  isProcessing,
}: {
  approval: ApprovalItem
  isManager: boolean
  onAction: (id: string, action: "approve" | "reject") => void
  isProcessing: string | null
}) {
  const booking = approval.bookings
  const processing = isProcessing === approval.id

  return (
    <Card className="border-border/50 bg-card transition-colors hover:bg-muted/20">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left — requester + booking info */}
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-muted text-sm text-muted-foreground">
                {getInitials(approval.requester?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">
                  {approval.requester?.name ?? "Unknown"}
                </p>
                {getStatusBadge(approval.status)}
              </div>
              <p className="text-xs text-muted-foreground">
                {approval.requester?.email}
              </p>

              {booking && (
                <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2.5 space-y-1.5">
                  <p className="text-sm font-medium text-foreground">{booking.title}</p>
                  {booking.rooms && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{booking.rooms.name}</span>
                      {booking.rooms.floor && <span>· Floor {booking.rooms.floor}</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>
                      {format(parseISO(booking.start_time), "EEE, MMM d")} ·{" "}
                      {format(parseISO(booking.start_time), "h:mm a")} –{" "}
                      {format(parseISO(booking.end_time), "h:mm a")}
                    </span>
                  </div>
                  {booking.description && (
                    <p className="text-xs text-muted-foreground italic">
                      &ldquo;{booking.description}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {approval.rejection_reason && (
                <div className="flex items-start gap-2 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-500">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>Rejection reason: {approval.rejection_reason}</span>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground/70">
                Requested {formatDistanceToNow(parseISO(approval.created_at), { addSuffix: true })}
                {approval.approver && approval.responded_at && (
                  <> · {approval.status} by {approval.approver.name}</>
                )}
              </p>
            </div>
          </div>

          {/* Right — actions (manager only, pending only) */}
          {isManager && approval.status === "pending" && (
            <div className="flex shrink-0 gap-2 sm:flex-col">
              <Button
                size="sm"
                className="gap-1.5 bg-success text-success-foreground hover:bg-success/90"
                onClick={() => onAction(approval.id, "approve")}
                disabled={processing}
              >
                {processing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onAction(approval.id, "reject")}
                disabled={processing}
              >
                <X className="h-3 w-3" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────
// Empty State
// ──────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-14">
        <FileCheck className="h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-base font-medium text-foreground">All clear</h3>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────
// Loading Skeleton
// ──────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="border-border/50">
          <CardContent className="p-5">
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────

export default function ApprovalsPage() {
  const { user } = useRequireAuth()
  const isManager = user?.role === "admin" || user?.role === "manager"

  // Manager sees all approvals; users see their own submitted approvals
  const [allApprovals, setAllApprovals] = useState<ApprovalItem[]>([])
  const [myApprovals, setMyApprovals] = useState<ApprovalItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  const fetchApprovals = useCallback(async () => {
    setIsLoading(true)
    try {
      if (isManager) {
        // Build filter params
        const statusParam = statusFilter !== "all" ? `&status=${statusFilter}` : ""
        const res = await api.get<{ success: boolean; data: { approvals: ApprovalItem[] } }>(
          `/v1/approvals?limit=50${statusParam}`
        )
        setAllApprovals(res.data.approvals ?? [])
      } else {
        const res = await api.get<{ success: boolean; data: { approvals: ApprovalItem[] } }>(
          `/v1/approvals/my?limit=50`
        )
        setMyApprovals(res.data.approvals ?? [])
      }
    } catch {
      toast.error("Failed to load approvals")
    } finally {
      setIsLoading(false)
    }
  }, [isManager, statusFilter])

  useEffect(() => {
    if (user) fetchApprovals()
  }, [user, fetchApprovals])

  const handleAction = async (approvalId: string, action: "approve" | "reject") => {
    if (action === "reject") {
      setRejectingId(approvalId)
      setRejectionReason("")
      setRejectDialogOpen(true)
      return
    }

    setProcessingId(approvalId)
    try {
      await api.patch(`/v1/approvals/${approvalId}/approve`)
      toast.success("Booking request approved")
      setAllApprovals((prev) =>
        prev.map((a) => (a.id === approvalId ? { ...a, status: "approved" as const } : a))
      )
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to approve")
    } finally {
      setProcessingId(null)
    }
  }

  const handleConfirmReject = async () => {
    if (!rejectingId) return
    setProcessingId(rejectingId)
    setRejectDialogOpen(false)
    try {
      await api.patch(`/v1/approvals/${rejectingId}/reject`, {
        rejection_reason: rejectionReason || "Rejected",
      })
      toast.success("Booking request rejected")
      setAllApprovals((prev) =>
        prev.map((a) =>
          a.id === rejectingId
            ? { ...a, status: "rejected" as const, rejection_reason: rejectionReason }
            : a
        )
      )
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to reject")
    } finally {
      setProcessingId(null)
      setRejectingId(null)
    }
  }

  const pendingCount = allApprovals.filter((a) => a.status === "pending").length
  const approvedCount = allApprovals.filter((a) => a.status === "approved").length
  const rejectedCount = allApprovals.filter((a) => a.status === "rejected").length

  const displayApprovals = isManager ? allApprovals : myApprovals

  if (!user) return null

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SearchHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {/* Page Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Approvals</h1>
              <p className="text-sm text-muted-foreground">
                {isManager
                  ? "Review and manage booking approval requests"
                  : "Track the status of your submitted booking requests"}
              </p>
            </div>
            {isManager && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All requests</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Stats (manager only) */}
          {isManager && (
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Pending Review", value: pendingCount, icon: Clock, bg: "bg-amber-500/10", color: "text-amber-500" },
                { label: "Approved", value: approvedCount, icon: Check, bg: "bg-emerald-500/10", color: "text-emerald-600" },
                { label: "Rejected", value: rejectedCount, icon: X, bg: "bg-red-500/10", color: "text-red-500" },
              ].map(({ label, value, icon: Icon, bg, color }) => (
                <Card key={label} className="border-border/50 bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <div>
                        {isLoading ? (
                          <Skeleton className="h-7 w-8 mb-0.5" />
                        ) : (
                          <p className="text-2xl font-semibold text-foreground">{value}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Approvals List */}
          {isManager ? (
            // Manager: tabbed by status
            <Tabs defaultValue="pending" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pending">
                  Pending {!isLoading && `(${pendingCount})`}
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved {!isLoading && `(${approvedCount})`}
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected {!isLoading && `(${rejectedCount})`}
                </TabsTrigger>
              </TabsList>

              {(["pending", "approved", "rejected"] as const).map((tab) => (
                <TabsContent key={tab} value={tab} className="space-y-3">
                  {isLoading ? (
                    <LoadingSkeleton />
                  ) : allApprovals.filter((a) => a.status === tab).length === 0 ? (
                    <EmptyState
                      message={
                        tab === "pending"
                          ? "No requests awaiting your review"
                          : `No ${tab} requests`
                      }
                    />
                  ) : (
                    allApprovals
                      .filter((a) => a.status === tab)
                      .map((approval) => (
                        <ApprovalCard
                          key={approval.id}
                          approval={approval}
                          isManager={isManager}
                          onAction={handleAction}
                          isProcessing={processingId}
                        />
                      ))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            // Regular user: their submitted approvals
            <div className="space-y-3">
              {isLoading ? (
                <LoadingSkeleton />
              ) : myApprovals.length === 0 ? (
                <EmptyState message="You haven't submitted any approval requests yet" />
              ) : (
                myApprovals.map((approval) => (
                  <ApprovalCard
                    key={approval.id}
                    approval={approval}
                    isManager={false}
                    onAction={handleAction}
                    isProcessing={processingId}
                  />
                ))
              )}
            </div>
          )}
        </main>
      </SidebarInset>

      {/* ── Reject Dialog ── */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Booking Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this request. The requester will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection reason</Label>
            <Textarea
              id="rejection-reason"
              placeholder="e.g. Room is reserved for a priority event during that slot"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={!!processingId}
            >
              {processingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting…
                </>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
