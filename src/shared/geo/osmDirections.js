/**
 * Resolves the browser's current position, then opens OpenStreetMap's own
 * directions page routed from there to the given destination. Falls back
 * to just centering the destination (letting OSM's own UI ask for a
 * starting point) if geolocation is denied, unavailable, or times out.
 *
 * The tab is opened synchronously, before geolocation resolves, and only
 * navigated afterward - geolocation's callback fires asynchronously, and
 * calling window.open() from inside it (rather than directly in the
 * click handler) gets treated as an unsolicited popup and silently
 * blocked in Safari/Firefox (Chrome is more lenient but not guaranteed
 * either). Opening the blank tab up front keeps it tied to the original
 * user gesture.
 */
export function openOsmDirections(destination) {
  const toParam = `${destination.lat},${destination.lng}`
  const tab = window.open('', '_blank', 'noopener,noreferrer')

  const navigate = (from) => {
    const url = from
      ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${from.lat},${from.lng};${toParam}`
      : `https://www.openstreetmap.org/?mlat=${destination.lat}&mlon=${destination.lng}#map=17/${destination.lat}/${destination.lng}`
    if (tab) {
      tab.location.href = url
    } else {
      // Popup was blocked even for the synchronous open - fall back to
      // navigating the current tab rather than doing nothing.
      window.location.href = url
    }
  }

  if (!navigator.geolocation) {
    navigate(null)
    return
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => navigate({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    () => navigate(null),
    { timeout: 8000 }
  )
}
