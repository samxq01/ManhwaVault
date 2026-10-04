import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { manhwaService } from "@/services/manhwaService"
import { historyService, type HistoryWithManhwa } from "@/services/historyService"
import { Loader2, ArrowRight } from "lucide-react"
import { getCoverColorClass } from "@/utils/coverColors"
import { useToast } from "@/contexts/ToastContext"
import type { Manhwa } from "@/types"
import { useNavigate } from "react-router-dom"
import { ChapterControls } from "@/components/ChapterControls"
import { CoverImage } from "@/components/CoverImage"

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [manhwas, setManhwas] = useState<Manhwa[]>([])
  const [history, setHistory] = useState<HistoryWithManhwa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function loadDashboard() {
      if (!user) return
      try {
        setLoading(true)
        const [manhwaData, historyData] = await Promise.all([
          manhwaService.getManhwa(user.id),
          historyService.getHistory(user.id)
        ])
        setManhwas(manhwaData)
        setHistory(historyData)
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [user])

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hr${hours !== 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days !== 1 ? 's' : ''} ago`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()
  
  // Sort reading manhwas by updated_at descending
  const continueReading = manhwas
    .filter(m => m.status === 'Reading')
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())

  const heroManhwa = continueReading[0]
  const collection = continueReading.slice(1, 6)

  return (
    <div className="px-6 md:px-12 py-8 max-w-7xl mx-auto min-h-screen">
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm text-sm mb-6">
          {error}
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-4">
        <div>
          <span className="editorial-subheading text-accent">{currentDate}</span>
          <h1 className="editorial-heading mt-2">Good Evening.</h1>
        </div>
      </header>

      {/* Hero Section */}
      {heroManhwa && (
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
            <h2 className="font-serif text-2xl tracking-tight">Continue Reading</h2>
            <button 
              onClick={() => navigate('/library')} 
              className="text-xs font-sans uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors flex items-center gap-2"
            >
              View Library <ArrowRight size={14} />
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-10 group cursor-pointer" onClick={() => navigate(`/manhwa/${heroManhwa.id}`)}>
            <div className={`w-full md:w-1/3 aspect-[3/4.2] shrink-0 library-cover ${getCoverColorClass(heroManhwa.title)} relative overflow-hidden bg-surface-elevated`}>
              {heroManhwa.cover_url ? (
                <CoverImage src={heroManhwa.cover_url} alt={heroManhwa.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center border border-border">
                  <span className="font-serif text-4xl text-muted-foreground">{heroManhwa.title.substring(0,2).toUpperCase()}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            
            <div className="flex flex-col justify-center flex-1 max-w-2xl py-4 md:py-10">
              <span className="editorial-subheading mb-3">Currently Tracking</span>
              <h3 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tighter leading-[1.1] mb-6 group-hover:text-accent transition-colors line-clamp-2">
                {heroManhwa.title}
              </h3>
              
              <div className="flex items-baseline gap-4 mb-8">
                <span className="font-serif text-5xl font-light">Ch. {heroManhwa.current_chapter}</span>
                {heroManhwa.total_chapters && (
                  <span className="text-muted-foreground font-sans text-sm tracking-widest uppercase">/ {heroManhwa.total_chapters} Total</span>
                )}
              </div>
              
              <div className="w-full h-1 bg-surface-elevated mb-10 overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-1000 ease-out" 
                  style={{ width: `${heroManhwa.total_chapters ? Math.min(100, Math.round((heroManhwa.current_chapter / heroManhwa.total_chapters) * 100)) : 100}%` }}
                />
              </div>
              
              <div onClick={(e) => e.stopPropagation()}>
                <ChapterControls 
                  manhwa={heroManhwa} 
                  userId={user?.id || ''} 
                  compact={false}
                  onUpdateSuccess={(newChapter) => toast("Progress Saved", `${heroManhwa.title} updated to Chapter ${newChapter}`)}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Your Collection */}
      {collection.length > 0 && (
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
            <h2 className="font-serif text-xl tracking-tight">Your Collection</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {collection.map(m => (
              <div key={m.id} className="group cursor-pointer flex flex-col library-card" onClick={() => navigate(`/manhwa/${m.id}`)}>
                <div className={`aspect-[3/4.2] mb-4 w-full library-cover ${getCoverColorClass(m.title)} bg-surface-elevated overflow-hidden`}>
                  {m.cover_url ? (
                    <CoverImage src={m.cover_url} alt={m.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center border border-border">
                      <span className="font-serif text-xl text-muted-foreground">{m.title.substring(0,2).toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <h4 className="font-medium text-sm truncate group-hover:text-accent transition-colors">{m.title}</h4>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-muted-foreground">Ch. {m.current_chapter}</span>
                  <div onClick={(e) => { e.stopPropagation(); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChapterControls 
                      manhwa={m} 
                      userId={user?.id || ''} 
                      compact={true}
                      onUpdateSuccess={(newChapter) => toast("Saved", `Ch. ${newChapter}`)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently Updated */}
      <section>
        <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
          <h2 className="font-serif text-xl tracking-tight">Recently Updated</h2>
          <button onClick={() => navigate('/history')} className="text-xs font-sans uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors">
            Full History
          </button>
        </div>
        
        <div className="flex flex-col gap-1">
          {history.length === 0 ? (
             <p className="text-muted-foreground text-sm py-8 font-serif italic">No recent reading history.</p>
          ) : history.slice(0, 5).map(h => {
             const m = manhwas.find(x => x.id === h.manhwa_id)
             if (!m) return null;
             return (
               <div key={h.id} className="group flex items-center justify-between py-4 border-b border-border/50 hover:border-accent/50 transition-colors cursor-pointer" onClick={() => navigate(`/manhwa/${m.id}`)}>
                 <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="w-10 h-14 shrink-0 bg-surface-elevated overflow-hidden">
                       {m.cover_url ? (
                         <CoverImage src={m.cover_url} alt={m.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center border border-border">
                           <span className="text-[10px] text-muted-foreground">{m.title.substring(0,1).toUpperCase()}</span>
                         </div>
                       )}
                    </div>
                    <div className="min-w-0 pr-4">
                      <h4 className="font-serif text-lg truncate group-hover:text-accent transition-colors">{m.title}</h4>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-sans">Chapter {h.previous_chapter} <ArrowRight size={10} className="inline mx-1" /> Chapter {h.new_chapter}</span>
                    </div>
                 </div>
                 <div className="text-right shrink-0">
                    <span className="text-xs text-muted-foreground font-sans block">{formatTimeAgo(h.created_at)}</span>
                 </div>
               </div>
             )
          })}
        </div>
      </section>
    </div>
  )
}
