import { useState, useEffect } from 'react'
import { Download, Share, PlusSquare, X } from 'lucide-react'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                           (window.navigator as any).standalone || 
                           document.referrer.includes('android-app://')
    
    setIsStandalone(isStandaloneMode)

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // Listen for beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // If it's iOS and not standalone, we might want to show the prompt
    if (isIosDevice && !isStandaloneMode) {
      // Don't show immediately on every load, maybe use localStorage in a real app,
      // but for now we'll show it.
      const hasDismissed = localStorage.getItem('manhwavault-install-dismissed')
      if (!hasDismissed) {
        setShowPrompt(true)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setShowPrompt(false)
      }
    }
  }

  const dismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('manhwavault-install-dismissed', 'true')
  }

  if (isStandalone || !showPrompt) return null

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 p-6 bg-surface-elevated border border-border shadow-xl flex flex-col gap-4 max-w-sm w-full animate-in slide-in-from-bottom-5">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <strong className="text-xs font-sans uppercase tracking-widest text-foreground flex items-center gap-2">
            <Download size={14} /> Install ManhwaVault
          </strong>
          <p className="text-sm font-serif text-muted-foreground mt-2">
            Install the application to your home screen for a better fullscreen experience.
          </p>
        </div>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
          <X size={16} />
        </button>
      </div>

      <div className="pt-2 border-t border-border mt-2">
        {isIOS ? (
          <div className="text-sm font-serif text-muted-foreground bg-surface p-4 border border-border flex flex-col gap-3">
            <p className="text-foreground">To install on iOS Safari:</p>
            <div className="flex items-center gap-2">
              <span>1. Tap</span> <Share size={16} className="text-accent" /> <span>Share</span>
            </div>
            <div className="flex items-center gap-2">
              <span>2. Tap</span> <PlusSquare size={16} className="text-accent" /> <span className="text-foreground font-medium">Add to Home Screen</span>
            </div>
          </div>
        ) : deferredPrompt ? (
          <button 
            onClick={handleInstall}
            className="w-full bg-accent text-background text-xs uppercase tracking-widest font-semibold py-3 transition-colors hover:bg-accent/90"
          >
            Install App
          </button>
        ) : null}
      </div>
    </div>
  )
}
