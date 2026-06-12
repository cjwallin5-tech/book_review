/**
 * Second-pass description cleanup:
 *   1. Replaces foreign-language descriptions (Snow Crash in German, Homo Deus in French)
 *   2. Replaces remaining bad descriptions (marketing openers, Wikipedia-style, all-caps)
 *   3. Truncates every long description at a sentence boundary (~350 chars max)
 */

import db from "./db.js";

// ── Hardcoded replacements for specific bad cases ─────────────────────────────
const REPLACEMENTS: Record<string, string> = {
  "snow crash":
    "In a near-future America split between corporate city-states, hacker and pizza deliveryman Hiro Protagonist stumbles onto a mystery involving a new drug called Snow Crash that can crash the human mind just like software. Neal Stephenson's cyberpunk classic invented much of the vocabulary of virtual reality.",
  "homo deus":
    "Having explored humanity's past in Sapiens, Yuval Noah Harari turns to the future — asking what humans will pursue once famine, plague, and war are largely conquered. His answer is unsettling: immortality, happiness, and godlike powers, at the cost of everything that makes us human.",
  "anne of green gables":
    "When the elderly Cuthberts of Prince Edward Island send for a farm boy to help out, they mistakenly receive Anne Shirley — an imaginative, red-haired orphan girl who transforms their quiet lives. L.M. Montgomery's beloved novel is a warm portrait of childhood, belonging, and finding your place.",
  "a darker shade of magic":
    "Kell is one of the last Antari — rare magicians who can travel between parallel versions of London, each with a different relationship to magic. When a dangerous artifact from the forbidden Black London ends up in his possession, he and a street thief are pulled into a deadly conspiracy.",
  "golden son":
    "Having infiltrated the ruling Gold caste and earned their respect, Darrow of Lykos must now navigate the treacherous politics of the Society's elite — battles of power, betrayal, and sacrifice that will decide whether a revolution can be born. The second book in Pierce Brown's Red Rising trilogy.",
  "the hate u give":
    "Sixteen-year-old Starr Carter witnesses her unarmed childhood friend Khalil shot dead by a police officer. Now she must decide whether to speak out and risk everything — her safety, her relationships between two worlds — or stay silent. Angie Thomas's debut novel is a raw, vital story about racism, identity, and courage.",
  "the name of the wind":
    "Told in his own words at an inn in a quiet corner of the world, this is the story of Kvothe — a legendary wizard and fighter whose brilliance and recklessness made him famous and eventually broke him. Patrick Rothfuss's fantasy debut is an intricate, beautifully told story of a gifted young man and his complicated ascent.",
  "the wicked king":
    "Having manipulated her way into power at the treacherous Faerie court, Jude Duarte must now keep her grip on the cruel prince she controls — while enemies circle and her own loyalties fracture. The second book in Holly Black's Folk of the Air trilogy.",
  "the wise man's fear":
    "Kvothe continues his education at the University and his search for the Chandrian, venturing to the courts of the Maer, the land of the Adem, and the secret school of a legendary traveler. Patrick Rothfuss's second Kingkiller Chronicle volume is richly detailed and emotionally layered.",
  "bel canto":
    "At a glamorous birthday party in an unnamed South American country, terrorists seize the mansion and its guests — including a world-famous soprano and a Japanese businessman who loves her. As the months-long siege stretches on, unexpected bonds form between captives and captors. Ann Patchett's luminous novel about beauty and human connection.",
  "piranesi":
    "Piranesi lives alone in a vast, labyrinthine House whose endless halls are filled with tidal statues and an ever-shifting ocean. He keeps meticulous journals, speaks to the dead, and receives visits from the Other — until strange clues begin pointing to a world beyond the House. Susanna Clarke's hypnotic, mysterious novel.",
  "between the world and me":
    "Written as a letter to his teenage son, Ta-Nehisi Coates reflects on his own coming-of-age in Baltimore and the vulnerability of Black bodies in America. Drawing on history, personal loss, and the writings of James Baldwin, it is an urgent meditation on race and what it means to inhabit a Black body in this country.",
  "insurgent":
    "With the Dauntless compound in chaos after the Erudite simulation attack, Tris Prior and Tobias search for allies — and answers — about the truth the Erudite were prepared to kill to suppress. The second Divergent novel raises the stakes of Tris's moral choices and the cost of loyalty.",
  "the girl on the train":
    "Rachel takes the same train every day and watches a couple in a house by the tracks, constructing a fantasy about their perfect life. Then the woman goes missing, and Rachel — unreliable, alcoholic, desperate — becomes entangled in the investigation. Paula Hawkins's tightly wound psychological thriller.",
  "the power of habit":
    "Charles Duhigg explores the science behind why habits exist and how they can be changed. Drawing on research across neuroscience, psychology, and business, he explains the three-step loop — cue, routine, reward — that governs most of our behavior and shows how understanding it can transform individuals and organizations.",
  "prey":
    "Nanotechnology researcher Jack Fielding arrives at a remote Nevada laboratory to find his wife acting strangely and a swarm of microscopic machines that have escaped containment — and are evolving with terrifying speed. Crichton's thriller is a prescient warning about runaway self-replicating technology.",
  "jonathan strange and mr norrell":
    "In an alternate 19th-century England, the reclusive magician Mr. Norrell revives practical magic and assists in the Napoleonic Wars, while his brilliant student Jonathan Strange proves more daring — and more dangerous. Susanna Clarke's debut novel is an immersive, footnote-rich portrait of a world where magic is as real as history.",
  "red rising":
    "Darrow, a low-caste Red miner on Mars, discovers his people are slaves building a world they will never see — then infiltrates the society of the ruling Golds from within to tear it down. Pierce Brown's propulsive debut opens an epic science-fantasy trilogy about revolution and the price of power.",
  "turtles all the way down":
    "Sixteen-year-old Aza Holmes is consumed by obsessive thought spirals that feel impossible to escape. When her childhood friend drags her into investigating a missing billionaire, Aza must navigate both the mystery and her own mind. John Green's most autobiographical novel, unflinching about mental illness.",
  "the priory of the orange tree":
    "A queendom without an heir, a dragon-worshipping empire to the east, and an ancient evil beginning to stir beneath the ocean. Three women on different sides of a divided world must find a way to work together before a catastrophe thought to be mere legend becomes real. Samantha Shannon's standalone epic fantasy.",
  "jonathan strange and mr. norrell":
    "In an alternate 19th-century England, the reclusive magician Mr. Norrell revives practical magic and assists in the Napoleonic Wars, while his brilliant student Jonathan Strange proves more daring — and more dangerous. Susanna Clarke's debut novel is an immersive, footnote-rich portrait of a world where magic is as real as history.",
};

