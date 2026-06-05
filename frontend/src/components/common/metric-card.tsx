import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { hoverLift, staggerItem } from "@/lib/motion"
import { cn } from "@/lib/utils"

type MetricCardProps = {
  title: string
  value: string
  detail: string
  icon: LucideIcon
  className?: string
  accent?: "teal" | "blue" | "amber" | "rose"
}

const accentStyles = {
  teal: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
}

export function MetricCard({ title, value, detail, icon: Icon, className, accent = "teal" }: MetricCardProps) {
  return (
    <motion.div variants={staggerItem} whileHover={hoverLift}>
      <Card className={cn("group relative h-full overflow-hidden transition-colors hover:border-primary/25", className)}>
        <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_oklch,var(--primary)_55%,transparent),transparent)] opacity-0 transition-opacity group-hover:opacity-100" />
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <span className={cn("flex size-9 items-center justify-center rounded-md", accentStyles[accent])}>
            <Icon className="size-4" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold tracking-tight">{value}</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowUpRight className="size-3.5 text-primary" />
            <span>{detail}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
