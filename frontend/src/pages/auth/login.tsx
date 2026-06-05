import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AuthShell } from "@/pages/auth/auth-shell"
import { useAuthStore } from "@/stores/auth-store"

export function LoginPage() {
  const navigate = useNavigate()
  const signIn = useAuthStore((state) => state.signIn)
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle)

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your transcription workspace."
      footer={
        <>
          New to TranscribeAI?{" "}
          <Link className="font-medium text-primary hover:underline" to="/register">
            Create an account
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault()
          const formData = new FormData(event.currentTarget)
          try {
            await signIn(String(formData.get("email")), String(formData.get("password")))
            toast.success("Signed in")
            navigate("/dashboard")
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Sign in failed")
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="mia@company.com" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link className="text-xs font-medium text-primary hover:underline" to="/forgot-password">
              Forgot Password
            </Link>
          </div>
          <Input id="password" name="password" type="password" required />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className="text-sm text-muted-foreground">
            Remember Me
          </Label>
        </div>
        <Button className="w-full" type="submit">
          Login
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
            toast.error(error instanceof Error ? error.message : "Google sign in failed")
          })
        }}
      >
        <span className="flex size-4 items-center justify-center rounded-sm border text-[10px] font-semibold">G</span>
        Google Sign In
      </Button>
    </AuthShell>
  )
}
