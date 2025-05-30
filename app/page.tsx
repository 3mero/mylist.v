"use client"

import { useState, useEffect, useCallback } from "react"
import { VideoUrlInput } from "@/components/video-url-input"
import { VideoPlayer } from "@/components/video-player"
import { useVideoStore } from "@/lib/store"
import { db, type Video } from "@/lib/db"
import { WelcomeDialog } from "@/components/welcome-dialog"
import { useLanguage } from "@/lib/i18n/language-context"
import { VideoCard } from "@/components/video-card"
import { AddToPlaylistDialog } from "@/components/add-to-playlist-dialog"
import { useToast } from "@/hooks/use-toast"
import { PlaylistSidebar } from "@/components/playlist-sidebar" // Import PlaylistSidebar

export default function HomePage() {
  const { currentVideo, setCurrentVideo, currentPlaylist, playlistIndex } = useVideoStore()
  const [recentVideos, setRecentVideos] = useState<Video[]>([])
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false)
  const { t } = useLanguage()
  const { toast } = useToast()

  const [isAddToPlaylistDialogOpen, setIsAddToPlaylistDialogOpen] = useState(false)
  const [videoForPlaylistDialog, setVideoForPlaylistDialog] = useState<Video | null>(null)

  const loadRecentVideos = useCallback(async () => {
    const videos = await db.videos.orderBy("lastWatched").reverse().limit(10).toArray()
    setRecentVideos(videos)
  }, [])

  useEffect(() => {
    loadRecentVideos()
    const checkFirstVisit = async () => {
      const settings = await db.settings.get("isFirstVisit")
      if (settings?.value !== false) {
        setIsWelcomeOpen(true)
        await db.settings.put({ key: "isFirstVisit", value: false })
      }
    }
    checkFirstVisit()
  }, [loadRecentVideos])

  // Reload recent videos if a video is played (lastWatched changes) or deleted
  useEffect(() => {
    loadRecentVideos()
  }, [currentVideo?.lastWatched, loadRecentVideos])

  const handleOpenAddToPlaylistDialog = (video: Video) => {
    setVideoForPlaylistDialog(video)
    setIsAddToPlaylistDialogOpen(true)
  }

  const handleDeleteRecentVideo = async (videoId?: number) => {
    if (!videoId) return
    const videoToDelete = recentVideos.find((v) => v.id === videoId)
    if (!videoToDelete) return

    await db.videos.delete(videoId)
    toast({
      title: t.history.videoRemoved,
      description: `"${videoToDelete.customTitle || videoToDelete.title}" ${(t.common.delete ?? "deleted").toLowerCase()} ${(t.common.fromHistory ?? "from history").toLowerCase()}.`,
    })
    setRecentVideos((prev) => prev.filter((v) => v.id !== videoId))
    if (currentVideo?.id === videoId) {
      setCurrentVideo(null) // Stop playback if the deleted video was playing
    }
  }

  const mainContentSpan = currentPlaylist ? "md:col-span-2" : "col-span-full"

  return (
    <div
      className={`container mx-auto px-2 py-4 md:py-6 space-y-6 ${currentPlaylist ? "grid grid-cols-1 md:grid-cols-3 md:gap-6" : ""}`}
    >
      <div className={mainContentSpan}>
        {!currentVideo && <VideoUrlInput className="mb-6" />}
        {currentVideo && <VideoPlayer key={currentVideo.id || currentVideo.url} className="mb-6" />}

        {recentVideos.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold tracking-tight mb-4">{t.home.recentlyWatched}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  showDelete={true}
                  onDelete={() => handleDeleteRecentVideo(video.id)}
                  showAddToPlaylistButton={true}
                  onAddToPlaylist={handleOpenAddToPlaylistDialog}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {currentPlaylist && (
        <div className="md:col-span-1">
          <PlaylistSidebar
            playlist={currentPlaylist}
            currentIndex={playlistIndex}
            className="sticky top-[calc(var(--header-height,64px)+1.5rem)]" // Adjust top based on header and page padding
          />
        </div>
      )}

      <WelcomeDialog open={isWelcomeOpen} onOpenChange={setIsWelcomeOpen} />
      <AddToPlaylistDialog
        open={isAddToPlaylistDialogOpen}
        onOpenChange={setIsAddToPlaylistDialogOpen}
        video={videoForPlaylistDialog}
        onSuccess={loadRecentVideos} // Optionally reload recent videos or playlists
      />
    </div>
  )
}
