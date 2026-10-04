import React, { createContext, useContext, useState, useCallback } from "react"
import { Check } from "lucide-react"

type ToastAction = {
  label: string
  onClick: () => void
}

type Toast = {
  id: string
  title: string
  message: string
  action?: ToastAction
}

type ToastContextType = {
  toast: (title: string, message: string, action?: ToastAction) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((title: string, message: string, action?: ToastAction) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, title, message, action }])
    
    // Extend timer slightly if there's an action, otherwise 2.8s
    const timeout = action ? 5000 : 2800;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, timeout)
  }, [])

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div className="fixed bottom-0 right-0 p-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto bg-surface-elevated border border-border shadow-xl min-w-[280px] p-4 flex gap-4 items-start animate-in slide-in-from-bottom-5 fade-in duration-300 relative overflow-hidden`}>
            <div className="mt-0.5 text-accent shrink-0">
              <Check size={16} />
            </div>
            <div className="flex flex-col gap-1 pr-6 flex-1">
              <strong className="text-xs font-sans uppercase tracking-widest text-foreground">{t.title}</strong>
              <p className="text-sm font-serif text-muted-foreground">{t.message}</p>
            </div>
            {t.action && (
              <button 
                onClick={() => {
                  t.action!.onClick();
                  removeToast(t.id);
                }}
                className="text-xs font-sans uppercase tracking-widest text-accent font-semibold hover:text-accent/80 transition-colors ml-4 mt-0.5"
              >
                {t.action.label}
              </button>
            )}
            {/* Minimal progress bar effect */}
            <div 
              className="absolute bottom-0 left-0 h-[2px] bg-accent/30 w-full animate-toast-progress" 
              style={{ animationDuration: t.action ? '5s' : '2.8s' }}
            />
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
