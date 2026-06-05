import { motion } from "framer-motion"
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileAudio,
  Gauge,
  Globe2,
  Mic2,
  Play,
  Quote,
  UploadCloud,
} from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { AppLogo } from "@/components/common/app-logo"
import { PageTransition } from "@/components/common/page-transition"
import { ThemeToggle } from "@/components/common/theme-toggle"
import { WaveformVisualizer } from "@/components/common/waveform-visualizer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const trustedLogos = ["NOVA", "LUMA", "ATLAS", "FUSE", "KIN"]

const features = [
  { title: "Upload Audio Files", description: "Process production recordings with clear status, validation, and progress.", icon: UploadCloud },
  { title: "Real-Time Recording", description: "Capture live speech and watch transcript segments appear as the session runs.", icon: Mic2 },
  { title: "Multi-Language Support", description: "Handle global calls, interviews, lessons, and support notes in one workspace.", icon: Globe2 },
  { title: "Export to PDF, TXT, DOCX", description: "Ship clean outputs for teams, clients, and documentation workflows.", icon: Download },
  { title: "Fast AI Processing", description: "Move from audio to searchable text without long manual review cycles.", icon: Gauge },
  { title: "Transcript History", description: "Keep every transcript, export, and recording organized by workspace.", icon: FileAudio },
]

const faqs = [
  ["Which formats are supported?", "TranscribeAI supports MP3, WAV, WEBM, M4A, and AAC files in the upload flow."],
  ["Can I edit transcripts?", "Yes. The transcript detail page includes a full editor with timestamps, speaker labels, search, copy, and save controls."],
  ["Does it support live recording?", "The live recording workspace includes recording states, a waveform, audio meter, timer, and live transcript panel."],
  ["Can I export transcripts?", "You can export transcripts as PDF, TXT, or DOCX and review export history from the dashboard."],
]

