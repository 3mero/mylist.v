"use client"

import type React from "react"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { db, type Video, type Playlist } from "@/lib/db"
import { VideoCard } from "@/components/video-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchIcon, ArrowLeft, Film, ListMusic } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { AddToPlaylistDialog } from "@/components/add-to-playlist-dialog"
import SearchLoading from "./loading"
import { useToast } from "@/components/ui/use-toast"

interface SearchResultItem {
  id: string // video.id or playlist.id
  type: "video" | "playlist"
  video?: Video
  playlist?: Playlist
  source?: string // "History" or "Playlist: <Name>"
  playlistName?: string // For videos found within a playlist context
  playlistId: number
}

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const [searchTerm, setSearchTerm] = useState(initialQuery) // For the input field on this page
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useLanguage()
  const { toast } = useToast()

  const [isAddToPlaylistDialogOpen, setIsAddToPlaylistDialogOpen] = useState(false)
  const [videoForPlaylistDialog, setVideoForPlaylistDialog] = useState<Video | null>(null)

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults([])
        setIsLoading(false)
        return
      }
      setIsLoading(true)

      const queryWords = query
        .toLowerCase()
        .split(" ")
        .filter((w) => w.length > 0)
      if (queryWords.length === 0) {
        setResults([])
        setIsLoading(false)
        return
      }

      const allVideos = await db.videos.toArray()
      const allPlaylists = await db.playlists.toArray()
      const searchResultsMap = new Map<string, SearchResultItem>()

      // Search playlists by name
      allPlaylists.forEach((playlist) => {
        const playlistNameLower = playlist.name.toLowerCase()
        if (queryWords.every((word) => playlistNameLower.includes(word))) {
          searchResultsMap.set(`playlist-${playlist.id}`, {
            id: `playlist-${playlist.id}`,
            type: "playlist",
            playlist: playlist,
          })
          // Add videos from this playlist if not already added with higher priority
          playlist.videos.forEach((video) => {
            if (video.id && !searchResultsMap.has(`video-${video.id}`)) {
              searchResultsMap.set(`video-${video.id}`, {
                id: `video-${video.id}`,
                type: "video",
                video: video,
                source: `${t.search.sourcePlaylist}: ${playlist.name}`,
                playlistName: playlist.name,
                playlistId: playlist.id,
              })
            }
          })
        }
      })

      // Search videos by title, url, category, tags
      allVideos.forEach((video) => {
        if (video.id && !searchResultsMap.has(`video-${video.id}`)) {
          // Only if not already added by playlist name match
          const searchableVideoText = [video.customTitle, video.title, video.url, video.category, ...(video.tags || [])]
            .join(" ")
            .toLowerCase()

          if (queryWords.every((word) => searchableVideoText.includes(word))) {
            let source = t.search.sourceHistory
            let pName: string | undefined = undefined
            let pId: number | undefined = undefined

            // Check if this video belongs to any playlist for context, even if playlist name didn't match query
            for (const pl of allPlaylists) {
              if (pl.videos.some((pv) => pv.id === video.id)) {
                source = `${t.search.sourcePlaylist}: ${pl.name}`
                pName = pl.name
                pId = pl.id
                break // Take the first playlist found
              }
            }
            searchResultsMap.set(`video-${video.id}`, {
              id: `video-${video.id}`,
              type: "video",
              video: video,
              source: source,
              playlistName: pName,
              playlistId: pId,
            })
          }
        }
      })
      setResults(Array.from(searchResultsMap.values()))
      setIsLoading(false)
    },
    [t.search.sourceHistory, t.search.sourcePlaylist, toast],
  )

  useEffect(() => {
    performSearch(initialQuery)
  }, [initialQuery, performSearch])

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`) // Update URL to reflect new search term
  }

  const handleOpenAddToPlaylistDialog = (video: Video) => {
    setVideoForPlaylistDialog(video)
    setIsAddToPlaylistDialogOpen(true)
  }

  const handleDeleteVideo = async (videoId?: number) => {
    if (!videoId) return
    await db.videos.delete(videoId)
    // Re-run search or filter results locally
    setResults((prevResults) => prevResults.filter((item) => !(item.type === "video" && item.video?.id === videoId)))
    toast({
      title: t.history.videoRemoved,
      description: t.common.videoRemovedFromApp,
    })
  }

  if (isLoading) {
    return <SearchLoading />
  }

  const queryDisplay = decodeURIComponent(initialQuery) || ""

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <form onSubmit={handleSearchSubmit} className="flex-grow">
          <div className="relative">
            <SearchIcon className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t.search.placeholderGlobal || "Search videos and playlists..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rtl:pr-10 w-full"
            />
          </div>
        </form>
      </div>

      {initialQuery && results.length > 0 && (
        <h1 className="text-2xl font-semibold">
          {t.search.resultsFor} "{queryDisplay}"
        </h1>
      )}

      {results.length === 0 && initialQuery && !isLoading && (
        <div className="text-center py-12">
          <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-xl text-muted-foreground">
            {t.search.noResultsFoundFor} "{queryDisplay}"
          </p>
          <p className="text-sm text-muted-foreground mt-2">{t.search.tryDifferentKeywords}</p>
        </div>
      )}

      {results.length === 0 && !initialQuery && !isLoading && (
        <div className="text-center py-12">
          <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-xl text-muted-foreground">{t.search.pleaseEnterSearchTerm}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {results.map((item) => {
          if (item.type === "video" && item.video) {
            return (
              <div key={item.id}>
                <VideoCard
                  video={item.video}
                  showAddToPlaylistButton={true}
                  onAddToPlaylist={handleOpenAddToPlaylistDialog}
                  showDelete={true} // Allow deleting from search results
                  onDelete={() => handleDeleteVideo(item.video?.id)}
                />
                {item.source && (
                  <p className="text-xs text-muted-foreground mt-1 px-1">
                    {item.source.startsWith(t.search.sourcePlaylist) && item.playlistId ? (
                      <Link href={`/playlists/${item.playlistId}`} className="hover:underline flex items-center">
                        <ListMusic className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0 flex-shrink-0" />
                        <span className="truncate" title={item.playlistName}>
                          {item.playlistName}
                        </span>
                      </Link>
                    ) : (
                      <span className="flex items-center">
                        <Film className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0 flex-shrink-0" />
                        {t.search.sourceHistory}
                      </span>
                    )}
                  </p>
                )}
              </div>
            )
          }
          // Placeholder for PlaylistCard if you want to render playlists differently
          // if (item.type === "playlist" && item.playlist) {
          //   return <PlaylistCard key={item.id} playlist={item.playlist} />;
          // }
          return null
        })}
      </div>
      <AddToPlaylistDialog
        open={isAddToPlaylistDialogOpen}
        onOpenChange={setIsAddToPlaylistDialogOpen}
        video={videoForPlaylistDialog}
      />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchPageContent />
    </Suspense>
  )
}
