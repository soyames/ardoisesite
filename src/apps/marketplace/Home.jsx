import { Link } from 'react-router-dom'
import Icon from '../../shared/ui/Icon.jsx'
import { OHADA_COUNTRIES } from '../../shared/constants/locations.js'
import { useSeo } from '../../shared/hooks/useSeo.js'

const FLAGS = {
  BEN: '🇧🇯', BFA: '🇧🇫', CMR: '🇨🇲', CAF: '🇨🇫', COM: '🇰🇲',
  COG: '🇨🇬', COD: '🇨🇩', CIV: '🇨🇮', GAB: '🇬🇦', GIN: '🇬🇳',
  GNB: '🇬🇼', GNQ: '🇬🇶', MLI: '🇲🇱', NER: '🇳🇪', SEN: '🇸🇳',
  TCD: '🇹🇩', TGO: '🇹🇬',
}

export default function Home() {
  useSeo({
    title: "Ecoles et tuteurs dans l'espace OHADA (17 pays) | Ardoise",
    description: "Decouvrez les meilleures ecoles et tuteurs a domicile dans les 17 pays de l'espace SYSOHADA. Annuaire, classements, mise en relation directe - Ardoise, la plateforme educative.",
  })

  return (
    <div className="flex flex-col bg-surface">

      {/* ---- HERO ---- */}
      <section
        className="relative flex items-center overflow-hidden bg-primary-950 py-24 sm:py-32"
        style={{
          backgroundImage: "url('/images/hero-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, oklch(0.12 0.006 67.3 / 0.88) 0%, oklch(0.18 0.008 67.3 / 0.80) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-control border border-white/20 bg-primary-900/50 py-2 pl-3 pr-4 text-sm font-semibold text-accent-300 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden="true" />
            17 pays OHADA - Une plateforme, toute l'education
          </div>
          <h1 className="font-sans text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            L'excellence educative,<br />
            <span className="text-accent-500">a portee de clic</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-primary-200 sm:text-lg">
            Ardoise connecte les parents, les ecoles, les enseignants et les partenaires educatifs
            dans un ecosysteme unique. Trouvez une ecole, inscrivez vos enfants, recrutez des
            professeurs -- tout depuis une seule plateforme, concue pour l'espace OHADA.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/schools" className="inline-flex items-center gap-1.5 rounded-control bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-500 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.58_0.104_62_/_0.3)]">
              <Icon name="search" className="text-lg" />
              Explorer les ecoles
            </Link>
            <Link to="/teachers" className="inline-flex items-center gap-1.5 rounded-control border border-white/25 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 hover:border-white/40">
              <Icon name="group" className="text-lg" />
              Voir les enseignants
            </Link>
            <Link to="/register" className="inline-flex items-center gap-1.5 rounded-control bg-primary-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 hover:-translate-y-0.5">
              Inscrire mon ecole - gratuit
            </Link>
          </div>
        </div>
      </section>

      {/* ---- STATS ---- */}
      <div className="flex flex-wrap justify-center gap-8 border-b border-border bg-surface-raised px-6 py-10 sm:gap-14">
        {[
          { num: '17', accent: true, label: 'Couverture OHADA complete', unit: 'pays' },
          { num: '4', accent: false, label: 'Passerelles de paiement' },
          { num: '0', accent: true, label: 'ERP gratuit a vie', unit: 'FCFA' },
          { num: 'PWA', accent: false, label: 'Applications telechargeables', unit: '' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-3xl font-extrabold text-ink leading-none">
              {s.unit ? <span className="text-accent-600">{s.num}</span> : s.num}
              {s.unit && <span className="ml-0.5 text-base font-semibold text-ink-muted">{s.unit}</span>}
            </div>
            <div className="mt-1 text-sm text-ink-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ---- POUR QUI ---- */}
      <section className="mx-auto w-full max-w-[1600px] px-6 py-24 sm:py-32 lg:px-12">
        <span className="text-xs font-bold uppercase tracking-wider text-accent-600">Pour qui ?</span>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Une plateforme, quatre communautes</h2>
        <p className="mt-3 max-w-xl text-ink-muted">
          Ardoise sert tous les acteurs de l'education dans l'espace OHADA -- du parent
          qui cherche une ecole au fondateur qui gere son etablissement.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { emoji: '👨‍👩‍👧‍👦', title: 'Parents', desc: 'Explorez les ecoles et tuteurs de votre pays sur une carte interactive. Comparez les cycles, les frais et les classes disponibles. Inscrivez vos enfants et payez les frais en ligne, en toute securite.', link: '/schools', linkLabel: 'Parcourir les ecoles', accent: 'bg-success-500' },
            { emoji: '🏫', title: 'Ecoles', desc: 'Un ERP complet et gratuit : finances, ressources humaines, vie scolaire, emplois du temps, cantine, bibliotheque. Votre etablissement sur la carte OHADA, visible par des milliers de parents.', link: '/register', linkLabel: 'Inscrire mon ecole', accent: 'bg-info-500' },
            { emoji: '📚', title: 'Enseignants & Tuteurs', desc: 'Creez votre profil public, fixez vos tarifs, et soyez decouvert par des parents dans tout le pays. Boostez votre visibilite et enseignez ce que vous aimez, en presentiel ou a distance.', link: '/register', linkLabel: 'Creer mon profil', accent: 'bg-accent-500' },
            { emoji: '🤝', title: 'Partenaires certifies', desc: "Integrateurs, editeurs, cabinets comptables : rejoignez le reseau certifie Ardoise. Accedez a l'API publique, formez-vous a l'Academie, et accompagnez les ecoles dans leur transition numerique.", link: '/partenaires', linkLabel: 'Decouvrir le reseau', accent: 'bg-purple-500' },
          ].map((card) => (
            <div key={card.title} className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface-raised p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated">
              <div className={`absolute inset-x-0 top-0 h-1 ${card.accent}`} />
              <span className="mt-2 text-3xl">{card.emoji}</span>
              <h3 className="mt-4 text-lg font-bold text-ink">{card.title}</h3>
              <p className="mt-2 flex-1 text-sm text-ink-muted leading-relaxed">{card.desc}</p>
              <Link to={card.link} className="mt-4 text-sm font-semibold text-accent-600 hover:underline">
                {card.linkLabel} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ---- COMMENT CA MARCHE ---- */}
      <section className="bg-surface-raised py-24 sm:py-32">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
          <span className="text-xs font-bold uppercase tracking-wider text-accent-600">Demarrage</span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Comment ca marche</h2>
          <p className="mt-3 max-w-xl text-ink-muted">
            Que vous soyez une ecole, un parent ou un tuteur, demarrer avec Ardoise prend moins de 5 minutes.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { num: '1', title: 'Creez votre compte', desc: 'Inscrivez-vous gratuitement en tant que parent, ecole, enseignant ou partenaire.' },
              { num: '2', title: 'Configurez votre profil', desc: 'Les ecoles deploient leur ERP en un clic. Les tuteurs renseignent leurs matieres et tarifs.' },
              { num: '3', title: 'Apparaissez sur la carte', desc: 'Votre etablissement ou profil est visible sur la carte interactive des 17 pays OHADA.' },
              { num: '4', title: 'Connectez et gerez', desc: 'Les parents inscrivent leurs enfants, les ecoles traitent les admissions, les tuteurs recoivent des demandes.' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-accent-100 text-base font-extrabold text-accent-700">
                  {step.num}
                </div>
                <h4 className="mt-4 font-bold text-ink">{step.title}</h4>
                <p className="mt-1 text-sm text-ink-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 17 PAYS ---- */}
      <section className="bg-primary-950 py-24 sm:py-32">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
          <span className="text-xs font-bold uppercase tracking-wider text-accent-400">Couverture</span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">17 pays, une seule plateforme</h2>
          <p className="mt-3 max-w-xl text-primary-300">
            Ardoise couvre l'integralite de l'espace OHADA. Chaque pays dispose de sa
            carte interactive, de ses ecoles et de ses tuteurs. Les parents ne voient
            que les donnees de leur pays.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {OHADA_COUNTRIES.map((c) => (
              <div
                key={c.code}
                className="rounded-[10px] border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium text-primary-300 transition hover:border-accent-500 hover:bg-white/10 hover:text-white"
              >
                <span className="mb-1 block text-xl">{FLAGS[c.code] || '📍'}</span>
                {c.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- FONCTIONNALITES ---- */}
      <section className="mx-auto w-full max-w-[1600px] px-6 py-24 sm:py-32 lg:px-12">
        <span className="text-xs font-bold uppercase tracking-wider text-accent-600">Fonctionnalites</span>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Tout ce dont vous avez besoin</h2>
        <p className="mt-3 max-w-xl text-ink-muted">
          Ardoise combine un ERP scolaire complet avec une marketplace de l'education,
          le tout accessible depuis n'importe quel navigateur ou application mobile.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: 'map', iconBg: 'bg-success-50', title: 'Carte interactive', desc: 'Explorez ecoles et tuteurs par pays, departement et commune avec les itineraires OpenStreetMap.' },
            { icon: 'payments', iconBg: 'bg-info-50', title: 'Paiements integres', desc: "FedaPay, CinetPay, Orange Money, Airtel Money. Les parents paient les frais directement a l'ecole." },
            { icon: 'description', iconBg: 'bg-accent-100', title: 'Admissions en ligne', desc: "Les parents deposent un dossier, l'ecole l'examine, le paiement declenche l'inscription." },
            { icon: 'finance', iconBg: 'bg-purple-50', title: 'ERP complet', desc: 'Finances OHADA, paie RH, vie scolaire, emplois du temps, cantine -- gratuit a vie.' },
            { icon: 'videocam', iconBg: 'bg-success-50', title: 'Appels video', desc: 'Cours de soutien et rendez-vous parent-professeur par video integree dans la plateforme.' },
            { icon: 'verified_user', iconBg: 'bg-info-50', title: 'Conforme OHADA', desc: "Grand-livre immuable, piste d'audit, reconnaissance du revenu -- conformite SYSCOHADA integree." },
            { icon: 'smartphone', iconBg: 'bg-accent-100', title: 'Application PWA', desc: 'Installez Ardoise sur votre telephone ou ordinateur. Fonctionne hors-ligne, se met a jour automatiquement.' },
            { icon: 'terminal', iconBg: 'bg-purple-50', title: 'API publique', desc: "Integrateurs et editeurs : une API REST documentee et un serveur MCP pour l'IA." },
          ].map((f) => (
            <div key={f.title} className="flex gap-3 rounded-card border border-border bg-surface-raised p-4 shadow-card">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-xl ${f.iconBg}`}>
                <Icon name={f.icon} className="text-lg" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">{f.title}</h4>
                <p className="mt-0.5 text-xs text-ink-muted leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- ENTERPRISE ---- */}
      <section className="bg-surface-raised py-24 sm:py-32">
        <div className="mx-auto max-w-[1600px] px-6 text-center lg:px-12">
          <span className="text-xs font-bold uppercase tracking-wider text-accent-600">Ardoise Enterprise</span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">L'ERP gratuit. Les modules avances a 50 000 FCFA/an.</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-muted">
            Academique, personnel, marketplace : gratuits a vie. Finance SYSCOHADA, paie RH,
            caisse/point de vente et BI analytique : debloques avec Ardoise Enterprise.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-8 text-left">
            <div>
              <div className="mb-3 font-bold text-success-600">✓ Gratuit pour toujours</div>
              <ul className="space-y-2 text-sm text-ink-muted">
                <li>📚 Gestion academique</li>
                <li>👥 Gestion du personnel</li>
                <li>🌍 Presence sur la marketplace</li>
                <li>📱 Application PWA</li>
                <li>🔌 Acces a l'API</li>
              </ul>
            </div>
            <div>
              <div className="mb-3 font-bold text-accent-600">⚡ Enterprise - 50 000 FCFA/an</div>
              <ul className="space-y-2 text-sm text-ink-muted">
                <li>💰 Comptabilite SYSCOHADA</li>
                <li>💳 Paie et RH avancees</li>
                <li>🛒 Caisse & point de vente</li>
                <li>📈 Analytique & BI</li>
                <li>Tout le catalogue gratuit +</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---- TEMOIGNAGES ---- */}
      <section className="mx-auto w-full max-w-[1600px] px-6 py-24 sm:py-32 lg:px-12">
        <span className="text-xs font-bold uppercase tracking-wider text-accent-600">Ils utilisent Ardoise</span>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Construit pour les ecoles africaines</h2>
        <p className="mt-3 max-w-xl text-ink-muted">
          Congu par des ingenieurs et educateurs ouest-africains, Ardoise repond aux
          besoins reels des etablissements de l'espace OHADA.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { quote: '"Ardoise a transforme la gestion de mon etablissement. La comptabilite OHADA integree nous fait gagner des heures chaque mois. Et l\'inscription en ligne a attire de nouvelles familles."', author: "Fondateur d'etablissement", role: 'Lome, Togo' },
            { quote: '"En tant que parent, trouver une ecole pres de chez moi avec les bons cycles et des frais clairs a change ma vie. J\'ai inscrit mes deux enfants en une soiree, sans me deplacer."', author: "Parent d'eleve", role: 'Cotonou, Benin' },
            { quote: '"Le programme partenaire certifie Ardoise m\'a permis de developper mon activite d\'integrateur dans trois pays. L\'API est bien documentee et l\'equipe est reactive."', author: 'Partenaire certifie', role: 'Douala, Cameroun' },
          ].map((t) => (
            <div key={t.author} className="rounded-card border border-border bg-surface-raised p-6 shadow-card">
              <p className="text-sm text-ink-muted italic leading-relaxed">{t.quote}</p>
              <p className="mt-4 text-sm font-bold text-ink">{t.author}</p>
              <p className="text-xs text-primary-400">{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="bg-primary-950 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-accent-400">Pret a demarrer ?</span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Rejoignez la plateforme educative de l'espace OHADA</h2>
          <p className="mx-auto mt-3 max-w-lg text-primary-300">
            Gratuit pour les parents et les enseignants. ERP gratuit a vie pour les ecoles.
            Modules avances a 50 000 FCFA/an. Aucun frais cache.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register" className="inline-flex items-center rounded-control bg-accent-600 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-accent-500 hover:-translate-y-0.5">
              Creer un compte gratuit
            </Link>
            <Link to="/schools" className="inline-flex items-center rounded-control bg-primary-800 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-primary-700 hover:-translate-y-0.5">
              Explorer les ecoles
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
