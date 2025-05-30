"use client"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Video } from "@/lib/db"

interface StaticTitleProps {
  video: Video | null | undefined
  className?: string
  textClassName?: string
  onPlay?: () => void
}

export function StaticTitle({ video, className, textClassName, onPlay }: StaticTitleProps) {
  if (!video) {
    return <div className={cn("h-6 w-3/4 rounded bg-muted", className)}></div> // Placeholder
  }

  const displayTitle = video.customTitle || video.title || "Untitled Video"

  const titleElement = (
    <span
      className={cn("block font-medium leading-tight", onPlay ? "cursor-pointer hover:underline" : "", textClassName)}
      onClick={onPlay}
      role={onPlay ? "button" : undefined}
      tabIndex={onPlay ? 0 : undefined}
      onKeyDown={
        onPlay
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onPlay()
              }
            }
          : undefined
      }
    >
      {displayTitle}
    </span>
  )

  return (
    <div className={cn("w-full", className)}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{titleElement}</TooltipTrigger>
          {displayTitle.length > 30 && ( // Only show tooltip if title is long
            <TooltipContent side="top" align="start">
              <p>{displayTitle}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
