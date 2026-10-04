import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Eye, EyeOff, Book, Loader2 } from "lucide-react"

export function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const cleanEmail = email.trim()
    const { error: signInError } = await signIn(cleanEmail, password)

    if (signInError) {
      if (signInError.message.includes("Invalid login credentials")) {
        setError("Invalid email or password. If you don't have an account, please register first.")
      } else {
        setError(signInError.message)
      }
      setLoading(false)
    } else {
      navigate("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-md bg-surface border border-border p-8 md:p-12 relative overflow-hidden">
        {/* Subtle decorative accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-accent/50" />
        
        <div className="flex items-center gap-3 mb-10 justify-center">
          <Book className="text-accent" size={28} />
          <span className="font-serif text-3xl tracking-tight font-medium">ManhwaVault</span>
        </div>
        
        <div className="mb-10 text-center">
          <h1 className="editorial-heading text-2xl mb-2">Welcome Back.</h1>
          <p className="text-sm text-muted-foreground font-sans tracking-wide">Enter your credentials to access your archive.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive text-sm border border-destructive/20 text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Email</label>
            <input
              id="email"
              type="email"
              placeholder="reader@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface-elevated border border-border rounded-none px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Password</label>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-surface-elevated border border-border rounded-none px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors text-foreground placeholder:text-muted-foreground/50"
              />
              <button
                type="button"
                className="absolute right-0 top-0 h-full px-4 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-accent text-background hover:bg-accent/90 transition-colors py-3 font-semibold text-xs uppercase tracking-widest mt-4 flex justify-center items-center h-12"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Access Archive"}
          </button>
          
          <div className="text-center pt-6 border-t border-border mt-8">
            <p className="text-xs text-muted-foreground tracking-wide">
              Don't have a catalog yet?{" "}
              <Link to="/register" className="text-accent hover:text-accent/80 transition-colors uppercase tracking-widest font-semibold ml-1">
                Register
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
