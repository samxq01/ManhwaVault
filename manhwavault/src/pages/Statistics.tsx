import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { statisticsService, type ReadingStatistics } from "@/services/statisticsService"
import { manhwaService } from "@/services/manhwaService"
import { AlertCircle, Zap, Book, Activity, CheckCircle, Flame, Loader2 } from "lucide-react"
import { AnimatedCounter } from "@/components/AnimatedCounter"
import type { Manhwa } from "@/types"

export function Statistics() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ReadingStatistics | null>(null)
  const [distribution, setDistribution] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      if (!user) return
      try {
        setLoading(true)
        setError(null)
        
        const [statsData, manhwas] = await Promise.all([
          statisticsService.getReadingStatistics(user.id),
          manhwaService.getManhwa(user.id)
        ])
        
        setStats(statsData)
        
        const dist: Record<string, number> = {}
        manhwas.forEach((m: Manhwa) => {
          if (m.status) {
            dist[m.status] = (dist[m.status] || 0) + 1
          }
        })
        setDistribution(dist)

      } catch (err: unknown) {
        console.error("Failed to load statistics:", err)
        setError("Unable to load statistics. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    
    loadStats()
  }, [user])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="px-6 md:px-12 py-10 max-w-5xl mx-auto min-h-screen">
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm text-sm mb-6 flex items-center">
          <AlertCircle className="h-4 w-4 mr-3 shrink-0" />
          <p className="font-medium">{error || "Unable to load statistics."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 md:px-12 py-10 max-w-5xl mx-auto min-h-screen">
      <header className="mb-16 border-b border-border pb-8">
        <span className="editorial-subheading text-accent">Analytics</span>
        <h1 className="editorial-heading mt-2">Reading Journal.</h1>
      </header>

      {/* Main Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 mb-20">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Zap size={12} /> Total Chapters</span>
          <strong className="font-serif text-5xl tracking-tighter"><AnimatedCounter value={stats.chapters_read} /></strong>
          <span className="text-xs text-muted-foreground font-sans tracking-wide">+{stats.weekly_chapters} this week</span>
        </div>
        
        <div className="flex flex-col gap-2 border-l border-border pl-8">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Book size={12} /> Library Size</span>
          <strong className="font-serif text-5xl tracking-tighter"><AnimatedCounter value={stats.total_titles} /></strong>
          <span className="text-xs text-muted-foreground font-sans tracking-wide">Titles tracked</span>
        </div>

        <div className="flex flex-col gap-2 border-t md:border-t-0 md:border-l border-border pt-8 md:pt-0 pl-0 md:pl-8">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Activity size={12} /> Currently Reading</span>
          <strong className="font-serif text-5xl tracking-tighter"><AnimatedCounter value={stats.currently_reading} /></strong>
          <span className="text-xs text-muted-foreground font-sans tracking-wide">Titles in progress</span>
        </div>

        <div className="flex flex-col gap-2 border-t md:border-t-0 border-l border-border pt-8 md:pt-0 pl-8">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Flame size={12} /> Today's Progress</span>
          <strong className="font-serif text-5xl tracking-tighter text-accent"><AnimatedCounter value={stats.todays_chapters} /></strong>
          <span className="text-xs text-muted-foreground font-sans tracking-wide">Chapters read today</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        {/* Activity Chart */}
        <section className="flex flex-col">
          <div className="mb-6 flex justify-between items-baseline border-b border-border pb-2">
            <h2 className="font-serif text-2xl tracking-tight">Reading Activity</h2>
            <span className="text-xs text-muted-foreground font-sans tracking-widest uppercase">Last 14 days</span>
          </div>
          
          <div className="h-48 w-full relative flex items-end">
            <svg viewBox="0 0 400 150" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="fill-[url(#area)] opacity-0 animate-in fade-in duration-1000 delay-500" d="M0,150 L0,120 C50,120 70,80 120,90 C170,100 190,60 240,70 C290,80 320,40 370,50 L400,30 L400,150 Z" />
              <path className="stroke-accent stroke-2 fill-none" strokeDasharray="1100" strokeDashoffset="0" d="M0,120 C50,120 70,80 120,90 C170,100 190,60 240,70 C290,80 320,40 370,50 L400,30">
                 <animate attributeName="stroke-dashoffset" from="1100" to="0" dur="1.5s" fill="freeze" />
              </path>
            </svg>
          </div>
          
          <div className="flex justify-between mt-4 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>2 Wks Ago</span>
            <span>1 Wk Ago</span>
            <span>Today</span>
          </div>
        </section>

        {/* Library Status */}
        <section className="flex flex-col">
          <div className="mb-6 flex justify-between items-baseline border-b border-border pb-2">
            <h2 className="font-serif text-2xl tracking-tight">Library Status</h2>
            <span className="text-xs text-muted-foreground font-sans tracking-widest uppercase">{stats.total_titles} Total</span>
          </div>
          
          <div className="flex flex-col gap-6 mt-4">
            {[
              { label: 'Reading', count: distribution['reading'] || 0, icon: <Activity size={14} />, color: 'text-accent' },
              { label: 'Completed', count: distribution['completed'] || 0, icon: <CheckCircle size={14} />, color: 'text-muted-foreground' },
              { label: 'On Hold', count: distribution['on_hold'] || 0, icon: <Book size={14} />, color: 'text-muted-foreground/70' },
              { label: 'Plan to Read', count: distribution['plan_to_read'] || 0, icon: <Book size={14} />, color: 'text-muted-foreground/50' }
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className={`${item.color}`}>{item.icon}</span>
                  <span className="text-sm font-sans tracking-widest uppercase text-foreground">{item.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-serif text-xl">{item.count}</span>
                  <div className="w-24 h-1 bg-surface-elevated overflow-hidden">
                    <div 
                      className="h-full bg-accent opacity-50 group-hover:opacity-100 transition-opacity" 
                      style={{ width: `${stats.total_titles > 0 ? (item.count / stats.total_titles) * 100 : 0}%` }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
