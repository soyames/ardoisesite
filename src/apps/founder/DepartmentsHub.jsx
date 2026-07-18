import { useState } from 'react'
import QuickActionButton from '../../shared/ui/QuickActionButton.jsx'
import SecretaryPortal from '../secretary/SecretaryPortal.jsx'
import HrPortal from '../hr/HrPortal.jsx'
import ComptablePortal from '../comptable/ComptablePortal.jsx'
import CenseurPortal from '../censeur/CenseurPortal.jsx'
import SurveillantPortal from '../surveillant/SurveillantPortal.jsx'
import CanteenPortal from '../canteen/CanteenPortal.jsx'
import LibrarianPortal from '../librarian/LibrarianPortal.jsx'
import AuditorPortal from '../auditor/AuditorPortal.jsx'
import CyclesPanel from './CyclesPanel.jsx'

/**
 * Founder/Director oversight into every department, reusing the same
 * portal components each department role sees directly - those
 * components have no internal role check of their own (only
 * App.jsx's PORTAL_BY_ROLE routing gated them before), so rendering
 * them here just works, scoped by whatever Django permissions the
 * Founder/Director role actually holds (core/permissions.py). Some
 * create/action buttons within a department's own portal may 403 for
 * Founder specifically where they hold view-only access by design
 * (e.g. shop.* operational writes) - that's a legitimate difference
 * between "oversight" and "operating the till", not a bug.
 */
const DEPARTMENTS = [
  { key: 'secretary', label: 'Secretariat', description: 'Eleves, parents, inscriptions', icon: 'contact_page', Component: SecretaryPortal },
  { key: 'hr', label: 'RH & Paie', description: 'Personnel, contrats, paie, conges', icon: 'badge', Component: HrPortal },
  { key: 'comptable', label: 'Comptabilite', description: 'Grand livre, validation paie, fournisseurs', icon: 'account_balance', Component: ComptablePortal },
  { key: 'censeur', label: 'Censorat', description: 'Bulletins, discipline, heures vacataires', icon: 'insights', Component: CenseurPortal },
  { key: 'surveillant', label: 'Surveillance', description: 'Appel, discipline', icon: 'shield', Component: SurveillantPortal },
  { key: 'canteen', label: 'Cantine', description: 'Ventes, portefeuilles, stock', icon: 'restaurant', Component: CanteenPortal },
  { key: 'librarian', label: 'Librairie', description: 'Catalogue, ventes, stock', icon: 'menu_book', Component: LibrarianPortal },
  { key: 'auditor', label: 'Audit', description: 'Journal, finances, RH, communications', icon: 'fact_check', Component: AuditorPortal },
  { key: 'cycles', label: 'Cycles', description: 'Attribuer Primaire/Secondaire aux Directeurs et Censeurs', icon: 'sync', Component: CyclesPanel },
]

export default function DepartmentsHub() {
  const [activeKey, setActiveKey] = useState(null)
  const active = DEPARTMENTS.find((d) => d.key === activeKey)

  if (active) {
    const { Component } = active
    return (
      <div className="space-y-4">
        <button
          onClick={() => setActiveKey(null)}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          &larr; Retour aux departements
        </button>
        <Component />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {DEPARTMENTS.map((d) => (
        <QuickActionButton key={d.key} icon={d.icon} title={d.label} description={d.description} onClick={() => setActiveKey(d.key)} />
      ))}
    </div>
  )
}
