"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, ListVideo, Link } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreatePlaylistDialog } from "./create-playlist-dialog"
import { AddVideoDialog } from "./add-video-dialog"
import { useLanguage } from "@/lib/i18n/language-context"

interface AddMenuProps {
  onPlaylistCreated?: () => void
  onVideoAdded?: () => void
}

export function AddMenu({ onPlaylistCreated, onVideoAdded }: AddMenuProps) {
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false)
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false)
  const { t } = useLanguage()

  const handleCreatePlaylistSuccess = () => {
    setIsCreatePlaylistOpen(false)
    onPlaylistCreated?.()
  }

  const handleAddVideoSuccess = () => {
    setIsAddVideoOpen(false)
    onVideoAdded?.()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{t.common.add}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setIsAddVideoOpen(true)} className="gap-2">
            <Link className="h-4 w-4" />
            {t.addMenu.addVideoLink}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsCreatePlaylistOpen(true)} className="gap-2">
            <ListVideo className="h-4 w-4" />
            {t.home.createPlaylist}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreatePlaylistDialog
        open={isCreatePlaylistOpen}
        onOpenChange={setIsCreatePlaylistOpen}
        onCreated={handleCreatePlaylistSuccess}
      />

      <AddVideoDialog open={isAddVideoOpen} onOpenChange={setIsAddVideoOpen} onVideoAdded={handleAddVideoSuccess} />
    </>
  )
}
