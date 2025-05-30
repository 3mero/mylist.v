import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidVideoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)

    // Direct video file extensions
    const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv", ".m3u8", ".mpd", ".flv"]
    const hasVideoExtension = videoExtensions.some((ext) => urlObj.pathname.toLowerCase().endsWith(ext))

    // Check for direct download links that might not have extensions
    const downloadPatterns = [/download/i, /media/i, /video/i, /stream/i, /content/i, /file/i, /cdn/i, /player/i]
    const mightBeDownload = downloadPatterns.some(
      (pattern) => pattern.test(urlObj.pathname) || pattern.test(urlObj.hostname),
    )

    // Check if it's a direct video file or a known video platform
    const videoPatterns = [
      /youtube\.com\/watch/,
      /youtu\.be\//,
      /vimeo\.com\//,
      /dailymotion\.com\//,
      /twitch\.tv\//,
      /facebook\.com\/.*\/videos\//,
      /instagram\.com\/.*\/video\//,
      /tiktok\.com\//,
      /twitter\.com\/.*\/status\//,
      /x\.com\/.*\/status\//,
      /drive\.google\.com\/file/,
      /dropbox\.com\/s\//,
      /streamable\.com\//,
      /bitchute\.com\//,
      /rumble\.com\//,
      /odysee\.com\//,
      /archive\.org\/details\//,
    ]

    const isVideoPlatform = videoPatterns.some((pattern) => pattern.test(url))

    // Check for common video CDNs
    const cdnPatterns = [
      /cloudfront\.net/,
      /akamaihd\.net/,
      /cloudflare\.com/,
      /fastly\.net/,
      /amazonaws\.com/,
      /azureedge\.net/,
      /googleusercontent\.com/,
    ]
    const isCdn = cdnPatterns.some((pattern) => pattern.test(urlObj.hostname))

    return hasVideoExtension || isVideoPlatform || (mightBeDownload && isCdn)
  } catch {
    return false
  }
}

export function sanitizeUrl(url: string): string {
  // Remove any potential XSS attempts
  const cleaned = url
    .trim()
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .replace(/<script/gi, "")
    .replace(/on\w+=/gi, "")

  // Try to fix common URL issues
  let fixedUrl = cleaned

  // Add https:// if missing
  if (!/^https?:\/\//i.test(fixedUrl)) {
    fixedUrl = "https://" + fixedUrl
  }

  return fixedUrl
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

export function extractVideoTitle(url: string): string {
  try {
    const urlObj = new URL(url)

    // YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = urlObj.searchParams.get("v") || urlObj.pathname.split("/").pop()
      return videoId ? `YouTube Video (${videoId})` : "YouTube Video"
    }

    // Vimeo
    if (url.includes("vimeo.com")) {
      const videoId = urlObj.pathname.split("/").pop()
      return videoId ? `Vimeo Video (${videoId})` : "Vimeo Video"
    }

    // Direct file
    const pathname = urlObj.pathname
    const filename = pathname.split("/").pop() || "Untitled Video"
    return decodeURIComponent(filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "))
  } catch {
    return "Untitled Video"
  }
}

export function generateRandomColor(): string {
  const colors = [
    "#f87171", // red
    "#fb923c", // orange
    "#fbbf24", // amber
    "#a3e635", // lime
    "#34d399", // emerald
    "#22d3ee", // cyan
    "#60a5fa", // blue
    "#a78bfa", // violet
    "#f472b6", // pink
  ]

  return colors[Math.floor(Math.random() * colors.length)]
}

export function getVideoIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)

    // YouTube
    if (url.includes("youtube.com")) {
      return urlObj.searchParams.get("v")
    }

    if (url.includes("youtu.be")) {
      return urlObj.pathname.slice(1)
    }

    // Vimeo
    if (url.includes("vimeo.com")) {
      return urlObj.pathname.split("/").pop() || null
    }

    return null
  } catch {
    return null
  }
}

// Get available qualities for a video
export function getAvailableQualities(url: string): string[] {
  // For YouTube videos
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return ["auto", "144p", "240p", "360p", "480p", "720p", "1080p"]
  }

  // For Vimeo videos
  if (url.includes("vimeo.com")) {
    return ["auto", "360p", "540p", "720p", "1080p"]
  }

  // For direct video files, we can't determine qualities
  return ["auto"]
}

// Check if a URL is likely to be a direct video file
export function isDirectVideoFile(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv", ".m3u8", ".mpd", ".flv"]
    return videoExtensions.some((ext) => urlObj.pathname.toLowerCase().endsWith(ext))
  } catch {
    return false
  }
}
