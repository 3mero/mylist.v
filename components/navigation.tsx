"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Clock, ListVideo, Settings, BarChart2 } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { LanguageSwitcher } from "./language-switcher"
import { ProfileSwitcher } from "./profile-switcher"

export function Navigation() {
  const pathname = usePathname()
  // Remove dir from useLanguage
  const { t } = useLanguage()

  const navItems = [
    { href: "/", label: t.common.home, icon: Home },
    { href: "/history", label: t.common.history, icon: Clock },
    { href: "/playlists", label: t.common.playlists, icon: ListVideo },
    { href: "/stats", label: "Stats", icon: BarChart2 },
    { href: "/settings", label: t.common.settings, icon: Settings },
  ]

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8 rtl:space-x-reverse">
            <Link href="/" className="font-bold text-xl">
              {" "}
              {/* Always LTR */}
              {t.home.title} {/* Use translation key for title */}
            </Link>
            <div className="flex space-x-6">
              {" "}
              {/* Removed rtl:space-x-reverse */}
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary", // Removed rtl:space-x-reverse
                      pathname === item.href ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {" "}
            {/* Removed rtl:space-x-reverse */}
            <LanguageSwitcher />
            <ProfileSwitcher />
          </div>
        </div>
      </div>
    </nav>
  )
}
