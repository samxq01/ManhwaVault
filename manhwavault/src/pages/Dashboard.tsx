import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { manhwaService } from "@/services/manhwaService"
import { historyService, type HistoryWithManhwa } from "@/services/historyService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, BookOpen, CheckCircle, Clock, XCircle, TrendingUp, Calendar, Flame } from "lucide-react"
import type { Manhwa } from "@/types"
import { Link } from "react-router-dom"

export function Dashboard() {
  const { user } = useAuth()
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
    let onHold = 0
    let dropped = 0
    let totalChaptersRead = 0

    manhwas.forEach(m => {
      if (m.status === "Reading") reading++
      else if (m.status === "Completed") completed++
      else if (m.status === "On Hold") onHold++
      else if (m.status === "Dropped") dropped++
      
      totalChaptersRead += (m.current_chapter || 0)
    })

    // Calculate time-based chapter reads
    let today = 0
    let thisWeek = 0
    let thisMonth = 0

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    
    // getDay() is 0 (Sun) to 6 (Sat). We want Monday start probably, but JS default is fine.
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
      onHold,
      dropped,
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
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days !== 1 ? 's' : ''} ago`
  }

  const renderProgress = (current: number, total: number | null | undefined) => {
    if (total && total > 0) {
      const percentage = (current / total) * 100
      // Round to 1 decimal place max
      return `${Math.round(percentage * 10) / 10}% (${current} / ${total})`
    }
    return `Chapter ${current}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const recentActivity = history.slice(0, 10)

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-6 md:space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Overview of your reading journey.</p>
      </header>

      {error && (
        <div className="p-4 bg-destructive/15 text-destructive rounded-lg font-medium">
          {error}
        </div>
      )}

      {/* Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Titles</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Reading</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reading}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card className="hidden md:block">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">On Hold / Dropped</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onHold} <span className="text-muted-foreground text-sm font-normal">/ {stats.dropped}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Reading Pace Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Chapters Read</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalChaptersRead}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground mt-1">Chapters</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">Chapters</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">Chapters</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="border-b bg-muted/40">
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No recent activity. Start reading!
            </div>
          ) : (
            <div className="divide-y">
              {recentActivity.map(record => {
                const isPositive = record.new_chapter > record.previous_chapter
                // We need to find the total chapters from the manhwa array to display progress correctly
                const manhwaDetails = manhwas.find(m => m.id === record.manhwa_id)
                
                return (
                  <div key={record.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      {isPositive && <Flame className="h-5 w-5 text-orange-500 shrink-0" />}
                      {!isPositive && <Clock className="h-5 w-5 text-muted-foreground shrink-0" />}
                      <div>
                        <Link to={`/manhwa/${record.manhwa_id}`} className="font-semibold hover:underline line-clamp-1">
                          {record.manhwa?.title}
                        </Link>
                        <div className="text-sm mt-0.5">
                          {renderProgress(record.new_chapter, manhwaDetails?.total_chapters)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                      {formatTimeAgo(record.created_at)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
