"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { db, type Subtitle } from "@/lib/db"
import { FileUp, Link } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/lib/i18n/language-context"

interface SubtitleUploaderProps {
  videoId?: number
  onSubtitleAdded: () => void
}

export function SubtitleUploader({ videoId, onSubtitleAdded }: SubtitleUploaderProps) {
  const [subtitleUrl, setSubtitleUrl] = useState("")
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null)
  const [subtitleLabel, setSubtitleLabel] = useState("")
  const [subtitleLanguage, setSubtitleLanguage] = useState("en")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("url")
  const { toast } = useToast()
  const { t } = useLanguage()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSubtitleFile(file)

      // Auto-detect format from file extension
      const fileName = file.name.toLowerCase()
      if (fileName.endsWith(".srt") || fileName.endsWith(".vtt")) {
        // Auto-set label from filename if not set
        if (!subtitleLabel) {
          const baseName = fileName.split(".").slice(0, -1).join(".")
          setSubtitleLabel(baseName)
        }
      }
    }
  }

  const uploadSubtitleFile = async () => {
    if (!subtitleFile || !videoId) return

    setIsLoading(true)

    try {
      // Read the file content
      const fileContent = await subtitleFile.text()

      // Create a blob URL for the subtitle file
      const blob = new Blob([fileContent], {
        type: subtitleFile.name.endsWith(".srt") ? "application/x-subrip" : "text/vtt",
      })
      const url = URL.createObjectURL(blob)

      // Determine format from file extension
      const format = subtitleFile.name.toLowerCase().endsWith(".srt") ? "srt" : "vtt"

      // Create subtitle object
      const subtitle: Subtitle = {
        label: subtitleLabel || subtitleFile.name,
        language: subtitleLanguage,
        url,
        format,
      }

      // Add subtitle to video
      await db.addSubtitleToVideo(videoId, subtitle)

      toast({
        title: "Subtitle added",
        description: `Subtitle "${subtitle.label}" has been added to the video`,
      })

      // Reset form
      setSubtitleFile(null)
      setSubtitleLabel("")

      // Notify parent
      onSubtitleAdded()
    } catch (error) {
      toast({
        title: "Error adding subtitle",
        description: "An error occurred while adding the subtitle",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addSubtitleUrl = async () => {
    if (!subtitleUrl.trim() || !videoId) return

    setIsLoading(true)

    try {
      // Determine format from URL extension
      const format = subtitleUrl.toLowerCase().endsWith(".srt") ? "srt" : "vtt"

      // Create subtitle object
      const subtitle: Subtitle = {
        label: subtitleLabel || "External subtitle",
        language: subtitleLanguage,
        url: subtitleUrl,
        format,
      }

      // Add subtitle to video
      await db.addSubtitleToVideo(videoId, subtitle)

      toast({
        title: "Subtitle added",
        description: `Subtitle "${subtitle.label}" has been added to the video`,
      })

      // Reset form
      setSubtitleUrl("")
      setSubtitleLabel("")

      // Notify parent
      onSubtitleAdded()
    } catch (error) {
      toast({
        title: "Error adding subtitle",
        description: "An error occurred while adding the subtitle",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = () => {
    if (activeTab === "url") {
      addSubtitleUrl()
    } else {
      uploadSubtitleFile()
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">Subtitle URL</TabsTrigger>
          <TabsTrigger value="file">Upload File</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subtitle-url">Subtitle URL (.srt or .vtt)</Label>
            <Input
              id="subtitle-url"
              value={subtitleUrl}
              onChange={(e) => setSubtitleUrl(e.target.value)}
              placeholder="https://example.com/subtitle.vtt"
            />
          </div>
        </TabsContent>

        <TabsContent value="file" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subtitle-file">Upload Subtitle File (.srt or .vtt)</Label>
            <Input id="subtitle-file" type="file" accept=".srt,.vtt" onChange={handleFileChange} />
            {subtitleFile && <p className="text-sm text-muted-foreground">Selected: {subtitleFile.name}</p>}
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-2">
        <Label htmlFor="subtitle-label">Label (optional)</Label>
        <Input
          id="subtitle-label"
          value={subtitleLabel}
          onChange={(e) => setSubtitleLabel(e.target.value)}
          placeholder="English, Forced, Director's Commentary, etc."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle-language">Language</Label>
        <Select value={subtitleLanguage} onValueChange={setSubtitleLanguage}>
          <SelectTrigger id="subtitle-language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ar">Arabic</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="de">German</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="it">Italian</SelectItem>
            <SelectItem value="ja">Japanese</SelectItem>
            <SelectItem value="ko">Korean</SelectItem>
            <SelectItem value="zh">Chinese</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading || (activeTab === "url" ? !subtitleUrl.trim() : !subtitleFile)}
        className="w-full"
      >
        {activeTab === "url" ? (
          <>
            <Link className="mr-2 h-4 w-4" />
            Add Subtitle URL
          </>
        ) : (
          <>
            <FileUp className="mr-2 h-4 w-4" />
            Upload Subtitle
          </>
        )}
      </Button>
    </div>
  )
}
