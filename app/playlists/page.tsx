"use client"

import { useState, useEffect } from "react"
import { db, type Playlist } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { PlaylistCard } from "@/components/playlist-card"
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog"
import { useLanguage } from "@/lib/i18n/language-context"

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    loadPlaylists()
  }, [])

  const loadPlaylists = async () => {
    const allPlaylists = await db.playlists.orderBy("updatedAt").reverse().toArray()
    setPlaylists(allPlaylists)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t.playlists.myPlaylists}</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> {/* rtl classes removed */}
          {t.home.createPlaylist}
        </Button>
      </div>

      {playlists.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{t.playlists.noPlaylists}</p>
          <Button onClick={() => setIsCreateOpen(true)}>{t.playlists.createYourFirst}</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} onUpdate={loadPlaylists} />
          ))}
        </div>
      )}

      <CreatePlaylistDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onCreated={loadPlaylists} />
    </div>
  )
}
