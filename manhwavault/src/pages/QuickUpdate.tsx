import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CoverImage } from "@/components/CoverImage"
import { Loader2, Search, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { manhwaService } from "@/services/manhwaService"
import { ChapterControls } from "@/components/ChapterControls"
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
        // Sort by updated_at so most recently updated are at top
        const data = await manhwaService.getManhwa(user.id)
        // Filter only "Reading" or maybe active ones?
        // Usually Quick Update shows Reading, but we can show all and let search filter.
        // Let's default to showing "Reading" titles or all if they prefer. The prompt says "Display all relevant titles".
        // I will filter out "Completed" or "Dropped" unless searched, or just show all reading at top.
        const relevant = data.filter(m => m.status === "Reading" || m.status === "On Hold")
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
    // We only need to update the local list state so it stays in sync
    setManhwas(prev => prev.map(m => m.id === id ? { ...m, current_chapter: newChapter } : m))
  }

  const handleError = (msg: string) => {
    setError(msg)
    // Clear error after 3 seconds
    setTimeout(() => setError(null), 3000)
  }

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto space-y-6">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Quick Update</h2>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">Swiftly update your reading progress.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search titles..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-base md:text-lg"
        />
      </div>

      {error && (
        <div className="p-3 md:p-4 bg-destructive/15 text-destructive rounded-lg flex items-center text-sm md:text-base">
          <AlertCircle className="h-5 w-5 mr-3 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredManhwas.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No relevant titles found.
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4 pb-20 md:pb-0">
          {filteredManhwas.map((title) => (
            <Card key={title.id} className="flex items-center p-2 md:p-4 gap-3 md:gap-4 transition-colors hover:bg-accent/30 shadow-sm border-accent/20">
              <div className="w-14 h-20 md:w-16 md:h-24 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                <CoverImage src={title.cover_url} alt={`Cover of ${title.title}`} />
              </div>
              
              <div className="flex-1 min-w-0 py-1">
                <h3 className="font-bold text-base md:text-xl truncate leading-tight mb-1" title={title.title}>
                  {title.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground font-medium flex items-center">
                  <span className="hidden sm:inline">Current Chapter </span>
                  <span className="sm:hidden">Ch. </span>
                  {title.current_chapter} {title.total_chapters ? `/ ${title.total_chapters}` : ""}
                </p>
              </div>

              <ChapterControls 
                manhwa={title} 
                userId={user!.id}
                onUpdateSuccess={(newChapter) => handleUpdateSuccess(title.id, newChapter)}
                onError={handleError}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