// ── Sentence-boundary truncation ─────────────────────────────────────────────
// Truncates a description at the last complete sentence that fits within maxLen.
function truncateAtSentence(text: string, maxLen = 380): string {
  if (text.length <= maxLen) return text;

  // Find sentence endings within range
  const endings = /[.!?]/g;
  let lastGoodEnd = -1;
  let match: RegExpExecArray | null;

  while ((match = endings.exec(text)) !== null) {
    if (match.index >= maxLen) break;
    // Make sure it's really an end (followed by space/end or a closing bracket)
    const next = text[match.index + 1];
    if (!next || next === " " || next === "\n" || next === '"' || next === "'") {
      lastGoodEnd = match.index + 1;
    }
  }

  if (lastGoodEnd > 50) {
    return text.slice(0, lastGoodEnd).trim();
  }

  // Fallback: cut at last space before maxLen
  const cut = text.lastIndexOf(" ", maxLen);
  return text.slice(0, cut > 50 ? cut : maxLen).trim() + "…";
}

// ── Apply fixes ───────────────────────────────────────────────────────────────
const books = db
  .prepare("SELECT id, title, description FROM books ORDER BY title")
  .all() as { id: number; title: string; description: string }[];

const updateDesc = db.prepare("UPDATE books SET description = ? WHERE id = ?");

let replaced = 0;
let truncated = 0;
let unchanged = 0;

for (const book of books) {
  const key = book.title.toLowerCase().trim();
  const current = book.description || "";

  // Check for hardcoded replacement first
  if (REPLACEMENTS[key] !== undefined) {
    const newDesc = REPLACEMENTS[key];
    if (newDesc !== current) {
      updateDesc.run(newDesc, book.id);
      console.log(`✓ replaced: ${book.title}`);
      replaced++;
    } else {
      unchanged++;
    }
    continue;
  }

  // Apply sentence-boundary truncation to long descriptions
  const cleaned = truncateAtSentence(current, 380);
  if (cleaned !== current && cleaned.length >= 40) {
    updateDesc.run(cleaned, book.id);
    truncated++;
  } else {
    unchanged++;
  }
}

console.log(`\n──────────────────────────────────`);
console.log(`✓ Replaced:  ${replaced}`);
console.log(`✂ Truncated: ${truncated}`);
console.log(`– Unchanged: ${unchanged}`);
