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
        <Link className="font-medium text-cyan-700 hover:text-cyan-900 hover:underline" to="/login">
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
          className="auth-primary-button group relative h-12 w-full overflow-hidden bg-slate-950 text-white shadow-[0_12px_30px_rgba(8,145,178,0.20)] hover:scale-[1.01] hover:bg-slate-900"
          type="submit"
          disabled={pending}
        >
          <span className="auth-button-sheen absolute inset-y-0 -left-1/3 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)]" />
          {pending ? <Loader2 className="animate-spin text-cyan-300" /> : <MailCheck />}
          {pending ? "Preparing secure link..." : "Send reset link"}
          {!pending && <ArrowRight className="transition-transform group-hover:translate-x-1" />}
        </Button>
      </motion.form>
    </AuthShell>
  )
}
