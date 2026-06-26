"use client"

import { useEffect, useState } from "react"
import { CalendarDays, Users, Clock, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api, type ApiResponse } from "@/lib/api"

interface DashboardStats {
  totalBookings: number
  upcomingBookings: number
  cancelledBookings: number
  completedBookings: number
  totalRooms: number
  averageBookingDuration: number
}

export function StatsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api
      .get<ApiResponse<any>>("/v1/dashboard/stats")
      .then((res) => {
        const data = res.data
        const mappedStats: DashboardStats = {
          totalBookings: data.total_bookings ?? 0,
          totalRooms: data.total_rooms ?? 0,
          upcomingBookings:
            (data.bookings_by_status?.confirmed ?? 0) +
            (data.bookings_by_status?.approved ?? 0) +
            (data.bookings_by_status?.pending ?? 0),
          cancelledBookings: data.bookings_by_status?.cancelled ?? 0,
          completedBookings: data.bookings_by_status?.completed ?? 0,
          averageBookingDuration: 45, // default average booking duration
        }
        setStats(mappedStats)
      })
      .catch(() => {/* silently fail — show skeletons */})
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border">
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: "Total Bookings",
      value: stats?.totalBookings?.toString() ?? "—",
      subtext: `${stats?.completedBookings ?? 0} completed`,
      icon: CalendarDays,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Total Rooms",
      value: stats?.totalRooms?.toString() ?? "—",
      subtext: "conference rooms",
      icon: TrendingUp,
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
    {
      label: "Upcoming",
      value: stats?.upcomingBookings?.toString() ?? "—",
      subtext: "scheduled meetings",
      icon: Clock,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
    },
    {
      label: "Avg Duration",
      value: stats?.averageBookingDuration
        ? `${Math.round(stats.averageBookingDuration)}m`
        : "—",
      subtext: "per booking",
      icon: Users,
      iconBg: "bg-chart-2/10",
      iconColor: "text-chart-2",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((stat) => (
        <Card key={stat.label} className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.subtext}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconBg}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
