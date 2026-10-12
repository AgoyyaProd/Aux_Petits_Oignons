/**
 * Lecture des étapes d'une recette, sans IA et sans modifier le texte :
 *  - quels ingrédients chaque étape utilise (pour afficher leurs quantités sous l'étape) ;
 *  - quelles durées elle contient (pour proposer des minuteurs).
 * Fonctions pures et déterministes, testées sur tout le catalogue.
 */

/** Minuscules, sans accents ni ligatures, apostrophes et ponctuation remplacées par des espaces. */
export function normalizeText(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
}

const STOPWORDS = new Set([
  "de",
  "d",
  "du",
  "des",
  "a",
  "au",
  "aux",
  "en",
  "la",
  "le",
  "les",
  "et",
]);

/**
 * Noms alternatifs : comment les étapes désignent l'ingrédient quand ce n'est pas par son
 * nom complet (« le cube », « la viande », « saler »). Clés normalisées, sans parenthèses.
 * Chaque entrée est une expression régulière appliquée au texte normalisé.
 */
const EXTRA_ALIASES: Readonly<Record<string, readonly string[]>> = {
  "bouillon cube de legumes": ["cubes?", "bouillon"],
  "bouillon cube de volaille": ["cubes?", "bouillon"],
  "boeuf hache": ["viande", "steaks?"],
  "boeuf a mijoter": ["boeuf", "viande"],
  "steak de boeuf": ["steaks?", "boeuf"],
  veau: ["viande"],
  agneau: ["viande"],
  "cuisse de poulet": ["cuisses?", "poulet"],
  "filet de poulet": ["poulet"],
  "escalope de dinde": ["escalopes?", "dinde"],
  "filet mignon de porc": ["filet mignon", "porc", "viande"],
  "cote de porc": ["cotes?"],
  "pave de saumon": ["paves?", "saumon", "poisson"],
  cabillaud: ["poisson", "dos"],
  "saumon fume": ["saumon"],
  "pomme de terre grenaille": ["grenailles?"],
  "pomme de terre": ["frites"],
  "tomate cerise": ["tomates? cerises?"],
  "tomates concassees en boite": ["tomates?"],
  "concentre de tomate": ["concentre"],
  "coulis de tomate": ["coulis"],
  "creme fraiche epaisse": ["creme"],
  "creme liquide": ["creme"],
  "fromage de chevre": ["chevre"],
  "pate brisee": ["pate"],
  "pate feuilletee": ["pate"],
  "pates a lasagne": ["pates"],
  "noix de muscade": ["muscade"],
  "graines de sesame": ["sesame"],
  "sauce soja": ["soja"],
  "nouilles de riz": ["nouilles"],
  "tortillas de ble": ["tortillas?"],
  beurre: ["beurrer"],
  sel: ["saler", "salee?s?"],
  "poivre noir": ["poivrer", "poivrez"],
  "sirop d erable": ["sirop"],
  "extrait de vanille": ["vanille"],
  "flocons d avoine": ["flocons"],
  "jambon blanc": ["jambon"],
  oeuf: ["jaunes?", "blancs"],
};

/** Expressions qui ne doivent pas être prises pour l'ingrédient (« pommes de terre » ≠ pommes). */
const EXCLUDE: Readonly<Record<string, string>> = {
  pomme: "pommes? de terre",
  tomate: "tomates? (cerises?|concassees)|concentre de tomates?|coulis de tomates?|jus des tomates",
  // L'eau de la recette (bouillon, sauce), pas celle des casseroles ni du rinçage.
  eau: "d eau|eau (bouillante|froide|salee|soit claire)|filet d eau",
  lait: "lait de coco",
  vin: "vinaigre",
  oignon: "oignons? rouges?",
};

function baseName(name: string): string {
  return normalizeText(name.replace(/\([^)]*\)/g, " ")).trim();
}

/** Mot avec pluriel facultatif (s ou x). */
function wordPattern(word: string): string {
  return `${word}(?:s|x)?`;
}

/** Noms possibles d'un ingrédient dans le texte, du plus précis au plus général. */
export function ingredientAliases(name: string): string[] {
  const base = baseName(name);
  const words = base.split(" ").filter(Boolean);
  const aliases: string[] = [];
  for (let n = words.length; n >= 1; n -= 1) {
    const prefix = words.slice(0, n);
    if (STOPWORDS.has(prefix[prefix.length - 1]!)) continue;
    aliases.push(prefix.map(wordPattern).join(" "));
  }
  for (const extra of EXTRA_ALIASES[base] ?? []) aliases.push(extra);
  return [...new Set(aliases)];
}

interface Candidate {
  id: string;
  pattern: RegExp;
  exclude: RegExp | null;
  /** Plus l'alias est long, plus il est prioritaire (« huile de sésame » avant « sésame »). */
  weight: number;
}

