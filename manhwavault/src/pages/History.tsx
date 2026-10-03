import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { historyService, type HistoryWithManhwa } from "@/services/historyService"
import { getCoverColorClass } from "@/utils/coverColors"
import { CoverImage } from "@/components/CoverImage"
import { Loader2, Search, ChevronRight, AlertCircle, Calendar } from "lucide-react"

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

    // Group by Date
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

    // Sort groups descending by date
    return Object.entries(grouped).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
  }, [history, searchQuery])

  return (
    <div className="page">
      <section className="page-title-row">
        <div>
          <h1>History</h1>
          <p>Your reading timeline.</p>
        </div>
      </section>

      <div className="search-bar mb-6">
        <label>
          <Search size={18} />
          <input 
            placeholder="Filter by title..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
      </div>

      {error && (
        <div className="p-4 bg-destructive/15 text-destructive rounded-lg flex items-center font-medium mb-6">
          <AlertCircle size={18} className="mr-2 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="empty-state mt-8">
          <span><Search size={24} /></span>
          <h2>No history records</h2>
          <p>Your reading timeline is empty.</p>
        </div>
      ) : (
        <div className="history-timeline">
          {filteredHistory.map(([date, records]) => (
            <div className="history-group" key={date}>
              <div className="history-date">
                <span className="date-badge"><Calendar size={14} /> {date}</span>
                <span className="line"></span>
              </div>
              <div className="history-items">
                {records.map(record => (
                  <article className="history-item" key={record.id}>
                    <div className={`cover cover-small shrink-0 ${getCoverColorClass(record.manhwa?.title || '')}`}>
                      {record.manhwa?.cover_url ? (
                        <CoverImage src={record.manhwa.cover_url} alt={record.manhwa.title} className="w-full h-full object-cover" />
                      ) : (
                        <strong className="z-10">{record.manhwa?.title.substring(0, 2).toUpperCase() || "??"}</strong>
                      )}
                    </div>
                    <div className="history-info min-w-0">
                      <strong className="truncate block" title={record.manhwa?.title}>{record.manhwa?.title || "Unknown Title"}</strong>
                      <span className="flex items-center gap-1.5 flex-wrap">
                        Chapter {record.previous_chapter} 
                        <ChevronRight size={12} className="text-muted" /> 
                        <span className={record.new_chapter > record.previous_chapter ? "text-cyan-400" : ""}>
                          Chapter {record.new_chapter}
                        </span>
                      </span>
                      <small className="block">
                        {new Date(record.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </small>
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
