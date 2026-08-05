import React, { useState, useEffect } from 'react'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Icon from '../../shared/ui/Icon.jsx'

const MODULES = [
  {
    id: 'module1',
    title: 'Fondations & Vision',
    content: (
      <div className="space-y-4 text-sm text-ink-muted leading-relaxed">
        <p>
          Bienvenue dans la <strong>Ardoise Academy</strong> ! Le programme Partenaires Certifiés a été conçu
          pour construire un réseau d'experts de confiance autour de la solution Ardoise ERP.
        </p>
        <p>
          Notre vision est d'<strong>accompagner les écoles dans leur digitalisation</strong> de manière éthique,
          sans jamais exploiter ou revendre les données de leurs élèves. En tant que partenaire, vous êtes
          le relais local de cette promesse. Vous installez, vous configurez et vous formez les écoles,
          mais la donnée reste la propriété absolue de l'établissement.
        </p>
      </div>
    ),
    quiz: {
      question: "Quelle est la principale valeur du réseau de partenaires certifiés d'Ardoise ?",
      options: [
        "Vendre des serveurs coûteux aux écoles.",
        "Accompagner les écoles dans la digitalisation avec professionnalisme et éthique.",
        "Récupérer les données des écoles à des fins commerciales."
      ],
      answer: 1
    }
  },
  {
    id: 'module2',
    title: 'Architecture "Zero-Trust" & Sécurité',
    content: (
      <div className="space-y-4 text-sm text-ink-muted leading-relaxed">
        <p>
          La sécurité des données est au cœur d'Ardoise. Contrairement aux systèmes centralisés,
          Ardoise déploie une instance isolée (base de données et backend dédiés) pour chaque école.
        </p>
        <p>
          En tant que partenaire certifié, <strong>vous n'avez pas d'accès par défaut</strong> aux données des écoles
          que vous accompagnez. Pour intervenir sur le système d'une école, le directeur doit vous accorder
          explicitement un accès "Support Partenaire" temporaire ou permanent depuis son propre tableau de bord.
        </p>
        <p>
          Cette architecture "Zero-Trust" garantit que l'école garde toujours le contrôle de son ERP.
        </p>
      </div>
    ),
    quiz: {
      question: "Comment un partenaire obtient-il l'accès support à une école ?",
      options: [
        "L'école doit lui accorder l'accès explicitement via son tableau de bord.",
        "Le partenaire a accès par défaut à toutes les écoles.",
        "Il doit pirater la base de données."
      ],
      answer: 0
    }
  },
  {
    id: 'module3',
    title: 'Intégration API & Scopes',
    content: (
      <div className="space-y-4 text-sm text-ink-muted leading-relaxed">
        <p>
          Pour interagir avec le système, Ardoise propose une Edge API performante. 
          Les requêtes doivent être authentifiées via des clés API générées depuis votre portail.
        </p>
        <p>
          <strong>Clés de Test vs Live :</strong> Les clés de test (<code>sk_test_</code>) vous permettent de faire
          des requêtes sur la Sandbox sans affecter de vraies données. Les clés Live (<code>sk_live_</code>)
          pointent vers les instances de production des écoles.
        </p>
        <p>
          <strong>Portées (Scopes) :</strong> Chaque clé possède des permissions spécifiques. Par exemple, la portée 
          <code>marketplace:read</code> permet de lire le catalogue public, tandis que <code>leads:write</code> 
          autorise la création de prospects ou candidatures.
        </p>
      </div>
    ),
    quiz: {
      question: "À quoi sert la portée (scope) `leads:write` lors de la création d'une clé API ?",
      options: [
        "À lire la liste des écoles enregistrées.",
        "À envoyer un prospect école ou une candidature vers le CRM Ardoise.",
        "À supprimer une base de données."
      ],
      answer: 1
    }
  },
  {
    id: 'module4',
    title: 'Go-To-Market & Déploiement',
    content: (
      <div className="space-y-4 text-sm text-ink-muted leading-relaxed">
        <p>
          L'installation d'Ardoise pour une nouvelle école est un processus automatisé. En tant que partenaire, 
          votre objectif est d'accompagner l'école dans cette transition.
        </p>
        <p>
          Pour vous assurer que le déploiement d'une école vous soit attribué, vous devez utiliser
          votre <strong>Lien de Parrainage (Referral Link)</strong> disponible sur votre portail. 
          Lorsqu'un directeur s'inscrit via ce lien, son établissement est automatiquement rattaché à votre compte.
        </p>
      </div>
    ),
    quiz: {
      question: "Comment vous assurer qu'une nouvelle école est bien rattachée à votre profil de partenaire ?",
      options: [
        "En envoyant un email au support Ardoise après l'inscription.",
        "En utilisant votre lien de parrainage unique lors de leur inscription.",
        "Ce n'est pas possible."
      ],
      answer: 1
    }
  },
  {
    id: 'module5',
    title: 'Responsabilité Partenaire',
    content: (
      <div className="space-y-4 text-sm text-ink-muted leading-relaxed">
        <p>
          Il est crucial de comprendre la nature de notre partenariat. Ardoise fournit le logiciel ERP (en mode SaaS)
          et valide uniquement vos compétences techniques via cette académie.
        </p>
        <p>
          <strong>Indépendance :</strong> Vous agissez en tant qu'entité totalement indépendante. 
          Les contrats que vous signez avec les écoles (pour la configuration, la formation, ou la maintenance du matériel)
          n'engagent que vous. Ardoise ne peut être tenue responsable de vos actions ou de la qualité de vos prestations.
        </p>
        <p>
          Vous ne devez jamais vous présenter comme un employé direct d'Ardoise, mais bien comme un 
          <em>Partenaire Certifié Indépendant</em>.
        </p>
      </div>
    ),
    quiz: {
      question: "Quelle est votre relation juridique avec Ardoise et les écoles ?",
      options: [
        "Je suis un employé d'Ardoise et Ardoise garantit mes prestations.",
        "Je suis une entité indépendante. Ardoise n'est pas responsable de mes contrats avec les écoles.",
        "Ardoise signe les contrats de maintenance à ma place."
      ],
      answer: 1
    }
  },
  {
    id: 'module6',
    title: 'Validation Technique (Sandbox)',
    isSandbox: true,
    content: (
      <div className="space-y-4 text-sm text-ink-muted leading-relaxed">
        <p>
          Il est temps de prouver vos compétences techniques en réalisant votre première intégration API.
        </p>
        <p>
          Ardoise propose une API puissante pour synchroniser les données externes, créer des leads (prospects écoles),
          ou publier des offres d'emploi sur la Marketplace.
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-ink mt-4">
          <li>Générez une <strong>Clé de test</strong> (scope: <code>leads:write</code>) depuis la section <em>Clés API</em> de votre portail.</li>
          <li>Envoyez une requête POST vers :<br/> 
            <code className="text-xs bg-surface border border-border px-2 py-1 rounded block mt-1 w-fit">https://ardoise-api.ardoise.workers.dev/api/sandbox/leads</code>
          </li>
          <li>Utilisez l'en-tête HTTP : 
            <code className="text-xs bg-surface border border-border px-2 py-1 rounded block mt-1 w-fit">Authorization: Bearer sk_test_...</code>
          </li>
          <li>Fournissez un payload JSON valide contenant au moins : 
            <code className="text-xs bg-surface border border-border px-2 py-1 rounded block mt-1 w-fit">{`{ "name": "Mon École", "contactEmail": "contact@ecole.com" }`}</code>
          </li>
        </ol>
        <div className="mt-4 text-xs bg-primary-50 text-primary-800 p-3 rounded-card border border-primary-100 flex gap-2 items-start">
          <Icon name="info" className="shrink-0 text-primary-600" />
          <p>
            Notre backend écoute vos requêtes. Ce module sera automatiquement marqué comme complété
            dès réception de votre requête Sandbox valide.
          </p>
        </div>
      </div>
    )
  }
]

