import { useMutation, useQuery } from "@tanstack/react-query"
import { ArrowLeft, Download, FileText, Loader2, PlayCircle, RefreshCw, UsersRound } from "lucide-react"
import { useEffect, useMemo, useRef } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { AudioPlayer } from "@/components/common/audio-player"
import { OperationActivity } from "@/components/common/operation-activity"
import { PageTransition } from "@/components/common/page-transition"
import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/states"
import { TranscriptEditor } from "@/components/common/transcript-editor"
import { TranscriptViewer } from "@/components/common/transcript-viewer"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { formatDate, formatDuration } from "@/lib/utils"
import { useNotificationStore } from "@/stores/notification-store"
import type { OperationEvent, TranscriptStatus } from "@/types"

export function TranscriptDetailPage() {
  const { id } = useParams()
  const addNotification = useNotificationStore((state) => state.addNotification)
  const previousStatus = useRef<TranscriptStatus | null>(null)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["transcript", id],
    queryFn: () => api.getTranscript(id ?? ""),
    enabled: Boolean(id),
  })
  const shouldPoll = data?.status === "queued" || data?.status === "processing"
  const processMutation = useMutation({
    mutationFn: () => api.processTranscript(id ?? ""),
    onSuccess: () => {
      toast.success("Transcription started")
      addNotification({
        level: "progress",
        title: "Transcription restarted",
        detail: "The audio was sent back to the processing worker.",
        href: id ? `/transcripts/${id}` : "/transcripts",
        dedupeKey: `${id}:manual-process:${Date.now()}`,
      })
      void refetch()
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not start transcription"
      toast.error(message)
      addNotification({
        level: "error",
        title: "Could not start transcription",
        detail: message,
        href: id ? `/transcripts/${id}` : "/transcripts",
      })
    },
  })
  const diarizeMutation = useMutation({
    mutationFn: () => api.diarizeTranscript(id ?? ""),
    onSuccess: () => {
      toast.success("Speakers identified")
      addNotification({
        level: "success",
        title: "Speaker identification completed",
        detail: "The timeline was separated into individual speaker turns.",
        href: id ? `/transcripts/${id}` : "/transcripts",
      })
      void refetch()
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not identify speakers"
      toast.error(message)
      addNotification({
        level: "error",
        title: "Speaker identification failed",
        detail: message,
        href: id ? `/transcripts/${id}` : "/transcripts",
      })
    },
  })

  useEffect(() => {
    if (!shouldPoll) {
      return undefined
    }

    const timer = window.setInterval(() => {
      void refetch()
    }, 4000)

    return () => window.clearInterval(timer)
  }, [refetch, shouldPoll])

  useEffect(() => {
    if (!data || data.status === previousStatus.current) {
      return
    }

    previousStatus.current = data.status

    const notificationByStatus = {
      queued: {
        level: "warning" as const,
        title: "Transcript queued",
        detail: `${data.fileName} is waiting for processing.`,
      },
      processing: {
        level: "progress" as const,
        title: "Transcription in progress",
        detail: `${data.fileName} is being analyzed.`,
      },
      completed: {
        level: "success" as const,
        title: "Transcript ready",
        detail: `${data.words.toLocaleString()} words are ready to review.`,
      },
      failed: {
        level: "error" as const,
        title: "Transcription failed",
        detail: `${data.fileName} needs attention.`,
      },
    }
    const notification = notificationByStatus[data.status]

    addNotification({
      ...notification,
      href: `/transcripts/${data.id}`,
      dedupeKey: `${data.id}:${data.status}`,
      timestamp: data.updatedAt ?? data.createdAt,
    })
  }, [addNotification, data])

  const activityEvents = useMemo<OperationEvent[]>(() => {
    if (!data) {
      return []
    }

    const events: OperationEvent[] = [
      {
        id: `${data.id}:uploaded`,
        level: "success",
        title: "Audio received",
        detail: "The upload was validated and stored successfully.",
        timestamp: data.createdAt,
      },
    ]

    if (data.status === "queued") {
      events.push({
        id: `${data.id}:queued`,
        level: "warning",
        title: "Waiting for processing",
        detail: "The job is queued. The system will start it automatically when a worker is available.",
        timestamp: data.updatedAt ?? data.createdAt,
      })
    }

    if (data.status === "processing") {
      events.push({
        id: `${data.id}:processing`,
        level: "progress",
        title: "AI transcription running",
        detail: "The recording is being decoded, language-detected, and converted into timestamped text.",
        timestamp: data.updatedAt ?? data.createdAt,
      })
    }

    if (data.status === "completed") {
      events.push(
        {
          id: `${data.id}:processed`,
          level: "success",
          title: "AI processing completed",
          detail: `${data.modelName ? `${data.modelName} produced` : "The model produced"} ${data.words.toLocaleString()} words across ${data.segments.length} timestamped segments.`,
          timestamp: data.updatedAt ?? data.createdAt,
        },
        {
          id: `${data.id}:ready`,
          level: "info",
          title: "Ready for review",
          detail: `Detected language: ${data.language}. Confidence: ${data.confidence}%. You can edit, copy, or export the transcript.`,
          timestamp: data.updatedAt ?? data.createdAt,
        },
      )
    }

    if (data.status === "failed") {
      events.push({
        id: `${data.id}:failed`,
        level: "error",
        title: "Processing stopped",
        detail: "The transcript could not be generated. Use Process Now to retry the job.",
        timestamp: data.updatedAt ?? data.createdAt,
      })
    }

    return events
  }, [data])

  if (isLoading) {
    return (
      <PageTransition>
        <TableSkeleton rows={8} />
      </PageTransition>
    )
  }

  if (isError) {
    return (
      <PageTransition>
        <ErrorState />
      </PageTransition>
    )
  }

  if (!data) {
    return (
      <PageTransition>
        <EmptyState icon={FileText} title="Transcript not found" description="The selected transcript is not available." />
      </PageTransition>
    )
  }

  const uniqueSpeakers = new Set(data.segments.map((segment) => segment.speaker)).size
  const needsSpeakerIdentification =
    data.status === "completed" &&
    data.segments.length > 1 &&
    uniqueSpeakers <= 1

  return (
    <PageTransition>
      <div className="min-w-0 space-y-5 sm:space-y-6">
        <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <Button asChild className="-ml-3 mb-2 h-8 px-3 text-muted-foreground" size="sm" variant="ghost">
              <Link to="/transcripts">
                <ArrowLeft />
                Back to transcripts
              </Link>
            </Button>
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <h1 className="min-w-0 break-words text-xl font-semibold leading-tight [overflow-wrap:anywhere] sm:text-2xl">
                {data.fileName}
              </h1>
              <StatusBadge status={data.status} />
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review the audio, refine the transcript, and export the finished document.
            </p>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:items-end">
            {needsSpeakerIdentification && (
              <Button
                className="w-full sm:w-auto"
                disabled={diarizeMutation.isPending}
                variant="secondary"
                onClick={() => diarizeMutation.mutate()}
              >
                {diarizeMutation.isPending ? <Loader2 className="animate-spin" /> : <UsersRound />}
                {diarizeMutation.isPending ? "Identifying" : "Identify speakers"}
              </Button>
            )}
            {(data.status === "queued" || data.status === "failed") && (
              <Button className="w-full sm:w-auto" disabled={processMutation.isPending} onClick={() => processMutation.mutate()}>
                {processMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
                Process Now
              </Button>
            )}
            {data.status === "processing" && (
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <Button className="flex-1 sm:flex-none" disabled={processMutation.isPending} onClick={() => processMutation.mutate()}>
                  {processMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
                  Restart Processing
                </Button>
                <Button className="flex-1 sm:flex-none" variant="outline" onClick={() => void refetch()}>
                  <RefreshCw className="size-4" />
                  Refresh
                </Button>
              </div>
            )}
            <div className="grid w-full grid-cols-3 gap-2 sm:w-auto">
              {["PDF", "TXT", "DOCX"].map((format) => (
                <Button
                  className="min-w-0 px-2.5 sm:px-3"
                  key={format}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void api.downloadTranscriptExport(data.id, format as "PDF" | "TXT" | "DOCX").then(() => {
                      toast.success(`Export ${format} downloaded`)
                      addNotification({
                        level: "success",
                        title: `${format} export downloaded`,
                        detail: data.fileName,
                        href: `/transcripts/${data.id}`,
                      })
                    }).catch((error: unknown) => {
                      const message = error instanceof Error ? error.message : `Export ${format} failed`
                      toast.error(message)
                      addNotification({
                        level: "error",
                        title: `${format} export failed`,
                        detail: message,
                        href: `/transcripts/${data.id}`,
                      })
                    })
                  }}
                >
                  <Download />
                  {format}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {shouldPoll && (
          <Card className="border-primary/25 bg-primary/5">
            <CardContent className="flex items-start gap-3 p-4">
              <Loader2 className="mt-0.5 size-5 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium">{data.status === "queued" ? "Transcript is queued" : "Transcription is running"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This page checks the backend every few seconds. The transcript text will appear automatically when processing completes.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <OperationActivity
          events={activityEvents}
          title="Processing activity"
          description="Important system checkpoints for this transcript."
        />

        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="min-w-0">
            <TranscriptEditor
              segments={data.segments}
              sourceText={data.text}
              onSave={(text) => api.updateTranscript(data.id, { text }).then(() => undefined)}
            />
          </div>

          <aside className="min-w-0 space-y-5 xl:sticky xl:top-20">
            <AudioPlayer title={data.fileName} duration={data.duration} />
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>File details</CardTitle>
                <CardDescription>Technical information for this transcript.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
                {[
                  ["Language", data.language],
                  ["Duration", formatDuration(data.duration)],
                  ["Words", data.words.toLocaleString()],
                  ["Confidence", `${data.confidence}%`],
                  ["Source", data.source],
                  ["Created", formatDate(data.createdAt)],
                ].map(([label, value]) => (
                  <div className="min-w-0" key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 truncate font-medium capitalize" title={String(value)}>
                      {value}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>

        <Card className="min-w-0">
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Speaker timeline</CardTitle>
                <CardDescription className="mt-1">
                  {uniqueSpeakers > 1
                    ? `${uniqueSpeakers} speakers identified and grouped into conversation turns.`
                    : "Speaker identification is available for this transcript."}
                </CardDescription>
              </div>
              <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {data.segments.length} segments
              </span>
            </div>
          </CardHeader>
          <CardContent className="max-h-[34rem] overflow-y-auto p-4 sm:p-5">
            <TranscriptViewer segments={data.segments} />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
