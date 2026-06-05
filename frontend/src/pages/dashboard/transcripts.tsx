import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Download, Eye, MoreHorizontal, Pencil, Search, Trash2, Upload } from "lucide-react"
import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { PageHeader } from "@/components/common/page-header"
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
import { staggerItem } from "@/lib/motion"
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
      <div className="space-y-6 sm:space-y-7">
        <PageHeader
          eyebrow="Transcript library"
          title="All transcripts"
          description="Search recordings, review processing status, and open completed transcripts for editing or export."
          actions={
            <Button asChild>
              <Link to="/upload">
                <Upload />
                Upload audio
              </Link>
            </Button>
          }
        />

        <motion.div variants={staggerItem}>
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
        </motion.div>

        {isLoading && <TableSkeleton />}
        {!isLoading && filtered.length === 0 && <SearchEmptyState />}
        {!isLoading && filtered.length > 0 && (
          <motion.div variants={staggerItem}>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <p className="text-sm font-medium">{filtered.length} transcripts</p>
                  <p className="text-xs text-muted-foreground">Most recent first</p>
                </div>
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead className="hidden md:table-cell">Language</TableHead>
                    <TableHead className="hidden sm:table-cell">Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Created Date</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((transcript) => (
                    <TableRow key={transcript.id}>
                      <TableCell className="max-w-52 break-words font-medium [overflow-wrap:anywhere]">{transcript.fileName}</TableCell>
                      <TableCell className="hidden md:table-cell">{transcript.language}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDuration(transcript.duration)}</TableCell>
                      <TableCell>
                        <StatusBadge status={transcript.status} />
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(transcript.createdAt)}</TableCell>
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
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
