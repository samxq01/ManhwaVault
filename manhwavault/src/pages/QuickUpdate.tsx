import { useState, useEffect, useMemo } from "react"
import { Search, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { manhwaService } from "@/services/manhwaService"
import { getCoverColorClass } from "@/utils/coverColors"
import { ChapterControls } from "@/components/ChapterControls"
import { CoverImage } from "@/components/CoverImage"
import type { Manhwa } from "@/types"

export function QuickUpdate() {
  const { user } = useAuth()
  const [manhwas, setManhwas] = useState<Manhwa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function loadData() {
      if (!user) return
      try {
        setLoading(true)
        const data = await manhwaService.getManhwa(user.id)
        // Quick update usually focuses on Reading or On Hold
        const relevant = data.filter(m => m.status === "Reading" || m.status === "On Hold")
        // Sort by recently updated
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
    
    const element = document.querySelector(`[data-manhwa-id="${id}"]`)
    if (element) {
      element.classList.remove('chapter-updated')
      void (element as HTMLElement).offsetWidth // trigger reflow
      element.classList.add('chapter-updated')
      setTimeout(() => element.classList.remove('chapter-updated'), 700)
    }
  }

  const handleError = (msg: string) => {
    setError(msg)
    setTimeout(() => setError(null), 3000)
  }

  return (
    <div className="page quick-page">
      <section className="page-title-row">
        <div>
          <h1>Quick Update</h1>
          <p>Instantly update your reading progress.</p>
        </div>
      </section>

      <div className="search-bar">
        <label>
          <Search size={18} />
          <input 
            placeholder="Search your active titles..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
      </div>

      {error && (
        <div className="p-4 bg-destructive/15 text-destructive rounded-lg font-medium mb-6 flex items-center">
          <AlertCircle size={18} className="mr-2 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      ) : filteredManhwas.length === 0 ? (
        <div className="empty-state mt-8">
          <span><Search size={24} /></span>
          <h2>No matching titles</h2>
          <p>Try another title or ensure you have active reading titles.</p>
          <button className="button button-secondary" onClick={() => setSearchQuery("")}>
            Clear search
          </button>
        </div>
      ) : (
        <div className="quick-list">
          {filteredManhwas.map((title) => (
            <article key={title.id} className="quick-item" data-manhwa-id={title.id}>
              <div className={`cover cover-small shrink-0 ${getCoverColorClass(title.title)}`}>
                {title.cover_url ? (
                  <CoverImage src={title.cover_url} alt={title.title} className="w-full h-full object-cover" />
                ) : (
                  <strong className="z-10">{title.title.substring(0, 2).toUpperCase()}</strong>
                )}
              </div>
              
              <div className="quick-info min-w-0">
                <strong className="truncate block" title={title.title}>{title.title}</strong>
                <span>Chapter {title.current_chapter} {title.total_chapters ? `of ${title.total_chapters}` : ""}</span>
              </div>

              <ChapterControls 
                manhwa={title} 
                userId={user!.id}
                onUpdateSuccess={(newChapter) => handleUpdateSuccess(title.id, newChapter)}
                onError={handleError}
                compact={false}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
