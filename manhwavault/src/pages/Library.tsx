import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Heart, Plus, Loader2, AlertCircle, Search, Filter, X, ArrowUpDown } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { manhwaService } from "@/services/manhwaService"
import { tagService } from "@/services/tagService"
import { ChapterControls } from "@/components/ChapterControls"
import type { Manhwa, Tag } from "@/types"

export function Library() {
  const { user } = useAuth()
  const [manhwas, setManhwas] = useState<(Manhwa & { tags?: Tag[] })[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortOption, setSortOption] = useState("recently_updated")
  
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

  const toggleFavorite = async (e: React.MouseEvent, manhwa: Manhwa) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return
    try {
      const updated = await manhwaService.updateManhwa(manhwa.id, user.id, {
        is_favorite: !manhwa.is_favorite
      })
      setManhwas(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m))
    } catch (err: any) {
      setError(err.message || "Failed to update favorite status")
    }
  }

  const toggleTagFilter = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("All")
    setTypeFilter("All")
    setFavoritesOnly(false)
    setSelectedTags([])
  }

  // Memoized Filtering & Sorting (Instant Client-Side)
  const filteredAndSortedManhwas = useMemo(() => {
    let result = [...manhwas]
    
    // 1. Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(m => 
        m.title.toLowerCase().includes(q) || 
        (m.alternative_title && m.alternative_title.toLowerCase().includes(q))
      )
    }
    
    // 2. Status
    if (statusFilter !== "All") {
      result = result.filter(m => m.status === statusFilter)
    }
    
    // 3. Type
    if (typeFilter !== "All") {
      result = result.filter(m => {
        if (typeFilter === "Other") {
          return !["Manhwa", "Manhua", "Manga", "Webtoon"].includes(m.type || "")
        }
        return m.type === typeFilter
      })
    }
    
    // 4. Favorites
    if (favoritesOnly) {
      result = result.filter(m => m.is_favorite)
    }

    // 5. Tags
    if (selectedTags.length > 0) {
      result = result.filter(m => {
        const mTagIds = m.tags?.map(t => t.id) || []
        // must have all selected tags
        return selectedTags.every(tagId => mTagIds.includes(tagId))
      })
    }

    // 6. Sorting
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
  }, [manhwas, searchQuery, statusFilter, typeFilter, favoritesOnly, selectedTags, sortOption])

  const FilterPanel = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">Clear all</Button>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Status</label>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="Reading">Reading</option>
          <option value="Completed">Completed</option>
          <option value="On Hold">On Hold</option>
          <option value="Dropped">Dropped</option>
          <option value="Plan to Read">Plan to Read</option>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Type</label>
        <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="All">All Types</option>
          <option value="Manhwa">Manhwa</option>
          <option value="Manga">Manga</option>
          <option value="Manhua">Manhua</option>
          <option value="Webtoon">Webtoon</option>
          <option value="Other">Other</option>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Sort By</label>
        <div className="flex gap-2">
          <ArrowUpDown className="h-5 w-5 text-muted-foreground shrink-0 mt-2.5" />
          <Select value={sortOption} onChange={e => setSortOption(e.target.value)}>
            <option value="recently_updated">Recently Updated</option>
            <option value="az">Alphabetical (A-Z)</option>
            <option value="za">Alphabetical (Z-A)</option>
            <option value="chapter_highest">Chapter (Highest)</option>
            <option value="chapter_lowest">Chapter (Lowest)</option>
            <option value="rating_highest">Rating (Highest)</option>
          </Select>
        </div>
      </div>
      
      <div className="pt-2">
        <Button 
          variant={favoritesOnly ? "default" : "outline"}
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={`w-full justify-start ${favoritesOnly ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600 border-red-500/50' : ''}`}
        >
          <Heart className={`mr-2 h-4 w-4 ${favoritesOnly ? 'fill-current' : ''}`} />
          ⭐ Favorites
        </Button>
      </div>

      {allTags.length > 0 && (
        <div className="space-y-2 pt-2">
          <label className="text-sm font-medium text-muted-foreground">Tags</label>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTagFilter(tag.id)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  selectedTags.includes(tag.id) 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-background hover:bg-accent border-input"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <div className="p-4 md:p-10 space-y-4 md:space-y-6 flex-1 max-w-[1600px] mx-auto w-full">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Library</h2>
            <p className="text-muted-foreground mt-2">Manage your collection.</p>
          </div>
          <Button asChild>
            <Link to="/manhwa/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Title
            </Link>
          </Button>
        </header>

        {error && (
          <div className="p-4 bg-destructive/15 text-destructive rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-3" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 border rounded-xl p-4 bg-card h-fit sticky top-6">
            <FilterPanel />
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 space-y-4 min-w-0">
            {/* Search and Mobile Filter Toggle */}
            <div className="flex gap-2 relative z-10">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search nano, solo..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 w-full text-base bg-card shadow-sm"
                />
                {searchQuery && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button 
                variant="outline" 
                className="h-12 w-12 lg:hidden bg-card shrink-0" 
                onClick={() => setIsFilterSheetOpen(true)}
              >
                <Filter className="h-5 w-5" />
              </Button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin mb-4" />
                <p>Loading your library...</p>
              </div>
            ) : filteredAndSortedManhwas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-xl border border-dashed shadow-sm">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No manhwa found.</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  {manhwas.length === 0 
                    ? "You haven't added any Manhwa to your collection yet."
                    : "Try another search or clear your filters."}
                </p>
                {manhwas.length > 0 ? (
                  <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                ) : (
                  <Button asChild><Link to="/manhwa/new">Add Title</Link></Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5 pb-20 md:pb-0">
                {filteredAndSortedManhwas.map((item) => (
                  <Link key={item.id} to={`/manhwa/${item.id}`} className="block group">
                    <Card className="overflow-hidden flex flex-col h-full hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
                      <div className="aspect-[2/3] bg-muted relative">
                        {item.cover_url ? (
                          <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-muted-foreground text-xs p-4 text-center">
                            No Cover
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {item.rating && (
                          <div className="absolute top-2 right-2 bg-background/80 backdrop-blur text-xs font-bold px-1.5 py-0.5 rounded flex items-center shadow-sm">
                            ⭐ {item.rating}
                          </div>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => toggleFavorite(e, item)}
                          className={`absolute top-2 left-2 h-8 w-8 bg-background/60 backdrop-blur transition-opacity ${item.is_favorite ? 'opacity-100 text-red-500' : 'opacity-0 group-hover:opacity-100 text-foreground hover:text-red-500'}`}
                        >
                          <Heart className={`h-4 w-4 ${item.is_favorite ? 'fill-current' : ''}`} />
                        </Button>
                      </div>
                      <CardContent className="p-3 md:p-4 flex-1 flex flex-col justify-between bg-card z-10">
                        <div>
                          <h3 className="font-semibold line-clamp-2 text-sm md:text-base mb-1.5" title={item.title}>
                            {item.title}
                          </h3>
                          <div className="flex flex-wrap gap-1 mb-2">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-secondary text-[9px] md:text-[10px] font-medium text-secondary-foreground">
                              {item.status}
                            </span>
                            {item.tags?.slice(0, 2).map(t => (
                              <span key={t.id} className="inline-block px-1.5 py-0.5 rounded border border-border text-[9px] md:text-[10px] text-muted-foreground truncate max-w-[60px]">
                                {t.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-auto pt-2 border-t flex flex-col gap-2">
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Progress</span>
                            {item.total_chapters && (
                              <span>
                                {Math.round((item.current_chapter / item.total_chapters) * 100)}%
                              </span>
                            )}
                          </div>
                          <ChapterControls 
                            manhwa={item} 
                            userId={user!.id} 
                            compact={true}
                            onError={setError} 
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet Overlay */}
      {isFilterSheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsFilterSheetOpen(false)}
          />
          <div className="relative bg-card w-full rounded-t-2xl border-t p-6 pb-safe animate-in slide-in-from-bottom-full duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Filters & Sort</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsFilterSheetOpen(false)} className="-mr-2">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto pb-4 pr-1">
              <FilterPanel />
            </div>
            
            <div className="pt-4 border-t mt-2">
              <Button className="w-full" size="lg" onClick={() => setIsFilterSheetOpen(false)}>
                Show {filteredAndSortedManhwas.length} Titles
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
