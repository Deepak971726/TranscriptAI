import { motion } from "framer-motion"
import {
  Download,
  FileAudio,
  FileText,
  LayoutDashboard,
  Menu,
  Mic2,
  Search,
  Settings,
  Upload,
} from "lucide-react"
import { useState } from "react"
import { NavLink, Outlet } from "react-router-dom"
import { AppLogo } from "@/components/common/app-logo"
import { NotificationCenter } from "@/components/common/notification-center"
import { ThemeToggle } from "@/components/common/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Upload Audio", to: "/upload", icon: Upload },
  { label: "Live Recording", to: "/record", icon: Mic2 },
  { label: "Transcripts", to: "/transcripts", icon: FileText },
  { label: "Exports", to: "/exports", icon: Download },
  { label: "Settings", to: "/settings", icon: Settings },
]

type SidebarProps = {
  onNavigate?: () => void
}

function AppSidebar({ onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full flex-col border-r bg-card">
      <div className="flex h-16 items-center px-5">
        <AppLogo />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item, index) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.035 }}
          >
            <NavLink
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-primary/10 text-primary",
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          </motion.div>
        ))}
      </nav>
      <div className="border-t p-4">
        <div className="rounded-lg bg-muted/60 p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileAudio className="size-4 text-primary" />
            Pro workspace
          </div>
          <p className="mt-1 text-xs text-muted-foreground">42 hours remaining this month</p>
        </div>
      </div>
    </div>
  )
}

function DashboardTopNav({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const displayName = user?.user_metadata.full_name || user?.email || "User"
  const initials = displayName
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl lg:px-6">
      <Button aria-label="Open navigation" className="shrink-0 lg:hidden" size="icon" variant="ghost" onClick={onMenuClick}>
        <Menu />
      </Button>
      <div className="relative hidden min-w-0 max-w-xl flex-1 sm:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-9 bg-muted/50 pl-9" placeholder="Search transcripts, files, exports" />
      </div>
      <div className="flex-1 sm:hidden" />
      <Button aria-label="Search" className="shrink-0 sm:hidden" size="icon" variant="ghost">
        <Search />
      </Button>
      <div className="shrink-0">
        <ThemeToggle />
      </div>
      <NotificationCenter />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="min-w-0 shrink-0 gap-2 px-2" variant="ghost">
            <Avatar className="size-7">
              <AvatarImage src={user?.user_metadata.avatar_url} />
              <AvatarFallback>{initials || "U"}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-32 truncate text-sm sm:inline">{displayName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              void signOut()
            }}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

export function DashboardLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-muted/25">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <AppSidebar />
      </aside>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="left-0 top-0 h-full w-[min(20rem,calc(100vw-1rem))] max-w-none translate-x-0 translate-y-0 rounded-none p-0 sm:max-w-none">
          <AppSidebar onNavigate={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
      <div className="min-w-0 lg:pl-64">
        <DashboardTopNav onMenuClick={() => setOpen(true)} />
        <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-5 sm:py-6 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
