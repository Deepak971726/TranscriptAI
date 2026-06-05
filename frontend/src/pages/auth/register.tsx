import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AuthShell } from "@/pages/auth/auth-shell"
import { useAuthStore } from "@/stores/auth-store"

export function RegisterPage() {
  const navigate = useNavigate()
  const signUp = useAuthStore((state) => state.signUp)
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle)

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Start transcribing uploads and live recordings in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-medium text-primary hover:underline" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault()
          const formData = new FormData(event.currentTarget)
          const password = String(formData.get("password"))
          const confirmPassword = String(formData.get("confirmPassword"))

          if (password !== confirmPassword) {
            toast.error("Passwords do not match")
            return
          }

          try {
            const hasSession = await signUp({
              name: String(formData.get("name")),
              email: String(formData.get("email")),
              password,
            })
            toast.success(hasSession ? "Account created" : "Account created")
            navigate(hasSession ? "/dashboard" : "/login")
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Registration failed")
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" placeholder="Mia Adams" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="mia@company.com" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input id="confirm-password" name="confirmPassword" type="password" required />
          </div>
        </div>
        <Button className="w-full" type="submit">
          Register
        </Button>
      </form>
      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>
      <Button
        className="w-full"
        variant="outline"
        onClick={() => {
          void signInWithGoogle().catch((error: unknown) => {
            toast.error(error instanceof Error ? error.message : "Google sign up failed")
          })
        }}
      >
        <span className="flex size-4 items-center justify-center rounded-sm border text-[10px] font-semibold">G</span>
        Google Sign Up
      </Button>
    </AuthShell>
  )
}
