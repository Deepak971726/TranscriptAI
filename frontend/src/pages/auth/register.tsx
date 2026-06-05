import { motion } from "framer-motion"
import { ArrowRight, Loader2 } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { staggerItem } from "@/lib/motion"
import { AuthShell } from "@/pages/auth/auth-shell"
import { FloatingField } from "@/pages/auth/floating-field"
import { PasswordField } from "@/pages/auth/password-field"
import { SocialAuthButtons } from "@/pages/auth/social-auth-buttons"
import { useAuthStore } from "@/stores/auth-store"

export function RegisterPage() {
  const navigate = useNavigate()
  const signUp = useAuthStore((state) => state.signUp)
  const [pending, setPending] = useState(false)

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Turn meetings, calls, and recordings into searchable intelligence from your first session."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-medium text-cyan-700 hover:text-cyan-900 hover:underline" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      <motion.form
        initial="initial"
        animate="animate"
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

          setPending(true)
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
          } finally {
            setPending(false)
          }
        }}
      >
        <motion.div variants={staggerItem}>
          <FloatingField id="name" label="Full name" name="name" autoComplete="name" required />
        </motion.div>
        <motion.div variants={staggerItem}>
          <FloatingField id="email" label="Work email" name="email" type="email" autoComplete="email" required />
        </motion.div>
        <motion.div variants={staggerItem} className="grid gap-4 sm:grid-cols-2">
          <PasswordField id="password" name="password" label="Password" autoComplete="new-password" />
          <PasswordField id="confirm-password" name="confirmPassword" label="Confirm password" autoComplete="new-password" />
        </motion.div>
        <motion.div variants={staggerItem}>
          <Button
            className="auth-primary-button group relative h-12 w-full overflow-hidden bg-slate-950 text-white shadow-[0_12px_30px_rgba(8,145,178,0.20)] hover:scale-[1.01] hover:bg-slate-900 hover:shadow-[0_14px_38px_rgba(6,182,212,0.28)]"
            type="submit"
            disabled={pending}
          >
            <span className="auth-button-sheen absolute inset-y-0 -left-1/3 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)]" />
            {pending ? <Loader2 className="animate-spin text-cyan-300" /> : null}
            <span>{pending ? "Creating secure workspace..." : "Create free workspace"}</span>
            {!pending && <ArrowRight className="transition-transform group-hover:translate-x-1" />}
          </Button>
        </motion.div>
      </motion.form>
      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1 bg-slate-200" />
        <span className="text-[10px] font-semibold uppercase text-slate-400">or continue with</span>
        <Separator className="flex-1 bg-slate-200" />
      </div>
      <SocialAuthButtons mode="signup" />
    </AuthShell>
  )
}
