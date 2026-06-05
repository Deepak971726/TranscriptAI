import { AudioWaveform } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

type AppLogoProps = {
  className?: string
  compact?: boolean
}

export function AppLogo({ className, compact = false }: AppLogoProps) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <AudioWaveform className="size-4" />
      </span>
      {!compact && <span>TranscribeAI</span>}
    </Link>
  )
}
