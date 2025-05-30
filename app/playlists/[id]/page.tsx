"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { db, type Playlist, type Video } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play, Shuffle, Edit3, Trash2, ListMusic } from "lucide-react"
import { useVideoStore } from "@/lib/store"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableVideoCard } from "@/components/sortable-video-card" // This is for the main list of videos in playlist
import { VideoPlayer } from "@/components/video-player"
import { PlaylistSidebar } from "@/components/playlist-sidebar"
import { useToast } from "@/hooks/use-toast"
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
import { Textarea } from "@/components/ui/textarea" // For editing description
import { Input } from "@/components/ui/input" // For editing name

export default function PlaylistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const playlistId = Number(params.id)

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [editedDescription, setEditedDescription] = useState("")

  const { currentVideo, setCurrentVideo, currentPlaylist, setCurrentPlaylist, playlistIndex, setPlaylistIndex } =
    useVideoStore()
  const { toast } = useToast()
  const { t } = useLanguage()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const loadPlaylist = useCallback(async () => {
    if (isNaN(playlistId)) {
      setIsLoading(false)
      // Consider redirecting or showing a "not found" message
      return
    }
    setIsLoading(true)
    const pl = await db.playlists.get(playlistId)
    if (pl) {
      setPlaylist(pl)
      setEditedName(pl.name)
      setEditedDescription(pl.description || "")
    } else {
      // Playlist not found
      setPlaylist(null) // Explicitly set to null
    }
    setIsLoading(false)
  }, [playlistId])

  useEffect(() => {
    loadPlaylist()
  }, [loadPlaylist])

  // Effect to set this playlist as current if navigating directly with a video playing from it
  useEffect(() => {
    if (playlist && currentVideo && currentPlaylist?.id !== playlist.id) {
      const videoInThisPlaylist = playlist.videos.find((v) => v.id === currentVideo.id)
      if (videoInThisPlaylist) {
        const videoIndex = playlist.videos.findIndex((v) => v.id === currentVideo.id)
        setCurrentPlaylist(playlist)
        setPlaylistIndex(videoIndex)
      }
    }
  }, [playlist, currentVideo, currentPlaylist, setCurrentPlaylist, setPlaylistIndex])

  const handlePlayVideoFromSidebar = (video: Video, index: number) => {
    if (!playlist) return
    setCurrentPlaylist(playlist) // Ensure this playlist is set as current
    setCurrentVideo(video)
    setPlaylistIndex(index)
  }

  const playPlaylist = (shuffle = false) => {
    if (!playlist || playlist.videos.length === 0) return

    let videosToPlay = [...playlist.videos]
    if (shuffle) {
      videosToPlay = videosToPlay.sort(() => Math.random() - 0.5)
    }

    const playlistToPlay = { ...playlist, videos: videosToPlay }
    setCurrentPlaylist(playlistToPlay) // Set the potentially shuffled playlist
    setCurrentVideo(videosToPlay[0])
    setPlaylistIndex(0)
    // NO router.push("/") - stay on this page
  }

  const removeFromPlaylistOnDetailPage = async (videoIdToRemove: number) => {
    if (!playlist || !playlist.id) return

    const videoToRemove = playlist.videos.find((v) => v.id === videoIdToRemove)
    if (!videoToRemove) return

    const originalIndexOfRemovedVideo = playlist.videos.findIndex((v) => v.id === videoIdToRemove)

    // 1. Delete from global history (videos table)
    // This behavior might be debatable. For now, removing from playlist also removes from history.
    // If you want to keep it in history, comment out the next line.
    if (videoToRemove.id) await db.videos.delete(videoToRemove.id)

    // 2. Remove from the current playlist's video list
    const updatedVideos = playlist.videos.filter((v) => v.id !== videoIdToRemove)
    const updatedPlaylistData = { ...playlist, videos: updatedVideos, updatedAt: new Date() }

    // 3. Update the playlist in the database
    await db.playlists.update(playlist.id, updatedPlaylistData)

    // 4. Update the local state for the playlist detail page UI
    setPlaylist(updatedPlaylistData)

    // 5. Update Zustand store
    if (currentPlaylist && currentPlaylist.id === playlist.id) {
      setCurrentPlaylist(updatedPlaylistData)

      if (currentVideo && currentVideo.id === videoIdToRemove) {
        if (updatedVideos.length > 0) {
          const newPlayIndex = Math.min(originalIndexOfRemovedVideo, updatedVideos.length - 1)
          setCurrentVideo(updatedVideos[newPlayIndex])
          setPlaylistIndex(newPlayIndex)
        } else {
          setCurrentVideo(null)
          setPlaylistIndex(0)
        }
      } else if (currentVideo && updatedVideos.some((v) => v.id === currentVideo.id)) {
        const newPlayingIndex = updatedVideos.findIndex((v) => v.id === currentVideo.id)
        if (newPlayingIndex !== -1) setPlaylistIndex(newPlayingIndex)
      } else if (!currentVideo && updatedVideos.length > 0) {
        setPlaylistIndex(0)
      }
    }

    toast({
      title: t.history.videoRemoved,
      description: `${videoToRemove.customTitle || videoToRemove.title} ${t.common.delete.toLowerCase()} ${t.common.fromPlaylist.toLowerCase()}.`,
    })
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    if (active.id !== over.id && playlist && playlist.id) {
      const oldIndex = playlist.videos.findIndex((v) => v.id!.toString() === active.id)
      const newIndex = playlist.videos.findIndex((v) => v.id!.toString() === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const newVideosOrder = arrayMove(playlist.videos, oldIndex, newIndex)
      const updatedPlaylistData = { ...playlist, videos: newVideosOrder, updatedAt: new Date() }
      setPlaylist(updatedPlaylistData)
      await db.playlists.update(playlist.id, updatedPlaylistData)

      if (currentPlaylist && currentPlaylist.id === playlist.id) {
        setCurrentPlaylist(updatedPlaylistData)
        if (currentVideo) {
          const newPlayingIndex = newVideosOrder.findIndex((v) => v.id === currentVideo.id)
          if (newPlayingIndex !== -1) setPlaylistIndex(newPlayingIndex)
        }
      }
    }
  }

  const handleSaveEdit = async () => {
    if (!playlist || !playlist.id) return
    const updatedPlaylist = {
      ...playlist,
      name: editedName.trim() || t.playlists.untitledPlaylist,
      description: editedDescription.trim(),
      updatedAt: new Date(),
    }
    await db.playlists.update(playlist.id, updatedPlaylist)
    setPlaylist(updatedPlaylist)
    if (currentPlaylist && currentPlaylist.id === playlist.id) {
      setCurrentPlaylist(updatedPlaylist)
    }
    setIsEditing(false)
    toast({ title: t.playlists.playlistUpdated })
  }

  const handleDeletePlaylist = async () => {
    if (!playlist || !playlist.id) return
    // Optionally, ask if videos should also be deleted from history
    // For now, just delete the playlist itself. Videos remain in history.
    await db.playlists.delete(playlist.id)
    toast({ title: t.playlists.playlistDeleted, description: `"${playlist.name}" ${t.common.delete.toLowerCase()}.` })
    if (currentPlaylist && currentPlaylist.id === playlist.id) {
      setCurrentPlaylist(null)
      setCurrentVideo(null)
      setPlaylistIndex(0)
    }
    router.push("/playlists")
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <ListMusic className="w-12 h-12 animate-pulse text-muted-foreground" />
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <h1 className="text-2xl font-semibold mb-4">{t.playlists.playlistNotFound}</h1>
        <Button onClick={() => router.push("/playlists")}>{t.playlists.backToPlaylists}</Button>
      </div>
    )
  }

  // Determine if the player should be shown on this page
  const showPlayerOnThisPage = currentVideo && currentPlaylist && currentPlaylist.id === playlist.id

  return (
    <div className="container mx-auto px-1 md:px-4 py-4 md:py-6 space-y-6">
      {/* Player section - only if current video is from this playlist */}
      {showPlayerOnThisPage && (
        <div className="mb-6 sticky top-[var(--header-height,64px)] z-10 bg-background py-2 -mx-1 md:-mx-4 px-1 md:px-4 shadow-sm">
          <VideoPlayer key={currentVideo!.id || currentVideo!.url} />
        </div>
      )}

      <div
        className={`grid grid-cols-1 ${showPlayerOnThisPage ? "lg:grid-cols-3 lg:gap-6" : "md:grid-cols-3 md:gap-6"}`}
      >
        {/* Main content: Playlist details and video list */}
        <div className={`${showPlayerOnThisPage ? "lg:col-span-2" : "md:col-span-2"} space-y-6`}>
          <div className="flex items-start justify-between gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/playlists")}
              className="flex-shrink-0 mt-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-2xl font-bold h-auto p-0 border-0 focus-visible:ring-0"
                    placeholder={t.playlists.playlistNamePlaceholder}
                  />
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder={t.playlists.playlistDescriptionPlaceholder}
                    rows={2}
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold break-words" title={playlist.name}>
                    {playlist.name}
                  </h1>
                  {playlist.description && (
                    <p className="text-muted-foreground mt-1 text-sm break-words">{playlist.description}</p>
                  )}
                </>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {playlist.videos.length} {playlist.videos.length === 1 ? t.playlists.videoSingular : t.playlists.videos}
                {playlist.createdAt && ` - ${t.common.created} ${new Date(playlist.createdAt).toLocaleDateString()}`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSaveEdit}>
                    {t.common.save}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setEditedName(playlist.name)
                      setEditedDescription(playlist.description || "")
                    }}
                  >
                    {t.common.cancel}
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit3 className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                  {t.common.edit}
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => playPlaylist()} disabled={playlist.videos.length === 0}>
              <Play className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {t.playlists.playAll}
            </Button>
            <Button variant="outline" onClick={() => playPlaylist(true)} disabled={playlist.videos.length === 0}>
              <Shuffle className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {t.playlists.shufflePlay}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" outline>
                  <Trash2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t.common.delete} {t.playlists.playlist.toLowerCase()}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t.playlists.confirmDeleteTitle} "{playlist.name}"?
                  </AlertDialogTitle>
                  <AlertDialogDescription>{t.playlists.confirmDeleteDescription}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeletePlaylist} className="bg-destructive hover:bg-destructive/90">
                    {t.common.delete}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {playlist.videos.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <ListMusic className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-xl text-muted-foreground">{t.playlists.noVideosInPlaylist}</p>
              <p className="text-sm text-muted-foreground mt-1">{t.playlists.addVideosToPlaylistPrompt}</p>
              {/* TODO: Add a button/way to easily add videos to this playlist, e.g. navigate to search or history */}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={playlist.videos.map((v) => v.id!.toString())}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {playlist.videos.map((video) => (
                    <SortableVideoCard
                      key={video.id!}
                      id={video.id!.toString()}
                      video={video}
                      onRemove={() => video.id && removeFromPlaylistOnDetailPage(video.id)}
                      onPlay={() => {
                        // When clicking play on a SortableVideoCard
                        if (currentPlaylist?.id !== playlist.id) setCurrentPlaylist(playlist)
                        setCurrentVideo(video)
                        setPlaylistIndex(playlist.videos.findIndex((v) => v.id === video.id))
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Sidebar: Playlist items - only if player is active for this playlist */}
        {showPlayerOnThisPage && currentPlaylist && (
          <div className="lg:col-span-1">
            <PlaylistSidebar
              playlist={currentPlaylist} // Use currentPlaylist from store to ensure it's the one being played
              currentIndex={playlistIndex}
              className="sticky top-[calc(var(--header-height,64px)+var(--player-height,80px)+1.5rem)]" // Adjust based on header and player height
              onVideoPlay={handlePlayVideoFromSidebar}
              isPlayerOnPage={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}
