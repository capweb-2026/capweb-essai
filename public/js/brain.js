// Astra — le cerveau à règles. Module pur : aucun document, aucun stockage (testé par tests/brain.test.js).
import { resumeCiel, prochainesEclipses, dateEnClair, delaiEnClair, pourcentage } from './ciel.js';

const LONGUEUR_MAX = 280;

// Premier message affiché quand le journal est vide.
export const ACCUEIL = 'Bonsoir ! Je suis Astra, votre guide du ciel nocturne. Tapez /ciel pour la nuit qui vient, ou choisissez une question ci-dessous.';

const TEXTES = {
  salutation: 'Bonsoir à vous ! Le ciel est prêt : demandez-moi la Lune, les étoiles filantes ou l’étoile Polaire.',
  aide: 'Je connais la Lune, les étoiles filantes, l’étoile Polaire, la Voie lactée, les éclipses, les planètes, l’ISS et les jumelles. Posez une question, ou tapez /aide pour les commandes.',
  commandes: 'Commandes : /ciel la nuit qui vient · /lune la phase du jour · /compte la taille du journal · /effacer repartir de zéro.',
  test: 'Test bien reçu : mes règles répondent, le ciel est en place.',
  repli: 'Ce coin du ciel m’est encore inconnu. Essayez Lune, étoiles filantes, Polaire, Voie lactée, ou /aide.',
  inconnue: 'Commande inconnue. Tapez /aide pour voir les commandes.',
  effacee: 'Conversation effacée.',
  polaire: 'Cherchez la Grande Ourse, cette grande casserole. Prolongez environ 5 fois le bord de la casserole opposé au manche : vous arrivez sur l’étoile Polaire, qui indique le nord. Elle n’est pas la plus brillante du ciel : ce titre revient à Sirius.',
  materiel: 'Commencez par des jumelles 7×50 ou 10×50 : cratères de la Lune, lunes de Jupiter, galaxie d’Andromède. Le télescope viendra après. Et une lampe rouge, pour garder vos yeux habitués au noir.',
  iss: 'L’ISS fait le tour de la Terre en 90 minutes environ. Cherchez un point très brillant qui traverse le ciel en quelques minutes sans clignoter : un avion, lui, clignote.',
  planetes: 'Avec de simples jumelles, Jupiter montre ses quatre plus grandes lunes, découvertes par Galilée en 1610. Les anneaux de Saturne demandent un petit télescope. Astuce : une planète scintille beaucoup moins qu’une étoile.',
  pollution: 'Sous un ciel vraiment noir, l’œil voit plusieurs milliers d’étoiles ; en centre-ville, quelques dizaines. Plus d’un humain sur trois ne voit plus la Voie lactée depuis chez lui (Science Advances, 2016).',
  scintillement: 'Une étoile scintille parce que sa lumière traverse une atmosphère agitée. Une planète, minuscule disque plutôt que simple point, scintille beaucoup moins : c’est la meilleure façon de la reconnaître.'
};

const OBJECTIFS = {
  faible: 'la Voie lactée, loin des lumières',
  moyenne: 'les cratères de la Lune, aux jumelles',
  forte: 'la Lune elle-même, puis les étoiles brillantes'
};

export function validateMessage(raw) {
  if (typeof raw !== 'string') {
    return { ok: false, error: 'Le message doit être du texte.' };
  }
  const value = raw.trim();
  if (value === '') {
    return { ok: false, error: 'Le message ne doit pas être vide.' };
  }
  if (value.length > LONGUEUR_MAX) {
    return { ok: false, error: `Le message doit contenir ${LONGUEUR_MAX} caractères au maximum.` };
  }
  return { ok: true, value };
}

// « Où est l’Étoile Polaire ? » devient « ou est l etoile polaire » : minuscules, sans accents ni ponctuation.
export function normaliser(texte) {
  return String(texte)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9/]+/g, ' ')
    .trim();
}

// Mots entiers seulement : « tester » ne contient pas le mot « test ».
function contientUn(texte, mots) {
  const phrase = ` ${texte} `;
  return mots.some((mot) => phrase.includes(` ${mot} `));
}

function reponseLune(maintenant) {
  const { lune, pleineLune, joursAvantPleineLune } = resumeCiel(maintenant);
  let conseil = 'Le long de la limite entre ombre et lumière, les cratères ressortent en relief : sortez les jumelles.';
  let suite = ` Prochaine pleine Lune : ${dateEnClair(pleineLune)} (${delaiEnClair(joursAvantPleineLune)}).`;
  if (lune.nom === 'Pleine Lune') {
    conseil = 'Belle mais plate : sans ombres, les cratères disparaissent.';
    suite = '';
  }
  if (lune.nom === 'Nouvelle Lune') {
    conseil = 'Nuit sans Lune : parfaite pour la Voie lactée.';
  }
  return `Ce soir : ${lune.nom}, éclairée à ${pourcentage(lune.eclairage)}.${suite} ${conseil}`;
}

