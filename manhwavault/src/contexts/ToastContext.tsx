import React, { createContext, useContext, useState, useCallback } from "react"
import { Check } from "lucide-react"

type Toast = {
  id: string
  title: string
  message: string
}

type ToastContextType = {
  toast: (title: string, message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((title: string, message: string) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, title, message }])
    
    // Auto remove after 2.6s (matches CSS animation length)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2800)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-0 right-0 p-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto bg-surface-elevated border border-border shadow-xl min-w-[280px] p-4 flex gap-4 items-start animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="mt-0.5 text-accent shrink-0">
              <Check size={16} />
            </div>
            <div className="flex flex-col gap-1 pr-6">
              <strong className="text-xs font-sans uppercase tracking-widest text-foreground">{t.title}</strong>
              <p className="text-sm font-serif text-muted-foreground">{t.message}</p>
            </div>
            {/* Minimal progress bar effect */}
            <div className="absolute bottom-0 left-0 h-[2px] bg-accent/30 w-full animate-toast-progress" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within a ToastProvider")
  return context
}
