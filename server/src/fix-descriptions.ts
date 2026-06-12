/**
 * Replaces bad descriptions (empty, foreign language, first-sentence quotes,
 * marketing copy) with concise accurate English synopses.
 *
 * Run with: npx tsx src/fix-descriptions.ts
 */

import db from "./db.js";

// ── Books that need a completely new description ──────────────────────────────
// Keyed by lowercase title for case-insensitive matching.
const DESCRIPTIONS: Record<string, string> = {
  // Empty
  "beartown":
    "A small Swedish hockey town is torn apart when a violent crime involving its star junior player ripples through the community. Fredrik Backman's novel explores loyalty, silence, and the impossible cost of protecting the people we love.",
  "beloved":
    "A former enslaved woman living in post-Civil War Ohio is haunted by the ghost of her infant daughter, forcing her to confront the horrors slavery drove her to commit. Toni Morrison's Pulitzer Prize-winning masterwork on trauma, memory, and the violence of the past.",
  "cannery row":
    "Life in a Monterey, California sardine-canning district is captured through the interlocking stories of its colorful, down-and-out residents and their affection for a gentle marine biologist. Steinbeck's warm, episodic portrait of poverty and community.",
  "catching fire":
    "After surviving the Hunger Games, Katniss Everdeen discovers her act of defiance has ignited rebellion across the districts, forcing President Snow to drag her back into the arena. The second book in Suzanne Collins's trilogy raises the stakes of revolution.",
  "crime and punishment":
    "A destitute St. Petersburg student murders a pawnbroker, convinced his superior intellect places him beyond moral law. Dostoevsky's masterwork follows the psychological unraveling that results from the crime, and the long path toward confession and redemption.",
  "moby dick":
    "Sailor Ishmael joins the crew of the Pequod under the monomaniacal Captain Ahab, who has vowed revenge on the white whale that tore off his leg. Melville's sweeping novel is both a thrilling sea adventure and a meditation on obsession, fate, and the limits of human will.",
  "mockingjay":
    "Katniss Everdeen becomes the reluctant symbol of a full-scale revolution against the Capitol, but the war's true costs — and the people who wield her image — prove as dangerous as the enemy. Collins's final Hunger Games novel is a brutal, honest portrait of war.",
  "one hundred years of solitude":
    "Seven generations of the Buendía family rise and fall in the mythical Colombian town of Macondo, where the miraculous and the mundane coexist. García Márquez's Nobel Prize-winning novel is the defining work of magical realism.",
  "pet sematary":
    "A doctor and his family move to rural Maine, where a mysterious burial ground near their home has the power to bring the dead back — though never quite right. Stephen King's darkest novel is a relentless exploration of grief, denial, and what love will drive a parent to do.",
  "the adventures of tom sawyer":
    "The mischievous Tom Sawyer gets into scrapes along the Mississippi River — from whitewashing a fence to witnessing a graveyard murder — in Twain's affectionate portrait of American boyhood in the 1840s.",
  "the book thief":
    "During World War II, a young girl named Liesel steals books and shares their words with her neighbors during bomb raids while her foster family hides a Jewish man in their basement. Narrated by Death, Marcus Zusak's novel is a profound tribute to the power of stories.",
  "the brothers karamazov":
    "Three brothers — the passionate Dmitri, the intellectual Ivan, and the saintly Alyosha — are drawn into a crisis when their dissolute father is murdered in a provincial Russian town. Dostoevsky's final and greatest novel is a sweeping inquiry into faith, doubt, and free will.",
  "the catcher in the rye":
    "After being expelled from prep school, sixteen-year-old Holden Caulfield wanders New York City for three days, raging against the phoniness of adult society while struggling with grief and loneliness. Salinger's novel became the defining voice of adolescent alienation.",
  "the count of monte cristo":
    "Falsely imprisoned for years on a remote island, Edmond Dantès escapes, uncovers a hidden fortune, and methodically takes revenge on the three men who destroyed his life. Dumas's epic adventure is a story of patience, transformation, and the double edge of justice.",
  "the girl who played with fire":
    "Hacker Lisbeth Salander becomes the prime suspect in a double murder connected to a sex trafficking investigation that journalist Mikael Blomkvist is pursuing. The second Millennium novel pulls back the curtain on Salander's violent past.",
  "the hitchhiker's guide to the galaxy":
    "Moments before Earth is demolished to make way for a hyperspace bypass, Arthur Dent is rescued by his alien friend Ford Prefect and hurled across the galaxy. Douglas Adams's gloriously absurdist comedy asks the big questions — and discovers the answer is 42.",
  "the iliad":
    "Homer's ancient epic covers the final weeks of the Trojan War, centering on the fury of the Greek warrior Achilles after a dishonor by his commander Agamemnon, and its catastrophic consequences for both sides. A foundational work exploring glory, fate, and the waste of war.",
  "the martian":
    "After a sudden storm forces his crew to evacuate Mars, astronaut Mark Watney is left behind and must use his ingenuity to survive on a planet with no food, no communications, and no rescue plan. Andy Weir's hard science thriller is fueled by humor and relentless problem-solving.",
  "the princess bride":
    "Farm boy Westley becomes a pirate to return to his love Buttercup, then must face a scheming prince, a master swordsman, a giant, and a criminal genius to win her back. William Goldman's adventure-romance-comedy is a joyful sendup of classic fairy-tale conventions.",
  "the three musketeers":
    "Young Gascon d'Artagnan travels to Paris and befriends three royal musketeers — Athos, Porthos, and Aramis — as they uncover a conspiracy threatening the French crown and battle the scheming Cardinal Richelieu. Dumas's swashbuckling classic of loyalty and honor.",
  "the time traveler's wife":
    "Henry DeTamble has a genetic disorder that causes him to involuntarily vanish to other points in time, leaving his wife Clare to navigate their relationship across the gaps of his disappearances. Audrey Niffenegger's love story explores presence, absence, and fate.",
  "the woman in the window":
    "Agoraphobic child psychologist Anna Fox, confined to her New York City home, believes she has witnessed a violent crime through her neighbor's window — but no one believes her account. A.J. Finn's psychological thriller plays with unreliable memory and suburban secrets.",
  "the hunchback of notre dame":
    "The deformed bellringer Quasimodo of Notre-Dame Cathedral becomes devoted to the beautiful dancer Esmeralda, while the archdeacon Frollo's obsession with her sets off a chain of tragic events in 15th-century Paris. Hugo's Gothic novel is a condemnation of social cruelty and religious hypocrisy.",

  // Foreign language — book opening sentences, no real description
  "the hobbit":
    "Bilbo Baggins, a comfort-loving hobbit, is swept into an unexpected adventure when the wizard Gandalf recruits him as burglar for a company of thirteen dwarves seeking to reclaim their mountain kingdom from the dragon Smaug. Tolkien's beloved prelude to The Lord of the Rings.",
  "the shining":
    "Struggling writer Jack Torrance takes his wife and young son to caretake an isolated Colorado hotel over winter. As snowbound isolation warps his mind, his son Danny's psychic gift senses the hotel's malevolent history stirring to life. King's definitive haunted-house novel.",
  "fahrenheit 451":
    "In a future America, 'firemen' burn books rather than fight fires, enforcing a society built on distraction and shallow pleasures. Fireman Guy Montag begins to question everything after a chance encounter with a girl who still reads. Bradbury's enduring warning against censorship.",
  "the two towers":
    "The Fellowship fractured, the quest continues on multiple fronts: Frodo and Sam creep toward Mordor guided by the treacherous Gollum, while Aragorn, Legolas, and Gimli race across the plains of Rohan. The second volume of Tolkien's The Lord of the Rings.",
  "mistborn":
    "In a world of ash and eternal mist ruled by an immortal tyrant, a crew of thieves plans the ultimate heist: toppling an empire. Brandon Sanderson's fantasy introduces a unique magic system based on ingesting and burning metals to gain extraordinary powers.",
  "the final empire":
    "In a world of ash and eternal mist ruled by an immortal tyrant, a crew of thieves plans the ultimate heist: toppling an empire. Brandon Sanderson's fantasy introduces a unique magic system based on ingesting and burning metals to gain extraordinary powers.",

  // Marketing blurbs / Netflix promo / series boilerplate
  "the dark forest":
    "Facing an alien invasion still centuries away, humanity is paralyzed by distrust and infiltrated by alien agents who can read every thought. One man is tasked with devising a plan so secret it can exist only in the silence of a single human mind. Liu Cixin's compelling sequel to The Three-Body Problem.",
  "the three-body problem":
    "During China's Cultural Revolution, a scientist sends a message into space making contact with a dying alien civilization. When they plot to invade, a physicist must decide whether to warn humanity or help their approach. Liu Cixin's Hugo Award-winning sci-fi epic.",
  "throne of glass":
    "Celaena Sardothien, a legendary assassin, is released from a brutal prison colony to compete in a tournament for the role of the king's champion. But the competitors are dying one by one under mysterious circumstances. Sarah J. Maas's epic fantasy debut.",
  "words of radiance":
    "Shallan Davar travels toward the Shattered Plains to find the legendary city of Urithiru, while Kaladin Stormblessed struggles to protect the highprinces despite his distrust of lighteyes. The second Stormlight Archive novel deepens the world's mythology and raises the stakes of the Desolation to come.",
  "six of crows":
    "Criminal prodigy Kaz Brekker assembles an unlikely crew for an impossible heist in a heavily fortified prison compound — a job that could make them rich, or get them all killed. Leigh Bardugo's heist fantasy set in the world of the Grishaverse.",
  "november 9":
    "On November 9th each year, aspiring author Fallon meets Ben, a stranger who enters her life by accident and becomes the most important part of it. Colleen Hoover's romance unfolds one day at a time over five years, questioning whether love can survive distance and hidden truths.",
  "inferno":
    "Awakening in Florence with no memory of the past few days, Harvard symbologist Robert Langdon finds himself caught in a deadly race to stop a bioterrorism plot linked to Dante's Inferno and a secret society. The fourth Robert Langdon thriller by Dan Brown.",
  "iron flame":
    "Violet Sorrengail returns for her second year at Basgiath War College, where the war outside the walls is growing and the secrets she uncovered threaten everything she thought she knew. The second book in Rebecca Yarros's Empyrean dragon-rider series.",
  "the way of kings":
    "On the war-torn world of Roshar, a young soldier named Kaladin is enslaved as a bridgeman while a scholar named Shallan seeks a legendary knight's power to save her family. Brandon Sanderson's epic opens a vast fantasy saga rooted in ancient myths and a coming apocalypse.",
  "the hero of ages":
    "With the Lord Ruler dead and the world unraveling under volcanic ash and deadly mists, Vin and Elend race to discover what the ancient prophecies demand before civilization collapses entirely. The concluding volume of Brandon Sanderson's original Mistborn trilogy.",
  "klara and the sun":
    "Klara is an Artificial Friend — a solar-powered robot sold as a companion for children — who observes human behavior with keen attention from a shop window and then from the home of a teenage girl named Josie. Ishiguro's quiet, unsettling novel asks what it means to love and to be human.",
  "the lincoln highway":
    "In 1954, eighteen-year-old Emmett Watson is released from a work farm in Kansas intending to drive west with his younger brother to start a new life. But two stowaways hijack the journey eastward, setting off a week-long odyssey across 1950s America. Amor Towles at his most sweeping.",
  "a brief history of time":
    "Stephen Hawking explains the origins and nature of the universe for general readers — from the Big Bang to black holes and the arrow of time — without a single equation. A landmark work of popular science that made cosmology accessible to millions.",
  "the overstory":
    "Nine Americans whose lives become intertwined with trees — from a family's chestnut to an ancient redwood — are drawn into activism as the last old-growth forests are destroyed. Richard Powers's Pulitzer Prize-winning novel is an epic argument for the rights of the natural world.",
  "the maidens":
    "Therapist Mariana Andros becomes convinced that her niece's Cambridge professor is a murderer, but the police dismiss her theory and the charming, manipulative academic seems untouchable. Alex Michaelides's psychological thriller about obsession, Greek tragedy, and secrets.",
  "recursion":
    "New York cop Barry Sutton investigates a disturbing phenomenon: people suddenly plagued by memories of lives they never lived. Meanwhile, neuroscientist Helena Smith works to perfect a device that allows users to revisit and relive their memories. Blake Crouch's mind-bending thriller about the nature of reality.",
  "the magicians":
    "Quentin Coldwater discovers that the magical world of his favorite childhood books is real and gains admission to Brakebills College for Magical Pedagogy. But mastering magic doesn't bring happiness, and the real Fillory turns out to be far darker than the stories. Lev Grossman's adult deconstruction of fantasy.",
  "the sirens of titan":
    "Malachi Constant, the richest and luckiest man in America, is drawn into a cosmic scheme spanning multiple planets and centuries that seems to have been engineered solely to deliver a message to a stranded alien traveler. Vonnegut's darkly comic meditation on free will and the indifference of the universe.",
  "timeline":
    "A historian investigating a medieval French battlefield is mysteriously transported back to 1357, while his students race to mount a rescue before he is executed. Michael Crichton's time-travel thriller blends quantum physics with the brutal realities of the Hundred Years War.",
  "sphere":
    "A team of scientists investigates a mysterious spacecraft found on the ocean floor — three hundred years old but built in the future. When a giant golden sphere inside begins communicating with them, terrifying things start appearing in the deep. Crichton's claustrophobic psychological thriller.",
  "congo":
    "A joint expedition of corporate agents, a primatologist, and a trained gorilla travels into the heart of the Congo rainforest in search of rare blue diamonds — and finds something much more dangerous. Crichton's adventure novel blends field biology with old-fashioned expedition thriller.",

  // First-line quotes used as descriptions
  "a clockwork orange":
    "In a near-future Britain, teenager Alex and his gang commit random acts of ultraviolence by night while the state watches. When Alex is captured and subjected to an experimental conditioning technique, Burgess's novel becomes a fierce debate about free will, morality, and the limits of the state.",
  "a moveable feast":
    "Ernest Hemingway's posthumously published memoir recalls his years living as a young writer in 1920s Paris — the cafés, the poverty, the literary friendships, and the slow dissolution of his first marriage. A vivid portrait of a city and a generation discovering what it meant to write.",
  "a wrinkle in time":
    "Meg Murry, her brother Charles Wallace, and their friend Calvin travel through a 'tesseract' — a wrinkle in time — to rescue Meg's missing scientist father from the clutches of a dark, totalitarian force. Madeleine L'Engle's beloved science fantasy classic for readers of all ages.",
  "brave new world":
    "In a future World State, stability is enforced through genetic engineering, social conditioning, and the pleasure drug soma. When a man from a 'savage reservation' enters this society, he offers a devastating critique of its cost. Huxley's dystopian masterpiece is even more relevant today.",
  "catch-22":
    "Captain Yossarian, a WWII bombardier stationed in Italy, is caught in a bureaucratic absurdity: to be grounded for mental illness he must ask to be grounded, but asking proves he is sane. Heller's darkly comic anti-war novel invented a new way of capturing the insanity of military logic.",
  "east of eden":
    "Two families — the Trasks and the Hamiltons — play out the biblical story of Cain and Abel across generations in California's Salinas Valley. Steinbeck's sweeping epic, which he considered his greatest work, explores the nature of good and evil and humanity's capacity to choose.",
  "frankenstein or the modern prometheus":
    "Young scientist Victor Frankenstein succeeds in creating life but is horrified by his creation, abandoning the creature who must then navigate a world that rejects him. Shelley's Gothic novel, written when she was eighteen, asks enduring questions about responsibility, creation, and what makes us human.",
  "gone girl":
    "On their fifth wedding anniversary, Nick Dunne's wife Amy disappears, and the media circus that follows begins to reveal the dark truth beneath their seemingly perfect marriage. Gillian Flynn's psychological thriller is a razor-sharp dissection of modern relationships and performance.",
  "holes":
    "Stanley Yelnats is sent to Camp Green Lake — a juvenile detention center in the Texas desert — where the boys are forced to dig holes every day. Stanley begins to suspect the warden is searching for something. Louis Sachar's novel weaves humor, mystery, and social commentary.",
  "jane eyre":
    "Orphaned Jane Eyre survives a harsh childhood to become a governess at Thornfield Hall, where she falls in love with the brooding Mr. Rochester — only to discover a terrible secret he is hiding. Brontë's landmark novel explores independence, morality, and a woman's right to selfhood.",
  "life of pi":
    "After a shipwreck, sixteen-year-old Pi Patel finds himself adrift in the Pacific Ocean on a lifeboat with a Bengal tiger named Richard Parker. His miraculous survival story raises profound questions about the nature of faith, truth, and the stories we tell to make life bearable.",
  "peter pan":
    "The three Darling children are whisked away to Neverland by the boy who never grows up, where they encounter pirates, mermaids, and the Lost Boys. J.M. Barrie's enduring story explores the magic and melancholy of childhood, and the inevitable loss of imagination.",
  "rebecca":
    "A young woman marries a wealthy widower and moves to his grand Cornish estate, where she is haunted by the presence of his glamorous first wife, Rebecca. Daphne du Maurier's atmospheric Gothic thriller is a masterclass in suspense and psychological unease.",
  "slaughterhouse-five":
    "Billy Pilgrim, a WWII soldier who survives the firebombing of Dresden, becomes 'unstuck in time' and experiences his life in non-linear fragments including abduction by aliens. Vonnegut's anti-war masterpiece is darkly funny, deeply humane, and structurally unlike any novel before it.",
  "the andromeda strain":
    "A military satellite crash-lands in an Arizona town, killing nearly every resident. A team of scientists is rushed to an underground facility to identify and contain the extraterrestrial microorganism before it reaches the broader population. Crichton's taut techno-thriller that launched his career.",
  "the color purple":
    "Celie, a young Black woman in the rural American South of the 1930s, survives abuse and finds her voice through letters to God and to her beloved sister. Alice Walker's Pulitzer Prize-winning novel is a story of self-determination, sisterhood, and spiritual liberation.",
  "the da vinci code":
    "Harvard symbologist Robert Langdon is summoned to the Louvre after a curator is murdered inside, setting off a frantic hunt through European art, architecture, and secret societies that threatens the foundations of Christianity. Dan Brown's international blockbuster.",
  "the fault in our stars":
    "Sixteen-year-old Hazel Grace Lancaster, living with terminal cancer, meets Augustus Waters at a support group and the two fall into a surprising, intensely moving love. John Green's novel about illness, literature, and the desperate need to leave a mark on the world.",
  "the giver":
    "In a seemingly perfect society where pain and conflict have been eliminated through 'Sameness,' twelve-year-old Jonas is assigned the role of Receiver of Memory and discovers the truth about what his community has sacrificed. Lois Lowry's groundbreaking dystopian novel.",
  "the handmaid's tale":
    "In the near-future theocratic Republic of Gilead, women have been stripped of rights and the fertile few are forced to serve as reproductive surrogates for the ruling class. Offred narrates her subjugation with clarity and dark wit. Atwood's chilling exploration of patriarchy and power.",
  "the hunger games":
    "In a dystopian future, sixteen-year-old Katniss Everdeen volunteers for the deadly televised Hunger Games to protect her younger sister, then must survive both the arena and the Capitol's political games. Suzanne Collins's trilogy-opening novel is a propulsive story of survival and resistance.",
  "the old man and the sea":
    "An aging Cuban fisherman ventures far out to sea alone and hooks an enormous marlin, beginning an epic three-day struggle between man and fish. Hemingway's Pulitzer Prize-winning novella is a spare, powerful meditation on endurance, pride, and facing defeat with grace.",
  "the wonderful wizard of oz":
    "Dorothy Gale is swept from Kansas to the magical land of Oz by a tornado and must follow the yellow brick road to the Emerald City to find a way home. Along the way she meets the Scarecrow, the Tin Man, and the Cowardly Lion. L. Frank Baum's classic fairy tale.",
  "year of magical thinking, the":
    "After her husband of forty years dies suddenly of a heart attack, Joan Didion describes the year of grief that follows, during which she found herself unable to give away his shoes in case he might need them. A bracingly honest account of loss and the irrationality of mourning.",
  "an ember in the ashes":
    "In a brutal Rome-inspired empire, a Scholar girl named Laia goes undercover as a slave at the empire's military academy to save her captured brother, while an elite soldier named Elias seeks a way out of a life of violence. Sabaa Tahir's fantasy debut is a story of resistance and impossible choices.",
  "ender's game":
    "In a future Earth under threat from alien insectoids, extraordinarily gifted children are trained from a young age at Battle School. Andrew 'Ender' Wiggin is the most talented of all — but the games may not be games. Orson Scott Card's classic blends military strategy with a devastating moral twist.",
  "the left hand of darkness":
    "An envoy from a human-galactic federation arrives on the planet Winter, whose inhabitants have no fixed biological sex, to persuade them to join the coalition. Le Guin's groundbreaking science fiction novel uses gender ambiguity to explore politics, loyalty, and what it means to be human.",
  "song of solomon":
    "Macon 'Milkman' Dead III sets out on a road trip through the American South searching for family gold but instead discovers the history of his family name and the legacy of slavery. Morrison's lyrical, magical novel follows a man's journey toward self-knowledge.",
  "the house on mango street":
    "Esperanza Cordero grows up in a Latino neighborhood of Chicago, navigating poverty, identity, gender, and the desire to become a writer who can leave but also return. Sandra Cisneros's lyrical coming-of-age novel is written in interconnected vignettes of quiet power.",
  "a walk to remember":
    "In a small North Carolina town, popular teenager Landon Carter is thrown together with Jamie Sullivan, the reverend's quiet daughter, and falls unexpectedly in love. Nicholas Sparks's romantic novel is a story about faith, illness, and transformative grace.",
  "commonwealth":
    "A chance meeting at a christening party in 1964 California sets off a chain of consequences across two blended families over fifty years — six children scattered across states, marriages, and losses. Ann Patchett's sweeping novel is about how shared experience shapes who we become.",
  "nevada nine":  // Doesn't exist, skip
    "",

  // Descriptions with actual good content that just have markdown/special chars — handled by cleaner below
};

