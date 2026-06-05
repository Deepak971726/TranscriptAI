import { motion } from "framer-motion"
import { ArrowRight, Loader2 } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { staggerItem } from "@/lib/motion"
import { AuthShell } from "@/pages/auth/auth-shell"
import { FloatingField } from "@/pages/auth/floating-field"
import { PasswordField } from "@/pages/auth/password-field"
import { SocialAuthButtons } from "@/pages/auth/social-auth-buttons"
import { useAuthStore } from "@/stores/auth-store"

export function LoginPage() {
  const navigate = useNavigate()
  const signIn = useAuthStore((state) => state.signIn)
  const [pending, setPending] = useState(false)

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Access transcripts, recordings, summaries, and the decisions hidden inside every conversation."
      footer={
        <>
          New to TranscribeAI?{" "}
          <Link className="font-medium text-cyan-700 hover:text-cyan-900 hover:underline" to="/register">
            Create an account
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
          setPending(true)
          try {
            await signIn(String(formData.get("email")), String(formData.get("password")))
            toast.success("Signed in")
            navigate("/dashboard")
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Sign in failed")
          } finally {
            setPending(false)
          }
        }}
      >
        <motion.div variants={staggerItem}>
          <FloatingField id="email" label="Work email" name="email" type="email" autoComplete="email" required />
        </motion.div>
        <motion.div variants={staggerItem}>
          <PasswordField
            id="password"
            name="password"
            label="Password"
            action={
              <Link className="text-xs font-medium text-cyan-700 transition-colors hover:text-cyan-900 hover:underline" to="/forgot-password">
                Forgot password
              </Link>
            }
          />
        </motion.div>
        <motion.div variants={staggerItem} className="flex items-center gap-2">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className="text-sm text-slate-500">
            Keep me signed in
          </Label>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Button
            className="auth-primary-button group relative h-12 w-full overflow-hidden bg-slate-950 text-white shadow-[0_12px_30px_rgba(8,145,178,0.20)] hover:scale-[1.01] hover:bg-slate-900 hover:shadow-[0_14px_38px_rgba(6,182,212,0.28)]"
            type="submit"
            disabled={pending}
          >
            <span className="auth-button-sheen absolute inset-y-0 -left-1/3 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)]" />
            {pending ? <Loader2 className="animate-spin text-cyan-300" /> : null}
            <span>{pending ? "Securing your workspace..." : "Sign in to workspace"}</span>
            {!pending && <ArrowRight className="transition-transform group-hover:translate-x-1" />}
          </Button>
        </motion.div>
      </motion.form>
      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1 bg-slate-200" />
        <span className="text-[10px] font-semibold uppercase text-slate-400">or continue with</span>
        <Separator className="flex-1 bg-slate-200" />
      </div>
      <SocialAuthButtons mode="signin" />
    </AuthShell>
  )
}
