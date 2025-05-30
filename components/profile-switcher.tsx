"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { db, type Profile } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { UserPlus, Trash2, Check } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/lib/i18n/language-context"
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

export function ProfileSwitcher() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newProfileName, setNewProfileName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [avatarFilePreview, setAvatarFilePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    const allProfiles = await db.profiles.toArray()
    setProfiles(allProfiles)

    const active = await db.getActiveProfile()
    setActiveProfile(active || null)

    // If no profiles exist, open the create dialog
    if (allProfiles.length === 0) {
      setIsCreateOpen(true)
    }
  }

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarFilePreview(reader.result as string)
        setAvatarUrl("") // Clear URL if a file is chosen
      }
      reader.readAsDataURL(file)
    } else {
      setAvatarFilePreview(null)
    }
  }

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      toast({
        title: "Profile name required",
        description: "Please enter a name for the profile",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const finalAvatar = avatarFilePreview || avatarUrl || undefined
      await db.createProfile(newProfileName.trim(), finalAvatar)
      toast({
        title: "Profile created",
        description: `Profile "${newProfileName}" has been created and activated`,
      })
      setNewProfileName("")
      setAvatarUrl("")
      setAvatarFilePreview(null)
      setIsCreateOpen(false)
      await loadProfiles()

      // Reload the page to apply the new profile
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error creating profile",
        description: "An error occurred while creating the profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitchProfile = async (profileId: number) => {
    try {
      await db.switchProfile(profileId)
      toast({
        title: "Profile switched",
        description: "Profile has been switched successfully",
      })
      await loadProfiles()

      // Reload the page to apply the new profile
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error switching profile",
        description: "An error occurred while switching profiles",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProfile = async (profileId: number) => {
    try {
      await db.deleteProfile(profileId)
      toast({
        title: "Profile deleted",
        description: "Profile has been deleted successfully",
      })
      await loadProfiles()

      // Reload the page if the active profile was deleted
      if (activeProfile?.id === profileId) {
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "Error deleting profile",
        description: "An error occurred while deleting the profile",
        variant: "destructive",
      })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              {activeProfile?.avatar ? (
                <AvatarImage src={activeProfile.avatar || "/placeholder.svg"} alt={activeProfile.name} />
              ) : (
                <AvatarFallback>{activeProfile ? getInitials(activeProfile.name) : "?"}</AvatarFallback>
              )}
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              {activeProfile ? (
                <p className="font-medium">{activeProfile.name}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No active profile</p>
              )}
            </div>
          </div>

          {profiles.length > 0 && (
            <>
              <div className="px-2 pt-2 pb-1">
                <p className="text-xs font-medium text-muted-foreground">Switch Profile</p>
              </div>

              {profiles.map((profile) => (
                <DropdownMenuItem
                  key={profile.id}
                  className={`flex items-center gap-2 ${profile.isActive ? "bg-accent" : ""}`}
                  onClick={() => profile.id && !profile.isActive && handleSwitchProfile(profile.id)}
                >
                  <Avatar className="h-6 w-6">
                    {profile.avatar ? (
                      <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.name} />
                    ) : (
                      <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                    )}
                  </Avatar>
                  <span>{profile.name}</span>
                  {profile.isActive && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </>
          )}

          <DropdownMenuItem onClick={() => setIsCreateOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            <span>Create New Profile</span>
          </DropdownMenuItem>

          {activeProfile && profiles.length > 1 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Current Profile</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Profile</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the profile "{activeProfile.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => activeProfile.id && handleDeleteProfile(activeProfile.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Profile Name</Label>
              <Input
                id="name"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Enter profile name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar URL (optional)</Label>
              <Input
                id="avatar"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />

              {avatarUrl && !avatarFilePreview && (
                <div className="mt-2 flex justify-center">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={avatarUrl || "/placeholder.svg"} alt="Avatar preview" />
                    <AvatarFallback>{newProfileName ? getInitials(newProfileName) : "?"}</AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar-file">Or Upload Avatar</Label>
              <Input id="avatar-file" type="file" accept="image/*" onChange={handleAvatarFileChange} />
              {avatarFilePreview && (
                <div className="mt-2 flex justify-center">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={avatarFilePreview || "/placeholder.svg"} alt="Avatar preview" />
                    <AvatarFallback>{newProfileName ? getInitials(newProfileName) : "?"}</AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleCreateProfile} disabled={isLoading || !newProfileName.trim()}>
                {isLoading ? "Creating..." : "Create Profile"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
