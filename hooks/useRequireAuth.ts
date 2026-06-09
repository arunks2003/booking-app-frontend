"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

/**
 * Call this at the top of any protected page.
 * If the user is not authenticated, redirects to the login page.
 * Returns the auth context for convenience.
 */
export function useRequireAuth() {
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      router.replace("/")
    }
  }, [auth.isLoading, auth.user, router])

  return auth
}
