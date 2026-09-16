// Astra — le ciel calculé. Module pur : aucun document, aucun stockage (testé par tests/ciel.test.js).

const JOUR = 86400000;

// La Lune retrouve la même phase tous les 29,53 jours en moyenne.
export const MOIS_LUNAIRE = 29.530588853;

// Point de départ : une nouvelle Lune connue, le 6 janvier 2000 à 18 h 14 UTC.
const NOUVELLE_LUNE_REPERE = Date.UTC(2000, 0, 6, 18, 14);

const PHASES = [
  'Nouvelle Lune',
  'Premier croissant',
  'Premier quartier',
  'Gibbeuse croissante',
  'Pleine Lune',
  'Gibbeuse décroissante',
  'Dernier quartier',
  'Dernier croissant'
];

// Pics annuels des pluies d'étoiles filantes (mois de 1 à 12).
const ETOILES_FILANTES = [
  { nom: 'Quadrantides', mois: 1, jour: 3, note: 'un pic très court, de quelques heures' },
  { nom: 'Lyrides', mois: 4, jour: 22, note: 'une pluie discrète' },
  { nom: 'Êta Aquarides', mois: 5, jour: 6, note: 'basses sur l’horizon depuis la France' },
  { nom: 'Perséides', mois: 8, jour: 12, note: 'la plus célèbre, en plein été' },
  { nom: 'Draconides', mois: 10, jour: 8, note: 'souvent discrètes, parfois une surprise' },
  { nom: 'Orionides', mois: 10, jour: 21, note: 'des poussières de la comète de Halley' },
  { nom: 'Léonides', mois: 11, jour: 17, note: 'parmi les plus rapides' },
  { nom: 'Géminides', mois: 12, jour: 14, note: 'la plus riche de l’année' }
];

// Éclipses visibles depuis la France, au moins en partie.
const ECLIPSES = [
  { date: '2026-08-12', texte: 'éclipse totale de Soleil, totale en Espagne' },
  { date: '2026-08-28', texte: 'éclipse partielle de Lune, au petit matin' },
  { date: '2027-02-20', texte: 'éclipse de Lune par la pénombre, très discrète' },
  { date: '2027-08-02', texte: 'éclipse totale de Soleil, totale dans le sud de l’Espagne et au Maroc' }
];

const FORMATS = {
  court: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' }),
  annee: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }),
  complet: new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })
};

export function phaseLune(date) {
  const jours = (date.getTime() - NOUVELLE_LUNE_REPERE) / JOUR;
  // Modulo toujours positif, même pour une date avant l'an 2000.
  const age = ((jours % MOIS_LUNAIRE) + MOIS_LUNAIRE) % MOIS_LUNAIRE;
  const fraction = age / MOIS_LUNAIRE;
  return {
    nom: PHASES[Math.round(fraction * 8) % 8],
    age,
    fraction,
    eclairage: (1 - Math.cos(2 * Math.PI * fraction)) / 2,
    croissante: fraction < 0.5
  };
}

export function prochainePleineLune(date) {
  const { age } = phaseLune(date);
  const jours = (MOIS_LUNAIRE / 2 - age + MOIS_LUNAIRE) % MOIS_LUNAIRE;
  return new Date(date.getTime() + jours * JOUR);
}

// Jours entiers entre deux dates, comptés sur le calendrier.
function joursEntre(debut, fin) {
  const a = Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth(), debut.getUTCDate());
  const b = Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth(), fin.getUTCDate());
  return Math.round((b - a) / JOUR);
}

export function prochainesEtoilesFilantes(date) {
  const annee = date.getUTCFullYear();
  for (const decalage of [0, 1]) {
    for (const pluie of ETOILES_FILANTES) {
      const pic = new Date(Date.UTC(annee + decalage, pluie.mois - 1, pluie.jour, 12));
      const jours = joursEntre(date, pic);
      if (jours >= 0) {
        return { nom: pluie.nom, note: pluie.note, date: pic, jours };
      }
    }
  }
  return null;
}

export function prochainesEclipses(date, combien = 2) {
  return ECLIPSES
    .map((eclipse) => ({ texte: eclipse.texte, date: new Date(`${eclipse.date}T12:00:00Z`) }))
    .filter((eclipse) => joursEntre(date, eclipse.date) >= 0)
    .slice(0, combien);
}

export function geneLunaire(eclairage) {
  if (eclairage < 0.25) return 'faible';
  if (eclairage < 0.65) return 'moyenne';
  return 'forte';
}

export function resumeCiel(date) {
  const lune = phaseLune(date);
  const pleineLune = prochainePleineLune(date);
  return {
    date,
    lune,
    pleineLune,
    joursAvantPleineLune: Math.round((pleineLune.getTime() - date.getTime()) / JOUR),
    filantes: prochainesEtoilesFilantes(date),
    gene: geneLunaire(lune.eclairage)
  };
}

export function dateEnClair(date, format = 'court') {
  return FORMATS[format].format(date);
}

export function delaiEnClair(jours) {
  if (jours <= 0) return 'aujourd’hui';
  if (jours === 1) return 'demain';
  return `dans ${jours} jours`;
}

export function pourcentage(eclairage) {
  // Espace insécable : « 13 % » ne se coupe jamais en fin de ligne.
  return `${Math.round(eclairage * 100)} %`;
}
