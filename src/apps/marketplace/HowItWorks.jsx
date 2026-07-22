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

const flowDiagram = [
  { label: 'Inscription', detail: 'L\'école s\'inscrit en quelques minutes' },
  { label: 'Invitations', detail: 'Le personnel et les parents rejoignent avec un code' },
  { label: 'Connexion', detail: 'Chacun se connecte avec son propre compte' },
  { label: 'Usage quotidien', detail: 'Notes, présences, paiements, bulletins' },
]

const faqs = [
  {
    question: 'Comment inscrire mon école sur Ardoise ?',
    answer: "Cliquez sur « S'inscrire » depuis la page d'accueil. En quelques minutes, vous pourrez configurer votre établissement et commencer à inviter vos enseignants et parents.",
  },
  {
    question: 'Les données de mon école sont-elles vraiment isolées ?',
    answer: "Oui. Chaque école possède sa propre base de données sur son propre ordinateur ou serveur. Ardoise n'héberge et ne peut consulter aucune donnée d'élève, de note ou de paiement - voir la section ci-dessus pour le détail.",
  },
  {
    question: "Que se passe-t-il si l'ordinateur ou le serveur de l'école tombe en panne ou est volé ?",
    answer: "Vos données vivent uniquement sur votre machine, donc une sauvegarde régulière (hebdomadaire suffit pour la plupart des écoles) est votre responsabilité - notre guide d'installation explique comment en quelques clics. C'est la contrepartie honnête de l'isolation totale : personne d'autre que vous ne détient de copie.",
  },
  {
    question: 'Ai-je besoin d\'une connexion internet en permanence ?',
    answer: "Non pour l'usage quotidien : le serveur tourne sur le réseau local de l'école, donc les enseignants et le personnel y accèdent même hors ligne. Internet n'est nécessaire que pour la synchronisation de licence et l'envoi de notifications WhatsApp aux parents.",
  },
  {
    question: "Quels sont les frais d'utilisation ?",
    answer: "L'inscription est gratuite et couvre la gestion des élèves, présences et frais de base. Certaines fonctionnalités avancées (paiement Mobile Money, notifications WhatsApp automatiques) nécessitent un abonnement payant. Aucune fonctionnalité payante ne s'active sans votre accord explicite.",
  },
  {
    question: 'Puis-je payer la scolarité de mon enfant depuis l\'étranger ?',
    answer: 'Absolument. Grâce à notre intégration avec FedaPay, vous pouvez utiliser Mobile Money ou une carte Visa/Mastercard depuis n\'importe où dans le monde.',
  },
  {
    question: "Combien de temps pour obtenir de l'aide en cas de problème ?",
    answer: 'Notre équipe de support répond aux demandes envoyées via le formulaire de contact. Chaque demande devient un ticket suivi jusqu\'à sa résolution - vous pouvez nous écrire à tout moment depuis la page Contact.',
  },
  {
    question: 'Puis-je récupérer mes données si je change de solution plus tard ?',
    answer: 'Oui. Vos données restent dans votre propre base (SQLite ou PostgreSQL), exportable directement à tout moment. Il n\'y a aucun verrouillage propriétaire : rien de ce que vous possédez ne dépend d\'Ardoise pour continuer à exister.',
  },
]

export default function HowItWorks() {
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div className="bg-surface py-24 sm:py-32">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Comment ça marche ?</h2>
          <p className="mt-6 text-lg leading-8 text-ink-muted">
            Ardoise simplifie la gestion scolaire. De l'inscription aux paiements, tout est centralisé.
          </p>
          <p className="mt-4 text-sm text-ink-muted">
            Vous êtes parent ou enseignant&nbsp;? Votre école doit d'abord s'inscrire - vous recevrez ensuite
            un code d'invitation de sa part pour créer votre propre compte.
          </p>
        </div>

        {/* Trust section - leads with the strongest differentiator instead of burying it in the FAQ */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="rounded-card border border-border bg-surface-raised shadow-card overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="p-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-lg ring-1 ring-border">
                  🔒
                </div>
                <h3 className="text-lg font-semibold text-ink">Ce que nous ne voyons jamais</h3>
                <p className="mt-2 text-sm text-ink-muted">
                  Chaque école héberge sa propre base de données, sur son propre ordinateur ou serveur.
                  Ardoise ne possède aucune base centrale - les notes, présences, dossiers financiers et
                  bulletins de votre école ne quittent jamais votre machine.
                </p>
              </div>
              <div className="p-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-lg ring-1 ring-border">
                  🤝
                </div>
                <h3 className="text-lg font-semibold text-ink">Et pourtant, nous vous accompagnons</h3>
                <p className="mt-2 text-sm text-ink-muted">
                  Notre équipe de support suit vos demandes via un vrai système de tickets, vous guide pour
                  l'installation et le dépannage, et reste joignable par WhatsApp ou par notre{' '}
                  <Link to="/contact" className="font-medium text-primary-600 hover:text-primary-500">formulaire de contact</Link>.
                  Nous vous aidons sans jamais avoir besoin de voir vos données.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Steps Section */}
        <div className="mx-auto mt-20 max-w-2xl sm:mt-24 lg:max-w-none">
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

        {/* Flow diagram - a real connected flow, not a placeholder banner */}
        <div className="mx-auto mt-20 max-w-5xl sm:mt-24">
          <h3 className="text-center text-2xl font-bold tracking-tight text-ink mb-10">Le parcours en un coup d'œil</h3>
          <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-8 md:gap-4">
            <div
              className="absolute left-6 top-6 bottom-6 w-px bg-border md:left-0 md:right-0 md:top-6 md:h-px md:w-auto md:bottom-auto"
              aria-hidden="true"
            />
            {flowDiagram.map((node, index) => (
              <div key={node.label} className="relative flex md:flex-1 md:flex-col items-start md:items-center gap-4 md:gap-3 md:text-center">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white shadow-elevated">
                  {index + 1}
                </div>
                <div className="md:mt-2">
                  <p className="text-sm font-semibold text-ink">{node.label}</p>
                  <p className="mt-1 text-sm text-ink-muted md:max-w-[10rem]">{node.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 sm:mt-24">
          <div className="relative rounded-card overflow-hidden bg-primary-900 px-6 py-20 shadow-2xl sm:px-12 sm:py-24 text-center">
            <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl mb-6">
              Prêt à moderniser votre école ?
            </h3>
            <div className="flex justify-center gap-4">
              <a href="https://saas.ardoiseeduc.com/register" className="rounded-control bg-accent-500 px-5 py-3 text-sm font-semibold text-primary-950 shadow-sm hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 transition-all">
                Créer une école
              </a>
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
