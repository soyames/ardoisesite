import React from 'react'

export default function InstallGuide() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Installation d'Ardoise (Pour les Écoles)</h1>
      <p className="text-lg text-slate-600 mb-8">
        Ardoise utilise une architecture de base de données décentralisée. Votre école héberge et possède ses propres données. Suivez ce guide pour déployer le système sur votre ordinateur ou serveur local.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">1. Prérequis</h2>
          <ul className="list-disc pl-6 space-y-2 text-slate-700">
            <li>Un ordinateur Windows, Mac ou Linux dédié à la gestion de l'école.</li>
            <li>Une connexion internet (pour la synchronisation de licence et les envois WhatsApp/SMS).</li>
            <li><strong>Docker Desktop</strong> installé sur votre machine.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">2. Obtenir votre Code d'Activation</h2>
          <p className="text-slate-700 mb-4">
            Pour connecter votre instance au réseau Ardoise et activer les fonctionnalités premium, vous devez posséder un code d'activation.
            Inscrivez votre école via notre portail pour obtenir un code de la forme <code>LALIBERTE-XXXXXX</code>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">3. Déploiement via Docker</h2>
          <p className="text-slate-700 mb-4">Ouvrez un terminal (Invite de commandes ou PowerShell) et exécutez la commande suivante :</p>
          <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
              <code>
docker run -d \
  --name ardoise-backend \
  -p 8000:8000 \
  -e ARDOISE_PLATFORM_URL="https://api.ardoise.soyames.com" \
  -e ARDOISE_ACTIVATION_CODE="VOTRE_CODE_ICI" \
  soyames/ardoise:latest
              </code>
            </pre>
          </div>
          <p className="text-slate-700 mt-4">
            Cette commande télécharge le logiciel et le lance. Vos données seront stockées localement dans le conteneur. (Pour une mise en production, nous recommandons d'utiliser <code>docker-compose</code> avec des volumes persistants).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">4. Accéder à votre Portail</h2>
          <p className="text-slate-700">
            Une fois le logiciel lancé, vous pouvez utiliser l'interface globale d'Ardoise et vous connecter à votre portail école en entrant votre Code École sur la page de connexion.
          </p>
        </section>
      </div>
    </div>
  )
}
