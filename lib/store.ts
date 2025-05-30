import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Video, Playlist } from "./db"

interface VideoStore {
  currentVideo: Video | null
  currentPlaylist: Playlist | null
  playlistIndex: number
  isPlaying: boolean
  volume: number
  playbackRate: number
  isMuted: boolean

  setCurrentVideo: (video: Video | null) => void
  setCurrentPlaylist: (playlist: Playlist | null) => void
  setPlaylistIndex: (index: number) => void
  setIsPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
  setPlaybackRate: (rate: number) => void
  toggleMute: () => void

  playNext: () => void
  playPrevious: () => void
}

export const useVideoStore = create<VideoStore>()(
  persist(
    (set, get) => ({
      currentVideo: null,
      currentPlaylist: null,
      playlistIndex: 0,
      isPlaying: false,
      volume: 1,
      playbackRate: 1,
      isMuted: false,

      setCurrentVideo: (video) => set({ currentVideo: video }),
      setCurrentPlaylist: (playlist) => set({ currentPlaylist: playlist, playlistIndex: 0 }),
      setPlaylistIndex: (index) => set({ playlistIndex: index }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setVolume: (volume) => set({ volume }),
      setPlaybackRate: (rate) => set({ playbackRate: rate }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      playNext: () => {
        const { currentPlaylist, playlistIndex } = get()
        if (currentPlaylist && playlistIndex < currentPlaylist.videos.length - 1) {
          const nextIndex = playlistIndex + 1
          set({
            playlistIndex: nextIndex,
            currentVideo: currentPlaylist.videos[nextIndex],
            isPlaying: true,
          })
        }
      },

      playPrevious: () => {
        const { currentPlaylist, playlistIndex } = get()
        if (currentPlaylist && playlistIndex > 0) {
          const prevIndex = playlistIndex - 1
          set({
            playlistIndex: prevIndex,
            currentVideo: currentPlaylist.videos[prevIndex],
            isPlaying: true,
          })
        }
      },
    }),
    {
      name: "video-store",
      partialize: (state) => ({
        volume: state.volume,
        playbackRate: state.playbackRate,
        isMuted: state.isMuted,
      }),
    },
  ),
)
