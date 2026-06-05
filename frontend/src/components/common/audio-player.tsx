import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatClock, formatDuration } from "@/lib/utils"

type AudioPlayerProps = {
  title: string
  duration: number
}

export function AudioPlayer({ title, duration }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const progress = playing ? 42 : 28

  return (
    <div className="min-w-0 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 break-words text-sm font-medium leading-5 [overflow-wrap:anywhere]" title={title}>
            {title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDuration(duration)}</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button className="shrink-0" size="icon" variant="ghost" onClick={() => setPlaying((value) => !value)}>
              {playing ? <Pause /> : <Play />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{playing ? "Pause audio" : "Play audio"}</TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-4">
        <Progress value={progress} />
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatClock(Math.round((duration * progress) / 100))}</span>
          <span>{formatClock(duration)}</span>
        </div>
      </div>
      <div className="mt-4 flex min-w-0 items-center justify-between gap-3">
        <div className="flex gap-1">
          <Button size="icon" variant="ghost">
            <SkipBack />
          </Button>
          <Button size="icon" variant="ghost">
            <SkipForward />
          </Button>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
          <Volume2 className="size-4" />
          <div className="h-1.5 w-16 rounded-full bg-muted sm:w-20">
            <div className="h-full w-2/3 rounded-full bg-muted-foreground/50" />
          </div>
        </div>
      </div>
    </div>
  )
}
