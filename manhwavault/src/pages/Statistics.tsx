import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { statisticsService, type ReadingStatistics } from "@/services/statisticsService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Library, BookOpen, CheckCircle, FileText, Sun, Calendar, BarChart } from "lucide-react"

export function Statistics() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ReadingStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      if (!user) return
      try {
        setLoading(true)
        setError(null)
        const data = await statisticsService.getReadingStatistics(user.id)
        setStats(data)
      } catch (err: unknown) {
        console.error("Failed to load statistics:", err)
        setError("Unable to load statistics. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    
    loadStats()
  }, [user])

  const StatCardSkeleton = () => (
    <Card className="animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-4 w-24 bg-muted rounded"></div>
        <div className="h-5 w-5 bg-muted rounded-full"></div>
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 bg-muted rounded mb-2"></div>
        <div className="h-3 w-32 bg-muted rounded"></div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-6 md:space-y-8">
        <header>
          <h2 className="text-3xl font-bold tracking-tight">Statistics</h2>
          <p className="text-muted-foreground mt-1">Analytics for your reading journey.</p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(7)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-6 md:space-y-8">
        <header>
          <h2 className="text-3xl font-bold tracking-tight">Statistics</h2>
          <p className="text-muted-foreground mt-1">Analytics for your reading journey.</p>
        </header>
        <div className="p-6 bg-destructive/15 text-destructive rounded-xl flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-10 w-10 mb-4" />
          <p className="font-medium text-lg">{error || "Unable to load statistics."}</p>
          <p className="text-sm mt-2 opacity-80">Please check your connection and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-6 md:space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Statistics</h2>
        <p className="text-muted-foreground mt-1">Analytics for your reading journey.</p>
      </header>

      {/* Grid: Mobile 1-col, Tablet 2-col, Desktop 3-col */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Total Titles</CardTitle>
            <Library className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_titles ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Titles in your library</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Currently Reading</CardTitle>
            <BookOpen className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.currently_reading ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Titles you're reading</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Completed</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completed ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Titles completed</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Chapters Read</CardTitle>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.chapters_read ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total chapters</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Today's Chapters</CardTitle>
            <Sun className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todays_chapters ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Chapters read today</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Weekly Chapters</CardTitle>
            <Calendar className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.weekly_chapters ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Chapters this week</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Monthly Chapters</CardTitle>
            <BarChart className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.monthly_chapters ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Chapters this month</p>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
