import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { TranscriptStatus } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

export function statusTone(status: TranscriptStatus) {
  const tones: Record<TranscriptStatus, "default" | "secondary" | "outline" | "destructive"> = {
    completed: "default",
    processing: "secondary",
    queued: "outline",
    failed: "destructive",
  }

  return tones[status]
}