export default function DeveloperAcademy({ partnerProfile, user }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [quizError, setQuizError] = useState(false)
  const [activeModuleId, setActiveModuleId] = useState(MODULES[0].id)

  if (!partnerProfile || partnerProfile.status === 'rejected') {
    return null
  }

  // Derive completed modules arrays, ensuring backward compatibility with quizPassed and sandboxPassed
  const completedModules = [...(partnerProfile.completedModules || [])]
  if (partnerProfile.quizPassed && !completedModules.includes('module1')) completedModules.push('module1')
  if (partnerProfile.quizPassed && !completedModules.includes('module2')) completedModules.push('module2')
  if (partnerProfile.quizPassed && !completedModules.includes('module3')) completedModules.push('module3')
  if (partnerProfile.quizPassed && !completedModules.includes('module4')) completedModules.push('module4')
  if (partnerProfile.quizPassed && !completedModules.includes('module5')) completedModules.push('module5')
  if (partnerProfile.sandboxPassed && !completedModules.includes('module6')) completedModules.push('module6')

  // Auto-advance module logic
  const activeModuleIndex = MODULES.findIndex(m => m.id === activeModuleId);
  const isCurrentModuleCompleted = completedModules.includes(activeModuleId);
  
  useEffect(() => {
    // If current module is completed and there's a next module, advance to it automatically
    // (Only runs if user is still on the completed module)
    if (isCurrentModuleCompleted && activeModuleIndex < MODULES.length - 1) {
      setActiveModuleId(MODULES[activeModuleIndex + 1].id);
    }
  }, [completedModules.length, activeModuleId])

  const handleQuizSubmit = async (e, module) => {
    e.preventDefault();
    if (selectedAnswer === module.quiz.answer) {
      setQuizError(false);
      
      const updates = {
        completedModules: arrayUnion(module.id)
      };
      
      // Legacy backward compatibility
      if (module.id === 'module5') {
         updates.quizPassed = true;
         updates.quizPassedAt = new Date().toISOString();
      }

      await updateDoc(doc(db, 'certifiedPartners', user.uid), updates);
      setSelectedAnswer(null);
    } else {
      setQuizError(true);
    }
  }

  const activeModule = MODULES.find(m => m.id === activeModuleId);

  return (
    <Card className="border-primary-200 lg:col-span-2">
      <CardHeader 
        title="Ardoise Academy : Certification Technique & Éthique" 
        subtitle="Complétez ces étapes pour que votre candidature partenaire soit examinée par notre équipe." 
      />
      <CardBody>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-1/3 shrink-0 space-y-2 md:border-r border-border md:pr-6">
            {MODULES.map((m, idx) => {
              const isCompleted = completedModules.includes(m.id);
              const isLocked = !isCompleted && idx > 0 && !completedModules.includes(MODULES[idx-1].id);
              const isActive = activeModuleId === m.id;
              
              return (
                <button
                  key={m.id}
                  disabled={isLocked}
                  onClick={() => {
                    setActiveModuleId(m.id)
                    setSelectedAnswer(null)
                    setQuizError(false)
                  }}
                  className={`w-full flex items-center gap-3 p-4 text-left rounded-card transition-all duration-200 ${
                    isActive ? 'bg-primary-50 shadow-sm ring-1 ring-primary-200 scale-[1.02]' : 
                    isLocked ? 'opacity-50 cursor-not-allowed' : 
                    'hover:bg-surface-raised border border-border'
                  }`}
                >
                  <Icon 
                    name={isCompleted ? "check_circle" : isLocked ? "lock" : "radio_button_unchecked"} 
                    className={isCompleted ? "text-success-600" : isLocked ? "text-ink-muted" : isActive ? "text-primary-600" : "text-ink-muted"} 
                  />
                  <div>
                    <div className={`text-xs uppercase tracking-wider font-bold ${isActive ? 'text-primary-600' : 'text-ink-muted'}`}>Étape {idx + 1}</div>
                    <div className={`text-sm font-medium mt-0.5 ${isActive ? 'text-primary-900' : 'text-ink'}`}>{m.title}</div>
                  </div>
                </button>
              )
            })}
          </div>
          
          {/* Main Content */}
          <div className="md:w-2/3">
            {activeModule && (
              <div className="animate-fade-in space-y-6">
                <h3 className="text-xl font-bold text-ink">{activeModule.title}</h3>
                
                <div className="bg-surface-raised p-6 rounded-card border border-border shadow-sm">
                  {activeModule.content}
                </div>

                {activeModule.quiz && !completedModules.includes(activeModule.id) && (
                  <div className="bg-surface p-6 rounded-card border border-primary-100 shadow-sm ring-1 ring-primary-50">
                    <h4 className="font-bold text-ink mb-4 flex items-center gap-2">
                      <Icon name="quiz" className="text-primary-600"/> Validation des acquis
                    </h4>
                    <form onSubmit={(e) => handleQuizSubmit(e, activeModule)} className="space-y-4">
                      <p className="text-sm font-medium text-ink leading-relaxed">{activeModule.quiz.question}</p>
                      <div className="space-y-2 mt-4">
                        {activeModule.quiz.options.map((opt, i) => (
                          <label key={i} className={`flex items-start gap-3 p-3 rounded-control border cursor-pointer transition-colors ${selectedAnswer === i ? 'border-primary-500 bg-primary-50' : 'border-border hover:bg-surface-raised'}`}>
                            <input 
                              type="radio" 
                              name="quiz_answer" 
                              className="mt-0.5 text-primary-600 focus:ring-primary-500"
                              checked={selectedAnswer === i}
                              onChange={() => setSelectedAnswer(i)}
                              required
                            />
                            <span className="text-sm text-ink leading-tight">{opt}</span>
                          </label>
                        ))}
                      </div>
                      
                      {quizError && (
                        <div className="text-sm text-danger-600 bg-danger-50 p-3 rounded-control border border-danger-100 flex items-center gap-2">
                          <Icon name="error" />
                          Réponse incorrecte. Veuillez relire le contenu et réessayer.
                        </div>
                      )}

                      <div className="pt-2">
                        <Button type="submit" variant="primary" disabled={selectedAnswer === null}>
                          Soumettre ma réponse
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
                
                {completedModules.includes(activeModule.id) && !activeModule.isSandbox && (
                  <div className="text-sm text-success-800 bg-success-50 p-4 rounded-card border border-success-200 flex items-center gap-3 animate-fade-in">
                    <Icon name="verified" className="text-success-600 text-2xl" />
                    <div>
                      <div className="font-bold text-base">Module complété !</div>
                      <div className="text-success-700">Vous avez validé cette étape avec succès.</div>
                    </div>
                  </div>
                )}

                {completedModules.includes(activeModule.id) && activeModule.isSandbox && (
                  <div className="text-sm text-success-800 bg-success-50 p-4 rounded-card border border-success-200 flex items-center gap-3 animate-fade-in">
                    <Icon name="api" className="text-success-600 text-2xl" />
                    <div>
                      <div className="font-bold text-base">Intégration réussie !</div>
                      <div className="text-success-700">Nous avons bien reçu votre requête API valide sur la Sandbox.</div>
                    </div>
                  </div>
                )}
                
              </div>
            )}
            
            {completedModules.length === MODULES.length && partnerProfile.status === 'pending' && (
              <div className="mt-8 text-sm text-primary-900 bg-primary-100 border border-primary-300 p-6 rounded-card flex items-start gap-4 shadow-md animate-fade-in">
                <Icon name="verified" className="text-primary-600 text-4xl shrink-0" />
                <div>
                  <p className="font-bold text-lg">Candidature techniquement validée !</p>
                  <p className="mt-2 text-primary-800 leading-relaxed">Félicitations, vous avez complété tous les pré-requis de l'Ardoise Academy ! Notre équipe examinera votre profil (Nom, spécialités) et activera votre badge de Partenaire Certifié sous 48h.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
