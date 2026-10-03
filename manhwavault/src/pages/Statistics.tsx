import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { statisticsService, type ReadingStatistics } from "@/services/statisticsService"
import { manhwaService } from "@/services/manhwaService"
import { AlertCircle, Zap, TrendingUp, Book, Activity, CheckCircle, Flame, Loader2 } from "lucide-react"
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
        
        // Calculate status distribution
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
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="page">
        <section className="page-title-row">
          <div>
            <h1>Statistics</h1>
            <p>Your reading analytics.</p>
          </div>
        </section>
        <div className="p-6 bg-destructive/15 text-destructive rounded-xl flex items-center mt-6">
          <AlertCircle className="h-6 w-6 mr-3 shrink-0" />
          <p className="font-medium">{error || "Unable to load statistics."}</p>
        </div>
      </div>
    )
  }



  return (
    <div className="page">
      <section className="page-title-row">
        <div>
          <h1>Statistics</h1>
          <p>Your reading analytics.</p>
        </div>
      </section>

      <div className="stats-bento">
        <div className="bento-card bento-hero">
          <div className="bento-bg"></div>
          <div className="bento-content relative z-10">
            <span className="bento-icon"><Zap size={24} /></span>
            <div className="bento-text">
              <span>Total Chapters Read</span>
              <strong>{stats.chapters_read.toLocaleString()}</strong>
            </div>
            <div className="bento-trend">
              <TrendingUp size={16} />
              <span>+{stats.weekly_chapters} this week</span>
            </div>
          </div>
        </div>
        
        <div className="bento-card">
          <div className="bento-content">
            <span className="bento-icon violet"><Book size={20} /></span>
            <div className="bento-text">
              <span>Library Size</span>
              <strong>{stats.total_titles.toLocaleString()}</strong>
            </div>
            <span className="bento-subtitle">Manhwa tracked</span>
          </div>
        </div>

        <div className="bento-card">
          <div className="bento-content">
            <span className="bento-icon blue"><Activity size={20} /></span>
            <div className="bento-text">
              <span>Active Reading</span>
              <strong>{stats.currently_reading.toLocaleString()}</strong>
            </div>
            <span className="bento-subtitle">Titles in progress</span>
          </div>
        </div>

        <div className="bento-card">
          <div className="bento-content">
            <span className="bento-icon green"><CheckCircle size={20} /></span>
            <div className="bento-text">
              <span>Completed</span>
              <strong>{stats.completed.toLocaleString()}</strong>
            </div>
            <span className="bento-subtitle">
              {stats.total_titles > 0 ? Math.round((stats.completed / stats.total_titles) * 100) : 0}% of library
            </span>
          </div>
        </div>

        <div className="bento-card">
          <div className="bento-content">
            <span className="bento-icon amber"><Flame size={20} /></span>
            <div className="bento-text">
              <span>Today's Progress</span>
              <strong>{stats.todays_chapters.toLocaleString()}</strong>
            </div>
            <span className="bento-subtitle">Chapters read today</span>
          </div>
        </div>
      </div>

      <div className="statistics-grid">
        <section className="panel big-chart">
          <div className="section-heading">
            <div>
              <h2>Reading activity</h2>
              <p>Chapters read over the last 14 days</p>
            </div>
            <strong>{stats.chapters_read} <small>total</small></strong>
          </div>
          <div className="line-chart">
            <svg viewBox="0 0 400 150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="area" d="M0,150 L0,120 C50,120 70,80 120,90 C170,100 190,60 240,70 C290,80 320,40 370,50 L400,30 L400,150 Z" />
              <path className="line" d="M0,120 C50,120 70,80 120,90 C170,100 190,60 240,70 C290,80 320,40 370,50 L400,30" />
            </svg>
            <div>
              <span>May 13</span>
              <span>May 16</span>
              <span>May 19</span>
              <span>May 22</span>
              <span>Today</span>
            </div>
          </div>
        </section>

        <section className="panel status-panel">
          <div className="section-heading">
            <div>
              <h2>Library status</h2>
              <p>{stats.total_titles} total titles</p>
            </div>
          </div>
          <div className="donut-wrap">
            <div className="donut">
              <div>
                <strong>{stats.total_titles}</strong>
                <span>Titles</span>
              </div>
            </div>
            <div className="legend">
              <div><i className="violet"></i><span>Reading</span><strong>{distribution['Reading'] || 0}</strong></div>
              <div><i className="green"></i><span>Completed</span><strong>{distribution['Completed'] || 0}</strong></div>
              <div><i className="amber"></i><span>On hold</span><strong>{distribution['On Hold'] || 0}</strong></div>
              <div><i className="blue"></i><span>Plan to read</span><strong>{distribution['Plan to Read'] || 0}</strong></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
