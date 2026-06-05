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
          "peer h-13 w-full rounded-md border border-slate-200/90 bg-white/70 px-3.5 pb-2 pt-5 text-sm text-slate-950 outline-none transition-[border-color,box-shadow,background-color,transform] duration-200 hover:border-slate-300 focus:border-cyan-500/60 focus:bg-white focus:shadow-[0_0_0_4px_rgba(6,182,212,0.10),0_10px_25px_rgba(8,145,178,0.07)] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3.5 top-2 text-[10px] font-semibold uppercase text-cyan-700 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-xs peer-placeholder-shown:font-medium peer-placeholder-shown:normal-case peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:uppercase peer-focus:text-cyan-700"
      >
        {label}
      </label>
    </div>
  )
}
