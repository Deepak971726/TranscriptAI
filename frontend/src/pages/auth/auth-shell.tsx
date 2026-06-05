import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion"
import {
  AudioLines,
  BrainCircuit,
  Check,
  Languages,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react"
import type { MouseEvent, ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { AppLogo } from "@/components/common/app-logo"
import { ThemeToggle } from "@/components/common/theme-toggle"
import { WaveformVisualizer } from "@/components/common/waveform-visualizer"
import { cn } from "@/lib/utils"

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

const trustFeatures = [
  { label: "99.8% Accuracy", icon: ShieldCheck },
  { label: "100+ Languages", icon: Languages },
  { label: "Speaker Identification", icon: UsersRound },
  { label: "AI Summaries", icon: BrainCircuit },
]

const conversation = [
  ["Speaker 1", "The activation rate improved after the onboarding update."],
  ["Speaker 2", "Create a summary and share the key moments with product."],
  ["AI Insight", "3 decisions identified. 2 follow-up actions created."],
] as const

const neuralNodes = [
  { left: "10%", top: "17%", delay: 0.1 },
  { left: "27%", top: "34%", delay: 0.6 },
  { left: "47%", top: "13%", delay: 1.1 },
  { left: "66%", top: "31%", delay: 0.3 },
  { left: "84%", top: "15%", delay: 1.4 },
  { left: "18%", top: "72%", delay: 1.8 },
  { left: "42%", top: "58%", delay: 0.8 },
  { left: "72%", top: "68%", delay: 1.2 },
  { left: "90%", top: "52%", delay: 0.4 },
]

function NeuralBackground() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div className="auth-grid absolute inset-0" />
      <div className="auth-aurora absolute -left-1/4 -top-1/4 size-[70%]" />
      <div className="auth-aurora auth-aurora-secondary absolute -bottom-1/3 right-[-15%] size-[72%]" />
      <svg className="absolute inset-0 size-full opacity-50" viewBox="0 0 1000 800" preserveAspectRatio="none">
        <defs>
          <linearGradient id="network-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(45 212 191)" stopOpacity="0" />
            <stop offset="45%" stopColor="rgb(34 211 238)" stopOpacity=".6" />
            <stop offset="100%" stopColor="rgb(45 212 191)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[
          "M80 145 C250 220 310 70 470 125 S720 285 910 120",
          "M110 590 C260 480 390 650 540 475 S760 420 940 570",
          "M185 270 C340 370 485 265 650 355 S800 535 920 415",
          "M110 420 C270 330 350 515 500 410 S710 215 895 300",
        ].map((path, index) => (
          <motion.path
            key={path}
            d={path}
            fill="none"
            stroke="url(#network-line)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1], opacity: [0, 0.65, 0.2] }}
            transition={{ duration: 4.5, delay: index * 0.55, repeat: Infinity, repeatDelay: 1.2 }}
          />
        ))}
      </svg>
      {neuralNodes.map((node, index) => (
        <motion.span
          key={`${node.left}-${node.top}`}
          className="absolute size-1.5 rounded-full border border-cyan-200/60 bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.9)]"
          style={{ left: node.left, top: node.top }}
          animate={{ opacity: [0.2, 1, 0.25], scale: [0.8, 1.45, 0.8] }}
          transition={{ duration: 2.8 + (index % 3) * 0.5, delay: node.delay, repeat: Infinity }}
        />
      ))}
      {Array.from({ length: 13 }).map((_, index) => (
        <motion.span
          key={index}
          className="absolute size-1 rounded-full bg-white/60 shadow-[0_0_10px_rgba(103,232,249,0.75)]"
          style={{ left: `${7 + ((index * 23) % 88)}%`, top: `${9 + ((index * 31) % 82)}%` }}
          animate={{ y: [0, -18, 0], x: [0, index % 2 ? 8 : -8, 0], opacity: [0.15, 0.8, 0.15] }}
          transition={{ duration: 5 + (index % 4), delay: index * 0.31, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,18,0.05),rgba(3,7,18,0.18))]" />
    </div>
  )
}

