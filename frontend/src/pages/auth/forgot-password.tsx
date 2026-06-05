import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/pages/auth/auth-shell"
import { useAuthStore } from "@/stores/auth-store"

export function ForgotPasswordPage() {
  const resetPassword = useAuthStore((state) => state.resetPassword)

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter your email and we will send reset instructions."
      footer={
        <Link className="font-medium text-primary hover:underline" to="/login">
          Back to login
        </Link>
      }
    >
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault()
          const formData = new FormData(event.currentTarget)
          try {
            await resetPassword(String(formData.get("email")))
            toast.success("Password reset email sent")
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Password reset failed")
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input id="reset-email" name="email" type="email" placeholder="mia@company.com" required />
        </div>
        <Button className="w-full" type="submit">
          Send Reset Link
        </Button>
      </form>
    </AuthShell>
  )
}
