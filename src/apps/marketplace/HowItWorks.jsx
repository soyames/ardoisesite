import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardBody } from '../../shared/ui/Card.jsx'

const steps = [
  {
    id: 1,
    name: 'Création de l\'École',
    description: 'Le directeur inscrit l\'école et configure les classes, les frais de scolarité, et ajoute le personnel.',
    icon: '🏫',
  },
  {
    id: 2,
    name: 'Inscription des Parents',
    description: 'Les parents se connectent, retrouvent leurs enfants grâce à leur matricule et suivent leur scolarité.',
    icon: '👨‍👩‍👧',
  },
  {
    id: 3,
    name: 'Paiements Sécurisés',
    description: 'Les frais de scolarité sont payés en ligne via Mobile Money (FedaPay). Les reçus sont instantanés.',
    icon: '💳',
  },
  {
    id: 4,
    name: 'Suivi & Bulletins',
    description: 'Accédez aux notes, aux absences et aux bulletins trimestriels directement depuis le portail.',
    icon: '📊',
  },
]

const faqs = [
  {
    question: "Comment inscrire mon école sur Ardoise ?",
    answer: "Cliquez sur 'S'inscrire' depuis la page d'accueil. En quelques minutes, vous pourrez configurer votre établissement et commencer à inviter vos enseignants et parents."
  },
  {
    question: "Quels sont les frais d'utilisation ?",
    answer: "L'inscription est gratuite. Des frais de transaction standard s'appliquent sur les paiements en ligne effectués via FedaPay (Mobile Money ou carte bancaire)."
  },
  {
    question: "Les données de mon école sont-elles sécurisées ?",
    answer: "Oui, chaque école possède sa propre base de données isolée. Les données ne sont jamais mélangées, garantissant une confidentialité totale."
  },
  {
    question: "Puis-je payer la scolarité de mon enfant depuis l'étranger ?",
    answer: "Absolument. Grâce à notre intégration avec FedaPay, vous pouvez utiliser une carte Visa/Mastercard depuis n'importe où dans le monde."
  }
]

export default function HowItWorks() {
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div className="bg-surface py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Comment ça marche ?</h2>
          <p className="mt-6 text-lg leading-8 text-ink-muted">
            Ardoise simplifie la gestion scolaire. De l'inscription aux paiements, tout est centralisé.
          </p>
        </div>

        {/* Steps Section */}
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
            {steps.map((step) => (
              <Card key={step.id} className="relative flex flex-col items-center text-center p-6 hover:-translate-y-1">
                <CardBody>
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 mx-auto text-3xl shadow-sm ring-1 ring-border">
                    {step.icon}
                  </div>
                  <dt className="text-lg font-semibold leading-7 text-ink">
                    <span className="absolute inset-0" />
                    {step.id}. {step.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-ink-muted">
                    <p className="flex-auto">{step.description}</p>
                  </dd>
                </CardBody>
              </Card>
            ))}
          </dl>
        </div>

        {/* Flow Diagram placeholder or aesthetic visual */}
        <div className="mt-20 sm:mt-24">
          <div className="relative rounded-card overflow-hidden bg-primary-900 px-6 py-20 shadow-2xl sm:px-12 sm:py-24 text-center">
            <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl mb-6">
              Prêt à moderniser votre école ?
            </h3>
            <div className="flex justify-center gap-4">
              <Link to="/register" className="rounded-control bg-accent-500 px-5 py-3 text-sm font-semibold text-primary-950 shadow-sm hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 transition-all">
                Créer une école
              </Link>
              <Link to="/contact" className="rounded-control bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all">
                Nous contacter
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-24 max-w-4xl divide-y divide-border">
          <h2 className="text-2xl font-bold leading-10 tracking-tight text-ink mb-8 text-center">Foire Aux Questions</h2>
          <dl className="space-y-6 divide-y divide-border">
            {faqs.map((faq, index) => (
              <div key={index} className="pt-6">
                <dt>
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-start justify-between text-left text-ink"
                  >
                    <span className="text-base font-semibold leading-7">{faq.question}</span>
                    <span className="ml-6 flex h-7 items-center">
                      {openFaq === index ? (
                        <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6 text-ink-muted" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      )}
                    </span>
                  </button>
                </dt>
                {openFaq === index && (
                  <dd className="mt-2 pr-12">
                    <p className="text-base leading-7 text-ink-muted">{faq.answer}</p>
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
