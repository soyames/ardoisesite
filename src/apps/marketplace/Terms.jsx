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
          Les tuteurs inscrits sur la plateforme fixent librement leurs tarifs. La mise en relation entre un parent
          et un tuteur est gratuite : Ardoise n'intervient pas dans le paiement et ne prélève aucune commission sur
          les cours de soutien. Le parent et le tuteur conviennent directement entre eux des horaires, du tarif, et
          du mode de règlement, en dehors de la plateforme. Ardoise peut permettre l'enregistrement des modalités
          convenues (durée, volume horaire, tarif) afin que les deux parties les retrouvent dans leur espace, mais
          cet enregistrement ne constitue ni un contrat entre Ardoise et l'une des parties, ni une garantie de
          paiement ou d'exécution.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">4. Frais d'inscription scolaire</h2>
        <p>
          Selon l'école et le pays, les frais d'inscription réglés par un parent lors d'une demande d'admission
          acceptée sont soit collectés directement par l'école elle-même (moyen de paiement de son choix), soit,
          lorsque l'école l'a activé et que la réglementation locale le permet, collectés par Ardoise pour le
          compte de l'école via son propre prestataire de paiement, puis reversés à l'école. Ardoise ne prélève
          aucune commission sur ce transfert. La scolarité elle-même (frais périodiques) n'est jamais collectée
          par Ardoise : elle relève exclusivement de la relation entre l'école et le parent, y compris lorsque
          l'école utilise sa propre intégration de paiement mobile au sein du logiciel Ardoise.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">5. Litiges</h2>
        <p>
          En cas de litige entre un parent et un tuteur, ou entre un parent et une école, Ardoise n'étant pas
          partie à la transaction financière sous-jacente (voir articles 3 et 4), elle ne pourra être tenue
          responsable des manquements contractuels, pédagogiques, ou de paiement entre ces parties.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">6. Résiliation</h2>
        <p>
          Vous pouvez demander la clôture de votre compte à tout moment via <a href="/contact" className="underline text-primary-600">notre formulaire de contact</a>. Ardoise peut suspendre ou résilier un compte en cas de violation des présentes conditions, après notification sauf urgence (fraude, atteinte à la sécurité de la plateforme ou d'autres utilisateurs). La résiliation d'un compte École n'affecte pas les données hébergées localement par cette école, qui restent sous son entière responsabilité.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">7. Limitation de responsabilité</h2>
        <p>
          Dans les limites permises par la loi applicable, la responsabilité d'Ardoise au titre des présentes conditions est limitée aux sommes effectivement perçues par la plateforme au titre du service concerné au cours des douze (12) derniers mois. Ardoise ne pourra être tenue responsable des dommages indirects (perte de chance, préjudice commercial, etc.).
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">8. Évolution du modèle économique</h2>
        <p>
          Le logiciel de gestion scolaire Ardoise est actuellement fourni gratuitement à toute école inscrite,
          sans abonnement ni condition de paiement. Ardoise se réserve toutefois le droit d'introduire, pour
          l'avenir, un abonnement payant ou toute autre forme de contribution financière applicable aux écoles,
          notamment si cela devient nécessaire pour couvrir durablement les coûts d'exploitation, d'hébergement,
          ou de développement de la plateforme. Un tel changement ne serait ni rétroactif ni appliqué sans
          préavis : il ferait l'objet d'une communication préalable aux écoles concernées, avec un délai
          raisonnable leur permettant d'exporter leurs données ou de mettre fin à leur utilisation du service
          avant l'entrée en vigueur de toute nouvelle condition tarifaire. Les présentes conditions générales
          seraient mises à jour en conséquence, avec indication de la date de la nouvelle version.
        </p>

        <h2 className="text-xl font-bold text-ink mt-8">9. Droit applicable et juridiction</h2>
        <p>
          {/* TODO(legal): confirm the exact operating entity and its place of
              incorporation before publishing - this clause needs a real,
              specific answer, not a guess. Placeholder below names the
              country the product is built around (Benin, OHADA member
              state) as a starting point only. */}
          Les présentes conditions sont régies par le droit béninois et le droit uniforme OHADA applicable. Notre plateforme couvre exclusivement les 17 pays membres de l'espace OHADA. Tout litige qui n'aurait pu être résolu à l'amiable relève de la compétence exclusive des juridictions de Cotonou, Bénin.
        </p>
      </div>
    </div>
  )
}
