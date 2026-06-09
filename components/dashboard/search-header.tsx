"use client"

import { useState } from "react"
import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { BookRoomModal } from "./book-room-modal"
import { NotificationsDropdown } from "./notifications-dropdown"

export function SearchHeader() {
  const [isBookRoomOpen, setIsBookRoomOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-4 md:px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search rooms, meetings..."
              className="h-9 w-full bg-secondary pl-9 pr-4 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring md:w-80"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsDropdown />
          <Button size="sm" className="h-9 gap-2" onClick={() => setIsBookRoomOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Book Room</span>
          </Button>
        </div>
      </header>

      <BookRoomModal open={isBookRoomOpen} onOpenChange={setIsBookRoomOpen} />
    </>
  )
}
