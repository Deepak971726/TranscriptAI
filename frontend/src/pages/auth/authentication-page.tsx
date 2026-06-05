import { motion } from "framer-motion"
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { useState, type FormEvent, type ReactNode } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { AuthBackdrop } from "@/pages/auth/auth-shell"
import { SocialAuthButtons } from "@/pages/auth/social-auth-buttons"
import { useAuthStore } from "@/stores/auth-store"
import { cn } from "@/lib/utils"

const formVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.16,
      staggerChildren: 0.07,
    },
  },
}

const fieldVariants = {
  hidden: { opacity: 0, y: 14, filter: "blur(5px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const },
  },
}

type AuthInputProps = {
  id: string
  name: string
  label: string
  placeholder: string
  type?: string
  autoComplete?: string
  icon: ReactNode
}

type AuthPasswordInputProps = Omit<AuthInputProps, "type" | "icon">

function AuthInput({
  id,
  name,
  label,
  placeholder,
  type = "text",
  autoComplete,
  icon,
}: AuthInputProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="auth-reference-label mb-2 block text-sm font-medium">{label}</span>
      <span className="auth-reference-input-shell group relative block">
        <span className="auth-reference-input-icon pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2">
          {icon}
        </span>
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          className="auth-reference-input h-13 w-full rounded-md border px-11 py-3 text-sm outline-none transition-[border-color,box-shadow,background-color,transform] duration-200"
        />
      </span>
    </label>
  )
}

function AuthPasswordInput({
  id,
  name,
  label,
  placeholder,
  autoComplete,
}: AuthPasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label className="auth-reference-label mb-2 block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <div className="auth-reference-input-shell group relative">
        <LockKeyhole className="auth-reference-input-icon pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2" />
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          className="auth-reference-input h-13 w-full rounded-md border px-11 py-3 pr-12 text-sm outline-none transition-[border-color,box-shadow,background-color,transform] duration-200"
        />
        <button
          type="button"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="auth-reference-icon-button absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md transition-colors"
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  )
}

function FormHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div>
      <p className="auth-reference-eyebrow text-sm">{eyebrow}</p>
      <motion.h2
        initial={{ opacity: 0, letterSpacing: "0.04em" }}
        animate={{ opacity: 1, letterSpacing: "0em" }}
        transition={{ duration: 0.6, delay: 0.08 }}
        className="auth-reference-heading mt-2 flex items-center gap-2 text-3xl font-semibold sm:text-4xl"
      >
        <motion.span
          className="h-px w-4 origin-left bg-cyan-400"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        />
        {title}
      </motion.h2>
      <p className="auth-reference-copy mt-3 text-sm leading-6">{description}</p>
    </div>
  )
}

