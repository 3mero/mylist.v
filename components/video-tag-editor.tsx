"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { X, Plus, Tag, Trash } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface VideoTagEditorProps {
  videoId?: number
  initialTags: string[]
  initialCategory: string
  onSave: (tags: string[], category: string) => void
}

export function VideoTagEditor({ videoId, initialTags, initialCategory, onSave }: VideoTagEditorProps) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [newTag, setNewTag] = useState("")
  const [category, setCategory] = useState(initialCategory)
  const [customCategory, setCustomCategory] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const predefinedCategories = [
    "Music",
    "Movies",
    "TV Shows",
    "Gaming",
    "Sports",
    "News",
    "Education",
    "Technology",
    "Travel",
    "Cooking",
    "Other",
  ]

  const handleAddTag = () => {
    if (!newTag.trim()) return

    // Don't add duplicate tags
    if (tags.includes(newTag.trim())) {
      toast({
        title: "Duplicate tag",
        description: "This tag already exists",
        variant: "destructive",
      })
      return
    }

    setTags([...tags, newTag.trim()])
    setNewTag("")
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleClearAllTags = () => {
    setTags([])
  }

  const handleSave = async () => {
    if (!videoId) {
      onSave(tags, category === "custom" ? customCategory : category)
      return
    }

    setIsLoading(true)

    try {
      // Update tags
      await db.updateVideoTags(videoId, tags)

      // Update category
      const finalCategory = category === "custom" ? customCategory : category
      await db.updateVideoCategory(videoId, finalCategory)

      toast({
        title: "Tags updated",
        description: "Video tags and category have been updated",
      })

      onSave(tags, finalCategory)
    } catch (error) {
      toast({
        title: "Error updating tags",
        description: "An error occurred while updating the tags",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-category">No Category</SelectItem>
            {predefinedCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom Category</SelectItem>
          </SelectContent>
        </Select>

        {category === "custom" && (
          <div className="mt-2">
            <Input
              placeholder="Enter custom category"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="tags">Tags</Label>
          {tags.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash className="w-4 h-4 mr-2" />
                  Clear All Tags
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all tags?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all tags from this video. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllTags}>Clear All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            id="tags"
            placeholder="Add a tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button type="button" onClick={handleAddTag} disabled={!newTag.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {tag}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemoveTag(tag)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {tag}</span>
              </Button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No tags added yet</p>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => onSave(initialTags, initialCategory)}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
