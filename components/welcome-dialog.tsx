"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/db"
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog"
import { Play, ListVideo } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

export function WelcomeDialog() {
  const [open, setOpen] = useState(false)
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("welcome")
  const { t } = useLanguage()

  useEffect(() => {
    checkFirstVisit()
  }, [])

  const checkFirstVisit = async () => {
    const settings = await db.settings.toArray()
    if (settings.length === 0) {
      // First visit - create default settings
      await db.settings.add({
        theme: "system",
        historyLimit: 50,
        videoQuality: "auto",
        bufferSize: "medium",
        autoplay: true,
      })
      // No abrimos el diálogo automáticamente
      // setOpen(false);
    }
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{t.welcome.welcomeTitle}</DialogTitle>
            <DialogDescription>{t.welcome.welcomeSubtitle}</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="welcome">{t.welcome.getStarted}</TabsTrigger>
              <TabsTrigger value="features">{t.welcome.features}</TabsTrigger>
              <TabsTrigger value="shortcuts">{t.welcome.shortcuts}</TabsTrigger>
            </TabsList>

            <TabsContent value="welcome" className="py-4 space-y-4">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">{t.welcome.startNow}</h3>
                <p>{t.welcome.welcomeSubtitle}</p>

                <div className="flex justify-center gap-4 mt-6">
                  <Button onClick={() => setIsCreatePlaylistOpen(true)}>
                    <ListVideo className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t.welcome.createPlaylistNow}
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    <Play className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t.welcome.playVideo}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{t.welcome.videoPlayback}</h3>
                  <p className="text-sm text-muted-foreground">{t.welcome.videoPlaybackDesc}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{t.welcome.playlistsFeature}</h3>
                  <p className="text-sm text-muted-foreground">{t.welcome.playlistsFeatureDesc}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{t.welcome.historyFeature}</h3>
                  <p className="text-sm text-muted-foreground">{t.welcome.historyFeatureDesc}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{t.welcome.customizeFeature}</h3>
                  <p className="text-sm text-muted-foreground">{t.welcome.customizeFeatureDesc}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shortcuts" className="py-4">
              <div className="space-y-2">
                <h3 className="font-semibold mb-4">{t.welcome.shortcuts}</h3>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between">
                    <span>{t.welcome.playPause}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Space</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.welcome.forward10}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">→</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.welcome.backward10}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">←</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.welcome.volumeUp}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">↑</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.welcome.volumeDown}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">↓</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.welcome.nextTrack}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">N</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.welcome.previousTrack}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">P</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.welcome.mute}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">M</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.welcome.togglePlaylist}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">L</kbd>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-4">
            <Button onClick={handleClose}>{t.welcome.startUsing}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreatePlaylistDialog
        open={isCreatePlaylistOpen}
        onOpenChange={setIsCreatePlaylistOpen}
        onCreated={() => {
          setIsCreatePlaylistOpen(false)
          setOpen(false)
        }}
      />
    </>
  )
}
