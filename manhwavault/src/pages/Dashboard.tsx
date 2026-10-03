import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, CheckCircle, List, PlayCircle } from "lucide-react"

export function Dashboard() {
  return (
    <div className="p-6 md:p-10 space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-2">Welcome back to ManhwaVault.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Titles</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Reading</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chapters Read</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,492</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">Continue Reading</h3>
          <div className="space-y-4">
            {/* Mock Continue Reading Items */}
            {[1, 2, 3].map((i) => (
              <Card key={i} className="flex overflow-hidden">
                <div className="w-24 bg-muted animate-pulse" />
                <div className="p-4 flex-1">
                  <h4 className="font-semibold line-clamp-1">Solo Leveling {i}</h4>
                  <p className="text-sm text-muted-foreground mt-1">Ch. {150 + i} / 179</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-semibold">Recently Updated</h3>
          <div className="space-y-4">
            {/* Mock Recently Updated Items */}
            {[1, 2, 3].map((i) => (
              <Card key={i} className="flex overflow-hidden">
                <div className="w-24 bg-muted animate-pulse" />
                <div className="p-4 flex-1">
                  <h4 className="font-semibold line-clamp-1">Omniscient Reader's Viewpoint {i}</h4>
                  <p className="text-sm text-muted-foreground mt-1">New Chapter {100 + i}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
