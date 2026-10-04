import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Filter, X, Heart } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { manhwaService } from "@/services/manhwaService"
import { tagService } from "@/services/tagService"
import { getCoverColorClass } from "@/utils/coverColors"
import { useToast } from "@/contexts/ToastContext"
import { CoverImage } from "@/components/CoverImage"
import { ChapterControls } from "@/components/ChapterControls"
import { Skeleton } from "@/components/ui/skeleton"
import type { Manhwa, Tag } from "@/types"

export function Library() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [manhwas, setManhwas] = useState<(Manhwa & { tags?: Tag[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [sortOption, setSortOption] = useState("recently_updated")
  
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const { toast } = useToast()

  const fetchManhwasAndTags = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)
      
      const [fetchedManhwas, , manhwaTagsList] = await Promise.all([
        manhwaService.getManhwa(user.id),
        tagService.getTags(user.id),
        tagService.getManhwaTags(user.id)
      ])
      
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



    result.sort((a, b) => {
      switch (sortOption) {
        case "az": return a.title.localeCompare(b.title)
        case "za": return b.title.localeCompare(a.title)
        case "chapter_highest": return (b.current_chapter || 0) - (a.current_chapter || 0)
        case "chapter_lowest": return (a.current_chapter || 0) - (b.current_chapter || 0)
        case "rating_highest": return (b.rating || 0) - (a.rating || 0)
        case "recently_updated":
        default: return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })

    return result
  }, [manhwas, searchQuery, statusFilter, favoritesOnly, sortOption])

  return (
    <div className="px-6 md:px-12 py-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <span className="editorial-subheading text-accent">Archive</span>
          <h1 className="editorial-heading mt-2">Your Collection.</h1>
        </div>
        
        <button 
          onClick={() => navigate('/manhwa/new')} 
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-background rounded-sm hover:bg-accent/90 transition-colors font-medium text-sm font-sans tracking-wide"
        >
          <Plus size={16} strokeWidth={2.5} /> Add Title
        </button>
      </header>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm text-sm mb-6">
          {error}
        </div>
      )}

      {/* Tools / Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-10 border-b border-border pb-6">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input 
            placeholder="Search archive..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-sm py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        
        <div className="hidden lg:flex items-center gap-2 flex-wrap">
          <div className="flex bg-surface p-1 rounded-sm border border-border">
            {['All', 'Reading', 'Completed', 'On Hold'].map(status => (
              <button 
                key={status}
                className={`px-4 py-1.5 rounded-sm text-[11px] uppercase tracking-widest font-semibold transition-colors ${statusFilter === status ? 'bg-surface-elevated text-accent' : 'text-muted-foreground hover:text-foreground'}`} 
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <button 
            className={`flex items-center gap-2 px-4 py-1.5 rounded-sm border transition-colors text-[11px] uppercase tracking-widest font-semibold ${favoritesOnly ? 'border-red-500/30 text-red-400 bg-red-500/5' : 'border-border bg-surface text-muted-foreground'}`}
            onClick={() => setFavoritesOnly(!favoritesOnly)}
          >
            <Heart size={14} className={favoritesOnly ? 'fill-current' : ''} /> Favs
          </button>

          <select 
            className="bg-surface border border-border rounded-sm text-[11px] uppercase tracking-widest font-semibold px-3 py-1.5 h-[34px] focus:outline-none focus:border-accent cursor-pointer"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="recently_updated">Recent</option>
            <option value="az">A-Z</option>
            <option value="za">Z-A</option>
            <option value="chapter_highest">Highest Ch.</option>
          </select>
        </div>

        {/* Mobile Filter Toggle */}
        <button 
          className="lg:hidden flex items-center justify-center gap-2 bg-surface border border-border py-2 px-4 rounded-sm text-sm"
          onClick={() => setIsFilterSheetOpen(true)}
        >
          <Filter size={16} /> Filters
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 gap-y-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col">
              <Skeleton className="w-full aspect-[3/4.2] mb-4" />
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredAndSortedManhwas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-border/50 bg-surface-elevated/30">
          <h2 className="font-sans text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">YOUR VAULT IS EMPTY</h2>
          <p className="text-sm font-serif text-foreground/70 max-w-sm mb-6 leading-relaxed">
            Your collection starts here.<br/>
            Add your first title and start tracking your reading journey.
          </p>
          <button 
            onClick={() => navigate('/manhwa/new')} 
            className="text-xs font-sans uppercase tracking-widest text-accent font-semibold hover:text-accent/80 transition-colors flex items-center gap-2"
          >
            <Plus size={14} /> Add Title
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 gap-y-10">
          {filteredAndSortedManhwas.map(m => {
            return (
              <div 
                key={m.id} 
                className="group flex flex-col cursor-pointer relative" 
                onClick={() => navigate(`/manhwa/${m.id}`)}
              >
                <div className={`w-full aspect-[3/4.2] mb-4 bg-surface-elevated library-cover overflow-hidden ${getCoverColorClass(m.title)} border border-border`}>
                  {m.cover_url ? (
                    <CoverImage src={m.cover_url} alt={m.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-serif text-2xl text-muted-foreground">{m.title.substring(0,2).toUpperCase()}</span>
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
                
                <h2 className="font-serif text-sm line-clamp-1 group-hover:text-accent transition-colors">{m.title}</h2>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground">
                    Ch. {m.current_chapter} {m.status !== 'Reading' && `• ${m.status}`}
                  </span>
                </div>
                
                {m.is_favorite && (
                  <span className="absolute top-2 right-2 text-accent">
                    <Heart size={14} className="fill-current drop-shadow-md" />
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Mobile Filter Sheet */}
      {isFilterSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsFilterSheetOpen(false)} />
          <div className="relative bg-surface w-full rounded-t-sm border-t border-border p-6 pb-safe">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl">Filters</h2>
              <button className="text-muted-foreground hover:text-foreground" onClick={() => setIsFilterSheetOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="editorial-subheading block mb-3">Status</label>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Reading', 'Completed', 'On Hold', 'Dropped', 'Plan to Read'].map(status => (
                    <button 
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-widest border transition-colors ${statusFilter === status ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface-elevated border-transparent text-muted-foreground'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="editorial-subheading block mb-3">Sort By</label>
                <select 
                  className="w-full bg-surface-elevated border border-border rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="recently_updated">Recently Updated</option>
                  <option value="az">Alphabetical (A-Z)</option>
                  <option value="za">Alphabetical (Z-A)</option>
                  <option value="chapter_highest">Highest Chapter</option>
                </select>
              </div>

              <button 
                className={`w-full py-3 text-sm font-semibold uppercase tracking-widest flex items-center justify-center gap-2 border transition-colors ${favoritesOnly ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-surface-elevated border-transparent text-muted-foreground'}`}
                onClick={() => setFavoritesOnly(!favoritesOnly)}
              >
                <Heart size={16} className={favoritesOnly ? 'fill-current' : ''} /> 
                Favorites Only
              </button>
            </div>
            
            <button className="w-full mt-8 py-3 bg-accent text-background font-medium" onClick={() => setIsFilterSheetOpen(false)}>
              Show {filteredAndSortedManhwas.length} Titles
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


