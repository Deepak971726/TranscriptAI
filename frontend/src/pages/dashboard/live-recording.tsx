import { AnimatePresence, motion } from "framer-motion"
import { Activity, Mic2, Pause, Play, Radio, Square } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { WaveformVisualizer } from "@/components/common/waveform-visualizer"
import { PageHeader } from "@/components/common/page-header"
import { PageTransition } from "@/components/common/page-transition"
import { languages } from "@/data/mock-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { staggerItem } from "@/lib/motion"
import { formatClock } from "@/lib/utils"

type RecordingState = "idle" | "recording" | "paused" | "stopped"

export function LiveRecordingPage() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const [recordingState, setRecordingState] = useState<RecordingState>("idle")
  const [elapsed, setElapsed] = useState(0)
  const [level, setLevel] = useState(18)
  const [transcriptLines, setTranscriptLines] = useState<string[]>([])
  const [language, setLanguage] = useState("English")
  const [isFinalizing, setIsFinalizing] = useState(false)
  const active = recordingState === "recording"

  useEffect(() => {
    if (!active) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1)
      setLevel(22 + Math.round(Math.random() * 72))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [active])

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop()
      streamRef.current?.getTracks().forEach((track) => track.stop())
      socketRef.current?.close()
    }
  }, [])

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error("Could not read audio chunk"))
      reader.onloadend = () => resolve(String(reader.result).split(",")[1] ?? "")
      reader.readAsDataURL(blob)
    })

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Microphone recording is not supported in this browser")
      return
    }

    setElapsed(0)
    setTranscriptLines([])
    setIsFinalizing(false)
    setRecordingState("recording")

    try {
      const socket = api.createTranscriptionSocket()
      socketRef.current = socket

      socket.onmessage = (message) => {
        const payload = JSON.parse(message.data) as { event: string; data: { text?: string; message?: string; chunks_received?: number } }
        if (payload.event === "connected") {
          toast.success("Live transcription connected")
        }
        if (payload.event === "partial_transcript" && payload.data.chunks_received) {
          setTranscriptLines((lines) => [...lines, `Audio chunk ${payload.data.chunks_received} received by backend`].slice(-6))
        }
        if (payload.event === "final_transcript") {
          setIsFinalizing(false)
          setTranscriptLines((lines) => [...lines, payload.data.text || "Final transcript returned with no speech detected"])
          toast.success("Final transcript received")
        }
        if (payload.event === "error") {
          setIsFinalizing(false)
          toast.error(payload.data.message ?? "Live transcription error")
        }
      }

      await new Promise<void>((resolve, reject) => {
        socket.onopen = () => resolve()
        socket.onerror = () => reject(new Error("Could not connect to live transcription"))
      })

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size === 0 || socket.readyState !== WebSocket.OPEN) {
          return
        }
        void blobToBase64(event.data).then((data) => {
          socket.send(JSON.stringify({ event: "audio_chunk", data, language }))
        })
      }

      recorder.onstop = () => {
        if (socket.readyState === WebSocket.OPEN) {
          setIsFinalizing(true)
          setTranscriptLines((lines) => [...lines, "Finalizing recording and running transcription..."])
          socket.send(JSON.stringify({ event: "finalize", language }))
        }
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start(2000)
      toast.success("Recording started")
    } catch (error) {
      setRecordingState("idle")
      toast.error(error instanceof Error ? error.message : "Recording failed")
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecordingState("stopped")
    toast.success("Recording stopped. Transcription is starting.")
  }

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-7">
        <PageHeader
          eyebrow="Live capture"
          title="Record a conversation"
          description="Capture microphone audio while TranscribeAI tracks elapsed time, input level, and incoming transcript segments."
        />

        <motion.div variants={staggerItem} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card className="relative overflow-hidden">
            <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--primary),transparent)] opacity-55" />
            <CardContent className="p-5 sm:p-7">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Radio className="size-4 text-primary" />
                  Recording console
                </div>
                <motion.span
                  layout
                  className="flex items-center gap-2 rounded-md border bg-muted/45 px-2.5 py-1 text-xs font-medium capitalize"
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      active ? "animate-pulse bg-emerald-500" : recordingState === "paused" ? "bg-amber-500" : "bg-muted-foreground/45"
                    }`}
                  />
                  {recordingState === "idle" ? "Ready" : recordingState}
                </motion.span>
              </div>
              <div className="flex flex-col items-center text-center">
                <motion.div
                  animate={active ? { scale: [1, 1.035, 1] } : { scale: 1 }}
                  transition={{ repeat: active ? Infinity : 0, duration: 1.25 }}
                  className="relative flex size-32 items-center justify-center rounded-full border border-primary/15 bg-primary/[0.08] text-primary"
                >
                  {active && (
                    <>
                      <span className="absolute inset-0 rounded-full border border-primary/35" style={{ animation: "pulse-ring 1.5s ease-out infinite" }} />
                      <span className="absolute -inset-4 rounded-full border border-primary/10" style={{ animation: "pulse-ring 1.8s ease-out 0.35s infinite" }} />
                    </>
                  )}
                  <span className="flex size-20 items-center justify-center rounded-full bg-background shadow-[0_12px_32px_color-mix(in_oklch,var(--primary)_18%,transparent)]">
                    <Mic2 className="size-9" />
                  </span>
                </motion.div>
                <motion.div
                  key={elapsed}
                  initial={{ opacity: 0.6, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 font-mono text-4xl font-semibold tabular-nums sm:text-5xl"
                >
                  {formatClock(elapsed)}
                </motion.div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {active ? "Listening to microphone input" : recordingState === "paused" ? "Recording paused" : "Microphone is ready"}
                </p>
              </div>

              <div className="mt-8">
                <WaveformVisualizer active={active} bars={64} className="h-28 border bg-muted/30" />
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Audio Level</span>
                  <span className="text-muted-foreground">{active ? `${level}%` : "0%"}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),oklch(0.74_0.14_145),oklch(0.78_0.15_80))]"
                    animate={{ width: active ? `${level}%` : "0%" }}
                    transition={{ type: "spring", stiffness: 130, damping: 18 }}
                  />
                </div>
              </div>

              <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Button onClick={startRecording} disabled={recordingState === "recording"}>
                  <Mic2 className="size-4" />
                  Start Recording
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    mediaRecorderRef.current?.pause()
                    setRecordingState("paused")
                  }}
                  disabled={recordingState !== "recording"}
                >
                  <Pause className="size-4" />
                  Pause Recording
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    mediaRecorderRef.current?.resume()
                    setRecordingState("recording")
                  }}
                  disabled={recordingState !== "paused"}
                >
                  <Play className="size-4" />
                  Resume Recording
                </Button>
                <Button variant="destructive" onClick={stopRecording} disabled={recordingState === "idle" || recordingState === "stopped"}>
                  <Square className="size-4" />
                  Stop Recording
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="xl:sticky xl:top-24">
              <CardHeader>
                <CardTitle>Session settings</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Configure recognition before recording.</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label>Spoken language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language.value} value={language.value}>
                        {language.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Real-time transcript</CardTitle>
                  <Activity className="size-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="ambient-grid min-h-80 space-y-3 rounded-lg border bg-muted/25 p-4">
                  {transcriptLines.length === 0 && !isFinalizing && (
                    <div className="flex min-h-64 flex-col items-center justify-center text-center">
                      <span className="flex size-11 items-center justify-center rounded-lg border bg-background text-muted-foreground shadow-sm">
                        <Activity className="size-5" />
                      </span>
                      <p className="mt-3 text-sm font-medium">Waiting for speech</p>
                      <p className="mt-1 max-w-52 text-xs leading-5 text-muted-foreground">
                        Transcript segments will appear as the recording is processed.
                      </p>
                    </div>
                  )}
                  {isFinalizing && (
                    <p className="rounded-md bg-background p-3 text-sm leading-6 text-muted-foreground">
                      Processing final recording. This can take a moment for longer audio.
                    </p>
                  )}
                  <AnimatePresence initial={false}>
                    {transcriptLines.map((line, index) => (
                      <motion.p
                        key={`${index}-${line}`}
                        initial={{ opacity: 0, y: 10, scale: 0.985 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.28 }}
                        className="rounded-md border bg-background/90 p-3 text-sm leading-6 shadow-sm"
                      >
                        <span className="mr-1.5 font-mono text-xs text-primary">{formatClock((index + 1) * 8)}</span>
                        {line}
                      </motion.p>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  )
}
