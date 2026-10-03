import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { manhwaService } from "@/services/manhwaService"
import { tagService } from "@/services/tagService"
import { ManhwaForm } from "@/components/ManhwaForm"
import { Loader2, AlertCircle } from "lucide-react"
import type { Manhwa, ManhwaInsert, Tag } from "@/types"

export function ManhwaEdit() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [manhwa, setManhwa] = useState<Manhwa | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadManhwa() {
      if (!user || !id) return
      try {
        const [data, manhwaTagsList] = await Promise.all([
          manhwaService.getManhwaById(id, user.id),
          tagService.getManhwaTags(user.id)
        ])
        
        if (data) {
          setManhwa(data)
          const mt = manhwaTagsList.find(x => x.manhwa_id === data.id)
          if (mt) setTags(mt.tags)
        } else {
          setError("Title not found.")
        }
      } catch (err: any) {
        setError(err.message || "Failed to load title.")
      } finally {
        setLoading(false)
      }
    }
    loadManhwa()
  }, [id, user])

  const handleSubmit = async (data: Omit<ManhwaInsert, "user_id">, tagNames: string[]) => {
    if (!user || !id) return
    setSaving(true)
    try {
      await manhwaService.updateManhwa(id, user.id, data)

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
      await tagService.updateManhwaTags(id, tagIds)

      navigate(`/manhwa/${id}`)
    } catch (err: any) {
      setError(err.message || "Failed to save.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !manhwa) {
    return (
      <div className="p-6 md:p-10">
        <div className="p-4 bg-destructive/15 text-destructive rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-3" />
          <p className="font-medium">{error || "Title not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <header className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Edit Title</h2>
        <p className="text-muted-foreground mt-2">Update information for {manhwa.title}.</p>
      </header>
      <ManhwaForm initialData={manhwa} initialTags={tags} onSubmit={handleSubmit} isLoading={saving} />
    </div>
  )
}
