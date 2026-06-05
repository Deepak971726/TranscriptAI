import type { ActivityItem, DashboardStats, ExportItem, LanguageOption, Transcript } from "@/types"

export const languages: LanguageOption[] = [
  { label: "English", value: "English" },
  { label: "Spanish", value: "Spanish" },
  { label: "French", value: "French" },
  { label: "German", value: "German" },
  { label: "Hindi", value: "Hindi" },
  { label: "Japanese", value: "Japanese" },
]

export const dashboardStats: DashboardStats = {
  totalTranscripts: 1284,
  totalAudioFiles: 934,
  totalProcessingTime: 48960,
  languagesUsed: 18,
}

export const transcripts: Transcript[] = [
  {
    id: "tr-1001",
    fileName: "Product discovery interview.mp3",
    text: "Thanks for joining. I want to understand how your team handles call notes and follow up tasks today. Most of the process is manual. We record the customer call, then someone listens back and turns the important points into a summary. The biggest opportunity is fast transcript review with speaker labels, timestamps, and export options for the team.",
    language: "English",
    duration: 2840,
    status: "completed",
    createdAt: "2026-06-01T10:32:00Z",
    words: 6230,
    confidence: 98,
    audioUrl: "#",
    source: "upload",
    segments: [
      {
        id: "s1",
        speaker: "Speaker 1",
        timestamp: "00:00:04",
        text: "Thanks for joining. I want to understand how your team handles call notes and follow up tasks today.",
      },
      {
        id: "s2",
        speaker: "Speaker 2",
        timestamp: "00:00:18",
        text: "Most of the process is manual. We record the customer call, then someone listens back and turns the important points into a summary.",
      },
      {
        id: "s3",
        speaker: "Speaker 1",
        timestamp: "00:01:02",
        text: "The biggest opportunity is fast transcript review with speaker labels, timestamps, and export options for the team.",
      },
    ],
  },
  {
    id: "tr-1002",
    fileName: "Weekly design critique.webm",
    text: "The landing page should feel polished without making the product workflow harder to scan. Let us keep the upload and transcript views quiet, dense, and focused on repeat usage.",
    language: "English",
    duration: 1920,
    status: "processing",
    createdAt: "2026-06-02T15:10:00Z",
    words: 4180,
    confidence: 93,
    audioUrl: "#",
    source: "live",
    segments: [
      {
        id: "s1",
        speaker: "Speaker 1",
        timestamp: "00:00:08",
        text: "The landing page should feel polished without making the product workflow harder to scan.",
      },
      {
        id: "s2",
        speaker: "Speaker 2",
        timestamp: "00:00:31",
        text: "Let us keep the upload and transcript views quiet, dense, and focused on repeat usage.",
      },
    ],
  },
  {
    id: "tr-1003",
    fileName: "Spanish customer feedback.m4a",
    text: "El equipo quiere exportar las transcripciones en distintos formatos y compartirlas con soporte. La velocidad del procesamiento es importante porque las llamadas se revisan el mismo dia.",
    language: "Spanish",
    duration: 1460,
    status: "completed",
    createdAt: "2026-05-30T08:45:00Z",
    words: 3120,
    confidence: 96,
    audioUrl: "#",
    source: "upload",
    segments: [
      {
        id: "s1",
        speaker: "Speaker 1",
        timestamp: "00:00:06",
        text: "El equipo quiere exportar las transcripciones en distintos formatos y compartirlas con soporte.",
      },
      {
        id: "s2",
        speaker: "Speaker 2",
        timestamp: "00:00:42",
        text: "La velocidad del procesamiento es importante porque las llamadas se revisan el mismo dia.",
      },
    ],
  },
  {
    id: "tr-1004",
    fileName: "Launch planning sync.wav",
    text: "We need the transcript ready before the launch retro so every owner can check decisions and blockers.",
    language: "English",
    duration: 3680,
    status: "queued",
    createdAt: "2026-05-28T17:22:00Z",
    words: 7850,
    confidence: 91,
    audioUrl: "#",
    source: "upload",
    segments: [
      {
        id: "s1",
        speaker: "Speaker 1",
        timestamp: "00:00:11",
        text: "We need the transcript ready before the launch retro so every owner can check decisions and blockers.",
      },
    ],
  },
  {
    id: "tr-1005",
    fileName: "Support escalation notes.aac",
    text: "",
    language: "French",
    duration: 980,
    status: "failed",
    createdAt: "2026-05-25T13:06:00Z",
    words: 0,
    confidence: 0,
    audioUrl: "#",
    source: "upload",
    segments: [],
  },
]

export const activity: ActivityItem[] = [
  {
    id: "act-1",
    title: "Transcript completed",
    detail: "Product discovery interview.mp3",
    status: "completed",
    createdAt: "2026-06-01T10:42:00Z",
  },
  {
    id: "act-2",
    title: "Live recording saved",
    detail: "Weekly design critique.webm",
    status: "processing",
    createdAt: "2026-06-02T15:28:00Z",
  },
  {
    id: "act-3",
    title: "Export generated",
    detail: "Spanish customer feedback.m4a",
    status: "completed",
    createdAt: "2026-05-30T09:01:00Z",
  },
  {
    id: "act-4",
    title: "Upload queued",
    detail: "Launch planning sync.wav",
    status: "queued",
    createdAt: "2026-05-28T17:24:00Z",
  },
]

export const exportsHistory: ExportItem[] = [
  {
    id: "ex-1",
    transcriptName: "Product discovery interview",
    format: "PDF",
    createdAt: "2026-06-01T11:00:00Z",
    size: "1.8 MB",
  },
  {
    id: "ex-2",
    transcriptName: "Spanish customer feedback",
    format: "DOCX",
    createdAt: "2026-05-30T09:10:00Z",
    size: "920 KB",
  },
  {
    id: "ex-3",
    transcriptName: "Weekly design critique",
    format: "TXT",
    createdAt: "2026-06-02T15:36:00Z",
    size: "240 KB",
  },
]

export const liveTranscriptLines = [
  "We are reviewing the onboarding flow and where the recording controls should sit.",
  "The transcript panel should update in short readable segments with speaker context.",
  "Export options can remain available after the recording is stopped and processed.",
  "The team wants confidence scoring and search once the transcript is finalized.",
]