/**
 * Pour chaque étape, les ingrédients qu'elle cite pour la première fois. Un ingrédient n'est
 * rattaché qu'à une étape : celle où on commence à l'utiliser (souvent sa préparation).
 * En cas d'ambiguïté, l'alias le plus long l'emporte et le texte reconnu n'est plus réutilisé.
 */
export function matchStepIngredients(
  steps: readonly string[],
  ingredients: readonly { id: string; name: string }[],
): string[][] {
  const candidates: Candidate[] = ingredients.flatMap((ing) => {
    const base = baseName(ing.name);
    const exclude = EXCLUDE[base] ? new RegExp(` (?:${EXCLUDE[base]}) `, "g") : null;
    return ingredientAliases(ing.name).map((alias) => ({
      id: ing.id,
      pattern: new RegExp(` ${alias} `, "g"),
      exclude,
      weight: alias.length,
    }));
  });
  candidates.sort((a, b) => b.weight - a.weight);

  const seen = new Set<string>();
  return steps.map((step) => {
    let text = normalizeText(step);
    const found: string[] = [];
    for (const c of candidates) {
      let local = text;
      if (c.exclude) local = local.replace(c.exclude, (m) => " ".repeat(m.length));
      c.pattern.lastIndex = 0;
      const m = c.pattern.exec(local);
      if (!m) continue;
      // Le texte reconnu est consommé, même pour un ingrédient déjà rattaché à une étape
      // précédente : « le reste des tomates » ne doit pas être attribué à un autre ingrédient.
      text =
        text.slice(0, m.index + 1) +
        "#".repeat(m[0].length - 2) +
        text.slice(m.index + m[0].length - 1);
      if (!seen.has(c.id)) {
        seen.add(c.id);
        found.push(c.id);
      }
    }
    // Ordre d'apparition dans l'étape, plus naturel à lire.
    const order = ingredients.map((i) => i.id);
    return found.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  });
}

export interface StepTimer {
  /** Durée du minuteur, en secondes (borne basse d'une fourchette : on vérifie plus tôt). */
  seconds: number;
  /** Libellé tel qu'écrit dans l'étape, abrégé (« 8 à 10 min », « 1 h 15 »). */
  label: string;
}

const NUMBER = "(\\d+)";

/** Durées citées dans une étape, dans l'ordre du texte, sans doublon. */
export function parseStepTimers(step: string): StepTimer[] {
  const text = step.replace(/ /g, " ");
  const found: { index: number; timer: StepTimer }[] = [];
  const taken: [number, number][] = [];
  const overlaps = (start: number, end: number) => taken.some(([s, e]) => start < e && end > s);
  const add = (index: number, length: number, timer: StepTimer) => {
    if (timer.seconds <= 0 || overlaps(index, index + length)) return;
    taken.push([index, index + length]);
    found.push({ index, timer });
  };

  // « 1 h 15 », « 2 h 30 », « 1 h »
  for (const m of text.matchAll(new RegExp(`${NUMBER}\\s*h(?:\\s*${NUMBER})?\\b`, "g"))) {
    const h = Number(m[1]);
    const min = m[2] ? Number(m[2]) : 0;
    add(m.index, m[0].length, {
      seconds: h * 3600 + min * 60,
      label: `${h} h${min ? ` ${String(min).padStart(2, "0")}` : ""}`,
    });
  }
  // « 4 heures », « 1 heure »
  for (const m of text.matchAll(new RegExp(`${NUMBER}\\s*heures?\\b`, "g"))) {
    add(m.index, m[0].length, { seconds: Number(m[1]) * 3600, label: `${m[1]} h` });
  }
  // « 20 minutes », « 8 à 10 minutes », « 3 à 4 min »
  for (const m of text.matchAll(
    new RegExp(`${NUMBER}(?:\\s*(?:à|-)\\s*${NUMBER})?\\s*min(?:ute)?s?\\b`, "g"),
  )) {
    const low = Number(m[1]);
    add(m.index, m[0].length, {
      seconds: low * 60,
      label: m[2] ? `${low} à ${m[2]} min` : `${low} min`,
    });
  }
  // « 30 secondes »
  for (const m of text.matchAll(new RegExp(`${NUMBER}\\s*secondes?\\b`, "g"))) {
    add(m.index, m[0].length, { seconds: Number(m[1]), label: `${m[1]} s` });
  }

  const unique = new Map<string, StepTimer>();
  for (const { timer } of found.sort((a, b) => a.index - b.index)) {
    if (!unique.has(timer.label)) unique.set(timer.label, timer);
  }
  return [...unique.values()];
}

/** « 4:05 », « 1:02:30 » : affichage d'un compte à rebours. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}
