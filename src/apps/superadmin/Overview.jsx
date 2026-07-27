import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db, auth } from '../../shared/api/firebase.js'
import { getPlatformApiBaseUrl } from '../../config/env.js'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'

// The only real paid plan today is a flat annual license (see
// SaasPricing.jsx) - ARR is therefore just activeSubscriptions x this
// price, not a true MRR (there's no monthly-billed tier to sum). Kept
// as a named constant, not re-derived from Firestore, since the price
// itself lives in marketing copy (SaasPricing.jsx), not in any school
// document - update both places together if it ever changes.
const ANNUAL_LICENSE_PRICE_FCFA = 50000

const FEATURE_LABELS = {
  whatsapp_notifications: 'Notifications WhatsApp',
  marketplace_enrollment_processing: 'Traitement inscriptions',
  marketplace_recruitment_processing: 'Traitement recrutement',
  erp_core: 'ERP complet',
}

function fmtFcfa(n) {
  return `${Math.round(n).toLocaleString('fr-FR')} F`
}

export default function Overview() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [schoolsSnap, usersSnap, contractsSnap, payoutsSnap, leadsData] = await Promise.all([
          getDocs(collection(db, 'schools')),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'tutoring_contracts')),
          getDocs(collection(db, 'school_payouts_owed')),
          (async () => {
            try {
              const idToken = await auth.currentUser.getIdToken()
              const res = await fetch(`${getPlatformApiBaseUrl()}/api/admin/crm/leads`, {
                headers: { Authorization: `Bearer ${idToken}` },
              })
              return res.ok ? res.json() : []
            } catch {
              return []
            }
          })(),
        ])

        let totalSchools = 0
        let activeSubscriptions = 0
        let expiredSubscriptions = 0
        let schoolsWithTunnels = 0
        const signupsByMonth = {}
        const featureCounts = {}
        const pipelineCounts = {}

        schoolsSnap.forEach((doc) => {
          totalSchools++
          const data = doc.data()
          const expiresAt = data.subscriptionExpiresAt
            ? (data.subscriptionExpiresAt.toDate ? data.subscriptionExpiresAt.toDate() : new Date(data.subscriptionExpiresAt))
            : null
          const isExpired = expiresAt !== null && expiresAt.getTime() < Date.now()

          if (data.subscriptionActive && !isExpired) activeSubscriptions++
          if (data.subscriptionActive && isExpired) expiredSubscriptions++
          if (data.backendUrl) schoolsWithTunnels++

          for (const f of data.features || []) featureCounts[f] = (featureCounts[f] || 0) + 1

          const stage = data.pipelineStage || (data.subscriptionActive ? 'customer' : 'prospect')
          pipelineCounts[stage] = (pipelineCounts[stage] || 0) + 1

          if (data.createdAt) {
            const date = new Date(data.createdAt)
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            signupsByMonth[month] = (signupsByMonth[month] || 0) + 1
          }
        })

        for (const lead of leadsData) {
          const stage = lead.pipelineStage || 'prospect'
          pipelineCounts[stage] = (pipelineCounts[stage] || 0) + 1
        }

        let totalUsers = 0
        const rolesCount = {}
        usersSnap.forEach((doc) => {
          totalUsers++
          const role = doc.data().role
          if (role) rolesCount[role] = (rolesCount[role] || 0) + 1
        })

        let totalTutorRevenue = 0
        let totalTutorCommissions = 0
        contractsSnap.forEach((doc) => {
          const data = doc.data()
          if (data.total) totalTutorRevenue += Number(data.total)
          if (data.commission) totalTutorCommissions += Number(data.commission)
        })

        let totalAdmissionFees = 0
        payoutsSnap.forEach((doc) => {
          const data = doc.data()
          if (data.amountOwed) totalAdmissionFees += Number(data.amountOwed)
        })

        const signupsData = Object.keys(signupsByMonth).sort().map((month) => ({
          month, Écoles: signupsByMonth[month],
        }))

        const featureData = Object.entries(featureCounts).map(([key, count]) => ({
          name: FEATURE_LABELS[key] || key, count,
        }))

        setStats({
          totalSchools, activeSubscriptions, expiredSubscriptions, schoolsWithTunnels,
          totalUsers, rolesCount, signupsData, featureData, pipelineCounts,
          arr: activeSubscriptions * ANNUAL_LICENSE_PRICE_FCFA,
          totalTutorRevenue, totalTutorCommissions, totalAdmissionFees,
          leadCount: leadsData.length,
        })
      } catch (err) {
        console.error('Error loading overview:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return <div className="p-4 text-ink-muted">Chargement...</div>
  if (!stats) return <div className="p-4 text-danger-600">Impossible de charger les données.</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Revenus</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatBox label="Revenu Récurrent Annuel (estimé)" value={fmtFcfa(stats.arr)} tone="primary" />
          <StatBox label="Frais d'Admission Collectés" value={fmtFcfa(stats.totalAdmissionFees)} />
          <StatBox label="Revenus Tutorat" value={fmtFcfa(stats.totalTutorRevenue)} />
          <StatBox label="Commissions Tutorat" value={fmtFcfa(stats.totalTutorCommissions)} tone="success" />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Croissance</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatBox label="Écoles Inscrites" value={stats.totalSchools} />
          <StatBox label="Abonnements Actifs" value={stats.activeSubscriptions} tone="success" />
          <StatBox label="Abonnements Expirés" value={stats.expiredSubscriptions} tone="danger" />
          <StatBox label="Prospects (pipeline)" value={stats.leadCount} tone="warning" />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Utilisation</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatBox label="Utilisateurs Totaux" value={stats.totalUsers} />
          <StatBox label="Installations Connectées" value={stats.schoolsWithTunnels} />
          <StatBox label="Fondateurs" value={stats.rolesCount.founder || 0} />
          <StatBox label="Enseignants (marketplace)" value={stats.rolesCount.teacher || 0} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Évolution des Inscriptions (Écoles)" />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.signupsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="Écoles" stroke="#0088FE" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Adoption des Fonctionnalités Payantes" subtitle="Nombre d'écoles ayant activé chaque fonctionnalité" />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.featureData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#00C49F" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Répartition du Pipeline" subtitle="Écoles et prospects, toutes étapes confondues" />
        <CardBody>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.pipelineCounts).map(([stage, count]) => (
              <div key={stage} className="rounded-control bg-primary-50/50 px-4 py-2 text-sm">
                <span className="font-semibold text-ink">{count}</span>{' '}
                <span className="text-ink-muted capitalize">{stage}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

function StatBox({ label, value, tone = 'default' }) {
  const toneClass = {
    default: 'text-ink',
    primary: 'text-primary-600',
    success: 'text-success-600',
    danger: 'text-danger-600',
    warning: 'text-warning-600',
  }[tone]
  return (
    <div className="rounded-card border border-border bg-surface-raised p-4 shadow-sm">
      <p className="mb-1 text-sm text-ink-muted">{label}</p>
      <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  )
}
