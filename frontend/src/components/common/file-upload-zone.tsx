import { motion } from "framer-motion"
import { FileAudio, ShieldCheck, UploadCloud, Zap } from "lucide-react"
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
      animate={{
        scale: dragging ? 1.008 : 1,
        boxShadow: dragging
          ? "0 24px 60px color-mix(in oklch, var(--primary) 18%, transparent)"
          : "0 12px 34px hsl(var(--surface-shadow) / 0.05)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={cn(
        "ambient-grid relative flex min-h-[22rem] flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed bg-card/90 p-6 text-center transition-colors sm:p-10",
        dragging ? "border-primary bg-primary/[0.07]" : "border-border hover:border-primary/35",
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
      <motion.span
        animate={dragging ? { y: [-2, 2, -2], scale: [1, 1.04, 1] } : { y: [0, -4, 0] }}
        transition={{ duration: dragging ? 1.1 : 3.4, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex size-16 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary shadow-sm"
      >
        <span className="absolute inset-2 rounded-md border border-primary/10" />
        <UploadCloud className="relative size-7" />
      </motion.span>
      <h2 className="mt-6 text-xl font-semibold">{dragging ? "Release to upload" : "Drop audio here"}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Select a recording and TranscribeAI will validate, upload, and queue it for processing.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {supportedExtensions.map((format) => (
          <span key={format} className="rounded-md border bg-background/80 px-2.5 py-1 text-xs font-medium uppercase text-muted-foreground shadow-sm">
            {format}
          </span>
        ))}
      </div>
      <Button type="button" className="mt-7" onClick={() => inputRef.current?.click()}>
        <FileAudio className="size-4" />
        Browse Files
      </Button>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-300" />
          Secure upload
        </span>
        <span className="flex items-center gap-1.5">
          <Zap className="size-3.5 text-amber-600 dark:text-amber-300" />
          Up to 250 MB
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        aria-label="Choose an audio file"
        accept=".mp3,.wav,.webm,.m4a,.aac,audio/*"
        onChange={(event) => validateAndAccept(event.target.files?.[0])}
      />
    </motion.div>
  )
}
