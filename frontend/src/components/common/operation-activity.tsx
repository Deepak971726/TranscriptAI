import { AlertCircle, CheckCircle2, Clock3, Info, Loader2 } from "lucide-react"
import type { ComponentType } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ActivityLevel, OperationEvent } from "@/types"

type OperationActivityProps = {
  events: OperationEvent[]
  title?: string
  description?: string
  className?: string
}

const levelConfig: Record<ActivityLevel, { icon: ComponentType<{ className?: string }>; className: string }> = {
  info: { icon: Info, className: "bg-blue-500/10 text-blue-600 dark:text-blue-300" },
  progress: { icon: Loader2, className: "bg-primary/10 text-primary" },
  success: { icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" },
  warning: { icon: Clock3, className: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  error: { icon: AlertCircle, className: "bg-destructive/10 text-destructive" },
}

function formatEventTime(timestamp: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp))
}

export function OperationActivity({
  events,
  title = "Activity",
  description = "Important updates from this process.",
  className,
}: OperationActivityProps) {
  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader className="pb-3">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ol className="space-y-1">
            {events.map((event, index) => {
              const config = levelConfig[event.level]
              const Icon = config.icon

              return (
                <li className="relative flex min-w-0 gap-3 pb-4 last:pb-0" key={event.id}>
                  {index < events.length - 1 && <span className="absolute left-4 top-8 h-[calc(100%-1rem)] w-px bg-border" />}
                  <span className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full", config.className)}>
                    <Icon className={cn("size-4", event.level === "progress" && "animate-spin")} />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      <time className="text-xs text-muted-foreground" dateTime={event.timestamp}>
                        {formatEventTime(event.timestamp)}
                      </time>
                    </div>
                    <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{event.detail}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
