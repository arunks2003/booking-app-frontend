"use client"

import { useEffect, useState } from "react"
import { Users, Monitor, Wifi, Coffee, Loader2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { BookRoomModal } from "@/components/dashboard/book-room-modal"
import Link from "next/link"

interface ApiRoom {
  id: string
  name: string
  capacity: number
  floor?: string | number
  location?: string
  amenities?: string[]
  is_available?: boolean
}

const GRADIENT_COLORS = [
  "bg-gradient-to-br from-primary/20 to-primary/5",
  "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5",
  "bg-gradient-to-br from-amber-500/20 to-amber-500/5",
  "bg-gradient-to-br from-violet-500/20 to-violet-500/5",
]

const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  monitor: Monitor,
  display: Monitor,
  wifi: Wifi,
  coffee: Coffee,
}

export function AvailableRooms() {
  const [rooms, setRooms] = useState<ApiRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [bookingRoom, setBookingRoom] = useState<ApiRoom | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    api
      .get<{ success: boolean; data: { rooms: ApiRoom[] } }>("/v1/rooms?limit=4")
      .then((res) => setRooms(res.data.rooms ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const handleBook = (room: ApiRoom) => {
    setBookingRoom(room)
    setModalOpen(true)
  }

  return (
    <>
      <Card className="border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">Available Rooms</CardTitle>
          <CardAction>
            <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
              <Link href="/rooms">See all</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border overflow-hidden">
                  <Skeleton className="h-20 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No rooms found</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {rooms.map((room, idx) => {
                const isAvailable = room.is_available !== false
                const amenities = room.amenities ?? []
                return (
                  <div
                    key={room.id}
                    className="group relative overflow-hidden rounded-lg border border-border bg-secondary/30 transition-colors hover:bg-secondary/50"
                  >
                    <div className={`h-20 ${GRADIENT_COLORS[idx % GRADIENT_COLORS.length]}`} />
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-foreground">
                            {room.name}
                          </h4>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {room.location ?? (room.floor ? `Floor ${room.floor}` : "—")}
                          </p>
                        </div>
                        <Badge
                          variant={isAvailable ? "default" : "secondary"}
                          className={`text-[10px] ${
                            isAvailable
                              ? "bg-success text-success-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {isAvailable ? "Available" : "Occupied"}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {room.capacity}
                          </span>
                          <div className="flex items-center gap-1">
                            {amenities.slice(0, 3).map((amenity) => {
                              const Icon = amenityIcons[amenity.toLowerCase()]
                              return Icon ? (
                                <Icon key={amenity} className="h-3 w-3 text-muted-foreground" />
                              ) : null
                            })}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isAvailable ? "default" : "secondary"}
                          className="h-7 text-xs"
                          disabled={!isAvailable}
                          onClick={() => isAvailable && handleBook(room)}
                        >
                          {isAvailable ? "Book" : "Occupied"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <BookRoomModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        preselectedRoomId={bookingRoom?.id}
      />
    </>
  )
}
