import { useState, useEffect } from 'react'

function detectIOS() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua)
  // iPadOS 13+ reports as Mac -- distinguish a real Mac from an iPad
  // pretending to be one by checking for touch support.
  const isIPadOS = ua.includes('Macintosh') && navigator.maxTouchPoints > 1
  return isIOSDevice || isIPadOS
}

function detectStandalone() {
  if (typeof window === 'undefined') return false
  // Safari/iOS exposes navigator.standalone; every other engine uses
  // the display-mode media query. Neither alone covers both.
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
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
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isIOS] = useState(detectIOS)
  const [isStandalone, setIsStandalone] = useState(detectStandalone)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e)
      // Update UI notify the user they can install the PWA
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstallable(false)
      setDeferredPrompt(null)
      setIsStandalone(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return
    }
    // Show the install prompt
    deferredPrompt.prompt()
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to the install prompt: ${outcome}`)
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null)
    setIsInstallable(false)
  }

  // True when there's SOME way to offer installation right now: either
  // the native Chromium prompt is ready, or we're on iOS (which always
  // needs manual instructions instead, never a native prompt) -- but
  // never once already installed.
  const canOfferInstall = !isStandalone && (isInstallable || isIOS)

  return { isInstallable, promptInstall, isIOS, isStandalone, canOfferInstall }
}
