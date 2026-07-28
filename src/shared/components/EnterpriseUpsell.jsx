import { ApiError } from '../api/client.js'

// Whether a useApiGet() error is specifically the Enterprise-tier gate
// (apps/licensing/middleware.py) rather than some other failure - a
// portal using this should show the upsell ONLY for this exact error,
// never for a network blip or an unrelated 403 (permissions), which
// should still surface as a normal error state.
export function isEnterpriseGateError(error) {
  return error instanceof ApiError && error.status === 403 && error.data?.error === 'feature_requires_subscription'
}

const MODULE_LABELS = {
  finance_core: 'Finance & Comptabilité',
  hr_payroll: 'RH & Paie',
  shop_pos: 'Cantine & Bibliothèque',
  analytics_bi: 'Analytique & BI',
}

/**
 * Full-page upsell shown INSTEAD OF a portal's content when its own
 * data fetch 403s with feature_requires_subscription - never a
 * silently-disabled button with no explanation (see the 2026-07-28
 * incident: isPremium disabled Accept/Reject with zero messaging).
 * Founder/Director get a direct link to subscribe; every other role
 * sees the same message without the link, since only Founder/Director
 * can see SubscriptionPanel.jsx (Activation & Installation tab).
 */
export default function EnterpriseUpsell({ feature, canSubscribe = false }) {
  const label = MODULE_LABELS[feature] || feature
  return (
    <div className="rounded-card border border-accent-200 bg-accent-50 p-8 text-center">
      <p className="text-3xl mb-3">🔒</p>
      <h2 className="text-lg font-bold text-accent-900">Module Enterprise requis</h2>
      <p className="mt-2 text-sm text-accent-800 max-w-md mx-auto">
        <strong>{label}</strong> fait partie de l'offre Ardoise Enterprise. Les élèves, notes et présences restent gratuits pour toute l'école.
      </p>
      {canSubscribe ? (
        <p className="mt-4 text-xs text-ink-muted">Rendez-vous dans l'onglet <strong>Activation &amp; Installation</strong> pour voir l'offre Enterprise et vous abonner.</p>
      ) : (
        <p className="mt-4 text-xs text-ink-muted">Demandez au fondateur ou à la directrice/au directeur d'activer Enterprise depuis Activation &amp; Installation.</p>
      )}
    </div>
  )
}
