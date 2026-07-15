/**
 * Status badge. `tone` maps to the semantic status tokens in
 * index.css -- this is the single place that decides "pending looks
 * amber, approved looks green" etc. so every portal (bulletins,
 * discipline records, payroll runs, salary advances) renders the same
 * status the same way instead of each screen picking its own color.
 */
const TONES = {
  neutral: 'bg-primary-50 text-primary-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
  info: 'bg-info-50 text-info-600',
}

export default function Badge({ tone = 'neutral', children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  )
}
