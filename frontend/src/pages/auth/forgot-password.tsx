import { ArrowRight, Loader2, MailCheck } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { AuthShell } from "@/pages/auth/auth-shell"
import { FloatingField } from "@/pages/auth/floating-field"
import { useAuthStore } from "@/stores/auth-store"

export function ForgotPasswordPage() {
  const resetPassword = useAuthStore((state) => state.resetPassword)
  const [pending, setPending] = useState(false)

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter your account email and we will send a secure recovery link."
      footer={
        <Link className="font-semibold text-cyan-500 transition-colors hover:text-cyan-400" to="/login">
          Back to login
        </Link>
      }
    >
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault()
          const formData = new FormData(event.currentTarget)
          setPending(true)
          try {
            await resetPassword(String(formData.get("email")))
            toast.success("Password reset email sent")
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Password reset failed")
          } finally {
            setPending(false)
          }
        }}
      >
        <FloatingField id="reset-email" label="Work email" name="email" type="email" autoComplete="email" required />
        <Button
          className="auth-reference-submit group h-12 w-full"
          type="submit"
          disabled={pending}
        >
          {pending ? <Loader2 className="animate-spin" /> : <MailCheck />}
          {pending ? "Preparing secure link..." : "Send reset link"}
          {!pending && <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />}
        </Button>
      </motion.form>
    </AuthShell>
  )
}
