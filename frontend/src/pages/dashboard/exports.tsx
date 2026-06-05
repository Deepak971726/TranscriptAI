import { useQuery } from "@tanstack/react-query"
import { Download, File, FileText, Sheet } from "lucide-react"
import { toast } from "sonner"
import { MetricCard } from "@/components/common/metric-card"
import { PageTransition } from "@/components/common/page-transition"
import { TableSkeleton } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Exports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review PDF, TXT, and DOCX exports generated from transcripts.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard title="PDF Exports" value={countByFormat("PDF").toString()} detail="Formatted transcript packages" icon={formatIcons.PDF} />
          <MetricCard title="TXT Exports" value={countByFormat("TXT").toString()} detail="Plain text transcript files" icon={formatIcons.TXT} />
          <MetricCard title="DOCX Exports" value={countByFormat("DOCX").toString()} detail="Editable document exports" icon={formatIcons.DOCX} />
        </div>

        {isLoading && <TableSkeleton rows={5} />}
        {data && (
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transcript</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => {
                    const Icon = formatIcons[item.format]
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.transcriptName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="size-4 text-primary" />
                            {item.format}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
                        <TableCell>{item.size}</TableCell>
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
        )}
      </div>
    </PageTransition>
  )
}
