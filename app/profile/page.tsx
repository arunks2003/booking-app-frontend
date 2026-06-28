"use client"

import { useState, useEffect, useCallback } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SearchHeader } from "@/components/dashboard/search-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import {
  User,
  Mail,
  Shield,
  CalendarDays,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Check,
  ArrowLeft,
  Loader2,
  Pencil,
  Save,
  X,
} from "lucide-react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useAuth } from "@/context/auth-context"
import { api, type ApiResponse } from "@/lib/api"
import { toast } from "sonner"

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface ProfileData {
  id: string
  name: string
  email: string
  role: string
  created_at: string
  updated_at?: string
}

type PasswordStep = "idle" | "enter-password" | "enter-otp" | "new-password" | "success"

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function getInitials(name?: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return "—"
  }
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case "admin":
      return "default" as const
    case "manager":
      return "secondary" as const
    default:
      return "outline" as const
  }
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

export default function ProfilePage() {
  const { user: authUser, isLoading: authLoading } = useRequireAuth()
  const { updateUser } = useAuth()

  // Profile data
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)

  // Name editing
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState("")
  const [isSavingName, setIsSavingName] = useState(false)

  // Password change wizard
  const [passwordStep, setPasswordStep] = useState<PasswordStep>("idle")
  const [currentPassword, setCurrentPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)

  // ──────────────────────────────────────────────
  // Fetch Profile
  // ──────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    try {
      setIsProfileLoading(true)
      const res = await api.get<ApiResponse<ProfileData>>("/v1/profile")
      setProfile(res.data)
    } catch {
      toast.error("Failed to load profile")
    } finally {
      setIsProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authUser) fetchProfile()
  }, [authUser, fetchProfile])

  // ──────────────────────────────────────────────
  // Name Edit
  // ──────────────────────────────────────────────

  const startEditingName = () => {
    setEditName(profile?.name ?? "")
    setIsEditingName(true)
  }

  const cancelEditingName = () => {
    setIsEditingName(false)
    setEditName("")
  }

  const saveName = async () => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty")
      return
    }

    setIsSavingName(true)
    try {
      const res = await api.put<ApiResponse<ProfileData>>("/v1/profile", {
        name: editName.trim(),
      })
      setProfile(res.data)
      updateUser({ name: res.data.name })
      setIsEditingName(false)
      toast.success("Name updated successfully")
    } catch {
      toast.error("Failed to update name")
    } finally {
      setIsSavingName(false)
    }
  }

  // ──────────────────────────────────────────────
  // Password Change Wizard
  // ──────────────────────────────────────────────

  const resetPasswordWizard = () => {
    setPasswordStep("idle")
    setOtp("")
    setNewPassword("")
    setConfirmPassword("")
    setPasswordError("")
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  const handleRequestOTP = async () => {
    setPasswordError("")
    setIsPasswordLoading(true)
    try {
      await api.post("/v1/profile/request-otp")
      setPasswordStep("enter-otp")
      toast.success("OTP sent to your email!")
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to send OTP"
      setPasswordError(message)
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const handleVerifyAndChange = async () => {
    if (otp.length !== 6) {
      setPasswordError("Please enter the complete 6-digit OTP")
      return
    }
    if (!newPassword) {
      setPasswordError("Please enter a new password")
      return
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }
    setPasswordError("")
    setIsPasswordLoading(true)
    try {
      await api.post("/v1/profile/change-password", { otp, newPassword })
      setPasswordStep("success")
      toast.success("Password changed successfully!")
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to change password"
      setPasswordError(message)
    } finally {
      setIsPasswordLoading(false)
    }
  }

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────

  if (authLoading || !authUser) return null

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SearchHeader />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground">
                Profile
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                View your account information and manage your password.
              </p>
            </div>

            <div className="space-y-6">
              {/* ─── User Info Card ─── */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Your account details and profile information.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isProfileLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : profile ? (
                    <div className="space-y-6">
                      {/* Avatar + Name Row */}
                      <div className="flex items-start gap-5">
                        <Avatar className="h-20 w-20">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                            {getInitials(profile.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-1">
                          {isEditingName ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="max-w-xs"
                                placeholder="Enter your name"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveName()
                                  if (e.key === "Escape") cancelEditingName()
                                }}
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={saveName}
                                disabled={isSavingName}
                                className="h-8 w-8"
                              >
                                {isSavingName ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4 text-primary" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={cancelEditingName}
                                className="h-8 w-8"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h2 className="text-xl font-semibold text-foreground">
                                {profile.name}
                              </h2>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={startEditingName}
                                className="h-7 w-7"
                              >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          )}
                          <Badge variant={getRoleBadgeVariant(profile.role)} className="capitalize">
                            {profile.role}
                          </Badge>
                        </div>
                      </div>

                      <Separator />

                      {/* Detail Rows */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                            <Mail className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="text-sm font-medium">{profile.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Role</p>
                            <p className="text-sm font-medium capitalize">{profile.role}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                            <CalendarDays className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Member Since</p>
                            <p className="text-sm font-medium">{formatDate(profile.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Unable to load profile data.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* ─── Change Password Card ─── */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Secure your account by changing your password. An OTP will be sent to your email for verification.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* ─── Step: Idle ─── */}
                  {passwordStep === "idle" && (
                    <div className="space-y-4 max-w-md">
                      <Button
                        onClick={handleRequestOTP}
                        disabled={isPasswordLoading}
                        variant="outline"
                        className="gap-2"
                      >
                        {isPasswordLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <KeyRound className="h-4 w-4" />
                        )}
                        Request OTP to Change Password
                      </Button>
                      
                      {passwordError && (
                        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                          {passwordError}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── Step: Enter OTP + New Password ─── */}
                  {passwordStep === "enter-otp" && (
                    <div className="space-y-5 max-w-md">
                      {/* OTP Info Banner */}
                      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                        <p className="text-sm text-foreground">
                          <strong>OTP Sent!</strong> Check your email for a 6-digit code.
                          It expires in 10 minutes.
                        </p>
                      </div>

                      {/* OTP Input */}
                      <div className="space-y-2">
                        <Label>Enter OTP</Label>
                        <InputOTP
                          maxLength={6}
                          value={otp}
                          onChange={(value) => {
                            setOtp(value)
                            if (passwordError) setPasswordError("")
                          }}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>

                      <Separator />

                      {/* New Password */}
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="At least 8 characters"
                            className="pl-10 pr-10"
                            value={newPassword}
                            onChange={(e) => {
                              setNewPassword(e.target.value)
                              if (passwordError) setPasswordError("")
                            }}
                            disabled={isPasswordLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Re-enter your new password"
                            className="pl-10 pr-10"
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value)
                              if (passwordError) setPasswordError("")
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleVerifyAndChange()
                            }}
                            disabled={isPasswordLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {passwordError && (
                        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                          {passwordError}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleVerifyAndChange}
                          disabled={isPasswordLoading}
                          className="gap-2"
                        >
                          {isPasswordLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Change Password
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={resetPasswordWizard}
                          disabled={isPasswordLoading}
                          className="gap-2"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ─── Step: Success ─── */}
                  {passwordStep === "success" && (
                    <div className="space-y-4 max-w-md">
                      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 mt-0.5">
                          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Password Changed Successfully</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your password has been updated. You can use your new password the next time you log in.
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={resetPasswordWizard}
                        className="gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Done
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
