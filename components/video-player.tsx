"use client"

import { useEffect, useRef, useState } from "react"
import ReactPlayer from "react-player"
import { useVideoStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  ListPlus,
  Trash2,
  ChevronRight,
  Settings,
  Maximize,
  Minimize,
  FileText,
  VolumeX,
  Volume,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { cn, formatDuration, getAvailableQualities, isDirectVideoFile, extractVideoTitle } from "@/lib/utils" // Added extractVideoTitle
import { db, type Subtitle, type Video } from "@/lib/db"
import { AddToPlaylistDialog } from "./add-to-playlist-dialog"
import { useLanguage } from "@/lib/i18n/language-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { StaticTitle } from "./static-title"

const LOADING_TIMEOUT_MS = 30000 // 30 seconds

export function VideoPlayer() {
  const playerRef = useRef<ReactPlayer>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const {
    currentVideo: videoFromStore,
    currentPlaylist,
    isPlaying,
    volume,
    playbackRate,
    setIsPlaying,
    setVolume,
    playNext,
    playPrevious,
    setCurrentVideo: setVideoInStore,
    playlistIndex,
    setCurrentPlaylist,
  } = useVideoStore()

  const [currentPlayerVideo, setCurrentPlayerVideo] = useState<Video | null>(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false)
  const [showNextVideoOverlay, setShowNextVideoOverlay] = useState(false)
  const [nextVideoCountdown, setNextVideoCountdown] = useState(5)
  const [availableQualities, setAvailableQualities] = useState<string[]>(["auto"])
  const [selectedQuality, setSelectedQuality] = useState("auto")
  const [isDirectVideo, setIsDirectVideo] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isCinemaMode, setIsCinemaMode] = useState(false)
  const [isAudioOnly, setIsAudioOnly] = useState(false)
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null)
  const [subtitles, setSubtitles] = useState<Subtitle[]>([])
  const [isSubtitleDialogOpen, setIsSubtitleDialogOpen] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(1)
  const [playerKey, setPlayerKey] = useState(Date.now())
  const [isLoading, setIsLoading] = useState(true)
  const [playerError, setPlayerError] = useState<string | null>(null)

  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  const nextVideoTimeoutRef = useRef<NodeJS.Timeout>()
  const countdownIntervalRef = useRef<NodeJS.Timeout>()
  const loadingTimerRef = useRef<NodeJS.Timeout>()

  const { toast } = useToast()
  const { t } = useLanguage()

  const clearLoadingTimer = () => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current)
      loadingTimerRef.current = undefined
    }
  }

  useEffect(() => {
    const processVideo = async () => {
      clearLoadingTimer()

      if (videoFromStore && videoFromStore.url) {
        setIsLoading(true)
        setPlayerError(null)

        loadingTimerRef.current = setTimeout(() => {
          if (isLoading && !playerError) {
            // Only trigger timeout if still loading and no other error occurred
            handleError("timeout", { type: "loadingTimeout" })
          }
        }, LOADING_TIMEOUT_MS)

        let videoDataFromDb: Video | null | undefined = null

        if (videoFromStore.id) {
          videoDataFromDb = await db.videos.get(videoFromStore.id)
        }

        if (videoDataFromDb) {
          // Video exists in DB by ID
          const definitiveVideo = await db.addToHistory(videoDataFromDb) // Update lastWatched, etc.
          if (definitiveVideo) {
            setCurrentPlayerVideo(definitiveVideo)
            if (JSON.stringify(definitiveVideo) !== JSON.stringify(videoFromStore)) {
              setVideoInStore(definitiveVideo)
            }
          } else {
            handleError("db_error_update", { message: t.player.errorLoadingVideoDetails + " (update)" })
          }
        } else if (videoFromStore.id && !videoDataFromDb) {
          // ID in store, but not in DB (deleted)
          setCurrentPlayerVideo(null)
          // setVideoInStore(null) should have been called by handleDeleteVideo, leading here.
          // If HomePage reacts correctly, this component instance might be unmounted.
          // If not, it will show "no video".
          setIsLoading(false)
          clearLoadingTimer()
        } else if (videoFromStore.url) {
          // No ID in store or ID was invalid, try by URL (new or existing)
          const existingByUrl = await db.videos.where("url").equals(videoFromStore.url).first()
          if (existingByUrl) {
            const definitiveVideo = await db.addToHistory(existingByUrl)
            if (definitiveVideo) {
              setCurrentPlayerVideo(definitiveVideo)
              setVideoInStore(definitiveVideo) // Ensure store has the ID
            } else {
              handleError("db_error_existing_url", { message: t.player.errorLoadingVideoDetails + " (url existing)" })
            }
          } else {
            // Truly new video, add it
            const newVideoPayload: Partial<Video> = {
              url: videoFromStore.url,
              title: videoFromStore.title || extractVideoTitle(videoFromStore.url),
              customTitle: videoFromStore.customTitle,
              thumbnail: videoFromStore.thumbnail,
              tags: videoFromStore.tags,
              category: videoFromStore.category,
              // other fields from videoFromStore if they are part of initial creation
            }
            const newVideoEntry = await db.addToHistory(newVideoPayload as Video)
            if (newVideoEntry) {
              setCurrentPlayerVideo(newVideoEntry)
              setVideoInStore(newVideoEntry)
            } else {
              handleError("db_error_new", { message: t.player.errorLoadingVideoDetails + " (new)" })
            }
          }
        } else {
          // No valid video data to process (e.g. no URL but videoFromStore existed)
          setCurrentPlayerVideo(null)
          setIsLoading(false)
          clearLoadingTimer()
        }
      } else {
        // No videoFromStore or no URL in videoFromStore
        setCurrentPlayerVideo(null)
        setIsLoading(false)
        clearLoadingTimer()
      }
    }

    processVideo()

    return () => {
      clearLoadingTimer()
    }
    // Depend on specific fields that define the video identity
    // This ensures the effect re-runs if the video truly changes or is cleared
  }, [
    videoFromStore?.id,
    videoFromStore?.url,
    videoFromStore?.title,
    videoFromStore?.customTitle,
    videoFromStore?.thumbnail,
    videoFromStore?.tags,
    videoFromStore?.category,
    setVideoInStore,
    t.player.errorLoadingVideoDetails,
    videoFromStore?.category,
  ])

  useEffect(() => {
    if (currentPlayerVideo) {
      setIsDirectVideo(isDirectVideoFile(currentPlayerVideo.url))
      const qualities = getAvailableQualities(currentPlayerVideo.url)
      setAvailableQualities(qualities)
      setSelectedQuality(currentPlayerVideo.preferredQuality || "auto")
      setSubtitles(currentPlayerVideo.subtitles || [])
      if (playerRef.current && playerRef.current.props.url !== currentPlayerVideo.url) {
        setSelectedSubtitle(null)
      }
      // Only change playerKey if the URL actually changes to avoid unnecessary re-renders of ReactPlayer
      if (playerRef.current?.props?.url !== currentPlayerVideo.url) {
        setPlayerKey(Date.now())
      }
    } else {
      // If no currentPlayerVideo, reset player-specific states
      setAvailableQualities(["auto"])
      setSelectedQuality("auto")
      setSubtitles([])
      setSelectedSubtitle(null)
    }
  }, [currentPlayerVideo])

  useEffect(() => {
    const loadSettings = async () => {
      const activeProfile = await db.getActiveProfile()
      if (activeProfile?.settings) {
        setIsCinemaMode(activeProfile.settings.cinemaMode || false)
        setIsAudioOnly(activeProfile.settings.audioOnlyMode || false)
      }
    }
    loadSettings()
  }, [])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      switch (e.key) {
        case " ":
          e.preventDefault()
          if (!isLoading && !playerError) setIsPlaying(!isPlaying)
          break
        case "ArrowLeft":
          e.preventDefault()
          if (!isLoading && !playerError && playerRef.current)
            playerRef.current.seekTo(playerRef.current.getCurrentTime() - 10)
          break
        case "ArrowRight":
          e.preventDefault()
          if (!isLoading && !playerError && playerRef.current)
            playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10)
          break
        case "ArrowUp":
          e.preventDefault()
          if (!isLoading && !playerError) setVolume(Math.min(volume + 0.1, 1))
          break
        case "ArrowDown":
          e.preventDefault()
          if (!isLoading && !playerError) setVolume(Math.max(volume - 0.1, 0))
          break
        case "n":
        case "N":
          e.preventDefault()
          if (!isLoading && !playerError) handleSkipToNext()
          break
        case "p":
        case "P":
          e.preventDefault()
          if (!isLoading && !playerError) playPrevious()
          break
        case "m":
        case "M":
          e.preventDefault()
          if (!isLoading && !playerError) toggleMute()
          break
        case "f":
        case "F":
          e.preventDefault()
          if (!isLoading && !playerError) toggleFullscreen()
          break
        case "c":
        case "C":
          e.preventDefault()
          if (!isLoading && !playerError) toggleCinemaMode()
          break
        case "a":
        case "A":
          e.preventDefault()
          if (!isLoading && !playerError) toggleAudioOnly()
          break
      }
    }
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [
    isPlaying,
    // progress, // Not needed for keydown handler logic
    volume,
    playNext,
    playPrevious,
    setIsPlaying,
    setVolume,
    isFullscreen,
    isCinemaMode,
    isAudioOnly,
    isLoading,
    playerError,
  ])

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setProgress(state.playedSeconds)
  }
  const handleDuration = (duration: number) => {
    setDuration(duration)
  }

  const handleReady = () => {
    clearLoadingTimer()
    setIsLoading(false)
    setPlayerError(null)
  }

  const handleError = (error: any, data?: any, hlsInstance?: any, hlsGlobal?: any) => {
    clearLoadingTimer()
    setIsLoading(false)
    console.error("Video Player Error:", error, data, hlsInstance, hlsGlobal)

    let errorMessage = t.player.errorGeneric
    const errorType = data?.type || (typeof error === "string" ? error : data?.message || "")

    if (errorType === "loadingTimeout") {
      errorMessage = t.player.errorTimeout
    } else if (errorType === "databaseError" && data?.message) {
      errorMessage = data.message
    } else if (errorType.includes("db_error")) {
      // Catch specific db error types from processVideo
      errorMessage = data?.message || t.player.errorLoadingVideoDetails
    } else if (
      errorType === "networkError" ||
      String(data).includes("NETWORK_ERROR") ||
      String(error).includes("NetworkError")
    ) {
      errorMessage = t.player.errorNetwork
    } else if (
      errorType === "mediaError" ||
      String(data).includes("MEDIA_ERR_SRC_NOT_SUPPORTED") ||
      (error?.name === "MediaError" && error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) ||
      String(error).includes("MediaError") // Broader catch for MediaError strings
    ) {
      errorMessage = t.player.errorMediaFormat
    } else if (
      String(error).includes("403") ||
      String(data).includes("403") ||
      (data?.details?.includes && data.details.includes("403"))
    ) {
      errorMessage = t.player.errorForbidden
    } else if (error?.message && typeof error.message === "string") {
      errorMessage = error.message
    } else if (typeof error === "string" && error.length > 0 && error.length < 150) {
      errorMessage = error
    }

    setPlayerError(errorMessage)
    // Avoid duplicate toasts if error is already shown
    if (currentPlayerVideo || videoFromStore) {
      // Only toast if there was an attempt to play a video
      toast({
        title: t.player.errorLoadingVideo,
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleEnded = async () => {
    const activeProfile = await db.getActiveProfile()
    let autoplayEnabled = true
    if (activeProfile?.settings?.id) {
      const profileSettings = await db.settings.get(activeProfile.settings.id)
      if (profileSettings) autoplayEnabled = profileSettings.autoplay
    }

    if (autoplayEnabled && currentPlaylist && playlistIndex < currentPlaylist.videos.length - 1) {
      setShowNextVideoOverlay(true)
      setNextVideoCountdown(5)
      countdownIntervalRef.current = setInterval(() => {
        setNextVideoCountdown((prev) => (prev <= 1 ? (clearInterval(countdownIntervalRef.current!), 0) : prev - 1))
      }, 1000)
      nextVideoTimeoutRef.current = setTimeout(() => {
        handleSkipToNext()
      }, 5000)
    } else {
      setIsPlaying(false) // Stop playing if autoplay is off or end of playlist
    }
  }

  const handleSkipToNext = () => {
    if (nextVideoTimeoutRef.current) clearTimeout(nextVideoTimeoutRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    setShowNextVideoOverlay(false)
    setNextVideoCountdown(5)
    playNext()
  }

  const handleSeek = (value: number[]) => {
    playerRef.current?.seekTo(value[0])
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }

  const handleDeleteVideo = async () => {
    if (!currentPlayerVideo || !currentPlayerVideo.id) return
    const videoIdToDelete = currentPlayerVideo.id // Store ID before it might change

    try {
      await db.videos.delete(videoIdToDelete)

      if (currentPlaylist && currentPlaylist.id) {
        const updatedVideos = currentPlaylist.videos.filter((v) => v.id !== videoIdToDelete)
        const updatedPlaylist = { ...currentPlaylist, videos: updatedVideos, updatedAt: new Date() }
        // Update playlist in DB
        await db.playlists.update(currentPlaylist.id, { videos: updatedVideos, updatedAt: new Date() })
        // Update playlist in store
        setCurrentPlaylist(updatedPlaylist)

        if (updatedVideos.length > 0) {
          if (playlistIndex >= updatedVideos.length) {
            // Was last video
            setVideoInStore(updatedVideos[updatedVideos.length - 1]) // Play new last video
          } else {
            setVideoInStore(updatedVideos[playlistIndex]) // Play video at current index (might be next)
          }
        } else {
          // Playlist is now empty
          setCurrentPlaylist(null) // Clear current playlist from store
          setVideoInStore(null) // Clear current video
        }
      } else {
        // Not in a playlist, just clear the video
        setVideoInStore(null)
      }
      toast({ title: t.player.deleteVideo, description: t.history.videoRemoved })
    } catch (e) {
      console.error("Error deleting video:", e)
      toast({ title: t.common.error, description: "Failed to delete video.", variant: "destructive" })
    }
  }

  const cancelNextVideo = () => {
    if (nextVideoTimeoutRef.current) clearTimeout(nextVideoTimeoutRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    setShowNextVideoOverlay(false)
    setNextVideoCountdown(5)
  }

  const handleQualityChange = async (quality: string) => {
    setSelectedQuality(quality)
    if (currentPlayerVideo && currentPlayerVideo.id) {
      const updatedVideo = { ...currentPlayerVideo, preferredQuality: quality }
      await db.updateVideoQuality(currentPlayerVideo.id, quality)
      setCurrentPlayerVideo(updatedVideo)
      setVideoInStore(updatedVideo)
      toast({ title: t.player.qualityChanged, description: `${t.player.qualitySet} ${quality}` })
      setPlayerKey(Date.now())
    }
  }

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return
    if (!document.fullscreenElement)
      playerContainerRef.current
        .requestFullscreen()
        .catch((err) =>
          toast({ title: "Fullscreen Error", description: `Error: ${err.message}`, variant: "destructive" }),
        )
    else document.exitFullscreen()
  }

  const toggleCinemaMode = async () => {
    const newMode = !isCinemaMode
    setIsCinemaMode(newMode)
    await db.toggleCinemaMode(newMode)
    toast({ title: newMode ? t.player.cinemaModeEnabled : t.player.cinemaModeDisabled })
  }

  const toggleAudioOnly = async () => {
    const newMode = !isAudioOnly
    setIsAudioOnly(newMode)
    await db.toggleAudioOnlyMode(newMode)
    toast({ title: newMode ? t.player.audioOnlyEnabled : t.player.audioOnlyDisabled })
  }

  const toggleMute = () => {
    if (volume === 0) setVolume(previousVolume || 0.5)
    else {
      setPreviousVolume(volume)
      setVolume(0)
    }
  }

  const handleSubtitleChange = (url: string | null) => {
    setSelectedSubtitle(url)
  }

  const handleSubtitleDialogClose = async (subtitlesUpdated?: boolean) => {
    setIsSubtitleDialogOpen(false)
    if (subtitlesUpdated && currentPlayerVideo && currentPlayerVideo.id) {
      try {
        const videoFromDb = await db.videos.get(currentPlayerVideo.id)
        if (videoFromDb) {
          setSubtitles(videoFromDb.subtitles || [])
          setCurrentPlayerVideo(videoFromDb)
          setVideoInStore(videoFromDb)
          toast({ title: t.player.subtitlesUpdated })
        }
      } catch (error) {
        console.error("Error updating subtitles:", error)
        toast({ title: t.common.error, description: t.player.subtitlesUpdateFailed, variant: "destructive" })
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  useEffect(() => {
    return () => {
      if (nextVideoTimeoutRef.current) clearTimeout(nextVideoTimeoutRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      clearLoadingTimer()
    }
  }, [])

  if (!currentPlayerVideo && !videoFromStore && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted text-muted-foreground h-96">
        <p>{t.player.noVideoSelected}</p>
      </div>
    )
  }

  const nextVideoInPlaylist =
    currentPlaylist && playlistIndex < currentPlaylist.videos.length - 1
      ? currentPlaylist.videos[playlistIndex + 1]
      : null

  const playerConfig = {
    youtube: {
      playerVars: {
        quality: selectedQuality !== "auto" ? selectedQuality : undefined,
        cc_load_policy: 1,
        cc_lang_pref: "en",
      },
    },
    file: {
      attributes: { crossOrigin: "anonymous" },
      forceVideo: !isAudioOnly,
      tracks: subtitles.map((sub) => ({
        kind: "subtitles",
        src: sub.url,
        srcLang: sub.language,
        label: sub.label,
        default: selectedSubtitle === sub.url,
      })),
    },
  }

  const displayTitleForAudioOnly =
    currentPlayerVideo?.customTitle || currentPlayerVideo?.title || t.player.untitledVideo

  return (
    <div
      ref={playerContainerRef}
      className={cn(
        "flex-1 relative w-full",
        isFullscreen && "fixed inset-0 z-50 bg-black",
        isCinemaMode && !isFullscreen && "fixed inset-0 z-40 bg-black/90 flex items-center justify-center",
      )}
    >
      <Card
        className={cn(
          "overflow-hidden w-full h-full flex flex-col",
          isCinemaMode && !isFullscreen && "max-w-5xl mx-auto",
        )}
      >
        {currentPlayerVideo && (
          <CardHeader className="p-2 md:p-4 border-b">
            <StaticTitle video={currentPlayerVideo} className="flex-grow" textClassName="text-lg md:text-xl truncate" />
          </CardHeader>
        )}

        <CardContent className="p-0 flex-grow relative">
          <div
            className="relative aspect-video bg-black w-full h-full"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
          >
            {isLoading && !playerError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-white text-lg">{t.common.loading}...</p>
              </div>
            )}
            {playerError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 p-4 text-center">
                <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                <p className="text-destructive font-semibold">{t.player.errorLoadingVideo}</p>
                <p className="text-muted-foreground text-sm mt-1">{playerError}</p>
              </div>
            )}
            {isAudioOnly && currentPlayerVideo && !isLoading && !playerError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center text-white space-y-4 p-4">
                  <Volume className="w-16 h-16 mx-auto opacity-50" />
                  <h3 className="text-xl font-medium truncate" title={displayTitleForAudioOnly}>
                    {displayTitleForAudioOnly}
                  </h3>
                  <p className="text-sm opacity-70">{t.player.audioOnlyMode}</p>
                </div>
              </div>
            )}
            {currentPlayerVideo && (
              <ReactPlayer
                key={playerKey}
                ref={playerRef}
                url={currentPlayerVideo.url}
                playing={isPlaying}
                volume={volume}
                playbackRate={playbackRate}
                width="100%"
                height="100%"
                onProgress={handleProgress}
                onDuration={handleDuration}
                onEnded={handleEnded}
                onReady={handleReady}
                onError={handleError}
                onBuffer={() => {
                  if (!playerError) setIsLoading(true)
                  clearLoadingTimer()
                }}
                onBufferEnd={() => {
                  if (!playerError) setIsLoading(false)
                }}
                config={playerConfig}
                style={{ display: isAudioOnly || isLoading || playerError ? "none" : "block" }}
              />
            )}
            {showNextVideoOverlay && nextVideoInPlaylist && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="text-center text-white space-y-4 p-8 max-w-lg">
                  <h3 className="text-2xl font-semibold">{t.player.nextVideo}</h3>
                  <p className="text-xl truncate" title={nextVideoInPlaylist.customTitle || nextVideoInPlaylist.title}>
                    {nextVideoInPlaylist.customTitle || nextVideoInPlaylist.title}
                  </p>
                  <div className="text-4xl font-bold">{nextVideoCountdown}</div>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={handleSkipToNext} variant="secondary">
                      <ChevronRight className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t.player.playNow}
                    </Button>
                    <Button onClick={cancelNextVideo} variant="outline">
                      {t.common.cancel}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 md:p-4 transition-opacity",
                showControls && !isLoading && !playerError ? "opacity-100" : "opacity-0 pointer-events-none",
              )}
            >
              <div className="space-y-2">
                <Slider
                  value={[progress]}
                  max={duration}
                  step={1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                  disabled={isLoading || !!playerError}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 md:gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="text-white hover:bg-white/20"
                      disabled={isLoading || !!playerError}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 md:w-5 md:h-5" />
                      ) : (
                        <Play className="w-4 h-4 md:w-5 md:h-5" />
                      )}
                    </Button>
                    {currentPlaylist && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={playPrevious}
                          className="text-white hover:bg-white/20"
                          disabled={isLoading || !!playerError || playlistIndex === 0}
                        >
                          <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleSkipToNext}
                          className="text-white hover:bg-white/20"
                          disabled={isLoading || !!playerError || !nextVideoInPlaylist}
                        >
                          <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                      </>
                    )}
                    <div className="flex items-center gap-1 md:gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={toggleMute}
                        className="text-white hover:bg-white/20"
                        disabled={isLoading || !!playerError}
                      >
                        {volume === 0 ? (
                          <VolumeX className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                          <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
                        )}
                      </Button>
                      <Slider
                        value={[volume * 100]}
                        max={100}
                        step={1}
                        onValueChange={(v) => setVolume(v[0] / 100)}
                        className="w-16 md:w-24"
                        disabled={isLoading || !!playerError}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    {subtitles.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/20"
                            disabled={isLoading || !!playerError}
                          >
                            <FileText className="w-4 h-4 mr-1 md:mr-2" />
                            {selectedSubtitle ? t.player.ccOn : t.player.ccOff}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => handleSubtitleChange(null)}
                            className={!selectedSubtitle ? "bg-accent" : ""}
                          >
                            {t.common.off}
                          </DropdownMenuItem>
                          {subtitles.map((sub) => (
                            <DropdownMenuItem
                              key={sub.id || sub.url}
                              onClick={() => handleSubtitleChange(sub.url)}
                              className={selectedSubtitle === sub.url ? "bg-accent" : ""}
                            >
                              {sub.label} ({sub.language})
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <div className="text-white text-xs md:text-sm">
                      {formatDuration(progress)} / {formatDuration(duration)}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={toggleFullscreen}
                      className="text-white hover:bg-white/20"
                      disabled={isLoading || !!playerError}
                    >
                      {isFullscreen ? (
                        <Minimize className="w-4 h-4 md:w-5 md:h-5" />
                      ) : (
                        <Maximize className="w-4 h-4 md:w-5 md:h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        {currentPlayerVideo && (
          <div className="p-2 md:p-4 border-t space-y-2 md:space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {currentPlaylist && (
                <Badge variant="secondary">
                  {t.player.playingFrom}: {currentPlaylist.name} ({playlistIndex + 1}/{currentPlaylist.videos.length})
                </Badge>
              )}
              <AddToPlaylistDialog
                open={isAddToPlaylistOpen}
                onOpenChange={setIsAddToPlaylistOpen}
                video={currentPlayerVideo}
              >
                <Button size="sm" variant="outline">
                  <ListPlus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t.player.addToPlaylist}
                </Button>
              </AddToPlaylistDialog>
              <Button size="sm" variant="destructive" onClick={handleDeleteVideo}>
                <Trash2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t.common.delete}
              </Button>
            </div>

            {currentPlayerVideo.tags && currentPlayerVideo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-sm text-muted-foreground mr-1">{t.common.tags}:</span>
                {currentPlayerVideo.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {currentPlayerVideo.category && (
              <div>
                <Badge variant="outline" className="text-xs">
                  {t.common.category}: {currentPlayerVideo.category}
                </Badge>
              </div>
            )}

            <div className="flex flex-wrap gap-2 items-center">
              {availableQualities.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isLoading || !!playerError}>
                      <Settings className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t.common.quality}: {selectedQuality}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {availableQualities.map((q) => (
                      <DropdownMenuItem
                        key={q}
                        onClick={() => handleQualityChange(q)}
                        className={selectedQuality === q ? "bg-accent" : ""}
                      >
                        {q}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Dialog
                open={isSubtitleDialogOpen}
                onOpenChange={(isOpen) => handleSubtitleDialogClose(isOpen ? undefined : false)}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isLoading || !!playerError}>
                    <FileText className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {subtitles.length > 0 ? t.player.manageSubtitles : t.player.addSubtitles}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{subtitles.length > 0 ? t.player.manageSubtitles : t.player.addSubtitles}</DialogTitle>
                  </DialogHeader>
                  <p>Subtitle management UI will go here. For now, close to refresh if changes were made externally.</p>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={toggleCinemaMode} disabled={isLoading || !!playerError}>
                {isCinemaMode ? <Minimize className="w-4 h-4 mr-2" /> : <Maximize className="w-4 h-4 mr-2" />}
                {isCinemaMode ? t.player.exitCinemaMode : t.player.cinemaMode}
              </Button>
              <Button variant="outline" size="sm" onClick={toggleAudioOnly} disabled={isLoading || !!playerError}>
                {isAudioOnly ? <Volume className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                {isAudioOnly ? t.player.showVideo : t.player.audioOnly}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
