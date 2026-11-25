import { useSyncExternalStore } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const subscribeOnline = (onChange: () => void) => {
  addEventListener('online', onChange)
  addEventListener('offline', onChange)
  return () => {
    removeEventListener('online', onChange)
    removeEventListener('offline', onChange)
  }
}

/** Offline warning and "new version" prompt, in the page flow above the current screen. */
export function AppNotices() {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (online && !needRefresh) return null
  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-2 px-[18px] pt-3" role="status">
      {!online && <p className="notice">Nema mreže. Isječci se ne mogu pustiti dok se veza ne vrati.</p>}
      {needRefresh && (
        <div className="notice flex items-center gap-3">
          <span className="flex-1">Nova verzija je spremna. Osvježi kad završite partiju.</span>
          <button className="btn-secondary text-ink" onClick={() => updateServiceWorker(true)}>
            Osvježi
          </button>
          <button className="btn-icon border-0" aria-label="Zatvori obavijest" onClick={() => setNeedRefresh(false)}>
            ×
          </button>
        </div>
      )}
    </div>
  )
}
