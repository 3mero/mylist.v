// Service to fetch video metadata without API keys
export async function fetchVideoMetadata(url: string): Promise<{ title: string; thumbnail?: string } | null> {
  try {
    // For YouTube videos, use noembed service
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`)
      if (response.ok) {
        const data = await response.json()
        return {
          title: data.title || "Untitled Video",
          thumbnail: data.thumbnail_url,
        }
      }
    }

    // For Vimeo
    if (url.includes("vimeo.com")) {
      const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`)
      if (response.ok) {
        const data = await response.json()
        return {
          title: data.title || "Untitled Video",
          thumbnail: data.thumbnail_url,
        }
      }
    }

    // For other platforms, try oembed
    try {
      const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`)
      if (response.ok) {
        const data = await response.json()
        return {
          title: data.title || "Untitled Video",
          thumbnail: data.thumbnail_url,
        }
      }
    } catch {
      // Fallback to basic title extraction
    }

    return null
  } catch (error) {
    console.error("Error fetching video metadata:", error)
    return null
  }
}

// Extract video ID from various platforms
export function extractVideoId(url: string): string | null {
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
