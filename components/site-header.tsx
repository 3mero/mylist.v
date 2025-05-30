"use client"

import Link from "next/link"
import { GlobalSearchInput } from "./global-search-input"
import { LanguageSwitcher } from "./language-switcher"
import { ProfileSwitcher } from "./profile-switcher"
import { Button } from "@/components/ui/button"
import { Settings, ListVideo, Home, HistoryIcon, PlusCircle, Menu, Info } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreatePlaylistDialog } from "./create-playlist-dialog"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { AddMenu } from "./add-menu"
import { AboutDialog } from "./about-dialog"

export function SiteHeader() {
  const { t } = useLanguage()
  const pathname = usePathname()
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false)

  const navItems = [
    { href: "/", label: t.navigation?.home || "Home", icon: Home },
    { href: "/playlists", label: t.navigation?.playlists || "Playlists", icon: ListVideo },
    { href: "/history", label: t.navigation?.history || "History", icon: HistoryIcon },
  ]

  const handleCreatePlaylistSuccess = () => {
    setIsCreatePlaylistOpen(false)
    // Potentially refresh playlist data or navigate if needed
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
          {/* Mobile Menu */}
          <div className="md:hidden mr-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open navigation</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsCreatePlaylistOpen(true)} className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  {t.home.createPlaylist}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {t.settings?.title || "Settings"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div
                    className="flex items-center gap-2 w-full"
                    onClick={() => {
                      const aboutDialogTrigger = document.querySelector(".about-dialog-trigger") as HTMLButtonElement
                      if (aboutDialogTrigger) aboutDialogTrigger.click()
                    }}
                  >
                    <Info className="h-4 w-4" />
                    {t.common.about}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Link href="/" className="mr-4 flex items-center">
            <ListVideo className="h-6 w-6 mr-2 text-primary" />
            <span className="font-bold text-lg whitespace-nowrap">{t.common?.appName}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1 flex justify-center px-4">
            <GlobalSearchInput className="w-full max-w-md lg:max-w-lg" />
          </div>

          <div className="flex items-center space-x-1 md:space-x-2 ml-auto">
            <div className="hidden md:inline-flex">
              <AddMenu onCreatePlaylistSuccess={handleCreatePlaylistSuccess} />
            </div>
            <LanguageSwitcher />
            <ProfileSwitcher />
            <Button variant="ghost" size="icon" asChild className="hidden md:inline-flex">
              <Link href="/settings" aria-label={t.settings?.title || "Settings"}>
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
            <AboutDialog className="about-dialog-trigger" />
          </div>
        </div>
      </header>
      <CreatePlaylistDialog
        open={isCreatePlaylistOpen}
        onOpenChange={setIsCreatePlaylistOpen}
        onCreated={handleCreatePlaylistSuccess}
      />
    </>
  )
}
