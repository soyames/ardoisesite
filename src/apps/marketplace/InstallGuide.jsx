import React, { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'

function CodeBlock({ children }) {
  return (
    <div className="bg-primary-950 rounded-card p-4 overflow-x-auto">
      <pre className="text-sm text-green-400 whitespace-pre-wrap break-words">
        <code>{children}</code>
      </pre>
    </div>
  )
}

function Callout({ tone = 'info', title, children }) {
  const styles = {
    info: 'bg-primary-50 ring-primary-200 text-primary-900',
    warning: 'bg-warning-50 ring-warning-500/30 text-warning-700',
    danger: 'bg-danger-50 ring-danger-500/30 text-danger-700',
  }
  return (
    <div className={`rounded-card p-4 ring-1 ${styles[tone]}`}>
      {title && <p className="font-bold mb-1">{title}</p>}
      <div className="text-sm">{children}</div>
    </div>
  )
}

const SCENARIOS = [
  {
    id: 'laptop',
    label: 'Un seul ordinateur',
    tagline: 'Le plus simple - pour démarrer aujourd\'hui',
  },
  {
    id: 'server',
    label: 'Un serveur dédié à l\'école',
    tagline: 'Toujours allumé, données protégées, sur votre réseau local',
  },
  {
    id: 'cloud',
    label: 'Un serveur cloud + nom de domaine',
    tagline: 'Pour un accès à distance (hors du réseau de l\'école)',
  },
]

export default function InstallGuide() {
  const [scenario, setScenario] = useState('laptop')
  const { user } = useAuth()
  const [activationCode, setActivationCode] = useState(null)

  useEffect(() => {
    if (user?.role !== 'founder' || !user?.schoolId) return
    let cancelled = false
    // activationCode lives in schools/{id}/secrets/config now, not on
    // the public schools/{id} doc (firestore.rules restricts that
    // subcollection to the founder of this exact school - matches the
    // role/schoolId check just above).
    getDoc(doc(db, 'schools', String(user.schoolId), 'secrets', 'config')).then((snap) => {
      if (!cancelled && snap.exists()) {
        setActivationCode(snap.data().activationCode || null)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [user?.role, user?.schoolId])

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-extrabold text-ink mb-4">Installation d'Ardoise (Pour les Écoles)</h1>

      <div className="mb-8 p-6 bg-primary-50 rounded-2xl border border-primary-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary-900 mb-1">Nouveau : L'Expérience Zéro Technique ! 🚀</h2>
          <p className="text-primary-700 text-sm">
            Vous ne voulez pas vous embêter avec des serveurs ou des lignes de commande ? 
            Souscrivez à notre offre SaaS et nous déployons votre infrastructure automatiquement.
          </p>
        </div>
        <a 
          href="https://saas.ardoiseeduc.com/"
          className="whitespace-nowrap px-6 py-3 bg-primary-600 text-white font-bold rounded-full hover:bg-primary-500 transition shadow-sm"
        >
          Découvrir l'offre SaaS
        </a>
      </div>

      <div className="mb-8 p-6 bg-surface-raised rounded-2xl border border-border flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink mb-1">Vous êtes développeur ? 💻</h2>
          <p className="text-ink-muted text-sm">
            Rejoignez notre Programme Développeur pour créer des intégrations personnalisées avec l'API Ardoise SaaS, gérer vos Webhooks, ou gagner des commissions en parrainant des écoles.
          </p>
        </div>
        <a 
          href="/register" 
          className="whitespace-nowrap px-6 py-3 bg-white text-ink border border-border font-bold rounded-full hover:bg-surface-raised transition shadow-sm"
        >
          S'inscrire comme développeur
        </a>
      </div>

      <p className="text-lg text-ink-muted mb-8">
        Ardoise utilise une architecture décentralisée : votre école héberge et possède ses
        propres données, sur son propre matériel. Il n'existe aucune base de données centrale -
        ni Ardoise, ni personne d'autre, ne peut voir les données de vos élèves ou vos finances.
        Ce guide couvre trois façons de déployer le système selon votre situation.
      </p>

      {/* ---------------------------------------------------------------- */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-ink mb-4">Quelle installation vous convient ?</h2>
        <div className="grid gap-4 sm:grid-cols-3 mb-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
              className={`text-left rounded-card p-4 ring-1 transition ${
                scenario === s.id
                  ? 'bg-primary-600 text-white ring-primary-600 shadow-elevated'
                  : 'bg-surface-raised text-ink ring-border hover:ring-primary-300'
              }`}
            >
              <p className="font-bold text-sm">{s.label}</p>
              <p className={`text-xs mt-1 ${scenario === s.id ? 'text-primary-100' : 'text-ink-muted'}`}>{s.tagline}</p>
            </button>
          ))}
        </div>
        <p className="text-sm text-ink-muted">
          Vous pouvez commencer par « Un seul ordinateur » et migrer vers un serveur plus tard -
          vos données (le dossier <code className="bg-primary-100 px-1 rounded">data/</code>) se
          copient telles quelles sur la nouvelle machine.
        </p>
      </section>

      <div className="space-y-8">

        {/* ---------------------------------------------------------------- */}
        <section>
          <h2 className="text-xl font-bold text-ink mb-4">1. Prérequis</h2>
          {scenario === 'laptop' && (
            <ul className="list-disc pl-6 space-y-2 text-ink-muted">
              <li>Un ordinateur Windows, Mac ou Linux dédié à la gestion de l'école (il n'a pas besoin d'être puissant - un ordinateur de bureau standard suffit).</li>
              <li>Une connexion internet (pour la synchronisation de licence et les envois WhatsApp) - l'école continue de fonctionner hors ligne entre deux synchronisations.</li>
              <li><strong>Docker Desktop</strong> installé sur votre machine (<a href="https://www.docker.com/products/docker-desktop/" className="text-primary-600 underline" target="_blank" rel="noreferrer">docker.com</a>).</li>
              <li>Tous les postes du personnel (caissier, secrétariat) se connectent via le Wi-Fi de l'école - pas d'accès depuis l'extérieur avec ce mode.</li>
            </ul>
          )}
          {scenario === 'server' && (
            <ul className="list-disc pl-6 space-y-2 text-ink-muted">
              <li>Un petit serveur ou mini-PC dédié, qui reste allumé en continu (un ordinateur de bureau reconverti convient très bien).</li>
              <li>Une adresse IP fixe sur le réseau de l'école (configurée sur le routeur, pour que l'adresse ne change pas).</li>
              <li><strong>Docker</strong> et <strong>Docker Compose</strong> installés (inclus avec Docker Desktop, ou <code className="bg-primary-100 px-1 rounded">docker compose</code> sur Linux).</li>
              <li>Recommandé une fois que plusieurs membres du personnel l'utilisent quotidiennement : <strong>Postgres</strong> au lieu de SQLite (voir étape 3) et une routine de sauvegarde régulière (voir étape 6).</li>
            </ul>
          )}
          {scenario === 'cloud' && (
            <ul className="list-disc pl-6 space-y-2 text-ink-muted">
              <li>Un serveur cloud (VPS) - OVH, Contabo, DigitalOcean, ou équivalent. 1 CPU / 2 Go de RAM suffit pour démarrer.</li>
              <li>Un nom de domaine que vous possédez (ex. <code className="bg-primary-100 px-1 rounded">ecole-laliberte.com</code>), avec un enregistrement DNS de type <code className="bg-primary-100 px-1 rounded">A</code> pointant vers l'IP de votre serveur.</li>
              <li><strong>Docker</strong> et <strong>Docker Compose</strong> installés sur le serveur.</li>
              <li>Un reverse proxy pour le HTTPS automatique - ce guide utilise <a href="https://caddyserver.com/" className="text-primary-600 underline" target="_blank" rel="noreferrer">Caddy</a> (le plus simple : 3 lignes de configuration, certificat renouvelé tout seul).</li>
              <li>Réservé à une école qui a besoin d'un accès à distance (personnel travaillant hors du site) - sinon, le scénario « serveur dédié » est plus simple et tout aussi sûr.</li>
            </ul>
          )}
        </section>

        {/* ---------------------------------------------------------------- */}
        <section>
          <h2 className="text-xl font-bold text-ink mb-4">2. Votre Code d'Activation</h2>
          <p className="text-ink-muted mb-4">
            Chaque école reçoit un code d'activation dès son inscription sur le portail - forfait gratuit inclus.
            C'est le seul moyen pour votre installation de se faire connaître de la Plateforme (pour que le
            marketplace puisse vous joindre). Ardoise est entièrement gratuit - ce code identifie simplement
            votre école, il ne débloque rien de payant.
          </p>
          {activationCode ? (
            <CodeBlock>{activationCode}</CodeBlock>
          ) : (
            <Callout tone="info">
              Connectez-vous avec votre compte fondateur pour afficher votre code ici automatiquement.
            </Callout>
          )}
        </section>

        {/* ---------------------------------------------------------------- */}
        <section>
          <h2 className="text-xl font-bold text-ink mb-4">3. Déploiement</h2>

          {scenario === 'laptop' && (
            <>
              <p className="text-ink-muted mb-4">Ouvrez un terminal (Invite de commandes, PowerShell, ou Terminal) et exécutez :</p>
              <CodeBlock>{`docker run -d \\
  --name ardoise-backend \\
  -p 8000:8000 \\
  -v ardoise_data:/app/data \\
  amesc/ardoise:latest`}</CodeBlock>
              <p className="text-ink-muted mt-4">
                Aucune variable à préparer à l'avance : la commande démarre le serveur tel quel. <code className="bg-primary-100 px-1 rounded">-v ardoise_data:/app/data</code> est
                important : sans ce volume, vos données seraient perdues au prochain redémarrage du conteneur.
              </p>
              <Callout tone="info" title="Trouver l'adresse de votre ordinateur">
                Les autres postes de l'école (caissier, secrétariat) doivent utiliser l'adresse IP locale de cet
                ordinateur, pas <code>localhost</code>. Sur Windows : <code>ipconfig</code> dans une invite de
                commandes, cherchez « Adresse IPv4 » (ex. <code>192.168.1.42</code>). Sur Mac/Linux :{' '}
                <code>ifconfig</code> ou <code>ip addr</code>. L'adresse à utiliser sera
                <code> http://192.168.1.42:8000</code> (remplacez par la vôtre).
              </Callout>
            </>
          )}

          {scenario === 'server' && (
            <>
              <p className="text-ink-muted mb-4">Aucun fichier à préparer à l'avance - lancez directement :</p>
              <CodeBlock>{`# SQLite (par défaut, aucune configuration supplémentaire) :
docker compose up -d

# OU avec Postgres (recommandé pour un usage quotidien par plusieurs membres du personnel) :
docker compose --profile postgres up -d`}</CodeBlock>
              <p className="text-ink-muted mt-4">
                <code className="bg-primary-100 px-1 rounded">docker-compose.yml</code> monte déjà des volumes
                persistants pour les données (et pour Postgres si vous l'utilisez) - vos données survivent à un
                redémarrage du serveur ou une mise à jour de l'image.
              </p>
            </>
          )}

          {scenario === 'cloud' && (
            <>
              <p className="text-ink-muted mb-4">
                Aucun fichier à préparer à l'avance. Lancez l'application sur votre serveur, puis ajoutez un reverse
                proxy pour le HTTPS. Avec Caddy :
              </p>
              <CodeBlock>{`# 1. Démarrer Ardoise (sans exposer le port 8000 publiquement)
docker compose --profile postgres up -d

# 2. Caddyfile (un seul fichier, HTTPS automatique via Let's Encrypt) :
#    votre-domaine.com {
#        reverse_proxy localhost:8000
#    }

# 3. Démarrer Caddy
docker run -d --name caddy -p 80:80 -p 443:443 \\
  -v $PWD/Caddyfile:/etc/caddy/Caddyfile \\
  -v caddy_data:/data \\
  caddy:2-alpine`}</CodeBlock>
              <Callout tone="warning" title="Sécurité : ne pas exposer le port 8000 directement">
                N'ouvrez pas le port 8000 sur le pare-feu de votre serveur - seuls les ports 80 et 443 (gérés par
                Caddy) doivent être publics. Le trafic entre Caddy et Ardoise reste sur la machine elle-même.
              </Callout>
            </>
          )}

          <Callout tone="info" title="Dernière étape : l'assistant dans votre navigateur">
            Ouvrez l'adresse de votre serveur dans un navigateur (ex. <code>http://localhost:8000</code>) - vous
            tombez automatiquement sur un écran « Welcome to Ardoise ». Collez-y votre code d'activation
            (étape 2 ci-dessus) et cliquez sur « Activate &amp; Provision ». Tout le reste (clé de sécurité,
            connexion à la Plateforme, certificat WebRTC) se configure automatiquement à ce moment-là - il ne vous
            reste plus qu'à redémarrer le conteneur une fois (<code>docker compose down &amp;&amp; docker compose up -d</code>,
            ou l'équivalent <code>docker restart ardoise-backend</code> pour le mode « un seul ordinateur »)
            pour que ce soit pris en compte.
          </Callout>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section>
          <h2 className="text-xl font-bold text-ink mb-4">4. Configuration avancée (optionnelle)</h2>
          <p className="text-ink-muted mb-4">
            Vous n'avez <strong>aucun fichier <code className="bg-primary-100 px-1 rounded">.env</code> à créer</strong> -
            l'assistant de l'étape 3 s'occupe de tout ce qui est indispensable (clé de sécurité, connexion à la
            Plateforme, autorisation du portail) et l'écrit lui-même dans <code className="bg-primary-100 px-1 rounded">data/config.json</code>,
            sur votre propre machine. Rien de tout cela n'est jamais envoyé à Ardoise ou à qui que ce soit d'autre.
          </p>
          <p className="text-ink-muted mb-4">
            Les options ci-dessous restent facultatives - elles ne concernent que des besoins spécifiques, et se
            configurent en ajoutant un bloc <code className="bg-primary-100 px-1 rounded">environment:</code> pour le
            service <code className="bg-primary-100 px-1 rounded">app</code> dans <code className="bg-primary-100 px-1 rounded">docker-compose.yml</code> (jamais un fichier <code className="bg-primary-100 px-1 rounded">.env</code>) :
          </p>
          <div className="overflow-x-auto rounded-card ring-1 ring-border">
            <table className="min-w-full text-sm">
              <thead className="bg-primary-100 text-left text-ink-muted">
                <tr>
                  <th className="px-4 py-2 font-semibold">Variable</th>
                  <th className="px-4 py-2 font-semibold">Quand s'en servir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-ink-muted">
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">DB_ENGINE, DB_NAME,<br/>DB_USER, DB_PASSWORD</td>
                  <td className="px-4 py-2">Laissez tout vide pour SQLite (par défaut, suffisant pour la plupart des écoles). Définissez <code>DB_ENGINE=postgres</code> + les 3 autres uniquement si vous utilisez le profil <code>--profile postgres</code>.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">WHATSAPP_CLOUD_API_TOKEN<br/>WHATSAPP_CLOUD_API_PHONE_NUMBER_ID</td>
                  <td className="px-4 py-2">Uniquement si votre forfait inclut WhatsApp et que vous avez un compte Meta Business. Sans elles, les notifications WhatsApp échouent proprement (pas d'envoi silencieux raté).</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">DJANGO_ALLOWED_HOSTS</td>
                  <td className="px-4 py-2">Par défaut <code>*</code> (tout hôte accepté) - à restreindre à votre nom de domaine uniquement si vous voulez durcir un serveur cloud exposé publiquement.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">SESSION_COOKIE_SECURE<br/>CSRF_COOKIE_SECURE</td>
                  <td className="px-4 py-2">Ne désactivez (<code>false</code>) que pour un ordinateur unique sans HTTPS. Jamais sur un serveur accessible depuis internet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section>
          <h2 className="text-xl font-bold text-ink mb-4">5. Connecter votre portail à votre école</h2>
          <p className="text-ink-muted mb-4">
            Une dernière étape, indispensable : saas.ardoiseeduc.com est un portail partagé par toutes les écoles -
            il a besoin de savoir à quelle adresse joindre <em>votre</em> serveur pour chaque membre de votre
            personnel.
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-ink-muted">
            <li>Connectez-vous en tant que Fondateur/Fondatrice sur <a href="https://saas.ardoiseeduc.com/login" className="text-primary-600 underline">saas.ardoiseeduc.com/login</a>.</li>
            <li>Allez dans <strong>Intégrations API</strong> depuis votre tableau de bord.</li>
            <li>Dans « Adresse de votre serveur », entrez l'adresse trouvée à l'étape 3 (ex. <code className="bg-primary-100 px-1 rounded">http://192.168.1.42:8000</code> ou <code className="bg-primary-100 px-1 rounded">https://votre-domaine.com</code>).</li>
            <li>Enregistrez. Tout le personnel de votre école (déjà connecté ou nouveau) sera automatiquement dirigé vers votre serveur à sa prochaine connexion - rien à configurer de leur côté.</li>
          </ol>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section>
          <h2 className="text-xl font-bold text-ink mb-4">6. Sauvegardes</h2>
          {scenario === 'laptop' && (
            <p className="text-ink-muted">
              Vos données vivent dans le volume Docker <code className="bg-primary-100 px-1 rounded">ardoise_data</code>.
              La façon la plus simple : copiez régulièrement ce dossier sur une clé USB ou un disque externe. Une
              sauvegarde hebdomadaire suffit pour la plupart des écoles ; quotidienne si vous traitez beaucoup de
              paiements.
            </p>
          )}
          {scenario !== 'laptop' && (
            <div className="space-y-3 text-ink-muted">
              <p><strong>Avec SQLite :</strong> sauvegardez le fichier dans le volume <code className="bg-primary-100 px-1 rounded">app_data</code> (ou le chemin défini par <code className="bg-primary-100 px-1 rounded">DB_SQLITE_PATH</code>) - une simple copie du fichier suffit, même pendant que le serveur tourne.</p>
              <p><strong>Avec Postgres :</strong> utilisez <code className="bg-primary-100 px-1 rounded">pg_dump</code> planifié par une tâche cron quotidienne, en plus d'une copie du volume <code className="bg-primary-100 px-1 rounded">postgres_data</code>.</p>
              <p>Dans les deux cas, gardez au moins une copie <strong>hors du serveur lui-même</strong> (un autre disque, un stockage cloud chiffré) - une sauvegarde qui vit sur la même machine que les données originales ne protège de rien en cas de panne matérielle.</p>
            </div>
          )}
          <p className="text-ink-muted mt-3">
            Ardoise sait aussi sauvegarder automatiquement vers Google Drive, sans manipulation manuelle - voir{' '}
            <a href="https://docs.ardoiseeduc.com/guide-technique/sauvegardes" target="_blank" rel="noreferrer" className="text-primary-600 underline">la documentation complète des sauvegardes</a>.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section>
          <h2 className="text-xl font-bold text-ink mb-4">7. Mises à jour</h2>
          <CodeBlock>{scenario === 'laptop'
            ? `docker pull amesc/ardoise:latest\ndocker stop ardoise-backend && docker rm ardoise-backend\n# puis relancez la commande docker run de l'étape 3`
            : `docker compose pull\ndocker compose up -d`}</CodeBlock>
          <p className="text-ink-muted mt-4">
            Les migrations de base de données, la synchronisation des rôles, et le référentiel comptable se font
            automatiquement au démarrage du conteneur - aucune commande manuelle nécessaire après une mise à jour.
            Vos données (dans le volume persistant) ne sont jamais touchées par une mise à jour d'image.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section>
          <h2 className="text-xl font-bold text-ink mb-4">8. Accès à distance</h2>
          <p className="text-ink-muted">
            Si votre personnel a besoin d'accéder au portail en dehors du réseau de l'école <em>sans</em> passer par
            un nom de domaine public (scénario « serveur cloud »), un tunnel comme{' '}
            <a href="https://www.cloudflare.com/products/tunnel/" className="text-primary-600 underline" target="_blank" rel="noreferrer">Cloudflare Tunnel</a>{' '}
            ou <a href="https://tailscale.com/" className="text-primary-600 underline" target="_blank" rel="noreferrer">Tailscale</a>{' '}
            permet de relier votre serveur local à internet sans ouvrir de port sur votre routeur. Ardoise intègre
            directement un Tunnel Cloudflare nommé, prêt à l'emploi - suivez{' '}
            <a href="https://docs.ardoiseeduc.com/guide-technique/acces-distant" target="_blank" rel="noreferrer" className="text-primary-600 underline">
              le guide pas à pas
            </a>{' '}
            dans la documentation complète.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section>
          <h2 className="text-xl font-bold text-ink mb-4">Installer l'application sur votre téléphone</h2>
          <p className="text-ink-muted">
            Une fois connecté·e, chaque membre du personnel (et chaque parent) peut installer Ardoise comme une
            vraie application, sans passer par un store - le bouton « Installer l'App » apparaît automatiquement
            en haut de la page une fois qu'un navigateur compatible le permet. Sur iPhone/iPad, Safari ne propose
            pas ce bouton automatiquement : appuyez sur Partager <span aria-hidden>⬆️</span> puis « Sur l'écran
            d'accueil ».
          </p>
        </section>
      </div>
    </div>
  )
}
