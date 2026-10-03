import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from './ui/button'

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
    <div className="fixed bottom-20 right-4 md:bottom-4 md:right-4 z-50 p-4 bg-card border rounded-lg shadow-lg flex flex-col gap-3 max-w-sm w-full animate-in slide-in-from-bottom-5">
      <div className="text-sm">
        {offlineReady
          ? <p>App is ready to work offline!</p>
          : <p>New version available. Update ManhwaVault?</p>}
      </div>
      <div className="flex gap-2 justify-end">
        {needRefresh && (
          <Button size="sm" onClick={() => updateServiceWorker(true)}>
            Update
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={close}>
          Close
        </Button>
      </div>
    </div>
  )
}
