"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { type Locale, type Translations, translations } from "./translations"

interface LanguageContextType {
  locale: Locale
  t: Translations
  setLocale: (locale: Locale) => void
  dir: "ltr" // Always LTR
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("ar")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Get saved locale from localStorage if available
    const savedLocale = localStorage.getItem("locale") as Locale | null
    if (savedLocale && (savedLocale === "ar" || savedLocale === "en")) {
      setLocale(savedLocale)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      // Save locale to localStorage
      localStorage.setItem("locale", locale)

      // Dir is now fixed to LTR in app/layout.tsx on the <html> tag
      // document.documentElement.dir = "ltr"

      // Add locale class to body for specific styling
      document.body.classList.remove("locale-ar", "locale-en")
      document.body.classList.add(`locale-${locale}`)
    }
  }, [locale, mounted])

  const value = {
    locale,
    t: translations[locale],
    setLocale,
    dir: "ltr", // Always LTR
  }

  // Don't render until we have determined the locale
  if (!mounted) return null

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
