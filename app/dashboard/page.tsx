"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SearchHeader } from "@/components/dashboard/search-header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { UpcomingMeetings } from "@/components/dashboard/upcoming-meetings"
import { AvailableRooms } from "@/components/dashboard/available-rooms"
import { CalendarWidget } from "@/components/dashboard/calendar-widget"
import { PendingApprovals } from "@/components/dashboard/pending-approvals"
import { useRequireAuth } from "@/hooks/useRequireAuth"

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth()

  if (isLoading || !user) return null

  const firstName = user.name?.split(" ")[0] ?? "there"

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SearchHeader />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-foreground">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Welcome back, {firstName}. Here&apos;s what&apos;s happening today.
              </p>
            </div>

            <div className="space-y-6">
              {/* Stats Overview */}
              <StatsCards />

              {/* Main Content Grid */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Main Content */}
                <div className="space-y-6 lg:col-span-2">
                  <UpcomingMeetings />
                  <AvailableRooms />
                </div>

                {/* Right Column - Sidebar Content */}
                <div className="space-y-6">
                  <CalendarWidget />
                  <PendingApprovals />
                </div>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
