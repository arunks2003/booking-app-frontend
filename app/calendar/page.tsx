"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SearchHeader } from "@/components/dashboard/search-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  MapPin,
  Calendar,
} from "lucide-react"
import { api } from "@/lib/api"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  parseISO,
  isSameDay,
  differenceInMinutes,
  isToday,
  startOfDay,
  addDays,
} from "date-fns"
import { BookRoomModal } from "@/components/dashboard/book-room-modal"

/**
 * The backend stores timestamps as `timestamp without time zone` (no Z suffix).
 * parseISO("2026-06-27T03:30:00") treats it as local time, but it's actually UTC.
 * This helper appends "Z" when missing so parseISO interprets correctly.
 */
function toUTC(ts: string | undefined | null): string {
  if (!ts) return new Date().toISOString()
  return ts.endsWith("Z") ? ts : ts + "Z"
}

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface ApiRoom {
  id: string
  name: string
  floor?: string | number
  location?: string
  capacity?: number
}

interface CalendarEvent {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  status: string
  rooms?: ApiRoom
  users?: { id: string; name: string; email: string }
}

interface CalendarBlock {
  id: string
  title: string
  reason?: string
  start_time: string
  end_time: string
  rooms?: ApiRoom
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const ROOM_COLORS = [
  { bg: "bg-blue-500", light: "bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400" },
  { bg: "bg-emerald-500", light: "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" },
  { bg: "bg-amber-500", light: "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400" },
  { bg: "bg-violet-500", light: "bg-violet-500/15 border-violet-500/30 text-violet-600 dark:text-violet-400" },
  { bg: "bg-rose-500", light: "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400" },
  { bg: "bg-cyan-500", light: "bg-cyan-500/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-400" },
]

const HOUR_HEIGHT = 64 // px per hour in the grid
const DAY_START_HOUR = 7 // 7 AM
const DAY_END_HOUR = 21  // 9 PM
const TOTAL_HOURS = DAY_END_HOUR - DAY_START_HOUR
const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => DAY_START_HOUR + i)

function getStatusColor(status: string) {
  switch (status) {
    case "confirmed": return "border-l-emerald-500"
    case "approved": return "border-l-emerald-500"
    case "pending": return "border-l-amber-500"
    case "cancelled": return "border-l-red-500"
    default: return "border-l-primary"
  }
}

