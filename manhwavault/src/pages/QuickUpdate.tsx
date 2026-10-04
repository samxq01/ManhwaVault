import { useState, useEffect, useMemo, useRef } from "react"
import { Search, Loader2, ArrowRight } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { manhwaService } from "@/services/manhwaService"
import { getCoverColorClass } from "@/utils/coverColors"
import { useToast } from "@/contexts/ToastContext"
import { ChapterControls } from "@/components/ChapterControls"
import { CoverImage } from "@/components/CoverImage"
import type { Manhwa } from "@/types"

export function QuickUpdate() {
  const { user } = useAuth()
  const [manhwas, setManhwas] = useState<Manhwa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
      if (!user) return
      try {
        setLoading(true)
        const data = await manhwaService.getManhwa(user.id)
        const relevant = data.filter(m => m.status === "reading" || m.status === "on_hold")
        relevant.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        setManhwas(relevant)
      } catch (err: any) {
        setError(err.message || "Failed to load titles")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  useEffect(() => {
    // Auto-focus search on load for fastest workflow
    if (!loading && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [loading])

  const filteredManhwas = useMemo(() => {
    if (!searchQuery.trim()) return manhwas
    const query = searchQuery.toLowerCase()
    return manhwas.filter(
      (m) => 
        m.title.toLowerCase().includes(query) || 
        (m.alternative_title && m.alternative_title.toLowerCase().includes(query))
    )
  }, [manhwas, searchQuery])

  const handleUpdateSuccess = (id: string, newChapter: number) => {
    setManhwas(prev => prev.map(m => m.id === id ? { ...m, current_chapter: newChapter, updated_at: new Date().toISOString() } : m))
    const m = manhwas.find(x => x.id === id)
    if (m) {
      toast("Progress Saved", `${m.title} updated to Chapter ${newChapter}`)
    }
  }

  const handleError = (msg: string) => {
    setError(msg)
    setTimeout(() => setError(null), 3000)
  }

  return (
    <div className="px-4 md:px-12 py-8 max-w-4xl mx-auto min-h-screen">
      <header className="mb-12">
        <span className="editorial-subheading text-accent">Workflow</span>
        <h1 className="editorial-heading mt-2">Quick Update</h1>
      </header>

      <div className="relative mb-12">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input 
          ref={searchInputRef}
          placeholder="Search your library..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface-elevated border border-border rounded-sm py-5 pl-14 pr-6 text-lg font-serif tracking-wide focus:outline-none focus:border-accent transition-colors text-foreground placeholder:text-muted-foreground shadow-sm"
        />
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm text-sm mb-6">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
        <h2 className="font-sans uppercase tracking-widest text-xs font-semibold text-muted-foreground">
          {searchQuery ? 'Search Results' : 'Recently Updated'}
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : filteredManhwas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-sm">
          <Search size={32} className="text-muted-foreground mb-4" />
          <h2 className="font-serif text-xl mb-2">No matching titles</h2>
          <p className="text-sm text-muted-foreground max-w-sm">Try another title or ensure you have active reading titles in your library.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredManhwas.map((title) => (
            <article 
              key={title.id} 
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface border border-transparent hover:border-accent/30 hover:bg-surface-elevated transition-colors rounded-sm gap-4"
            >
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className={`w-12 h-16 shrink-0 bg-surface-elevated overflow-hidden ${getCoverColorClass(title.title)}`}>
                  {title.cover_url ? (
                    <CoverImage src={title.cover_url} alt={title.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center border border-border">
                      <strong className="font-serif text-lg text-muted-foreground">{title.title.substring(0, 2).toUpperCase()}</strong>
                    </div>
                  )}
                </div>
                
                <div className="min-w-0 pr-4">
                  <strong className="block font-serif text-lg lg:text-xl truncate group-hover:text-accent transition-colors" title={title.title}>{title.title}</strong>
                  <span className="text-xs font-sans uppercase tracking-widest text-muted-foreground flex items-center mt-1">
                    Current <ArrowRight size={10} className="mx-1.5" /> Ch. {title.current_chapter}
                    {title.total_chapters ? ` / ${title.total_chapters}` : ""}
                  </span>
                </div>
              </div>

              <div className="shrink-0 sm:ml-auto flex items-center self-end sm:self-auto">
                <ChapterControls 
                  manhwa={title} 
                  userId={user!.id}
                  onUpdateSuccess={(newChapter) => handleUpdateSuccess(title.id, newChapter)}
                  onError={handleError}
                  compact={false}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
