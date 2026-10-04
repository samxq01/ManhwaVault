import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { manhwaService } from "@/services/manhwaService"
import { tagService } from "@/services/tagService"
import { storageService } from "@/services/storageService"
import { useToast } from "@/contexts/ToastContext"
import { CoverImage } from "@/components/CoverImage"
import { ChapterControls } from "@/components/ChapterControls"
import { ArrowLeft, Edit, Trash2, Heart, Loader2 } from "lucide-react"
import type { Manhwa, Tag, ManhwaType } from "@/types"
import { STATUS_MAPPING, TYPE_MAPPING } from "@/types"

import { Skeleton } from "@/components/ui/skeleton"

export function ManhwaDetails() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [manhwa, setManhwa] = useState<Manhwa | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteState, setDeleteState] = useState<'idle' | 'confirm' | 'deleting'>('idle')

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
      toast("Error", "Failed to update favorite status")
    }
  }

  const handleDelete = async () => {
    if (!user || !manhwa) return
    setDeleteState('deleting')
    try {
      await manhwaService.deleteManhwa(manhwa.id, user.id)
      await storageService.deleteAllManhwaCovers(user.id, manhwa.id).catch(e => console.error(e))
      navigate("/library")
    } catch (err: any) {
      setError(err.message || "Failed to delete title.")
      setDeleteState('idle')
    }
  }

  if (loading) {
    return (
      <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-border pb-6">
          <Skeleton className="h-4 w-20" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-4 flex flex-col gap-8">
            <Skeleton className="w-full aspect-[3/4.2]" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>

          <div className="lg:col-span-8 flex flex-col">
            <div className="mb-12">
              <Skeleton className="h-16 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/2" />
            </div>

            <div className="space-y-12">
              <section>
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-32 w-full" />
              </section>

              <section>
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-32 w-full" />
              </section>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !manhwa) {
    return (
      <div className="p-6 md:p-12 max-w-7xl mx-auto">
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm text-sm mb-6">
          {error || "Title not found"}
        </div>
        <Link to="/library" className="text-sm font-sans uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft size={14} /> Return to Archive
        </Link>
      </div>
    )
  }

  return (
    <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto min-h-screen">
      {/* Navigation & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-border pb-6">
        <Link to="/library" className="text-xs font-sans uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
          <ArrowLeft size={12} /> Back
        </Link>
        
        <div className="flex items-center gap-4 text-xs font-sans uppercase tracking-widest font-semibold">
          <button 
            onClick={toggleFavorite}
            className={`flex items-center gap-2 transition-colors ${manhwa.is_favorite ? 'text-red-400' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Heart size={14} className={manhwa.is_favorite ? 'fill-current' : ''} /> {manhwa.is_favorite ? 'Favorited' : 'Favorite'}
          </button>
          
          <Link to={`/manhwa/${manhwa.id}/edit`} className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors">
            <Edit size={14} /> Edit
          </Link>
          
          {deleteState === 'confirm' ? (
            <div className="flex items-center gap-2 border border-destructive/50 bg-destructive/10 px-3 py-1.5 rounded-sm">
              <span className="text-destructive font-sans uppercase tracking-widest text-[10px]">Delete title?</span>
              <button 
                onClick={() => setDeleteState('idle')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <span className="text-border">|</span>
              <button 
                onClick={handleDelete} 
                className="text-destructive hover:text-destructive/80 transition-colors font-bold"
              >
                Delete
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setDeleteState('confirm')} 
              disabled={deleteState === 'deleting'}
              className="flex items-center gap-2 text-destructive hover:text-destructive/80 transition-colors"
            >
              {deleteState === 'deleting' ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        {/* Left Column: Cover & Controls */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="w-full aspect-[3/4.2] bg-surface-elevated border border-border">
            {manhwa.cover_url ? (
              <CoverImage src={manhwa.cover_url} alt={manhwa.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-serif text-4xl text-muted-foreground">{manhwa.title.substring(0,2).toUpperCase()}</span>
              </div>
            )}
          </div>
          
          <div className="bg-surface border border-border p-6 flex flex-col items-center">
            <span className="editorial-subheading mb-4">Reading Progress</span>
            <ChapterControls 
              manhwa={manhwa} 
              userId={user!.id}
              compact={false}
              onUpdateSuccess={(newChapter) => {
                setManhwa(prev => prev ? {...prev, current_chapter: newChapter} : null)
                toast("Progress Saved", `Updated to chapter ${newChapter}`)
              }}
            />
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-8">
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</span>
                <span className="font-serif">{STATUS_MAPPING[manhwa.status]}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Type</span>
                <span className="font-serif">{manhwa.type ? TYPE_MAPPING[manhwa.type as ManhwaType] || manhwa.type : "N/A"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Chapters</span>
                <span className="font-serif">{manhwa.current_chapter} / {manhwa.total_chapters || "?"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Rating</span>
                <span className="font-serif">{manhwa.rating ? `${manhwa.rating}/10` : "Unrated"}</span>
              </div>
            </div>
            
            {tags.length > 0 && (
              <div className="mt-4">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Tags</span>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span key={tag.id} className="text-xs font-sans tracking-wide border border-border px-2 py-1 bg-surface-elevated text-foreground">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Information */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="mb-12">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tighter leading-[1.1] mb-4">{manhwa.title}</h1>
            {manhwa.alternative_title && (
              <h2 className="text-lg md:text-xl text-muted-foreground font-serif italic">{manhwa.alternative_title}</h2>
            )}
          </div>

          <div className="space-y-12">
            <section>
              <h3 className="text-xs font-sans uppercase tracking-widest text-accent mb-4">Synopsis</h3>
              <div className="prose prose-invert prose-p:leading-relaxed prose-p:text-foreground/80 max-w-none font-serif text-lg">
                {manhwa.description ? (
                  manhwa.description.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4">{paragraph}</p>
                  ))
                ) : (
                  <p className="italic text-muted-foreground">No synopsis provided.</p>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-sans uppercase tracking-widest text-accent mb-4">Personal Notes</h3>
              <div className="p-6 bg-surface-elevated border border-border font-serif text-lg leading-relaxed text-foreground/80">
                {manhwa.notes ? (
                  manhwa.notes.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4 last:mb-0">{paragraph}</p>
                  ))
                ) : (
                  <p className="italic text-muted-foreground m-0">No personal notes.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