// ── General description cleaner ───────────────────────────────────────────────
// Applies to any description not fully replaced above.
function cleanDescription(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")   // **bold** → plain
    .replace(/\*([^*]+)\*/g, "$1")         // *italic* → plain
    .replace(/#{1,6}\s/g, "")              // ## headings
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // markdown links
    .replace(/^["""'']+|["""'']+$/g, "")  // leading/trailing quotes
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s*BOOK (ONE|TWO|THREE|FOUR)\b[^\n]*/im, "") // series boilerplate
    .replace(/^\s*(#1 |THE #1 )?(NEW YORK TIMES|USA TODAY|INTERNATIONALLY|NATIONAL).*?\n/im, "")
    .replace(/^\s*(NATIONAL BESTSELLER|INTERNATIONAL BESTSELLER)[^\n]*/im, "")
    .replace(/^\s*Soon to be a (Netflix|TV|movie|major motion)[^\n]*/im, "")
    .replace(/^\s*From the (author|#1|New York Times)[^\n]*/im, "")
    .replace(/^\s*\*+\s*/gm, "")          // lone asterisks
    .replace(/[ \t]+/g, " ")
    .trim()
    .replace(/^\.+|\.+$/g, "")
    .trim();
}

// ── Apply updates ─────────────────────────────────────────────────────────────

const books = db
  .prepare("SELECT id, title, description FROM books ORDER BY title")
  .all() as { id: number; title: string; description: string }[];

const update = db.prepare("UPDATE books SET description = ? WHERE id = ?");

let replaced = 0;
let cleaned = 0;
let skipped = 0;

for (const book of books) {
  const key = book.title.toLowerCase().trim();
  const newDesc = DESCRIPTIONS[key];

  if (newDesc !== undefined) {
    if (newDesc === "") { skipped++; continue; } // explicitly skipped
    if (newDesc !== book.description) {
      update.run(newDesc, book.id);
      console.log(`✓ replaced: ${book.title}`);
      replaced++;
    } else {
      skipped++;
    }
    continue;
  }

  // Apply general cleaner to remaining books
  const cleaned_desc = cleanDescription(book.description || "");
  if (cleaned_desc !== (book.description || "").trim() && cleaned_desc.length > 30) {
    update.run(cleaned_desc, book.id);
    cleaned++;
  } else {
    skipped++;
  }
}

console.log(`\n──────────────────────────────────`);
console.log(`✓ Replaced: ${replaced}`);
console.log(`~ Cleaned:  ${cleaned}`);
console.log(`– Skipped:  ${skipped}`);
