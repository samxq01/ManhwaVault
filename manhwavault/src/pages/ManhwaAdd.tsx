import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { manhwaService } from "@/services/manhwaService"
import { tagService } from "@/services/tagService"
import { storageService } from "@/services/storageService"
import { ManhwaForm } from "@/components/ManhwaForm"
import type { ManhwaInsert } from "@/types"

export function ManhwaAdd() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: Omit<ManhwaInsert, "user_id">, tagNames: string[], coverFile: File | null) => {
    if (!user) return
    setLoading(true)
    try {
      let newManhwa = await manhwaService.createManhwa({
        ...data,
        user_id: user.id
      })

      // Upload cover if present
      if (coverFile) {
        try {
          const coverUrl = await storageService.uploadManhwaCover(coverFile, user.id, newManhwa.id)
          newManhwa = await manhwaService.updateManhwa(newManhwa.id, user.id, { cover_url: coverUrl })
        } catch (uploadError) {
          console.error("Cover upload failed:", uploadError)
          alert("Cover upload failed, but the title was added.")
        }
      }

      if (tagNames.length > 0) {
        const existingTags = await tagService.getTags(user.id)
        const tagIds: string[] = []
        for (const tagName of tagNames) {
          const existing = existingTags.find(t => t.name.toLowerCase() === tagName.toLowerCase())
          if (existing) {
            tagIds.push(existing.id)
          } else {
            const newTag = await tagService.createTag(user.id, tagName)
            tagIds.push(newTag.id)
          }
        }
        await tagService.updateManhwaTags(newManhwa.id, tagIds)
      }

      navigate(`/manhwa/${newManhwa.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto min-h-screen">
      <header className="mb-12 border-b border-border pb-6">
        <span className="editorial-subheading text-accent">Collection</span>
        <h2 className="editorial-heading mt-2">Add New Title.</h2>
      </header>
      <ManhwaForm onSubmit={handleSubmit} isLoading={loading} />
    </div>
  )
}
