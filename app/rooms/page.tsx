"use client"

import { useState, useEffect, useCallback } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SearchHeader } from "@/components/dashboard/search-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  Plus,
  Users,
  MapPin,
  Video,
  Wifi,
  Monitor,
  Phone,
  Pencil,
  Trash2,
  Building2,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { api, ApiError, type ApiResponse } from "@/lib/api"
import { toast } from "sonner"
import { useRequireAuth } from "@/hooks/useRequireAuth"

interface ApiRoom {
  id: string
  name: string
  capacity: number
  floor?: number
  location?: string
  amenities?: string[]
  isActive?: boolean
  description?: string
}

const amenityConfig = [
  { id: "video", label: "Video Conferencing", icon: Video },
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
  { id: "display", label: "Display Screen", icon: Monitor },
  { id: "phone", label: "Conference Phone", icon: Phone },
]

const ROOM_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
]

const colorOptions = [
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-emerald-500", label: "Green" },
  { value: "bg-amber-500", label: "Amber" },
  { value: "bg-rose-500", label: "Rose" },
  { value: "bg-violet-500", label: "Violet" },
  { value: "bg-cyan-500", label: "Cyan" },
]

type FormData = {
  name: string
  capacity: string
  floor: string
  location: string
  amenities: string[]
  color: string
}

const emptyForm: FormData = {
  name: "",
  capacity: "",
  floor: "",
  location: "",
  amenities: [],
  color: "bg-blue-500",
}

function getStatusLabel(room: ApiRoom): "available" | "maintenance" {
  return room.isActive !== false ? "available" : "maintenance"
}

function getStatusColor(status: string) {
  switch (status) {
    case "available": return "bg-emerald-500/10 text-emerald-500"
    case "occupied": return "bg-amber-500/10 text-amber-500"
    case "maintenance": return "bg-red-500/10 text-red-500"
    default: return "bg-muted text-muted-foreground"
  }
}

