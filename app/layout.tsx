import type React from "react"
import type { Metadata, Viewport } from "next"
import { Mona_Sans as FontSans } from "next/font/google"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/lib/i18n/language-context"
import { Toaster } from "@/components/ui/toaster"
import { SiteHeader } from "@/components/site-header"
// Removed AppSidebar and SidebarProvider as we are changing the layout
import "./globals.css"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "My List Videos",
  description: "Watch and manage your video library locally.",
    generator: 'v0.dev'
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#09090b" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning dir="ltr" className="dark">
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <LanguageProvider>
            <div className="relative flex min-h-dvh flex-col bg-background">
              <SiteHeader />
              <main id="main-content" className="flex-1 container mx-auto py-6 lg:py-8 px-4 md:px-6">
                {/* Content is now directly centered by 'container mx-auto' */}
                {children}
              </main>
            </div>
            <Toaster />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
