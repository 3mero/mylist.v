"use client"

import { useState, useEffect, useCallback } from "react"
import { db, type Video } from "@/lib/db"
import { VideoCard } from "@/components/video-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ListX, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n/language-context"
import { AddToPlaylistDialog } from "@/components/add-to-playlist-dialog"
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
import HistoryLoading from "./loading" // Import the loading component

export default function HistoryPage() {
  const [allVideos, setAllVideos] = useState<Video[]>([])
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { t } = useLanguage()

  const [isAddToPlaylistDialogOpen, setIsAddToPlaylistDialogOpen] = useState(false)
  const [videoForPlaylistDialog, setVideoForPlaylistDialog] = useState<Video | null>(null)

  const loadHistory = useCallback(async () => {
    setIsLoading(true)
    const videosFromDb = await db.videos.orderBy("lastWatched").reverse().toArray()
    setAllVideos(videosFromDb)
    setFilteredVideos(videosFromDb) // Initially, all videos are shown
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase()
    const results = allVideos.filter((video) => {
      const title = video.customTitle || video.title || ""
      const url = video.url || ""
      return title.toLowerCase().includes(lowerSearchTerm) || url.toLowerCase().includes(lowerSearchTerm)
    })
    setFilteredVideos(results)
  }, [searchTerm, allVideos])

  const handleDeleteVideo = async (videoId?: number) => {
    if (!videoId) return
    const videoToDelete = allVideos.find((v) => v.id === videoId)
    if (!videoToDelete) return

    await db.videos.delete(videoId)
    toast({
      title: t.history.videoRemoved,
      description: `"${videoToDelete.customTitle || videoToDelete.title}" ${t.common.delete.toLowerCase()} ${t.common.fromHistory.toLowerCase()}.`,
    })
    // Refresh history after deletion
    setAllVideos((prev) => prev.filter((v) => v.id !== videoId))
  }

  const handleClearHistory = async () => {
    await db.videos.clear()
    await db.watchStats.clear() // Also clear watch stats
    toast({
      title: t.history.historyCleared,
      description: t.history.allVideosRemovedHistory,
    })
    setAllVideos([])
    setFilteredVideos([])
  }

  const handleOpenAddToPlaylistDialog = (video: Video) => {
    setVideoForPlaylistDialog(video)
    setIsAddToPlaylistDialogOpen(true)
  }

  if (isLoading) {
    return <HistoryLoading />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">{t.history.title}</h1>
        {allVideos.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <ListX className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {t.history.clearAll}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.history.confirmClearTitle}</AlertDialogTitle>
                <AlertDialogDescription>{t.history.confirmClearDescription}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearHistory}>{t.common.delete}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {allVideos.length > 0 ? (
        <div className="relative">
          <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t.history.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rtl:pr-10 w-full sm:w-72"
          />
        </div>
      ) : null}

      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              showDelete={true}
              onDelete={() => handleDeleteVideo(video.id)}
              showAddToPlaylistButton={true}
              onAddToPlaylist={handleOpenAddToPlaylistDialog}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">{searchTerm ? t.history.noResults : t.history.noHistory}</p>
          {!searchTerm && <p className="text-sm text-muted-foreground mt-2">{t.history.startWatching}</p>}
        </div>
      )}
      <AddToPlaylistDialog
        open={isAddToPlaylistDialogOpen}
        onOpenChange={setIsAddToPlaylistDialogOpen}
        video={videoForPlaylistDialog}
      />
    </div>
  )
}
