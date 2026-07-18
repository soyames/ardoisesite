import { useMemo, useState } from 'react'
import { BENIN_VIEWBOX, BENIN_DEPARTMENT_PATHS } from '../constants/beninGeo.js'
import { BENIN_COMMUNE_PATHS, BENIN_COMMUNE_DEPARTMENT, BENIN_DEPARTMENT_BOUNDS } from '../constants/beninGeoCommunes.js'

const DEPARTMENT_ORDER = Object.keys(BENIN_DEPARTMENT_PATHS)

/**
 * Real department (ADM1) and commune (ADM2) boundaries - see
 * beninGeo.js/beninGeoCommunes.js. Two levels, same coordinate space:
 * the national view shows departments; clicking one zooms the SVG
 * viewBox to that department's real bounding box and swaps in its
 * communes, each independently clickable/hoverable. No re-projection
 * on drill-down, just a viewBox change.
 *
 * @param {Object} schoolCounts - { [cityOrCommune]: number } - keyed by commune name (matches BENIN_COMMUNE_PATHS keys)
 * @param {string|null} selectedDepartment - department to filter by at the national level, or null
 * @param {(dept: string|null) => void} onSelectDepartment - toggles the department-level filter
 * @param {(commune: string) => void} [onSelectCommune] - fires when a commune is clicked in the drilled-in view (in addition to the hover detail panel)
 */
export default function BeninMap({ schoolCounts = {}, selectedDepartment = null, onSelectDepartment, onSelectCommune }) {
  const [drilledInto, setDrilledInto] = useState(null) // department name, or null = national view
  const [hovered, setHovered] = useState(null)

  const departmentCounts = useMemo(() => {
    const counts = {}
    Object.entries(schoolCounts).forEach(([commune, n]) => {
      const dept = BENIN_COMMUNE_DEPARTMENT[commune]
      if (dept) counts[dept] = (counts[dept] || 0) + n
    })
    return counts
  }, [schoolCounts])

  const communesInView = useMemo(() => {
    if (!drilledInto) return []
    return Object.keys(BENIN_COMMUNE_PATHS).filter((c) => BENIN_COMMUNE_DEPARTMENT[c] === drilledInto)
  }, [drilledInto])

  const isCommuneView = Boolean(drilledInto)
  const viewBox = isCommuneView
    ? BENIN_DEPARTMENT_BOUNDS[drilledInto].join(' ')
    : BENIN_VIEWBOX

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
      return { label: name, sublabel: drilledInto, count, share, shareLabel: 'Part du departement' }
    }
    const name = activeName
    if (!name) return null
    const total = Object.values(departmentCounts).reduce((s, n) => s + n, 0)
    const count = departmentCounts[name] || 0
    const share = total > 0 ? Math.round((count / total) * 100) : 0
    const rank = [...DEPARTMENT_ORDER].sort((a, b) => (departmentCounts[b] || 0) - (departmentCounts[a] || 0)).indexOf(name) + 1
    return { label: name, sublabel: `Departement (${rank}/${DEPARTMENT_ORDER.length})`, count, share, shareLabel: 'Part du reseau' }
  }, [isCommuneView, hovered, activeName, drilledInto, schoolCounts, departmentCounts])

  return (
    // Always stacked (map above, detail panel below) - this component gets
    // embedded in narrow fixed-width columns (a 320px hero column, a 280px
    // sidebar), and a viewport-width breakpoint like sm:flex-row has no way
    // to know that; it fires on any wide desktop screen regardless of how
    // little room the actual column has, which was overflowing the detail
    // box. Stacking is container-width-safe with plain flexbox.
    <div className="flex flex-col gap-4">
      <div className="shrink-0">
        {isCommuneView && (
          <button
            onClick={() => { setDrilledInto(null); setHovered(null) }}
            className="mb-2 text-xs font-semibold text-primary-600 hover:text-primary-500"
          >
            &larr; Retour au Benin
          </button>
        )}
        <svg viewBox={viewBox} className="w-full max-w-[220px]" role="img" aria-label="Carte du Benin">
          {!isCommuneView && DEPARTMENT_ORDER.map((name) => {
            const count = departmentCounts[name] || 0
            const intensity = count / maxDeptCount
            const isSelected = selectedDepartment === name
            return (
              <path
                key={name}
                d={BENIN_DEPARTMENT_PATHS[name]}
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
                d={BENIN_COMMUNE_PATHS[name]}
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
            className="mt-2 text-xs font-semibold text-primary-600 hover:text-primary-500"
          >
            Voir les communes &rarr;
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
                <dt className="text-ink-muted">Ecoles</dt>
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
              ? `Survolez une commune de ${drilledInto} pour voir le detail.`
              : 'Survolez ou choisissez un departement. Double-cliquez (ou "Voir les communes") pour le detail par commune.'}
          </p>
        )}
      </div>
    </div>
  )
}
