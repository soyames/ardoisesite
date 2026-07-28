import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

// Leaflet's default marker icon resolves its image paths relative to its
// own CSS file, which breaks once Vite bundles/hashes those assets -
// re-pointing them at the bundler-resolved URLs is the standard fix.
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const DEFAULT_CENTER = [9.3077, 2.3158] // Roughly the geographic center of the OHADA region (Benin)

function ClickToPlace({ onChange }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

/**
 * value: {lat, lng} | null
 * onChange: (nextValue) => void - omit for read-only display
 */
export default function LocationPickerMap({ value, onChange, height = 320 }) {
  const editable = typeof onChange === 'function'
  const center = useMemo(() => (value ? [value.lat, value.lng] : DEFAULT_CENTER), [value])
  const zoom = value ? 16 : 6

  return (
    <div className="overflow-hidden rounded-control ring-1 ring-inset ring-border" style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={editable}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            icon={defaultIcon}
            draggable={editable}
            eventHandlers={
              editable
                ? {
                    dragend: (e) => {
                      const { lat, lng } = e.target.getLatLng()
                      onChange({ lat, lng })
                    },
                  }
                : undefined
            }
          />
        )}
        {editable && <ClickToPlace onChange={onChange} />}
      </MapContainer>
    </div>
  )
}
