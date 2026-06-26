"use client"

import { useEffect, useState } from "react"
import { Clock, MapPin, Users, MoreHorizontal } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { api, type ApiResponse } from "@/lib/api"
import { format, parseISO, formatDistanceToNow, isFuture } from "date-fns"

interface ApiBooking {
  id: string
  title: string
  start_time: string
  end_time: string
  status: string
  rooms?: {
    id: string
    name: string
    floor?: number
    capacity?: number
  }
  attendees?: Array<{ user?: { name?: string } }>
}

function getStatusLabel(startTime?: string): string {
  if (!startTime) return "unknown"
  const start = parseISO(startTime)
  if (!isFuture(start)) return "today"
  const dist = formatDistanceToNow(start, { addSuffix: false })
  return `in ${dist}`
}

function getStatusColor(startTime?: string): string {
  if (!startTime) return "bg-muted"
  const start = parseISO(startTime)
  const hoursAway = (start.getTime() - Date.now()) / (1000 * 60 * 60)
  if (hoursAway < 1) return "bg-primary"
  if (hoursAway < 4) return "bg-warning"
  return "bg-muted"
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

export function UpcomingMeetings() {
  const [meetings, setMeetings] = useState<ApiBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api
      .get<ApiResponse<ApiBooking[]>>("/v1/dashboard/upcoming?limit=5")
      .then((res) => setMeetings(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium">
          Upcoming Meetings
        </CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            View all
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-secondary/50 p-4 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))
        ) : meetings.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No upcoming meetings
          </p>
        ) : (
          meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="group flex items-start gap-4 rounded-lg border border-border bg-secondary/50 p-4 transition-colors hover:bg-secondary"
            >
              <div
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${getStatusColor(meeting.start_time)}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="truncate text-sm font-medium text-foreground">
                    {meeting.title}
                  </h4>
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-[10px] uppercase text-muted-foreground"
                  >
                    {getStatusLabel(meeting.start_time)}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(parseISO(meeting.start_time), "h:mm a")} –{" "}
                    {format(parseISO(meeting.end_time), "h:mm a")}
                  </span>
                  {meeting.rooms && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {meeting.rooms.name}
                    </span>
                  )}
                </div>
                {meeting.attendees && meeting.attendees.length > 0 && (
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {meeting.attendees.slice(0, 3).map((a, idx) => (
                          <Avatar key={idx} className="h-6 w-6 border-2 border-card">
                            <AvatarFallback className="bg-muted text-[10px] text-muted-foreground">
                              {getInitials(a.user?.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {meeting.attendees.length}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

