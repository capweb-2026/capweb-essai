// Astra — l'affichage. Aucune règle de réponse ici : on reçoit des données, on les montre.
import { dateEnClair, pourcentage } from './ciel.js';

const RAYON = 45;

function auteur(role) {
  return role === 'user' ? 'Vous' : 'Astra';
}

// « La **Lune** » devient trois morceaux, dont un en gras. Aucun HTML n'est jamais interprété.
export function segmentsGras(texte) {
  const morceaux = String(texte).split('**');
  if (morceaux.length % 2 === 0) {
    // Un ** sans partenaire reste du texte ordinaire.
    const dernier = morceaux.pop();
    morceaux[morceaux.length - 1] += `**${dernier}`;
  }
  return morceaux
    .map((morceau, index) => ({ texte: morceau, gras: index % 2 === 1 }))
    .filter((segment) => segment.texte !== '');
}

// Partie éclairée de la Lune dans un carré 100 × 100 : un demi-disque, fermé par une demi-ellipse.
export function cheminLune(fraction) {
  const angle = 2 * Math.PI * fraction;
  const largeur = (Math.abs(Math.cos(angle)) * RAYON).toFixed(2);
  const croissante = fraction < 0.5;
  const bord = croissante ? 1 : 0;
  const limite = croissante === (Math.cos(angle) > 0) ? 0 : 1;
  return `M 50 5 A ${RAYON} ${RAYON} 0 0 ${bord} 50 95 A ${largeur} ${RAYON} 0 0 ${limite} 50 5 Z`;
}

export function journalTexte(messages, date) {
  const lignes = messages.map((msg) => `${auteur(msg.role)} : ${msg.text.replaceAll('**', '')}`);
  return [`Journal d’observation · Astra · ${dateEnClair(date, 'annee')}`, '', ...lignes, ''].join('\n');
}

function creerBulle(msg) {
  const li = document.createElement('li');
  li.dataset.role = msg.role;
  const nom = document.createElement('span');
  nom.className = 'auteur';
  nom.textContent = auteur(msg.role);
  const texte = document.createElement('p');
  if (msg.role === 'assistant') {
    for (const segment of segmentsGras(msg.text)) {
      if (segment.gras) {
        const fort = document.createElement('strong');
        fort.textContent = segment.texte;
        texte.append(fort);
      } else {
        // Une chaîne passée à append devient un nœud texte, jamais du HTML.
        texte.append(segment.texte);
      }
    }
  } else {
    texte.textContent = msg.text;
  }
  li.append(nom, texte);
  return li;
}

function creerIndicateur() {
  const li = document.createElement('li');
  li.dataset.role = 'assistant';
  li.className = 'en-attente';
  // Le statut annonce déjà « Astra observe le ciel… » aux lecteurs d'écran.
  li.setAttribute('aria-hidden', 'true');
  const nom = document.createElement('span');
  nom.className = 'auteur';
  nom.textContent = 'Astra';
  const points = document.createElement('span');
  points.className = 'points';
  points.append(document.createElement('i'), document.createElement('i'), document.createElement('i'));
  li.append(nom, points);
  return li;
}

export function renderMessages(messages, container, { enAttente = false } = {}) {
  const lignes = messages.map((msg) => creerBulle(msg));
  if (enAttente) {
    lignes.push(creerIndicateur());
  }
  container.replaceChildren(...lignes);
  container.scrollTop = container.scrollHeight;
}

// « J-12 » : le compte à rebours tient sur une ligne.
function compteARebours(jours) {
  return jours <= 0 ? 'ce soir' : `J-${jours}`;
}

export function renderCiel(resume, panneau) {
  const { lune, filantes } = resume;
  const champ = (nom) => panneau.querySelector(`[data-ciel="${nom}"]`);
  champ('date').textContent = dateEnClair(resume.date, 'complet');
  champ('lune').setAttribute('d', cheminLune(lune.fraction));
  champ('phase').textContent = lune.nom;
  champ('eclairage').textContent = `Éclairée à ${pourcentage(lune.eclairage)} · jour ${Math.floor(lune.age) + 1} du cycle`;
  champ('curseur').style.left = `${(lune.fraction * 100).toFixed(1)}%`;
  champ('pleine').textContent = lune.nom === 'Pleine Lune'
    ? 'en ce moment'
    : `${dateEnClair(resume.pleineLune)} · ${compteARebours(resume.joursAvantPleineLune)}`;
  champ('filantes').textContent = `${filantes.nom} · ${compteARebours(filantes.jours)}`;
  champ('gene').textContent = resume.gene;
  champ('gene').dataset.gene = resume.gene;
  panneau.style.setProperty('--eclat', lune.eclairage.toFixed(2));
}

// Le fichier voyage dans le lien lui-même (URL data:), sans passer par le serveur.
export function telecharger(nomFichier, texte) {
  const lien = document.createElement('a');
  lien.href = `data:text/plain;charset=utf-8,${encodeURIComponent(texte)}`;
  lien.download = nomFichier;
  lien.click();
}
