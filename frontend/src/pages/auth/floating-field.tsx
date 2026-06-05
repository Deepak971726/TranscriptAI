import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

type FloatingFieldProps = Omit<ComponentProps<"input">, "placeholder"> & {
  label: string
}

export function FloatingField({ id, label, className, ...props }: FloatingFieldProps) {
  return (
    <div className="group relative">
      <input
        id={id}
        placeholder=" "
        className={cn(
          "auth-reference-input peer h-13 w-full rounded-md border px-3.5 pb-2 pt-5 text-sm outline-none transition-[border-color,box-shadow,background-color,transform] duration-200 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      <label
        htmlFor={id}
        className="auth-reference-floating-label pointer-events-none absolute left-3.5 top-2 text-[10px] font-semibold uppercase transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-xs peer-placeholder-shown:font-medium peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:uppercase"
      >
        {label}
      </label>
    </div>
  )
}
