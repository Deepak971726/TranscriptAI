import { Badge } from "@/components/ui/badge"
import { statusTone } from "@/lib/utils"
import type { TranscriptStatus } from "@/types"

type StatusBadgeProps = {
  status: TranscriptStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return <Badge variant={statusTone(status)}>{label}</Badge>
}
