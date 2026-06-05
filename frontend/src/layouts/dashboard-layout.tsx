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
    <div className="flex h-full flex-col border-r bg-card/95 backdrop-blur-xl">
      <div className="flex h-16 items-center border-b px-5">
        <AppLogo />
      </div>
      <div className="px-4 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-3">
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
                  "group relative flex h-10 items-center gap-3 overflow-hidden rounded-md px-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent/80 hover:text-accent-foreground",
                  isActive && "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_14%,transparent)]",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="sidebar-active" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />}
                  <item.icon className="relative size-4 transition-transform group-hover:scale-105" />
                  <span className="relative">{item.label}</span>
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>
      <div className="border-t p-4">
        <div className="relative overflow-hidden rounded-lg border bg-muted/45 p-3.5">
          <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--primary),transparent)] opacity-50" />
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileAudio className="size-4 text-primary" />
            Pro workspace
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">42 hours remaining</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background">
            <div className="h-full w-[68%] rounded-full bg-[linear-gradient(90deg,var(--primary),oklch(0.74_0.14_145))]" />
          </div>
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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/82 px-4 shadow-[0_1px_0_color-mix(in_oklch,var(--border)_75%,transparent)] backdrop-blur-xl lg:px-6">
      <Button aria-label="Open navigation" className="shrink-0 lg:hidden" size="icon" variant="ghost" onClick={onMenuClick}>
        <Menu />
      </Button>
      <div className="relative hidden min-w-0 max-w-xl flex-1 sm:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-9 border-transparent bg-muted/55 pl-9 shadow-none hover:border-border focus-visible:border-primary/35" placeholder="Search transcripts, files, exports" />
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
    <div className="min-h-screen w-full overflow-x-hidden bg-background">
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
        <main className="mx-auto min-w-0 w-full max-w-[90rem] px-4 py-6 sm:px-5 sm:py-7 lg:px-7 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
