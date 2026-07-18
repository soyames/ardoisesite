import { useState } from 'react'

/**
 * Schematic map of Benin's 12 departments - a stylized grid laid out to
 * mirror real relative geography (north departments at top, coastal
 * Littoral/Cotonou as the small southern tile), not a GIS-accurate
 * coastline. Same spirit as EducMaster's homepage department map: click
 * a region to filter, hover to preview the count.
 */
const CELL = 74
const GAP = 6

// { key, col, row, colspan, rowspan } - col/row are 1-indexed grid units.
const REGIONS = [
  { key: 'Atacora', col: 1, row: 1, colspan: 2, rowspan: 1 },
  { key: 'Alibori', col: 3, row: 1, colspan: 2, rowspan: 1 },
  { key: 'Donga', col: 1, row: 2, colspan: 2, rowspan: 1 },
  { key: 'Borgou', col: 3, row: 2, colspan: 2, rowspan: 1 },
  { key: 'Collines', col: 2, row: 3, colspan: 2, rowspan: 1 },
  { key: 'Zou', col: 2, row: 4, colspan: 2, rowspan: 1 },
  { key: 'Plateau', col: 4, row: 4, colspan: 1, rowspan: 1 },
  { key: 'Couffo', col: 1, row: 5, colspan: 1, rowspan: 1 },
  { key: 'Atlantique', col: 2, row: 5, colspan: 2, rowspan: 1 },
  { key: 'Ouémé', col: 4, row: 5, colspan: 1, rowspan: 1 },
  { key: 'Mono', col: 1, row: 6, colspan: 1, rowspan: 1 },
  { key: 'Littoral', col: 2, row: 6, colspan: 1, rowspan: 1 },
]

const originX = 10
const originY = 10
const maxCol = 4
const maxRow = 6

function cellRect({ col, row, colspan, rowspan }) {
  return {
    x: originX + (col - 1) * (CELL + GAP),
    y: originY + (row - 1) * (CELL + GAP),
    width: colspan * CELL + (colspan - 1) * GAP,
    height: rowspan * CELL + (rowspan - 1) * GAP,
  }
}

const viewBoxWidth = originX * 2 + maxCol * CELL + (maxCol - 1) * GAP
const viewBoxHeight = originY * 2 + maxRow * CELL + (maxRow - 1) * GAP

/**
 * @param {Object} counts - { [departmentName]: number }
 * @param {string|null} selected - currently selected department, or null
 * @param {(dept: string|null) => void} onSelect - toggles a department; passing the already-selected one clears it
 */
export default function BeninMap({ counts = {}, selected = null, onSelect }) {
  const [hovered, setHovered] = useState(null)
  const maxCount = Math.max(1, ...Object.values(counts))

  return (
    <div className="inline-block">
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full max-w-xs"
        role="img"
        aria-label="Carte des departements du Benin"
      >
        {REGIONS.map((region) => {
          const rect = cellRect(region)
          const count = counts[region.key] || 0
          const intensity = count / maxCount
          const isActive = selected === region.key
          const isHovered = hovered === region.key
          return (
            <g
              key={region.key}
              onClick={() => onSelect?.(isActive ? null : region.key)}
              onMouseEnter={() => setHovered(region.key)}
              onMouseLeave={() => setHovered((h) => (h === region.key ? null : h))}
              className="cursor-pointer"
            >
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                rx={10}
                className={
                  isActive
                    ? 'fill-accent-500 stroke-accent-600'
                    : count > 0
                      ? 'fill-primary-700 stroke-primary-800'
                      : 'fill-surface-raised stroke-border'
                }
                style={count > 0 && !isActive ? { fillOpacity: 0.35 + intensity * 0.65 } : undefined}
                strokeWidth={isActive || isHovered ? 2 : 1}
              />
              <text
                x={rect.x + rect.width / 2}
                y={rect.y + rect.height / 2 - 4}
                textAnchor="middle"
                className={`select-none text-[9px] font-semibold ${isActive ? 'fill-primary-950' : count > 0 ? 'fill-white' : 'fill-ink-muted'}`}
              >
                {region.key}
              </text>
              {count > 0 && (
                <text
                  x={rect.x + rect.width / 2}
                  y={rect.y + rect.height / 2 + 10}
                  textAnchor="middle"
                  className={`select-none text-[10px] font-bold ${isActive ? 'fill-primary-950' : 'fill-white'}`}
                >
                  {count}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {(hovered || selected) && (
        <p className="mt-2 text-xs text-ink-muted">
          {hovered || selected} &middot; {counts[hovered || selected] || 0} etablissement(s)
        </p>
      )}
    </div>
  )
}
