import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { manhwaService } from "@/services/manhwaService"
import { tagService } from "@/services/tagService"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Edit, Trash2, Heart, Loader2, AlertCircle } from "lucide-react"
import type { Manhwa, Tag } from "@/types"

export function ManhwaDetails() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [manhwa, setManhwa] = useState<Manhwa | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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
        setError(err.message || "Failed to load title details.")
      } finally {
        setLoading(false)
      }
    }
    loadManhwa()
  }, [id, user])

  const toggleFavorite = async () => {
    if (!user || !manhwa) return
    try {
      const updated = await manhwaService.updateManhwa(manhwa.id, user.id, {
        is_favorite: !manhwa.is_favorite
      })
      setManhwa(updated)
    } catch (err: any) {
      // ignore silently or show toast
    }
  }

  const handleDelete = async () => {
    if (!user || !manhwa) return
    if (window.confirm("Delete this title?")) {
      setDeleting(true)
      try {
        await manhwaService.deleteManhwa(manhwa.id, user.id)
        navigate("/library")
      } catch (err: any) {
        setError(err.message || "Failed to delete title.")
        setDeleting(false)
      }
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
        <Button variant="ghost" asChild className="mt-4">
          <Link to="/library"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Library</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="-ml-4 text-muted-foreground">
          <Link to="/library"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
        </Button>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/manhwa/${manhwa.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <div className="aspect-[2/3] rounded-lg overflow-hidden border bg-muted relative">
            {manhwa.cover_url ? (
              <img src={manhwa.cover_url} alt={manhwa.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Cover Image
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleFavorite}
              className={`absolute top-3 right-3 h-10 w-10 rounded-full bg-background/60 backdrop-blur ${manhwa.is_favorite ? 'text-red-500 hover:text-red-600' : 'text-foreground'}`}
            >
              <Heart className={`h-5 w-5 ${manhwa.is_favorite ? 'fill-current' : ''}`} />
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Status</div>
                <div className="font-medium">{manhwa.status}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Type</div>
                <div className="font-medium">{manhwa.type || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Rating</div>
                <div className="font-medium">{manhwa.rating ? `${manhwa.rating} / 10` : "No rating"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Chapters</div>
                <div className="font-medium">{manhwa.current_chapter} / {manhwa.total_chapters || "?"}</div>
              </div>
              {tags.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Tags</div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => (
                      <span key={tag.id} className="inline-block px-2 py-0.5 rounded border border-border text-[11px] text-muted-foreground bg-accent/20">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{manhwa.title}</h1>
            {manhwa.alternative_title && (
              <p className="text-lg text-muted-foreground">{manhwa.alternative_title}</p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b pb-2">Description</h3>
            <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {manhwa.description || "No description provided."}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b pb-2">Personal Notes</h3>
            <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {manhwa.notes || "No notes provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
