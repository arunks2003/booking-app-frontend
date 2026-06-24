"use client"

import { useState, useEffect, useCallback } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SearchHeader } from "@/components/dashboard/search-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Clock,
  Users,
  MapPin,
  Calendar,
  MoreVertical,
  Trash2,
  Video,
  Wifi,
  Monitor,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api, ApiError } from "@/lib/api"
import { toast } from "sonner"
import { format, parseISO, isFuture } from "date-fns"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { BookRoomModal } from "@/components/dashboard/book-room-modal"

interface ApiBooking {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  room?: {
    id: string
    name: string
    floor?: number
    location?: string
    amenities?: string[]
  }
  attendees?: Array<{ user?: { name?: string }; email?: string }>
}

const amenityIcons: Record<string, typeof Video> = {
  video: Video,
  wifi: Wifi,
  display: Monitor,
  monitor: Monitor,
}

function getStatusColor(status: string) {
  switch (status) {
    case "confirmed": return "bg-emerald-500/10 text-emerald-500"
    case "pending": return "bg-amber-500/10 text-amber-500"
    case "cancelled": return "bg-red-500/10 text-red-500"
    case "completed": return "bg-muted text-muted-foreground"
    default: return "bg-muted text-muted-foreground"
  }
}

export default function MyBookingsPage() {
  useRequireAuth()

  const [bookings, setBookings] = useState<ApiBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [bookModalOpen, setBookModalOpen] = useState(false)

  const fetchBookings = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get<{ success: boolean; data: { bookings: ApiBooking[] } }>("/v1/bookings/my?limit=100")
      setBookings((res.data.bookings ?? []).filter((b) => b.start_time && b.end_time))
    } catch {
      toast.error("Failed to load bookings")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const handleCancelBooking = async (id: string) => {
    try {
      await api.patch(`/v1/bookings/${id}/cancel`)
      toast.success("Booking cancelled")
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "cancelled" as const } : b))
      )
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to cancel booking")
    }
  }

  const upcomingBookings = bookings.filter(
    (b) => b.status !== "cancelled" && b.status !== "completed" && isFuture(parseISO(b.start_time))
  )
  const pastBookings = bookings.filter(
    (b) => b.status === "cancelled" || b.status === "completed" || !isFuture(parseISO(b.start_time))
  )

  const BookingCard = ({ booking }: { booking: ApiBooking }) => (
    <Card className="border-border/50 bg-card transition-colors hover:bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-foreground">{booking.title}</h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{booking.room?.name ?? "Unknown room"}</span>
                  {booking.room?.location && (
                    <>
                      <span className="text-border">•</span>
                      <span>{booking.room.location}</span>
                    </>
                  )}
                  {!booking.room?.location && booking.room?.floor && (
                    <>
                      <span className="text-border">•</span>
                      <span>Floor {booking.room.floor}</span>
                    </>
                  )}
                </div>
              </div>
              <Badge className={getStatusColor(booking.status)}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(parseISO(booking.start_time), "EEE, MMM d")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {format(parseISO(booking.start_time), "h:mm a")} –{" "}
                  {format(parseISO(booking.end_time), "h:mm a")}
                </span>
              </div>
              {booking.attendees && booking.attendees.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>{booking.attendees.length} attendee{booking.attendees.length !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>

            {booking.room?.amenities && booking.room.amenities.length > 0 && (
              <div className="flex items-center gap-2">
                {booking.room.amenities.map((amenity) => {
                  const Icon = amenityIcons[amenity]
                  return Icon ? (
                    <div
                      key={amenity}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-muted"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  ) : null
                })}
              </div>
            )}
          </div>

          {booking.status !== "cancelled" && booking.status !== "completed" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Cancel Booking
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel &quot;{booking.title}&quot;? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleCancelBooking(booking.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Cancel Booking
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-64" />
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SearchHeader />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">My Bookings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your conference room reservations
            </p>
          </div>

          {/* Stats Overview */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Upcoming",
                value: upcomingBookings.length,
                icon: Calendar,
                bg: "bg-primary/10",
                color: "text-primary",
              },
              {
                label: "Pending",
                value: bookings.filter((b) => b.status === "pending").length,
                icon: Clock,
                bg: "bg-amber-500/10",
                color: "text-amber-500",
              },
              {
                label: "Total Attendees",
                value: bookings
                  .filter((b) => b.status === "confirmed")
                  .reduce((acc, b) => acc + (b.attendees?.length ?? 0), 0),
                icon: Users,
                bg: "bg-emerald-500/10",
                color: "text-emerald-500",
              },
            ].map(({ label, value, icon: Icon, bg, color }) => (
              <Card key={label} className="border-border/50 bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <div>
                      {isLoading ? (
                        <Skeleton className="h-7 w-10" />
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

          {/* Bookings Tabs */}
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming ({isLoading ? "…" : upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({isLoading ? "…" : pastBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-3">
              {isLoading ? (
                <LoadingSkeleton />
              ) : upcomingBookings.length === 0 ? (
                <Card className="border-border/50 bg-card">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium text-foreground">No upcoming bookings</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Book a room to get started</p>
                    <Button className="mt-4" onClick={() => setBookModalOpen(true)}>
                      Book a Room
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                upcomingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-3">
              {isLoading ? (
                <LoadingSkeleton />
              ) : pastBookings.length === 0 ? (
                <Card className="border-border/50 bg-card">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium text-foreground">No past bookings</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your booking history will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pastBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>

      <BookRoomModal
        open={bookModalOpen}
        onOpenChange={setBookModalOpen}
        onSuccess={fetchBookings}
      />
    </SidebarProvider>
  )
}
