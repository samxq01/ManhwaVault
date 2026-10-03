import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { manhwaService } from "@/services/manhwaService"
import { tagService } from "@/services/tagService"
import { ManhwaForm } from "@/components/ManhwaForm"
import type { ManhwaInsert } from "@/types"

export function ManhwaAdd() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: Omit<ManhwaInsert, "user_id">, tagNames: string[]) => {
    if (!user) return
    setLoading(true)
    try {
      const newManhwa = await manhwaService.createManhwa({
        ...data,
        user_id: user.id
      })

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
    <div className="p-6 md:p-10 space-y-6">
      <header className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Add to Library</h2>
        <p className="text-muted-foreground mt-2">Add a new title to track your reading progress.</p>
      </header>
      <ManhwaForm onSubmit={handleSubmit} isLoading={loading} />
    </div>
  )
}
