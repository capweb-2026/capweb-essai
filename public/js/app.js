// Astra — le câblage : lire la page, demander au cerveau, faire afficher, mémoriser.
import { validateMessage, replyTo, actionOf, ACCUEIL } from './brain.js';
import { resumeCiel } from './ciel.js';
import { renderMessages, renderCiel, journalTexte, telecharger } from './view.js';

const formulaire = document.querySelector('#chat-form');
const champ = document.querySelector('#message');
const envoyer = formulaire.querySelector('button[type="submit"]');
const liste = document.querySelector('#messages');
const statut = document.querySelector('#status');
const compteur = document.querySelector('#compteur');
const effacer = document.querySelector('#effacer');
const exporter = document.querySelector('#exporter');
const vision = document.querySelector('#vision');
const panneauCiel = document.querySelector('#ciel');
const suggestions = document.querySelectorAll('[data-question]');
const versionElt = document.querySelector('#version');

const CLE = 'capweb.historique';
const CLE_VISION = 'astra.vision';
const DELAI_REPONSE = 900;

const historique = [];
let minuteur = null;

// ?date=2026-09-26 simule une autre nuit : pratique pour une démonstration ou un test.
function lireDateSimulee() {
  const brut = new URLSearchParams(location.search).get('date');
  if (!brut) {
    return null;
  }
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(brut) ? `${brut}T21:00` : brut);
  return Number.isNaN(date.getTime()) ? null : date;
}

const dateSimulee = lireDateSimulee();

function maintenant() {
  return dateSimulee ?? new Date();
}

function sauvegarder() {
  localStorage.setItem(CLE, JSON.stringify(historique));
}

function charger() {
  const brut = localStorage.getItem(CLE);
  if (brut === null) {
    return;
  }
  try {
    const donnees = JSON.parse(brut);
    if (Array.isArray(donnees)) {
      // On ne garde que des messages bien formés : le stockage peut avoir été modifié à la main.
      historique.push(...donnees.filter((msg) => (msg?.role === 'user' || msg?.role === 'assistant') && typeof msg.text === 'string'));
    }
  } catch {
    statut.textContent = 'Journal précédent illisible : nouvelle conversation.';
  }
}

// Contrat CP1 : #messages ne contient que les échanges réels. L'accueil s'affiche hors de la conversation.
function accueillir() {
  if (historique.length === 0) {
    statut.textContent = ACCUEIL.replaceAll('**', '');
  }
}

function attendre(actif) {
  envoyer.disabled = actif;
  statut.textContent = actif ? 'Astra observe le ciel…' : '';
}

function majCompteur() {
  compteur.textContent = `${champ.value.length} / 280`;
}

function viderConversation() {
  clearTimeout(minuteur);
  minuteur = null;
  attendre(false);
  historique.length = 0;
  localStorage.removeItem(CLE);
  accueillir();
  renderMessages(historique, liste);
  statut.textContent = 'Conversation effacée.';
}

formulaire.addEventListener('submit', (event) => {
  event.preventDefault();
  // Une réponse est en route : un second envoi rapide est ignoré.
  if (minuteur !== null) {
    return;
  }
  const controle = validateMessage(champ.value);
  if (!controle.ok) {
    statut.textContent = controle.error;
    champ.focus();
    return;
  }
  champ.value = '';
  majCompteur();
  champ.focus();
  if (actionOf(controle.value) === 'effacer') {
    viderConversation();
    return;
  }
  const reponse = replyTo(controle.value, { maintenant: maintenant(), nombreMessages: historique.length });
  historique.push({ role: 'user', text: controle.value });
  attendre(true);
  // Contrat CP1 : l'attente s'affiche dans le statut, pas comme une ligne de conversation.
  renderMessages(historique, liste);
  minuteur = setTimeout(() => {
    minuteur = null;
    historique.push({ role: 'assistant', text: reponse });
    sauvegarder();
    attendre(false);
    renderMessages(historique, liste);
  }, DELAI_REPONSE);
});

// Entrée envoie, Maj + Entrée passe à la ligne.
champ.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    formulaire.requestSubmit();
  }
});

champ.addEventListener('input', majCompteur);

for (const bouton of suggestions) {
  bouton.addEventListener('click', () => {
    if (minuteur !== null) {
      return;
    }
    champ.value = bouton.dataset.question;
    formulaire.requestSubmit();
  });
}

effacer.addEventListener('click', () => {
  if (confirm('Effacer toute la conversation ?')) {
    viderConversation();
  }
});

exporter.addEventListener('click', () => {
  const jour = maintenant().toISOString().slice(0, 10);
  telecharger(`journal-astra-${jour}.txt`, journalTexte(historique, maintenant()));
  statut.textContent = 'Journal exporté.';
});

function appliquerVision(nocturne) {
  document.documentElement.dataset.vision = nocturne ? 'nocturne' : 'normale';
  vision.setAttribute('aria-pressed', String(nocturne));
}

vision.addEventListener('click', () => {
  const nocturne = vision.getAttribute('aria-pressed') !== 'true';
  appliquerVision(nocturne);
  localStorage.setItem(CLE_VISION, nocturne ? 'nocturne' : 'normale');
  statut.textContent = nocturne
    ? 'Vision nocturne : la lumière rouge garde vos yeux habitués au noir.'
    : 'Vision normale.';
});

appliquerVision(localStorage.getItem(CLE_VISION) === 'nocturne');
renderCiel(resumeCiel(maintenant()), panneauCiel);
charger();
accueillir();
renderMessages(historique, liste);
majCompteur();

fetch('/version.json', { headers: { accept: 'application/json' } })
  .then((reponse) => (reponse.ok ? reponse.json() : null))
  .then((donnees) => {
    if (donnees && typeof donnees.version === 'string' && versionElt) {
      versionElt.textContent = `version ${donnees.version}`;
    }
  })
  .catch(() => {});