function reponseVoieLactee(maintenant) {
  const { lune, gene } = resumeCiel(maintenant);
  const eclat = pourcentage(lune.eclairage);
  const avis = {
    faible: `Bonne nouvelle : la Lune n’est éclairée qu’à ${eclat}, elle gêne peu.`,
    moyenne: `La Lune est éclairée à ${eclat} : la Voie lactée restera pâle tant qu’elle est levée.`,
    forte: `Mauvaise nouvelle : la Lune, éclairée à ${eclat}, noie la Voie lactée. Visez plutôt la prochaine nouvelle Lune.`
  }[gene];
  return `${avis} Pour la Voie lactée : loin des villes, sans écran, et une vingtaine de minutes pour que vos yeux s’habituent au noir.`;
}

function reponseFilantes(maintenant) {
  const { filantes } = resumeCiel(maintenant);
  return `Prochaine pluie d’étoiles filantes : les ${filantes.nom}, vers le ${dateEnClair(filantes.date)} (${delaiEnClair(filantes.jours)}), ${filantes.note}. Pas besoin de télescope : allongez-vous loin des lumières et regardez large.`;
}

function reponseEclipses(maintenant) {
  const eclipses = prochainesEclipses(maintenant);
  if (eclipses.length === 0) {
    return 'Mon calendrier d’éclipses s’arrête en 2027 : il est temps de le mettre à jour.';
  }
  const titre = eclipses.length === 1 ? 'Prochaine éclipse visible' : 'Prochaines éclipses visibles';
  const liste = eclipses.map((eclipse) => `${dateEnClair(eclipse.date, 'annee')}, ${eclipse.texte}`).join(' ; puis ');
  return `${titre} depuis la France : ${liste}. Pour le Soleil, jamais sans lunettes d’éclipse.`;
}

function reponseCiel(maintenant) {
  const { lune, gene, filantes } = resumeCiel(maintenant);
  return `Nuit du ${dateEnClair(maintenant, 'complet')} : ${lune.nom}, Lune éclairée à ${pourcentage(lune.eclairage)}, gêne ${gene}. Prochain rendez-vous : les ${filantes.nom}, ${delaiEnClair(filantes.jours)}. Objectif du soir : ${OBJECTIFS[gene]}.`;
}

function reponseCompte(nombre) {
  if (nombre === 0) {
    return 'Notre journal est encore vide.';
  }
  const messages = nombre === 1 ? '1 message' : `${nombre} messages`;
  return `Notre journal contient ${messages} avant cette commande.`;
}

// Du plus précis au plus général : « éclipse de Lune » parle d’éclipse, « lunes de Jupiter » de planètes.
const SUJETS = [
  { mots: ['eclipse', 'eclipses'], repondre: reponseEclipses },
  { mots: ['jupiter', 'saturne', 'planete', 'planetes'], repondre: () => TEXTES.planetes },
  { mots: ['voie lactee', 'galaxie'], repondre: reponseVoieLactee },
  { mots: ['etoile filante', 'etoiles filantes', 'filantes', 'meteore', 'meteores', 'perseides', 'geminides', 'pluie d etoiles'], repondre: reponseFilantes },
  { mots: ['polaire', 'nord', 'grande ourse', 'casserole'], repondre: () => TEXTES.polaire },
  { mots: ['jumelles', 'telescope', 'lunette', 'materiel'], repondre: () => TEXTES.materiel },
  { mots: ['iss', 'station spatiale', 'satellite', 'satellites'], repondre: () => TEXTES.iss },
  { mots: ['pollution lumineuse', 'pollution', 'ville', 'lampadaires'], repondre: () => TEXTES.pollution },
  { mots: ['scintille', 'scintillent', 'scintillement', 'clignote', 'clignotent'], repondre: () => TEXTES.scintillement },
  { mots: ['lune', 'phase', 'phases', 'croissant'], repondre: reponseLune }
];

const COMMANDES = {
  '/aide': () => TEXTES.commandes,
  '/ciel': (maintenant) => reponseCiel(maintenant),
  '/lune': (maintenant) => reponseLune(maintenant),
  '/compte': (_maintenant, nombreMessages) => reponseCompte(nombreMessages),
  '/effacer': () => TEXTES.effacee
};

// Commandes qui changent la page : le cerveau les reconnaît, app.js les exécute.
export function actionOf(message) {
  return normaliser(message) === '/effacer' ? 'effacer' : null;
}

export function replyTo(message, { maintenant = new Date(), nombreMessages = 0 } = {}) {
  const texte = normaliser(message);
  if (texte.startsWith('/')) {
    const commande = COMMANDES[texte.split(' ')[0]];
    return commande ? commande(maintenant, nombreMessages) : TEXTES.inconnue;
  }
  const sujet = SUJETS.find((candidat) => contientUn(texte, candidat.mots));
  if (sujet) {
    return sujet.repondre(maintenant);
  }
  if (contientUn(texte, ['aide', 'help', 'aidez moi'])) {
    return TEXTES.aide;
  }
  if (contientUn(texte, ['test'])) {
    return TEXTES.test;
  }
  if (contientUn(texte, ['salut', 'bonjour', 'bonsoir', 'coucou', 'hello'])) {
    return TEXTES.salutation;
  }
  return TEXTES.repli;
}
