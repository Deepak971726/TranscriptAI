import { AudioWaveform } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

type AppLogoProps = {
  className?: string
  compact?: boolean
}

export function AppLogo({ className, compact = false }: AppLogoProps) {
  return (
    <Link to="/" className={cn("group inline-flex items-center gap-2.5 font-semibold", className)}>
      <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-lg bg-foreground text-background shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
        <span className="absolute inset-x-1 top-0 h-px bg-primary/80" />
        <AudioWaveform className="size-[1.125rem]" />
      </span>
      {!compact && (
        <span className="text-[0.95rem] tracking-[-0.01em]">
          Transcribe<span className="text-primary">AI</span>
        </span>
      )}
    </Link>
  )
}
