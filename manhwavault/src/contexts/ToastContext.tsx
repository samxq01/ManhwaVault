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
      <div className="fixed bottom-0 right-0 p-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="toast relative overflow-hidden">
            <span><Check size={16} className="text-[#042331]" /></span>
            <div>
              <strong>{t.title}</strong>
              <p>{t.message}</p>
            </div>
            <div className="toast-timer"></div>
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
