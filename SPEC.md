# SPEC.md — l'identité d'Astra

## Objectif

L'assistant a une identité reconnaissable dès l'ouverture de la page : un nom, un emoji, un message d'accueil et trois questions pour démarrer. L'utilisateur sait en deux secondes à qui il parle et ce qu'il peut demander.

## Critères d'acceptation

1. **Nom** — Quand la page s'ouvre, le système affiche le nom de l'assistant, `Astra`, dans le titre principal. Le nom fait de 2 à 20 caractères.
2. **Emoji** — Quand la page s'ouvre, le système affiche un seul emoji, `✦`, à côté du nom.
3. **Accueil** — Quand la conversation est vide, le système affiche un message d'accueil qui contient le nom. Ce message n'est pas une ligne de `#messages`, disparaît dès le premier message envoyé, et revient quand la conversation est effacée.
4. **Suggestions** — Quand la page s'ouvre, le système propose exactement trois questions suggérées : « La nuit qui vient », « Où est l'étoile Polaire ? » et « Prochaines étoiles filantes ». Quand l'utilisateur clique sur l'une d'elles, le système la place dans le champ de saisie **sans l'envoyer**.
5. **Réponses signées** — Quand l'assistant répond, sa ligne commence par `Astra` au lieu de « Cap Web ».
6. **Contrat** — Les tests de contrat CP1 restent verts.

## Hors périmètre

Pas de choix de l'identité par l'utilisateur, pas d'image d'avatar, pas d'appel à une IA, aucun changement des réponses du cerveau (`replyTo`), aucun changement du mode vision nocturne.

## Données et fonctions attendues

- `public/js/persona.js` exporte :
  - `persona = { nom, emoji, accueil, suggestions }`, où `suggestions` est un tableau de trois textes non vides ;
  - `validatePersona(persona)`, qui renvoie `{ ok: true }` ou `{ ok: false, erreurs: [texte, …] }`.
- `validatePersona` refuse : un nom de moins de 2 ou de plus de 20 caractères perçus ; un `emoji` qui n'est pas exactement un emoji ; un `accueil` qui ne contient pas le nom ; un nombre de suggestions différent de trois, ou une suggestion vide.
- `persona.js` reste pur : ni `document`, ni `window`, ni `localStorage`.
- La page contient `#accueil` et `#suggestions`, **en dehors de `#messages`**.
- `persona.js` est ajouté à la liste blanche de `server/app.js` (`FICHIERS` et `TYPES`).

## Questions ouvertes

Aucune.
