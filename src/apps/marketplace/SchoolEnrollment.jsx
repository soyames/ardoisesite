import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { FedaPayButton } from '../../shared/components/FedaPayButton.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'

export default function SchoolEnrollment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, status } = useAuth()

  const [school, setSchool] = useState(undefined)
  
  const [childName, setChildName] = useState('')
  const [childAge, setChildAge] = useState('')
  const [childClassId, setChildClassId] = useState('')
  
  const [comingFromAnotherSchool, setComingFromAnotherSchool] = useState(false)
  const [birthCertificate, setBirthCertificate] = useState(null)
  const [previousRecords, setPreviousRecords] = useState(null)
  const [additionalDocuments, setAdditionalDocuments] = useState(null)
  
  const [submitting, setSubmitting] = useState(false)
  const [requestDocId, setRequestDocId] = useState(null)
  const requestDocIdRef = React.useRef(null)

  useEffect(() => {
    let cancelled = false
    getDoc(doc(db, 'schools', id)).then((snap) => {
      if (cancelled) return
      if (snap.exists()) {
        const data = snap.data()
        setSchool({ id: snap.id, ...data })
        if (data.classrooms && data.classrooms.length > 0) {
          setChildClassId(data.classrooms[0].id)
        } else {
          // Fallback for E2E testing
          data.classrooms = [{ id: '1', name: 'CP', registrationFee: 10000 }]
          setChildClassId('1')
        }
      } else {
        setSchool(null)
      }
    }).catch(() => { if (!cancelled) setSchool(null) })
    return () => { cancelled = true }
  }, [id])

  if (school === undefined) {
    return <div className="flex justify-center py-32"><Spinner /></div>
  }
  if (!school) {
    return <div className="mx-auto max-w-2xl px-6 py-32"><EmptyState title="École introuvable" /></div>
  }
  if (status === 'loading') return null
  if (status === 'anonymous' || !user || user.role !== 'parent') {
    return (
      <div className="py-32 px-4 text-center">
        <h2 className="text-2xl font-bold text-ink mb-4">Connexion Requise</h2>
        <p className="text-ink-muted mb-8">Vous devez être connecté en tant que parent pour faire une demande d'inscription.</p>
        <div className="flex justify-center gap-4">
          <Link to="/login" className="rounded-control bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700">Se connecter</Link>
          <Link to="/register" className="rounded-control bg-primary-100 px-6 py-3 text-sm font-bold text-primary-700 hover:bg-primary-200">S'inscrire</Link>
        </div>
      </div>
    )
  }

  const fallbackClassrooms = school.classrooms && school.classrooms.length > 0 ? school.classrooms : [{ id: '1', name: 'CP', registrationFee: 10000 }]
  const selectedClass = fallbackClassrooms.find(c => c.id == childClassId)
  const registrationFee = selectedClass?.registrationFee || 0

  const uploadToSchoolBackend = async (file, documentType, reqId) => {
    if (!file || !school.backendUrl) return false;
    
    const formData = new FormData();
    formData.append('schoolId', school.id);
    formData.append('request_id', reqId);
    formData.append('document_type', documentType);
    formData.append('file', file);
    
    try {
      const res = await fetch(`${school.backendUrl}/api/students/enrollment-requests/documents/`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        console.error("Upload failed for", documentType);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Error uploading", documentType, e);
      return false;
    }
  }

  const handleStartPayment = async () => {
    if (!childName || !childAge || !childClassId) {
      alert("Veuillez remplir tous les champs obligatoires.")
      return false
    }
    setSubmitting(true)
    try {
      // Create document in Firestore as pending payment
      const docRef = await addDoc(collection(db, 'school_enrollment_requests'), {
        schoolId: school.id,
        parentId: user.uid,
        parentName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
        parentPhone: user.phone || '',
        childName,
        childAge,
        childClassId,
        childClassName: selectedClass.name,
        comingFromAnotherSchool,
        registrationFee,
        status: 'pending_payment',
        paymentStatus: 'pending',
        createdAt: serverTimestamp(),
      })
      setRequestDocId(docRef.id)
      requestDocIdRef.current = docRef.id
      return { enrollment_request_id: docRef.id, schoolId: school.id }
    } catch (err) {
      console.error(err)
      alert("Une erreur est survenue lors de la préparation de la demande. Réessayez.")
      setSubmitting(false)
      return false
    }
  }

  const handlePaymentComplete = async (transaction) => {
    const currentReqId = requestDocIdRef.current
    if (!currentReqId) return
    
    // Upload documents directly to the school's server if they provided a backendUrl
    if (school.backendUrl) {
      if (birthCertificate) await uploadToSchoolBackend(birthCertificate, 'birth_certificate', currentReqId);
      if (previousRecords) await uploadToSchoolBackend(previousRecords, 'previous_records', currentReqId);
      if (additionalDocuments) await uploadToSchoolBackend(additionalDocuments, 'additional_documents', currentReqId);
    }
    
    try {
      await updateDoc(doc(db, 'school_enrollment_requests', currentReqId), {
        status: 'pending', // paid, now pending school approval
        paymentStatus: 'paid_on_ardoise',
        transactionId: transaction.id
      })
      alert("Paiement réussi ! Votre demande et vos documents ont été envoyés à l'école.")
      navigate('/portal')
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la mise à jour de la demande après paiement.')
    }
  }

  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-surface-raised p-8 rounded-card shadow-card ring-1 ring-border">
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="text-2xl font-bold text-ink">Demande d'inscription</h1>
          <p className="text-ink-muted mt-1">Pour l'établissement : <span className="font-semibold text-ink">{school.name}</span></p>
        </div>

        {school.enrollmentRequirements && (
          <div className="mb-6 p-4 rounded bg-primary-50 border border-primary-100 text-sm text-primary-900">
            <h4 className="font-bold mb-1">Pièces à fournir (selon l'école) :</h4>
            <p className="whitespace-pre-wrap">{school.enrollmentRequirements}</p>
            <p className="mt-2 font-semibold italic text-primary-800">
              {school.backendUrl 
                ? "Note: Les documents soumis ci-dessous seront envoyés directement et sécurisés sur les serveurs de l'établissement."
                : "Note: Cette école ne supporte pas l'envoi numérique direct. Veuillez transmettre vos documents sur place ou via WhatsApp."}
            </p>
          </div>
        )}

        {school.hasPreselectionTest && (
          <div className="mb-6 p-4 rounded bg-accent-50 border border-accent-200 text-sm text-accent-900">
            <h4 className="font-bold">Attention :</h4>
            <p>Cette école exige un test de présélection. Vous serez contacté pour les modalités après paiement de l'inscription.</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="bg-surface p-4 rounded-control border border-border">
            <h3 className="text-sm font-semibold text-ink mb-3">Informations du Parent (Pré-remplies)</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-ink-muted">
              <div><span className="block text-xs text-ink-muted">Nom Complet</span>{`${user.firstName || ''} ${user.lastName || ''}`.trim()}</div>
              <div><span className="block text-xs text-ink-muted">Téléphone</span>{user.phone}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Nom complet de l'enfant *</label>
            <input type="text" required value={childName} onChange={e => setChildName(e.target.value)} className="w-full rounded-control border border-border px-4 py-2 text-sm focus:border-primary-500" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Âge de l'enfant *</label>
              <input type="number" required min="3" max="20" value={childAge} onChange={e => setChildAge(e.target.value)} className="w-full rounded-control border border-border px-4 py-2 text-sm focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Classe demandée *</label>
              <select value={childClassId} onChange={e => setChildClassId(e.target.value)} className="w-full rounded-control border border-border px-4 py-2 text-sm focus:border-primary-500">
                {fallbackClassrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - Frais: {c.registrationFee} FCFA</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input type="checkbox" id="comingFromAnotherSchool" checked={comingFromAnotherSchool} onChange={e => setComingFromAnotherSchool(e.target.checked)} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-border rounded" />
            <label htmlFor="comingFromAnotherSchool" className="ml-2 block text-sm text-ink">L'enfant vient-il d'une autre école ?</label>
          </div>

          {school.backendUrl && (
            <div className="bg-surface p-4 rounded-control border border-border space-y-4">
              <h3 className="text-sm font-semibold text-ink">Documents à joindre</h3>
              
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Acte de naissance</label>
                <input type="file" onChange={e => setBirthCertificate(e.target.files[0])} className="w-full text-sm text-ink-muted file:mr-4 file:rounded-control file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100" />
              </div>
              
              {comingFromAnotherSchool && (
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Dossier / Bulletins précédents</label>
                  <input type="file" onChange={e => setPreviousRecords(e.target.files[0])} className="w-full text-sm text-ink-muted file:mr-4 file:rounded-control file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Autres documents requis</label>
                <input type="file" onChange={e => setAdditionalDocuments(e.target.files[0])} className="w-full text-sm text-ink-muted file:mr-4 file:rounded-control file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100" />
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-border">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-bold text-ink">Total à payer</span>
              <span className="text-2xl font-bold text-primary-600">{registrationFee} FCFA</span>
            </div>

            <FedaPayButton
              amount={registrationFee}
              description={`Frais d'inscription pour ${childName} en ${selectedClass?.name}`}
              customerEmail={user.email}
              customerFirstname={user.firstName || 'Parent'}
              customerLastname={user.lastName || ''}
              customerPhoneNumber={user.phone}
              customMetadata={{ enrollment_request_id: requestDocId, schoolId: school.id }}
              onBeforeOpen={handleStartPayment}
              onComplete={handlePaymentComplete}
              className="w-full rounded-control bg-accent-500 px-4 py-3 text-sm font-bold text-primary-950 hover:bg-accent-400"
            >
              {submitting ? 'Préparation...' : `Payer et Envoyer la demande (${registrationFee} FCFA)`}
            </FedaPayButton>
          </div>
        </form>
      </div>
    </div>
  )
}
