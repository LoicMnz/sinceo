# Sincéo

Une application pour suivre le nombre de jours depuis les moments qui comptent.
React, TypeScript, Vite et CSS vanilla, sans dépendance d’interface supplémentaire.

## Développement

Node.js 22.18+ (ou 24+) et pnpm.

```sh
pnpm install
pnpm dev
```

```sh
pnpm build   # Vérification TypeScript et compilation
pnpm lint    # Analyse statique
pnpm test    # Dates, historique et validation du stockage
```

## Première version

- Création de compteurs avec nom, description facultative, date et couleur.
- Modification et suppression avec confirmation.
- Réinitialisation à aujourd’hui ou à une date passée choisie.
- Historique consultable de toutes les réinitialisations, y compris celles du même jour.
- Recherche, tri, interface responsive et dialogues accessibles au clavier.
- Sauvegarde locale et synchronisation des changements entre onglets du même navigateur.

Le jour de départ est le **jour 0**. Le calcul utilise les dates civiles locales :
il ne dépend ni de l’heure de création ni du changement d’heure. Le jour courant
est actualisé toutes les 30 secondes et au retour dans la fenêtre. Les dates futures
ne sont pas acceptées.

## Données

Les données sont enregistrées dans `localStorage`, sous `sinceo.counters.v1`,
avec une enveloppe versionnée `{ version: 1, counters: [...] }`.
Chaque réinitialisation conserve un identifiant, la date précédente, la nouvelle date
et l’horodatage de l’action. Les événements restent dans leur ordre d’enregistrement,
même lorsqu’une date rétroactive est choisie. La modification d’un compteur concerne uniquement son nom, sa description et sa
couleur. Après sa création, seule une réinitialisation peut changer sa date de
départ, en ajoutant systématiquement un événement à l’historique.

En cas de stockage indisponible, plein ou illisible, l’interface signale l’échec et
n’écrase pas les données. Un contrôle avant écriture évite de remplacer une modification
déjà enregistrée dans un autre onglet ; ce stockage local n’offre toutefois pas de
transactions atomiques entre onglets.

Cette version ne contient ni compte utilisateur ni serveur : les compteurs restent
sur cet appareil et cette origine web. Effacer les données du navigateur les supprime.
Ne pas y conserver de données irremplaçables sans sauvegarde externe.

## Suite envisagée

- Calendrier et visualisation des réinitialisations.
- Export/import de sauvegardes.
- Comptes et synchronisation entre appareils selon les besoins.

## Langues

L’interface utilise `i18next` et `react-i18next`, selon la
[configuration officielle avec les hooks](https://react.i18next.com/latest/using-with-hooks).
Les dictionnaires sont dans `src/locales/fr.json` et `src/locales/en.json` ;
`src/i18n.ts` initialise les ressources embarquées, sans requête réseau.
La langue est la première langue prise en charge dans les préférences ordonnées du
navigateur (`navigator.languages`), avec le français comme repli. Les variantes
régionales sont reconnues. Aucun sélecteur ni préférence locale ne remplace ce
choix ; les anciennes valeurs `sinceo.language` sont ignorées. Les textes saisis
par l’utilisateur restent inchangés.

Les dates, nombres, pluriels, libellés accessibles et messages suivent la langue
sélectionnée. Les erreurs et notifications sont stockées sous forme de clés de
traduction pour pouvoir changer de langue sans conserver un ancien texte.
Les contrôles de date natifs et leurs messages de validation suivent les réglages
du navigateur et du système.

## Interface mobile

Le CSS cible d’abord les smartphones (vérification au format iPhone 15, 393 × 852
pixels CSS), puis passe à deux et trois colonnes à partir de 700 et 1050 pixels.
Les zones tactiles mesurent au moins 44 px ; les champs utilisent une police de
16 px. Le bouton de création reste accessible en bas lorsqu’il y a des compteurs.
Les dialogues deviennent des panneaux bas défilants sur mobile et bloquent le
scroll de la page ; leur ouverture place le focus sur le titre pour éviter
l’ouverture automatique du clavier. `viewport-fit=cover`, les marges de sécurité
et les unités `dvh` préparent l’affichage aux barres et à l’encoche de l’iPhone.
La simulation de dimensions ne remplace pas une validation sur Safari iOS réel,
notamment pour le clavier et les marges de sécurité.

## Thème jour / nuit

Le bouton soleil/lune de l’en-tête bascule entre les thèmes. Sans choix enregistré,
l’application suit `prefers-color-scheme` et ses changements. Une sélection manuelle
est mémorisée sous `sinceo.theme` et synchronisée entre onglets. Si le stockage est
indisponible, elle reste active pour la session. Le thème est appliqué avant le rendu
React et met à jour la couleur de la barre du navigateur. Le pied de page est retiré.
