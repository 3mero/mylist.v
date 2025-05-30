"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { CardHeader as ShadCardHeader } from "@/components/ui/card" // Renamed to avoid conflict
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Play, GripVertical, Shuffle, ListX, Trash2 } from "lucide-react"
import { useVideoStore } from "@/lib/store"
import { cn, formatDuration } from "@/lib/utils"
import type { Playlist, Video } from "@/lib/db"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { db } from "@/lib/db"
import { useLanguage } from "@/lib/i18n/language-context"
import { useToast } from "@/hooks/use-toast"
import { StaticTitle } from "./static-title"
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
import { Card } from "@/components/ui/card" // Ensure Card is imported if used as a wrapper

interface PlaylistSidebarProps {
  playlist: Playlist
  currentIndex: number
  className?: string
  onVideoPlay?: (video: Video, index: number) => void // Callback for playing a video
  isPlayerOnPage?: boolean // Indicates if the player is on the same page
}

interface SortableItemProps {
  id: string
  video: Video
  index: number
  isActive: boolean
  onPlay: () => void
  onRemoveFromPlaylist: (videoId: number) => void
}

function SortableItem({ id, video, index, isActive, onPlay, onRemoveFromPlaylist }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const itemRef = useRef<HTMLDivElement>(null) // Ref for the title div to scroll into view

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  useEffect(() => {
    if (isActive && itemRef.current) {
      // Get the parent scrollable container
      const scrollParent = itemRef.current.closest("[data-radix-scroll-area-viewport]")
      if (scrollParent) {
        const itemRect = itemRef.current.getBoundingClientRect()
        const parentRect = scrollParent.getBoundingClientRect()

        // Check if item is not fully visible
        if (itemRect.top < parentRect.top || itemRect.bottom > parentRect.bottom) {
          itemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }
      }
    }
  }, [isActive])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between gap-x-2 p-2 pr-1 rounded-lg hover:bg-accent mb-1 border group", // justify-between
        isActive && "bg-primary/20 border-primary ring-1 ring-primary",
        !isActive && "border-transparent",
        isDragging && "shadow-lg",
      )}
      data-video-index={index}
    >
      {/* Left group: Drag, Number, Title/Duration */}
      <div className="flex items-center gap-2 flex-grow min-w-0">
        {" "}
        {/* This group will grow and shrink */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 flex-shrink-0 text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <span className="font-semibold text-xs w-5 text-center text-muted-foreground flex-shrink-0">{index + 1}</span>
        <div className="flex-1 min-w-0" ref={itemRef}>
          {" "}
          {/* Title and duration container */}
          <StaticTitle
            video={video}
            onPlay={onPlay}
            textClassName="text-sm font-medium truncate group-hover:text-primary"
            className="flex-1 min-w-0" // Ensure StaticTitle itself can truncate
          />
          {video.duration && <p className="text-xs text-muted-foreground truncate">{formatDuration(video.duration)}</p>}
        </div>
      </div>

      {/* Right group: Buttons */}
      <div className="flex items-center flex-shrink-0">
        <Button
          size="icon"
          variant="ghost"
          onClick={onPlay}
          className="h-7 w-7 text-muted-foreground hover:text-primary"
          title="Play video"
        >
          <Play className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            if (video.id) onRemoveFromPlaylist(video.id)
          }}
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          title="Remove from playlist"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function PlaylistSidebar({
  playlist,
  currentIndex,
  className,
  onVideoPlay,
  isPlayerOnPage = false,
}: PlaylistSidebarProps) {
  const {
    currentVideo,
    setCurrentVideo: setVideoInStore,
    setPlaylistIndex,
    setCurrentPlaylist,
    currentPlaylist: activePlaylistFromStore,
  } = useVideoStore()
  const [videos, setVideos] = useState<Video[]>([])
  const { t } = useLanguage()
  const { toast } = useToast()
  const scrollViewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (playlist && Array.isArray(playlist.videos)) {
      const validVideos = playlist.videos.filter((v) => v && typeof v.id === "number")
      setVideos(validVideos)
    } else {
      setVideos([])
    }
  }, [playlist])

  useEffect(() => {
    // This effect handles scrolling the active item into view.
    // It's refined in the SortableItem's own useEffect for better precision.
    // We can keep a simplified version here or rely entirely on SortableItem.
    // For now, SortableItem's effect is more targeted.
  }, [currentIndex, videos, currentVideo, activePlaylistFromStore, playlist.id, scrollViewportRef])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const totalDuration = useMemo(() => {
    return videos.reduce((acc, video) => acc + (video.duration || 0), 0)
  }, [videos])

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    if (!active || !over || !playlist.id) return

    if (active.id !== over.id) {
      const oldIndex = videos.findIndex((v) => String(v.id) === active.id)
      const newIndex = videos.findIndex((v) => String(v.id) === over.id)

      if (oldIndex === -1 || newIndex === -1) return

      const newVideosOrder = arrayMove(videos, oldIndex, newIndex)
      setVideos(newVideosOrder)

      const updatedPlaylistData = { ...playlist, videos: newVideosOrder, updatedAt: new Date() }
      await db.playlists.update(playlist.id, updatedPlaylistData)

      if (activePlaylistFromStore && activePlaylistFromStore.id === playlist.id) {
        setCurrentPlaylist(updatedPlaylistData)
        if (currentVideo) {
          const newPlayingIndex = newVideosOrder.findIndex((v) => v.id === currentVideo.id)
          if (newPlayingIndex !== -1) setPlaylistIndex(newPlayingIndex)
        }
      }
    }
  }

  const playVideoAtIndex = (indexInFilteredList: number) => {
    if (indexInFilteredList < 0 || indexInFilteredList >= videos.length) return
    const videoToPlay = videos[indexInFilteredList]

    if (onVideoPlay) {
      // Used by playlist detail page
      onVideoPlay(videoToPlay, indexInFilteredList)
    } else {
      // Default behavior (e.g., when sidebar is on homepage)
      if (activePlaylistFromStore?.id !== playlist.id) {
        setCurrentPlaylist({ ...playlist, videos: videos })
      }
      setVideoInStore(videoToPlay)
      setPlaylistIndex(indexInFilteredList)
    }
  }

  const handleShuffle = async () => {
    if (videos.length < 2 || !playlist.id) {
      toast({ title: t.playlists.notEnoughVideosToShuffle, variant: "default" })
      return
    }
    const shuffledVideos = [...videos].sort(() => Math.random() - 0.5)
    setVideos(shuffledVideos)

    const updatedPlaylistData = { ...playlist, videos: shuffledVideos, updatedAt: new Date() }
    await db.playlists.update(playlist.id, updatedPlaylistData)

    if (activePlaylistFromStore && activePlaylistFromStore.id === playlist.id) {
      setCurrentPlaylist(updatedPlaylistData)
      if (currentVideo) {
        const newCurrentIndex = shuffledVideos.findIndex((v) => v.id === currentVideo.id)
        if (newCurrentIndex !== -1) {
          setPlaylistIndex(newCurrentIndex)
        } else {
          playVideoAtIndex(0)
        }
      } else if (shuffledVideos.length > 0) {
        playVideoAtIndex(0)
      }
    }
    toast({ title: t.playlists.shuffled })
  }

  const handleClearAllPlaylist = async () => {
    if (!playlist.id) return
    const videosToDeleteFromHistory = [...videos]

    const updatedPlaylistData = { ...playlist, videos: [], updatedAt: new Date() }
    await db.playlists.update(playlist.id, updatedPlaylistData)
    setVideos([])

    if (activePlaylistFromStore && activePlaylistFromStore.id === playlist.id) {
      setCurrentPlaylist(updatedPlaylistData)
      setVideoInStore(null)
      setPlaylistIndex(0)
    }

    for (const video of videosToDeleteFromHistory) {
      if (video.id) await db.videos.delete(video.id)
    }
    toast({ title: t.playlists.playlistCleared, description: t.playlists.allVideosRemovedHistory })
  }

  const handleRemoveVideoFromPlaylist = async (videoIdToRemove: number) => {
    if (!playlist.id) return

    const videoToRemoveObject = videos.find((v) => v.id === videoIdToRemove)
    if (!videoToRemoveObject) return

    const originalIndexOfRemovedVideoInFilteredList = videos.findIndex((v) => v.id === videoIdToRemove)

    const newPlaylistVideos = videos.filter((video) => video.id !== videoIdToRemove)
    setVideos(newPlaylistVideos)

    const updatedPlaylistDataInDb = { ...playlist, videos: newPlaylistVideos, updatedAt: new Date() }
    await db.playlists.update(playlist.id, updatedPlaylistDataInDb)

    if (activePlaylistFromStore && activePlaylistFromStore.id === playlist.id) {
      setCurrentPlaylist(updatedPlaylistDataInDb)

      if (currentVideo && currentVideo.id === videoIdToRemove) {
        if (newPlaylistVideos.length > 0) {
          const newPlayIndex = Math.min(originalIndexOfRemovedVideoInFilteredList, newPlaylistVideos.length - 1)
          setVideoInStore(newPlaylistVideos[newPlayIndex])
          setPlaylistIndex(newPlayIndex)
        } else {
          setVideoInStore(null)
          setPlaylistIndex(0)
        }
      } else if (currentVideo && newPlaylistVideos.some((v) => v.id === currentVideo.id)) {
        const newPlayingIndex = newPlaylistVideos.findIndex((v) => v.id === currentVideo.id)
        if (newPlayingIndex !== -1) setPlaylistIndex(newPlayingIndex)
      } else if (!currentVideo && newPlaylistVideos.length > 0) {
        setPlaylistIndex(0)
      }
    }

    toast({
      title: t.history.videoRemoved,
      description: `"${videoToRemoveObject.customTitle || videoToRemoveObject.title}" ${t.common.removedFromThisPlaylist}`,
    })
  }

  const dndItems = videos.map((v) => String(v.id))

  return (
    <Card
      className={cn(
        "w-full h-fit max-h-[calc(100vh-var(--header-height,64px)-var(--player-height,360px)-100px)] md:max-h-[600px] overflow-hidden flex flex-col",
        className,
      )}
    >
      <ShadCardHeader className="p-3 md:p-4 border-b">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base md:text-lg truncate" title={playlist.name}>
              {playlist.name}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              {videos.length} {videos.length === 1 ? t.playlists.videoSingular : t.playlists.videos}
              {videos.length > 0 && totalDuration > 0 && ` - ${formatDuration(totalDuration)}`}
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={handleShuffle} disabled={videos.length < 2}>
              <Shuffle className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
              {t.playlists.shufflePlayShort || "Shuffle"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={videos.length === 0}>
                  <ListX className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                  {t.history.clearAll}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t.history.clearAll} "{playlist.name}"?
                  </AlertDialogTitle>
                  <AlertDialogDescription>{t.playlists.clearAllWarning}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllPlaylist}>{t.common.delete}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </ShadCardHeader>

      <ScrollArea className="flex-1" viewportRef={scrollViewportRef}>
        <div className="p-2 md:p-3">
          {videos.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={dndItems} strategy={verticalListSortingStrategy}>
                {videos.map((video, index) => (
                  <SortableItem
                    key={String(video.id)}
                    id={String(video.id)}
                    video={video}
                    index={index}
                    isActive={currentVideo?.id === video.id && activePlaylistFromStore?.id === playlist.id}
                    onPlay={() => playVideoAtIndex(index)}
                    onRemoveFromPlaylist={handleRemoveVideoFromPlaylist}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">{t.playlists.noVideosInPlaylist}</p>
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
