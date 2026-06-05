import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AnimatePresence } from "framer-motion"
import { useEffect, type ReactNode } from "react"
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom"
import { Toaster } from "sonner"
import { ProtectedRoute } from "@/components/common/protected-route"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/hooks/use-theme"
import { supabase } from "@/lib/supabase"
import { DashboardLayout } from "@/layouts/dashboard-layout"
import { ForgotPasswordPage } from "@/pages/auth/forgot-password"
import { LoginPage } from "@/pages/auth/login"
import { RegisterPage } from "@/pages/auth/register"
import { DashboardPage } from "@/pages/dashboard/dashboard"
import { ExportsPage } from "@/pages/dashboard/exports"
import { LiveRecordingPage } from "@/pages/dashboard/live-recording"
import { SettingsPage } from "@/pages/dashboard/settings"
import { TranscriptDetailPage } from "@/pages/dashboard/transcript-detail"
import { TranscriptsPage } from "@/pages/dashboard/transcripts"
import { UploadAudioPage } from "@/pages/dashboard/upload-audio"
import { LandingPage } from "@/pages/landing"
import { useAuthStore } from "@/stores/auth-store"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadAudioPage />} />
          <Route path="/record" element={<LiveRecordingPage />} />
          <Route path="/transcripts" element={<TranscriptsPage />} />
          <Route path="/transcripts/:id" element={<TranscriptDetailPage />} />
          <Route path="/exports" element={<ExportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

function AuthBootstrap({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((state) => state.setSession)
  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    let mounted = true
    setLoading(true)

    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [setLoading, setSession])

  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={150}>
          <AuthBootstrap>
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </AuthBootstrap>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
