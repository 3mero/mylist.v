"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

export function GlobalSearchInput({ className }: { className?: string }) {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const { t } = useLanguage()

  const handleSearch = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className={className}>
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t.search?.placeholder || "Search all videos..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
    </form>
  )
}
