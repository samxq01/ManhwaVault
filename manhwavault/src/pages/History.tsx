import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { historyService, type HistoryWithManhwa } from "@/services/historyService"
import { getCoverColorClass } from "@/utils/coverColors"
import { CoverImage } from "@/components/CoverImage"
import { Loader2, Search, ArrowRight } from "lucide-react"

export function History() {
  const { user } = useAuth()
  const [history, setHistory] = useState<HistoryWithManhwa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function loadHistory() {
      if (!user) return
      try {
        setLoading(true)
        const data = await historyService.getHistory(user.id)
        setHistory(data)
      } catch (err: any) {
        setError(err.message || "Failed to load history")
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
  }, [user])

  const filteredHistory = useMemo(() => {
    let result = history
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(record => 
        record.manhwa?.title.toLowerCase().includes(query)
      )
    }

    const grouped = result.reduce((acc, record) => {
      const dateString = new Date(record.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      })
      if (!acc[dateString]) acc[dateString] = []
      acc[dateString].push(record)
      return acc
    }, {} as Record<string, HistoryWithManhwa[]>)

    return Object.entries(grouped).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
  }, [history, searchQuery])

  // Get relative day name (Today, Yesterday, etc)
  const getRelativeDay = (dateStr: string) => {
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    
    if (dateStr === today) return "TODAY"
    if (dateStr === yesterday) return "YESTERDAY"
    
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()
  }

  return (
    <div className="px-6 md:px-12 py-10 max-w-4xl mx-auto min-h-screen">
      <header className="mb-12">
        <span className="editorial-subheading text-accent">Journal</span>
        <h1 className="editorial-heading mt-2">Reading History.</h1>
      </header>

      <div className="relative mb-16">
        <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input 
          placeholder="Filter history by title..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-b border-border py-4 pl-10 pr-6 text-lg font-serif focus:outline-none focus:border-accent transition-colors placeholder:text-muted-foreground/50"
        />
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm text-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="font-serif text-2xl mb-2 text-muted-foreground">Blank Pages</h2>
          <p className="text-sm text-muted-foreground max-w-sm">No reading history found. Start tracking your progress to see it here.</p>
        </div>
      ) : (
        <div className="relative border-l border-border/50 ml-4 pl-8 md:ml-8 md:pl-12 pb-12">
          {filteredHistory.map(([date, records], groupIndex) => (
            <div key={date} className={groupIndex !== 0 ? "mt-16" : ""}>
              <div className="relative mb-8">
                {/* Timeline node */}
                <div className="absolute -left-[37px] md:-left-[53px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent ring-4 ring-background" />
                
                <h3 className="text-xs font-sans uppercase tracking-[0.2em] font-bold text-foreground">
                  {getRelativeDay(date)}
                  <span className="text-muted-foreground ml-3 font-normal capitalize tracking-normal">{date !== getRelativeDay(date) ? date : ""}</span>
                </h3>
              </div>
              
              <div className="flex flex-col gap-6">
                {records.map(record => (
                  <article key={record.id} className="group flex items-start gap-6 p-4 -ml-4 hover:bg-surface/50 rounded-sm transition-colors cursor-default">
                    <div className={`w-12 h-16 shrink-0 bg-surface-elevated overflow-hidden ${getCoverColorClass(record.manhwa?.title || '')}`}>
                      {record.manhwa?.cover_url ? (
                        <CoverImage src={record.manhwa.cover_url} alt={record.manhwa.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center border border-border">
                          <strong className="font-serif text-lg text-muted-foreground">{record.manhwa?.title.substring(0, 2).toUpperCase() || "??"}</strong>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col justify-center min-w-0 pt-1">
                      <strong className="block font-serif text-xl tracking-tight mb-1 truncate" title={record.manhwa?.title}>{record.manhwa?.title || "Unknown Title"}</strong>
                      <div className="flex items-center gap-2 text-xs font-sans tracking-widest uppercase text-muted-foreground mb-1">
                        <span>Chapter {record.previous_chapter}</span>
                        <ArrowRight size={10} className="text-border" />
                        <span className={record.new_chapter > record.previous_chapter ? "text-accent font-semibold" : ""}>
                          Chapter {record.new_chapter}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/70 tracking-wider">
                        {new Date(record.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
