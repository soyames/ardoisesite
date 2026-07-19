import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../api/firebase.js'
import { useAuth } from '../auth/AuthContext.jsx'

export function useSchoolSubscription() {
  const { user } = useAuth()
  const [planCode, setPlanCode] = useState('free') // Default to free
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function fetchPlan() {
      if (!user || !user.schoolId) {
        if (active) setLoading(false)
        return
      }

      try {
        const schoolDoc = await getDoc(doc(db, 'schools', user.schoolId))
        if (schoolDoc.exists() && active) {
          setPlanCode(schoolDoc.data().planCode || 'free')
        }
      } catch (err) {
        console.error('Failed to fetch school subscription:', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchPlan()

    return () => {
      active = false
    }
  }, [user])

  const isPremium = planCode !== 'free' || (typeof window !== 'undefined' && window.localStorage.getItem('MOCK_PREMIUM') === 'true')

  return {
    planCode,
    isPremium,
    loading
  }
}