function AuthSignal() {
  return (
    <div aria-hidden className="auth-reference-signal absolute right-5 top-5 flex h-8 items-center gap-1">
      {[12, 20, 28, 18, 24, 14].map((height, index) => (
        <motion.span
          key={`${height}-${index}`}
          className="w-0.5 rounded-full bg-cyan-400"
          style={{ height }}
          animate={{ scaleY: [0.35, 1, 0.5, 0.85, 0.35], opacity: [0.3, 0.9, 0.45, 0.75, 0.3] }}
          transition={{ duration: 1.5 + index * 0.08, delay: index * 0.1, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  )
}

function SecureNote() {
  return (
    <div className="auth-reference-secure auth-reference-copy mt-5 flex items-center justify-center gap-2 text-xs">
      <ShieldCheck className="size-4 text-cyan-500" />
      Secure and encrypted
    </div>
  )
}

function AuthDivider() {
  return (
    <div className="auth-reference-divider-wrap my-5 flex items-center gap-3">
      <span className="auth-reference-divider h-px flex-1" />
      <span className="auth-reference-copy whitespace-nowrap text-[11px] font-medium uppercase">or continue with</span>
      <span className="auth-reference-divider h-px flex-1" />
    </div>
  )
}

export function AuthenticationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const signIn = useAuthStore((state) => state.signIn)
  const signUp = useAuthStore((state) => state.signUp)
  const [loginPending, setLoginPending] = useState(false)
  const [registerPending, setRegisterPending] = useState(false)
  const activeMode = location.pathname === "/register" ? "register" : "login"

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setLoginPending(true)
    try {
      await signIn(String(formData.get("email")), String(formData.get("password")))
      toast.success("Signed in")
      navigate("/dashboard")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed")
    } finally {
      setLoginPending(false)
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const password = String(formData.get("password"))
    const confirmPassword = String(formData.get("confirmPassword"))

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setRegisterPending(true)
    try {
      const hasSession = await signUp({
        name: String(formData.get("name")),
        email: String(formData.get("email")),
        password,
      })
      toast.success("Account created")
      navigate(hasSession ? "/dashboard" : "/login")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed")
    } finally {
      setRegisterPending(false)
    }
  }

  return (
    <AuthBackdrop>
      <main
        className={cn(
          "auth-reference-main relative z-10 flex min-h-screen items-center justify-center px-4 pb-10 pt-24 sm:px-6 lg:pb-8 lg:pt-20",
          activeMode === "login" && "auth-reference-login-main",
          activeMode === "register" && "auth-reference-register-main",
        )}
      >
        <h1 className="sr-only">
          {activeMode === "login" ? "Sign in to TranscribeAI" : "Create your TranscribeAI account"}
        </h1>
        <motion.section
          key={activeMode}
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "auth-reference-panel auth-reference-single-panel relative w-full overflow-hidden rounded-lg",
            activeMode === "login"
              ? "auth-reference-login-panel max-w-[30rem]"
              : "auth-reference-register-panel max-w-[34rem]",
          )}
          whileHover={{ scale: 1.002 }}
        >
          <div aria-hidden className="auth-reference-border-flow absolute inset-0 rounded-[inherit]" />
          <div aria-hidden className="auth-reference-sweep absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-18deg]" />
          <motion.div
            aria-hidden
            className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
            animate={{ opacity: [0.35, 1, 0.35], scaleX: [0.7, 1, 0.7] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <AuthSignal />

          {activeMode === "login" ? (
            <motion.div
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="auth-reference-column auth-reference-column-login p-6 sm:p-8"
            >
              <motion.div
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                className="auth-reference-kicker mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase"
              >
                <motion.span
                  className="size-1.5 rounded-full bg-cyan-400"
                  animate={{ opacity: [0.35, 1, 0.35], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
                AI transcription workspace
              </motion.div>
              <FormHeading
                eyebrow="Welcome back"
                title="Sign In"
                description="Sign in to continue your conversations."
              />
              <motion.form
                variants={formVariants}
                initial="hidden"
                animate="visible"
                className="auth-reference-login-form mt-8 space-y-4"
                onSubmit={handleLogin}
              >
                <motion.div variants={fieldVariants}>
                  <AuthInput
                    id="login-email"
                    name="email"
                    label="Work email"
                    placeholder="you@company.com"
                    type="email"
                    autoComplete="email"
                    icon={<Mail className="size-4" />}
                  />
                </motion.div>
                <motion.div variants={fieldVariants}>
                  <AuthPasswordInput
                    id="login-password"
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </motion.div>
                <motion.div variants={fieldVariants} className="flex justify-end">
                  <Link className="text-sm font-medium text-cyan-500 transition-colors hover:text-cyan-400" to="/forgot-password">
                    Forgot password?
                  </Link>
                </motion.div>
                <motion.div variants={fieldVariants}>
                  <Button className="auth-reference-submit group relative h-12 w-full overflow-hidden" type="submit" disabled={loginPending}>
                    <span aria-hidden className="auth-reference-submit-shine absolute inset-y-0 -left-1/3 w-1/3" />
                    {loginPending && <Loader2 className="animate-spin" />}
                    {loginPending ? "Signing in..." : "Sign In"}
                    {!loginPending && <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />}
                  </Button>
                </motion.div>
              </motion.form>
              <AuthDivider />
              <div className="auth-reference-social-group">
                <SocialAuthButtons mode="signin" />
              </div>
              <SecureNote />
              <p className="auth-reference-footer auth-reference-copy mt-5 text-center text-sm">
                New to TranscribeAI?{" "}
                <Link className="font-semibold text-cyan-500 hover:text-cyan-400" to="/register">
                  Create an account
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="auth-reference-column auth-reference-column-register p-6 sm:p-8"
            >
              <motion.div
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                className="auth-reference-kicker mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase"
              >
                <motion.span
                  className="size-1.5 rounded-full bg-cyan-400"
                  animate={{ opacity: [0.35, 1, 0.35], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
                Start transcribing free
              </motion.div>
              <FormHeading
                eyebrow="Create account"
                title="Sign Up"
                description="Get started with your AI workspace."
              />
              <motion.form
                variants={formVariants}
                initial="hidden"
                animate="visible"
                className="mt-8 space-y-4"
                onSubmit={handleRegister}
              >
                <motion.div variants={fieldVariants}>
                  <AuthInput
                    id="register-name"
                    name="name"
                    label="Full name"
                    placeholder="Your full name"
                    autoComplete="name"
                    icon={<UserRound className="size-4" />}
                  />
                </motion.div>
                <motion.div variants={fieldVariants}>
                  <AuthInput
                    id="register-email"
                    name="email"
                    label="Work email"
                    placeholder="you@company.com"
                    type="email"
                    autoComplete="email"
                    icon={<Mail className="size-4" />}
                  />
                </motion.div>
                <motion.div variants={fieldVariants}>
                  <AuthPasswordInput
                    id="register-password"
                    name="password"
                    label="Password"
                    placeholder="Create a password"
                    autoComplete="new-password"
                  />
                </motion.div>
                <motion.div variants={fieldVariants}>
                  <AuthPasswordInput
                    id="register-confirm-password"
                    name="confirmPassword"
                    label="Confirm password"
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                  />
                </motion.div>
                <motion.div variants={fieldVariants}>
                  <Button className="auth-reference-submit group relative h-12 w-full overflow-hidden" type="submit" disabled={registerPending}>
                    <span aria-hidden className="auth-reference-submit-shine absolute inset-y-0 -left-1/3 w-1/3" />
                    {registerPending && <Loader2 className="animate-spin" />}
                    {registerPending ? "Creating account..." : "Create account"}
                    {!registerPending && <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />}
                  </Button>
                </motion.div>
              </motion.form>
              <AuthDivider />
              <div className="auth-reference-social-group">
                <SocialAuthButtons mode="signup" />
              </div>
              <SecureNote />
              <p className="auth-reference-footer auth-reference-copy mt-5 text-center text-sm">
                Already have an account?{" "}
                <Link className="font-semibold text-cyan-500 hover:text-cyan-400" to="/login">
                  Sign in
                </Link>
              </p>
            </motion.div>
          )}
        </motion.section>
      </main>
    </AuthBackdrop>
  )
}
