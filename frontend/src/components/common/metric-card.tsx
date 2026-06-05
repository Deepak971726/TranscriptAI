import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type MetricCardProps = {
  title: string
  value: string
  detail: string
  icon: LucideIcon
  className?: string
}

export function MetricCard({ title, value, detail, icon: Icon, className }: MetricCardProps) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.18 }}>
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{value}</div>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
