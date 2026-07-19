import { useEffect, useState, useMemo } from 'react'

function GenericCountryMap({
  viewBox,
  departmentPaths,
  communePaths,
  communeDepartmentMap,
  departmentBounds,
  schoolCounts = {},
  selectedDepartment = null,
  onSelectDepartment,
  onSelectCommune
}) {
  const [drilledInto, setDrilledInto] = useState(null)
  const [hovered, setHovered] = useState(null)

  const DEPARTMENT_ORDER = useMemo(() => Object.keys(departmentPaths), [departmentPaths])

  const departmentCounts = useMemo(() => {
    const counts = {}
    Object.entries(schoolCounts).forEach(([commune, n]) => {
      const dept = communeDepartmentMap[commune]
      if (dept) counts[dept] = (counts[dept] || 0) + n
    })
    return counts
  }, [schoolCounts, communeDepartmentMap])

  const communesInView = useMemo(() => {
    if (!drilledInto) return []
    return Object.keys(communePaths).filter((c) => communeDepartmentMap[c] === drilledInto)
  }, [drilledInto, communePaths, communeDepartmentMap])

  const isCommuneView = Boolean(drilledInto)
  const activeViewBox = isCommuneView && departmentBounds[drilledInto]
    ? departmentBounds[drilledInto].join(' ')
    : viewBox

  const activeName = hovered || (isCommuneView ? null : selectedDepartment)
  const maxDeptCount = Math.max(1, ...Object.values(departmentCounts))
  const maxCommuneCount = Math.max(1, ...communesInView.map((c) => schoolCounts[c] || 0))

  const detail = useMemo(() => {
    if (isCommuneView) {
      const name = hovered
      if (!name) return null
      const count = schoolCounts[name] || 0
      const deptTotal = departmentCounts[drilledInto] || 0
      const share = deptTotal > 0 ? Math.round((count / deptTotal) * 100) : 0
      return { label: name, sublabel: drilledInto, count, share, shareLabel: 'Part du département' }
    }
    const name = activeName
    if (!name) return null
    const total = Object.values(departmentCounts).reduce((s, n) => s + n, 0)
    const count = departmentCounts[name] || 0
    const share = total > 0 ? Math.round((count / total) * 100) : 0
    const rank = [...DEPARTMENT_ORDER].sort((a, b) => (departmentCounts[b] || 0) - (departmentCounts[a] || 0)).indexOf(name) + 1
    return { label: name, sublabel: `Région (${rank}/${DEPARTMENT_ORDER.length})`, count, share, shareLabel: 'Part du réseau' }
  }, [isCommuneView, hovered, activeName, drilledInto, schoolCounts, departmentCounts, DEPARTMENT_ORDER])

  return (
    <div className="flex flex-col gap-4">
      <div className="shrink-0 relative">
        {isCommuneView && (
          <button
            onClick={() => { setDrilledInto(null); setHovered(null) }}
            className="mb-2 text-xs font-semibold text-primary-600 hover:text-primary-500 absolute -top-6 left-0 z-10"
          >
            &larr; Retour national
          </button>
        )}
        <svg viewBox={activeViewBox} className="w-full max-w-[220px] mx-auto transition-all duration-500 ease-in-out" role="img">
          {!isCommuneView && Object.keys(departmentPaths).map((name) => {
            const count = departmentCounts[name] || 0
            const intensity = count / maxDeptCount
            const isSelected = selectedDepartment === name
            return (
              <path
                key={name}
                d={departmentPaths[name]}
                onClick={() => onSelectDepartment?.(selectedDepartment === name ? null : name)}
                onDoubleClick={() => setDrilledInto(name)}
                onMouseEnter={() => setHovered(name)}
                onMouseLeave={() => setHovered((h) => (h === name ? null : h))}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? 'fill-accent-500 stroke-accent-600'
                    : count > 0
                      ? 'fill-primary-700 stroke-primary-900 hover:fill-primary-600'
                      : 'fill-surface-raised stroke-border hover:fill-surface'
                }`}
                style={count > 0 && !isSelected ? { fillOpacity: 0.4 + intensity * 0.6 } : undefined}
                strokeWidth={isSelected ? 1.5 : 0.75}
              />
            )
          })}
          {isCommuneView && communesInView.map((name) => {
            const count = schoolCounts[name] || 0
            const intensity = count / maxCommuneCount
            const isHovered = hovered === name
            return (
              <path
                key={name}
                d={communePaths[name]}
                onClick={() => { setHovered((h) => (h === name ? null : name)); onSelectCommune?.(name) }}
                onMouseEnter={() => setHovered(name)}
                onMouseLeave={() => setHovered((h) => (h === name ? null : h))}
                className={`cursor-pointer transition-colors ${
                  isHovered
                    ? 'fill-accent-500 stroke-accent-600'
                    : count > 0
                      ? 'fill-primary-700 stroke-primary-900 hover:fill-primary-600'
                      : 'fill-surface-raised stroke-border hover:fill-surface'
                }`}
                style={count > 0 && !isHovered ? { fillOpacity: 0.4 + intensity * 0.6 } : undefined}
                strokeWidth={isHovered ? 1 : 0.5}
              />
            )
          })}
        </svg>
        {!isCommuneView && (
          <button
            onClick={() => setDrilledInto(selectedDepartment || DEPARTMENT_ORDER[0])}
            className="mt-2 text-xs font-semibold text-primary-600 hover:text-primary-500 block text-center mx-auto"
          >
            Zoomer sur les communes &rarr;
          </button>
        )}
      </div>

      <div className="w-full rounded-card border border-border bg-surface-raised p-4">
        {detail ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{detail.sublabel}</p>
            <h3 className="mt-1 text-lg font-bold text-ink">{detail.label}</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between border-t border-border pt-2">
                <dt className="text-ink-muted">Écoles partenaires</dt>
                <dd className="font-semibold text-ink">{detail.count}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <dt className="text-ink-muted">{detail.shareLabel}</dt>
                <dd className="font-semibold text-ink">{detail.share}%</dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="text-sm text-ink-muted">
            {isCommuneView
              ? `Survolez une commune pour voir le détail.`
              : 'Survolez ou choisissez une région. Double-cliquez pour zoomer.'}
          </p>
        )}
      </div>
    </div>
  )
}

export default function CountryMapWrapper({ countryCode = 'BEN', ...props }) {
  const [geoData, setGeoData] = useState(null)
  
  useEffect(() => {
    let mounted = true
    async function load() {
      const iso = countryCode.toLowerCase()
      const isBenin = iso === 'ben'
      const filePrefix = isBenin ? 'benin' : iso
      const exportPrefix = isBenin ? 'BENIN' : countryCode.toUpperCase()

      try {
        const [base, communes] = await Promise.all([
          import(`../constants/${filePrefix}Geo.js`),
          import(`../constants/${filePrefix}GeoCommunes.js`)
        ])
        
        if (mounted) {
          setGeoData({
            viewBox: base[`${exportPrefix}_VIEWBOX`],
            departmentPaths: base[`${exportPrefix}_DEPARTMENT_PATHS`],
            communePaths: communes[`${exportPrefix}_COMMUNE_PATHS`],
            communeDepartmentMap: communes[`${exportPrefix}_COMMUNE_DEPARTMENT`],
            departmentBounds: communes[`${exportPrefix}_DEPARTMENT_BOUNDS`]
          })
        }
      } catch (e) {
        console.error("Failed to load map data for", countryCode, e)
        if (mounted) setGeoData(null)
      }
    }
    load()
    return () => { mounted = false }
  }, [countryCode])
  
  if (!geoData) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-card bg-surface-raised">
        <p className="text-ink-muted text-sm animate-pulse">Chargement cartographie ({countryCode})...</p>
      </div>
    )
  }
  
  return <GenericCountryMap {...geoData} {...props} />
}
