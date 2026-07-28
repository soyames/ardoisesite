// `beforeinstallprompt` fires once per page load and is gone forever if
// missed -- it does NOT re-fire for every component that later asks for it.
// Before this store, `usePwaInstall()` attached its own listener inside a
// per-component useEffect, so whichever component happened to be mounted
// first "used up" the event and every other install button on the site
// (public landing page vs. authenticated app shell, for example) never saw
// it and fell back to "your browser doesn't support installation" even in
// a fully capable browser. This module attaches ONE listener at import
// time (evaluated before React mounts anything) and shares the result with
// every consumer via useSyncExternalStore.

function detectStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

let deferredPrompt = null
let snapshot = { hasPrompt: false, isStandalone: detectStandalone() }
const listeners = new Set()

function setSnapshot(patch) {
  snapshot = { ...snapshot, ...patch }
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    setSnapshot({ hasPrompt: true })
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    setSnapshot({ hasPrompt: false, isStandalone: true })
  })
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot() {
  return snapshot
}

export async function triggerInstall() {
  if (!deferredPrompt) return null
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  setSnapshot({ hasPrompt: false })
  return outcome
}