function getEventTop(startTime: string, weekStart: Date): { top: number; height: number } {
  const start = parseISO(toUTC(startTime))
  const minutesFromDayStart = (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes()
  const top = (minutesFromDayStart / 60) * HOUR_HEIGHT
  return { top, height: HOUR_HEIGHT } // height will be overridden
}

function getEventStyle(startTime: string, endTime: string): { top: number; height: number } {
  const start = parseISO(toUTC(startTime))
  const end = parseISO(toUTC(endTime))
  const minutesFromDayStart = (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes()
  const durationMinutes = differenceInMinutes(end, start)
  const top = (minutesFromDayStart / 60) * HOUR_HEIGHT
  const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 24)
  return { top, height }
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export default function CalendarPage() {
  const { user } = useRequireAuth()
  const isManager = user?.role === "admin" || user?.role === "manager"

  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all")
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [blocks, setBlocks] = useState<CalendarBlock[]>([])
  const [rooms, setRooms] = useState<ApiRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [bookModalOpen, setBookModalOpen] = useState(false)

  const weekStart = useMemo(
    () => startOfWeek(currentWeek, { weekStartsOn: 1 }), // Monday
    [currentWeek]
  )
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  // Fetch rooms list for filter dropdown
  useEffect(() => {
    api
      .get<{ success: boolean; data: { rooms: ApiRoom[] } }>("/v1/rooms?limit=100")
      .then((res) => setRooms(res.data.rooms ?? []))
      .catch(() => {})
  }, [])

  // Fetch events + blocks for the visible week
  const fetchWeekData = useCallback(async () => {
    setIsLoading(true)
    const startDate = weekStart.toISOString()
    const endDate = endOfWeek(currentWeek, { weekStartsOn: 1 }).toISOString()

    try {
      const [eventsRes, blocksRes] = await Promise.all([
        api.get<{ success: boolean; data: CalendarEvent[] }>(
          `/v1/calendar/events?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
        ),
        api.get<{ success: boolean; data: CalendarBlock[] }>(
          `/v1/calendar/blocks?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
        ),
      ])
      setEvents(eventsRes.data ?? [])
      setBlocks(blocksRes.data ?? [])
    } catch {
      setEvents([])
      setBlocks([])
    } finally {
      setIsLoading(false)
    }
  }, [weekStart, currentWeek])

  useEffect(() => {
    fetchWeekData()
  }, [fetchWeekData])

  // Assign a stable color to each room
  const roomColorMap = useMemo(() => {
    const map: Record<string, (typeof ROOM_COLORS)[0]> = {}
    rooms.forEach((r, i) => {
      map[r.id] = ROOM_COLORS[i % ROOM_COLORS.length]
    })
    return map
  }, [rooms])

  // Filter events by selected room
  const filteredEvents = useMemo(() => {
    if (selectedRoomId === "all") return events
    return events.filter((e) => e.rooms?.id === selectedRoomId)
  }, [events, selectedRoomId])

  // Events per day per room
  const getEventsForDay = (day: Date) =>
    filteredEvents.filter((e) => isSameDay(parseISO(toUTC(e.start_time)), day))

  const getBlocksForDay = (day: Date) =>
    blocks.filter((b) => isSameDay(parseISO(toUTC(b.start_time)), day))

  if (!user) return null

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SearchHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6">

          {/* ── Page Header ── */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Room Calendar</h1>
              <p className="text-sm text-muted-foreground">
                View and manage room availability across all spaces
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {rooms.map((room) => {
                    const color = roomColorMap[room.id]
                    return (
                      <SelectItem key={room.id} value={room.id}>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${color?.bg ?? "bg-muted"}`} />
                          {room.name}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => setBookModalOpen(true)}>
                + Book Room
              </Button>
            </div>
          </div>

          {/* ── Room Legend ── */}
          {rooms.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-4">
              {rooms.map((room) => {
                const color = roomColorMap[room.id]
                return (
                  <div key={room.id} className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${color?.bg ?? "bg-muted"}`} />
                    <span className="text-sm text-muted-foreground">{room.name}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Week Navigation ── */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-medium">
                {format(weekDays[0], "MMM d")} – {format(weekDays[6], "MMM d, yyyy")}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentWeek((w) => subWeeks(w, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeek(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentWeek((w) => addWeeks(w, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  {/* Day headers */}
                  <div className="grid border-b border-border/50" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
                    <div className="p-2" />
                    {weekDays.map((day) => {
                      const today = isToday(day)
                      return (
                        <div
                          key={day.toISOString()}
                          className={`border-l border-border/30 p-3 text-center ${today ? "bg-primary/5" : ""}`}
                        >
                          <div className="text-xs font-medium text-muted-foreground uppercase">
                            {format(day, "EEE")}
                          </div>
                          <div
                            className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                              today
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {format(day, "d")}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Time grid */}
                  {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">Loading schedule…</p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="relative grid"
                      style={{
                        gridTemplateColumns: "56px repeat(7, 1fr)",
                        height: `${TOTAL_HOURS * HOUR_HEIGHT}px`,
                      }}
                    >
                      {/* Hour labels */}
                      <div className="relative">
                        {hours.slice(0, -1).map((hour) => (
                          <div
                            key={hour}
                            className="absolute right-2 text-[10px] text-muted-foreground"
                            style={{ top: `${(hour - DAY_START_HOUR) * HOUR_HEIGHT - 6}px` }}
                          >
                            {format(new Date(2000, 0, 1, hour), "h a")}
                          </div>
                        ))}
                      </div>

                      {/* Day columns */}
                      {weekDays.map((day) => {
                        const dayEvents = getEventsForDay(day)
                        const dayBlocks = getBlocksForDay(day)
                        const today = isToday(day)

                        return (
                          <div
                            key={day.toISOString()}
                            className={`relative border-l border-border/30 ${today ? "bg-primary/[0.02]" : ""}`}
                          >
                            {/* Hour lines */}
                            {hours.slice(0, -1).map((hour) => (
                              <div
                                key={hour}
                                className="absolute inset-x-0 border-t border-border/20"
                                style={{ top: `${(hour - DAY_START_HOUR) * HOUR_HEIGHT}px` }}
                              />
                            ))}

                            {/* Block-out periods */}
                            {dayBlocks.map((block) => {
                              const style = getEventStyle(block.start_time, block.end_time)
                              if (style.top < 0 || style.top > TOTAL_HOURS * HOUR_HEIGHT) return null
                              return (
                                <div
                                  key={block.id}
                                  className="absolute inset-x-1 overflow-hidden rounded border border-dashed border-border bg-muted/60 px-2 py-1"
                                  style={{ top: style.top, height: style.height }}
                                  title={`${block.title}${block.reason ? ": " + block.reason : ""}`}
                                >
                                  <p className="truncate text-[10px] font-medium text-muted-foreground">
                                    🔒 {block.title}
                                  </p>
                                </div>
                              )
                            })}

                            {/* Booking events */}
                            {dayEvents.map((event) => {
                              const style = getEventStyle(event.start_time, event.end_time)
                              if (style.top < 0 || style.top > TOTAL_HOURS * HOUR_HEIGHT) return null
                              const roomColor = event.rooms ? roomColorMap[event.rooms.id] : null
                              return (
                                <button
                                  key={event.id}
                                  onClick={() => setSelectedEvent(event)}
                                  className={`absolute inset-x-1 overflow-hidden rounded-md border border-l-2 px-2 py-1 text-left transition-opacity hover:opacity-90 active:opacity-75 ${
                                    roomColor?.light ?? "bg-primary/15 border-primary/30 text-primary"
                                  } ${getStatusColor(event.status)}`}
                                  style={{ top: style.top, height: style.height }}
                                >
                                  <p className="truncate text-[11px] font-semibold leading-tight">
                                    {event.title}
                                  </p>
                                  {style.height > 36 && (
                                    <p className="truncate text-[10px] opacity-75">
                                      {format(parseISO(toUTC(event.start_time)), "h:mm")}–
                                      {format(parseISO(toUTC(event.end_time)), "h:mm a")}
                                    </p>
                                  )}
                                  {style.height > 52 && event.rooms && (
                                    <p className="truncate text-[10px] opacity-60">
                                      {event.rooms.name}
                                    </p>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Room Utilisation Summary ── */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="p-4">
                      <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                      <Skeleton className="h-4 w-28 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </CardContent>
                  </Card>
                ))
              : rooms.slice(0, 4).map((room) => {
                  const color = roomColorMap[room.id]
                  const roomEvents = filteredEvents.filter((e) => e.rooms?.id === room.id)
                  const todayEvents = roomEvents.filter((e) =>
                    isSameDay(parseISO(toUTC(e.start_time)), new Date())
                  )
                  const isBusy = todayEvents.length > 0
                  return (
                    <Card key={room.id} className="border-border/50 bg-card">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color?.bg ?? "bg-muted"}`}
                          >
                            <MapPin className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-medium text-foreground">
                              {room.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {todayEvents.length} booking{todayEvents.length !== 1 ? "s" : ""} today
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={
                              isBusy
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-emerald-500/10 text-emerald-500"
                            }
                          >
                            {isBusy ? "Busy" : "Free"}
                          </Badge>
                        </div>
                        {todayEvents.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {todayEvents.slice(0, 2).map((e) => (
                              <div
                                key={e.id}
                                className="flex items-center gap-2 text-xs text-muted-foreground"
                              >
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>
                                  {format(parseISO(toUTC(e.start_time)), "h:mm a")} –{" "}
                                  {format(parseISO(toUTC(e.end_time)), "h:mm a")}
                                </span>
                                <span className="truncate">{e.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
          </div>
        </main>
      </SidebarInset>

      {/* ── Event Detail Dialog ── */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>
                  {format(parseISO(toUTC(selectedEvent.start_time)), "EEE, MMM d · h:mm a")} –{" "}
                  {format(parseISO(toUTC(selectedEvent.end_time)), "h:mm a")}
                </span>
              </div>
              {selectedEvent.rooms && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{selectedEvent.rooms.name}</span>
                  {selectedEvent.rooms.floor && (
                    <span className="text-muted-foreground/60">· Floor {selectedEvent.rooms.floor}</span>
                  )}
                </div>
              )}
              {selectedEvent.users && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>Booked by {selectedEvent.users.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={
                    selectedEvent.status === "confirmed" || selectedEvent.status === "approved"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : selectedEvent.status === "pending"
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                </Badge>
              </div>
              {selectedEvent.description && (
                <p className="text-muted-foreground">{selectedEvent.description}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Book Room Modal */}
      <BookRoomModal
        open={bookModalOpen}
        onOpenChange={setBookModalOpen}
        onSuccess={fetchWeekData}
      />
    </SidebarProvider>
  )
}
