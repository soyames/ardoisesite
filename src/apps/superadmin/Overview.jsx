import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db, auth } from '../../shared/api/firebase.js'
import { getPlatformApiBaseUrl } from '../../config/env.js'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'

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
        let schoolsWithTunnels = 0
        let schoolsWithFeeCollection = 0
        const signupsByMonth = {}
        const pipelineCounts = {}

        schoolsSnap.forEach((doc) => {
          totalSchools++
          const data = doc.data()
          if (data.backendUrl) schoolsWithTunnels++
          if (data.feeCollectionEnabled) schoolsWithFeeCollection++

          const stage = data.pipelineStage || 'customer'
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

        // tutoring_contracts no longer carries a total/commission - Ardoise
        // stopped intermediating parent-to-tutor payments (2026-07 pivot),
        // so this is just a connection count now, not a revenue figure.
        const tutorContractCount = contractsSnap.size

        let totalAdmissionFees = 0
        payoutsSnap.forEach((doc) => {
          const data = doc.data()
          if (data.amount) totalAdmissionFees += Number(data.amount)
        })

        const signupsData = Object.keys(signupsByMonth).sort().map((month) => ({
          month, Écoles: signupsByMonth[month],
        }))

        setStats({
          totalSchools, schoolsWithTunnels, schoolsWithFeeCollection,
          totalUsers, rolesCount, signupsData, pipelineCounts,
          tutorContractCount, totalAdmissionFees,
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
          <StatBox label="Frais d'Admission Collectés (pour compte des écoles)" value={fmtFcfa(stats.totalAdmissionFees)} tone="primary" />
          <StatBox label="Écoles avec collecte de frais activée" value={stats.schoolsWithFeeCollection} />
          <StatBox label="Mises en relation Tuteur-Parent" value={stats.tutorContractCount} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Croissance</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatBox label="Écoles Inscrites" value={stats.totalSchools} />
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
