import { motion } from "framer-motion"
import type { ReactNode } from "react"
import { staggerItem } from "@/lib/motion"
import { cn } from "@/lib/utils"

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <motion.header
      variants={staggerItem}
      className={cn("flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", className)}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
        )}
        <h1 className="text-balance text-2xl font-semibold leading-tight sm:text-[1.75rem]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">{actions}</div>}
    </motion.header>
  )
}
