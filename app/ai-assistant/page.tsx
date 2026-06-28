"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SearchHeader } from "@/components/dashboard/search-header"
import { ChatWindow } from "@/components/ai/ChatWindow"
import { useRequireAuth } from "@/hooks/useRequireAuth"

export default function AIAssistantPage() {
  const { user, isLoading } = useRequireAuth()

  if (isLoading || !user) return null

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SearchHeader />
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden p-4 md:p-6 lg:p-8">
            <div className="mb-4">
              <h1 className="text-2xl font-semibold text-foreground">
                AI Assistant
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Chat with our AI to book rooms, check availability, and manage your meetings.
              </p>
            </div>

            <div className="flex-1 overflow-hidden">
              <ChatWindow />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
