import { cn } from "@/lib/utils"

type WaveformVisualizerProps = {
  active?: boolean
  bars?: number
  className?: string
}

export function WaveformVisualizer({ active = false, bars = 48, className }: WaveformVisualizerProps) {
  return (
    <div className={cn("flex h-24 items-center justify-center gap-1 overflow-hidden rounded-lg bg-muted/60 p-4", className)}>
      {Array.from({ length: bars }).map((_, index) => (
        <span
          key={index}
          className={cn("w-1 rounded-full bg-primary/75", active ? "origin-center" : "bg-muted-foreground/30")}
          style={{
            height: `${18 + ((index * 17) % 58)}px`,
            animation: active ? `waveform ${0.65 + (index % 7) * 0.07}s ease-in-out infinite` : undefined,
            animationDelay: active ? `${index * 0.025}s` : undefined,
          }}
        />
      ))}
    </div>
  )
}
