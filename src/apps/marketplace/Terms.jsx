import React from 'react'

export default function Terms() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-extrabold text-ink mb-8">Conditions Générales d'Utilisation</h1>
      <div className="space-y-6 text-ink-muted">
        <p>
          Bienvenue sur Ardoise. En utilisant notre plateforme, vous acceptez les présentes conditions générales.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">1. Le Service Ardoise</h2>
        <p>
          Ardoise est une plateforme offrant :
          <br />- Un logiciel SaaS décentralisé pour la gestion des écoles.
          <br />- Une place de marché publique permettant aux parents de trouver des écoles et de réserver des tuteurs à domicile.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">2. Responsabilité des Écoles et Limitation de Responsabilité</h2>
        <p>
          Chaque école utilisant le logiciel Ardoise agit en tant que <strong>Responsable de Traitement</strong> et est seule responsable de l'hébergement, de la sauvegarde et de la sécurité de ses propres données. Ardoise fournit uniquement le logiciel et l'infrastructure d'authentification en tant que <strong>Sous-traitant</strong>, et n'héberge pas les bases de données scolaires individuelles.
        </p>
        <p className="mt-2">
          En conséquence, <strong>l'opérateur de la plateforme Ardoise décline toute responsabilité</strong> en cas de perte de données, de fuite d'informations, ou de non-conformité légale découlant de la gestion du serveur local de l'école. Les écoles s'engagent à mettre en place les mesures de sécurité nécessaires (sauvegardes régulières, pare-feu) et à respecter la réglementation sur la protection des données en vigueur dans leur juridiction.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">3. Place de marché des Tuteurs</h2>
        <p>
          Les tuteurs inscrits sur la plateforme fixent librement leurs tarifs. 
          En réservant un tuteur, le parent s'engage à payer via la plateforme Ardoise, qui agit comme intermédiaire de paiement de confiance. 
        </p>
        <div className="my-4 rounded-card bg-danger-50 p-4 border border-danger-200">
          <p className="text-danger-800 font-semibold mb-2">Avertissement Légal : Interdiction stricte de contournement</p>
          <p className="text-sm text-danger-900">
            <strong>Il est formellement interdit de contourner la plateforme pour rémunérer un tuteur directement.</strong> Tout paiement doit obligatoirement transiter par Ardoise. En cas de non-respect de cette clause, <strong>les comptes du Parent et du Tuteur seront immédiatement et définitivement suspendus</strong> sans préavis, et des poursuites légales pourront être engagées.
          </p>
        </div>
        <p>
          Une commission de 10% est prélevée par la plateforme sur les contrats de tutorat pour couvrir les frais de fonctionnement. Les contrats ont une durée d'engagement minimale de 6 mois pour protéger les tuteurs.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">4. Litiges</h2>
        <p>
          En cas de litige entre un parent et un tuteur, Ardoise fera office de médiateur mais ne pourra être tenue responsable des manquements pédagogiques.
        </p>
      </div>
    </div>
  )
}
