import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { LayoutDashboard, Library, Zap, History, BarChart2, Settings, Book, Flame, MoreHorizontal, ChevronRight, Search, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { PwaPrompt } from "@/components/PwaPrompt"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { useEffect, useState } from "react"

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
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
  
  // Extract initials and name for avatar
  const userName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || "User"
  const userEmail = user?.email || ""
  const initials = userName.substring(0, 2).toUpperCase()

  // Handle keyboard shortcut for Quick Update
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
    <div className="app-shell">
      <div className="ambient-orb ambient-one"></div>
      <div className="ambient-orb ambient-two"></div>
      
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-mark"><Book size={19} /></span>
          <span>Manhwa<span>Vault</span></span>
        </div>
        
        <nav className="side-nav" aria-label="Primary navigation">
          <span className="nav-label">Workspace</span>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.id === "quick" && <kbd>Q</kbd>}
            </NavLink>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <div className="streak">
            <span className="streak-icon"><Flame size={16} /></span>
            <div>
              <strong>{isOnline ? 'Online' : 'Offline'}</strong>
              <span>{isOnline ? 'Network connected' : 'Network disconnected'}</span>
            </div>
          </div>
          
          <div className="profile-mini cursor-pointer relative" onClick={() => setShowLogout(!showLogout)}>
            <span className="avatar">{initials}</span>
            <div>
              <strong>{userName}</strong>
              <span>{userEmail}</span>
            </div>
            <MoreHorizontal size={16} />
            
            {showLogout && (
              <div className="absolute bottom-full mb-2 right-0 bg-surface border border-border rounded-md shadow-lg overflow-hidden z-50 min-w-[120px]">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleLogout(); }} 
                  className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-surface-3 flex items-center gap-2"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main>
        {/* Topbar */}
        <header className="topbar">
          <div className="mobile-logo">
            <div className="logo px-0">
              <span className="logo-mark"><Book size={19} /></span>
            </div>
          </div>
          
          <span className="breadcrumb">
            Vault <ChevronRight size={13} /> <strong>{currentRoute}</strong>
          </span>
          
          <div className="top-actions">
            <label className="top-search hidden md:flex">
              <Search size={16} />
              <input aria-label="Search everything" placeholder="Search anything..." />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button" aria-label="Notifications" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
            <span className="avatar mobile-avatar">{initials}</span>
          </div>
        </header>

        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        {NAV_ITEMS.filter(n => ['dashboard', 'library', 'quick', 'statistics', 'settings'].includes(n.id)).map(n => (
          <NavLink
            key={n.path}
            to={n.path}
            className={({ isActive }) => `${isActive ? "active" : ""} ${n.id === "quick" ? "quick-nav" : ""}`}
          >
            <span><n.icon size={n.id === 'quick' ? 20 : 18} /></span>
            <small>{n.id === 'statistics' ? 'Stats' : n.label}</small>
          </NavLink>
        ))}
      </nav>
      
      <PwaPrompt />
    </div>
  )
}
