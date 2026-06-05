import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Camera, Lock, Save, ShieldCheck } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/common/page-header"
import { PageTransition } from "@/components/common/page-transition"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "@/hooks/use-theme"
import { api } from "@/lib/api"
import { useAuthStore } from "@/stores/auth-store"

export function SettingsPage() {
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  const user = useAuthStore((state) => state.user)
  const settingsQuery = useQuery({ queryKey: ["settings"], queryFn: api.getSettings })
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: api.getProfile })
  const [profileForm, setProfileForm] = useState({ full_name: "", avatar_url: "" })

  useEffect(() => {
    if (profileQuery.data) {
      setProfileForm({
        full_name: profileQuery.data.full_name ?? "",
        avatar_url: profileQuery.data.avatar_url ?? "",
      })
    }
  }, [profileQuery.data])

  const profileEmail = profileQuery.data?.email ?? user?.email ?? ""
  const metadataName = typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : ""
  const metadataAvatar = typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : ""
  const profileName = profileForm.full_name.trim() || metadataName || profileEmail.split("@")[0] || "User"
  const avatarUrl = profileForm.avatar_url || metadataAvatar || undefined
  const initials = useMemo(
    () =>
      profileName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase(),
    [profileName],
  )

  const profileMutation = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] })
      toast.success("Profile saved")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Profile update failed")
    },
  })

  const settingsMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: (settings) => {
      setTheme(settings.theme)
      void queryClient.invalidateQueries({ queryKey: ["settings"] })
      toast.success("Application settings saved")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Settings update failed")
    },
  })

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-7">
        <PageHeader
          eyebrow="Workspace preferences"
          title="Settings"
          description="Manage your profile identity, interface preferences, notifications, and account security."
        />

        <Tabs defaultValue="profile">
          <TabsList className="w-full justify-start overflow-x-auto border bg-card/80 p-1 shadow-sm sm:w-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="application">Application</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle>Profile settings</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">The identity shown across your workspace.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <form
                  className="space-y-6"
                  onSubmit={(event) => {
                    event.preventDefault()
                    profileMutation.mutate({
                      full_name: profileForm.full_name.trim() || null,
                      avatar_url: profileForm.avatar_url.trim() || null,
                    })
                  }}
                >
                  <div className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center">
                    <Avatar className="size-16 border-2 border-background shadow-md">
                      <AvatarImage src={avatarUrl} alt={profileName} />
                      <AvatarFallback>{initials || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{profileName}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{profileEmail}</p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => document.getElementById("avatar-url")?.focus()}>
                      <Camera />
                      Change avatar
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="profile-name">Name</Label>
                      <Input
                        id="profile-name"
                        value={profileForm.full_name}
                        disabled={profileQuery.isLoading}
                        onChange={(event) => setProfileForm((current) => ({ ...current, full_name: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-email">Email</Label>
                      <Input id="profile-email" type="email" value={profileEmail} disabled readOnly />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="avatar-url">Avatar URL</Label>
                      <Input
                        id="avatar-url"
                        value={profileForm.avatar_url}
                        disabled={profileQuery.isLoading}
                        onChange={(event) => setProfileForm((current) => ({ ...current, avatar_url: event.target.value }))}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={profileQuery.isLoading || profileMutation.isPending}>
                    <Save className="size-4" />
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="application">
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle>Application settings</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Interface and notification preferences.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select
                      value={settingsQuery.data?.theme ?? theme}
                      onValueChange={(value) => {
                        settingsMutation.mutate({ theme: value as "light" | "dark" | "system" })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={settingsQuery.data?.language ?? "English"}
                      onValueChange={(value) => settingsMutation.mutate({ language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-4">
                  <div>
                    <p className="text-sm font-medium">Notifications</p>
                    <p className="mt-1 text-xs text-muted-foreground">Processing, export, and account alerts.</p>
                  </div>
                  <Switch
                    checked={settingsQuery.data?.notifications_enabled ?? true}
                    onCheckedChange={(checked) => settingsMutation.mutate({ notifications_enabled: checked })}
                  />
                </div>
                <Button
                  disabled={settingsMutation.isPending}
                  onClick={() =>
                    settingsMutation.mutate({
                      theme: settingsQuery.data?.theme ?? theme,
                      language: settingsQuery.data?.language ?? "English",
                      notifications_enabled: settingsQuery.data?.notifications_enabled ?? true,
                    })
                  }
                >
                  <Save className="size-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle>Security settings</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Password and sign-in protection.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input type="password" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-4">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 size-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Two Factor Authentication</p>
                      <p className="mt-1 text-xs text-muted-foreground">Require a second verification step on sign in.</p>
                    </div>
                  </div>
                  <Switch />
                </div>
                <Button onClick={() => toast.success("Security settings saved")}>
                  <Lock className="size-4" />
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  )
}
