import { useRegisterSW } from 'virtual:pwa-register/react'

export function PwaPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 p-6 bg-surface-elevated border border-border shadow-xl flex flex-col gap-4 max-w-sm w-full animate-in slide-in-from-bottom-5">
      <div className="flex flex-col gap-1">
        <strong className="text-xs font-sans uppercase tracking-widest text-foreground">
          {offlineReady ? "Offline Ready" : "Update Available"}
        </strong>
        <p className="text-sm font-serif text-muted-foreground">
          {offlineReady
            ? "Your archive has been cached. You can now access ManhwaVault offline."
            : "A new version of the archive is available. Would you like to update?"}
        </p>
      </div>
      <div className="flex gap-3 justify-end mt-2 pt-4 border-t border-border">
        <button 
          onClick={close}
          className="text-xs uppercase tracking-widest font-semibold text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
        >
          {needRefresh ? "Not Now" : "Dismiss"}
        </button>
        {needRefresh && (
          <button 
            onClick={() => updateServiceWorker(true)}
            className="text-xs uppercase tracking-widest font-semibold text-accent hover:text-accent/80 transition-colors px-4 py-2"
          >
            Update Archive
          </button>
        )}
      </div>
    </div>
  )
}
