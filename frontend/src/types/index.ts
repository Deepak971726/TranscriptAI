export type TranscriptStatus = "completed" | "processing" | "queued" | "failed"

export type ExportFormat = "PDF" | "TXT" | "DOCX"

export type TranscriptSegment = {
  id: string
  speaker: string
  timestamp: string
  text: string
}

export type Transcript = {
  id: string
  fileName: string
  text: string
  language: string
  duration: number
  status: TranscriptStatus
  createdAt: string
  words: number
  confidence: number
  audioUrl: string
  source: "upload" | "live"
  segments: TranscriptSegment[]
  modelName?: string
  updatedAt?: string
}

export type ExportItem = {
  id: string
  transcriptName: string
  format: ExportFormat
  createdAt: string
  size: string
}

export type ActivityItem = {
  id: string
  title: string
  detail: string
  status: TranscriptStatus
  createdAt: string
}

export type DashboardStats = {
  totalTranscripts: number
  totalAudioFiles: number
  totalProcessingTime: number
  languagesUsed: number
}

export type LanguageOption = {
  label: string
  value: string
}

export type ActivityLevel = "info" | "progress" | "success" | "warning" | "error"

export type OperationEvent = {
  id: string
  title: string
  detail: string
  level: ActivityLevel
  timestamp: string
}

export type UserNotification = OperationEvent & {
  read: boolean
  href?: string
  dedupeKey?: string
}
