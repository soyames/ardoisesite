import React, { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Icon from '../../shared/ui/Icon.jsx'

const QUIZ_QUESTIONS = [
  {
    question: "Quelle est la principale valeur du réseau de partenaires certifiés d'Ardoise ?",
    options: [
      "Vendre des serveurs coûteux aux écoles.",
      "Accompagner les écoles dans la digitalisation avec professionnalisme et éthique.",
      "Récupérer les données des écoles à des fins commerciales."
    ],
    answer: 1
  },
  {
    question: "Comment un partenaire obtient-il l'accès support à une école ?",
    options: [
      "L'école doit lui accorder l'accès explicitement via son tableau de bord.",
      "Le partenaire a accès par défaut à toutes les écoles.",
      "Il doit pirater la base de données."
    ],
    answer: 0
  }
]

export default function DeveloperAcademy({ partnerProfile, user }) {
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [passed, setPassed] = useState(false)

  if (!partnerProfile || partnerProfile.status === 'rejected') {
    return null
  }

  const handleQuizSubmit = async (e) => {
    e.preventDefault()
    let score = 0
    QUIZ_QUESTIONS.forEach((q, index) => {
      if (answers[index] === q.answer) score++
    })

    const isPassing = score === QUIZ_QUESTIONS.length
    setShowResults(true)
    setPassed(isPassing)

    if (isPassing) {
      try {
        await updateDoc(doc(db, 'certifiedPartners', user.uid), {
          quizPassed: true,
          quizPassedAt: new Date().toISOString()
        })
      } catch (err) {
        console.error("Erreur lors de la sauvegarde du score", err)
      }
    }
  }

  const isQuizPassed = partnerProfile.quizPassed || passed
  const isSandboxPassed = partnerProfile.sandboxPassed

  return (
    <Card className="border-primary-200">
      <CardHeader 
        title="Ardoise Academy : Certification Technique & Éthique" 
        subtitle="Complétez ces deux étapes pour que votre candidature partenaire soit examinée par notre équipe." 
      />
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QUIZ SECTION */}
          <div className="rounded-card bg-surface-raised border border-border p-5">
            <h3 className="font-bold text-ink flex items-center gap-2 mb-4">
              <Icon name="school" className={isQuizPassed ? "text-success-600" : "text-primary-600"} />
              Étape 1 : Quiz d'intégration
              {isQuizPassed && <Icon name="check_circle" className="text-success-600 ml-auto" />}
            </h3>
            
            {isQuizPassed ? (
              <div className="text-sm text-success-700 bg-success-50 p-3 rounded">
                Vous avez réussi le quiz d'intégration avec succès !
              </div>
            ) : (
              <form onSubmit={handleQuizSubmit} className="space-y-4">
                {QUIZ_QUESTIONS.map((q, i) => (
                  <div key={i} className="space-y-2">
                    <p className="text-sm font-medium text-ink">{i + 1}. {q.question}</p>
                    {q.options.map((opt, optIndex) => (
                      <label key={optIndex} className="flex items-start gap-2 text-sm">
                        <input 
                          type="radio" 
                          name={`q${i}`} 
                          className="mt-0.5" 
                          onChange={() => setAnswers({...answers, [i]: optIndex})}
                          checked={answers[i] === optIndex}
                          required
                        />
                        <span className="text-ink-muted">{opt}</span>
                      </label>
                    ))}
                  </div>
                ))}
                
                {showResults && !passed && (
                  <div className="text-sm text-danger-600 bg-danger-50 p-2 rounded">
                    Score insuffisant. Veuillez revoir vos réponses et réessayer.
                  </div>
                )}
                
                <Button size="sm" type="submit">Valider mes réponses</Button>
              </form>
            )}
          </div>

          {/* SANDBOX SECTION */}
          <div className="rounded-card bg-surface-raised border border-border p-5">
            <h3 className="font-bold text-ink flex items-center gap-2 mb-4">
              <Icon name="api" className={isSandboxPassed ? "text-success-600" : "text-primary-600"} />
              Étape 2 : Test Sandbox API
              {isSandboxPassed && <Icon name="check_circle" className="text-success-600 ml-auto" />}
            </h3>
            
            {isSandboxPassed ? (
              <div className="text-sm text-success-700 bg-success-50 p-3 rounded">
                Vous avez réussi l'intégration Sandbox !
              </div>
            ) : (
              <div className="text-sm text-ink-muted space-y-3">
                <p>Prouvez vos compétences techniques en envoyant une requête valide à notre Sandbox.</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Générez une <strong>Clé de test</strong> (scope: <code>leads:write</code>) ci-dessus.</li>
                  <li>Envoyez une requête POST vers :<br/> <code className="text-xs bg-surface border border-border px-1 py-0.5 rounded">https://ardoise-api.ardoise.workers.dev/api/sandbox/leads</code></li>
                  <li>Utilisez l'en-tête : <code className="text-xs bg-surface border px-1 py-0.5 rounded">Authorization: Bearer sk_test_...</code></li>
                  <li>Fournissez un payload JSON valide contenant <code>name</code> et <code>contactEmail</code>.</li>
                </ol>
                <p className="text-xs mt-2 text-primary-700 bg-primary-50 p-2 rounded border border-primary-100">
                  Votre profil sera automatiquement mis à jour dès la réception d'une requête Sandbox réussie.
                </p>
              </div>
            )}
          </div>
        </div>

        {isQuizPassed && isSandboxPassed && partnerProfile.status === 'pending' && (
          <div className="mt-6 text-sm text-primary-800 bg-primary-100 border border-primary-200 p-4 rounded-card flex items-start gap-3">
            <Icon name="verified" className="text-primary-600 text-xl shrink-0" />
            <div>
              <p className="font-bold">Candidature techniquement validée</p>
              <p className="mt-1">Félicitations, vous avez complété les pré-requis ! Notre équipe examinera votre profil (Nom, spécialités) et activera votre badge de Partenaire Certifié sous 48h.</p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
