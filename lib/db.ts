import Dexie, { type Table } from "dexie"

export interface Video {
  id?: number
  url: string
  title: string
  customTitle?: string
  thumbnail?: string
  duration?: number
  lastWatched?: Date
  watchCount?: number
  preferredQuality?: string
  subtitles?: Subtitle[]
  tags?: string[]
  category?: string
}

export interface Subtitle {
  id?: number
  label: string
  language: string
  url: string
  format: "srt" | "vtt"
}

export interface Playlist {
  id?: number
  name: string
  description?: string
  videos: Video[]
  createdAt: Date
  updatedAt: Date
  tags?: string[]
  category?: string
  isDefault?: boolean
}

export interface Settings {
  id?: number
  theme: "light" | "dark" | "system"
  backgroundColor?: string
  backgroundImage?: string
  historyLimit: number // Options: 50, 100, 500
  videoQuality: "480p" | "720p" | "1080p" | "auto"
  bufferSize: "low" | "medium" | "high"
  autoplay: boolean
  defaultPlaylistId?: number
  cinemaMode: boolean
  audioOnlyMode: boolean
  uiColor?: string
  uiLayout?: "default" | "compact" | "comfortable"
}

export interface Profile {
  id?: number
  name: string
  avatar?: string
  createdAt: Date
  isActive: boolean
  settings?: Settings // This should ideally be just settingsId: number
}

export interface WatchStats {
  id?: number
  profileId: number
  date: Date
  totalWatchTime: number
  videoCount: number
  categories: Record<string, number>
  mostWatchedTags: Record<string, number>
}

export class VideoDatabase extends Dexie {
  videos!: Table<Video>
  playlists!: Table<Playlist>
  settings!: Table<Settings>
  profiles!: Table<Profile>
  watchStats!: Table<WatchStats>

  private lastWatchCountUpdate: Record<number, number> = {}
  private WATCH_COUNT_COOLDOWN = 10000 // 10 seconds

  constructor() {
    super("VideoStreamingDB")
    this.version(3).stores({
      videos: "++id, url, lastWatched, customTitle, category, *tags",
      playlists: "++id, name, createdAt, updatedAt, category, *tags",
      settings: "++id",
      profiles: "++id, name, isActive", // isActive is indexed
      watchStats: "++id, profileId, date",
    })
  }

  async getActiveProfile(): Promise<Profile | undefined> {
    try {
      // Using filter client-side as a robust way if where().equals(true) is problematic
      const allProfiles = await this.profiles.toArray()
      return allProfiles.find((profile) => profile.isActive === true)
    } catch (error) {
      console.error("Error getting active profile:", error)
      return undefined
    }
  }

  async getActiveProfileSettings(): Promise<Settings | undefined> {
    const activeProfile = await this.getActiveProfile()
    if (activeProfile?.settings?.id) {
      return this.settings.get(activeProfile.settings.id)
    }
    const allSettings = await this.settings.toArray()
    if (allSettings.length > 0) return allSettings[0]
    return undefined
  }

  async switchProfile(profileIdToActivate: number): Promise<void> {
    try {
      await this.transaction("rw", this.profiles, async () => {
        const allProfiles = await this.profiles.toArray()
        for (const profile of allProfiles) {
          if (profile.id === profileIdToActivate) {
            if (!profile.isActive) {
              await this.profiles.update(profile.id, { isActive: true })
            }
          } else if (profile.isActive) {
            // Deactivate any other active profile
            await this.profiles.update(profile.id, { isActive: false })
          }
        }
      })
    } catch (error) {
      console.error("Error switching profile:", error)
      throw error
    }
  }

