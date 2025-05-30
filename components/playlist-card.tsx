"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Trash2, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import { db, type Playlist } from "@/lib/db"
import { useVideoStore } from "@/lib/store"
import { formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n/language-context"

interface PlaylistCardProps {
  playlist: Playlist
  onUpdate: () => void
}

export function PlaylistCard({ playlist, onUpdate }: PlaylistCardProps) {
  const router = useRouter()
  const { setCurrentVideo, setCurrentPlaylist } = useVideoStore()
  const { toast } = useToast()
  const { t, locale } = useLanguage()

  const handlePlay = () => {
    if (playlist.videos.length > 0) {
      setCurrentPlaylist(playlist)
      setCurrentVideo(playlist.videos[0])
      router.push("/")
    }
  }

  const handleDelete = async () => {
    if (playlist.id) {
      await db.playlists.delete(playlist.id)
      onUpdate()
      toast({
        title: t.common.delete,
        description: t.common.delete,
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="truncate">{playlist.name}</span>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => router.push(`/playlists/${playlist.id}`)}>
              <Edit className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t.common.delete} {t.player.playlist}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>{t.settings.deleteAllDataConfirm}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>{t.common.delete}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {playlist.description && <p className="text-sm text-muted-foreground">{playlist.description}</p>}

        <div className="flex items-center justify-between text-sm">
          <span>
            {playlist.videos.length} {t.playlists.videos}
          </span>
          <span className="text-muted-foreground">
            {t.playlists.updated}{" "}
            {formatDistanceToNow(playlist.updatedAt, {
              addSuffix: true,
              locale: locale === "ar" ? ar : enUS,
            })}
          </span>
        </div>

        <Button className="w-full" onClick={handlePlay} disabled={playlist.videos.length === 0}>
          <Play className="w-4 h-4 mr-2" /> {/* rtl classes removed */}
          {t.common.play}
        </Button>
      </CardContent>
    </Card>
  )
}
