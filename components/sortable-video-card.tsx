// This component is used in app/playlists/[id]/page.tsx for the main list
// It needs an onPlay prop if not already present.
"use client"

import type React from "react"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, Play, Trash2, Clock } from "lucide-react"
import type { Video } from "@/lib/db"
import { cn, formatDuration } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/language-context"
import { formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { StaticTitle } from "./static-title"

interface SortableVideoCardProps {
  id: string
  video: Video
  onRemove?: (videoId: number) => void
  onPlay?: (video: Video) => void // Added onPlay prop
  className?: string
}

export function SortableVideoCard({ id, video, onRemove, onPlay, className }: SortableVideoCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const { t, locale } = useLanguage()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent drag from interfering
    if (onPlay) {
      onPlay(video)
    }
  }

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemove && video.id) {
      onRemove(video.id)
    }
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative overflow-hidden border bg-card text-card-foreground shadow-sm",
        isDragging && "ring-2 ring-primary shadow-xl",
        className,
      )}
    >
      <div className="flex items-stretch">
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab bg-muted/50 hover:bg-muted p-3 flex items-center justify-center touch-none"
          onClick={(e) => e.stopPropagation()} // Prevent card click if drag handle is used
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>

        <div className="flex-grow p-3 pr-4 min-w-0">
          {" "}
          {/* min-w-0 is crucial for truncation */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <StaticTitle
                video={video}
                onPlay={onPlay ? () => onPlay(video) : undefined}
                textClassName="font-semibold text-base line-clamp-2 group-hover:text-primary"
              />
              {video.url && (
                <p className="text-xs text-muted-foreground truncate mt-0.5" title={video.url}>
                  {video.url}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 space-x-1 rtl:space-x-reverse">
              {onPlay && (
                <Button size="icon" variant="ghost" onClick={handlePlayClick} className="h-8 w-8">
                  <Play className="w-4 h-4" />
                </Button>
              )}
              {onRemove && video.id && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleRemoveClick}
                  className="h-8 w-8 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
            {video.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(video.duration)}</span>
              </div>
            )}
            {video.lastWatched && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {t.history.lastPlayed}:{" "}
                  {formatDistanceToNow(video.lastWatched, { addSuffix: true, locale: locale === "ar" ? ar : enUS })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
