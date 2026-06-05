import { Eye, EyeOff } from "lucide-react"
import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { FloatingField } from "@/pages/auth/floating-field"

type PasswordFieldProps = {
  id: string
  name: string
  label: string
  autoComplete?: string
  action?: ReactNode
}

export function PasswordField({
  id,
  name,
  label,
  autoComplete = "current-password",
  action,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-2.5">
      <div className="relative">
        <FloatingField
          id={id}
          label={label}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className="pr-12"
          required
        />
        <Button
          type="button"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-1.5 top-1/2 size-9 -translate-y-1/2 text-slate-400 hover:translate-y-[-50%] hover:bg-cyan-50 hover:text-cyan-700"
          size="icon"
          variant="ghost"
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff /> : <Eye />}
        </Button>
      </div>
      {action && <div className="flex justify-end">{action}</div>}
    </div>
  )
}
