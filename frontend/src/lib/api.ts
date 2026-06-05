import axios, { type AxiosProgressEvent } from "axios"
import { supabase } from "@/lib/supabase"
import type { ActivityItem, DashboardStats, ExportFormat, ExportItem, Transcript, TranscriptStatus } from "@/types"

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api"

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30_000,
})

apiClient.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }

  return config
})

type BackendStats = {
  total_transcripts: number
  total_audio_files: number
  total_minutes: number
  languages_used: number
}

type BackendSegment = {
  id: string
  speaker_label: string
  start_time: number
  end_time: number
  text: string
  confidence: number | null
}

type BackendTranscript = {
  id: string
  audio_file_id: string
  title: string
  text?: string
  language: string | null
  status: string
  duration_seconds: number | null
  confidence: number | null
  word_count: number
  model_name?: string | null
  created_at: string
  updated_at?: string
  segments?: BackendSegment[]
}

type BackendPaginated<T> = {
  items: T[]
  total: number
  page: number
  size: number
}

type BackendExport = {
  id: string
  transcript_id: string
  format: string
  status: string
  storage_path: string | null
  size_bytes: number | null
  created_at: string
}

type BackendSettings = {
  theme: "light" | "dark" | "system"
  language: string
  notifications_enabled: boolean
}

type UserProfile = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

type UploadResponse = {
  job_id: string
  status: string
  audio_file_id: string
  transcript_id: string | null
}

type RegisterPayload = {
  name: string
  email: string
  password: string
}

type RegisterResponse = {
  id: string
  email: string
  role: string
}

type UpdateTranscriptPayload = {
  title?: string
  text?: string
  language?: string
}

function formatTimestamp(seconds: number) {
  const rounded = Math.max(0, Math.round(seconds))
  const hours = Math.floor(rounded / 3600)
  const minutes = Math.floor((rounded % 3600) / 60)
  const remainingSeconds = rounded % 60
  return [hours, minutes, remainingSeconds].map((part) => part.toString().padStart(2, "0")).join(":")
}

function normalizeStatus(status: string): TranscriptStatus {
  if (status === "completed" || status === "processing" || status === "queued" || status === "failed") {
    return status
  }
  return "queued"
}

function normalizeFormat(format: string): ExportFormat {
  const upper = format.toUpperCase()
  if (upper === "PDF" || upper === "TXT" || upper === "DOCX") {
    return upper
  }
  return "TXT"
}

function mapTranscript(item: BackendTranscript): Transcript {
  return {
    id: item.id,
    fileName: item.title,
    text: item.text ?? "",
    language: item.language ?? "Unknown",
    duration: item.duration_seconds ?? 0,
    status: normalizeStatus(item.status),
    createdAt: item.created_at,
    words: item.word_count,
    confidence: Math.round((item.confidence ?? 0) * 100),
    audioUrl: "",
    source: "upload",
    modelName: item.model_name ?? undefined,
    updatedAt: item.updated_at,
    segments:
      item.segments?.map((segment) => ({
        id: segment.id,
        speaker: segment.speaker_label,
        timestamp: formatTimestamp(segment.start_time),
        text: segment.text,
      })) ?? [],
  }
}

function mapExport(item: BackendExport): ExportItem {
  return {
    id: item.id,
    transcriptName: item.transcript_id,
    format: normalizeFormat(item.format),
    createdAt: item.created_at,
    size: item.size_bytes ? `${Math.max(1, Math.round(item.size_bytes / 1024))} KB` : "Pending",
  }
}

async function downloadBlob(url: string, filename: string) {
  const response = await apiClient.get<Blob>(url, { responseType: "blob" })
  const objectUrl = URL.createObjectURL(response.data)
  const link = document.createElement("a")
  link.href = objectUrl
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

export const api = {
  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const { data } = await apiClient.post<RegisterResponse>("/auth/register", payload)
    return data
  },
  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<BackendStats>("/dashboard/stats")
    return {
      totalTranscripts: data.total_transcripts,
      totalAudioFiles: data.total_audio_files,
      totalProcessingTime: data.total_minutes * 60,
      languagesUsed: data.languages_used,
    }
  },
  getRecentActivity: async (): Promise<ActivityItem[]> => {
    const transcripts = await api.getTranscripts()
    return transcripts.slice(0, 5).map((transcript) => ({
      id: `activity-${transcript.id}`,
      title: transcript.status === "completed" ? "Transcript completed" : "Transcript updated",
      detail: transcript.fileName,
      status: transcript.status,
      createdAt: transcript.createdAt,
    }))
  },
  getTranscripts: async (): Promise<Transcript[]> => {
    const { data } = await apiClient.get<BackendPaginated<BackendTranscript>>("/transcripts")
    return data.items.map(mapTranscript)
  },
  getTranscript: async (id: string): Promise<Transcript | undefined> => {
    const { data } = await apiClient.get<BackendTranscript>(`/transcripts/${id}`)
    return mapTranscript(data)
  },
  updateTranscript: async (id: string, payload: UpdateTranscriptPayload): Promise<Transcript> => {
    const { data } = await apiClient.put<BackendTranscript>(`/transcripts/${id}`, payload)
    return mapTranscript(data)
  },
  processTranscript: async (id: string): Promise<Transcript> => {
    const { data } = await apiClient.post<BackendTranscript>(`/transcripts/${id}/process`)
    return mapTranscript(data)
  },
  diarizeTranscript: async (id: string): Promise<Transcript> => {
    const { data } = await apiClient.post<BackendTranscript>(`/transcripts/${id}/diarize`)
    return mapTranscript(data)
  },
  deleteTranscript: async (id: string): Promise<void> => {
    await apiClient.delete(`/transcripts/${id}`)
  },
  getExports: async (): Promise<ExportItem[]> => {
    const { data } = await apiClient.get<BackendExport[]>("/exports")
    return data.map(mapExport)
  },
  uploadAudio: async (file: File, onProgress?: (percentage: number) => void): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append("file", file)
    const { data } = await apiClient.post<UploadResponse>("/uploads/audio", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 120_000,
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (!event.total) {
          return
        }
        onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)))
      },
    })
    return data
  },
  getSettings: async (): Promise<BackendSettings> => {
    const { data } = await apiClient.get<BackendSettings>("/settings")
    return data
  },
  updateSettings: async (settings: Partial<BackendSettings>): Promise<BackendSettings> => {
    const { data } = await apiClient.put<BackendSettings>("/settings", settings)
    return data
  },
  getProfile: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get<UserProfile>("/users/me")
    return data
  },
  updateProfile: async (profile: Pick<UserProfile, "full_name" | "avatar_url">): Promise<UserProfile> => {
    const { data } = await apiClient.put<UserProfile>("/users/me", profile)
    return data
  },
  downloadTranscriptExport: async (id: string, format: ExportFormat): Promise<void> => {
    const lower = format.toLowerCase()
    await downloadBlob(`/export/${lower}/${id}`, `transcript.${lower}`)
  },
  createTranscriptionSocket: () => {
    const wsBaseUrl = apiBaseUrl.replace(/^http/, "ws").replace(/\/api$/, "")
    return new WebSocket(`${wsBaseUrl}/ws/transcribe`)
  },
}
