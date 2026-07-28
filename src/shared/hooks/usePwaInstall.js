import { useState, useSyncExternalStore } from 'react'
import { subscribe, getSnapshot, triggerInstall } from './pwaInstallStore.js'

function detectIOS() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua)
  // iPadOS 13+ reports as Mac -- distinguish a real Mac from an iPad
  // pretending to be one by checking for touch support.
  const isIPadOS = ua.includes('Macintosh') && navigator.maxTouchPoints > 1
  return isIOSDevice || isIPadOS
}

/**
 * `beforeinstallprompt` is a Chromium-only event -- it NEVER fires on
 * iOS Safari (found in /review-equivalent audit: the header's install
 * button was silently absent for every iOS visitor, not broken, just
 * conditioned on an event that can't happen there). isIOS lets callers
 * render manual "Share -> Add to Home Screen" instructions instead of
 * a native prompt button on platforms where no such button can exist.
 * isStandalone lets callers hide install UI entirely once already
 * installed, on any platform.
 *
 * The actual event listener lives in ./pwaInstallStore.js, shared by
 * every caller of this hook -- see that file for why (the event only
 * fires once per page load, so per-component listeners silently miss
 * it for every consumer except whichever one happened to mount first).
 */
export function usePwaInstall() {
  const [isIOS] = useState(detectIOS)
  const { hasPrompt, isStandalone } = useSyncExternalStore(subscribe, getSnapshot)

  const promptInstall = async () => {
    const outcome = await triggerInstall()
    console.log(`User response to the install prompt: ${outcome}`)
  }

  // True when there's SOME way to offer installation right now: either
  // the native Chromium prompt is ready, or we're on iOS (which always
  // needs manual instructions instead, never a native prompt) -- but
  // never once already installed.
  const canOfferInstall = !isStandalone && (hasPrompt || isIOS)

  return { isInstallable: hasPrompt, promptInstall, isIOS, isStandalone, canOfferInstall }
}
