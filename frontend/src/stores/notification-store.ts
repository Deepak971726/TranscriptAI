import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { UserNotification } from "@/types"

type NewNotification = Omit<UserNotification, "id" | "read" | "timestamp"> & {
  id?: string
  read?: boolean
  timestamp?: string
}

type NotificationState = {
  notifications: UserNotification[]
  addNotification: (notification: NewNotification) => void
  markAllRead: () => void
  clearNotifications: () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (notification) =>
        set((state) => {
          if (
            notification.dedupeKey &&
            state.notifications.some((item) => item.dedupeKey === notification.dedupeKey)
          ) {
            return state
          }

          const next: UserNotification = {
            ...notification,
            id: notification.id ?? crypto.randomUUID(),
            read: notification.read ?? false,
            timestamp: notification.timestamp ?? new Date().toISOString(),
          }

          return { notifications: [next, ...state.notifications].slice(0, 30) }
        }),
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((item) => ({ ...item, read: true })),
        })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: "transcribeai-notifications",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
