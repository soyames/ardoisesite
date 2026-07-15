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

        <h2 className="text-xl font-bold text-ink mt-8">2. Responsabilité des Écoles</h2>
        <p>
          Chaque école utilisant le logiciel Ardoise est responsable de l'hébergement et de la sécurité de ses propres données. Ardoise fournit uniquement le logiciel et l'infrastructure d'authentification, mais n'héberge pas les bases de données scolaires individuelles. Les écoles s'engagent à respecter la réglementation sur la protection des données en vigueur.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">3. Place de marché des Tuteurs</h2>
        <p>
          Les tuteurs inscrits sur la plateforme fixent librement leurs tarifs. 
          En réservant un tuteur, le parent s'engage à payer via la plateforme Ardoise, qui agit comme intermédiaire de paiement de confiance. 
          <strong>Il est formellement interdit de contourner la plateforme pour rémunérer un tuteur directement.</strong>
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
