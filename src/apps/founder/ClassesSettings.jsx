import React, { useState, useEffect } from 'react'
import { api } from '../../shared/api/client.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'

export default function ClassesSettings() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // For the form
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    level: 'ps',
    series: '',
    section: '',
    capacity: 50,
    registration_fee: 0,
    required_documents: ''
  })

  const LEVELS = [
    { value: 'ps', label: "Petite Section (PS)" },
    { value: 'ms', label: "Moyenne Section (MS)" },
    { value: 'gs', label: "Grande Section (GS)" },
    { value: 'ci', label: "Cours d'Initiation (CI)" },
    { value: 'cp', label: "Cours Préparatoire (CP)" },
    { value: 'ce1', label: "Cours Élémentaire 1 (CE1)" },
    { value: 'ce2', label: "Cours Élémentaire 2 (CE2)" },
    { value: 'cm1', label: "Cours Moyen 1 (CM1)" },
    { value: 'cm2', label: "Cours Moyen 2 (CM2)" },
    { value: '6e', label: "6ème" },
    { value: '5e', label: "5ème" },
    { value: '4e', label: "4ème" },
    { value: '3e', label: "3ème" },
    { value: '2nde', label: "Seconde" },
    { value: '1ere', label: "Première" },
    { value: 'tle', label: "Terminale" },
  ]

  // Only Seconde/Première/Terminale split by série - matches
  // ClassRoom.SERIES_LEVELS on the backend (apps/students/models.py),
  // which rejects a series set on any other level.
  const SERIES_LEVELS = ['2nde', '1ere', 'tle']

  const SERIES = [
    { value: '', label: "-" },
    { value: 'AB', label: "Série AB" },
    { value: 'C', label: "Série C" },
    { value: 'D', label: "Série D" },
    { value: 'EF', label: "Série EF" },
  ]

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const data = await api.get('/api/students/classrooms/')
      setClasses(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => {
      const next = { ...prev, [name]: type === 'number' ? Number(value) : value }
      // Série only applies to Seconde/Première/Terminale (see backend
      // validate()) - clear a stale série when switching to a level
      // that doesn't have one, rather than submitting a rejected combo.
      if (name === 'level' && !SERIES_LEVELS.includes(value)) next.series = ''
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await api.patch(`/api/students/classrooms/${editingId}/`, formData)
      } else {
        await api.post('/api/students/classrooms/', formData)
      }
      await fetchClasses()
      resetForm()
    } catch (err) {
      alert(`Erreur: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }
  
  const handleEdit = (cls) => {
    setEditingId(cls.id)
    setFormData({
      level: cls.level,
      series: cls.series || '',
      section: cls.section || '',
      capacity: cls.capacity,
      registration_fee: cls.registration_fee || 0,
      required_documents: cls.required_documents || ''
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette classe ?")) return
    try {
      await api.delete(`/api/students/classrooms/${id}/`)
      await fetchClasses()
    } catch (err) {
      alert(`Erreur: ${err.message}`)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      level: 'ps',
      series: '',
      section: '',
      capacity: 50,
      registration_fee: 0,
      required_documents: ''
    })
  }

  if (loading && classes.length === 0) {
    return <div className="py-10 flex justify-center"><Spinner /></div>
  }

  return (
    <Card>
      <CardHeader title="Gestion des Classes" subtitle="Créez et configurez les classes de votre établissement" />
      <CardBody>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 border-r border-border pr-8">
            <h3 className="text-lg font-bold text-ink mb-4">{editingId ? 'Modifier la classe' : 'Ajouter une classe'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink">Niveau</label>
                <select name="level" value={formData.level} onChange={handleChange} className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-surface">
                  {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>

              {SERIES_LEVELS.includes(formData.level) && (
                <div>
                  <label className="block text-sm font-medium text-ink">Série</label>
                  <select name="series" value={formData.series} onChange={handleChange} className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-surface">
                    {SERIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-ink">Section (optionnel)</label>
                <input type="text" name="section" value={formData.section} onChange={handleChange} placeholder="Ex: A, 2, Nord - si l'école a plusieurs classes à ce niveau" className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-surface" />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink">Capacité maximale</label>
                <input required type="number" name="capacity" value={formData.capacity} onChange={handleChange} min="1" className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-surface" />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink">Frais d'admission (FCFA)</label>
                <input required type="number" name="registration_fee" value={formData.registration_fee} onChange={handleChange} min="0" className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-surface" />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink">Pièces à fournir (Spécifiques)</label>
                <textarea name="required_documents" value={formData.required_documents} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-surface" placeholder="Ex: Dernier bulletin, extrait de naissance..."></textarea>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? '...' : (editingId ? 'Mettre à jour' : 'Ajouter')}
                </Button>
                {editingId && (
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Annuler
                  </Button>
                )}
              </div>
            </form>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-lg font-bold text-ink mb-4">Classes existantes</h3>
            {classes.length === 0 ? (
              <div className="p-4 bg-surface-raised rounded text-ink-muted text-center border border-border">
                Aucune classe n'a été créée pour l'instant.
              </div>
            ) : (
              <div className="space-y-3">
                {classes.map(cls => (
                  <div key={cls.id} className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg shadow-sm">
                    <div>
                      <div className="font-bold text-ink">{cls.name}</div>
                      <div className="text-xs text-ink-muted">
                        {cls.level_display} {cls.series ? `(Série ${cls.series})` : ''} • {cls.capacity} places
                      </div>
                      <div className="text-xs text-primary-600 font-semibold mt-1">
                        Admission: {Number(cls.registration_fee).toLocaleString('fr-FR')} FCFA
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(cls)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition" title="Modifier">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(cls.id)} className="p-2 text-danger-600 hover:bg-danger-50 rounded-full transition" title="Supprimer">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </CardBody>
    </Card>
  )
}
