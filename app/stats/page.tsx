"use client"

import { useState, useEffect } from "react"
import { db, type WatchStats } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDistanceToNow, format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { useLanguage } from "@/lib/i18n/language-context"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, Tag, Folder } from "lucide-react"

export default function StatsPage() {
  const [timeRange, setTimeRange] = useState("7")
  const [stats, setStats] = useState<WatchStats[]>([])
  const [totalWatchTime, setTotalWatchTime] = useState(0)
  const [mostWatchedCategories, setMostWatchedCategories] = useState<{ category: string; count: number }[]>([])
  const [mostWatchedTags, setMostWatchedTags] = useState<{ tag: string; count: number }[]>([])
  const [profileId, setProfileId] = useState<number | null>(null)
  const { locale } = useLanguage()

  useEffect(() => {
    const loadActiveProfile = async () => {
      const profile = await db.getActiveProfile()
      if (profile?.id) {
        setProfileId(profile.id)
      }
    }

    loadActiveProfile()
  }, [])

  useEffect(() => {
    if (profileId) {
      loadStats()
    }
  }, [timeRange, profileId])

  // Corregir la función loadStats para manejar posibles errores
  const loadStats = async () => {
    if (!profileId) return

    try {
      const days = Number.parseInt(timeRange)

      // Get watch stats
      const watchStats = await db.getWatchStats(profileId, days)
      setStats(watchStats)

      // Get total watch time
      const total = await db.getTotalWatchTime(profileId, days)
      setTotalWatchTime(total)

      // Get most watched categories
      const categories = await db.getMostWatchedCategories(profileId)
      setMostWatchedCategories(categories)

      // Get most watched tags
      const tags = await db.getMostWatchedTags(profileId)
      setMostWatchedTags(tags)
    } catch (error) {
      console.error("Error loading stats:", error)
      // Establecer valores predeterminados en caso de error
      setStats([])
      setTotalWatchTime(0)
      setMostWatchedCategories([])
      setMostWatchedTags([])
    }
  }

  const formatWatchTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (!profileId) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Viewing Statistics</h1>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadStats}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Watch Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{formatWatchTime(totalWatchTime)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Videos Watched</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reduce((total, day) => total + day.videoCount, 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.length > 0 ? formatWatchTime(Math.round(totalWatchTime / stats.length)) : "0m"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Folder className="w-5 h-5 mr-2" />
              Most Watched Categories
            </CardTitle>
            <CardDescription>Your top categories in the selected time period</CardDescription>
          </CardHeader>
          <CardContent>
            {mostWatchedCategories.length > 0 ? (
              <div className="space-y-4">
                {mostWatchedCategories.map(({ category, count }) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Badge variant="outline">{category}</Badge>
                    </div>
                    <div className="text-sm">{count} videos</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">No category data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="w-5 h-5 mr-2" />
              Most Watched Tags
            </CardTitle>
            <CardDescription>Your top tags in the selected time period</CardDescription>
          </CardHeader>
          <CardContent>
            {mostWatchedTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {mostWatchedTags.map(({ tag, count }) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <span className="ml-1 text-xs bg-primary/20 px-1 rounded-sm">{count}</span>
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">No tag data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Daily Activity
          </CardTitle>
          <CardDescription>Your watching activity by day</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.length > 0 ? (
            <div className="space-y-4">
              {stats.map((day) => (
                <div key={day.date.toString()} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">
                      {format(new Date(day.date), "PPPP", { locale: locale === "ar" ? ar : enUS })}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(day.date), {
                        addSuffix: true,
                        locale: locale === "ar" ? ar : enUS,
                      })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Watch time</p>
                      <p className="font-medium">{formatWatchTime(day.totalWatchTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Videos watched</p>
                      <p className="font-medium">{day.videoCount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No activity data available for the selected time period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