export default function RoomsPage() {
  useRequireAuth()

  const [rooms, setRooms] = useState<ApiRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<ApiRoom | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<FormData>(emptyForm)

  const fetchRooms = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get<{ success: boolean; data: { rooms: ApiRoom[] } }>("/v1/rooms?limit=100")
      setRooms(res.data.rooms ?? [])
    } catch {
      toast.error("Failed to load rooms")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchRooms() }, [fetchRooms])

  const resetForm = () => setFormData(emptyForm)

  const handleAddRoom = async () => {
    if (!formData.name || !formData.capacity || !formData.floor) {
      toast.error("Please fill in all required fields")
      return
    }
    setIsSaving(true)
    try {
      await api.post<ApiResponse<ApiRoom>>("/v1/rooms", {
        name: formData.name,
        capacity: parseInt(formData.capacity),
        floor: parseInt(formData.floor),
        location: formData.location || formData.floor,
        amenities: formData.amenities,
        description: "",
      })
      toast.success("Room added successfully")
      resetForm()
      setIsAddDialogOpen(false)
      fetchRooms()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add room")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditRoom = async () => {
    if (!editingRoom || !formData.name || !formData.capacity || !formData.floor) {
      toast.error("Please fill in all required fields")
      return
    }
    setIsSaving(true)
    try {
      await api.put<ApiResponse<ApiRoom>>(`/v1/rooms/${editingRoom.id}`, {
        name: formData.name,
        capacity: parseInt(formData.capacity),
        floor: parseInt(formData.floor),
        location: formData.location || formData.floor,
        amenities: formData.amenities,
      })
      toast.success("Room updated successfully")
      setEditingRoom(null)
      resetForm()
      setIsEditDialogOpen(false)
      fetchRooms()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update room")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteRoom = async (id: string) => {
    try {
      await api.delete(`/v1/rooms/${id}`)
      toast.success("Room deleted")
      setRooms((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete room")
    }
  }

  const openEditDialog = (room: ApiRoom) => {
    setEditingRoom(room)
    setFormData({
      name: room.name,
      capacity: room.capacity.toString(),
      floor: room.floor?.toString() ?? "",
      location: room.location ?? "",
      amenities: room.amenities ?? [],
      color: ROOM_COLORS[rooms.findIndex((r) => r.id === room.id) % ROOM_COLORS.length],
    })
    setIsEditDialogOpen(true)
  }

  const toggleAmenity = (amenityId: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((a) => a !== amenityId)
        : [...prev.amenities, amenityId],
    }))
  }

  const renderRoomForm = (onSubmit: () => void, submitLabel: string) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="room-name">Room Name *</Label>
        <Input
          id="room-name"
          placeholder="e.g., Conference Room A"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="room-capacity">Capacity *</Label>
          <Input
            id="room-capacity"
            type="number"
            placeholder="e.g., 12"
            value={formData.capacity}
            onChange={(e) => setFormData((prev) => ({ ...prev, capacity: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="room-floor">Floor *</Label>
          <Select
            value={formData.floor}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, floor: value }))}
          >
            <SelectTrigger id="room-floor">
              <SelectValue placeholder="Select floor" />
            </SelectTrigger>
            <SelectContent>
              {["1", "2", "3", "4", "5"].map((f) => (
                <SelectItem key={f} value={f}>Floor {f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="room-location">Location / Label</Label>
        <Input
          id="room-location"
          placeholder="e.g., North Wing, 3rd Floor"
          value={formData.location}
          onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Color Tag</Label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, color: color.value }))}
              className={`h-8 w-8 rounded-full ${color.value} transition-all ${
                formData.color === color.value
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "opacity-60 hover:opacity-100"
              }`}
              title={color.label}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Amenities</Label>
        <div className="grid grid-cols-2 gap-3">
          {amenityConfig.map((amenity) => (
            <div key={amenity.id} className="flex items-center space-x-2">
              <Checkbox
                id={`amenity-${amenity.id}`}
                checked={formData.amenities.includes(amenity.id)}
                onCheckedChange={() => toggleAmenity(amenity.id)}
              />
              <label
                htmlFor={`amenity-${amenity.id}`}
                className="flex items-center gap-2 text-sm font-medium leading-none"
              >
                <amenity.icon className="h-4 w-4 text-muted-foreground" />
                {amenity.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => {
            resetForm()
            setIsAddDialogOpen(false)
            setIsEditDialogOpen(false)
          }}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isSaving}>
          {isSaving ? "Saving…" : submitLabel}
        </Button>
      </DialogFooter>
    </div>
  )

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SearchHeader />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Rooms</h1>
              <p className="text-sm text-muted-foreground">
                Manage conference rooms and meeting spaces
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Room</DialogTitle>
                  <DialogDescription>
                    Create a new conference room or meeting space.
                  </DialogDescription>
                </DialogHeader>
                {renderRoomForm(handleAddRoom, "Add Room")}
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Overview */}
          <div className="mb-6 grid gap-4 sm:grid-cols-4">
            {[
              { label: "Total Rooms", value: rooms.length, icon: Building2, color: "bg-primary/10", iconColor: "text-primary" },
              { label: "Available", value: rooms.filter((r) => r.isActive !== false).length, icon: MapPin, color: "bg-emerald-500/10", iconColor: "text-emerald-500" },
              { label: "Total Capacity", value: rooms.reduce((a, r) => a + r.capacity, 0), icon: Users, color: "bg-amber-500/10", iconColor: "text-amber-500" },
              { label: "Video Enabled", value: rooms.filter((r) => (r.amenities ?? []).includes("video")).length, icon: Video, color: "bg-rose-500/10", iconColor: "text-rose-500" },
            ].map(({ label, value, icon: Icon, color, iconColor }) => (
              <Card key={label} className="border-border/50 bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                      <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-foreground">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Rooms Grid */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room, idx) => {
                const status = getStatusLabel(room)
                const color = ROOM_COLORS[idx % ROOM_COLORS.length]
                const amenities = room.amenities ?? []
                return (
                  <Card
                    key={room.id}
                    className="group border-border/50 bg-card transition-colors hover:bg-muted/30"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{room.name}</CardTitle>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {room.location ?? (room.floor ? `Floor ${room.floor}` : "—")}
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(status)}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>Capacity: {room.capacity}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {amenities.map((amenityId) => {
                          const amenity = amenityConfig.find((a) => a.id === amenityId)
                          if (!amenity) return null
                          return (
                            <div
                              key={amenityId}
                              className="flex h-8 w-8 items-center justify-center rounded-md bg-muted"
                              title={amenity.label}
                            >
                              <amenity.icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )
                        })}
                      </div>

                      <div className="flex gap-2 pt-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <Dialog
                          open={isEditDialogOpen && editingRoom?.id === room.id}
                          onOpenChange={(open) => {
                            if (!open) {
                              setIsEditDialogOpen(false)
                              setEditingRoom(null)
                              resetForm()
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => openEditDialog(room)}
                            >
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Room</DialogTitle>
                              <DialogDescription>
                                Update the room details and amenities.
                              </DialogDescription>
                            </DialogHeader>
                            {renderRoomForm(handleEditRoom, "Save Changes")}
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Room</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{room.name}&quot;? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteRoom(room.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Room
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {!isLoading && rooms.length === 0 && (
            <Card className="border-border/50 bg-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium text-foreground">No rooms configured</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your first conference room to get started
                </p>
                <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Room
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
