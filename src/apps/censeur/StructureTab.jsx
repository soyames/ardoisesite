import { useState } from 'react'
import { api, ApiError } from '../../shared/api/client.js'
import { useApiGet } from '../../shared/hooks/useApi.js'

export default function StructureTab() {
  const classrooms = useApiGet('/api/students/classrooms/')
  const subjects = useApiGet('/api/academics/subjects/')
  const classSubjects = useApiGet('/api/academics/class-subjects/')
  const academicYears = useApiGet('/api/auth/academic-years/')
  const staff = useApiGet('/api/hr/staff/')

  const [formError, setFormError] = useState(null)

  const [newClass, setNewClass] = useState({ name: '', capacity: 50, registration_fee: 0, level: '6eme', academic_year: '' })
  const [newSubject, setNewSubject] = useState({ name: '' })
  const [newClassSubject, setNewClassSubject] = useState({ classroom: '', subject: '', teacher: '' })

  const createClassroom = async (e) => {
    e.preventDefault()
    setFormError(null)
    try {
      await api.post('/api/students/classrooms/', newClass)
      setNewClass({ name: '', capacity: 50, registration_fee: 0, level: '6eme', academic_year: newClass.academic_year })
      classrooms.refetch()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    }
  }

  const createSubject = async (e) => {
    e.preventDefault()
    setFormError(null)
    try {
      await api.post('/api/academics/subjects/', newSubject)
      setNewSubject({ name: '' })
      subjects.refetch()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    }
  }

  const createClassSubject = async (e) => {
    e.preventDefault()
    setFormError(null)
    try {
      await api.post('/api/academics/class-subjects/', newClassSubject)
      setNewClassSubject({ classroom: newClassSubject.classroom, subject: '', teacher: '' })
      classSubjects.refetch()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    }
  }

  return (
    <div className="space-y-6">
      {formError && <div className="rounded-control bg-error-50 p-3 text-sm text-error-700 border border-error-200">{formError}</div>}
      
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-card border border-border bg-surface p-4">
          <h2 className="mb-4 text-lg font-bold text-ink">Nouvelle Classe</h2>
          <form onSubmit={createClassroom} className="space-y-3">
            <select
              value={newClass.academic_year}
              onChange={e => setNewClass({ ...newClass, academic_year: e.target.value })}
              className="w-full rounded-control border border-border p-2 focus:border-primary-500 focus:outline-none"
              required
            >
              <option value="">-- Année académique --</option>
              {academicYears.data?.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
            <input
              type="text"
              placeholder="Nom (ex: 6ème A)"
              value={newClass.name}
              onChange={e => setNewClass({ ...newClass, name: e.target.value })}
              className="w-full rounded-control border border-border p-2 focus:border-primary-500 focus:outline-none"
              required
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Niveau (ex: 6eme)"
                value={newClass.level}
                onChange={e => setNewClass({ ...newClass, level: e.target.value })}
                className="w-1/2 rounded-control border border-border p-2 focus:border-primary-500 focus:outline-none"
                required
              />
              <input
                type="number"
                placeholder="Capacité"
                value={newClass.capacity}
                onChange={e => setNewClass({ ...newClass, capacity: e.target.value })}
                className="w-1/4 rounded-control border border-border p-2 focus:border-primary-500 focus:outline-none"
                required
              />
              <input
                type="number"
                placeholder="Frais d'inscr. (FedaPay)"
                value={newClass.registration_fee}
                onChange={e => setNewClass({ ...newClass, registration_fee: e.target.value })}
                className="w-1/4 rounded-control border border-border p-2 focus:border-primary-500 focus:outline-none"
              />
              <button type="submit" disabled={!newClass.academic_year} className="bg-primary-600 text-white px-4 py-2 rounded-control font-bold hover:bg-primary-700 disabled:opacity-50">
                Ajouter
              </button>
            </div>
          </form>
          <ul className="mt-4 space-y-1">
            {classrooms.data?.map(c => <li key={c.id} className="text-sm text-ink-muted">{c.name} ({c.level}) - {c.capacity} places - {c.registration_fee} FCFA</li>)}
          </ul>
        </section>

        <section className="rounded-card border border-border bg-surface p-4">
          <h2 className="mb-4 text-lg font-bold text-ink">Nouvelle Matière</h2>
          <form onSubmit={createSubject} className="space-y-3">
            <input
              type="text"
              placeholder="Nom (ex: Mathématiques)"
              value={newSubject.name}
              onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
              className="w-full rounded-control border border-border p-2 focus:border-primary-500 focus:outline-none"
              required
            />
            <button type="submit" className="w-full rounded-control bg-primary-600 py-2 font-bold text-white hover:bg-primary-700">Créer Matière</button>
          </form>
          <ul className="mt-4 space-y-1">
            {subjects.data?.map(s => <li key={s.id} className="text-sm text-ink-muted">{s.name}</li>)}
          </ul>
        </section>
      </div>

      <section className="rounded-card border border-border bg-surface p-4">
        <h2 className="mb-4 text-lg font-bold text-ink">Affecter une matière à une classe</h2>
        <form onSubmit={createClassSubject} className="flex flex-wrap gap-3">
          <select
            value={newClassSubject.classroom}
            onChange={e => setNewClassSubject({ ...newClassSubject, classroom: e.target.value })}
            className="flex-1 rounded-control border border-border p-2 focus:border-primary-500 focus:outline-none min-w-[200px]"
            required
          >
            <option value="">-- Sélectionner Classe --</option>
            {classrooms.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={newClassSubject.subject}
            onChange={e => setNewClassSubject({ ...newClassSubject, subject: e.target.value })}
            className="flex-1 rounded-control border border-border p-2 focus:border-primary-500 focus:outline-none min-w-[200px]"
            required
          >
            <option value="">-- Sélectionner Matière --</option>
            {subjects.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select
            value={newClassSubject.teacher}
            onChange={e => setNewClassSubject({ ...newClassSubject, teacher: e.target.value })}
            className="flex-1 rounded-control border border-border p-2 focus:border-primary-500 focus:outline-none min-w-[200px]"
            required
          >
            <option value="">-- Sélectionner Professeur --</option>
            {staff.data?.map(s => <option key={s.id} value={s.id}>{s.last_name} {s.first_name}</option>)}
          </select>
          <button type="submit" className="rounded-control bg-primary-600 px-6 py-2 font-bold text-white hover:bg-primary-700">Affecter</button>
        </form>
        <ul className="mt-4 space-y-1">
          {classSubjects.data?.map(cs => (
            <li key={cs.id} className="text-sm text-ink-muted">
              {cs.classroom_name} - {cs.subject_name} {cs.teacher_name ? `(Prof: ${cs.teacher_name})` : ''}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
