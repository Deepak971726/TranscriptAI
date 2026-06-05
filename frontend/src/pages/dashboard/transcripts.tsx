import { useQuery } from "@tanstack/react-query"
import { Download, Eye, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { PageTransition } from "@/components/common/page-transition"
import { SearchEmptyState, TableSkeleton } from "@/components/common/states"
import { StatusBadge } from "@/components/common/status-badge"
import { languages } from "@/data/mock-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"
import { formatDate, formatDuration } from "@/lib/utils"

export function TranscriptsPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({ queryKey: ["transcripts"], queryFn: api.getTranscripts })
  const [search, setSearch] = useState("")
  const [language, setLanguage] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const filtered = useMemo(() => {
    return (data ?? []).filter((transcript) => {
      const matchesSearch = transcript.fileName.toLowerCase().includes(search.toLowerCase())
      const matchesLanguage = language === "all" || transcript.language === language
      const created = new Date(transcript.createdAt).getTime()
      const matchesFrom = !fromDate || created >= new Date(fromDate).getTime()
      const matchesTo = !toDate || created <= new Date(toDate).getTime()
      return matchesSearch && matchesLanguage && matchesFrom && matchesTo
    })
  }, [data, fromDate, language, search, toDate])

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Transcripts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Browse, filter, edit, delete, and export transcript history.</p>
        </div>

        <Card>
          <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_180px_160px_160px]">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search file name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All languages</SelectItem>
                  {languages.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From</Label>
              <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </div>
          </CardContent>
        </Card>

        {isLoading && <TableSkeleton />}
        {!isLoading && filtered.length === 0 && <SearchEmptyState />}
        {!isLoading && filtered.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((transcript) => (
                    <TableRow key={transcript.id}>
                      <TableCell className="font-medium">{transcript.fileName}</TableCell>
                      <TableCell>{transcript.language}</TableCell>
                      <TableCell>{formatDuration(transcript.duration)}</TableCell>
                      <TableCell>
                        <StatusBadge status={transcript.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(transcript.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => navigate(`/transcripts/${transcript.id}`)}>
                              <Eye className="size-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => navigate(`/transcripts/${transcript.id}`)}>
                              <Pencil className="size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => toast.success("Export queued")}>
                              <Download className="size-4" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => toast.success("Transcript deleted")}>
                              <Trash2 className="size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  )
}
