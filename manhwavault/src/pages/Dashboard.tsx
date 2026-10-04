import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { manhwaService } from "@/services/manhwaService"
import { historyService, type HistoryWithManhwa } from "@/services/historyService"
import { ArrowRight } from "lucide-react"
import { getCoverColorClass } from "@/utils/coverColors"
import { useToast } from "@/contexts/ToastContext"
import type { Manhwa } from "@/types"
import { useNavigate } from "react-router-dom"
import { ChapterControls } from "@/components/ChapterControls"
import { CoverImage } from "@/components/CoverImage"

import { Skeleton } from "@/components/ui/skeleton"

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

  const currentDate = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()

  if (loading) {
    return (
      <div className="px-6 md:px-12 py-8 max-w-7xl mx-auto min-h-screen">
        <header className="flex flex-col mb-8 gap-2 border-b border-border pb-6">
          <div className="flex justify-between items-baseline">
            <h1 className="editorial-heading text-3xl md:text-4xl">GOOD EVENING.</h1>
            <span className="text-xs font-sans uppercase tracking-widest text-muted-foreground">{currentDate}</span>
          </div>
          <p className="font-serif text-muted-foreground text-lg">Your library is waiting.</p>
        </header>
        
        <div className="flex gap-6 mb-16 pb-6 border-b border-border/50">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>

        <section className="mb-20">
          <Skeleton className="h-3 w-32 mb-6" />
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
            <Skeleton className="w-full md:w-64 lg:w-80 aspect-[3/4.2] shrink-0" />
            <div className="flex flex-col justify-center flex-1 max-w-2xl py-4 md:py-10">
              <Skeleton className="h-16 w-3/4 mb-6" />
              <Skeleton className="h-12 w-1/4 mb-8" />
              <Skeleton className="h-1 w-full mb-10" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
        </section>
      </div>
    )
  }


  const continueReading = manhwas
    .filter(m => m.status === 'reading')
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())

  // Continue Reading Algorithm
  const heroManhwa = continueReading[0]
  const collection = continueReading.slice(1, 6)
  
  const totalChapters = manhwas.reduce((acc, m) => acc + (m.current_chapter || 0), 0)
  const currentlyReadingCount = manhwas.filter(m => m.status === 'reading').length
  
  // Calculate a streak (mocked based on recent history for now since we don't have a complex streak algorithm yet)
  const calculateStreak = () => {
    if (history.length === 0) return 0
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    
    // Simplistic streak calculation: if updated within last 2 days, streak is active
    const lastUpdate = new Date(history[0].created_at)
    if (currentDate.getTime() - lastUpdate.getTime() <= 2 * 24 * 60 * 60 * 1000) {
      streak = 1 // Basic active indicator
      // In a real app, this would iterate history to count consecutive days
    }
    return streak
  }
  
  const streak = calculateStreak()

  return (
    <div className="px-6 md:px-12 py-8 max-w-7xl mx-auto min-h-screen">
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm text-sm mb-6">
          {error}
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col mb-8 gap-2 border-b border-border pb-6">
        <div className="flex justify-between items-baseline">
          <h1 className="editorial-heading text-3xl md:text-4xl">GOOD EVENING.</h1>
          <span className="text-xs font-sans uppercase tracking-widest text-muted-foreground">{currentDate}</span>
        </div>
        <p className="font-serif text-muted-foreground text-lg">Your library is waiting.</p>
      </header>
      
      {/* Quick Stats */}
      <div className="flex flex-wrap items-center gap-6 md:gap-12 mb-16 pb-6 border-b border-border/50 text-xs font-sans uppercase tracking-widest font-semibold">
        <div className="flex items-center gap-2">
          <span className="text-accent">{manhwas.length}</span>
          <span className="text-muted-foreground">Titles</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-accent">{currentlyReadingCount}</span>
          <span className="text-muted-foreground">Reading</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-accent">{totalChapters}</span>
          <span className="text-muted-foreground">Chapters</span>
        </div>
        {streak > 0 && (
           <div className="flex items-center gap-2 text-orange-400">
             <span>🔥 Active Streak</span>
           </div>
        )}
      </div>

      {/* Hero Section */}
      {heroManhwa ? (
        <section className="mb-20">
          <div className="mb-6">
            <h2 className="font-sans text-xs uppercase tracking-widest text-muted-foreground font-semibold">Continue Reading</h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 group cursor-pointer" onClick={() => navigate(`/manhwa/${heroManhwa.id}`)}>
            <div className={`w-full md:w-64 lg:w-80 aspect-[3/4.2] shrink-0 library-cover ${getCoverColorClass(heroManhwa.title)} relative overflow-hidden bg-surface-elevated border border-border`}>
              {heroManhwa.cover_url ? (
                <CoverImage src={heroManhwa.cover_url} alt={heroManhwa.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-serif text-4xl text-muted-foreground">{heroManhwa.title.substring(0,2).toUpperCase()}</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col justify-center flex-1 max-w-2xl py-4 md:py-10">
              <h3 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tighter leading-[1.1] mb-6 group-hover:text-accent transition-colors line-clamp-2">
                {heroManhwa.title}
              </h3>
              
              <div className="flex items-baseline gap-4 mb-8">
                <span className="font-serif text-3xl lg:text-5xl font-light">Ch. {heroManhwa.current_chapter}</span>
              </div>
              
              <div className="w-full h-1 bg-surface-elevated mb-10 overflow-hidden relative">
                {heroManhwa.total_chapters ? (
                   <div 
                     className="absolute left-0 top-0 h-full bg-accent transition-all duration-1000 ease-out" 
                     style={{ width: `${Math.min(100, Math.round((heroManhwa.current_chapter / heroManhwa.total_chapters) * 100))}%` }}
                   />
                ) : null}
              </div>
              
              <div className="flex items-center justify-between">
                <div onClick={(e) => e.stopPropagation()}>
                  <ChapterControls 
                    manhwa={heroManhwa} 
                    userId={user?.id || ''} 
                    compact={false}
                    onUpdateSuccess={(newChapter) => toast("Progress Saved", `${heroManhwa.title} updated to Chapter ${newChapter}`)}
                  />
                </div>
                {heroManhwa.total_chapters && (
                  <span className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
                    {Math.round((heroManhwa.current_chapter / heroManhwa.total_chapters) * 100)}% Complete
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mb-20">
          <div className="mb-6">
            <h2 className="font-sans text-xs uppercase tracking-widest text-muted-foreground font-semibold">Continue Reading</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border/50 bg-surface-elevated/30">
            <h2 className="font-sans text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">NOTHING TO UPDATE</h2>
            <p className="text-sm font-serif text-foreground/70 max-w-sm mb-6 leading-relaxed">
              Add a title to your library first.
            </p>
            <button 
              onClick={() => navigate('/manhwa/new')} 
              className="text-xs font-sans uppercase tracking-widest text-accent font-semibold hover:text-accent/80 transition-colors px-4 py-2 border border-accent/30"
            >
              ADD MANHWA
            </button>
          </div>
        </section>
      )}

      {/* Recently Updated */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-8 pb-4">
          <h2 className="font-sans text-xs uppercase tracking-widest text-muted-foreground font-semibold">Recently Updated</h2>
          <button onClick={() => navigate('/history')} className="text-xs font-sans uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors flex items-center gap-1">
            View All <ArrowRight size={12} />
          </button>
        </div>
        
        <div className="flex flex-col border border-border bg-surface-elevated">
          {history.length === 0 ? (
             <p className="text-muted-foreground text-sm p-8 font-serif italic text-center">No recent reading history.</p>
          ) : history.slice(0, 4).map(h => {
             const m = manhwas.find(x => x.id === h.manhwa_id)
             if (!m) return null;
             return (
               <div key={h.id} className="group flex items-center justify-between p-4 md:p-6 border-b border-border last:border-b-0 hover:bg-surface transition-colors cursor-pointer" onClick={() => navigate(`/manhwa/${m.id}`)}>
                 <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-serif text-lg md:text-xl truncate group-hover:text-accent transition-colors">{m.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-foreground font-sans tracking-wide">Chapter {h.new_chapter}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{formatTimeAgo(h.created_at)}</span>
                      </div>
                    </div>
                 </div>
                 <div className="shrink-0 flex items-center gap-4">
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
             )
          })}
        </div>
      </section>

      {/* Your Collection */}
      {collection.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-8 pb-4">
            <h2 className="font-sans text-xs uppercase tracking-widest text-muted-foreground font-semibold">Your Collection</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {collection.map(m => (
              <div key={m.id} className="group cursor-pointer flex flex-col library-card relative" onClick={() => navigate(`/manhwa/${m.id}`)}>
                <div className={`aspect-[3/4.2] mb-4 w-full library-cover ${getCoverColorClass(m.title)} bg-surface-elevated overflow-hidden border border-border`}>
                  {m.cover_url ? (
                    <CoverImage src={m.cover_url} alt={m.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-serif text-xl text-muted-foreground">{m.title.substring(0,2).toUpperCase()}</span>
                    </div>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                     <div onClick={(e) => { e.stopPropagation(); }} className="w-full flex justify-center translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                       <ChapterControls 
                         manhwa={m} 
                         userId={user?.id || ''} 
                         compact={true}
                         onUpdateSuccess={() => toast("Saved", `${m.title} updated`)}
                       />
                     </div>
                  </div>
                </div>
                <h4 className="font-serif text-sm truncate group-hover:text-accent transition-colors">{m.title}</h4>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground">Ch. {m.current_chapter}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
