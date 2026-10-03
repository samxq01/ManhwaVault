import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"

const INITIAL_TITLES = [
  { id: 1, title: "Solo Leveling", chapter: 155 },
  { id: 2, title: "Omniscient Reader's Viewpoint", chapter: 88 },
  { id: 3, title: "The Beginning After The End", chapter: 175 },
  { id: 4, title: "Tower of God", chapter: 550 },
  { id: 5, title: "The Legend of the Northern Blade", chapter: 130 },
]

export function QuickUpdate() {
  const [titles, setTitles] = useState(INITIAL_TITLES)

  const updateChapter = (id: number, delta: number) => {
    setTitles(current =>
      current.map(title =>
        title.id === id
          ? { ...title, chapter: Math.max(0, title.chapter + delta) }
          : title
      )
    )
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Quick Update</h2>
        <p className="text-muted-foreground mt-2">Swiftly update your reading progress.</p>
      </header>

      <div className="space-y-4">
        {titles.map((title) => (
          <Card key={title.id} className="flex items-center p-3 md:p-4 gap-4 transition-colors hover:bg-accent/50">
            <div className="w-16 h-24 md:w-20 md:h-28 bg-muted rounded-md flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg md:text-xl truncate mb-1">
                {title.title}
              </h3>
              <p className="text-sm text-muted-foreground font-medium">
                Chapter {title.chapter}
              </p>
            </div>

            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => updateChapter(title.id, -1)}
                className="h-10 w-10 md:h-12 md:w-12 rounded-full"
              >
                <Minus className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <div className="w-12 text-center font-bold text-lg md:text-2xl tabular-nums">
                {title.chapter}
              </div>
              <Button 
                variant="default" 
                size="icon"
                onClick={() => updateChapter(title.id, 1)}
                className="h-10 w-10 md:h-12 md:w-12 rounded-full"
              >
                <Plus className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
