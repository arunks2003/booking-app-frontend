"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, Clock, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { api, ApiError } from "@/lib/api"
import { toast } from "sonner"

interface BookRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedRoomId?: string
  onSuccess?: () => void
}

interface ApiRoom {
  id: string
  name: string
  capacity: number
  floor?: number
  location?: string
}

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
]

export function BookRoomModal({ open, onOpenChange, preselectedRoomId, onSuccess }: BookRoomModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rooms, setRooms] = useState<ApiRoom[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    roomId: preselectedRoomId ?? "",
    date: undefined as Date | undefined,
    startTime: "",
    endTime: "",
    attendees: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Sync preselectedRoomId into form
  useEffect(() => {
    if (preselectedRoomId) {
      setFormData((p) => ({ ...p, roomId: preselectedRoomId }))
    }
  }, [preselectedRoomId])

  // Fetch rooms list when modal opens
  useEffect(() => {
    if (!open) return
    setIsLoadingRooms(true)
    api
      .get<{ success: boolean; data: { rooms: ApiRoom[] } }>("/v1/rooms?limit=50")
      .then((res) => setRooms(res.data.rooms ?? []))
      .catch(() => toast.error("Failed to load rooms"))
      .finally(() => setIsLoadingRooms(false))
  }, [open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = "Meeting title is required"
    if (!formData.roomId) newErrors.roomId = "Please select a room"
    if (!formData.date) newErrors.date = "Please select a date"
    if (!formData.startTime) newErrors.startTime = "Start time is required"
    if (!formData.endTime) newErrors.endTime = "End time is required"
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = "End time must be after start time"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setIsSubmitting(true)

    try {
      const dateStr = format(formData.date!, "yyyy-MM-dd")
      const startTime = new Date(`${dateStr}T${formData.startTime}:00`).toISOString()
      const endTime = new Date(`${dateStr}T${formData.endTime}:00`).toISOString()

      const attendees = formData.attendees
        ? formData.attendees
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean)
        : []

      await api.post("/v1/bookings", {
        roomId: formData.roomId,
        title: formData.title,
        description: formData.description || undefined,
        startTime,
        endTime,
        attendees,
      })

      toast.success("Room booked successfully!")
      handleCancel()
      onSuccess?.()
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error("Failed to create booking. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      title: "",
      description: "",
      roomId: preselectedRoomId ?? "",
      date: undefined,
      startTime: "",
      endTime: "",
      attendees: "",
    })
    setErrors({})
    onOpenChange(false)
  }

  const selectedRoom = rooms.find((r) => r.id === formData.roomId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Book a Room</DialogTitle>
          <DialogDescription>
            Fill in the details below to reserve a conference room for your meeting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Meeting Title */}
          <div className="space-y-2">
            <Label htmlFor="book-title">
              Meeting Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="book-title"
              placeholder="e.g., Weekly Team Standup"
              value={formData.title}
              onChange={(e) => {
                setFormData((p) => ({ ...p, title: e.target.value }))
                if (errors.title) setErrors((p) => ({ ...p, title: "" }))
              }}
              className={cn(errors.title && "border-destructive focus-visible:ring-destructive")}
              disabled={isSubmitting}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Room Selection */}
          <div className="space-y-2">
            <Label>
              Select Room <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.roomId}
              onValueChange={(value) => {
                setFormData((p) => ({ ...p, roomId: value }))
                if (errors.roomId) setErrors((p) => ({ ...p, roomId: "" }))
              }}
              disabled={isSubmitting || isLoadingRooms}
            >
              <SelectTrigger className={cn(errors.roomId && "border-destructive focus-visible:ring-destructive")}>
                <SelectValue placeholder={isLoadingRooms ? "Loading rooms…" : "Choose a conference room"} />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    <div className="flex items-center gap-2">
                      <span>{room.name}</span>
                      <span className="text-muted-foreground">
                        ({room.location ?? (room.floor ? `Floor ${room.floor}` : "")}, {room.capacity} people)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roomId && <p className="text-xs text-destructive">{errors.roomId}</p>}
            {selectedRoom && (
              <div className="flex items-center gap-4 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Capacity: {selectedRoom.capacity}
                </span>
                <span>
                  {selectedRoom.location ?? (selectedRoom.floor ? `Floor ${selectedRoom.floor}` : "")}
                </span>
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>
              Date <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground",
                    errors.date && "border-destructive focus-visible:ring-destructive"
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => {
                    setFormData((p) => ({ ...p, date }))
                    if (errors.date) setErrors((p) => ({ ...p, date: "" }))
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Start Time <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.startTime}
                onValueChange={(value) => {
                  setFormData((p) => ({ ...p, startTime: value }))
                  if (errors.startTime) setErrors((p) => ({ ...p, startTime: "" }))
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger className={cn(errors.startTime && "border-destructive focus-visible:ring-destructive")}>
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Start" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.startTime && <p className="text-xs text-destructive">{errors.startTime}</p>}
            </div>
            <div className="space-y-2">
              <Label>
                End Time <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.endTime}
                onValueChange={(value) => {
                  setFormData((p) => ({ ...p, endTime: value }))
                  if (errors.endTime) setErrors((p) => ({ ...p, endTime: "" }))
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger className={cn(errors.endTime && "border-destructive focus-visible:ring-destructive")}>
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="End" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.endTime && <p className="text-xs text-destructive">{errors.endTime}</p>}
            </div>
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <Label htmlFor="book-attendees">Attendees</Label>
            <Input
              id="book-attendees"
              placeholder="Enter email addresses separated by commas"
              value={formData.attendees}
              onChange={(e) => setFormData((p) => ({ ...p, attendees: e.target.value }))}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Optional. Invites will be sent to these email addresses.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="book-description">Description</Label>
            <Textarea
              id="book-description"
              placeholder="Add meeting agenda or notes..."
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              className="min-h-[80px] resize-none"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : (
              "Confirm Booking"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
