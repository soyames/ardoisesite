import React, { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'

export default function PlatformAnalytics() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const schoolsSnap = await getDocs(collection(db, 'schools'))
        const usersSnap = await getDocs(collection(db, 'users'))

        let totalSchools = 0
        let activeSubscriptions = 0
        let schoolsWithTunnels = 0
        const schoolSignupsByMonth = {}
        
        schoolsSnap.forEach(doc => {
          totalSchools++
          const data = doc.data()
          if (data.subscriptionActive) activeSubscriptions++
          if (data.backendUrl) schoolsWithTunnels++
          
          if (data.createdAt) {
            const date = new Date(data.createdAt)
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            schoolSignupsByMonth[month] = (schoolSignupsByMonth[month] || 0) + 1
          }
        })

        let totalUsers = 0
        const rolesCount = { founder: 0, teacher: 0, parent: 0, developer: 0, superadmin: 0 }
        
        usersSnap.forEach(doc => {
          totalUsers++
          const data = doc.data()
          if (data.role && rolesCount[data.role] !== undefined) {
            rolesCount[data.role]++
          }
        })

        let totalTutorRevenue = 0
        let totalTutorCommissions = 0
        const contractsSnap = await getDocs(collection(db, 'tutoring_contracts'))
        contractsSnap.forEach(doc => {
          const data = doc.data()
          if (data.total) totalTutorRevenue += Number(data.total)
          if (data.commission) totalTutorCommissions += Number(data.commission)
        })

        let totalAdmissionFees = 0
        const payoutsSnap = await getDocs(collection(db, 'school_payouts_owed'))
        payoutsSnap.forEach(doc => {
          const data = doc.data()
          if (data.amountOwed) totalAdmissionFees += Number(data.amountOwed)
        })

        // Format data for Recharts
        const signupsData = Object.keys(schoolSignupsByMonth).sort().map(month => ({
          month,
          Acoles: schoolSignupsByMonth[month]
        }))

        const rolesData = Object.entries(rolesCount)
          .filter(([_, count]) => count > 0)
          .map(([name, value]) => ({ name, value }))

        setStats({
          totalSchools,
          activeSubscriptions,
          schoolsWithTunnels,
          totalUsers,
          signupsData,
          rolesData,
          devCount: rolesCount.developer,
          totalTutorRevenue,
          totalTutorCommissions,
          totalAdmissionFees
        })
      } catch (err) {
        console.error("Error loading analytics", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return <div className="p-4 text-ink-muted">Chargement des analytiques...</div>
  if (!stats) return <div className="p-4 text-danger-600">Impossible de charger les donnAces.</div>

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-card border border-border shadow-sm">
          <p className="text-sm text-ink-muted mb-1">A%coles Inscrites</p>
          <p className="text-2xl font-bold text-ink">{stats.totalSchools}</p>
        </div>
        <div className="bg-white p-4 rounded-card border border-border shadow-sm">
          <p className="text-sm text-ink-muted mb-1">Abonnements Actifs</p>
          <p className="text-2xl font-bold text-success-600">{stats.activeSubscriptions}</p>
        </div>
        <div className="bg-white p-4 rounded-card border border-border shadow-sm">
          <p className="text-sm text-ink-muted mb-1">Tunnels Actifs</p>
          <p className="text-2xl font-bold text-info-600">{stats.schoolsWithTunnels}</p>
        </div>
        <div className="bg-white p-4 rounded-card border border-border shadow-sm">
          <p className="text-sm text-ink-muted mb-1">Frais d'Admission CollectÃ©s</p>
          <p className="text-2xl font-bold text-primary-600">{stats.totalAdmissionFees.toLocaleString()} F</p>
        </div>
        <div className="bg-white p-4 rounded-card border border-border shadow-sm">
          <p className="text-sm text-ink-muted mb-1">Revenus Tutorat</p>
          <p className="text-2xl font-bold text-ink">{stats.totalTutorRevenue.toLocaleString()} F</p>
        </div>
        <div className="bg-white p-4 rounded-card border border-border shadow-sm">
          <p className="text-sm text-ink-muted mb-1">Commissions Tutorat</p>
          <p className="text-2xl font-bold text-success-600">{stats.totalTutorCommissions.toLocaleString()} F</p>
        </div>
        <div className="bg-white p-4 rounded-card border border-border shadow-sm">
          <p className="text-sm text-ink-muted mb-1">Utilisateurs Totaux</p>
          <p className="text-2xl font-bold text-ink">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-card border border-border shadow-sm">
          <p className="text-sm text-ink-muted mb-1">DAcveloppeurs / ReprAcsentants</p>
          <p className="text-2xl font-bold text-primary-600">{stats.devCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="A%volution des Inscriptions (A%coles)" />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.signupsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} allowDecimals={false} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="Acoles" stroke="#0088FE" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="RAcpartition des Utilisateurs" />
          <CardBody>
            <div className="h-64 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.rolesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {stats.rolesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

