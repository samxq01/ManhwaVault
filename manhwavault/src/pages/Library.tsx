import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Filter, X, Heart, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { manhwaService } from "@/services/manhwaService"
import { tagService } from "@/services/tagService"
import { historyService } from "@/services/historyService"
import { getCoverColorClass } from "@/utils/coverColors"
import { CoverImage } from "@/components/CoverImage"
import type { Manhwa, Tag } from "@/types"

export function Library() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [manhwas, setManhwas] = useState<(Manhwa & { tags?: Tag[] })[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [sortOption, setSortOption] = useState("recently_updated")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // Mobile Filter Sheet State
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

  const fetchManhwasAndTags = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)
      
      const [fetchedManhwas, fetchedTags, manhwaTagsList] = await Promise.all([
        manhwaService.getManhwa(user.id),
        tagService.getTags(user.id),
        tagService.getManhwaTags(user.id)
      ])
      
      setAllTags(fetchedTags)
      
      // Combine manhwas with their tags
      const combined = fetchedManhwas.map(m => {
        const mt = manhwaTagsList.find(x => x.manhwa_id === m.id)
        return { ...m, tags: mt?.tags || [] }
      })
      
      setManhwas(combined)
    } catch (err: any) {
      setError(err.message || "Failed to load library")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchManhwasAndTags()
  }, [user])

  const handleQuickUpdate = async (e: React.MouseEvent, m: Manhwa) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return
    
    const newChapter = (m.current_chapter || 0) + 1
    
    // Optimistic UI Update
    setManhwas(prev => prev.map(item => item.id === m.id ? { ...item, current_chapter: newChapter, updated_at: new Date().toISOString() } : item))
    
    // Add visual feedback class temporarily
    const element = document.querySelector(`[data-manhwa-id="${m.id}"]`)
    if (element) {
      element.classList.remove('chapter-updated')
      void (element as HTMLElement).offsetWidth // trigger reflow
      element.classList.add('chapter-updated')
      setTimeout(() => element.classList.remove('chapter-updated'), 700)
    }

    try {
      await manhwaService.updateManhwa(m.id, user.id, { current_chapter: newChapter })
      await historyService.addHistoryRecord({
        user_id: user.id,
        manhwa_id: m.id,
        previous_chapter: m.current_chapter,
        new_chapter: newChapter,
      })
    } catch (err: any) {
      // Revert optimistic update
      setManhwas(prev => prev.map(item => item.id === m.id ? { ...item, current_chapter: m.current_chapter, updated_at: m.updated_at } : item))
      setError(err.message || "Failed to update chapter")
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  // Memoized Filtering & Sorting
  const filteredAndSortedManhwas = useMemo(() => {
    let result = [...manhwas]
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(m => 
        m.title.toLowerCase().includes(q) || 
        (m.alternative_title && m.alternative_title.toLowerCase().includes(q))
      )
    }
    
    if (statusFilter !== "All") {
      result = result.filter(m => m.status === statusFilter)
    }
    
    if (favoritesOnly) {
      result = result.filter(m => m.is_favorite)
    }

    if (selectedTags.length > 0) {
      result = result.filter(m => {
        const mTagIds = m.tags?.map(t => t.id) || []
        return selectedTags.every(tagId => mTagIds.includes(tagId))
      })
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case "az":
          return a.title.localeCompare(b.title)
        case "za":
          return b.title.localeCompare(a.title)
        case "chapter_highest":
          return (b.current_chapter || 0) - (a.current_chapter || 0)
        case "chapter_lowest":
          return (a.current_chapter || 0) - (b.current_chapter || 0)
        case "rating_highest":
          return (b.rating || 0) - (a.rating || 0)
        case "recently_updated":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })

    return result
  }, [manhwas, searchQuery, statusFilter, favoritesOnly, sortOption, selectedTags])

  return (
    <div className="page">
      <section className="page-title-row">
        <div>
          <h1>My Library</h1>
          <p>All your stories, in one place.</p>
        </div>
        <button className="button button-primary" onClick={() => navigate('/manhwa/new')}>
          <Plus size={16} /> Add Manhwa
        </button>
      </section>

      {error && (
        <div className="p-4 bg-destructive/15 text-destructive rounded-lg font-medium mb-6">
          {error}
        </div>
      )}

      <div className="library-tools">
        <label className="flex-1 max-w-sm">
          <Search size={18} />
          <input 
            placeholder="Search your library..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
        
        <div className="filter-tabs hidden md:flex">
          {['All', 'Reading', 'Completed', 'On Hold'].map(status => (
            <button 
              key={status}
              className={statusFilter === status ? 'active' : ''} 
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>

        <button 
          className={`button button-secondary hidden md:flex ${favoritesOnly ? 'border-red-500/50 text-red-400' : ''}`}
          onClick={() => setFavoritesOnly(!favoritesOnly)}
        >
          <Heart size={14} className={favoritesOnly ? 'fill-current' : ''} /> Favorites
        </button>

        <select 
          className="bg-surface border border-border rounded-lg text-[10px] px-2 py-2 text-muted h-[38px] hidden md:block"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <option value="recently_updated">Recently Updated</option>
          <option value="az">A-Z</option>
          <option value="za">Z-A</option>
          <option value="chapter_highest">Highest Chapter</option>
          <option value="rating_highest">Highest Rating</option>
        </select>

        {/* Mobile Filter Toggle */}
        <button 
          className="button button-secondary md:hidden"
          onClick={() => setIsFilterSheetOpen(true)}
        >
          <Filter size={14} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-cyan-500" />
        </div>
      ) : filteredAndSortedManhwas.length === 0 ? (
        <div className="empty-state mt-8">
          <span><Search size={24} /></span>
          <h2>No matching titles</h2>
          <p>Try another title or clear your search.</p>
          <button className="button button-secondary" onClick={() => { setSearchQuery(""); setStatusFilter("All"); setFavoritesOnly(false); }}>
            Clear search
          </button>
        </div>
      ) : (
        <section className="library-grid">
          {filteredAndSortedManhwas.map(m => {
            const progressPct = m.total_chapters ? Math.min(100, Math.round((m.current_chapter / m.total_chapters) * 100)) : 100
            const statusClass = m.status ? m.status.toLowerCase().replace(' ', '-') : 'other'

            return (
              <article 
                key={m.id} 
                className="library-card tilt-card cursor-pointer" 
                data-manhwa-id={m.id}
                onClick={() => navigate(`/manhwa/${m.id}`)}
              >
                <div className="card-shine"></div>
                <div className="library-cover-wrap">
                  <div className={`cover cover-large ${getCoverColorClass(m.title)}`}>
                    {m.cover_url ? (
                      <CoverImage src={m.cover_url} alt={m.title} className="w-full h-full object-cover" />
                    ) : (
                      <strong className="z-10">{m.title.substring(0,2).toUpperCase()}</strong>
                    )}
                  </div>
                  
                  {m.status && (
                    <span className={`badge badge-${statusClass}`}>
                      <span></span>{m.status}
                    </span>
                  )}
                  
                  {m.is_favorite && (
                    <span className="absolute top-[9px] right-[9px] bg-background/80 backdrop-blur rounded p-1 shadow-sm text-red-500">
                      <Heart size={12} className="fill-current" />
                    </span>
                  )}

                  <button 
                    className="card-plus" 
                    aria-label={`Update ${m.title}`} 
                    onClick={(e) => handleQuickUpdate(e, m)}
                  >
                    <Plus size={18} />
                  </button>
                </div>
                
                <div className="library-card-info">
                  <h2>{m.title}</h2>
                  <div>
                    <span>Chapter {m.current_chapter}</span>
                    <small>{m.total_chapters ? `${progressPct}%` : ''}</small>
                  </div>
                  <div className="progress">
                    <span style={{ width: `${progressPct}%` }}></span>
                  </div>
                  <small>Updated {formatTimeAgo(m.updated_at)}</small>
                </div>
              </article>
            )
          })}
        </section>
      )}

      {/* Mobile Filter Sheet */}
      {isFilterSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsFilterSheetOpen(false)} />
          <div className="relative bg-surface w-full rounded-t-2xl border-t border-border p-6 pb-safe animate-in slide-in-from-bottom-full duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Filters & Sort</h2>
              <button className="text-muted" onClick={() => setIsFilterSheetOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Reading', 'Completed', 'On Hold', 'Dropped', 'Plan to Read'].map(status => (
                    <button 
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${statusFilter === status ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-surface-2 text-muted border border-border'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              
              {allTags.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => setSelectedTags(prev => prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id])}
                        className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                          selectedTags.includes(tag.id) 
                            ? "bg-primary/20 text-primary border-primary/50" 
                            : "bg-surface-2 text-muted border-border"
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Sort By</label>
                <select 
                  className="w-full bg-surface-2 border border-border rounded-lg text-xs px-3 py-2.5 text-white"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="recently_updated">Recently Updated</option>
                  <option value="az">Alphabetical (A-Z)</option>
                  <option value="za">Alphabetical (Z-A)</option>
                  <option value="chapter_highest">Highest Chapter</option>
                  <option value="rating_highest">Highest Rating</option>
                </select>
              </div>

              <button 
                className={`w-full py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 border transition-colors ${favoritesOnly ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-surface-2 border-border text-muted'}`}
                onClick={() => setFavoritesOnly(!favoritesOnly)}
              >
                <Heart size={14} className={favoritesOnly ? 'fill-current' : ''} /> 
                Favorites Only
              </button>
            </div>
            
            <button className="button button-primary w-full mt-6 h-10" onClick={() => setIsFilterSheetOpen(false)}>
              Show {filteredAndSortedManhwas.length} Titles
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
