"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { db, type Settings, type Profile } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n/language-context"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Users, Database, Film } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ProfileWithStats extends Profile {
  videosWatched?: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<Settings>>({})
  const [storageSize, setStorageSize] = useState<string>("Calculating...")
  const [activeProfile, setActiveProfile] = useState<ProfileWithStats | null>(null)
  const [allProfiles, setAllProfiles] = useState<ProfileWithStats[]>([])
  const [activeProfileAvatarEditUrl, setActiveProfileAvatarEditUrl] = useState("")
  const [activeProfileAvatarFilePreview, setActiveProfileAvatarFilePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { toast } = useToast()
  const { t } = useLanguage() // Removed currentLanguage as it's not used directly
  const { theme: currentNextTheme, setTheme: setNextTheme } = useTheme()

  useEffect(() => {
    loadInitialData()
    calculateStorage()
  }, [])

  useEffect(() => {
    if (settings.theme && settings.theme !== currentNextTheme) {
      setNextTheme(settings.theme)
    }
  }, [settings.theme, currentNextTheme, setNextTheme])

  const loadInitialData = async () => {
    await loadActiveProfileAndSettings()
    await loadAllProfilesWithStats()
  }

  const loadActiveProfileAndSettings = async () => {
    try {
      const profile = await db.getActiveProfile()
      if (profile) {
        const stats = await db.getProfileVideoStats(profile.id!)
        setActiveProfile({ ...profile, videosWatched: stats.totalVideosWatched })

        // If avatar is a Data URL (from upload), keep URL input empty. Otherwise, show the URL.
        if (profile.avatar && profile.avatar.startsWith("data:image")) {
          setActiveProfileAvatarEditUrl("")
        } else {
          setActiveProfileAvatarEditUrl(profile.avatar || "")
        }
        setActiveProfileAvatarFilePreview(null) // Always reset file preview on initial load

        if (profile.settings?.id) {
          const profileSettings = await db.settings.get(profile.settings.id)
          if (profileSettings) {
            setSettings(profileSettings)
          } else {
            await createDefaultSettingsForProfile(profile)
          }
        } else {
          await createDefaultSettingsForProfile(profile)
        }
      } else {
        // Handle case with no active profile (e.g., after full data clear)
        // This might involve creating a new default profile or guiding the user.
        // For now, assume a profile always exists or is created on app load.
        const firstProfile = await db.profiles.orderBy("id").first()
        if (firstProfile) {
          await db.switchProfile(firstProfile.id!)
          await loadActiveProfileAndSettings() // Recurse to load the newly activated profile
        }
      }
    } catch (error) {
      console.error("Error loading active profile and settings:", error)
      toast({ title: t.settings.loadError, variant: "destructive" })
    }
  }

  const createDefaultSettingsForProfile = async (profile: Profile) => {
    const defaultSettings: Omit<Settings, "id"> = {
      theme: "system",
      historyLimit: 500,
      videoQuality: "auto",
      bufferSize: "medium",
      autoplay: true,
      cinemaMode: false,
      audioOnlyMode: false,
    }
    const newId = await db.settings.add(defaultSettings as Settings)
    setSettings({ ...defaultSettings, id: newId })
    if (profile.id) {
      await db.profiles.update(profile.id, { settings: { id: newId } as Settings })
    }
  }

  const loadAllProfilesWithStats = async () => {
    const profiles = await db.profiles.toArray()
    const profilesWithStats: ProfileWithStats[] = []
    for (const profile of profiles) {
      const stats = await db.getProfileVideoStats(profile.id!)
      profilesWithStats.push({ ...profile, videosWatched: stats.totalVideosWatched })
    }
    setAllProfiles(profilesWithStats)
  }

  const calculateStorage = async () => {
    const size = await db.getStorageSize()
    setStorageSize(size)
  }

  const handleSettingChange = async (key: keyof Settings, value: any) => {
    if (!settings.id) {
      toast({ title: t.settings.noSettingsFoundError, variant: "destructive" })
      return
    }
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    try {
      await db.settings.update(settings.id, { [key]: value })
      if (key === "theme") setNextTheme(value)
      toast({ title: t.settings.saveSuccess })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({ title: t.settings.saveError, variant: "destructive" })
    }
  }

  const handleActiveProfileAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setActiveProfileAvatarFilePreview(reader.result as string)
        setActiveProfileAvatarEditUrl("") // Clear URL input when a file is chosen
      }
      reader.readAsDataURL(file)
    } else {
      setActiveProfileAvatarFilePreview(null)
    }
  }

  const handleSaveActiveProfileAvatar = async () => {
    if (!activeProfile || !activeProfile.id) return

    const finalAvatar = activeProfileAvatarFilePreview || activeProfileAvatarEditUrl || undefined

    try {
      await db.profiles.update(activeProfile.id, { avatar: finalAvatar })
      toast({ title: "Avatar updated" })
      setActiveProfile((prev) => (prev ? { ...prev, avatar: finalAvatar } : null))

      // If a file was uploaded and saved, ensure the URL input field state is empty
      if (activeProfileAvatarFilePreview) {
        setActiveProfileAvatarEditUrl("")
      }
      setActiveProfileAvatarFilePreview(null) // Clear file preview after saving

      setAllProfiles((prevProfiles) =>
        prevProfiles.map((p) => (p.id === activeProfile.id ? { ...p, avatar: finalAvatar } : p)),
      )
    } catch (error) {
      toast({ title: "Error updating avatar", variant: "destructive" })
    }
  }

  const handleRemoveActiveProfileAvatar = async () => {
    if (!activeProfile || !activeProfile.id) return
    try {
      await db.profiles.update(activeProfile.id, { avatar: undefined })
      toast({ title: "Avatar removed" })
      setActiveProfile((prev) => (prev ? { ...prev, avatar: undefined } : null))
      setActiveProfileAvatarEditUrl("")
      setActiveProfileAvatarFilePreview(null)
      setAllProfiles((prevProfiles) =>
        prevProfiles.map((p) => (p.id === activeProfile.id ? { ...p, avatar: undefined } : p)),
      )
    } catch (error) {
      toast({ title: "Error removing avatar", variant: "destructive" })
    }
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)

  const handleExport = async () => {
    try {
      const data = await db.exportData()
      if (data) {
        const blob = new Blob([data], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `video_app_backup_${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast({ title: t.settings.exportSuccess })
      }
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({ title: t.settings.exportError, variant: "destructive" })
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const json = e.target?.result as string
          const success = await db.importData(json)
          if (success) {
            toast({ title: t.settings.importSuccess })
            loadSettings() // Reload settings and potentially other data
            // Potentially force a reload or re-fetch of profile dependent data app-wide
          } else {
            toast({ title: t.settings.importError, variant: "destructive" })
          }
        } catch (err) {
          console.error("Import error:", err)
          toast({ title: t.settings.importErrorFormat, variant: "destructive" })
        }
      }
      reader.readAsText(file)
    }
  }

  const handleClearAllData = async () => {
    if (window.confirm(t.settings.confirmClearData)) {
      try {
        await db.clearAllData()
        toast({ title: t.settings.clearDataSuccess })
        // After clearing, create a new default profile and settings
        await db.createProfile("Default Profile")
        await loadSettings() // Reload to get new default settings
        calculateStorage()
        // Potentially redirect or force app reload
        window.location.reload()
      } catch (error) {
        console.error("Error clearing data:", error)
        toast({ title: t.settings.clearDataError, variant: "destructive" })
      }
    }
  }

  const historyLimitOptions = [
    { value: 50, label: t.settings.historyLimitValue(50) },
    { value: 100, label: t.settings.historyLimitValue(100) },
    { value: 500, label: t.settings.historyLimitValue(500) },
  ]

  const loadSettings = async () => {
    try {
      const activeProfile = await db.getActiveProfile()
      if (activeProfile && activeProfile.settings?.id) {
        const profileSettings = await db.settings.get(activeProfile.settings.id)
        if (profileSettings) {
          setSettings(profileSettings)
        } else {
          // Create default settings if not found
          const defaultSettings: Omit<Settings, "id"> = {
            theme: "system",
            historyLimit: 500,
            videoQuality: "auto",
            bufferSize: "medium",
            autoplay: true,
            cinemaMode: false,
            audioOnlyMode: false,
          }
          const newId = await db.settings.add(defaultSettings as Settings)
          setSettings({ ...defaultSettings, id: newId })
          if (activeProfile.id) {
            await db.profiles.update(activeProfile.id, { settings: { id: newId } as Settings })
          }
        }
      } else if (activeProfile) {
        // Profile exists but no settings linked
        const defaultSettings: Omit<Settings, "id"> = {
          theme: "system",
          historyLimit: 500,
          videoQuality: "auto",
          bufferSize: "medium",
          autoplay: true,
          cinemaMode: false,
          audioOnlyMode: false,
        }
        const newId = await db.settings.add(defaultSettings as Settings)
        setSettings({ ...defaultSettings, id: newId })
        if (activeProfile.id) {
          await db.profiles.update(activeProfile.id, { settings: { id: newId } as Settings })
        }
      } else {
        // No active profile, load first settings or default
        const allSettings = await db.settings.orderBy("id").limit(1).toArray()
        if (allSettings.length > 0) {
          setSettings(allSettings[0])
        } else {
          // Create truly default settings if DB is empty
          const defaultSettings: Omit<Settings, "id"> = {
            theme: "system",
            historyLimit: 500,
            videoQuality: "auto",
            bufferSize: "medium",
            autoplay: true,
            cinemaMode: false,
            audioOnlyMode: false,
          }
          const newId = await db.settings.add(defaultSettings as Settings)
          setSettings({ ...defaultSettings, id: newId })
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast({ title: t.settings.loadError, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">{t.settings.title}</h1>

      {/* Active Profile Section */}
      {activeProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Active Profile: {activeProfile.name}
            </CardTitle>
            <CardDescription>Manage your currently active profile settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={
                    activeProfileAvatarFilePreview ||
                    activeProfile.avatar ||
                    "/placeholder.svg?width=80&height=80&text=Avatar" ||
                    "/placeholder.svg"
                  }
                  alt={activeProfile.name}
                />
                <AvatarFallback>{getInitials(activeProfile.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div>
                  <Label htmlFor="avatar-url">Avatar URL</Label>
                  <Input
                    id="avatar-url"
                    placeholder="https://example.com/avatar.jpg"
                    value={activeProfileAvatarEditUrl}
                    onChange={(e) => {
                      setActiveProfileAvatarEditUrl(e.target.value)
                      setActiveProfileAvatarFilePreview(null) // Clear file preview if URL is typed
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="avatar-file-upload">Or Upload Avatar</Label>
                  <Input
                    id="avatar-file-upload"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleActiveProfileAvatarFileChange}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={handleSaveActiveProfileAvatar} size="sm">
                Save Avatar
              </Button>
              {(activeProfile.avatar || activeProfileAvatarFilePreview) && (
                <Button onClick={handleRemoveActiveProfileAvatar} variant="outline" size="sm">
                  Remove Avatar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Profiles Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" /> All Profiles
          </CardTitle>
          <CardDescription>Overview of all created profiles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {allProfiles.map((profile) => (
            <div key={profile.id} className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={profile.avatar || "/placeholder.svg?width=40&height=40&text=P"}
                    alt={profile.name}
                  />
                  <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {profile.name} {profile.isActive && <span className="text-xs text-primary ml-1">(Active)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Film className="w-3 h-3" /> {profile.videosWatched || 0} videos watched
                  </p>
                </div>
              </div>
              {/* Future actions like switch or delete can go here */}
            </div>
          ))}
          <div className="mt-4 text-sm text-muted-foreground flex items-center gap-1">
            <Database className="w-3.5 h-3.5" /> Total application storage: {storageSize} (shared across all profiles)
          </div>
        </CardContent>
      </Card>

      {/* Existing Settings Sections */}
      <Card>
        <CardHeader>
          <CardTitle>{t.settings.appearance}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme-select">{t.settings.theme}</Label>
            <Select
              value={settings.theme || "system"}
              onValueChange={(value) => handleSettingChange("theme", value as "light" | "dark" | "system")}
            >
              <SelectTrigger id="theme-select">
                <SelectValue placeholder={t.settings.selectTheme} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t.settings.lightTheme}</SelectItem>
                <SelectItem value="dark">{t.settings.darkTheme}</SelectItem>
                <SelectItem value="system">{t.settings.systemTheme}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.playback}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="autoplay-switch">{t.settings.autoplay}</Label>
            <Switch
              id="autoplay-switch"
              checked={settings.autoplay || false}
              onCheckedChange={(checked) => handleSettingChange("autoplay", checked)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="videoQuality-select">{t.settings.videoQuality}</Label>
            <Select
              value={settings.videoQuality || "auto"}
              onValueChange={(value) =>
                handleSettingChange("videoQuality", value as "480p" | "720p" | "1080p" | "auto")
              }
            >
              <SelectTrigger id="videoQuality-select">
                <SelectValue placeholder={t.settings.selectVideoQuality} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{t.settings.qualityAuto}</SelectItem>
                <SelectItem value="1080p">{t.settings.quality1080p}</SelectItem>
                <SelectItem value="720p">{t.settings.quality720p}</SelectItem>
                <SelectItem value="480p">{t.settings.quality480p}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.history}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="historyLimit-select">{t.settings.historyLimitLabel}</Label>
            <Select
              value={String(settings.historyLimit || 500)}
              onValueChange={(value) => handleSettingChange("historyLimit", Number(value))}
            >
              <SelectTrigger id="historyLimit-select">
                <SelectValue placeholder={t.settings.selectHistoryLimit} />
              </SelectTrigger>
              <SelectContent>
                {historyLimitOptions.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.storage}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            {t.settings.currentStorage}: {storageSize}
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleExport} variant="outline">
              {t.settings.exportData}
            </Button>
            <Label
              htmlFor="import-file"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer"
            >
              {t.settings.importData}
            </Label>
            <Input id="import-file" type="file" accept=".json" className="hidden" onChange={handleImport} />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">{t.settings.clearAllData}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.settings.deleteAllDataConfirm.split(".")[0]}?</AlertDialogTitle>
                  <AlertDialogDescription>{t.settings.deleteAllDataConfirm}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllData}>{t.common.delete}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
