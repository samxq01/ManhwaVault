import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MoreVertical } from "lucide-react"

const MOCK_LIBRARY = [
  { id: 1, title: "Solo Leveling", chapter: 155, maxChapter: 179, status: "Completed", isFav: true },
  { id: 2, title: "Omniscient Reader's Viewpoint", chapter: 88, maxChapter: 200, status: "Reading", isFav: true },
  { id: 3, title: "The Beginning After The End", chapter: 175, maxChapter: null, status: "Reading", isFav: false },
  { id: 4, title: "Tower of God", chapter: 550, maxChapter: null, status: "Reading", isFav: true },
  { id: 5, title: "The Legend of the Northern Blade", chapter: 130, maxChapter: null, status: "Reading", isFav: false },
  { id: 6, title: "Return of the Mount Hua Sect", chapter: 72, maxChapter: null, status: "Reading", isFav: true },
]

export function Library() {
  return (
    <div className="p-6 md:p-10 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Library</h2>
          <p className="text-muted-foreground mt-2">Manage your collection.</p>
        </div>
        <Button>Add Title</Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {MOCK_LIBRARY.map((item) => (
          <Card key={item.id} className="overflow-hidden flex flex-col group">
            <div className="aspect-[2/3] bg-muted relative">
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 bg-background/50 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`absolute top-2 left-2 h-8 w-8 bg-background/50 backdrop-blur transition-opacity ${item.isFav ? 'opacity-100 text-red-500' : 'opacity-0 group-hover:opacity-100'}`}
              >
                <Heart className={`h-4 w-4 ${item.isFav ? 'fill-current' : ''}`} />
              </Button>
            </div>
            <CardContent className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold line-clamp-2 text-sm md:text-base mb-1" title={item.title}>
                  {item.title}
                </h3>
                <span className="inline-block px-2 py-0.5 rounded-full bg-secondary text-[10px] md:text-xs font-medium text-secondary-foreground mb-2">
                  {item.status}
                </span>
              </div>
              <div className="mt-auto pt-2 border-t flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Ch. {item.chapter}</span>
                {item.maxChapter && (
                  <span className="text-xs text-muted-foreground">{Math.round((item.chapter / item.maxChapter) * 100)}%</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
