"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Play, Plus, Loader2, Link } from "lucide-react"
import { useVideoStore } from "@/lib/store"
import { isValidVideoUrl, sanitizeUrl, extractVideoTitle } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { AddToPlaylistDialog } from "@/components/add-to-playlist-dialog"
import { ThumbnailGenerator } from "@/components/thumbnail-generator"
import { fetchVideoMetadata } from "@/lib/video-metadata"
import type { Video } from "@/lib/db"
import { useLanguage } from "@/lib/i18n/language-context"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function VideoUrlInput() {
  const [url, setUrl] = useState("")
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false)
  const [videoToAdd, setVideoToAdd] = useState<Video | null>(null)
  const [showThumbnailGenerator, setShowThumbnailGenerator] = useState(false)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [multipleUrls, setMultipleUrls] = useState("")
  const [activeTab, setActiveTab] = useState<string>("single")
  const { setCurrentVideo } = useVideoStore()
  const { toast } = useToast()
  const { t } = useLanguage()

  useEffect(() => {
    setShowThumbnailGenerator(false)
  }, [url])

  const handlePlay = async () => {
    const cleanUrl = sanitizeUrl(url)

    if (!isValidVideoUrl(cleanUrl)) {
      toast({
        title: t.home.invalidUrl,
        description: t.home.invalidUrl,
        variant: "destructive",
      })
      return
    }

    setIsLoadingMetadata(true)
    const metadata = await fetchVideoMetadata(cleanUrl)
    const video: Video = {
      url: cleanUrl,
      title: metadata?.title || extractVideoTitle(cleanUrl),
      thumbnail: metadata?.thumbnail,
    }
    setIsLoadingMetadata(false)
    setCurrentVideo(video)
    setShowThumbnailGenerator(true)
  }

  const handleAddToPlaylist = async () => {
    const cleanUrl = sanitizeUrl(url)
    if (!isValidVideoUrl(cleanUrl)) {
      toast({
        title: t.home.invalidUrl,
        description: t.home.invalidUrl,
        variant: "destructive",
      })
      return
    }
    setIsLoadingMetadata(true)
    const metadata = await fetchVideoMetadata(cleanUrl)
    const video: Video = {
      url: cleanUrl,
      title: metadata?.title || extractVideoTitle(cleanUrl),
      thumbnail: metadata?.thumbnail,
    }
    setIsLoadingMetadata(false)
    setVideoToAdd(video)
    setIsAddToPlaylistOpen(true)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePlay()
    }
  }

  const handleThumbnailGenerated = (thumbnailUrl: string) => {
    const currentVideo = useVideoStore.getState().currentVideo
    if (currentVideo) {
      const updatedVideo = { ...currentVideo, thumbnail: thumbnailUrl }
      useVideoStore.getState().setCurrentVideo(updatedVideo)
      toast({
        title: t.home.generateThumbnail,
        description: t.home.generateThumbnail,
      })
    }
  }

  const handleProcessMultipleUrls = () => {
    const urls = multipleUrls.split("\n").filter((line) => line.trim() !== "")
    if (urls.length === 0) {
      toast({
        title: "No URLs found",
        description: "Please enter at least one URL",
        variant: "destructive",
      })
      return
    }
    const firstUrl = sanitizeUrl(urls[0])
    if (isValidVideoUrl(firstUrl)) {
      setUrl(firstUrl) // Set the single URL input to the first URL
      handlePlay() // And attempt to play it
    } else {
      toast({
        title: t.home.invalidUrl,
        description: `Invalid URL: ${firstUrl}`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">{t.videoUrlInput?.singleUrlTab || "Single URL"}</TabsTrigger>
          <TabsTrigger value="multiple">{t.videoUrlInput?.multipleUrlsTab || "Multiple URLs"}</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={t.home.enterVideoUrl}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              disabled={isLoadingMetadata}
            />
            <Button onClick={handlePlay} disabled={!url.trim() || isLoadingMetadata}>
              {isLoadingMetadata ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {t.common.play}
            </Button>
            <Button variant="outline" onClick={handleAddToPlaylist} disabled={!url.trim() || isLoadingMetadata}>
              <Plus className="w-4 h-4 mr-2" />
              {t.common.add}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="multiple" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="multiple-urls">
              {t.videoUrlInput?.multipleUrlsLabel || "Enter multiple URLs (one per line)"}
            </Label>
            <Textarea
              id="multiple-urls"
              placeholder="https://example.com/video1.mp4&#10;https://youtube.com/watch?v=abcdef&#10;https://vimeo.com/123456"
              value={multipleUrls}
              onChange={(e) => setMultipleUrls(e.target.value)}
              rows={5}
            />
          </div>
          <Button onClick={handleProcessMultipleUrls} disabled={!multipleUrls.trim()}>
            <Link className="w-4 h-4 mr-2" />
            {t.videoUrlInput?.processUrlsButton || "Process URLs"}
          </Button>
        </TabsContent>
      </Tabs>

      {showThumbnailGenerator && !useVideoStore.getState().currentVideo?.thumbnail && (
        <div className="flex justify-end">
          <ThumbnailGenerator videoUrl={sanitizeUrl(url)} onThumbnailGenerated={handleThumbnailGenerated} />
        </div>
      )}

      <AddToPlaylistDialog
        open={isAddToPlaylistOpen}
        onOpenChange={setIsAddToPlaylistOpen}
        video={videoToAdd}
        onSuccess={() => setUrl("")} // Clear URL input on successful addition to playlist
      />
    </div>
  )
}
