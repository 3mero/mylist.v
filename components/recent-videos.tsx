"use client"

import { VideoCard } from "./video-card"
import type { Video } from "@/lib/db"

interface RecentVideosProps {
  videos: Video[]
}

export function RecentVideos({ videos }: RecentVideosProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  )
}
