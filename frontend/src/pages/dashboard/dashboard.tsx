import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Clock, FileAudio, FileText, Globe2, Mic2, Upload } from "lucide-react"
import { Link } from "react-router-dom"
import { MetricCard } from "@/components/common/metric-card"
import { PageTransition } from "@/components/common/page-transition"
import { StatusBadge } from "@/components/common/status-badge"
import { CardGridSkeleton, ErrorState, TableSkeleton } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"
import { formatDate, formatDuration } from "@/lib/utils"

export function DashboardPage() {
  const statsQuery = useQuery({ queryKey: ["dashboard-stats"], queryFn: api.getDashboardStats })
  const activityQuery = useQuery({ queryKey: ["recent-activity"], queryFn: api.getRecentActivity })
  const transcriptsQuery = useQuery({ queryKey: ["transcripts"], queryFn: api.getTranscripts })

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Workspace overview for audio, transcripts, and exports.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/record">
                <Mic2 className="size-4" />
                Record
              </Link>
            </Button>
            <Button asChild>
              <Link to="/upload">
                <Upload className="size-4" />
                Upload Audio
              </Link>
            </Button>
          </div>
        </div>

        {statsQuery.isLoading && <CardGridSkeleton />}
        {statsQuery.isError && <ErrorState />}
        {statsQuery.data && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Total Transcripts" value={statsQuery.data.totalTranscripts.toLocaleString()} detail="+12.4% from last month" icon={FileText} />
            <MetricCard title="Total Audio Files" value={statsQuery.data.totalAudioFiles.toLocaleString()} detail="Uploads and recordings" icon={FileAudio} />
            <MetricCard title="Total Processing Time" value={formatDuration(statsQuery.data.totalProcessingTime)} detail="AI processing completed" icon={Clock} />
            <MetricCard title="Languages Used" value={statsQuery.data.languagesUsed.toString()} detail="Across all transcripts" icon={Globe2} />
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          {activityQuery.isLoading && <TableSkeleton rows={4} />}
          {activityQuery.isError && <ErrorState />}
          {activityQuery.data && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
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
                          <div className="text-xs text-muted-foreground">{item.detail}</div>
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
            <CardHeader>
              <CardTitle>Recent Transcripts</CardTitle>
            </CardHeader>
            <CardContent>
              {transcriptsQuery.isLoading && (
                <div className="space-y-3">
                  <TableSkeleton rows={3} />
                </div>
              )}
              {transcriptsQuery.isError && <ErrorState />}
              {transcriptsQuery.data && (
                <div className="space-y-3">
                  {transcriptsQuery.data.slice(0, 4).map((transcript, index) => (
                    <motion.div
                      key={transcript.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="min-w-0">
                        <Link className="truncate text-sm font-medium hover:text-primary" to={`/transcripts/${transcript.id}`}>
                          {transcript.fileName}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDuration(transcript.duration)} · {transcript.language}</p>
                      </div>
                      <StatusBadge status={transcript.status} />
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <section className="rounded-lg border bg-card p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold">Quick Actions</h2>
              <p className="mt-1 text-sm text-muted-foreground">Start the common transcription workflows from one place.</p>
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
        </section>
      </div>
    </PageTransition>
  )
}
