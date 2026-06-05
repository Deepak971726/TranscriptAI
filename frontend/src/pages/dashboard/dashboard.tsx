import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { ArrowRight, Clock, FileAudio, FileText, Globe2, Mic2, Sparkles, Upload } from "lucide-react"
import { Link } from "react-router-dom"
import { MetricCard } from "@/components/common/metric-card"
import { PageHeader } from "@/components/common/page-header"
import { PageTransition } from "@/components/common/page-transition"
import { StatusBadge } from "@/components/common/status-badge"
import { CardGridSkeleton, ErrorState, TableSkeleton } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"
import { hoverLift, staggerItem } from "@/lib/motion"
import { formatDate, formatDuration } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const statsQuery = useQuery({ queryKey: ["dashboard-stats"], queryFn: api.getDashboardStats })
  const activityQuery = useQuery({ queryKey: ["recent-activity"], queryFn: api.getRecentActivity })
  const transcriptsQuery = useQuery({ queryKey: ["transcripts"], queryFn: api.getTranscripts })
  const displayName = user?.user_metadata.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there"

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-7">
        <PageHeader
          eyebrow="Workspace overview"
          title={`Welcome back, ${displayName}`}
          description="Monitor transcription volume, recent processing, and the recordings that need your attention."
          actions={
            <>
              <Button asChild variant="outline">
                <Link to="/record">
                  <Mic2 />
                  Record live
                </Link>
              </Button>
              <Button asChild>
                <Link to="/upload">
                  <Upload />
                  Upload audio
                </Link>
              </Button>
            </>
          }
        />

        {statsQuery.isLoading && <CardGridSkeleton />}
        {statsQuery.isError && <ErrorState />}
        {statsQuery.data && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total Transcripts"
              value={statsQuery.data.totalTranscripts.toLocaleString()}
              detail="+12.4% from last month"
              icon={FileText}
              accent="teal"
            />
            <MetricCard
              title="Total Audio Files"
              value={statsQuery.data.totalAudioFiles.toLocaleString()}
              detail="Uploads and recordings"
              icon={FileAudio}
              accent="blue"
            />
            <MetricCard
              title="Processing Time"
              value={formatDuration(statsQuery.data.totalProcessingTime)}
              detail="Audio converted by AI"
              icon={Clock}
              accent="amber"
            />
            <MetricCard
              title="Languages Used"
              value={statsQuery.data.languagesUsed.toString()}
              detail="Across all transcripts"
              icon={Globe2}
              accent="rose"
            />
          </div>
        )}

        <motion.div variants={staggerItem} className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          {activityQuery.isLoading && <TableSkeleton rows={4} />}
          {activityQuery.isError && <ErrorState />}
          {activityQuery.data && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Latest workspace processing events.</p>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/transcripts">
                    View all
                    <ArrowRight />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityQuery.data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.title}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{item.detail}</div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transcripts</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Ready for review and export.</p>
              </div>
              <Sparkles className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              {transcriptsQuery.isLoading && <TableSkeleton rows={3} />}
              {transcriptsQuery.isError && <ErrorState />}
              {transcriptsQuery.data && (
                <div className="space-y-3">
                  {transcriptsQuery.data.slice(0, 4).map((transcript, index) => (
                    <motion.div
                      key={transcript.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      whileHover={hoverLift}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-background/45 p-3.5 transition-colors hover:border-primary/25 hover:bg-accent/35"
                    >
                      <div className="min-w-0">
                        <Link
                          className="block truncate text-sm font-medium transition-colors hover:text-primary"
                          to={`/transcripts/${transcript.id}`}
                        >
                          {transcript.fileName}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDuration(transcript.duration)} · {transcript.language}
                        </p>
                      </div>
                      <StatusBadge status={transcript.status} />
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.section
          variants={staggerItem}
          className="relative overflow-hidden rounded-lg border bg-[linear-gradient(120deg,color-mix(in_oklch,var(--primary)_10%,var(--card)),var(--card)_48%,color-mix(in_oklch,oklch(0.78_0.14_85)_8%,var(--card)))] p-5 sm:p-6"
        >
          <span className="absolute inset-y-0 left-0 w-1 bg-[linear-gradient(var(--primary),oklch(0.75_0.14_145))]" />
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold">Quick Actions</h2>
              <p className="mt-1 text-sm text-muted-foreground">Move directly into your next transcription workflow.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to="/upload">Upload Audio</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/record">Start Recording</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/exports">View Exports</Link>
              </Button>
            </div>
          </div>
        </motion.section>
      </div>
    </PageTransition>
  )
}
