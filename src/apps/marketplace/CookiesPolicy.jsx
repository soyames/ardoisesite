import React from 'react'
import { Link } from 'react-router-dom'

export default function CookiesPolicy() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-extrabold text-ink mb-8">Politique des Cookies</h1>
      <div className="space-y-6 text-ink-muted">
        <p>
          Cette page vous informe sur l'utilisation des cookies par la plateforme Ardoise. Conformément à notre engagement de transparence et de respect de la vie privée, nous avons conçu notre système pour être le plus minimaliste possible en matière de suivi.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">Qu'est-ce qu'un cookie ?</h2>
        <p>
          Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, tablette ou mobile) lorsque vous visitez un site internet. Il permet au site de mémoriser vos actions et préférences (telles que la connexion) pendant une durée donnée, afin que vous n'ayez pas à les saisir à nouveau lors de chaque navigation.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">Les types de cookies que nous utilisons</h2>
        <p>
          Contrairement à beaucoup d'autres plateformes, <strong>Ardoise n'utilise aucun cookie de traçage, d'analyse comportementale ou de ciblage publicitaire.</strong>
        </p>
        <p>
          Nous utilisons exclusivement des <strong>cookies techniques strictement nécessaires</strong> au fonctionnement de l'application et à la sécurité de vos données. Si vous désactivez ces cookies dans votre navigateur, vous ne pourrez pas vous connecter ni utiliser les services de la plateforme.
        </p>

        <div className="mt-4 border border-border rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm text-ink-muted">
            <thead className="bg-surface-raised text-ink border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Nom du cookie / stockage</th>
                <th className="px-4 py-3 font-semibold">Finalité</th>
                <th className="px-4 py-3 font-semibold">Durée de vie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              <tr>
                <td className="px-4 py-3 font-mono">sessionid</td>
                <td className="px-4 py-3">Maintient votre session utilisateur sécurisée active lorsque vous interagissez avec notre API.</td>
                <td className="px-4 py-3">Fermeture du navigateur (session)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono">csrftoken</td>
                <td className="px-4 py-3">Protection indispensable contre les failles de sécurité de type CSRF (Cross-Site Request Forgery).</td>
                <td className="px-4 py-3">1 an</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono">Firebase Auth (IndexedDB/Local)</td>
                <td className="px-4 py-3">Conserve l'état de votre connexion Firebase pour vous éviter de devoir vous reconnecter à chaque changement de page.</td>
                <td className="px-4 py-3">Persistante (jusqu'à déconnexion)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-bold text-ink mt-8">Paramétrer votre navigateur</h2>
        <p>
          Puisque nous n'utilisons que des cookies strictement nécessaires, aucun bandeau de consentement préalable n'est requis par la législation (RGPD/ePrivacy). 
        </p>
        <p>
          Vous pouvez toutefois configurer votre navigateur pour bloquer ces cookies, mais <strong>certaines parties du site cesseront de fonctionner correctement</strong> (notamment l'accès à votre espace connecté).
        </p>
        <p>
          Pour en savoir plus sur la gestion des cookies selon votre navigateur :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Chrome :</strong> <a href="https://support.google.com/chrome/bin/answer.py?hl=fr&answer=95647" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">Gérer les cookies sur Chrome</a></li>
          <li><strong>Firefox :</strong> <a href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">Gérer les cookies sur Firefox</a></li>
          <li><strong>Safari :</strong> <a href="https://support.apple.com/kb/HT1677?viewlocale=fr_FR" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">Gérer les cookies sur Safari</a></li>
        </ul>

        <div className="mt-8 pt-8 border-t border-border">
          <p>
            Pour plus d'informations sur la manière dont nous protégeons vos données globales, veuillez consulter notre <Link to="/privacy" className="text-primary-600 font-medium hover:underline">Politique de Confidentialité</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
