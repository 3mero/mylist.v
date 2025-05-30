"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n/language-context"

interface CreatePlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreatePlaylistDialog({ open, onOpenChange, onCreated }: CreatePlaylistDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  // Remove dir from useLanguage
  const { t } = useLanguage()

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: t.playlists.name,
        description: t.playlists.name,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await db.playlists.add({
        name: name.trim(),
        description: description.trim(),
        videos: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      toast({
        title: t.playlists.create,
        description: t.playlists.create,
      })

      setName("")
      setDescription("")
      onOpenChange(false)
      onCreated()
    } catch (error) {
      toast({
        title: t.common.noResults,
        description: t.common.noResults,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!isSubmitting) {
          onOpenChange(newOpen)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.home.createPlaylist}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.playlists.name}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.playlists.namePlaceholder}
              // dir removed, defaults to LTR
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t.playlists.description}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.playlists.descriptionPlaceholder}
              rows={3}
              // dir removed, defaults to LTR
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? t.playlists.creating : t.playlists.create}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
