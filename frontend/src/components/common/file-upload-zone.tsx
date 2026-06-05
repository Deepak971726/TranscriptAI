import { motion } from "framer-motion"
import { FileAudio, UploadCloud } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const supportedExtensions = ["mp3", "wav", "webm", "m4a", "aac"]

type FileUploadZoneProps = {
  onFileAccepted: (file: File) => void
}

export function FileUploadZone({ onFileAccepted }: FileUploadZoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateAndAccept = (file?: File) => {
    if (!file) {
      return
    }

    const extension = file.name.split(".").pop()?.toLowerCase()

    if (!extension || !supportedExtensions.includes(extension)) {
      toast.error("Unsupported audio format")
      return
    }

    if (file.size > 250 * 1024 * 1024) {
      toast.error("File must be under 250 MB")
      return
    }

    onFileAccepted(file)
  }

  return (
    <motion.div
      animate={{ scale: dragging ? 1.01 : 1 }}
      className={cn(
        "relative flex min-h-80 flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed bg-card p-8 text-center transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border",
      )}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        validateAndAccept(event.dataTransfer.files[0])
      }}
    >
      <div className="absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,oklch(0.68_0.16_185),transparent)]" />
      <span className="flex size-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <UploadCloud className="size-7" />
      </span>
      <h2 className="mt-5 text-xl font-semibold">Drop audio here</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">MP3, WAV, WEBM, M4A, and AAC files are supported.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {supportedExtensions.map((format) => (
          <span key={format} className="rounded-md border bg-muted px-2.5 py-1 text-xs font-medium uppercase text-muted-foreground">
            {format}
          </span>
        ))}
      </div>
      <Button className="mt-7" onClick={() => inputRef.current?.click()}>
        <FileAudio className="size-4" />
        Browse Files
      </Button>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept=".mp3,.wav,.webm,.m4a,.aac,audio/*"
        onChange={(event) => validateAndAccept(event.target.files?.[0])}
      />
    </motion.div>
  )
}
