import React from 'react'

export default function Privacy() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-extrabold text-ink mb-8">Politique de Confidentialité</h1>
      <div className="space-y-6 text-ink-muted">
        <p>
          Chez Ardoise, la protection de vos données personnelles est une priorité absolue. Cette politique explique comment nous traitons vos informations.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">1. L'architecture décentralisée d'Ardoise</h2>
        <p>
          Le logiciel de gestion scolaire Ardoise fonctionne sur un modèle <strong>SaaS décentralisé</strong>. Cela signifie que <strong>chaque école héberge et possède ses propres données</strong> sur ses propres serveurs ou ordinateurs locaux. 
        </p>
        <p>
          L'opérateur de la plateforme Ardoise (nous) <strong>n'héberge aucune donnée scolaire</strong> (dossiers élèves, notes, paiements de scolarité). Nous n'y avons aucun accès. Toute demande relative aux données d'un élève doit être adressée directement à l'administration de son école.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">2. Données collectées par la Plateforme</h2>
        <p>
          La plateforme centrale `ardoise.soyames.com` gère uniquement :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>L'annuaire public des écoles partenaires.</li>
          <li>L'état des abonnements et les codes d'activation des écoles.</li>
          <li>Les profils publics des tuteurs à domicile.</li>
          <li>Les contrats de tutorat conclus via la plateforme.</li>
        </ul>

        <h2 className="text-xl font-bold text-ink mt-8">3. Utilisation des cookies</h2>
        <p>
          Nous utilisons des cookies strictement nécessaires au fonctionnement du portail (session de connexion, préférences d'affichage). Aucun cookie de traçage publicitaire n'est utilisé.
        </p>
      </div>
    </div>
  )
}
