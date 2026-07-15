import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import Button from '../../shared/ui/Button.jsx'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    school: '',
    subject: '',
    message: ''
  })
  const [status, setStatus] = useState('idle')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) return
    setStatus('submitting')
    try {
      await addDoc(collection(db, 'support_tickets'), {
        ...formData,
        ticket_status: 'open',
        createdAt: serverTimestamp()
      })
      setStatus('success')
      setFormData({ name: '', email: '', school: '', subject: '', message: '' })
    } catch (error) {
      console.error("Erreur lors de l'envoi :", error)
      setStatus('error')
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-2xl text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Contactez le Support</h2>
        <p className="mt-2 text-lg leading-8 text-ink-muted">
          Vous rencontrez un problème avec Ardoise ? Notre équipe est là pour vous aider.
        </p>
      </div>

      <Card>
        <CardBody>
          {status === 'success' ? (
            <div className="text-center py-10">
              <h3 className="text-xl font-medium text-success-700">Message envoyé !</h3>
              <p className="mt-2 text-ink-muted">
                Nous avons bien reçu votre demande de support. Un membre de notre équipe vous contactera sous peu.
              </p>
              <Button onClick={() => setStatus('idle')} className="mt-6" variant="primary">
                Envoyer un autre message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold leading-6 text-ink">
                    Nom complet
                  </label>
                  <div className="mt-2.5">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="block w-full rounded-control border-0 px-3.5 py-2 text-ink shadow-sm ring-1 ring-inset ring-border placeholder:text-ink-muted focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 bg-surface-raised"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold leading-6 text-ink">
                    Adresse email
                  </label>
                  <div className="mt-2.5">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="block w-full rounded-control border-0 px-3.5 py-2 text-ink shadow-sm ring-1 ring-inset ring-border placeholder:text-ink-muted focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 bg-surface-raised"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="school" className="block text-sm font-semibold leading-6 text-ink">
                    École concernée (Optionnel)
                  </label>
                  <div className="mt-2.5">
                    <input
                      type="text"
                      name="school"
                      id="school"
                      value={formData.school}
                      onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                      className="block w-full rounded-control border-0 px-3.5 py-2 text-ink shadow-sm ring-1 ring-inset ring-border placeholder:text-ink-muted focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 bg-surface-raised"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="subject" className="block text-sm font-semibold leading-6 text-ink">
                    Sujet
                  </label>
                  <div className="mt-2.5">
                    <input
                      type="text"
                      name="subject"
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="block w-full rounded-control border-0 px-3.5 py-2 text-ink shadow-sm ring-1 ring-inset ring-border placeholder:text-ink-muted focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 bg-surface-raised"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="message" className="block text-sm font-semibold leading-6 text-ink">
                    Message
                  </label>
                  <div className="mt-2.5">
                    <textarea
                      name="message"
                      id="message"
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="block w-full rounded-control border-0 px-3.5 py-2 text-ink shadow-sm ring-1 ring-inset ring-border placeholder:text-ink-muted focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 bg-surface-raised"
                    />
                  </div>
                </div>
              </div>
              
              {status === 'error' && (
                <p className="text-sm text-danger-600">Une erreur est survenue lors de l'envoi. Veuillez réessayer.</p>
              )}

              <div className="mt-10 flex justify-end">
                <Button
                  type="submit"
                  disabled={status === 'submitting'}
                  variant="primary"
                  className="w-full sm:w-auto"
                >
                  {status === 'submitting' ? 'Envoi en cours...' : 'Envoyer le message'}
                </Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
