import { motion } from "framer-motion"
import { Mic2, Pause, Play, Square } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { WaveformVisualizer } from "@/components/common/waveform-visualizer"
import { PageTransition } from "@/components/common/page-transition"
import { languages } from "@/data/mock-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Live Recording</h1>
          <p className="mt-1 text-sm text-muted-foreground">Capture audio in real time with waveform, timer, and transcript preview.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <motion.div
                  animate={active ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                  transition={{ repeat: active ? Infinity : 0, duration: 1.4 }}
                  className="relative flex size-28 items-center justify-center rounded-full bg-primary/10 text-primary"
                >
                  {active && <span className="absolute inset-0 rounded-full border border-primary/30" style={{ animation: "pulse-ring 1.6s ease-out infinite" }} />}
                  <Mic2 className="size-10" />
                </motion.div>
                <div className="mt-5 font-mono text-4xl font-semibold">{formatClock(elapsed)}</div>
                <p className="mt-2 text-sm text-muted-foreground">{recordingState === "idle" ? "Ready" : recordingState}</p>
              </div>

              <div className="mt-8">
                <WaveformVisualizer active={active} bars={64} />
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Audio Level</span>
                  <span className="text-muted-foreground">{active ? `${level}%` : "0%"}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div className="h-full rounded-full bg-primary" animate={{ width: active ? `${level}%` : "0%" }} />
                </div>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-2">
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
            <Card>
              <CardHeader>
                <CardTitle>Language</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label>Language Selection</Label>
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

            <Card>
              <CardHeader>
                <CardTitle>Real-Time Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-80 space-y-3 rounded-lg border bg-muted/35 p-4">
                  {transcriptLines.length === 0 && !isFinalizing && (
                    <p className="text-sm text-muted-foreground">Transcript segments will appear here while recording.</p>
                  )}
                  {isFinalizing && (
                    <p className="rounded-md bg-background p-3 text-sm leading-6 text-muted-foreground">
                      Processing final recording. This can take a moment for longer audio.
                    </p>
                  )}
                  {transcriptLines.map((line, index) => (
                    <motion.p
                      key={line}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-md bg-background p-3 text-sm leading-6"
                    >
                      <span className="font-mono text-xs text-muted-foreground">{formatClock((index + 1) * 8)}</span> {line}
                    </motion.p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
