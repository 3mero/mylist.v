"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Keyboard } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Keyboard className="h-4 w-4" />
          <span className="sr-only">{t.welcome.shortcuts}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.welcome.shortcuts}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
      </DialogContent>
    </Dialog>
  )
}
