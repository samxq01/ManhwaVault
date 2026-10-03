import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { LayoutDashboard, Library, Clock, History, BarChart2, Settings, LogOut, Wifi, WifiOff } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { PwaPrompt } from "@/components/PwaPrompt"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"

const NAV_ITEMS = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Library", path: "/library", icon: Library },
  { name: "Quick Update", path: "/quick-update", icon: Clock },
  { name: "History", path: "/history", icon: History },
  { name: "Statistics", path: "/statistics", icon: BarChart2 },
  { name: "Settings", path: "/settings", icon: Settings },
]

function NetworkIndicator({ isOnline }: { isOnline: boolean }) {
  return (
    <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${isOnline ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
      {isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
      {isOnline ? 'Online' : 'Offline'}
    </div>
  )
}

export function AppLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const isOnline = useNetworkStatus()

  const handleLogout = async () => {
    await signOut()
    navigate("/login")
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
        <div className="p-6 flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-primary">ManhwaVault</h1>
          <div className="self-start">
            <NetworkIndicator isOnline={isOnline} />
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 rounded-lg px-4 py-3 transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 mt-auto">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-primary">ManhwaVault</h1>
            <NetworkIndicator isOnline={isOnline} />
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="h-5 w-5" />
          </Button>
        </header>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur z-50 pb-safe">
        <div className="flex items-center justify-around p-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-6 w-6 mb-1" />
              <span className="text-[10px] font-medium hidden sm:block">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      
      <PwaPrompt />
    </div>
  )
}
