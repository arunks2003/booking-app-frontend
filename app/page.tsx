"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CalendarDays,
  Users,
  Building2,
  Clock,
  ArrowRight,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { ApiError } from "@/lib/api"
import { toast } from "sonner"
import { isAuthenticated } from "@/lib/auth"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const { login, register } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Login form state
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({})
  const [isLoginLoading, setIsLoginLoading] = useState(false)

  // Signup form state
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    terms: false,
  })
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({})
  const [isSignupLoading, setIsSignupLoading] = useState(false)

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard")
    }
  }, [router])

  // ──────────────────────────────────────────────
  // Login
  // ──────────────────────────────────────────────
  const validateLogin = () => {
    const errors: Record<string, string> = {}
    if (!loginData.email.trim()) errors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(loginData.email)) errors.email = "Enter a valid email"
    if (!loginData.password) errors.password = "Password is required"
    setLoginErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateLogin()) return
    setIsLoginLoading(true)
    try {
      await login({ email: loginData.email, password: loginData.password })
      toast.success("Welcome back!")
    } catch (err) {
      if (err instanceof ApiError) {
        setLoginErrors({ api: err.message })
      } else {
        setLoginErrors({ api: "Something went wrong. Please try again." })
      }
    } finally {
      setIsLoginLoading(false)
    }
  }

  // ──────────────────────────────────────────────
  // Register
  // ──────────────────────────────────────────────
  const validateSignup = () => {
    const errors: Record<string, string> = {}
    if (!signupData.firstName.trim()) errors.firstName = "First name is required"
    if (!signupData.lastName.trim()) errors.lastName = "Last name is required"
    if (!signupData.email.trim()) errors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(signupData.email)) errors.email = "Enter a valid email"
    if (!signupData.password) errors.password = "Password is required"
    else if (signupData.password.length < 8) errors.password = "Must be at least 8 characters"
    if (!signupData.terms) errors.terms = "You must accept the terms"
    setSignupErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateSignup()) return
    setIsSignupLoading(true)
    try {
      await register({
        email: signupData.email,
        password: signupData.password,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
      })
      toast.success("Account created! Welcome to RoomBook.")
    } catch (err) {
      if (err instanceof ApiError) {
        setSignupErrors({ api: err.message })
      } else {
        setSignupErrors({ api: "Something went wrong. Please try again." })
      }
    } finally {
      setIsSignupLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Banner */}
      <div className="relative flex-1 bg-gradient-to-br from-primary/20 via-background to-background p-8 lg:p-12 flex flex-col justify-between">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">RoomBook</span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 my-12 lg:my-0">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl text-balance">
            Smart Conference Room Booking for Modern Teams
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-lg text-pretty">
            Streamline your workspace management with intelligent scheduling, real-time availability, and seamless team collaboration.
          </p>

          {/* Feature Pills */}
          <div className="mt-8 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>Smart Scheduling</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground">
              <Users className="h-4 w-4 text-primary" />
              <span>Team Collaboration</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground">
              <Clock className="h-4 w-4 text-primary" />
              <span>Real-time Availability</span>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
            <div>
              <div className="text-2xl font-bold text-foreground">500+</div>
              <div className="text-sm text-muted-foreground">Companies</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">10k+</div>
              <div className="text-sm text-muted-foreground">Daily Bookings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-muted-foreground">
          &copy; 2024 RoomBook. All rights reserved.
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-card/50">
        <div className="w-full max-w-md">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* ─── Login Tab ─── */}
            <TabsContent value="login">
              <Card className="border-border/50 bg-card">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl">Welcome back</CardTitle>
                  <CardDescription>
                    Sign in to your account to continue
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Google Sign In — coming soon */}
                  <Button variant="outline" className="w-full" disabled>
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    Continue with Google
                    <span className="ml-2 text-xs text-muted-foreground">(coming soon)</span>
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue with email
                      </span>
                    </div>
                  </div>

                  {/* API error */}
                  {loginErrors.api && (
                    <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {loginErrors.api}
                    </div>
                  )}

                  {/* Email/Password Form */}
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="name@company.com"
                          className="pl-10"
                          value={loginData.email}
                          onChange={(e) => {
                            setLoginData((p) => ({ ...p, email: e.target.value }))
                            if (loginErrors.email) setLoginErrors((p) => ({ ...p, email: "" }))
                          }}
                          disabled={isLoginLoading}
                        />
                      </div>
                      {loginErrors.email && (
                        <p className="text-xs text-destructive">{loginErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pl-10 pr-10"
                          value={loginData.password}
                          onChange={(e) => {
                            setLoginData((p) => ({ ...p, password: e.target.value }))
                            if (loginErrors.password) setLoginErrors((p) => ({ ...p, password: "" }))
                          }}
                          disabled={isLoginLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {loginErrors.password && (
                        <p className="text-xs text-destructive">{loginErrors.password}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      />
                      <Label
                        htmlFor="remember"
                        className="text-sm font-normal text-muted-foreground cursor-pointer"
                      >
                        Remember me for 30 days
                      </Label>
                    </div>

                    <Button className="w-full" type="submit" disabled={isLoginLoading}>
                      {isLoginLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Signup Tab ─── */}
            <TabsContent value="signup">
              <Card className="border-border/50 bg-card">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl">Create an account</CardTitle>
                  <CardDescription>
                    Get started with RoomBook today
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Google Sign Up — coming soon */}
                  <Button variant="outline" className="w-full" disabled>
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    Sign up with Google
                    <span className="ml-2 text-xs text-muted-foreground">(coming soon)</span>
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue with email
                      </span>
                    </div>
                  </div>

                  {/* API error */}
                  {signupErrors.api && (
                    <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {signupErrors.api}
                    </div>
                  )}

                  {/* Signup Form */}
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="firstName"
                            placeholder="John"
                            className="pl-10"
                            value={signupData.firstName}
                            onChange={(e) => {
                              setSignupData((p) => ({ ...p, firstName: e.target.value }))
                              if (signupErrors.firstName) setSignupErrors((p) => ({ ...p, firstName: "" }))
                            }}
                            disabled={isSignupLoading}
                          />
                        </div>
                        {signupErrors.firstName && (
                          <p className="text-xs text-destructive">{signupErrors.firstName}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          value={signupData.lastName}
                          onChange={(e) => {
                            setSignupData((p) => ({ ...p, lastName: e.target.value }))
                            if (signupErrors.lastName) setSignupErrors((p) => ({ ...p, lastName: "" }))
                          }}
                          disabled={isSignupLoading}
                        />
                        {signupErrors.lastName && (
                          <p className="text-xs text-destructive">{signupErrors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signupEmail">Work email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signupEmail"
                          type="email"
                          placeholder="name@company.com"
                          className="pl-10"
                          value={signupData.email}
                          onChange={(e) => {
                            setSignupData((p) => ({ ...p, email: e.target.value }))
                            if (signupErrors.email) setSignupErrors((p) => ({ ...p, email: "" }))
                          }}
                          disabled={isSignupLoading}
                        />
                      </div>
                      {signupErrors.email && (
                        <p className="text-xs text-destructive">{signupErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signupPassword">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signupPassword"
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="Create a password"
                          className="pl-10 pr-10"
                          value={signupData.password}
                          onChange={(e) => {
                            setSignupData((p) => ({ ...p, password: e.target.value }))
                            if (signupErrors.password) setSignupErrors((p) => ({ ...p, password: "" }))
                          }}
                          disabled={isSignupLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {signupErrors.password ? (
                        <p className="text-xs text-destructive">{signupErrors.password}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                      )}
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        className="mt-0.5"
                        checked={signupData.terms}
                        onCheckedChange={(checked) => {
                          setSignupData((p) => ({ ...p, terms: checked as boolean }))
                          if (signupErrors.terms) setSignupErrors((p) => ({ ...p, terms: "" }))
                        }}
                      />
                      <Label
                        htmlFor="terms"
                        className="text-sm font-normal text-muted-foreground cursor-pointer leading-tight"
                      >
                        I agree to the{" "}
                        <span className="text-primary">Terms of Service</span>{" "}
                        and{" "}
                        <span className="text-primary">Privacy Policy</span>
                      </Label>
                    </div>
                    {signupErrors.terms && (
                      <p className="text-xs text-destructive">{signupErrors.terms}</p>
                    )}

                    <Button className="w-full" type="submit" disabled={isSignupLoading}>
                      {isSignupLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
