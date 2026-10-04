import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { manhwaService } from "@/services/manhwaService"
import { tagService } from "@/services/tagService"
import { storageService } from "@/services/storageService"
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

  const handleSubmit = async (data: Omit<ManhwaInsert, "user_id">, tagNames: string[], coverFile: File | null) => {
    if (!user || !id || !manhwa) return
    setSaving(true)
    try {
      let coverUrlToSave = data.cover_url
      
      // If a new cover is provided
      if (coverFile) {
        coverUrlToSave = await storageService.uploadManhwaCover(coverFile, user.id, id)
      }

      await manhwaService.updateManhwa(id, user.id, {
        ...data,
        cover_url: coverUrlToSave
      })

      // Clean up old cover if it was changed or removed
      if ((coverFile || data.cover_url === "") && manhwa.cover_url) {
        await storageService.deleteManhwaCoverByUrl(manhwa.cover_url).catch(e => console.error(e))
      }

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
    <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto min-h-screen">
      <header className="mb-12 border-b border-border pb-6">
        <span className="editorial-subheading text-accent">Collection</span>
        <h2 className="editorial-heading mt-2">Edit Archive Entry.</h2>
      </header>
      <ManhwaForm initialData={manhwa} initialTags={tags} onSubmit={handleSubmit} isLoading={saving} />
    </div>
  )
}