function AnimatedMic() {
  return (
    <div className="relative mx-auto flex h-72 w-full max-w-4xl items-center justify-center overflow-hidden rounded-lg border bg-background/60 p-6 shadow-2xl shadow-foreground/10 glass-panel">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,oklch(0.68_0.16_185_/_0.16),transparent)]" />
      <motion.div
        className="absolute left-8 top-8 rounded-lg border bg-card/85 px-3 py-2 text-xs text-muted-foreground shadow-sm"
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
      >
        98% confidence
      </motion.div>
      <motion.div
        className="absolute bottom-8 right-8 rounded-lg border bg-card/85 px-3 py-2 text-xs text-muted-foreground shadow-sm"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 4.5 }}
      >
        24 languages
      </motion.div>
      <div className="absolute inset-x-8 bottom-0 translate-y-1/2 opacity-80">
        <WaveformVisualizer active bars={72} className="h-28 bg-transparent" />
      </div>
      <div className="relative flex size-32 items-center justify-center rounded-full bg-primary/10">
        <span className="absolute inset-0 rounded-full border border-primary/30" style={{ animation: "pulse-ring 1.8s ease-out infinite" }} />
        <span className="flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl">
          <Mic2 className="size-9" />
        </span>
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <header className="fixed inset-x-0 top-0 z-40 border-b bg-background/75 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
            <AppLogo />
            <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
              <a href="#features" className="hover:text-foreground">Features</a>
              <a href="#how" className="hover:text-foreground">How it works</a>
              <a href="#faq" className="hover:text-foreground">FAQ</a>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Start Free</Link>
              </Button>
            </div>
          </div>
        </header>

        <main>
          <section className="relative overflow-hidden border-b pt-28">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.68_0.16_185_/_0.13),transparent_42%)]" />
            <div className="absolute inset-x-0 top-24 flex justify-center opacity-50">
              <div className="h-px w-[78rem] bg-[linear-gradient(90deg,transparent,oklch(0.68_0.16_185),oklch(0.78_0.15_84),transparent)]" />
            </div>
            <div className="relative mx-auto max-w-7xl px-4 pb-14 text-center lg:px-6">
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <Badge variant="secondary" className="mb-5">AI-powered speech-to-text</Badge>
                <h1 className="mx-auto max-w-4xl text-balance text-5xl font-semibold leading-[1.05] md:text-7xl">
                  Convert Speech Into Accurate Text Instantly
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                  Upload audio, record live conversations, and turn speech into editable transcripts with fast AI processing, speaker labels, and export-ready outputs.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button asChild size="lg" variant="gradient">
                    <Link to="/register">
                      Start Free
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => toast.success("Demo preview queued")}>
                    <Play className="size-4" />
                    Watch Demo
                  </Button>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.5 }} className="mt-12">
                <AnimatedMic />
              </motion.div>
            </div>
          </section>

          <section className="border-b bg-muted/30 py-8">
            <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-5 lg:px-6">
              {trustedLogos.map((logo) => (
                <div key={logo} className="flex h-14 items-center justify-center rounded-lg border bg-background/70 font-semibold text-muted-foreground">
                  {logo}
                </div>
              ))}
            </div>
          </section>

          <section id="features" className="py-20">
            <div className="mx-auto max-w-7xl px-4 lg:px-6">
              <div className="max-w-2xl">
                <Badge variant="outline">Features</Badge>
                <h2 className="mt-4 text-3xl font-semibold md:text-4xl">Everything needed for transcription workflows</h2>
                <p className="mt-3 text-muted-foreground">A polished workspace for uploads, recording, editing, history, and exports.</p>
              </div>
              <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ delay: index * 0.04 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card className="h-full">
                      <CardContent className="p-5">
                        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <feature.icon className="size-5" />
                        </span>
                        <h3 className="mt-5 font-semibold">{feature.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section id="how" className="border-y bg-muted/30 py-20">
            <div className="mx-auto max-w-7xl px-4 lg:px-6">
              <div className="grid gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-center">
                <div>
                  <Badge variant="outline">How It Works</Badge>
                  <h2 className="mt-4 text-3xl font-semibold md:text-4xl">From audio to transcript in three steps</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    ["1", "Upload Audio", "Drop a file or browse from your device."],
                    ["2", "AI Processing", "Track upload and processing status."],
                    ["3", "Get Transcript", "Edit, copy, and export the final text."],
                  ].map(([step, title, description]) => (
                    <Card key={step}>
                      <CardContent className="p-5">
                        <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">{step}</span>
                        <h3 className="mt-5 font-semibold">{title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="py-20">
            <div className="mx-auto max-w-7xl px-4 lg:px-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["The upload flow feels like a production tool, not a demo.", "Rhea Patel, Ops Lead"],
                  ["Live transcription gives our team immediate notes after every research call.", "Jon Lee, Product Director"],
                  ["Exports and speaker labels removed hours from our weekly documentation work.", "Amara Singh, Support Manager"],
                ].map(([quote, author]) => (
                  <Card key={author}>
                    <CardContent className="p-5">
                      <Quote className="size-5 text-primary" />
                      <p className="mt-4 leading-7">{quote}</p>
                      <p className="mt-5 text-sm text-muted-foreground">{author}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section id="faq" className="border-y bg-muted/30 py-20">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[0.7fr_1fr] lg:px-6">
              <div>
                <Badge variant="outline">FAQ</Badge>
                <h2 className="mt-4 text-3xl font-semibold md:text-4xl">Common questions</h2>
              </div>
              <div className="space-y-3">
                {faqs.map(([question, answer]) => (
                  <Card key={question}>
                    <CardContent className="p-5">
                      <div className="flex gap-3">
                        <CheckCircle2 className="mt-0.5 size-5 text-primary" />
                        <div>
                          <h3 className="font-semibold">{question}</h3>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{answer}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer className="py-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between lg:px-6">
            <AppLogo />
            <p>© 2026 TranscribeAI. Built for modern speech-to-text teams.</p>
          </div>
        </footer>
      </div>
    </PageTransition>
  )
}
