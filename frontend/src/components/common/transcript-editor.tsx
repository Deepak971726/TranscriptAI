import { Copy, Eye, FilePenLine, Loader2, Save, Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useNotificationStore } from "@/stores/notification-store"
import type { TranscriptSegment } from "@/types"

type TranscriptEditorProps = {
  segments: TranscriptSegment[]
  sourceText?: string
  onSave?: (text: string) => Promise<void>
}

function highlightText(text: string, query: string) {
  if (!query.trim()) {
    return text
  }

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"))

  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={index} className="rounded bg-amber-300/60 px-0.5 text-foreground">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

export function TranscriptEditor({ segments, sourceText = "", onSave }: TranscriptEditorProps) {
  const addNotification = useNotificationStore((state) => state.addNotification)
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<"edit" | "review">("edit")
  const [isSaving, setIsSaving] = useState(false)
  const composedText = useMemo(
    () => sourceText || segments.map((segment) => `[${segment.timestamp}] ${segment.speaker}: ${segment.text}`).join("\n\n"),
    [segments, sourceText],
  )
  const [text, setText] = useState(composedText)

  const preview = useMemo(() => highlightText(text, query), [query, text])
  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text])

  useEffect(() => {
    setText(composedText)
  }, [composedText])

  async function saveTranscript() {
    setIsSaving(true)
    try {
      await (onSave?.(text) ?? Promise.resolve())
      toast.success("Transcript changes saved")
      addNotification({
        level: "success",
        title: "Transcript saved",
        detail: "Your latest transcript edits were stored successfully.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed"
      toast.error(message)
      addNotification({
        level: "error",
        title: "Transcript save failed",
        detail: message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-semibold">Transcript</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {wordCount.toLocaleString()} words | {text.length.toLocaleString()} characters
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            className="flex-1 sm:flex-none"
            disabled={!text}
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(text).then(() => toast.success("Transcript copied"))
            }}
          >
            <Copy />
            Copy
          </Button>
          <Button className="flex-1 sm:flex-none" disabled={isSaving} onClick={() => void saveTranscript()}>
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            {isSaving ? "Saving" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 border-b bg-muted/25 p-3 sm:p-4 lg:grid-cols-[minmax(220px,1fr)_auto] lg:items-center">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="bg-background pl-9"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              if (event.target.value) {
                setMode("review")
              }
            }}
            placeholder="Search transcript"
          />
        </div>
        <div className="grid grid-cols-2 rounded-md border bg-background p-1">
          <Button
            aria-pressed={mode === "edit"}
            className="h-8 px-3"
            size="sm"
            variant={mode === "edit" ? "secondary" : "ghost"}
            onClick={() => setMode("edit")}
          >
            <FilePenLine />
            Edit
          </Button>
          <Button
            aria-pressed={mode === "review"}
            className="h-8 px-3"
            size="sm"
            variant={mode === "review" ? "secondary" : "ghost"}
            onClick={() => setMode("review")}
          >
            <Eye />
            Review
          </Button>
        </div>
      </div>

      <div className="min-w-0 p-3 sm:p-5">
        {mode === "edit" ? (
        <Textarea
            className="min-h-[32rem] resize-y border-0 bg-transparent p-1 font-mono text-[13px] leading-7 shadow-none focus-visible:ring-0 sm:p-2 sm:text-sm"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="The transcript will appear here when processing finishes."
        />
        ) : (
          <div className="min-h-[32rem] whitespace-pre-wrap rounded-md bg-muted/25 p-4 text-sm leading-7 sm:p-6">
            {text ? preview : <span className="text-muted-foreground">Waiting for transcript text.</span>}
          </div>
        )}
      </div>
    </div>
  )
}
