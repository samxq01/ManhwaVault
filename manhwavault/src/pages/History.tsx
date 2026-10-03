import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { historyService, type HistoryWithManhwa } from "@/services/historyService"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Loader2, Search, ArrowRight, AlertCircle, Clock } from "lucide-react"

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
    if (!searchQuery.trim()) return history
    const query = searchQuery.toLowerCase()
    return history.filter(record => 
      record.manhwa?.title.toLowerCase().includes(query)
    )
  }, [history, searchQuery])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date)
  }

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto space-y-6">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Reading History</h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">Track all your chapter updates over time.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Filter by title..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {error && (
        <div className="p-4 bg-destructive/15 text-destructive rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-3 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
          <Clock className="h-12 w-12 text-muted mb-4" />
          <p>No history records found.</p>
        </div>
      ) : (
        <div className="space-y-3 pb-20 md:pb-0">
          {filteredHistory.map((record) => (
            <Card key={record.id} className="p-4 flex items-center gap-4 hover:bg-accent/30 transition-colors">
              <div className="w-12 h-16 bg-muted rounded overflow-hidden shrink-0 hidden sm:block">
                {record.manhwa?.cover_url ? (
                  <img src={record.manhwa.cover_url} alt={record.manhwa.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground">No Cover</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base md:text-lg truncate">{record.manhwa?.title || "Unknown Title"}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(record.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 md:gap-4 font-medium tabular-nums shrink-0">
                <span className="text-muted-foreground">Ch. {record.previous_chapter}</span>
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className={record.new_chapter > record.previous_chapter ? "text-green-500" : "text-destructive"}>
                  Ch. {record.new_chapter}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
