"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Trash2, Clock, Loader2, PlusSquare } from "lucide-react" // Added PlusSquare
import { useVideoStore } from "@/lib/store"
import { formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import type { Video } from "@/lib/db"
import { useEffect, useState } from "react"
import { fetchVideoMetadata } from "@/lib/video-metadata"
import { useLanguage } from "@/lib/i18n/language-context"
import { cn } from "@/lib/utils"

interface VideoCardProps {
  video: Video
  onDelete?: () => void
  showDelete?: boolean
  showAddToPlaylistButton?: boolean
  onAddToPlaylist?: (video: Video) => void
  className?: string
}

export function VideoCard({
  video,
  onDelete,
  showDelete,
  showAddToPlaylistButton,
  onAddToPlaylist,
  className,
}: VideoCardProps) {
  const { setCurrentVideo } = useVideoStore()
  const [metadata, setMetadata] = useState<{ title: string; thumbnail?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { t, locale } = useLanguage()

  useEffect(() => {
    if (video.title && video.title.includes("(") && video.title.includes(")") && !video.thumbnail) {
      setIsLoading(true)
      fetchVideoMetadata(video.url)
        .then((data) => {
          if (data) {
            setMetadata(data)
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [video])

  const handlePlay = () => {
    const videoToPlay = metadata
      ? {
          ...video,
          title: metadata.title,
          thumbnail: metadata.thumbnail || video.thumbnail,
        }
      : video
    setCurrentVideo(videoToPlay)
  }

  const displayTitle = video.customTitle || metadata?.title || video.title || t.player.untitledVideo
  const displayThumbnail = video.thumbnail || metadata?.thumbnail

  return (
    <Card className={cn("overflow-hidden group", className)}>
      <CardContent className="p-0">
        <div className="aspect-video bg-muted relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20 hover:text-white"
                  onClick={handlePlay}
                  aria-label={t.common.play}
                >
                  <Play className="w-6 h-6" />
                </Button>
              </div>
              {displayThumbnail ? (
                <img
                  src={displayThumbnail || "/placeholder.svg"}
                  alt={displayTitle}
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.src = "/placeholder.svg?height=180&width=320")}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                  <Play className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-3 space-y-2">
          <h3 className="font-medium line-clamp-2 text-sm" title={displayTitle}>
            {displayTitle}
          </h3>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {video.lastWatched ? (
                <span>
                  {formatDistanceToNow(video.lastWatched, {
                    addSuffix: true,
                    locale: locale === "ar" ? ar : enUS,
                  })}
                </span>
              ) : (
                <span>{t.history.notPlayedYet}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 pt-1">
            {showAddToPlaylistButton && onAddToPlaylist && (
              <Button size="sm" variant="outline" onClick={() => onAddToPlaylist(video)} className="flex-1 text-xs">
                <PlusSquare className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                {t.player.addToPlaylistShort || "Add to Playlist"}
              </Button>
            )}
            {showDelete && onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDelete}
                className={cn("h-8", !showAddToPlaylistButton && "w-full", showAddToPlaylistButton && "px-2")}
                aria-label={t.common.delete}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {!showAddToPlaylistButton && <span className="ml-1.5 rtl:mr-1.5 rtl:ml-0">{t.common.delete}</span>}
              </Button>
            )}
          </div>
          {video.watchCount && video.watchCount > 1 && (
            <p className="text-xs text-muted-foreground pt-1">
              {t.history.watchedTimes} {video.watchCount} {locale === "ar" ? "مرات" : "times"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
