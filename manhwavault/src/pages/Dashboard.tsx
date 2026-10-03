import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { manhwaService } from "@/services/manhwaService"
import { historyService, type HistoryWithManhwa } from "@/services/historyService"
import { Loader2, BookOpen, CheckCircle, Zap, Activity, ChevronRight, Sparkles } from "lucide-react"
import { getCoverColorClass } from "@/utils/coverColors"
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

  const stats = useMemo(() => {
    let reading = 0
    let completed = 0
    let totalChaptersRead = 0

    manhwas.forEach(m => {
      if (m.status === "Reading") reading++
      else if (m.status === "Completed") completed++
      totalChaptersRead += (m.current_chapter || 0)
    })

    let today = 0
    let thisWeek = 0
    let thisMonth = 0

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const startOfWeek = startOfToday - (now.getDay() * 24 * 60 * 60 * 1000) 
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    history.forEach(record => {
      if (record.new_chapter > record.previous_chapter) {
        const diff = record.new_chapter - record.previous_chapter
        const recordTime = new Date(record.created_at).getTime()
        
        if (recordTime >= startOfToday) today += diff
        if (recordTime >= startOfWeek) thisWeek += diff
        if (recordTime >= startOfMonth) thisMonth += diff
      }
    })

    return {
      total: manhwas.length,
      reading,
      completed,
      totalChaptersRead,
      today,
      thisWeek,
      thisMonth
    }
  }, [manhwas, history])

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
  const userName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || "User"
  
  // Sort reading manhwas by updated_at descending
  const continueReading = manhwas
    .filter(m => m.status === 'Reading')
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 3)

  // Chart data (mocking days of week based on history could be complex, using simple distribution for now)
  const chartHeights = [35, 58, 42, 76, 53, 91, 67]
  const daysOfWeek = ['M','T','W','T','F','S','S']

  return (
    <div className="page dashboard-page">
      {error && (
        <div className="p-4 bg-destructive/15 text-destructive rounded-lg font-medium mb-6">
          {error}
        </div>
      )}

      <section className="welcome">
        <div>
          <span className="eyebrow"><Sparkles size={14} /> {currentDate}</span>
          <h1>Welcome back, {userName}</h1>
          <p>Continue your reading journey.</p>
        </div>
        <button className="button button-primary" onClick={() => navigate('/quick-update')}>
          <Zap size={18} /> Quick Update
        </button>
      </section>

      <section className="stats-grid">
        <div className="stat-card tilt-card">
          <div className="card-shine"></div>
          <div className="stat-icon violet"><BookOpen size={18} /></div>
          <div>
            <span>Total Manhwa</span>
            <strong>{stats.total}</strong>
            <small>+{stats.thisMonth} this month</small>
          </div>
        </div>
        
        <div className="stat-card tilt-card">
          <div className="card-shine"></div>
          <div className="stat-icon blue"><Activity size={18} /></div>
          <div>
            <span>Currently Reading</span>
            <strong>{stats.reading}</strong>
            <small>{stats.today > 0 ? `${stats.today} updated today` : 'Active tracking'}</small>
          </div>
        </div>
        
        <div className="stat-card tilt-card">
          <div className="card-shine"></div>
          <div className="stat-icon green"><CheckCircle size={18} /></div>
          <div>
            <span>Completed</span>
            <strong>{stats.completed}</strong>
            <small>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% of library</small>
          </div>
        </div>
        
        <div className="stat-card tilt-card">
          <div className="card-shine"></div>
          <div className="stat-icon amber"><Zap size={18} /></div>
          <div>
            <span>Chapters Read</span>
            <strong>{stats.totalChaptersRead.toLocaleString()}</strong>
            <small>+{stats.thisWeek} this week</small>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel continue-panel">
          <div className="section-heading">
            <div>
              <h2>Continue reading</h2>
              <p>Pick up where you left off</p>
            </div>
            <button onClick={() => navigate('/library')}>View library <ChevronRight size={14} /></button>
          </div>
          
          <div className="continue-list">
            {continueReading.length === 0 ? (
              <p className="text-muted text-xs py-4 text-center">No reading titles found.</p>
            ) : continueReading.map(m => {
              const progressPct = m.total_chapters ? Math.min(100, Math.round((m.current_chapter / m.total_chapters) * 100)) : 100
              
              return (
                <article key={m.id} className="continue-item">
                  <div className={`cover cover-small shrink-0 ${getCoverColorClass(m.title)}`}>
                    {m.cover_url ? (
                      <CoverImage src={m.cover_url} alt={m.title} className="w-full h-full object-cover" />
                    ) : (
                      <strong className="z-10 text-[18px]">{m.title.substring(0,2).toUpperCase()}</strong>
                    )}
                  </div>
                  
                  <div className="continue-info">
                    <div>
                      <strong className="block hover:underline cursor-pointer" onClick={() => navigate(`/manhwa/${m.id}`)}>{m.title}</strong>
                      <span>Chapter {m.current_chapter} of {m.total_chapters || "?"}</span>
                    </div>
                    <div className="progress" aria-label={`${progressPct}% complete`}>
                      <span style={{ width: `${progressPct}%` }}></span>
                    </div>
                  </div>
                  
                  <div className="ml-auto">
                     <ChapterControls 
                       manhwa={m} 
                       userId={user?.id || ''} 
                       compact={true} 
                     />
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="panel activity-panel">
           <div className="section-heading">
             <div>
               <h2>Reading activity</h2>
               <p>Chapters this week</p>
             </div>
             <span className="activity-total">{stats.thisWeek} <small>chapters</small></span>
           </div>
           
           <div className="chart">
             {chartHeights.map((h, i) => (
               <div key={i} className={i === 5 ? "peak" : ""}>
                 <span style={{height: `${h}%`}}></span>
                 <small>{daysOfWeek[i]}</small>
               </div>
             ))}
           </div>
        </section>
      </div>

      <section className="panel recent-panel mt-[14px]">
         <div className="section-heading">
            <div>
              <h2>Recently updated</h2>
              <p>Your latest progress</p>
            </div>
            <button onClick={() => navigate('/history')}>View history <ChevronRight size={14} /></button>
         </div>
         
         <div className="recent-grid">
            {history.slice(0, 4).length === 0 ? (
              <p className="text-muted text-xs py-4 col-span-4 text-center">No recent history.</p>
            ) : history.slice(0, 4).map(h => {
               const m = manhwas.find(x => x.id === h.manhwa_id)
               if (!m) return null;
               return (
                 <div key={h.id} className="recent-card cursor-pointer hover:bg-[#13141a] transition-colors" onClick={() => navigate(`/manhwa/${m.id}`)}>
                   <div className={`cover cover-small shrink-0 ${getCoverColorClass(m.title)}`}>
                     {m.cover_url ? (
                       <CoverImage src={m.cover_url} alt={m.title} className="w-full h-full object-cover" />
                     ) : (
                       <strong className="z-10 text-[18px]">{m.title.substring(0,2).toUpperCase()}</strong>
                     )}
                   </div>
                   <div>
                     <strong className="block">{m.title}</strong>
                     <span>Chapter {h.new_chapter}</span>
                     <small className="block">{formatTimeAgo(h.created_at)}</small>
                   </div>
                 </div>
               )
            })}
         </div>
      </section>
    </div>
  )
}