  async createProfile(name: string, avatar?: string): Promise<number> {
    try {
      return await this.transaction("rw", this.profiles, this.settings, async () => {
        // Deactivate all currently active profiles
        const allProfiles = await this.profiles.toArray()
        for (const profileToDeactivate of allProfiles) {
          if (profileToDeactivate.isActive && profileToDeactivate.id) {
            await this.profiles.update(profileToDeactivate.id, { isActive: false })
          }
        }

        const defaultSettings: Omit<Settings, "id"> = {
          theme: "system",
          historyLimit: 500,
          videoQuality: "auto",
          bufferSize: "medium",
          autoplay: true,
          cinemaMode: false,
          audioOnlyMode: false,
        }
        const settingsId = await this.settings.add(defaultSettings as Settings)

        return this.profiles.add({
          name,
          avatar,
          createdAt: new Date(),
          isActive: true, // New profile is active
          settings: { id: settingsId } as Settings,
        })
      })
    } catch (error) {
      console.error("Error creating profile:", error)
      throw error // Re-throw to be caught by UI
    }
  }

  async deleteProfile(profileId: number): Promise<void> {
    try {
      await this.transaction("rw", this.profiles, this.settings, this.watchStats, async () => {
        const profile = await this.profiles.get(profileId)
        if (!profile) return

        if (profile.settings?.id) {
          await this.settings.delete(profile.settings.id)
        }
        await this.watchStats.where("profileId").equals(profileId).delete()
        await this.profiles.delete(profileId)

        if (profile.isActive) {
          const anotherProfile = await this.profiles.orderBy("createdAt").first()
          if (anotherProfile?.id) {
            await this.profiles.update(anotherProfile.id, { isActive: true })
          }
        }
      })
    } catch (error) {
      console.error("Error deleting profile:", error)
      throw error
    }
  }

  async addToHistory(
    video: Omit<Video, "id" | "watchCount" | "lastWatched"> & Partial<Pick<Video, "id" | "watchCount" | "lastWatched">>,
  ): Promise<Video | undefined> {
    try {
      const activeProfile = await this.getActiveProfile()
      if (!activeProfile?.id) return undefined

      const currentSettings = await this.getActiveProfileSettings()
      const historyLimit = currentSettings?.historyLimit || 500

      const existingVideo = await this.videos.where("url").equals(video.url).first()
      let videoToReturn: Video | undefined

      const videoDataForDb = {
        url: video.url,
        title: video.title,
        customTitle: video.customTitle || video.title,
        thumbnail: video.thumbnail,
        duration: video.duration,
        preferredQuality: video.preferredQuality,
        subtitles: video.subtitles,
        tags: video.tags,
        category: video.category,
        lastWatched: new Date(),
      }

      if (existingVideo && existingVideo.id) {
        let newWatchCount = existingVideo.watchCount || 0
        const now = Date.now()
        const lastUpdate = this.lastWatchCountUpdate[existingVideo.id] || 0

        if (newWatchCount === 0 || now - lastUpdate > this.WATCH_COUNT_COOLDOWN) {
          newWatchCount += 1
          this.lastWatchCountUpdate[existingVideo.id] = now
        }

        const updatedVideoData: Video = {
          ...existingVideo,
          ...videoDataForDb,
          id: existingVideo.id,
          watchCount: newWatchCount,
        }
        await this.videos.update(existingVideo.id, updatedVideoData)
        await this.updateWatchStats(activeProfile.id, updatedVideoData)
        videoToReturn = updatedVideoData
      } else {
        const newVideoDataWithCount: Video = {
          ...videoDataForDb,
          watchCount: 1,
        } as Video
        const newId = await this.videos.add(newVideoDataWithCount)
        videoToReturn = { ...newVideoDataWithCount, id: newId }
        if (newId) {
          this.lastWatchCountUpdate[newId] = Date.now()
        }
        await this.updateWatchStats(activeProfile.id, videoToReturn)

        const count = await this.videos.count()
        if (count > historyLimit) {
          const oldestVideos = await this.videos
            .orderBy("lastWatched")
            .limit(count - historyLimit)
            .toArray()
          await Promise.all(oldestVideos.map((v) => v.id && this.videos.delete(v.id)))
        }
      }
      return videoToReturn
    } catch (error) {
      console.error("Error adding to history:", error)
      return undefined
    }
  }

