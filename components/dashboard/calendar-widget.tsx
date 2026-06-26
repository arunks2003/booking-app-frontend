"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api, type ApiResponse } from "@/lib/api"
import { startOfMonth, endOfMonth, parseISO, format } from "date-fns"

interface CalendarEvent {
  id: string
  start_time: string
}

/** Append Z when the backend omits the UTC suffix. */
function toUTC(ts: string): string {
  return ts.endsWith("Z") ? ts : ts + "Z"
}

export function CalendarWidget() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [month, setMonth] = useState<Date>(new Date())
  const [bookedDates, setBookedDates] = useState<Date[]>([])

  useEffect(() => {
    const fetchEventsForMonth = async (m: Date) => {
      const startDate = startOfMonth(m).toISOString()
      const endDate = endOfMonth(m).toISOString()

      try {
        const res = await api.get<ApiResponse<CalendarEvent[]>>(
          `/v1/calendar/events?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
        )
        const dates = (res.data ?? []).map((e) => parseISO(toUTC(e.start_time)))
        setBookedDates(dates)
      } catch {
        setBookedDates([])
      }
    }

    fetchEventsForMonth(month)
  }, [month])

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Calendar</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          month={month}
          onMonthChange={setMonth}
          className="mx-auto"
          modifiers={{
            booked: bookedDates,
          }}
          modifiersClassNames={{
            booked: "bg-primary/20 text-primary rounded-md font-semibold",
          }}
        />
        <div className="mt-4 flex items-center justify-center gap-4 border-t border-border pt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary/30" />
            <span className="text-muted-foreground">Has bookings</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
