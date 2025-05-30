"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

interface ThumbnailGeneratorProps {
  videoUrl: string
  onThumbnailGenerated: (thumbnailUrl: string) => void
}

export function ThumbnailGenerator({ videoUrl, onThumbnailGenerated }: ThumbnailGeneratorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  // Remove dir from useLanguage
  const { t } = useLanguage()

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = videoUrl
    }
  }, [videoUrl])

  const generateThumbnail = () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsLoading(true)

    const video = videoRef.current

    // Try to seek to 25% of the video
    video.addEventListener(
      "loadedmetadata",
      () => {
        if (video.duration !== Number.POSITIVE_INFINITY) {
          video.currentTime = video.duration * 0.25
        } else {
          // If duration is not available, just use 2 seconds
          video.currentTime = 2
        }
      },
      { once: true },
    )

    video.addEventListener(
      "seeked",
      () => {
        const canvas = canvasRef.current!
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7)
          onThumbnailGenerated(thumbnailUrl)
          setIsLoading(false)
        }
      },
      { once: true },
    )

    // Handle errors
    video.addEventListener(
      "error",
      () => {
        setIsLoading(false)
      },
      { once: true },
    )

    // Force load
    video.load()
  }

  return (
    <div>
      <Button variant="outline" size="sm" onClick={generateThumbnail} disabled={isLoading}>
        <Camera className="w-4 h-4 mr-2" /> {/* rtl classes removed */}
        {isLoading ? t.home.generatingThumbnail : t.home.generateThumbnail}
      </Button>
      <video ref={videoRef} className="hidden" crossOrigin="anonymous" />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
