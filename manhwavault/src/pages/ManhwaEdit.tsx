import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { manhwaService } from "@/services/manhwaService"
import { ManhwaForm } from "@/components/ManhwaForm"
import { Loader2, AlertCircle } from "lucide-react"
import type { Manhwa, ManhwaInsert } from "@/types"

export function ManhwaEdit() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [manhwa, setManhwa] = useState<Manhwa | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadManhwa() {
      if (!user || !id) return
      try {
        const data = await manhwaService.getManhwaById(id, user.id)
        if (data) {
          setManhwa(data)
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

  const handleSubmit = async (data: Omit<ManhwaInsert, "user_id">) => {
    if (!user || !id) return
    setSaving(true)
    try {
      await manhwaService.updateManhwa(id, user.id, data)
      navigate(`/manhwa/${id}`)
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
      <ManhwaForm initialData={manhwa} onSubmit={handleSubmit} isLoading={saving} />
    </div>
  )
}
