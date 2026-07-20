import { useState, useEffect } from 'react'
import { api } from '../../shared/api/client.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import LetterheadSettings from '../../shared/components/LetterheadSettings.jsx'

export default function SchoolSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    shortCode: '',
    ifu: '',
    commune: '',
    address: '',
    phone: '',
  })
  const [logoFile, setLogoFile] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let active = true
    api.get('/api/auth/school/')
      .then(data => {
        if (!active) return
        setSettings(data)
        setFormData({
          name: data.name || '',
          shortCode: data.shortCode || '',
          ifu: data.ifu || '',
          commune: data.commune || '',
          address: data.address || '',
          phone: data.phone || '',
          enrollmentRequirements: data.enrollmentRequirements || '',
          hasPreselectionTest: data.hasPreselectionTest || false,
        })
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')

    try {
      const data = new FormData()
      // SchoolSettingsView is a multipart PATCH - the project's
      // CamelCaseJSONParser only wraps JSON bodies (see
      // config/settings.py DEFAULT_PARSER_CLASSES: MultiPartParser/
      // FormParser are plain, unwrapped), so these keys must match the
      // School model's raw snake_case field names, not the camelCase
      // used in this component's own state.
      const FIELD_NAME_MAP = {
        shortCode: 'short_code',
        enrollmentRequirements: 'enrollment_requirements',
        hasPreselectionTest: 'has_preselection_test',
      }
      Object.entries(formData).forEach(([key, value]) => {
        data.append(FIELD_NAME_MAP[key] || key, value)
      })
      if (logoFile) {
        data.append('logo', logoFile)
      }

      const response = await api.patchForm('/api/auth/school/', data)
      setSettings(response)
      setMsg('success:Paramètres enregistrés avec succès !')
    } catch (err) {
      // A blocking alert() here used to swallow err.message entirely and
      // hang the page (native dialogs pause the whole JS thread) - worth
      // seeing the real reason, not just "something failed".
      setMsg(`error:Erreur lors de l'enregistrement : ${err.message}`)
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-10 flex justify-center"><Spinner /></div>

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader title="Paramètres de l'école" subtitle="Modifiez les informations publiques de l'établissement" />
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          {settings?.logo && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-ink mb-2">Logo actuel</label>
              <img src={settings.logo} alt="Logo de l'école" className="h-32 w-auto object-contain bg-surface-raised rounded border border-border p-2" />
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="logo" className="block text-sm font-medium text-ink">Nouveau Logo (Optionnel)</label>
              <input type="file" id="logo" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-ink-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-ink">Nom de l'établissement</label>
              <input required type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-surface" />
            </div>

            <div>
              <label htmlFor="shortCode" className="block text-sm font-medium text-ink">Code court (ex: CSL)</label>
              <input required type="text" name="shortCode" id="shortCode" value={formData.shortCode} onChange={handleChange} className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-surface" />
            </div>

            <div>
              <label htmlFor="ifu" className="block text-sm font-medium text-ink">IFU (Optionnel)</label>
              <input type="text" name="ifu" id="ifu" value={formData.ifu} onChange={handleChange} className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-surface" />
            </div>

            <div>
              <label htmlFor="commune" className="block text-sm font-medium text-ink">Commune</label>
              <input required type="text" name="commune" id="commune" value={formData.commune} onChange={handleChange} className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-surface" />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-ink">Téléphone</label>
              <input type="text" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-surface" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-ink">Adresse complète</label>
              <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-surface" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="enrollmentRequirements" className="block text-sm font-medium text-ink">Pièces à fournir pour l'inscription</label>
              <textarea name="enrollmentRequirements" id="enrollmentRequirements" value={formData.enrollmentRequirements || ''} onChange={handleChange} rows={4} className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-surface" placeholder="Ex: Acte de naissance, relevé de notes, etc."></textarea>
            </div>

            <div className="sm:col-span-2 flex items-center">
              <input type="checkbox" name="hasPreselectionTest" id="hasPreselectionTest" checked={formData.hasPreselectionTest || false} onChange={e => setFormData(p => ({ ...p, hasPreselectionTest: e.target.checked }))} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-border rounded" />
              <label htmlFor="hasPreselectionTest" className="ml-2 block text-sm text-ink">Test de présélection requis pour l'admission</label>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-4">
            {msg && (
              <p className={`text-sm ${msg.startsWith('error:') ? 'text-danger-600' : 'text-success-600'}`}>
                {msg.slice(msg.indexOf(':') + 1)}
              </p>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
    <LetterheadSettings />
    </div>
  )
}
