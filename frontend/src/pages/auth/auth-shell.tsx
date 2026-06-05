import { motion } from "framer-motion"
import { LockKeyhole, ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { AppLogo } from "@/components/common/app-logo"
import { ThemeToggle } from "@/components/common/theme-toggle"

type AuthBackdropProps = {
  children: ReactNode
}

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

const particles = [
  ["8%", "18%", 0.7],
  ["15%", "74%", 1.4],
  ["27%", "12%", 2.1],
  ["39%", "84%", 0.2],
  ["54%", "9%", 1.8],
  ["68%", "78%", 0.9],
  ["82%", "21%", 2.5],
  ["91%", "65%", 1.1],
] as const

export function AuthBackdrop({ children }: AuthBackdropProps) {
  return (
    <div className="auth-reference-page relative min-h-screen overflow-hidden">
      <div aria-hidden className="absolute inset-0">
        <div className="auth-reference-grid absolute inset-0" />
        <div className="auth-reference-glow absolute left-[27%] top-[18%] size-96 rounded-full" />
        <div className="auth-reference-glow auth-reference-glow-secondary absolute bottom-[-12rem] right-[12%] size-[32rem] rounded-full" />
        <svg className="absolute inset-0 size-full opacity-45" viewBox="0 0 1440 900" preserveAspectRatio="none">
          <motion.path
            d="M-80 610 C170 530 280 790 530 700 S840 490 1050 610 S1320 760 1510 610"
            fill="none"
            stroke="currentColor"
            className="text-cyan-500/15"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.2, ease: "easeOut" }}
          />
          <motion.path
            d="M-40 180 C210 310 350 90 590 200 S960 330 1190 180 S1410 120 1510 210"
            fill="none"
            stroke="currentColor"
            className="text-teal-500/10"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.6, delay: 0.25, ease: "easeOut" }}
          />
        </svg>
        {particles.map(([left, top, delay], index) => (
          <motion.span
            key={`${left}-${top}`}
            className="absolute size-1.5 rounded-full bg-cyan-500/60 shadow-[0_0_16px_rgba(34,211,238,.45)] dark:bg-cyan-200/70"
            style={{ left, top }}
            animate={{ opacity: [0.18, 0.9, 0.18], scale: [0.8, 1.3, 0.8], y: [0, -8, 0] }}
            transition={{ duration: 3.5 + (index % 3), delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      <header className="absolute inset-x-0 top-0 z-30 flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <AppLogo className="auth-reference-logo" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link className="auth-reference-home rounded-md px-3 py-2 text-sm font-medium transition-colors" to="/">
            Home
          </Link>
        </div>
      </header>

      {children}
    </div>
  )
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <AuthBackdrop>
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-24">
        <motion.section
          initial={{ opacity: 0, y: 20, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="auth-reference-panel w-full max-w-md rounded-lg p-6 sm:p-8"
        >
          <div className="mb-7">
            <p className="auth-reference-eyebrow">Account recovery</p>
            <h1 className="auth-reference-heading mt-2 text-3xl font-semibold">{title}</h1>
            <p className="auth-reference-copy mt-3 text-sm leading-6">{subtitle}</p>
          </div>
          {children}
          <div className="auth-reference-copy mt-6 text-center text-sm">{footer}</div>
          <div className="auth-reference-copy mt-7 flex items-center justify-center gap-4 border-t pt-5 text-xs">
            <span className="flex items-center gap-1.5">
              <LockKeyhole className="size-3.5 text-cyan-500" />
              Encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-cyan-500" />
              Secure session
            </span>
          </div>
        </motion.section>
      </main>
    </AuthBackdrop>
  )
}
