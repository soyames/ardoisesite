const VARIANTS = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500/30',
  accent: 'bg-accent-500 text-primary-950 hover:bg-accent-600 focus-visible:ring-accent-500/30',
  secondary: 'bg-primary-50 text-primary-700 hover:bg-primary-100 focus-visible:ring-primary-500/20',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 focus-visible:ring-danger-500/30',
  ghost: 'bg-transparent text-ink hover:bg-primary-50 focus-visible:ring-primary-500/20',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-control font-medium transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
