"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { db, type Playlist, type Video } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog"
import { useLanguage } from "@/lib/i18n/language-context"

interface AddToPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  video: Video | null // Renamed from initialVideo for clarity in this explanation, but was initialVideo in prompt
  onSuccess?: () => void
}

export function AddToPlaylistDialog({ open, onOpenChange, video: initialVideo, onSuccess }: AddToPlaylistDialogProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylists, setSelectedPlaylists] = useState<number[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  useEffect(() => {
    if (open) {
      loadPlaylists()
      setSelectedPlaylists([])
    }
  }, [open])

  const loadPlaylists = async () => {
    const allPlaylists = await db.playlists.toArray()
    setPlaylists(allPlaylists)
  }

  const handleAdd = async () => {
    if (!initialVideo || selectedPlaylists.length === 0) return

    // Ensure the video has an ID by processing it through addToHistory
    // This will add it to the main videos table if new, or fetch existing, and return it with an ID.
    const videoWithId = await db.addToHistory(initialVideo)

    if (!videoWithId || typeof videoWithId.id !== "number") {
      toast({
        title: "Error processing video",
        description: "Could not get a valid ID for the video.",
        variant: "destructive",
      })
      return
    }

    for (const playlistId of selectedPlaylists) {
      const playlist = await db.playlists.get(playlistId)
      if (playlist) {
        // Check if video already exists in playlist
        const videoExists = playlist.videos.some((v) => v.url === videoWithId.url) // Or v.id === videoWithId.id

        if (!videoExists) {
          const updatedPlaylist = {
            ...playlist,
            videos: [...playlist.videos, videoWithId], // Add the video *with its ID*
            updatedAt: new Date(),
          }
          await db.playlists.update(playlistId, updatedPlaylist)
        }
      }
    }

    toast({
      title: t.playlists.addedToPlaylist,
      description: t.playlists.videoAddedToPlaylist,
    })

    setSelectedPlaylists([])
    onOpenChange(false)
    onSuccess?.()
  }

  const togglePlaylist = (playlistId: number) => {
    setSelectedPlaylists((prev) =>
      prev.includes(playlistId) ? prev.filter((id) => id !== playlistId) : [...prev, playlistId],
    )
  }

  const handleCreateSuccess = () => {
    loadPlaylists()
    setIsCreateOpen(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.player.addToPlaylist}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {playlists.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">{t.playlists.noPlaylists}</p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t.home.createPlaylist}
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className="flex items-center space-x-2 rtl:space-x-reverse p-2 rounded hover:bg-accent"
                    >
                      <Checkbox
                        id={`playlist-${playlist.id}`}
                        checked={selectedPlaylists.includes(playlist.id!)}
                        onCheckedChange={() => togglePlaylist(playlist.id!)}
                      />
                      <label htmlFor={`playlist-${playlist.id}`} className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-medium">{playlist.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {playlist.videos.length} {t.playlists.videos}
                          </p>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t.home.createPlaylist}
                  </Button>

                  <Button onClick={handleAdd} disabled={selectedPlaylists.length === 0}>
                    {t.common.add}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreatePlaylistDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onCreated={handleCreateSuccess} />
    </>
  )
}
