import type { PropsWithChildren } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/stores/auth-store"

export function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation()
  const { loading, session } = useAuthStore()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/25 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="space-y-3 p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-4/5" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
