import { useEffect, useRef, useState } from 'react'
import Button from '../ui/Button.jsx'

/**
 * Camera-based QR/barcode scanner - reads a student's idCardCode off
 * their printed ID card (see Student.idCardCode's own docstring). Uses
 * the browser-native BarcodeDetector API (no new dependency) rather than
 * a JS decoding library - covers the Chromium-based Android devices this
 * product's schools actually use for cantine/surveillance tablets.
 *
 * Never scanner-only, per the CEO plan's error/rescue registry: camera
 * permission denied, no camera present, or BarcodeDetector unsupported
 * (Safari/Firefox) all fall back to letting the caller's own manual-entry
 * field keep working - this component simply doesn't render its "Scanner"
 * button in those cases rather than showing a broken control.
 */
export default function QrScanner({ onScan }) {
  const [active, setActive] = useState(false)
  const [error, setError] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)

  const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window

  useEffect(() => {
    if (!active) return

    let cancelled = false
    const detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] })

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }

        const tick = async () => {
          if (cancelled || !videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes.length > 0) {
              onScan(codes[0].rawValue)
              stop()
              return
            }
          } catch {
            // a single failed detection frame is not an error - keep scanning
          }
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      })
      .catch(() => {
        if (!cancelled) setError("Impossible d'acceder a la camera - utilisez la saisie manuelle ci-dessous.")
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setActive(false)
  }

  if (!supported) return null

  return (
    <div className="space-y-2">
      {!active && (
        <Button type="button" variant="secondary" size="sm" onClick={() => { setError(null); setActive(true) }}>
          Scanner une carte
        </Button>
      )}
      {active && (
        <div className="space-y-2">
          <video ref={videoRef} className="w-full max-w-xs rounded-control bg-black" muted playsInline />
          <Button type="button" variant="secondary" size="sm" onClick={stop}>Annuler</Button>
        </div>
      )}
      {error && <p className="text-sm text-danger-600">{error}</p>}
    </div>
  )
}
