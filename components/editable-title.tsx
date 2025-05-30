"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, Edit, RotateCcw, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { db } from "@/lib/db"
import type { Video } from "@/lib/db"
import { useVideoStore } from "@/lib/store"
import { useLanguage } from "@/lib/i18n/language-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EditableTitleProps {
  video: Video
  onTitleSave?: (newTitle: string) => void // Callback after successful save
  className?: string
  textClassName?: string
  inputClassName?: string
  showOriginalTitleButton?: boolean
}

export function EditableTitle({
  video,
  onTitleSave,
  className,
  textClassName,
  inputClassName,
  showOriginalTitleButton = true,
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(video.customTitle || video.title)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { setCurrentVideo, currentPlaylist, setCurrentPlaylist, playlistIndex } = useVideoStore()
  // Remove dir from useLanguage as we want to fix LTR
  const { t } = useLanguage()
  // Always use LTR for this component's internal logic if needed,
  // but for display, rely on global LTR.

  useEffect(() => {
    setTitle(video.customTitle || video.title)
  }, [video.customTitle, video.title])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (!video.id || title.trim() === (video.customTitle || video.title)) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      await db.updateVideoTitle(video.id, title.trim())
      const updatedVideo = { ...video, customTitle: title.trim() }

      // Update in Zustand store if it's the current video
      const currentVideoStore = useVideoStore.getState().currentVideo
      if (currentVideoStore && currentVideoStore.id === video.id) {
        setCurrentVideo(updatedVideo)
      }

      // Update in current playlist in Zustand store
      if (currentPlaylist && currentPlaylist.videos.some((v) => v.id === video.id)) {
        const updatedPlaylistVideos = currentPlaylist.videos.map((v) => (v.id === video.id ? updatedVideo : v))
        setCurrentPlaylist({ ...currentPlaylist, videos: updatedPlaylistVideos })
      }

      // Update in all playlists in DB
      await db.updateVideoInAllPlaylists(video.id, updatedVideo)

      toast({
        title: t.player.titleUpdated,
        description: `${t.player.titleUpdated}: ${title.trim()}`,
      })
      setIsEditing(false)
      if (onTitleSave) {
        onTitleSave(title.trim())
      }
    } catch (error) {
      console.error("Error updating title:", error)
      toast({
        title: "Error",
        description: "Failed to update title",
        variant: "destructive",
      })
      // Revert to original if save fails
      setTitle(video.customTitle || video.title)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setTitle(video.customTitle || video.title)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  const handleRevertToOriginal = async () => {
    if (!video.id) return
    setIsLoading(true)
    try {
      await db.updateVideoTitle(video.id, video.title) // Save original title as custom title
      const updatedVideo = { ...video, customTitle: video.title }

      setTitle(video.title) // Update local state

      const currentVideoStore = useVideoStore.getState().currentVideo
      if (currentVideoStore && currentVideoStore.id === video.id) {
        setCurrentVideo(updatedVideo)
      }
      if (currentPlaylist && currentPlaylist.videos.some((v) => v.id === video.id)) {
        const updatedPlaylistVideos = currentPlaylist.videos.map((v) => (v.id === video.id ? updatedVideo : v))
        setCurrentPlaylist({ ...currentPlaylist, videos: updatedPlaylistVideos })
      }
      await db.updateVideoInAllPlaylists(video.id, updatedVideo)

      toast({
        title: "Title Reverted",
        description: `Title reverted to: ${video.title}`,
      })
      if (onTitleSave) {
        onTitleSave(video.title)
      }
    } catch (error) {
      console.error("Error reverting title:", error)
      toast({
        title: "Error",
        description: "Failed to revert title",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={`flex-grow ${inputClassName || ""}`}
          disabled={isLoading}
          dir="ltr" // Force LTR for input field
        />
        <Button size="icon" variant="ghost" onClick={handleSave} disabled={isLoading} className="h-8 w-8">
          <Check className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={handleCancel} disabled={isLoading} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 group ${className}`}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              onClick={() => setIsEditing(true)}
              className={`cursor-pointer hover:text-primary transition-colors flex-grow truncate ${textClassName}`}
              title={title} // title attribute for native tooltip
              dir="ltr" // Force LTR for text display
            >
              {title}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" align="start">
            <p>{title}</p>
            {video.customTitle && video.customTitle !== video.title && (
              <p className="text-xs text-muted-foreground mt-1" dir="ltr">
                ({t.common.edit}: {video.title})
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="h-6 w-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
        title={t.common.edit}
      >
        <Edit className="w-3 h-3" />
      </Button>
      {showOriginalTitleButton && video.customTitle && video.customTitle !== video.title && video.title && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleRevertToOriginal}
                disabled={isLoading}
                className="h-6 w-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                title="عرض العنوان الأصلي"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" align="start">
              <p dir="ltr">عرض العنوان الأصلي: {video.title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