  async updateWatchStats(profileId: number, video: Video): Promise<void> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let stats = await this.watchStats
        .filter((s) => {
          if (!s.date || !s.profileId) return false
          const date = new Date(s.date)
          date.setHours(0, 0, 0, 0)
          return date.getTime() === today.getTime() && s.profileId === profileId
        })
        .first()

      if (!stats) {
        stats = {
          profileId,
          date: today,
          totalWatchTime: 0,
          videoCount: 0,
          categories: {},
          mostWatchedTags: {},
        }
      }

      stats.videoCount += 1
      const watchTime = video.duration || 300
      stats.totalWatchTime += watchTime
      if (video.category) {
        stats.categories[video.category] = (stats.categories[video.category] || 0) + 1
      }
      if (video.tags && video.tags.length > 0) {
        video.tags.forEach((tag) => {
          stats.mostWatchedTags[tag] = (stats.mostWatchedTags[tag] || 0) + 1
        })
      }

      if (stats.id) {
        await this.watchStats.update(stats.id, stats)
      } else {
        await this.watchStats.add(stats)
      }
    } catch (error) {
      console.error("Error updating watch stats:", error)
    }
  }

  async updateVideoTitle(videoId: number, customTitle: string): Promise<number> {
    const updateCount = await this.videos.update(videoId, { customTitle })
    if (updateCount > 0) {
      const updatedVideo = await this.videos.get(videoId)
      if (updatedVideo) {
        await this.updateVideoInAllPlaylists(videoId, updatedVideo)
      }
    }
    return updateCount
  }

  async updateVideoQuality(videoId: number, preferredQuality: string) {
    try {
      return this.videos.update(videoId, { preferredQuality })
    } catch (error) {
      console.error("Error updating video quality:", error)
      throw error
    }
  }

  async updateVideoTags(videoId: number, tags: string[]) {
    try {
      return this.videos.update(videoId, { tags })
    } catch (error) {
      console.error("Error updating video tags:", error)
      throw error
    }
  }

  async updateVideoCategory(videoId: number, category: string) {
    try {
      return this.videos.update(videoId, { category })
    } catch (error) {
      console.error("Error updating video category:", error)
      throw error
    }
  }

  async addSubtitleToVideo(videoId: number, subtitle: Subtitle) {
    try {
      const video = await this.videos.get(videoId)
      if (!video) return

      const subtitles = video.subtitles || []
      subtitles.push(subtitle)

      return this.videos.update(videoId, { subtitles })
    } catch (error) {
      console.error("Error adding subtitle to video:", error)
      throw error
    }
  }

  async removeSubtitleFromVideo(videoId: number, subtitleId: number) {
    try {
      const video = await this.videos.get(videoId)
      if (!video || !video.subtitles) return

      const subtitles = video.subtitles.filter((s) => s.id !== subtitleId)
      return this.videos.update(videoId, { subtitles })
    } catch (error) {
      console.error("Error removing subtitle from video:", error)
      throw error
    }
  }

  async updateVideoInAllPlaylists(videoId: number, updatedVideoData: Partial<Video>): Promise<void> {
    try {
      const allPlaylists = await this.playlists.toArray()
      for (const playlist of allPlaylists) {
        let playlistWasUpdated = false
        const updatedPlaylistVideos = playlist.videos.map((videoInPlaylist) => {
          if (videoInPlaylist.id === videoId) {
            playlistWasUpdated = true
            return { ...videoInPlaylist, ...updatedVideoData }
          }
          return videoInPlaylist
        })

        if (playlistWasUpdated && playlist.id) {
          await this.playlists.update(playlist.id, {
            videos: updatedPlaylistVideos,
            updatedAt: new Date(),
          })
        }
      }
    } catch (error) {
      console.error("Error updating video in playlists:", error)
      throw error
    }
  }

  async searchVideos(
    query: string,
    filters?: {
      category?: string
      tags?: string[]
      dateFrom?: Date
      dateTo?: Date
    },
  ): Promise<Video[]> {
    try {
      let collection = this.videos.toCollection()

      if (filters) {
        collection = collection.filter((video) => {
          if (!video) return false
          if (filters.category && video.category !== filters.category) return false
          if (filters.tags && filters.tags.length > 0) {
            if (!video.tags || !video.tags.some((tag) => filters.tags!.includes(tag))) return false
          }
          if (filters.dateFrom && video.lastWatched) {
            if (new Date(video.lastWatched) < filters.dateFrom) return false
          }
          if (filters.dateTo && video.lastWatched) {
            if (new Date(video.lastWatched) > filters.dateTo) return false
          }
          return true
        })
      }

      if (query) {
        const lowerQuery = query.toLowerCase()
        collection = collection.filter((video) => {
          if (!video) return false
          const titleMatch = (video.title || "").toLowerCase().includes(lowerQuery)
          const customTitleMatch = (video.customTitle || "").toLowerCase().includes(lowerQuery)
          const urlMatch = video.url.toLowerCase().includes(lowerQuery)
          const categoryMatch = (video.category || "").toLowerCase().includes(lowerQuery)
          const tagMatch = video.tags ? video.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) : false
          return titleMatch || customTitleMatch || urlMatch || categoryMatch || tagMatch
        })
      }
      return collection.orderBy("lastWatched").reverse().toArray()
    } catch (error) {
      console.error("Error searching videos:", error)
      return []
    }
  }

  async getStorageSize(): Promise<string> {
    try {
      const estimate = await navigator.storage.estimate()
      const usage = estimate.usage || 0
      if (usage < 1024) return `${usage} B`
      if (usage < 1024 * 1024) return `${(usage / 1024).toFixed(2)} KB`
      if (usage < 1024 * 1024 * 1024) return `${(usage / (1024 * 1024)).toFixed(2)} MB`
      return `${(usage / (1024 * 1024 * 1024)).toFixed(2)} GB`
    } catch (error) {
      console.error("Error getting storage size:", error)
      return "Unknown"
    }
  }

  async clearAllData() {
    try {
      await this.videos.clear()
      await this.playlists.clear()
      await this.settings.clear()
      await this.profiles.clear()
      await this.watchStats.clear()
    } catch (error) {
      console.error("Error clearing all data:", error)
      throw error
    }
  }

  async exportData() {
    try {
      const videos = await this.videos.toArray()
      const playlists = await this.playlists.toArray()
      const settings = await this.settings.toArray()
      const profiles = await this.profiles.toArray()
      const watchStats = await this.watchStats.toArray()
      return JSON.stringify({ videos, playlists, settings, profiles, watchStats }, null, 2)
    } catch (error) {
      console.error("Error exporting data:", error)
      throw error
    }
  }

  async importData(jsonData: string) {
    try {
      const data = JSON.parse(jsonData)
      if (data.videos) await this.videos.bulkPut(data.videos)
      if (data.playlists) await this.playlists.bulkPut(data.playlists)
      if (data.settings) await this.settings.bulkPut(data.settings)
      if (data.profiles) await this.profiles.bulkPut(data.profiles)
      if (data.watchStats) await this.watchStats.bulkPut(data.watchStats)
      const activeProfile = await this.getActiveProfile()
      if (!activeProfile && data.profiles && data.profiles.length > 0) {
        await this.profiles.update(data.profiles[0].id, { isActive: true })
      } else if (!activeProfile && (!data.profiles || data.profiles.length === 0)) {
        await this.createProfile("Default Profile")
      }
      return true
    } catch (error) {
      console.error("Import failed:", error)
      return false
    }
  }
  async getWatchStats(profileId: number, days = 7): Promise<WatchStats[]> {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - days)
      return this.watchStats
        .filter((stat) => {
          if (!stat.date || !stat.profileId) return false
          const date = new Date(stat.date)
          return date >= startDate && date <= endDate && stat.profileId === profileId
        })
        .toArray()
    } catch (error) {
      console.error("Error getting watch stats:", error)
      return []
    }
  }
  async getMostWatchedCategories(profileId: number, limit = 5): Promise<{ category: string; count: number }[]> {
    try {
      const stats = await this.getWatchStats(profileId, 30)
      const categoryCount: Record<string, number> = {}
      stats.forEach((stat) => {
        if (!stat.categories) return
        Object.entries(stat.categories).forEach(([category, count]) => {
          categoryCount[category] = (categoryCount[category] || 0) + count
        })
      })
      return Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
    } catch (error) {
      console.error("Error getting most watched categories:", error)
      return []
    }
  }
  async getMostWatchedTags(profileId: number, limit = 10): Promise<{ tag: string; count: number }[]> {
    try {
      const stats = await this.getWatchStats(profileId, 30)
      const tagCount: Record<string, number> = {}
      stats.forEach((stat) => {
        if (!stat.mostWatchedTags) return
        Object.entries(stat.mostWatchedTags).forEach(([tag, count]) => {
          tagCount[tag] = (tagCount[tag] || 0) + count
        })
      })
      return Object.entries(tagCount)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
    } catch (error) {
      console.error("Error getting most watched tags:", error)
      return []
    }
  }
  async getTotalWatchTime(profileId: number, days = 7): Promise<number> {
    try {
      const stats = await this.getWatchStats(profileId, days)
      return stats.reduce((total, stat) => total + stat.totalWatchTime, 0)
    } catch (error) {
      console.error("Error getting total watch time:", error)
      return 0
    }
  }
  async setDefaultPlaylist(playlistId: number | null): Promise<void> {
    try {
      const activeProfile = await this.getActiveProfile()
      if (!activeProfile || !activeProfile.settings?.id) return

      await this.playlists.toCollection().modify({ isDefault: false })
      if (playlistId !== null) {
        await this.playlists.update(playlistId, { isDefault: true })
      }
      await this.settings.update(activeProfile.settings.id, {
        defaultPlaylistId: playlistId || undefined,
      })
    } catch (error) {
      console.error("Error setting default playlist:", error)
      throw error
    }
  }
  async getDefaultPlaylist(): Promise<Playlist | undefined> {
    try {
      return await this.playlists.filter((playlist) => playlist.isDefault === true).first()
    } catch (error) {
      console.error("Error getting default playlist:", error)
      return undefined
    }
  }

  async toggleCinemaMode(enabled: boolean): Promise<void> {
    try {
      const activeProfile = await this.getActiveProfile()
      if (!activeProfile || !activeProfile.settings?.id) return

      await this.settings.update(activeProfile.settings.id, { cinemaMode: enabled })
    } catch (error) {
      console.error("Error toggling cinema mode:", error)
      throw error
    }
  }

  async toggleAudioOnlyMode(enabled: boolean): Promise<void> {
    try {
      const activeProfile = await this.getActiveProfile()
      if (!activeProfile || !activeProfile.settings?.id) return

      await this.settings.update(activeProfile.settings.id, { audioOnlyMode: enabled })
    } catch (error) {
      console.error("Error toggling audio only mode:", error)
      throw error
    }
  }
  // Add this new method inside the VideoDatabase class
  async getProfileVideoStats(profileId: number): Promise<{ totalVideosWatched: number }> {
    try {
      const stats = await this.watchStats.where("profileId").equals(profileId).toArray()
      const totalVideosWatched = stats.reduce((sum, stat) => sum + stat.videoCount, 0)
      return { totalVideosWatched }
    } catch (error) {
      console.error(`Error getting video stats for profile ${profileId}:`, error)
      return { totalVideosWatched: 0 }
    }
  }
  // Other methods like updateVideoQuality, updateVideoTags, etc. remain unchanged
}

export const db = new VideoDatabase()
