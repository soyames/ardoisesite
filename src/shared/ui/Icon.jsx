/**
 * Material Symbols Outlined wrapper - the icon set every Stitch mockup
 * uses (see brand/DESIGN.md), loaded as a variable webfont in
 * index.html. `name` is any Material Symbols icon name (e.g.
 * "dashboard", "gavel", "menu_book" - see fonts.google.com/icons).
 */
export default function Icon({ name, filled = false, className = '', style, ...rest }) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0", ...style }}
      aria-hidden="true"
      {...rest}
    >
      {name}
    </span>
  )
}
