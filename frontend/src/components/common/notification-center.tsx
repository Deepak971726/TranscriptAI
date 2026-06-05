import { AlertCircle, Bell, CheckCircle2, Clock3, Info, Loader2, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useNotificationStore } from "@/stores/notification-store"
import type { ActivityLevel } from "@/types"

const notificationIcons = {
  info: Info,
  progress: Loader2,
  success: CheckCircle2,
  warning: Clock3,
  error: AlertCircle,
} satisfies Record<ActivityLevel, typeof Info>

const notificationTones: Record<ActivityLevel, string> = {
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  progress: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  error: "bg-destructive/10 text-destructive",
}

function formatNotificationTime(timestamp: string) {
  const date = new Date(timestamp)
  const today = new Date()
  const sameDay = date.toDateString() === today.toDateString()

  return new Intl.DateTimeFormat("en", sameDay ? { hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric" }).format(date)
}

export function NotificationCenter() {
  const navigate = useNavigate()
  const notifications = useNotificationStore((state) => state.notifications)
  const markAllRead = useNotificationStore((state) => state.markAllRead)
  const clearNotifications = useNotificationStore((state) => state.clearNotifications)
  const unreadCount = notifications.filter((item) => !item.read).length

  return (
    <DropdownMenu onOpenChange={(open) => open && markAllRead()}>
      <DropdownMenuTrigger asChild>
        <Button aria-label={`${unreadCount} unread notifications`} className="relative shrink-0" size="icon" variant="ghost">
          <Bell />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(24rem,calc(100vw-1rem))] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Important upload and processing updates.</p>
          </div>
          {notifications.length > 0 && (
            <Button aria-label="Clear notifications" className="shrink-0" size="icon" variant="ghost" onClick={clearNotifications}>
              <Trash2 />
            </Button>
          )}
        </div>

        <div className="max-h-[26rem] overflow-y-auto p-1">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto size-7 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No notifications</p>
              <p className="mt-1 text-xs text-muted-foreground">New processing updates will appear here.</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = notificationIcons[notification.level]

              return (
                <DropdownMenuItem
                  className={cn("items-start gap-3 p-3", !notification.read && "bg-primary/5")}
                  key={notification.id}
                  onSelect={() => notification.href && navigate(notification.href)}
                >
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", notificationTones[notification.level])}>
                    <Icon className={cn("size-4", notification.level === "progress" && "animate-spin")} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-medium">{notification.title}</p>
                      <time className="shrink-0 text-[11px] text-muted-foreground" dateTime={notification.timestamp}>
                        {formatNotificationTime(notification.timestamp)}
                      </time>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{notification.detail}</p>
                  </div>
                </DropdownMenuItem>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
