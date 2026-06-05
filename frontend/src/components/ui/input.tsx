import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

export function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-md border border-input bg-background/75 px-3.5 py-2 text-sm shadow-[inset_0_1px_0_color-mix(in_oklch,var(--foreground)_3%,transparent)] outline-none transition-[border-color,box-shadow,background-color] duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/75 hover:border-foreground/20 focus-visible:border-primary/55 focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}
