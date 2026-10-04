import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

export function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="font-serif text-8xl md:text-9xl text-accent mb-2">404</h1>
          <h2 className="editorial-heading text-3xl md:text-4xl mb-6">Page Not Found.</h2>
          <p className="font-serif text-muted-foreground text-lg mb-10">
            The page you are looking for has been moved, deleted, or never existed in this library.
          </p>
        </div>
        
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 px-8 py-4 bg-surface-elevated border border-border hover:border-accent hover:text-accent transition-all duration-300 rounded-sm font-sans text-xs uppercase tracking-widest font-semibold"
        >
          <ArrowLeft size={16} /> Return to Library
        </Link>
      </div>
    </div>
  )
}
