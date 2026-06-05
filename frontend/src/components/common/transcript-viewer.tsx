import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { TranscriptSegment } from "@/types"

type TranscriptViewerProps = {
  segments: TranscriptSegment[]
}

const speakerStyles = [
  "border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
] as const

export function TranscriptViewer({ segments }: TranscriptViewerProps) {
  if (segments.length === 0) {
    return <p className="text-sm text-muted-foreground">Speaker timeline will appear after transcription completes.</p>
  }

  const turns = segments.reduce<TranscriptSegment[]>((grouped, segment) => {
    const previous = grouped[grouped.length - 1]
    if (previous?.speaker === segment.speaker) {
      previous.text = `${previous.text} ${segment.text}`.trim()
      return grouped
    }
    grouped.push({ ...segment })
    return grouped
  }, [])

  const speakerOrder = new Map<string, number>()

  return (
    <div className="divide-y">
      {turns.map((segment) => {
        if (!speakerOrder.has(segment.speaker)) {
          speakerOrder.set(segment.speaker, speakerOrder.size)
        }
        const speakerIndex = speakerOrder.get(segment.speaker) ?? 0

        return (
          <div key={segment.id} className="grid min-w-0 gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <div className="flex flex-wrap items-center gap-2 sm:block">
              <Badge className={cn(speakerStyles[speakerIndex % speakerStyles.length])} variant="outline">
                {segment.speaker}
              </Badge>
              <p className="font-mono text-xs text-muted-foreground sm:mt-2">{segment.timestamp}</p>
            </div>
            <p className="min-w-0 break-words text-sm leading-6 text-card-foreground [overflow-wrap:anywhere]">{segment.text}</p>
          </div>
        )
      })}
    </div>
  )
}
