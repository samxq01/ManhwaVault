import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Plus, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { manhwaService } from "@/services/manhwaService"
import { ChapterControls } from "@/components/ChapterControls"
import type { Manhwa } from "@/types"

export function Library() {
  const { user } = useAuth()
  const [manhwas, setManhwas] = useState<Manhwa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchManhwas = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)
      const data = await manhwaService.getManhwa(user.id)
      setManhwas(data)
    } catch (err: any) {
      setError(err.message || "Failed to load library")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchManhwas()
  }, [user])

  const toggleFavorite = async (e: React.MouseEvent, manhwa: Manhwa) => {
    e.preventDefault() // prevent navigating to details
    e.stopPropagation()
    if (!user) return
    try {
      const updated = await manhwaService.updateManhwa(manhwa.id, user.id, {
        is_favorite: !manhwa.is_favorite
      })
      setManhwas(prev => prev.map(m => m.id === updated.id ? updated : m))
    } catch (err: any) {
      setError(err.message || "Failed to update favorite status")
    }
  }

  return (
    <div className="p-6 md:p-10 space-y-6 min-h-full">
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p>Loading your library...</p>
        </div>
      ) : manhwas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-xl border border-dashed">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Your library is empty</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            You haven't added any Manhwa to your collection yet.
          </p>
          <Button asChild>
            <Link to="/manhwa/new">Add Title</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {manhwas.map((item) => (
            <Link key={item.id} to={`/manhwa/${item.id}`} className="block group">
              <Card className="overflow-hidden flex flex-col h-full hover:border-primary/50 transition-colors">
                <div className="aspect-[2/3] bg-muted relative">
                  {item.cover_url ? (
                    <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-muted-foreground text-xs p-4 text-center">
                      No Cover
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => toggleFavorite(e, item)}
                    className={`absolute top-2 right-2 h-8 w-8 bg-background/60 backdrop-blur transition-opacity ${item.is_favorite ? 'opacity-100 text-red-500' : 'opacity-0 group-hover:opacity-100 text-foreground hover:text-red-500'}`}
                  >
                    <Heart className={`h-4 w-4 ${item.is_favorite ? 'fill-current' : ''}`} />
                  </Button>
                </div>
                <CardContent className="p-4 flex-1 flex flex-col justify-between bg-card z-10">
                  <div>
                    <h3 className="font-semibold line-clamp-2 text-sm md:text-base mb-1" title={item.title}>
                      {item.title}
                    </h3>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-secondary text-[10px] md:text-xs font-medium text-secondary-foreground mb-2">
                      {item.status}
                    </span>
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
  )
}
