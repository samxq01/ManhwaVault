import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { Library, Zap, History, BarChart2, Settings, Book, Flame, MoreHorizontal, ChevronRight, Search, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { PwaPrompt } from "@/components/PwaPrompt"
import { InstallPrompt } from "@/components/InstallPrompt"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { useEffect, useState } from "react"

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: Book },
  { id: "library", label: "Library", path: "/library", icon: Library },
  { id: "quick", label: "Quick Update", path: "/quick-update", icon: Zap },
  { id: "history", label: "History", path: "/history", icon: History },
  { id: "statistics", label: "Statistics", path: "/statistics", icon: BarChart2 },
  { id: "settings", label: "Settings", path: "/settings", icon: Settings },
]

export function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isOnline = useNetworkStatus()
  const [showLogout, setShowLogout] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate("/login")
  }

  const currentRoute = NAV_ITEMS.find(n => n.path === location.pathname)?.label || "Dashboard"
  
  const userName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || "User"
  const userEmail = user?.email || ""
  const initials = userName.substring(0, 2).toUpperCase()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'q' && 
        !(e.target instanceof HTMLInputElement) && 
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        navigate('/quick-update')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-charcoal/50 backdrop-blur-md sticky top-0 h-screen py-8 px-6">
        <div className="flex items-center gap-3 mb-16">
          <Book className="text-accent" size={24} />
          <span className="font-serif text-xl tracking-tight font-medium">ManhwaVault</span>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
          <span className="editorial-subheading mb-4 ml-3">Menu</span>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-4 px-3 py-2.5 rounded-sm transition-all duration-300 text-sm font-medium ${
                  isActive 
                    ? "bg-surface text-accent border-l-2 border-accent shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-surface/50 border-l-2 border-transparent"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span>{item.label}</span>
                  {item.id === "quick" && (
                    <kbd className="ml-auto text-[10px] uppercase font-sans tracking-widest text-muted-foreground border border-border px-1.5 py-0.5 rounded-sm">Q</kbd>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        
        <div className="mt-auto pt-8 border-t border-border">
          <div className="flex items-center gap-3 mb-6 opacity-70">
            <Flame size={14} className={isOnline ? "text-accent" : "text-muted-foreground"} />
            <span className="text-xs text-muted-foreground">{isOnline ? 'Network Connected' : 'Offline Mode'}</span>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowLogout(!showLogout)}
              className="flex items-center gap-3 w-full p-2 -ml-2 rounded-sm hover:bg-surface/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-xs font-medium border border-border text-foreground">
                {initials}
              </div>
              <div className="flex flex-col items-start flex-1 overflow-hidden">
                <span className="text-sm font-medium truncate w-full text-left">{userName}</span>
                <span className="text-xs text-muted-foreground truncate w-full text-left">{userEmail}</span>
              </div>
              <MoreHorizontal size={14} className="text-muted-foreground" />
            </button>
            
            {showLogout && (
              <div className="absolute bottom-full mb-2 left-0 w-full bg-surface-elevated border border-border rounded-sm shadow-xl p-1 z-50">
                <button 
                  onClick={handleLogout} 
                  className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-surface flex items-center gap-2 rounded-sm"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-0">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-6 md:px-10">
          <div className="md:hidden flex items-center gap-2">
            <Book className="text-accent" size={20} />
          </div>
          
          <div className="hidden md:flex items-center gap-2 text-xs font-sans tracking-widest uppercase text-muted-foreground">
            <span>Vault</span>
            <ChevronRight size={10} />
            <span className="text-foreground">{currentRoute}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex relative items-center">
              <Search className="absolute left-3 text-muted-foreground" size={14} />
              <input 
                placeholder="Search library..." 
                className="bg-surface border border-border rounded-sm pl-9 pr-12 py-1.5 text-sm focus:outline-none focus:border-accent/50 w-64 transition-colors"
              />
              <kbd className="absolute right-2 text-[9px] uppercase tracking-widest text-muted-foreground">⌘K</kbd>
            </div>
            
            <button className="md:hidden w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-xs font-medium border border-border">
              {initials}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-charcoal/95 backdrop-blur-lg border-t border-border z-50 px-2 py-2 pb-safe flex justify-around items-center h-[72px]">
        {NAV_ITEMS.filter(n => ['dashboard', 'library', 'quick', 'history', 'settings'].includes(n.id)).map(n => {
          const isQuick = n.id === 'quick';
          return (
            <NavLink
              key={n.path}
              to={n.path}
              className={({ isActive }) => 
                `flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors ${
                  isQuick ? 'relative -top-5' : ''
                } ${
                  isActive ? "text-accent" : "text-muted-foreground"
                }`
              }
            >
              {isQuick ? (
                <div className="w-14 h-14 bg-background rounded-full p-1 border border-border shadow-lg">
                  <div className="w-full h-full bg-accent rounded-full flex items-center justify-center text-background">
                    <n.icon size={22} strokeWidth={2} />
                  </div>
                </div>
              ) : (
                <>
                  <n.icon size={20} strokeWidth={1.5} />
                  <span className="text-[9px] font-sans tracking-wider uppercase mt-1">{n.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      
      <PwaPrompt />
      <InstallPrompt />
    </div>
  )
}