function ProductPreview({ x, y }: { x: ReturnType<typeof useSpring>; y: ReturnType<typeof useSpring> }) {
  return (
    <motion.div
      style={{ x, y }}
      animate={{ translateY: [0, -7, 0] }}
      transition={{ translateY: { duration: 5.5, repeat: Infinity, ease: "easeInOut" } }}
      className="auth-preview relative mx-auto w-full max-w-2xl overflow-hidden rounded-lg border border-white/10 bg-slate-950/55 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.45),0_0_60px_rgba(8,145,178,0.08)] backdrop-blur-2xl"
    >
      <div className="absolute inset-x-16 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(103,232,249,.9),transparent)]" />
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <motion.span
            animate={{ boxShadow: ["0 0 0 rgba(34,211,238,0)", "0 0 28px rgba(34,211,238,.34)", "0 0 0 rgba(34,211,238,0)"] }}
            transition={{ duration: 2.4, repeat: Infinity }}
            className="flex size-10 shrink-0 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"
          >
            <AudioLines className="size-5" />
          </motion.span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">Product strategy sync</p>
            <p className="mt-0.5 text-xs text-slate-400">Live intelligence pipeline</p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/8 px-2.5 py-1 text-[10px] font-semibold uppercase text-emerald-200">
          <motion.span
            className="size-1.5 rounded-full bg-emerald-300"
            animate={{ opacity: [0.35, 1, 0.35], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          Listening
        </span>
      </div>

      <WaveformVisualizer active bars={58} className="my-3 h-14 border border-cyan-300/10 bg-cyan-950/15 px-3" />

      <div className="space-y-2.5">
        {conversation.map(([speaker, text], index) => (
          <motion.div
            key={speaker}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.75 + index * 0.65, duration: 0.45 }}
            className={cn(
              "auth-conversation-row grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md border px-3 py-2.5",
              speaker === "AI Insight"
                ? "border-cyan-300/15 bg-cyan-300/[0.07]"
                : "border-white/[0.07] bg-white/[0.035]",
            )}
          >
            <span
              className={cn(
                "mt-0.5 whitespace-nowrap text-[10px] font-semibold uppercase",
                speaker === "AI Insight" ? "text-cyan-200" : "text-teal-300",
              )}
            >
              {speaker}
            </span>
            <span className="auth-typing-line overflow-hidden whitespace-nowrap text-xs leading-5 text-slate-300 sm:text-[13px]" style={{ animationDelay: `${1 + index * 0.75}s` }}>
              {text}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="auth-preview-footer mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Check className="size-3.5 text-cyan-300" />
          Summary generated
        </span>
        <span className="flex items-center gap-1.5">
          <MessageSquareText className="size-3.5 text-teal-300" />
          3 action items
        </span>
        <span>00:18:42</span>
      </div>
    </motion.div>
  )
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const springX = useSpring(pointerX, { stiffness: 45, damping: 20 })
  const springY = useSpring(pointerY, { stiffness: 45, damping: 20 })
  const previewX = useTransform(springX, [-0.5, 0.5], reduceMotion ? [0, 0] : [-9, 9])
  const previewY = useTransform(springY, [-0.5, 0.5], reduceMotion ? [0, 0] : [-7, 7])
  const glowX = useTransform(springX, [-0.5, 0.5], reduceMotion ? [0, 0] : [-30, 30])
  const glowY = useTransform(springY, [-0.5, 0.5], reduceMotion ? [0, 0] : [-24, 24])
  const authRoute = location.pathname === "/register" ? "register" : location.pathname === "/login" ? "login" : "reset"

  function handlePointerMove(event: MouseEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5)
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="auth-page relative min-h-screen overflow-hidden bg-white"
    >
      <header className="absolute inset-x-0 top-0 z-30 flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <AppLogo className="text-white [&_span:first-child]:bg-white/10 [&_span:first-child]:text-cyan-100 [&_span:first-child]:ring-1 [&_span:first-child]:ring-white/15" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            className="rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/8 hover:text-white lg:text-slate-500 lg:hover:bg-slate-100 lg:hover:text-slate-900"
            to="/"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(30rem,0.92fr)]">
        <section
          onMouseMove={handlePointerMove}
          onMouseLeave={() => {
            pointerX.set(0)
            pointerY.set(0)
          }}
          className="relative flex min-h-[31rem] overflow-hidden bg-[#030811] px-5 pb-8 pt-24 text-white sm:px-8 lg:min-h-screen lg:px-10 lg:pb-10 xl:px-16"
        >
          <NeuralBackground />
          <motion.div
            aria-hidden
            style={{ x: glowX, y: glowY }}
            className="absolute left-[38%] top-[38%] h-60 w-72 rounded-full bg-cyan-400/[0.08] blur-[90px]"
          />

          <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col justify-center lg:justify-between">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="auth-hero max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase text-cyan-100 backdrop-blur-xl">
                <Sparkles className="size-3.5 text-cyan-300" />
                Conversation intelligence platform
              </div>
              <h2 className="mt-5 max-w-2xl text-balance text-[2rem] font-semibold leading-[1.08] text-white sm:text-4xl lg:text-[2.65rem] xl:text-[3.35rem]">
                Transform Conversations Into{" "}
                <span className="auth-gradient-text">Actionable Intelligence</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
                AI-powered transcription, speaker recognition, summaries, and insights in one workspace.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.35 }}
              className="auth-trust-grid mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:mt-5"
            >
              {trustFeatures.map(({ label, icon: Icon }, index) => (
                <motion.div
                  key={label}
                  whileHover={reduceMotion ? undefined : { y: -3, borderColor: "rgba(103,232,249,.25)" }}
                  className="rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-3 backdrop-blur-xl"
                >
                  <Icon className={cn("size-4", index % 2 ? "text-teal-300" : "text-cyan-300")} />
                  <p className="mt-2 text-[11px] font-medium leading-4 text-slate-200">{label}</p>
                </motion.div>
              ))}
            </motion.div>

            <div className="auth-preview-wrap mt-6 hidden lg:block">
              <ProductPreview x={previewX} y={previewY} />
            </div>
          </div>
        </section>

        <section
          className={cn(
            "relative flex items-center justify-center overflow-hidden bg-[#f7fafc] px-4 py-16 sm:px-8 lg:min-h-screen lg:px-10 lg:py-20 xl:px-14",
            authRoute === "register" ? "min-h-[50rem]" : "min-h-[43rem]",
          )}
        >
          <div className="absolute inset-0 auth-light-grid opacity-50" />
          <div className="absolute -right-24 top-1/4 size-72 rounded-full bg-cyan-300/10 blur-[100px]" />
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.58, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[29rem]"
          >
            <div className="auth-login-panel relative overflow-hidden rounded-lg border border-white/90 bg-white/72 p-5 shadow-[0_32px_90px_rgba(15,23,42,0.13),0_2px_10px_rgba(15,23,42,0.05)] backdrop-blur-2xl sm:p-7">
              <div className="absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(6,182,212,.65),transparent)]" />
              {authRoute !== "reset" && (
                <nav aria-label="Authentication" className="relative mb-7 grid grid-cols-2 rounded-md bg-slate-100/90 p-1">
                  <motion.span
                    layoutId="auth-active-tab"
                    className={cn(
                      "absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-[5px] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.08)]",
                      authRoute === "register" ? "left-[50%]" : "left-1",
                    )}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                  <Link
                    className={cn(
                      "relative z-10 flex h-9 items-center justify-center text-xs font-semibold transition-colors",
                      authRoute === "login" ? "text-slate-950" : "text-slate-500 hover:text-slate-800",
                    )}
                    to="/login"
                  >
                    Sign In
                  </Link>
                  <Link
                    className={cn(
                      "relative z-10 flex h-9 items-center justify-center text-xs font-semibold transition-colors",
                      authRoute === "register" ? "text-slate-950" : "text-slate-500 hover:text-slate-800",
                    )}
                    to="/register"
                  >
                    Sign Up
                  </Link>
                </nav>
              )}

              <div className="mb-7">
                <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase text-cyan-700">
                  <span className="h-px w-5 bg-cyan-500/60" />
                  Secure AI workspace
                </div>
                <h1 className="text-2xl font-semibold leading-tight text-slate-950 sm:text-[1.8rem]">{title}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
              </div>

              {children}
              <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <LockKeyhole className="size-3.5 text-cyan-600" />
                Encrypted sessions
              </span>
              <span className="h-3 w-px bg-slate-300" />
              <span>SOC 2 ready</span>
            </div>
          </motion.div>
        </section>
      </main>
    </motion.div>
  )
}
