import React from 'react'
import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-extrabold text-ink mb-8">Politique de Confidentialité</h1>
      <div className="space-y-6 text-ink-muted">
        <p>
          Chez Ardoise, la protection de vos données personnelles est une priorité absolue. Cette politique explique comment nous traitons vos informations. Dernière mise à jour : juillet 2026.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">1. L'architecture décentralisée d'Ardoise et Rôles Légaux</h2>
        <p>
          Le logiciel de gestion scolaire Ardoise fonctionne sur un modèle <strong>SaaS décentralisé</strong>. Cela signifie que <strong>chaque école héberge et possède ses propres données</strong> sur ses propres serveurs ou ordinateurs locaux, qu'elle installe et exploite elle-même.
        </p>
        <p>
          Au sens des réglementations sur la protection des données personnelles (RGPD, et lois locales applicables dans l'espace OHADA), <strong>l'École agit en tant que Responsable de Traitement (Data Controller)</strong>. Elle décide des finalités et des moyens du traitement des données de ses élèves et de son personnel.
        </p>
        <p>
          L'opérateur de la plateforme Ardoise (nous) agit strictement en tant que <strong>Sous-traitant (Data Processor)</strong> pour ces données scolaires. Nous fournissons uniquement l'infrastructure logicielle et d'authentification et <strong>n'hébergeons, sur nos propres serveurs, aucune donnée scolaire opérationnelle</strong> (dossiers élèves, notes, présences, paiements de scolarité). Nous n'y avons aucun accès. Toute demande relative aux données d'un élève ou d'un membre du personnel (droit d'accès, de rectification, de suppression) doit être adressée directement à l'administration de son école.
        </p>
        <p>
          Cette absence d'hébergement concerne uniquement les données opérationnelles internes de chaque école. La plateforme centrale (annuaire, tutorat, abonnements) traite bien, elle, certaines données à caractère personnel en tant que Responsable de Traitement à part entière - voir la section 2.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">2. Données traitées par la Plateforme centrale</h2>
        <p>
          Pour les fonctionnalités ci-dessous, la plateforme centrale (<code>ardoise.soyames.com</code>) est elle-même Responsable de Traitement, car ces données lui sont directement confiées, indépendamment de toute école :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>L'annuaire public des écoles partenaires (nom, coordonnées, effectifs déclarés).</li>
          <li>L'état des abonnements et les codes d'activation des écoles.</li>
          <li>Les profils publics des tuteurs à domicile (nom, matières, tarifs, disponibilités).</li>
          <li>Les contrats de tutorat conclus via la plateforme et les paiements associés.</li>
          <li>Les demandes d'inscription qu'un parent soumet à une école via la plateforme (nom et âge de l'enfant, coordonnées du parent) et les offres d'emploi/candidatures publiées par les écoles, jusqu'à leur traitement par l'école concernée.</li>
          <li>Les comptes utilisateurs (adresse email, nom, téléphone) nécessaires à l'authentification, quel que soit le rôle (parent, enseignant, fondateur d'école, etc.).</li>
        </ul>

        <h2 className="text-xl font-bold text-ink mt-8">3. Sous-traitants et prestataires tiers</h2>
        <p>
          Pour fonctionner, la plateforme centrale fait appel aux prestataires suivants, qui traitent une partie des données décrites en section 2 pour notre compte :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Firebase Authentication et Firestore</strong> (Google) : gestion des comptes et des données de la plateforme centrale (annuaire, tutorat, demandes d'inscription).</li>
          <li><strong>Cloudflare</strong> (Workers) : infrastructure technique reliant chaque installation école à la plateforme centrale, sans jamais exposer les données scolaires internes.</li>
          <li><strong>FedaPay</strong> : traitement des paiements Mobile Money pour les contrats de tutorat et les abonnements écoles.</li>
          <li><strong>WhatsApp Business API</strong> (Meta) : envoi de notifications aux parents, uniquement pour les écoles ayant configuré et activé cette fonctionnalité.</li>
        </ul>
        <p>
          Ces prestataires peuvent traiter des données en dehors du pays de résidence de l'utilisateur. Nous nous assurons qu'ils offrent des garanties de sécurité appropriées.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">4. Durée de conservation</h2>
        <p>
          Les données d'un compte utilisateur sont conservées tant que le compte est actif. Les profils de tuteurs et annonces d'écoles sont conservés tant qu'ils sont publiés ; une demande d'inscription ou une candidature à un emploi non traitée est conservée au maximum 12 mois avant suppression automatique. Vous pouvez demander la suppression anticipée de vos données via <Link to="/contact" className="underline text-primary-600">notre formulaire de contact</Link>.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">5. Vos droits</h2>
        <p>
          Pour les données décrites en section 2 (celles dont nous sommes Responsable de Traitement), vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition. Pour l'exercer, contactez-nous via <Link to="/contact" className="underline text-primary-600">notre formulaire de contact</Link>. Pour les données scolaires internes (notes, présences, dossiers élèves), voir la section 1 - la demande doit être adressée à l'école concernée.
        </p>
        <p>
          La plateforme est utilisée par des parents pour inscrire des mineurs. Les données d'un enfant transmises via une demande d'inscription ne sont collectées qu'avec l'autorisation du parent qui soumet la demande en son nom.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">6. Utilisation des cookies</h2>
        <p>
          Nous utilisons des cookies strictement nécessaires au fonctionnement du portail (session de connexion, préférences d'affichage). Aucun cookie de traçage publicitaire n'est utilisé - voir notre <Link to="/cookies" className="underline text-primary-600">Politique des Cookies</Link> pour le détail.
        </p>
      </div>
    </div>
  )
}
