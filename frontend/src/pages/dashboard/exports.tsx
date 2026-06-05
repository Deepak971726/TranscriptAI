import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Download, File, FileText, Sheet } from "lucide-react"
import { toast } from "sonner"
import { MetricCard } from "@/components/common/metric-card"
import { PageHeader } from "@/components/common/page-header"
import { PageTransition } from "@/components/common/page-transition"
import { TableSkeleton } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"
import { staggerItem } from "@/lib/motion"
import { formatDate } from "@/lib/utils"
import type { ExportFormat } from "@/types"

const formatIcons = {
  PDF: FileText,
  TXT: File,
  DOCX: Sheet,
}

export function ExportsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["exports"], queryFn: api.getExports })
  const countByFormat = (format: ExportFormat) => data?.filter((item) => item.format === format).length ?? 0

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-7">
        <PageHeader
          eyebrow="Document delivery"
          title="Export history"
          description="Review generated files and download transcript packages in the format your workflow needs."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard title="PDF Exports" value={countByFormat("PDF").toString()} detail="Formatted transcript packages" icon={formatIcons.PDF} accent="rose" />
          <MetricCard title="TXT Exports" value={countByFormat("TXT").toString()} detail="Plain text transcript files" icon={formatIcons.TXT} accent="blue" />
          <MetricCard title="DOCX Exports" value={countByFormat("DOCX").toString()} detail="Editable document exports" icon={formatIcons.DOCX} accent="teal" />
        </div>

        {isLoading && <TableSkeleton rows={5} />}
        {data && (
          <motion.div variants={staggerItem}>
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Export History</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Files generated from completed transcripts.</p>
              </CardHeader>
              <CardContent>
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transcript</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="hidden sm:table-cell">Size</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => {
                    const Icon = formatIcons[item.format]
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="max-w-56 break-words font-medium [overflow-wrap:anywhere]">{item.transcriptName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="size-4 text-primary" />
                            {item.format}
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(item.createdAt)}</TableCell>
                        <TableCell className="hidden sm:table-cell">{item.size}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => toast.success("Download started")}>
                            <Download className="size-4" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
