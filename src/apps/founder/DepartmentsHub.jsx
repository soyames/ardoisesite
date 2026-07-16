import { useState } from 'react'
import { Card, CardBody } from '../../shared/ui/Card.jsx'
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
  { key: 'secretary', label: 'Secretariat', description: 'Eleves, parents, inscriptions', icon: '\u{1F4CB}', Component: SecretaryPortal },
  { key: 'hr', label: 'RH & Paie', description: 'Personnel, contrats, paie, conges', icon: '\u{1F465}', Component: HrPortal },
  { key: 'comptable', label: 'Comptabilite', description: 'Grand livre, validation paie, fournisseurs', icon: '\u{1F4B0}', Component: ComptablePortal },
  { key: 'censeur', label: 'Censorat', description: 'Bulletins, discipline, heures vacataires', icon: '\u{1F393}', Component: CenseurPortal },
  { key: 'surveillant', label: 'Surveillance', description: 'Appel, discipline', icon: '\u{1F440}', Component: SurveillantPortal },
  { key: 'canteen', label: 'Cantine', description: 'Ventes, portefeuilles, stock', icon: '\u{1F37D}️', Component: CanteenPortal },
  { key: 'librarian', label: 'Librairie', description: 'Catalogue, ventes, stock', icon: '\u{1F4DA}', Component: LibrarianPortal },
  { key: 'auditor', label: 'Audit', description: 'Journal, finances, RH, communications', icon: '\u{1F50D}', Component: AuditorPortal },
  { key: 'cycles', label: 'Cycles', description: 'Attribuer Primaire/Secondaire aux Directeurs et Censeurs', icon: '\u{1F501}', Component: CyclesPanel },
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
        <Card key={d.key} className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-elevated" onClick={() => setActiveKey(d.key)}>
          <CardBody className="flex flex-col items-start gap-2 p-5">
            <span className="text-2xl">{d.icon}</span>
            <h3 className="text-sm font-semibold text-ink">{d.label}</h3>
            <p className="text-xs text-ink-muted">{d.description}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
