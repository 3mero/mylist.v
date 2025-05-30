"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Loader2 } from "lucide-react"
import { useVideoStore } from "@/lib/store"
import { isValidVideoUrl, sanitizeUrl, extractVideoTitle } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { fetchVideoMetadata } from "@/lib/video-metadata"
import type { Video } from "@/lib/db"
import { useLanguage } from "@/lib/i18n/language-context"

interface AddVideoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVideoAdded?: () => void
}

export function AddVideoDialog({ open, onOpenChange, onVideoAdded }: AddVideoDialogProps) {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { setCurrentVideo } = useVideoStore()
  const { toast } = useToast()
  const { t } = useLanguage()

  const handlePlay = async () => {
    const cleanUrl = sanitizeUrl(url)

    if (!isValidVideoUrl(cleanUrl)) {
      toast({
        title: t.home.invalidUrl,
        description: t.addVideoDialog.pleaseEnterValidUrl,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const metadata = await fetchVideoMetadata(cleanUrl)
      const video: Video = {
        url: cleanUrl,
        title: metadata?.title || extractVideoTitle(cleanUrl),
        thumbnail: metadata?.thumbnail,
      }

      setCurrentVideo(video)
      setUrl("")
      onOpenChange(false)
      onVideoAdded?.()

      toast({
        title: t.addVideoDialog.videoAdded,
        description: t.addVideoDialog.videoStartedPlaying,
      })
    } catch (error) {
      toast({
        title: t.common.error,
        description: t.addVideoDialog.errorLoadingVideo,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handlePlay()
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setUrl("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.addVideoDialog.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-url">{t.addVideoDialog.videoUrl}</Label>
            <Input
              id="video-url"
              placeholder={t.home.enterVideoUrl}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="w-full"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              {t.common.cancel}
            </Button>
            <Button onClick={handlePlay} disabled={!url.trim() || isLoading} className="gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isLoading ? t.common.loading : t.common.play}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
