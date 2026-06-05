import { useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { AlertCircle, CheckCircle2, Clock3, FileAudio, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { FileUploadZone } from "@/components/common/file-upload-zone"
import { OperationActivity } from "@/components/common/operation-activity"
import { PageTransition } from "@/components/common/page-transition"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { api } from "@/lib/api"
import { formatDuration } from "@/lib/utils"
import { useNotificationStore } from "@/stores/notification-store"
import type { OperationEvent, TranscriptStatus } from "@/types"

type UploadStatus = "idle" | "uploading" | "queued" | "processing" | "success" | "failed"

export function UploadAudioPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const addNotification = useNotificationStore((state) => state.addNotification)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [transcriptId, setTranscriptId] = useState<string | null>(null)
  const [events, setEvents] = useState<OperationEvent[]>([])
  const lastBackendStatus = useRef<TranscriptStatus | null>(null)
  const statusCheckDelayed = useRef(false)
  const duration = file ? Math.max(48, Math.round(file.size / 105_000)) : 0

  function addEvent(event: Omit<OperationEvent, "id" | "timestamp">) {
    setEvents((current) => [
      ...current,
      {
        ...event,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    ])
  }

  useEffect(() => {
    if (!transcriptId || (status !== "queued" && status !== "processing")) {
      return undefined
    }

    let active = true

    const checkStatus = async () => {
      try {
        const transcript = await api.getTranscript(transcriptId)
        if (!active || !transcript) {
          return
        }

        statusCheckDelayed.current = false
        if (transcript.status === lastBackendStatus.current) {
          return
        }

        lastBackendStatus.current = transcript.status

        if (transcript.status === "queued") {
          setStatus("queued")
          setProcessingProgress(15)
        }

        if (transcript.status === "processing") {
          setStatus("processing")
          setProcessingProgress(65)
          addEvent({
            level: "progress",
            title: "AI transcription started",
            detail: "A processing worker is analyzing the audio. You can leave this page and return later.",
          })
          addNotification({
            level: "progress",
            title: "Transcription started",
            detail: file?.name ?? "Your audio is being processed.",
            href: `/transcripts/${transcriptId}`,
            dedupeKey: `${transcriptId}:processing`,
          })
        }

        if (transcript.status === "completed") {
          setStatus("success")
          setProcessingProgress(100)
          addEvent({
            level: "success",
            title: "Transcript ready",
            detail: `${transcript.words.toLocaleString()} words detected in ${transcript.language}.`,
          })
          addNotification({
            level: "success",
            title: "Transcript completed",
            detail: file?.name ?? "Your transcript is ready to review.",
            href: `/transcripts/${transcriptId}`,
            dedupeKey: `${transcriptId}:completed`,
          })
          toast.success("Transcript is ready")
          void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
          void queryClient.invalidateQueries({ queryKey: ["recent-activity"] })
          void queryClient.invalidateQueries({ queryKey: ["transcripts"] })
        }

        if (transcript.status === "failed") {
          setStatus("failed")
          setProcessingProgress(0)
          addEvent({
            level: "error",
            title: "Transcription failed",
            detail: "The backend could not finish this file. Open the transcript and use Process Now to retry.",
          })
          addNotification({
            level: "error",
            title: "Transcription failed",
            detail: file?.name ?? "The audio could not be processed.",
            href: `/transcripts/${transcriptId}`,
            dedupeKey: `${transcriptId}:failed`,
          })
          toast.error("Transcription failed")
        }
      } catch {
        if (active && !statusCheckDelayed.current) {
          statusCheckDelayed.current = true
          addEvent({
            level: "warning",
            title: "Status check delayed",
            detail: "The server did not answer this check. Processing may still be running; the app will try again.",
          })
        }
      }
    }

    void checkStatus()
    const timer = window.setInterval(() => void checkStatus(), 4000)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [addNotification, file?.name, queryClient, status, transcriptId])

  const handleFileAccepted = (acceptedFile: File) => {
    setFile(acceptedFile)
    setStatus("uploading")
    setUploadProgress(0)
    setProcessingProgress(0)
    setTranscriptId(null)
    lastBackendStatus.current = null
    statusCheckDelayed.current = false
    setEvents([
      {
        id: crypto.randomUUID(),
        level: "info",
        title: "File validated",
        detail: `${acceptedFile.name} is supported and ready to upload.`,
        timestamp: new Date().toISOString(),
      },
    ])
    toast.success("Upload started")

    void api
      .uploadAudio(acceptedFile, setUploadProgress)
      .then((response) => {
        setUploadProgress(100)
        setTranscriptId(response.transcript_id)
        setStatus("queued")
        setProcessingProgress(15)
        lastBackendStatus.current = "queued"
        addEvent({
          level: "success",
          title: "Upload complete",
          detail: "The file was stored successfully.",
        })
        addEvent({
          level: "warning",
          title: "Waiting for processing",
          detail: "The transcription job is queued and will start automatically.",
        })
        addNotification({
          level: "info",
          title: "Audio uploaded",
          detail: acceptedFile.name,
          href: response.transcript_id ? `/transcripts/${response.transcript_id}` : "/transcripts",
          dedupeKey: `${response.transcript_id ?? response.audio_file_id}:uploaded`,
        })
        toast.success("Audio uploaded and queued")
        void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
        void queryClient.invalidateQueries({ queryKey: ["recent-activity"] })
        void queryClient.invalidateQueries({ queryKey: ["transcripts"] })
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Upload failed"
        setStatus("failed")
        addEvent({
          level: "error",
          title: "Upload failed",
          detail: message,
        })
        addNotification({
          level: "error",
          title: "Upload failed",
          detail: acceptedFile.name,
        })
        toast.error(message)
      })
  }

  return (
    <PageTransition>
      <div className="min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Upload Audio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag audio into the workspace and monitor upload and AI processing progress.
          </p>
        </div>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0 space-y-6">
            <FileUploadZone onFileAccepted={handleFileAccepted} />
            <OperationActivity
              events={events}
              title="Upload activity"
              description="Live updates from validation, upload, and transcription."
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Processing Status</CardTitle>
            </CardHeader>
            <CardContent>
              {!file && (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                  <FileAudio className="size-9 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">No file selected</p>
                  <p className="mt-1 text-xs text-muted-foreground">Validated audio will appear here.</p>
                </div>
              )}

              {file && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDuration(duration)} | {(file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                      <Badge
                        variant={
                          status === "success"
                            ? "success"
                            : status === "failed"
                              ? "destructive"
                              : status === "queued"
                                ? "warning"
                                : "secondary"
                        }
                      >
                        {status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Upload Progress</span>
                      <span className="text-muted-foreground">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing Progress</span>
                      <span className="text-muted-foreground">{processingProgress}%</span>
                    </div>
                    <Progress value={processingProgress} />
                  </div>

                  <div className="rounded-lg bg-muted/60 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {status === "success" && <CheckCircle2 className="size-4 text-emerald-500" />}
                      {status === "failed" && <AlertCircle className="size-4 text-destructive" />}
                      {status === "queued" && <Clock3 className="size-4 text-amber-600" />}
                      {(status === "uploading" || status === "processing") && (
                        <Loader2 className="size-4 animate-spin text-primary" />
                      )}
                      {status === "success"
                        ? "Transcript ready"
                        : status === "failed"
                          ? "Action required"
                          : status === "queued"
                            ? "Waiting for a worker"
                            : status === "uploading"
                              ? "Uploading audio"
                              : "Processing audio"}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {status === "success"
                        ? "The transcript is complete and ready for review."
                        : status === "failed"
                          ? "Open the transcript to retry processing or review the failure state."
                          : status === "queued"
                            ? "The backend accepted the job. Processing will start automatically."
                            : status === "uploading"
                              ? "Keep this page open until the upload reaches 100%."
                              : "The AI worker is analyzing the recording and generating text."}
                    </p>
                  </div>

                  {transcriptId && (
                    <Button className="w-full" onClick={() => navigate(`/transcripts/${transcriptId}`)}>
                      {status === "success" ? "Open Transcript" : "Monitor Transcript"}
                    </Button>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
