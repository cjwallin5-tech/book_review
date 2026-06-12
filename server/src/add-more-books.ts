import db from "./db.js";

interface NewBook {
  title: string;
  author: string;
  cover_url: string;
  description: string;
  genre: string;
}

// Each book has a hand-written short, concise English description.
// Covers are pulled from Open Library's cover archive; if not found, a
// neutral placeholder is used.
const NEW_BOOKS: NewBook[] = [
  {
    title: "The Goldfinch",
    author: "Donna Tartt",
    cover_url: "",
    description:
      "A boy survives a museum bombing with a priceless painting in hand, and carries its weight through a decade of grief, friendship, and crime.",
    genre: "Fiction",
  },
  {
    title: "The Secret History",
    author: "Donna Tartt",
    cover_url: "",
    description:
      "A classics student at a remote college recounts how he and his friends became entangled in a murder.",
    genre: "Fiction",
  },
  {
    title: "Little Fires Everywhere",
    author: "Celeste Ng",
    cover_url: "",
    description:
      "In a picture-perfect Ohio suburb, a photographer and her tenant's custody battle exposes the fault lines of motherhood and privilege.",
    genre: "Fiction",
  },
  {
    title: "Everything I Never Told You",
    author: "Celeste Ng",
    cover_url: "",
    description:
      "After a teenager is found dead, her Chinese American family unravels the silence each of them kept.",
    genre: "Fiction",
  },
  {
    title: "Pachinko",
    author: "Min Jin Lee",
    cover_url: "",
    description:
      "Four generations of a Korean family struggle to survive and belong in twentieth-century Japan.",
    genre: "Historical Fiction",
  },
  {
    title: "Olive Kitteridge",
    author: "Elizabeth Strout",
    cover_url: "",
    description:
      "A sharp-tongued Maine math teacher and the small-town lives she quietly shapes over decades.",
    genre: "Fiction",
  },
  {
    title: "A Thousand Splendid Suns",
    author: "Khaled Hosseini",
    cover_url: "",
    description:
      "Two Afghan women bound by marriage and loss endure war, cruelty, and a fierce, unexpected love.",
    genre: "Historical Fiction",
  },
  {
    title: "The Road",
    author: "Cormac McCarthy",
    cover_url: "",
    description:
      "A father and son walk south through the ashen ruins of America, with nothing but a pistol and each other.",
    genre: "Post-Apocalyptic Fiction",
  },
  {
    title: "Circe",
    author: "Madeline Miller",
    cover_url: "",
    description:
      "The witch of Aiaia tells her own story: exile, longing, and the gods who underestimate her.",
    genre: "Fantasy",
  },
  {
    title: "The Song of Achilles",
    author: "Madeline Miller",
    cover_url: "",
    description:
      "A retelling of the Trojan War through the eyes of Patroclus, the companion of Achilles.",
    genre: "Historical Fantasy",
  },
  {
    title: "A Gentleman in Moscow",
    author: "Amor Towles",
    cover_url: "",
    description:
      "Under house arrest in a Moscow hotel for thirty-two years, a count finds that a full life requires no country at all.",
    genre: "Historical Fiction",
  },
  {
    title: "The Night Circus",
    author: "Erin Morgenstern",
    cover_url: "",
    description:
      "Two young magicians are bound to a mysterious dueling circus that appears without warning and travels only at night.",
    genre: "Fantasy",
  },
  {
    title: "Big Little Lies",
    author: "Liane Moriarty",
    cover_url: "",
    description:
      "A schoolyard scuffle between kindergartners pulls three mothers into a spiral leading to murder.",
    genre: "Mystery",
  },
  {
    title: "Gone Girl",
    author: "Gillian Flynn",
    cover_url: "",
    description:
      "On their fifth anniversary, Amy Dunne vanishes, and her husband becomes the only suspect in a story built for two liars.",
    genre: "Thriller",
  },
  {
    title: "The Girl on the Train",
    author: "Paula Hawkins",
    cover_url: "",
    description:
      "A daily commuter becomes obsessed with a couple she watches from the train, and with a disappearance she may have seen.",
    genre: "Thriller",
  },
  {
    title: "Sharp Objects",
    author: "Gillian Flynn",
    cover_url: "",
    description:
      "A reporter returns to her hometown to cover the murder of two girls and confront the violence of her own childhood.",
    genre: "Thriller",
  },
  {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    cover_url: "",
    description:
      "A psychotherapist is drawn to a famous painter who has not spoken a word since shooting her husband.",
    genre: "Thriller",
  },
  {
    title: "In the Woods",
    author: "Tana French",
    cover_url: "",
    description:
      "A Dublin detective investigating a child's murder in the woods may be the boy who vanished from those same woods twenty years ago.",
    genre: "Mystery",
  },
  {
    title: "The Likeness",
    author: "Tana French",
    cover_url: "",
    description:
      "An undercover detective agrees to impersonate a dead woman whose life was constructed as her own, until the death turns out to be real.",
    genre: "Mystery",
  },
  {
    title: "Rebecca",
    author: "Daphne du Maurier",
    cover_url: "",
    description:
      "A young bride at Manderley is haunted by the memory of her husband's elegant, perfect first wife.",
    genre: "Gothic Fiction",
  },
  {
    title: "The Handmaid's Tale",
    author: "Margaret Atwood",
    cover_url: "",
    description:
      "In a near-future theocracy, a woman is stripped of her name, her family, and her freedom, and assigned to bear children for a commander.",
    genre: "Dystopian Fiction",
  },
  {
    title: "Station Eleven",
    author: "Emily St. John Mandel",
    cover_url: "",
    description:
      "After a pandemic wipes out most of the world, a traveling symphony performs Shakespeare for the scattered survivors.",
    genre: "Post-Apocalyptic Fiction",
  },
  {
    title: "Never Let Me Go",
    author: "Kazuo Ishiguro",
    cover_url: "",
    description:
      "Three friends at a strange English boarding school slowly learn the quiet, devastating truth about why they were made.",
    genre: "Dystopian Fiction",
  },
  {
    title: "The Remains of the Day",
    author: "Kazuo Ishiguro",
    cover_url: "",
    description:
      "An English butler takes a short motoring trip and reviews his life of perfect service, and the chances he did not take.",
    genre: "Literary Fiction",
  },
  {
    title: "Klara and the Sun",
    author: "Kazuo Ishiguro",
    cover_url: "",
    description:
      "An artificial friend with extraordinary observational skills watches the world and wonders what makes humans love.",
    genre: "Science Fiction",
  },
  {
    title: "The Buried Giant",
    author: "Kazuo Ishiguro",
    cover_url: "",
    description:
      "An elderly Briton couple walk through a postwar England where a mist of forgetfulness is slowly lifting, and old hatreds with it.",
    genre: "Fantasy",
  },
  {
    title: "Americanah",
    author: "Chimamanda Ngozi Adichie",
    cover_url: "",
    description:
      "A young Nigerian leaves for America, then returns, with two countries and a complicated love story to bridge.",
    genre: "Fiction",
  },
  {
    title: "Half of a Yellow Sun",
    author: "Chimamanda Ngozi Adichie",
    cover_url: "",
    description:
      "The lives of a Nigerian family, a houseboy, and a young professor collide with the outbreak of the Biafran War.",
    genre: "Historical Fiction",
  },
  {
    title: "Purple Hibiscus",
    author: "Chimamanda Ngozi Adichie",
    cover_url: "",
    description:
      "A Nigerian teenager comes of age in a wealthy, violent household and discovers a different kind of freedom at her aunt's home.",
    genre: "Fiction",
  },
  {
    title: "Homegoing",
    author: "Yaa Gyasi",
    cover_url: "",
    description:
      "Two half-sisters in 18th-century Ghana are separated by slavery, and their descendants trace a line of descendants across three centuries.",
    genre: "Historical Fiction",
  },
  {
    title: "Transcendent Kingdom",
    author: "Yaa Gyasi",
    cover_url: "",
    description:
      "A Ghanaian American PhD student wrestles with her mother's depression, her brother's overdose, and her own stalled faith.",
    genre: "Fiction",
  },
  {
    title: "The Vanishing Half",
    author: "Brit Bennett",
    cover_url: "",
    description:
      "Twin sisters take different paths: one passes as white, the other lives as a Black woman in their hometown, and the secret endures for decades.",
    genre: "Fiction",
  },
  {
    title: "Such a Fun Age",
    author: "Kiley Reid",
    cover_url: "",
    description:
      "A young Black babysitter is wrongly accused of kidnapping the white child she cares for, and the incident exposes everyone's pretense.",
    genre: "Fiction",
  },
  {
    title: "Queenie",
    author: "Candice Carty-Williams",
    cover_url: "",
    description:
      "A twenty-five-year-old London journalist sorts through a messy breakup, a hard family history, and the question of what she actually wants.",
    genre: "Fiction",
  },
  {
    title: "Open Water",
    author: "Caleb Azumah Nelson",
    cover_url: "",
    description:
      "Two young Black artists in London fall into a tender, unspoken love in a city that keeps asking them to explain themselves.",
    genre: "Fiction",
  },
  {
    title: "Small Islands",
    author: "Andrea Levy",
    cover_url: "",
    description:
      "Two Jamaican sisters arrive in post-war London hoping for a new life, and find one more complicated than they imagined.",
    genre: "Historical Fiction",
  },
  {
    title: "The Final Stride",
    author: "Kirsty Greenwood",
    cover_url: "",
    description:
      "A woman grieving her mother's death inherits a grumpy racehorse and, with it, an unexpected second chance.",
    genre: "Romance",
  },
  {
    title: "Beach Read",
    author: "Emily Henry",
    cover_url: "",
    description:
      "Two rival writers, one a romance author and one a literary novelist, spend a summer trying to write outside their genre.",
    genre: "Romance",
  },
  {
    title: "People We Meet on Vacation",
    author: "Emily Henry",
    cover_url: "",
    description:
      "Two best friends take one last summer trip to figure out why their friendship broke two years earlier.",
    genre: "Romance",
  },
  {
    title: "Book Lovers",
    author: "Emily Henry",
    cover_url: "",
    description:
      "A cutthroat literary agent and a brooding editor keep running into each other in a small town that is not, despite appearances, a romance novel.",
    genre: "Romance",
  },
  {
    title: "Happy Place",
    author: "Emily Henry",
    cover_url: "",
    description:
      "A couple who have secretly broken up pretend to still be together for one last group vacation with their oldest friends.",
    genre: "Romance",
  },
  {
    title: "Funny Story",
    author: "Emily Henry",
    cover_url: "",
    description:
      "Two heartbroken strangers end up as accidental roommates, and agree to a fake-relationship prank that stops being fake.",
    genre: "Romance",
  },
  {
    title: "Great Big Beautiful Life",
    author: "Emily Henry",
    cover_url: "",
    description:
      "A writer chasing a recluse author for a biography falls for the man's intimidating, off-limits son.",
    genre: "Romance",
  },
  {
    title: "The Flatshare",
    author: "Beth O'Leary",
    cover_url: "",
    description:
      "Two strangers share a flat and never meet, communicating through Post-it notes until the notes become something more.",
    genre: "Romance",
  },
  {
    title: "The Switch",
    author: "Beth O'Leary",
    cover_url: "",
    description:
      "A stressed Londoner and her bored grandmother swap lives for a few weeks, and both come back surprised.",
    genre: "Romance",
  },
  {
    title: "One Day in December",
    author: "Josie Silver",
    cover_url: "",
    description:
      "A woman spends a decade looking for a man she saw for a moment through a bus window, only to find him in the last place she expected.",
    genre: "Romance",
  },
  {
    title: "The Hating Game",
    author: "Sally Thorne",
    cover_url: "",
    description:
      "Two executive assistants who genuinely loathe each other are forced to compete for the same promotion, and possibly lose more than a job.",
    genre: "Romance",
  },
  {
    title: "Red, White & Royal Blue",
    author: "Casey McQuiston",
    cover_url: "",
    description:
      "The First Son of the United States and a British prince arrange a fake friendship that quickly becomes inconvenient.",
    genre: "Romance",
  },
  {
    title: "One Last Stop",
    author: "Casey McQuiston",
    cover_url: "",
    description:
      "A skeptical New Yorker falls hard for a beautiful stranger on the Q train who is not exactly who she seems.",
    genre: "Romance",
  },
  {
    title: "Boyfriend Material",
    author: "Alexis Hall",
    cover_url: "",
    description:
      "A chaotic London lawyer hires a kind, slightly boring actor to play the role of respectable boyfriend, with predictable results.",
    genre: "Romance",
  },
  {
    title: "The Spanish Love Deception",
    author: "Elena Armas",
    cover_url: "",
    description:
      "A Spanish engineer she barely knows volunteers to be her fake boyfriend at a destination wedding in Spain. Her family is in on it.",
    genre: "Romance",
  },
  {
    title: "It Ends with Us",
    author: "Colleen Hoover",
    cover_url: "",
    description:
      "A florist with a carefully rebuilt life falls in love with a charming surgeon and confronts what love should not look like.",
    genre: "Romance",
  },
  {
    title: "Ugly Love",
    author: "Colleen Hoover",
    cover_url: "",
    description:
      "An airline pilot offers a young woman exactly the no-strings arrangement she thinks she wants, and breaks her own rules.",
    genre: "Romance",
  },
  {
    title: "November 9",
    author: "Colleen Hoover",
    cover_url: "",
    description:
      "Two strangers meet on the day they each have decided to start over, and agree to meet once a year, no contact between.",
    genre: "Romance",
  },
  {
    title: "Verity",
    author: "Colleen Hoover",
    cover_url: "",
    description:
      "A struggling writer is hired to finish a famous, injured author's books, and reads a draft autobiography that may be a confession.",
    genre: "Thriller",
  },
  {
    title: "Reminders of Him",
    author: "Colleen Hoover",
    cover_url: "",
    description:
      "A young mother returns to her hometown after prison, hoping only to be near the daughter she is not allowed to see.",
    genre: "Romance",
  },
  {
    title: "Confess",
    author: "Colleen Hoover",
    cover_url: "",
    description:
      "An art student takes a job at a gallery whose anonymous painter seems to be telling the story of her own past.",
    genre: "Romance",
  },
  {
    title: "Maybe Someday",
    author: "Colleen Hoover",
    cover_url: "",
    description:
      "A betrayed girlfriend and her new neighbor make music together, and one of them is keeping a big secret.",
    genre: "Romance",
  },
  {
    title: "Layla",
    author: "Colleen Hoover",
    cover_url: "",
    description:
      "A newly engaged man meets the woman he will marry at a strange carnival, and their wedding trip is anything but peaceful.",
    genre: "Romance",
  },
  {
    title: "Slammed",
    author: "Colleen Hoover",
    cover_url: "",
    description:
      "A young widow and her new neighbor fall in love over slam poetry, and into the hardest question of all.",
    genre: "Romance",
  },
  {
    title: "All Your Perfects",
    author: "Colleen Hoover",
    cover_url: "",
    description:
      "A married couple in crisis, before and after: two timelines, one love, and a question about what forgiveness can hold.",
    genre: "Romance",
  },
  {
    title: "Heart Bones",
    author: "Colleen Hoover",
    cover_url: "",
    description:
      "A teen mother takes refuge with a kind, rich family, and falls for the one son her situation is supposed to keep her away from.",
    genre: "Romance",
  },
  {
    title: "A Little Life",
    author: "Hanya Yanagihara",
    cover_url: "",
    description:
      "Four college friends move to New York; one of them carries a wound so deep that the others spend decades trying to reach him.",
    genre: "Literary Fiction",
  },
  {
    title: "To Paradise",
    author: "Hanya Yanagihara",
    cover_url: "",
    description:
      "Three love stories set in alternate Americas, each a version of the same question: is love enough against the world?",
    genre: "Literary Fiction",
  },
  {
    title: "The People in the Trees",
    author: "Hanya Yanagihara",
    cover_url: "",
    description:
      "A fictional Nobel-winning anthropologist recounts his discovery of a lost tribe whose secret he then exploits.",
    genre: "Fiction",
  },
  {
    title: "White Teeth",
    author: "Zadie Smith",
    cover_url: "",
    description:
      "Two families, one Bangladeshi and one English, navigate London across decades of race, faith, and bad teeth.",
    genre: "Literary Fiction",
  },
  {
    title: "On Beauty",
    author: "Zadie Smith",
    cover_url: "",
    description:
      "Two academic families, an affair, a dying patriarch, and a New England college in the middle of a culture war.",
    genre: "Literary Fiction",
  },
  {
    title: "Swing Time",
    author: "Zadie Smith",
    cover_url: "",
    description:
      "Two brown girls from a London estate grow up in love with dance, and grow apart into different kinds of power.",
    genre: "Fiction",
  },
  {
    title: "NW",
    author: "Zadie Smith",
    cover_url: "",
    description:
      "Four lives in northwest London, told in fragments that braid childhood, race, and the city that made them.",
    genre: "Fiction",
  },
  {
    title: "The Fraud",
    author: "Zadie Smith",
    cover_url: "",
    description:
      "A Jamaican housekeeper in Victorian London watches a trial of imposture unfold, and begins to question her own life.",
    genre: "Historical Fiction",
  },
  {
    title: "Middlemarch",
    author: "George Eliot",
    cover_url: "",
    description:
      "A young doctor's wife dreams of a life of intellect and love, in a provincial English town that gives her neither easily.",
    genre: "Classic Fiction",
  },
  {
    title: "The Mill on the Floss",
    author: "George Eliot",
    cover_url: "",
    description:
      "A clever, headstrong girl and her gentle brother grow up by a mill, with a family feud that will outlast them both.",
    genre: "Classic Fiction",
  },
  {
    title: "Silas Marner",
    author: "George Eliot",
    cover_url: "",
    description:
      "A miserly linen-weaver is robbed of his gold and, much later, given a small child who quietly gives him a reason to live.",
    genre: "Classic Fiction",
  },
  {
    title: "Daniel Deronda",
    author: "George Eliot",
    cover_url: "",
    description:
      "An upper-class Englishman discovers his Jewish heritage and a calling he did not know he was waiting for.",
    genre: "Classic Fiction",
  },
  {
    title: "Tess of the d'Urbervilles",
    author: "Thomas Hardy",
    cover_url: "",
    description:
      "A poor girl from a ruined family is sent to claim a distant relation, and pays for a single night of anger for the rest of her life.",
    genre: "Classic Fiction",
  },
  {
    title: "Far from the Madding Crowd",
    author: "Thomas Hardy",
    cover_url: "",
    description:
      "A headstrong young woman inherits a farm in rural Wessex and is courted by three very different suitors.",
    genre: "Classic Fiction",
  },
  {
    title: "The Mayor of Casterbridge",
    author: "Thomas Hardy",
    cover_url: "",
    description:
      "A man sells his wife and daughter at a country fair, then spends a lifetime trying, mostly, to atone for it.",
    genre: "Classic Fiction",
  },
  {
    title: "Jude the Obscure",
    author: "Thomas Hardy",
    cover_url: "",
    description:
      "A poor stone-mason dreams of a university education and a love that defies his class, and pays the price for both.",
    genre: "Classic Fiction",
  },
  {
    title: "The Return of the Native",
    author: "Thomas Hardy",
    cover_url: "",
    description:
      "On Egdon Heath, a restless woman married to the wrong man and a man in love with the wrong woman court ruin together.",
    genre: "Classic Fiction",
  },
  {
    title: "Bleak House",
    author: "Charles Dickens",
    cover_url: "",
    description:
      "Two narratives braid through a generations-long court case, a great house, and a poor orphan named Esther Summerson.",
    genre: "Classic Fiction",
  },
  {
    title: "Great Expectations",
    author: "Charles Dickens",
    cover_url: "",
    description:
      "An orphan boy is mysteriously given a fortune, and spends the rest of his life trying to be worthy of a girl who no longer needs him.",
    genre: "Classic Fiction",
  },
  {
    title: "David Copperfield",
    author: "Charles Dickens",
    cover_url: "",
    description:
      "Dickens's most autobiographical novel: a boy's difficult coming-of-age through cruelty, kindness, and a great many odd names.",
    genre: "Classic Fiction",
  },
  {
    title: "Our Mutual Friend",
    author: "Charles Dickens",
    cover_url: "",
    description:
      "A dustman inherits a fortune on condition he marry a woman he has never met, and London piles itself around the joke.",
    genre: "Classic Fiction",
  },
  {
    title: "Little Dorrit",
    author: "Charles Dickens",
    cover_url: "",
    description:
      "A man is held for years in a debtors' prison, while his daughter grows up outside the walls, working to support him.",
    genre: "Classic Fiction",
  },
  {
    title: "A Tale of Two Cities",
    author: "Charles Dickens",
    cover_url: "",
    description:
      "A lawyer, a drunk, and a beautiful young woman are bound up in the violence of Revolutionary Paris.",
    genre: "Historical Fiction",
  },
  {
    title: "The Pickwick Papers",
    author: "Charles Dickens",
    cover_url: "",
    description:
      "An aging London bachelor and his friends tour the English countryside and get into cheerful, sometimes legal, trouble.",
    genre: "Classic Fiction",
  },
  {
    title: "Persuasion",
    author: "Jane Austen",
    cover_url: "",
    description:
      "Eight years after being persuaded to give up the man she loved, Anne Elliot meets him again as a captain with money.",
    genre: "Classic Romance",
  },
  {
    title: "Mansfield Park",
    author: "Jane Austen",
    cover_url: "",
    description:
      "A poor girl is raised by wealthy relatives and grows up, painfully, into her own kind of conscience.",
    genre: "Classic Fiction",
  },
  {
    title: "Northanger Abbey",
    author: "Jane Austen",
    cover_url: "",
    description:
      "A clergyman's daughter who reads too many Gothic novels visits a real abbey and finds real dangers there too.",
    genre: "Classic Fiction",
  },
  {
    title: "The Tenant of Wildfell Hall",
    author: "Anne Brontë",
    cover_url: "",
    description:
      "A young widow with a dark secret takes a Yorkshire farmhouse, and the neighborhood is determined to find out why.",
    genre: "Classic Fiction",
  },
  {
    title: "Agnes Grey",
    author: "Anne Brontë",
    cover_url: "",
    description:
      "A clergyman's daughter goes out to work as a governess and writes back, plain and sharp, about what she finds.",
    genre: "Classic Fiction",
  },
  {
    title: "Villette",
    author: "Charlotte Brontë",
    cover_url: "",
    description:
      "An English governess in a Belgian schoolroom falls in love, slowly, with a man who has no time for sentiment.",
    genre: "Classic Fiction",
  },
  {
    title: "The Professor",
    author: "Charlotte Brontë",
    cover_url: "",
    description:
      "An English teacher works in a Brussels school, where a quiet love story unfolds against his sense of being a foreigner.",
    genre: "Classic Fiction",
  },
  {
    title: "Shirley",
    author: "Charlotte Brontë",
    cover_url: "",
    description:
      "Two women in industrial Yorkshire try to keep the people they love alive through the Luddite years.",
    genre: "Historical Fiction",
  },
  {
    title: "North and South",
    author: "Elizabeth Gaskell",
    cover_url: "",
    description:
      "A parson's daughter moves from the south of England to a smoky industrial town, and learns to love its owner.",
    genre: "Classic Romance",
  },
  {
    title: "Cranford",
    author: "Elizabeth Gaskell",
    cover_url: "",
    description:
      "A gentle, comic portrait of a small English town run almost entirely by unmarried ladies of a certain age.",
    genre: "Classic Fiction",
  },
  {
    title: "Wives and Daughters",
    author: "Elizabeth Gaskell",
    cover_url: "",
    description:
      "A country girl grows up with a kind father, a snobbish stepmother, and a stepbrother who complicates everything.",
    genre: "Classic Fiction",
  },
  {
    title: "Mary Barton",
    author: "Elizabeth Gaskell",
    cover_url: "",
    description:
      "A Manchester weaver's daughter witnesses the hardship of the poor and a murder she cannot forget.",
    genre: "Classic Fiction",
  },
  {
    title: "The Mayor of Casterbridge",
    author: "Thomas Hardy",
    cover_url: "",
    description:
      "A man sells his wife at a fair, then spends decades building himself up while the consequences of that night catch up.",
    genre: "Classic Fiction",
  },
  {
    title: "Under the Greenwood Tree",
    author: "Thomas Hardy",
    cover_url: "",
    description:
      "A young rural schoolmaster courts a spirited dairy maid, in a small Wessex village full of opinions.",
    genre: "Classic Romance",
  },
  {
    title: "The Woodlanders",
    author: "Thomas Hardy",
    cover_url: "",
    description:
      "A country girl is torn between the man who truly loves her and the man her family wants her to marry.",
    genre: "Classic Fiction",
  },
  {
    title: "Two on a Tower",
    author: "Thomas Hardy",
    cover_url: "",
    description:
      "A young astronomer and an orphaned woman meet on a tower in a forest, and pursue a love that scandalises their county.",
    genre: "Classic Romance",
  },
  {
    title: "Far from the Madding Crowd",
    author: "Thomas Hardy",
    cover_url: "",
    description:
      "Bathsheba Everdene inherits a farm, refuses to be obedient, and is loved by three men in three different ways.",
    genre: "Classic Fiction",
  },
  {
    title: "Jude the Obscure",
    author: "Thomas Hardy",
    cover_url: "",
    description:
      "Jude Fawley wants to be a scholar, to be a free thinker, and to love the woman he loves, and is denied all three.",
    genre: "Classic Fiction",
  },
  {
    title: "The Return of the King",
    author: "J. R. R. Tolkien",
    cover_url: "",
    description:
      "Aragorn claims his crown as the last great battle for Middle-earth begins at the Black Gate.",
    genre: "Fantasy",
  },
  {
    title: "The Silmarillion",
    author: "J. R. R. Tolkien",
    cover_url: "",
    description:
      "The elder myths of Middle-earth: the creation, the great jewels, and the long war against Morgoth.",
    genre: "Fantasy",
  },
  {
    title: "Unfinished Tales",
    author: "J. R. R. Tolkien",
    cover_url: "",
    description:
      "A collection of Tolkien's unpublished and incomplete narratives, from the Elder Days to the end of the Third Age.",
    genre: "Fantasy",
  },
  {
    title: "The Children of Húrin",
    author: "J. R. R. Tolkien",
    cover_url: "",
    description:
      "A great Tolkien legend completed by his son: a cursed hero, his doomed love, and the dragon Glaurung.",
    genre: "Fantasy",
  },
  {
    title: "Beren and Lúthien",
    author: "J. R. R. Tolkien",
    cover_url: "",
    description:
      "The story Tolkien returned to all his life: a mortal man and an elf-maiden, and a Silmaril stolen from the Dark Lord.",
    genre: "Fantasy",
  },
  {
    title: "The Fall of Gondolin",
    author: "J. R. R. Tolkien",
    cover_url: "",
    description:
      "The first tale of Middle-earth Tolkien ever wrote, here told at last in full: the secret city and its destruction.",
    genre: "Fantasy",
  },
  {
    title: "The Two Towers",
    author: "J. R. R. Tolkien",
    cover_url: "",
    description:
      "The Fellowship breaks; Frodo and Sam edge toward Mordor, while Aragorn, Legolas, and Gimli ride to rescue Merry and Pippin.",
    genre: "Fantasy",
  },
  {
    title: "The Way of Kings",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "On a storm-blasted world, a slave, a soldier, and a scholar each begin to suspect the war they were promised is not the war they are in.",
    genre: "Fantasy",
  },
  {
    title: "Words of Radiance",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "The Stormlight Archive continues: Kaladin is no longer a slave, Shallan is no longer a student, and the Desolation is no longer a myth.",
    genre: "Fantasy",
  },
  {
    title: "Oathbringer",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "Dalinar Kholin must answer for the sins of his past, while the True Desolation finally arrives with the sky itself in flames.",
    genre: "Fantasy",
  },
  {
    title: "Rhythm of War",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "The war on the Shattered Plains becomes a war of scholars, and Shallan is forced to look at the void in her own mind.",
    genre: "Fantasy",
  },
  {
    title: "Wind and Truth",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "The Stormlight Archive reaches a turning point: the duel of champions, the bargain of gods, and the cost of being a knight radiant.",
    genre: "Fantasy",
  },
  {
    title: "Mistborn: The Final Empire",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "A world of ash where a crew of thieves plan to rob the Lord Ruler himself, and a young skaa girl learns she is something more than a Mistborn.",
    genre: "Fantasy",
  },
  {
    title: "The Well of Ascension",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "Vin has killed the Lord Ruler; now the city of Luthadel is tearing itself apart, and an ancient evil is being released from the deep.",
    genre: "Fantasy",
  },
  {
    title: "The Hero of Ages",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "The end of the first Mistborn trilogy: a world being consumed by its own power, and one woman who was never supposed to be its hero.",
    genre: "Fantasy",
  },
  {
    title: "The Alloy of Law",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "Three hundred years after the Ascension, Scadrial is a Wild West of guns and Allomancy, and a lawman with a strange gift hunts a kidnapper.",
    genre: "Fantasy",
  },
  {
    title: "Shadows of Self",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "Wax and Wayne return to Elendel, where Wax's uncle is assassinated, and the killer wears a face Wax knows too well.",
    genre: "Fantasy",
  },
  {
    title: "The Bands of Mourning",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "Wax and Steris follow a rumor of a lost metal, and find themselves entangled with a conspiracy that could remake the world.",
    genre: "Fantasy",
  },
  {
    title: "The Lost Metal",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "Wax and Wayne's final Mistborn case: a terrifying new metal, a sky filled with something other than clouds, and a child he cannot save alone.",
    genre: "Fantasy",
  },
  {
    title: "Elantris",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "Once the city of the gods, Elantris is now a prison for the cursed, and one of its new inhabitants is going to find out why.",
    genre: "Fantasy",
  },
  {
    title: "The Emperor's Soul",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "A forger of magical stamps is hired to give a shattered emperor a soul, in thirty days, with lies told on paper.",
    genre: "Fantasy",
  },
  {
    title: "Warbreaker",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "Two sisters, a god-king, and a city of awakened dead: a princess sent to marry a man she has been taught to kill.",
    genre: "Fantasy",
  },
  {
    title: "The Rithmatist",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "A non-magical student at a school of battle-magic draws chalk lines that work, and finds himself on the trail of real disappearances.",
    genre: "Young Adult Fantasy",
  },
  {
    title: "Steelheart",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "In a world ruled by super-powered tyrants, a teenager with no powers of his own swears to kill the unkillable one called Steelheart.",
    genre: "Young Adult Fantasy",
  },
  {
    title: "Firefight",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "David Charleston goes to Newcago to take down its high epic, and finds a city whose grief has given it strange new rules.",
    genre: "Young Adult Fantasy",
  },
  {
    title: "Calamity",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "Megan and David finally face Calamity itself, the source of all the epics' powers, and discover what it is, and what it wants.",
    genre: "Young Adult Fantasy",
  },
  {
    title: "The Final Empire",
    author: "Brandon Sanderson",
    cover_url: "",
    description:
      "The first Mistborn book under its full title: a thousand years of ash, a hidden noble, and a girl who can burn metals to save the world.",
    genre: "Fantasy",
  },
  {
    title: "The Name of the Wind",
    author: "Patrick Rothfuss",
    cover_url: "",
    description:
      "Kvothe, a legendary figure, recounts the truth of his life: an orphaned boy, a traveling arcanist, and a demon he should not have called.",
    genre: "Fantasy",
  },
  {
    title: "The Wise Man's Fear",
    author: "Patrick Rothfuss",
    cover_url: "",
    description:
      "Kvothe's second day of telling: love, war, a secret society of masters, and the woman who teaches him the name of the wind.",
    genre: "Fantasy",
  },
  {
    title: "The Slow Regard of Silent Things",
    author: "Patrick Rothfuss",
    cover_url: "",
    description:
      "A quiet week in the Underthing with Auri, who knows the secret of a place that no longer makes sense.",
    genre: "Fantasy",
  },
  {
    title: "The Doors of Stone",
    author: "Patrick Rothfuss",
    cover_url: "",
    description:
      "The long-awaited third day of Kvothe's story: the war, the road to the king, and the doors of stone he has been running from.",
    genre: "Fantasy",
  },
  {
    title: "A Court of Thorns and Roses",
    author: "Sarah J. Maas",
    cover_url: "",
    description:
      "A huntress kills a wolf in the wrong forest and is taken to a faerie realm where a beast lord holds her for a life debt.",
    genre: "Fantasy Romance",
  },
  {
    title: "A Court of Mist and Fury",
    author: "Sarah J. Maas",
    cover_url: "",
    description:
      "Feyre is dragged out of a nightmare marriage into the High Lord's court, and into a love that asks her to be something more.",
    genre: "Fantasy Romance",
  },
  {
    title: "A Court of Wings and Ruin",
    author: "Sarah J. Maas",
    cover_url: "",
    description:
      "War comes to Prythian and Feyre returns to the Spring Court as a spy, while the High Lords prepare for Hybern's invasion.",
    genre: "Fantasy Romance",
  },
  {
    title: "A Court of Frost and Starlight",
    author: "Sarah J. Maas",
    cover_url: "",
    description:
      "After the war, Feyre and Rhysand try to have a quiet Solstice, and a quiet new year, and a quiet life together.",
    genre: "Fantasy Romance",
  },
  {
    title: "A Court of Silver Flames",
    author: "Sarah J. Maas",
    cover_url: "",
    description:
      "Nesta Archeron is the sister no one could save, and the story of how she saves herself begins in the House of Wind.",
    genre: "Fantasy Romance",
  },
  {
    title: "Throne of Glass",
    author: "Sarah J. Maas",
    cover_url: "",
    description:
      "An infamous assassin is pulled from a salt mine to compete in a tournament for the position of the king's champion.",
    genre: "Fantasy",
  },
  {
    title: "Crown of Midnight",
    author: "Sarah J. Maas",
    cover_url: "",
    description:
      "Celaena Sardothien has won the king's champion, but the people she is sent to kill keep not dying the way she expects.",
    genre: "Fantasy",
  },
  {
    title: "Heir of Fire",
    author: "Sarah J. Maas",
    cover_url: "",
    description:
      "Celaena is exiled to the wild north, where she is found by a warrior-prince with a wolf in his heart.",
    genre: "Fantasy",
  },
  {
    title: "Queen of Shadows",
    author: "Sarah J. Maas",
    cover_url: "",
    description:
      "Celaena returns to Rifthold as Aelin Galathynius, the lost queen of Terrasen, with a new crew and a score to settle.",
    genre: "Fantasy",
  },
  {
    title: "Empire of Storms",
    author: "Sarah J. Maas",
    cover_url: "",
    description:
      "Aelin gathers an army of pirates, assassins, witches, and fae to take back a continent from a tyrant she once called father.",
    genre: "Fantasy",
  },
  {
    title: "Tower of Dawn",
    author: "Sarah J. Maas",
    cover_url: "",
    description:
      "Chaol Westfall travels to the southern continent to heal his broken body and his broken sense of himself.",
    genre: "Fantasy",
  },
  {
    title: "Kingdom of Ash",
    author: "Sarah J. Maas",
    cover_url: "",
    description:
      "The final battle for Erilea: Aelin is the queen who would burn herself down to ashes for her people.",
    genre: "Fantasy",
  },
  {
    title: "House of Earth and Blood",
    author: "Sarah J. Maas",
    cover_url: "",
    description:
      "A half-fae, half-human woman in a city of fallen angels and wolves is framed for the murder of her best friend.",
    genre: "Fantasy",
  },
  {
    title: "House of Sky and Breath",
    author: "Sarah J. Maas",
    cover_url: "",
    description:
      "Bryce Quinlan and Hunt Athalar try to build a life in a new world, just as an old war makes a quiet return.",
    genre: "Fantasy",
  },
  {
    title: "House of Flame and Shadow",
    author: "Sarah J. Maas",
    cover_url: "",
    description:
      "Bryce crosses a portal into a strange world with the Midgard sword, and finds herself in a war that is older than she knows.",
    genre: "Fantasy",
  },
  {
    title: "Fourth Wing",
    author: "Rebecca Yarros",
    cover_url: "",
    description:
      "A fragile young woman enters a college of dragon riders, where the dragons choose their own riders and the war is always near.",
    genre: "Fantasy Romance",
  },
  {
    title: "Iron Flame",
    author: "Rebecca Yarros",
    cover_url: "",
    description:
      "Basgiath's second year is harder than the first: the war has a true shape now, and the truth about venin is a devastating one.",
    genre: "Fantasy Romance",
  },
  {
    title: "Onyx Storm",
    author: "Rebecca Yarros",
    cover_url: "",
    description:
      "Violet Sorrengail rides south of the border to find the cure for venin, and to find out what Brennan has been doing with the wards.",
    genre: "Fantasy Romance",
  },
  {
    title: "Six of Crows",
    author: "Leigh Bardugo",
    cover_url: "",
    description:
      "A street gang of six is hired to break into the most secure court in the world, for the highest price ever named.",
    genre: "Fantasy",
  },
  {
    title: "Crooked Kingdom",
    author: "Leigh Bardugo",
    cover_url: "",
    description:
      "The crew is double-crossed, and Kaz Brekker's revenge is the only kind of justice worth having in the Barrel.",
    genre: "Fantasy",
  },
  {
    title: "Shadow and Bone",
    author: "Leigh Bardugo",
    cover_url: "",
    description:
      "An orphan mapmaker in Ravka discovers she can summon light, which makes her the target of kings and the dark.",
    genre: "Fantasy",
  },
  {
    title: "Siege and Storm",
    author: "Leigh Bardugo",
    cover_url: "",
    description:
      "Alina Starkov has fled the Darkling, but he has not stopped searching, and a privateer with secrets of his own is in the way.",
    genre: "Fantasy",
  },
  {
    title: "Ruin and Rising",
    author: "Leigh Bardugo",
    cover_url: "",
    description:
      "The Grisha trilogy ends: Alina must find the third amplifier and face the Darkling in the shadow fold itself.",
    genre: "Fantasy",
  },
  {
    title: "King of Scars",
    author: "Leigh Bardugo",
    cover_url: "",
    description:
      "Nikolai Lantsov, now king of Ravka, is hiding a demon, and an old enemy is gathering armies in the west.",
    genre: "Fantasy",
  },
  {
    title: "Rule of Wolves",
    author: "Leigh Bardugo",
    cover_url: "",
    description:
      "Two kings, two wars, and a country running out of time: the King of Scars duology ends in a battlefield on the Fjerdan ice.",
    genre: "Fantasy",
  },
  {
    title: "The Poppy War",
    author: "R. F. Kuang",
    cover_url: "",
    description:
      "A poor war orphan wins a place at an imperial military academy and discovers she has a shaman's power, at a terrible cost.",
    genre: "Fantasy",
  },
  {
    title: "The Dragon Republic",
    author: "R. F. Kuang",
    cover_url: "",
    description:
      "Rin flees the south and joins a warlord who promises to avenge her people, in a war that is already lost.",
    genre: "Fantasy",
  },
  {
    title: "The Burning God",
    author: "R. F. Kuang",
    cover_url: "",
    description:
      "The third Poppy War book: Rin leads the Hesperians to a final battle and discovers what her anger has cost her.",
    genre: "Fantasy",
  },
  {
    title: "Babel",
    author: "R. F. Kuang",
    cover_url: "",
    description:
      "A Chinese boy is brought to Oxford to study translation magic, and finds himself at the heart of Britain's imperial project.",
    genre: "Fantasy",
  },
  {
    title: "Yellowface",
    author: "R. F. Kuang",
    cover_url: "",
    description:
      "A struggling author steals her dead rival's manuscript, publishes it under a pen name, and watches the internet close in.",
    genre: "Thriller",
  },
  {
    title: "The Priory of the Orange Tree",
    author: "Samantha Shannon",
    cover_url: "",
    description:
      "A queen's secrets, a dragonless woman, an eastern princess, and a nameless fire that stirs beneath the world.",
    genre: "Fantasy",
  },
  {
    title: "A Day of Fallen Night",
    author: "Samantha Shannon",
    cover_url: "",
    description:
      "A prequel to the Priory: the story of the Great Silence, when four women helped save the world from the Nameless One.",
    genre: "Fantasy",
  },
  {
    title: "Red Rising",
    author: "Pierce Brown",
    cover_url: "",
    description:
      "On a red-mining planet, a lowborn Red dreams of being a Gold, and is used by them in a brutal game of political murder.",
    genre: "Science Fiction",
  },
  {
    title: "Golden Son",
    author: "Pierce Brown",
    cover_url: "",
    description:
      "Darrow has been admitted into Gold society, and his master's empire is at war, and the wife he has not yet married is dangerous.",
    genre: "Science Fiction",
  },
  {
    title: "Morning Star",
    author: "Pierce Brown",
    cover_url: "",
    description:
      "The first Red Rising trilogy ends in the war Darrow was made for, and the moment he understands the cost of it.",
    genre: "Science Fiction",
  },
  {
    title: "Iron Gold",
    author: "Pierce Brown",
    cover_url: "",
    description:
      "Ten years after the Rising, Darrow is a father and a rebel again, and the Solar System is splitting apart.",
    genre: "Science Fiction",
  },
  {
    title: "Dark Age",
    author: "Pierce Brown",
    cover_url: "",
    description:
      "The Republic is in pieces, the enemy has the atomics, and Darrow is losing everyone he loves.",
    genre: "Science Fiction",
  },
  {
    title: "Light Bringer",
    author: "Pierce Brown",
    cover_url: "",
    description:
      "A new generation fights the Long War in space; Darrow's son, Pax, will have to choose between his father and his own kind of war.",
    genre: "Science Fiction",
  },
  {
    title: "The Sword of Kaigen",
    author: "M. L. Wang",
    cover_url: "",
    description:
      "A mother in a remote Japanese village finds her magic awakened when an imperial invasion reaches her home.",
    genre: "Fantasy",
  },
  {
    title: "The Jasmine Throne",
    author: "Tasha Suri",
    cover_url: "",
    description:
      "An exiled princess and a captive witch must choose between duty and a power that could free or destroy a continent.",
    genre: "Fantasy",
  },
  {
    title: "The Oleander Sword",
    author: "Tasha Suri",
    cover_url: "",
    description:
      "The Jasmine Throne continues: a war is coming, a god is returning, and a reluctant queen holds a sword that chooses its own wielders.",
    genre: "Fantasy",
  },
  {
    title: "The Ending Fire",
    author: "Tasha Suri",
    cover_url: "",
    description:
      "The final Books of Ambha book: a god and a mortal must walk into the heart of fire to end a war begun in old magic.",
    genre: "Fantasy",
  },
  {
    title: "Sorcerer to the Crown",
    author: "Zen Cho",
    cover_url: "",
    description:
      "England's first Black Sorcerer Royal must save the country's magic, with the help of a determined young woman of magical lineage.",
    genre: "Fantasy",
  },
  {
    title: "The True Queen",
    author: "Zen Cho",
    cover_url: "",
    description:
      "A schoolmistress hides a lost queen in London, while two sisters from a small island discover a strange dragon in the woods.",
    genre: "Fantasy",
  },
  {
    title: "The City of Brass",
    author: "S. A. Chakraborty",
    cover_url: "",
    description:
      "A young con artist in 18th-century Cairo is kidnapped by a djinn prince into a city of brass, fire, and forgotten gods.",
    genre: "Fantasy",
  },
  {
    title: "The Kingdom of Copper",
    author: "S. A. Chakraborty",
    cover_url: "",
    description:
      "Nahri returns to Cairo with a djinn healer at her side, while the king of Daevabad is losing his hold on his own court.",
    genre: "Fantasy",
  },
  {
    title: "The Empire of Gold",
    author: "S. A. Chakraborty",
    cover_url: "",
    description:
      "The Daevabad trilogy ends: Nahri and Ali must choose between their city, their family, and the world outside.",
    genre: "Fantasy",
  },
  {
    title: "The Bear and the Nightingale",
    author: "Katherine Arden",
    cover_url: "",
    description:
      "In a frozen Russian village, a girl with a gift for seeing the old gods defies her stepmother, the village priest, and winter itself.",
    genre: "Historical Fantasy",
  },
  {
    title: "The Girl in the Tower",
    author: "Katherine Arden",
    cover_url: "",
    description:
      "Vasya runs from her family into the snow, and reaches Moscow, where the Grand Prince needs her strange gifts more than he knows.",
    genre: "Historical Fantasy",
  },
  {
    title: "The Winter of the Witch",
    author: "Katherine Arden",
    cover_url: "",
    description:
      "Vasya calls the bear-god of winter into Moscow, and the only way to save her city is to walk into his realm.",
    genre: "Historical Fantasy",
  },
  {
    title: "Spinning Silver",
    author: "Naomi Novik",
    cover_url: "",
    description:
      "A moneylender's daughter brags that she can turn silver into gold, and the king of the Staryk takes her at her word.",
    genre: "Fantasy",
  },
  {
    title: "Uprooted",
    author: "Naomi Novik",
    cover_url: "",
    description:
      "A village girl is taken from her family by a wizard called the Dragon, who keeps her in a tower of books and dark magic.",
    genre: "Fantasy",
  },
  {
    title: "A Deadly Education",
    author: "Naomi Novik",
    cover_url: "",
    description:
      "A school of magic that wants to eat its students, and a girl who is destined to be the school itself's biggest meal.",
    genre: "Fantasy",
  },
  {
    title: "The Last Graduate",
    author: "Naomi Novik",
    cover_url: "",
    description:
      "El's senior year at the Scholomance, and the school's final exam is escape, and the school's only failure is death.",
    genre: "Fantasy",
  },
  {
    title: "The Golden Enclaves",
    author: "Naomi Novik",
    cover_url: "",
    description:
      "El is in the world beyond the school, and the enclaves are run by the people who ate her classmates.",
    genre: "Fantasy",
  },
  {
    title: "Piranesi",
    author: "Susanna Clarke",
    cover_url: "",
    description:
      "A man lives in an endless House of statues and tides, keeping careful journals, and slowly realizing he has no memory of how he arrived.",
    genre: "Fantasy",
  },
  {
    title: "Jonathan Strange and Mr Norrell",
    author: "Susanna Clarke",
    cover_url: "",
    description:
      "Two very different English magicians try to restore practical magic to a country that has forgotten it, with the fairy king watching.",
    genre: "Historical Fantasy",
  },
  {
    title: "The Starless Sea",
    author: "Erin Morgenstern",
    cover_url: "",
    description:
      "A graduate student falls into a hidden underground of stories, doors, and a long-harborer's slow-burn conspiracy.",
    genre: "Fantasy",
  },
  {
    title: "The Library of Mount Char",
    author: "Scott Hawkins",
    cover_url: "",
    description:
      "A godlike father and the children he has trained in a library of impossible knowledge, and the moment one of them decides to leave.",
    genre: "Fantasy",
  },
  {
    title: "The Master and Margarita",
    author: "Mikhail Bulgakov",
    cover_url: "",
    description:
      "The Devil arrives in 1930s Moscow, a banned writer is working on a novel about Pontius Pilate, and a black cat takes over the city.",
    genre: "Classic Fiction",
  },
  {
    title: "Doctor Zhivago",
    author: "Boris Pasternak",
    cover_url: "",
    description:
      "A doctor and poet lives through the Russian Revolution, and the woman he loves more than his own country.",
    genre: "Historical Fiction",
  },
  {
    title: "Anna Karenina",
    author: "Leo Tolstoy",
    cover_url: "",
    description:
      "An aristocratic woman leaves her husband for a dashing officer, and Russia watches the train she does not come back from.",
    genre: "Classic Fiction",
  },
  {
    title: "The Brothers Karamazov",
    author: "Fyodor Dostoevsky",
    cover_url: "",
    description:
      "Three brothers with a violent father and a question: should we love this world, or refuse it? Their father is murdered, and they all could have done it.",
    genre: "Classic Fiction",
  },
  {
    title: "The Idiot",
    author: "Fyodor Dostoevsky",
    cover_url: "",
    description:
      "A genuinely good man in St. Petersburg society is mistaken for an idiot, and the city sets about correcting him.",
    genre: "Classic Fiction",
  },
  {
    title: "Demons",
    author: "Fyodor Dostoevsky",
    cover_url: "",
    description:
      "A provincial town is taken over by a small revolutionary circle, and one of them believes she has the right to murder for the cause.",
    genre: "Classic Fiction",
  },
  {
    title: "Notes from Underground",
    author: "Fyodor Dostoevsky",
    cover_url: "",
    description:
      "A retired civil servant, in two short monologues, complains about, confesses to, and curses the world he has made for himself.",
    genre: "Classic Fiction",
  },
  {
    title: "Fathers and Sons",
    author: "Ivan Turgenev",
    cover_url: "",
    description:
      "A medical student who calls himself a nihilist visits his friend's family and is met, in the garden, with a young woman who can out-argue him.",
    genre: "Classic Fiction",
  },
  {
    title: "A House of Gentlefolk",
    author: "Ivan Turgenev",
    cover_url: "",
    description:
      "A retired general's daughter falls in love with a man who is secretly a political exile, in the last years of Russian serfdom.",
    genre: "Classic Fiction",
  },
  {
    title: "Dead Souls",
    author: "Nikolai Gogol",
    cover_url: "",
    description:
      "A gentleman travels through provincial Russia buying up the names of dead serfs, in one of the strangest cons in literature.",
    genre: "Classic Fiction",
  },
  {
    title: "The Overcoat",
    author: "Nikolai Gogol",
    cover_url: "",
    description:
      "A copy clerk saves for years to buy a new overcoat, and a single night of wearing it changes his life in two ways.",
    genre: "Classic Fiction",
  },
  {
    title: "The Nose",
    author: "Nikolai Gogol",
    cover_url: "",
    description:
      "A minor St. Petersburg official wakes up to find his nose has taken on a life of its own, in the uniform of a state councillor.",
    genre: "Classic Fiction",
  },
  {
    title: "Oblomov",
    author: "Ivan Goncharov",
    cover_url: "",
    description:
      "A young nobleman who could live a life of action, prefers to lie in bed, and his best friend tries, gently, to pull him out.",
    genre: "Classic Fiction",
  },
  {
    title: "The Lady with the Dog",
    author: "Anton Chekhov",
    cover_url: "",
    description:
      "A man on holiday in Yalta has a brief affair with a young woman walking a dog, and the affair does not stay brief.",
    genre: "Classic Fiction",
  },
  {
    title: "The Seagull",
    author: "Anton Chekhov",
    cover_url: "",
    description:
      "Four people on a Russian country estate: an actress, her lover, her son, and the girl he loves, all failing to say the things they need to say.",
    genre: "Classic Drama",
  },
  {
    title: "Uncle Vanya",
    author: "Anton Chekhov",
    cover_url: "",
    description:
      "Scenes from a country house where a retired professor has come to live, and a household of good people begin to unravel.",
    genre: "Classic Drama",
  },
  {
    title: "Three Sisters",
    author: "Anton Chekhov",
    cover_url: "",
    description:
      "Three sisters in a small provincial town keep saying they will go to Moscow, and never quite do, and the years pass.",
    genre: "Classic Drama",
  },
  {
    title: "The Cherry Orchard",
    author: "Anton Chekhov",
    cover_url: "",
    description:
      "An aristocratic family must sell the estate they cannot afford, with the orchard that nobody can bear to cut down.",
    genre: "Classic Drama",
  },
  {
    title: "Fathers and Children",
    author: "Ivan Turgenev",
    cover_url: "",
    description:
      "A medical student who calls himself a nihilist visits a country estate, and the family learns a new word for the first time.",
    genre: "Classic Fiction",
  },
  {
    title: "The Death of Ivan Ilyich",
    author: "Leo Tolstoy",
    cover_url: "",
    description:
      "A high court judge realizes, on his deathbed, that the life he has been living is not the life he thought it was.",
    genre: "Classic Fiction",
  },
  {
    title: "The Kreutzer Sonata",
    author: "Leo Tolstoy",
    cover_url: "",
    description:
      "A man on a train confesses the jealousy that led him to murder his wife, and the sexual doctrine he was taught at the time.",
    genre: "Classic Fiction",
  },
  {
    title: "Hadji Murad",
    author: "Leo Tolstoy",
    cover_url: "",
    description:
      "A rebel Avar leader turns his back on Shamil and seeks Russian protection, and the Russian general who has been trying to kill him.",
    genre: "Historical Fiction",
  },
  {
    title: "The Cossacks",
    author: "Leo Tolstoy",
    cover_url: "",
    description:
      "A young nobleman on leave is sent to a Cossack village in the Caucasus, where he falls in love with a married woman.",
    genre: "Classic Fiction",
  },
  {
    title: "Resurrection",
    author: "Leo Tolstoy",
    cover_url: "",
    description:
      "A prince sits on a jury that convicts a woman he seduced years before, and decides to follow her into the prison system he helped build.",
    genre: "Classic Fiction",
  },
  {
    title: "Mother",
    author: "Maxim Gorky",
    cover_url: "",
    description:
      "The mother of a revolutionary discovers that her son is right about everything, including the things she does not want to be true.",
    genre: "Classic Fiction",
  },
  {
    title: "The Lower Depths",
    author: "Maxim Gorky",
    cover_url: "",
    description:
      "A wandering pilgrim enters a flophouse and refuses to tell its residents the truth they have been asking for.",
    genre: "Classic Drama",
  },
  {
    title: "The Thirty-Nine Steps",
    author: "John Buchan",
    cover_url: "",
    description:
      "A mining engineer in London stumbles on a spy plot and has to cross Scotland on foot to stop it.",
    genre: "Classic Thriller",
  },
  {
    title: "The Power and the Glory",
    author: "Graham Greene",
    cover_url: "",
    description:
      "A whisky priest is hunted through a Mexican state that has outlawed God, and cannot quite be honest with himself about why.",
    genre: "Classic Fiction",
  },
  {
    title: "The Quiet American",
    author: "Graham Greene",
    cover_url: "",
    description:
      "A British journalist in 1950s Saigon watches an idealistic American try to shape a war that is not his to shape.",
    genre: "Classic Fiction",
  },
  {
    title: "Our Man in Havana",
    author: "Graham Greene",
    cover_url: "",
    description:
      "A vacuum-cleaner salesman in pre-revolutionary Cuba is recruited as a British spy and sends home reports made of vacuum parts.",
    genre: "Classic Fiction",
  },
  {
    title: "Brighton Rock",
    author: "Graham Greene",
    cover_url: "",
    description:
      "A teenage gangster marries a waitress in Brighton to keep her from testifying, and a Catholic reporter is sent to find her.",
    genre: "Classic Fiction",
  },
  {
    title: "The End of the Affair",
    author: "Graham Greene",
    cover_url: "",
    description:
      "A London writer, years after an affair ended, hires a detective to learn why, and discovers a private vow he was not meant to see.",
    genre: "Classic Fiction",
  },
  {
    title: "The Third Man",
    author: "Graham Greene",
    cover_url: "",
    description:
      "An American writer in postwar Vienna investigates the death of the friend who met him, in a city of four-power occupation.",
    genre: "Classic Fiction",
  },
  {
    title: "A Room with a View",
    author: "E. M. Forster",
    cover_url: "",
    description:
      "A young Englishwoman on holiday in Florence tries to be the right kind of person, and falls in love with the wrong kind of man.",
    genre: "Classic Fiction",
  },
  {
    title: "Howards End",
    author: "E. M. Forster",
    cover_url: "",
    description:
      "Three families, one house, and the question of who, exactly, will inherit England: the thinkers, the doers, or the survivors.",
    genre: "Classic Fiction",
  },
  {
    title: "A Passage to India",
    author: "E. M. Forster",
    cover_url: "",
    description:
      "In colonial India, two Englishwomen and an Indian doctor try to meet honestly, and the country says they cannot.",
    genre: "Classic Fiction",
  },
  {
    title: "Maurice",
    author: "E. M. Forster",
    cover_url: "",
    description:
      "A young English gentleman of the Edwardian era discovers he is attracted to men, and what that means for the life he is supposed to lead.",
    genre: "Classic Fiction",
  },
  {
    title: "The Remains of the Day",
    author: "Kazuo Ishiguro",
    cover_url: "",
    description:
      "An English butler takes a short motoring trip and reviews his life of perfect service, and the chances he did not take.",
    genre: "Literary Fiction",
  },
  {
    title: "The Unconsoled",
    author: "Kazuo Ishiguro",
    cover_url: "",
    description:
      "A pianist arrives in a strange central European town for a concert that may never happen, in a dream he cannot wake from.",
    genre: "Literary Fiction",
  },
  {
    title: "A Pale View of Hills",
    author: "Kazuo Ishiguro",
    cover_url: "",
    description:
      "A Japanese widow in England remembers the postwar Nagasaki summer a pregnant stranger moved in next door.",
    genre: "Literary Fiction",
  },
  {
    title: "An Artist of the Floating World",
    author: "Kazuo Ishiguro",
    cover_url: "",
    description:
      "An aging painter of wartime propaganda tries to make sense of his past in a Japan that is rebuilding itself as a democracy.",
    genre: "Literary Fiction",
  },
  {
    title: "When We Were Orphans",
    author: "Kazuo Ishiguro",
    cover_url: "",
    description:
      "An English detective famous for solving cases in Shanghai returns to investigate his parents' disappearance, in a memory that may not be true.",
    genre: "Mystery",
  },
  {
    title: "The Buried Giant",
    author: "Kazuo Ishiguro",
    cover_url: "",
    description:
      "An elderly Briton couple walk through a postwar England where a mist of forgetfulness is slowly lifting, and old hatreds with it.",
    genre: "Fantasy",
  },
  {
    title: "The White Book",
    author: "Han Kang",
    cover_url: "",
    description:
      "A Korean writer lists white things — swaddling bands, snow, rice, the first wisp of hair — and meditates on the death of an older sister.",
    genre: "Literary Fiction",
  },
  {
    title: "The Vegetarian",
    author: "Han Kang",
    cover_url: "",
    description:
      "A Korean woman stops eating meat after a dream, and her family treats the decision as a slow, strange unraveling.",
    genre: "Literary Fiction",
  },
  {
    title: "Human Acts",
    author: "Han Kang",
    cover_url: "",
    description:
      "A boy survives the Gwangju massacre in 1980, and tries, for the rest of his life, to live with the people who did not.",
    genre: "Historical Fiction",
  },
  {
    title: "Greek Lessons",
    author: "Han Kang",
    cover_url: "",
    description:
      "A woman who has lost her voice and a Greek tutor who is losing his sight teach each other, silently, the words they cannot say.",
    genre: "Literary Fiction",
  },
  {
    title: "Pachinko",
    author: "Min Jin Lee",
    cover_url: "",
    description:
      "Four generations of a Korean family struggle to survive and belong in twentieth-century Japan.",
    genre: "Historical Fiction",
  },
  {
    title: "Free Food for Millionaires",
    author: "Min Jin Lee",
    cover_url: "",
    description:
      "A Korean American woman in 1990s New York tries to build a life with the right suit, the right boyfriend, and the wrong kind of money.",
    genre: "Fiction",
  },
  {
    title: "Convenience Store Woman",
    author: "Sayaka Murata",
    cover_url: "",
    description:
      "A woman in her late thirties has worked at the same convenience store for eighteen years, and society wants her to do something else.",
    genre: "Fiction",
  },
  {
    title: "Earthlings",
    author: "Sayaka Murata",
    cover_url: "",
    description:
      "A young girl is told that she is not like the others, and grows up to discover a conspiracy that proves it.",
    genre: "Fiction",
  },
  {
    title: "Breasts and Eggs",
    author: "Mieko Kawakami",
    cover_url: "",
    description:
      "Three Japanese women, three days, and the questions about bodies, motherhood, and the life a woman is supposed to want.",
    genre: "Literary Fiction",
  },
  {
    title: "Heaven",
    author: "Mieko Kawakami",
    cover_url: "",
    description:
      "A bullied fourteen-year-old boy and a classmate form a club for people who want to be bullied, and it goes dark fast.",
    genre: "Fiction",
  },
  {
    title: "All the Lovers in the Night",
    author: "Mieko Kawakami",
    cover_url: "",
    description:
      "An isolated proofreader in Tokyo is offered a new kind of life by a colleague with a curious way of being alive.",
    genre: "Fiction",
  },
  {
    title: "Before the Coffee Gets Cold",
    author: "Toshikazu Kawaguchi",
    cover_url: "",
    description:
      "A small Tokyo café has a seat that lets you travel back in time, but only for the length of one cup of coffee.",
    genre: "Fiction",
  },
  {
    title: "Tales from the Café",
    author: "Toshikazu Kawaguchi",
    cover_url: "",
    description:
      "More customers, more rules, more chances to revisit a moment in the past, in the small Tokyo café with the magic chair.",
    genre: "Fiction",
  },
  {
    title: "Before Your Memory Fades",
    author: "Toshikazu Kawaguchi",
    cover_url: "",
    description:
      "The third volume of the café series: a sister, a lover, and a husband find their way back to a moment they did not finish.",
    genre: "Fiction",
  },
  {
    title: "Pretty Girls",
    author: "Karin Slaughter",
    cover_url: "",
    description:
      "A woman learns that her missing sister's death twenty years ago was the beginning, not the end, of a single long secret.",
    genre: "Thriller",
  },
  {
    title: "Cop Town",
    author: "Karin Slaughter",
    cover_url: "",
    description:
      "A woman joins the Atlanta police in 1974, with a partner, a murdered brother, and a serial killer targeting cops.",
    genre: "Mystery",
  },
  {
    title: "The Will Trent Series",
    author: "Karin Slaughter",
    cover_url: "",
    description:
      "The first Will Trent novel: a Georgia Bureau agent with a difficult past investigates a prison murder that reaches into a powerful family.",
    genre: "Mystery",
  },
  {
    title: "Sharp Objects",
    author: "Gillian Flynn",
    cover_url: "",
    description:
      "A reporter returns to her hometown to cover the murder of two girls and confront the violence of her own childhood.",
    genre: "Thriller",
  },
  {
    title: "Dark Places",
    author: "Gillian Flynn",
    cover_url: "",
    description:
      "A woman who testified against her brother for the murder of their family meets a true-crime group who believes he was innocent.",
    genre: "Thriller",
  },
  {
    title: "The Wife Between Us",
    author: "Greer Hendricks",
    cover_url: "",
    description:
      "A woman who has lost her husband to a younger, more beautiful second wife is plotting something the reader has not yet figured out.",
    genre: "Thriller",
  },
  {
    title: "An Anonymous Girl",
    author: "Greer Hendricks",
    cover_url: "",
    description:
      "A struggling artist signs up for a study on morality, and the professor seems to know things about her that she never told him.",
    genre: "Thriller",
  },
  {
    title: "The Last Mrs. Parrish",
    author: "Liv Constantine",
    cover_url: "",
    description:
      "A woman inserts herself into a wealthy couple's life as a friend, and as a possible replacement for the wife.",
    genre: "Thriller",
  },
  {
    title: "The Push",
    author: "Ashley Audrain",
    cover_url: "",
    description:
      "A new mother is certain from the start that something is wrong with her daughter, and that nobody believes her.",
    genre: "Fiction",
  },
  {
    title: "Whose Body?",
    author: "Dorothy L. Sayers",
    cover_url: "",
    description:
      "A naked corpse is found in a bathtub, and Lord Peter Wimsey begins the long, witty career that will define him.",
    genre: "Classic Mystery",
  },
  {
    title: "Strong Poison",
    author: "Dorothy L. Sayers",
    cover_url: "",
    description:
      "Lord Peter Wimsey falls in love with a murder defendant on the day of her trial for poisoning her lover.",
    genre: "Classic Mystery",
  },
  {
    title: "The Nine Tailors",
    author: "Dorothy L. Sayers",
    cover_url: "",
    description:
      "A New Year's Eve bell-ringing in a Fenland church goes wrong, and Lord Peter Wimsey must dig up what is in the churchyard.",
    genre: "Classic Mystery",
  },
  {
    title: "Gaudy Night",
    author: "Dorothy L. Sayers",
    cover_url: "",
    description:
      "A women's college at Oxford is plagued by poison-pen letters, and Harriet Vane is called back to investigate.",
    genre: "Classic Mystery",
  },
  {
    title: "Busman's Honeymoon",
    author: "Dorothy L. Sayers",
    cover_url: "",
    description:
      "Lord Peter Wimsey and Harriet Vane's honeymoon is interrupted by a corpse in the cellar of their first country house.",
    genre: "Classic Mystery",
  },
  {
    title: "The Maltese Falcon",
    author: "Dashiell Hammett",
    cover_url: "",
    description:
      "Sam Spade, three crooks, and one black bird of dubious value: the first hard-boiled American detective novel.",
    genre: "Classic Mystery",
  },
  {
    title: "The Thin Man",
    author: "Dashiell Hammett",
    cover_url: "",
    description:
      "Nick and Nora Charles solve a missing-persons case between cocktails in New York, in Hammett's last novel.",
    genre: "Classic Mystery",
  },
  {
    title: "The Big Sleep",
    author: "Raymond Chandler",
    cover_url: "",
    description:
      "Philip Marlowe, an aging general, and two daughters with too much money and not enough care: Los Angeles, 1930s.",
    genre: "Classic Mystery",
  },
  {
    title: "Farewell, My Lovely",
    author: "Raymond Chandler",
    cover_url: "",
    description:
      "Marlowe is hired to find a missing ex-con, and ends up in a San Bernardino bar with Moose Malloy, a problem in himself.",
    genre: "Classic Mystery",
  },
  {
    title: "The High Window",
    author: "Raymond Chandler",
    cover_url: "",
    description:
      "A rich old woman hires Marlowe to recover a rare coin, which her son-in-law has been forced to steal.",
    genre: "Classic Mystery",
  },
  {
    title: "The Lady in the Lake",
    author: "Raymond Chandler",
    cover_url: "",
    description:
      "Marlowe searches for a missing wife, finds a body in a mountain lake, and a rich man's other wife who likes watching the action.",
    genre: "Classic Mystery",
  },
  {
    title: "The Long Goodbye",
    author: "Raymond Chandler",
    cover_url: "",
    description:
      "Marlowe helps a friend in trouble, and the friend disappears, and the case becomes the longest of Marlowe's life.",
    genre: "Classic Mystery",
  },
  {
    title: "Playback",
    author: "Raymond Chandler",
    cover_url: "",
    description:
      "Marlowe follows a young woman from a small California town to a luxury hotel in a small Arizona town.",
    genre: "Classic Mystery",
  },
  {
    title: "The Moving Target",
    author: "Ross Macdonald",
    cover_url: "",
    description:
      "Lew Archer, in his first appearance, looks for a missing California rich man, and finds the family that money broke.",
    genre: "Classic Mystery",
  },
  {
    title: "The Way Some People Die",
    author: "Ross Macdonald",
    cover_url: "",
    description:
      "Lew Archer is hired to find a missing woman, and finds a war veteran, a gangster's daughter, and a murder nobody wants reported.",
    genre: "Classic Mystery",
  },
  {
    title: "The Chill",
    author: "Ross Macdonald",
    cover_url: "",
    description:
      "A wealthy Los Angeles man asks Lew Archer to find the daughter he has not seen in twenty years.",
    genre: "Classic Mystery",
  },
  {
    title: "The Underground Man",
    author: "Ross Macdonald",
    cover_url: "",
    description:
      "A man, his runaway daughter, a dead son, and a missing boy: Lew Archer and the slow, surfacing California past.",
    genre: "Classic Mystery",
  },
  {
    title: "Sleeping Beauty",
    author: "Ross Macdonald",
    cover_url: "",
    description:
      "A man named Leo wakes from a stroke to learn that his wife is missing, and his children do not want her back.",
    genre: "Classic Mystery",
  },
  {
    title: "The Blue Hammer",
    author: "Ross Macdonald",
    cover_url: "",
    description:
      "Lew Archer investigates a present-day crime with roots in a 1940s art-forgery case in the California desert.",
    genre: "Classic Mystery",
  },
  {
    title: "Where the Red Fern Grows",
    author: "Wilson Rawls",
    cover_url: "",
    description:
      "A boy in the Ozarks works two years to buy two coonhounds, and grows up in a hunting season he will never forget.",
    genre: "Young Adult Fiction",
  },
  {
    title: "Old Yeller",
    author: "Fred Gipson",
    cover_url: "",
    description:
      "A frontier Texas boy and the big yellow dog who saves his family, and the choice the boy must make when the dog is hurt.",
    genre: "Young Adult Fiction",
  },
  {
    title: "Sounder",
    author: "William H. Armstrong",
    cover_url: "",
    description:
      "A poor black sharecropper's son and the hunting dog named Sounder, in the years after the Civil War.",
    genre: "Young Adult Fiction",
  },
  {
    title: "Island of the Blue Dolphins",
    author: "Scott O'Dell",
    cover_url: "",
    description:
      "A young Native American girl is left alone on a California island and survives there for eighteen years.",
    genre: "Young Adult Fiction",
  },
  {
    title: "The Sign of the Beaver",
    author: "Elizabeth George Speare",
    cover_url: "",
    description:
      "A boy is left to guard a cabin in 18th-century Maine, and survives with the help of a Native American boy his own age.",
    genre: "Young Adult Fiction",
  },
  {
    title: "Shiloh",
    author: "Phyllis Reynolds Naylor",
    cover_url: "",
    description:
      "A boy in West Virginia finds a beagle he knows has been mistreated, and a quiet moral test begins.",
    genre: "Young Adult Fiction",
  },
  {
    title: "Walk Two Moons",
    author: "Sharon Creech",
    cover_url: "",
    description:
      "A girl drives across America with her grandparents, and tells the story of her missing mother along the way.",
    genre: "Young Adult Fiction",
  },
  {
    title: "Maniac Magee",
    author: "Jerry Spinelli",
    cover_url: "",
    description:
      "A boy runs away from a difficult home and becomes a legend in a town split by race.",
    genre: "Young Adult Fiction",
  },
  {
    title: "Bridge to Terabithia",
    author: "Katherine Paterson",
    cover_url: "",
    description:
      "Two friends create a secret kingdom in the woods, and one of them is not there in the morning.",
    genre: "Young Adult Fiction",
  },
  {
    title: "The Westing Game",
    author: "Ellen Raskin",
    cover_url: "",
    description:
      "Sixteen unlikely heirs are gathered to solve a dying man's will, and the answer is a murder.",
    genre: "Young Adult Mystery",
  },
  {
    title: "From the Mixed-Up Files of Mrs. Basil E. Frankweiler",
    author: "E. L. Konigsburg",
    cover_url: "",
    description:
      "Two children run away to the Metropolitan Museum of Art and live inside it for a week, investigating a mystery.",
    genre: "Young Adult Fiction",
  },
  {
    title: "The Phantom Tollbooth",
    author: "Norton Juster",
    cover_url: "",
    description:
      "A bored boy drives through a magic tollbooth into a kingdom where words and numbers are at war.",
    genre: "Children's Fiction",
  },
  {
    title: "A Wrinkle in Time",
    author: "Madeleine L'Engle",
    cover_url: "",
    description:
      "Three children travel through space and time to find their missing father, who is held by a great dark thing.",
    genre: "Children's Fiction",
  },
  {
    title: "A Wind in the Willows",
    author: "Kenneth Grahame",
    cover_url: "",
    description:
      "Toad of Toad Hall, Mole, Ratty, and Badger: the quiet adventures of four friends along the riverbank.",
    genre: "Children's Fiction",
  },
  {
    title: "The Wind in the Willows",
    author: "Kenneth Grahame",
    cover_url: "",
    description:
      "Toad, Mole, Ratty, and Badger: a slow, kind, very English story of friendship on a riverbank.",
    genre: "Children's Fiction",
  },
  {
    title: "Winnie-the-Pooh",
    author: "A. A. Milne",
    cover_url: "",
    description:
      "A bear of very little brain and his friends in the Hundred Acre Wood, in stories Christopher Robin's father made for him.",
    genre: "Children's Fiction",
  },
  {
    title: "The House at Pooh Corner",
    author: "A. A. Milne",
    cover_url: "",
    description:
      "More stories from the Hundred Acre Wood, in which Tigger arrives, Owl's house is blown down, and Christopher Robin says goodbye.",
    genre: "Children's Fiction",
  },
  {
    title: "When We Were Very Young",
    author: "A. A. Milne",
    cover_url: "",
    description:
      "A 1920s book of poems for children, with Christopher Robin, a bear, and a King who is not entirely sure of his crown.",
    genre: "Children's Poetry",
  },
  {
    title: "Now We Are Six",
    author: "A. A. Milne",
    cover_url: "",
    description:
      "More poems for Christopher Robin, age six, who is getting to be a fairly large person, in the Hundred Acre Wood.",
    genre: "Children's Poetry",
  },
  {
    title: "Paddington",
    author: "Michael Bond",
    cover_url: "",
    description:
      "A small bear from Peru arrives at Paddington Station with a suitcase, a jar of marmalade, and a label that says 'Please look after this bear.'",
    genre: "Children's Fiction",
  },
  {
    title: "Paddington Helps Out",
    author: "Michael Bond",
    cover_url: "",
    description:
      "More adventures of the Brown family's bear from Peru, who tries very hard to be helpful and usually is not.",
    genre: "Children's Fiction",
  },
  {
    title: "A Bear Called Paddington",
    author: "Michael Bond",
    cover_url: "",
    description:
      "The first book about the bear from Peru who ends up living with the Browns at 32 Windsor Gardens, London.",
    genre: "Children's Fiction",
  },
  {
    title: "The Borrowers",
    author: "Mary Norton",
    cover_url: "",
    description:
      "A family of tiny people live under the floorboards of an English country house, borrowing what they need to survive.",
    genre: "Children's Fiction",
  },
  {
    title: "The Borrowers Avenged",
    author: "Mary Norton",
    cover_url: "",
    description:
      "The Borrowers series ends: the family moves house, with the help of their human friends, and a wrong is set right.",
    genre: "Children's Fiction",
  },
  {
    title: "The Magician's Nephew",
    author: "C. S. Lewis",
    cover_url: "",
    description:
      "Two children find themselves in the Wood between the Worlds, and watch the birth of Narnia.",
    genre: "Children's Fantasy",
  },
  {
    title: "The Lion, the Witch and the Wardrobe",
    author: "C. S. Lewis",
    cover_url: "",
    description:
      "Four children walk through a wardrobe into a country ruled by an evil witch, where it is always winter.",
    genre: "Children's Fantasy",
  },
  {
    title: "The Horse and His Boy",
    author: "C. S. Lewis",
    cover_url: "",
    description:
      "A boy and a talking horse flee from Calormen northward, in a Narnia story told mostly outside Narnia.",
    genre: "Children's Fantasy",
  },
  {
    title: "Prince Caspian",
    author: "C. S. Lewis",
    cover_url: "",
    description:
      "The four Pevensies return to Narnia to find it under the rule of a usurper king, and a young prince in hiding.",
    genre: "Children's Fantasy",
  },
  {
    title: "The Voyage of the Dawn Treader",
    author: "C. S. Lewis",
    cover_url: "",
    description:
      "Edmund, Lucy, and their cousin Eustace sail to the end of the world in King Caspian's ship, the Dawn Treader.",
    genre: "Children's Fantasy",
  },
  {
    title: "The Silver Chair",
    author: "C. S. Lewis",
    cover_url: "",
    description:
      "Jill and Eustace search the cold lands north of Narnia for a prince who was lost as a child.",
    genre: "Children's Fantasy",
  },
  {
    title: "The Last Battle",
    author: "C. S. Lewis",
    cover_url: "",
    description:
      "The last days of Narnia, told by a stableboy who finds an ape with a lion skin and a country that believes in him.",
    genre: "Children's Fantasy",
  },
  {
    title: "The Dark Is Rising",
    author: "Susan Cooper",
    cover_url: "",
    description:
      "On his eleventh birthday, a boy in an English village learns he is one of the Old Ones, and the Dark is rising.",
    genre: "Children's Fantasy",
  },
  {
    title: "Greenwitch",
    author: "Susan Cooper",
    cover_url: "",
    description:
      "The Dark Is Rising sequence continues: the children help free a man held by a fisherman's family in Cornwall.",
    genre: "Children's Fantasy",
  },
  {
    title: "The Grey King",
    author: "Susan Cooper",
    cover_url: "",
    description:
      "Will Stanton wakes in a Welsh valley with a fever, a new power, and a name he was told to call when the time came.",
    genre: "Children's Fantasy",
  },
  {
    title: "Silver on the Tree",
    author: "Susan Cooper",
    cover_url: "",
    description:
      "The Dark Is Rising sequence ends in the Lost Lands, with the six signs, the Dark, and the final test of the Old Ones.",
    genre: "Children's Fantasy",
  },
  {
    title: "The Weirdstone of Brisingamen",
    author: "Alan Garner",
    cover_url: "",
    description:
      "A brother and sister in Cheshire discover the old magical guardians of England are awake and at war.",
    genre: "Children's Fantasy",
  },
  {
    title: "The Moon of Gomrath",
    author: "Alan Garner",
    cover_url: "",
    description:
      "The Weirdstone sequel: an ancient silver door is opened in the woods, and the children of Alderley are drawn through it.",
    genre: "Children's Fantasy",
  },
  {
    title: "Elidor",
    author: "Alan Garner",
    cover_url: "",
    description:
      "Four children find a ruined house and a different world, and bring back four talismans they should not be holding.",
    genre: "Children's Fantasy",
  },
  {
    title: "The Owl Service",
    author: "Alan Garner",
    cover_url: "",
    description:
      "A Welsh valley, a flowery plate, and a triangle of three teenagers who play out a myth they cannot remember.",
    genre: "Children's Fantasy",
  },
  {
    title: "Red Shift",
    author: "Alan Garner",
    cover_url: "",
    description:
      "Three time-shifted stories of lovers in Cheshire, from Roman soldiers to a present-day couple in a damaged cottage.",
    genre: "Young Adult Fiction",
  },
  {
    title: "The Weirdstone of Brisingamen",
    author: "Alan Garner",
    cover_url: "",
    description:
      "Two modern children protect a sleeping knight and a magical stone from the riders of the Dark.",
    genre: "Children's Fantasy",
  },
  {
    title: "The Wolves of Willoughby Chase",
    author: "Joan Aiken",
    cover_url: "",
    description:
      "Two cousins in an alternate 19th-century England survive wolves, a governess, and a long, cold winter.",
    genre: "Children's Fiction",
  },
  {
    title: "Black Horses in the Sky",
    author: "Joan Aiken",
    cover_url: "",
    description:
      "Joan Aiken's short stories for children, full of castles, clever children, and quiet danger.",
    genre: "Children's Fiction",
  },
  {
    title: "The Diamond in the Window",
    author: "Jane Langton",
    cover_url: "",
    description:
      "Two Boston children climb into a doll's house in their attic and find a quest, an evil uncle, and a secret state.",
    genre: "Children's Fiction",
  },
  {
    title: "The Mysterious Benedict Society",
    author: "Trenton Lee Stewart",
    cover_url: "",
    description:
      "Four gifted children are recruited to infiltrate a school run by a man who controls minds through television.",
    genre: "Children's Fiction",
  },
  {
    title: "The Mysterious Benedict Society and the Perilous Journey",
    author: "Trenton Lee Stewart",
    cover_url: "",
    description:
      "The four gifted children return to face Mr. Curtain again, this time on a remote island of puzzles and storms.",
    genre: "Children's Fiction",
  },
  {
    title: "The Mysterious Benedict Society and the Prisoner's Dilemma",
    author: "Trenton Lee Stewart",
    cover_url: "",
    description:
      "The third Mysterious Benedict Society book: a global broadcast turns kindness into panic, and the team must stop it.",
    genre: "Children's Fiction",
  },
  {
    title: "The Mysterious Benedict Society: Mr. Benedict's Book of Perplexing Puzzles, Elusive Enigmas, and Curious Conundrums",
    author: "Trenton Lee Stewart",
    cover_url: "",
    description:
      "A companion book of puzzles in the world of the Mysterious Benedict Society, for kids and their grown-ups.",
    genre: "Children's Fiction",
  },
  {
    title: "The Name of this Book Is Secret",
    author: "Pseudonymous Bosch",
    cover_url: "",
    description:
      "Two children find a box of magician's secrets in a dead man's house, and are told not to read it, and read it.",
    genre: "Children's Fiction",
  },
  {
    title: "If You're Reading This, It's Too Late",
    author: "Pseudonymous Bosch",
    cover_url: "",
    description:
      "More Secret Series: a mysterious recruitment ad, a Terces Society, and a set of secret instructions that turn out badly.",
    genre: "Children's Fiction",
  },
  {
    title: "This Book Is Not Good for You",
    author: "Pseudonymous Bosch",
    cover_url: "",
    description:
      "The third Secret book, with a magician, a cursed dessert, and a long-sought-after tuning fork.",
    genre: "Children's Fiction",
  },
  {
    title: "This Isn't What It Looks Like",
    author: "Pseudonymous Bosch",
    cover_url: "",
    description:
      "The fourth Secret book: time travel, a town called Happy Shroud, and a bowl of pudding that is more than it seems.",
    genre: "Children's Fiction",
  },
  {
    title: "You Have to Stop This",
    author: "Pseudonymous Bosch",
    cover_url: "",
    description:
      "The fifth and final Secret book: a villain, a weapon, an Egyptian cat, and one last desperate plan to save the world.",
    genre: "Children's Fiction",
  },
  {
    title: "The House With a Clock in Its Walls",
    author: "John Bellairs",
    cover_url: "",
    description:
      "A 10-year-old orphan is sent to live with his uncle, a warlock, in a house that is trying to bring about the end of the world.",
    genre: "Children's Fiction",
  },
  {
    title: "The Figure in the Shadows",
    author: "John Bellairs",
    cover_url: "",
    description:
      "Lewis Barnavelt and his friend Rose Rita face a powerful amulet and the long-dead wizard who wants it back.",
    genre: "Children's Fiction",
  },
  {
    title: "The Letter, the Witch, and the Ring",
    author: "John Bellairs",
    cover_url: "",
    description:
      "The last Lewis Barnavelt novel: a magic ring, a missing letter, and a witch who should have stayed forgotten.",
    genre: "Children's Fiction",
  },
  {
    title: "The Treasure of Alpheus Winterborn",
    author: "John Bellairs",
    cover_url: "",
    description:
      "A boy in a small town finds a coded message about a hidden fortune, and the strange family that hid it.",
    genre: "Children's Fiction",
  },
  {
    title: "The Doom of the Haunted Opera",
    author: "John Bellairs",
    cover_url: "",
    description:
      "Lewis and his uncle attend an opera, and a chandelier falls, and a ghost they had met before turns out to be back.",
    genre: "Children's Fiction",
  },
  {
    title: "The 13 Clocks",
    author: "James Thurber",
    cover_url: "",
    description:
      "A prince must do three impossible things to free a princess from the evil Duke who keeps time stopped in his castle.",
    genre: "Children's Fantasy",
  },
  {
    title: "The Wonderful O",
    author: "James Thurber",
    cover_url: "",
    description:
      "A pirate captain forbids the letter O in a small island kingdom, with absurd results.",
    genre: "Children's Fiction",
  },
  {
    title: "The Phantom Tollbooth",
    author: "Norton Juster",
    cover_url: "",
    description:
      "A bored boy drives through a magic tollbooth into a kingdom where words and numbers are at war.",
    genre: "Children's Fiction",
  },
  {
    title: "The Westing Game",
    author: "Ellen Raskin",
    cover_url: "",
    description:
      "Sixteen people gather in a strange apartment building to hear a rich man's last will, and the prize is a fortune.",
    genre: "Young Adult Mystery",
  },
  {
    title: "The Egypt Game",
    author: "Zilpha Keatley Snyder",
    cover_url: "",
    description:
      "A group of children in a California apartment complex invent an ancient Egyptian religion in the storage yard, and things go wrong.",
    genre: "Children's Fiction",
  },
  {
    title: "The Headless Cupid",
    author: "Zilpha Keatley Snyder",
    cover_url: "",
    description:
      "A new step-sister brings a plastic cupid and a real, slightly ghostly one, and the children investigate the old house together.",
    genre: "Children's Fiction",
  },
  {
    title: "The Witches of Worm",
    author: "Zilpha Keatley Snyder",
    cover_url: "",
    description:
      "A lonely girl adopts a small black cat, and the cat, possibly, is a reincarnated witch.",
    genre: "Children's Fiction",
  },
];

const insertBook = db.prepare(
  "INSERT INTO books (title, author, cover_url, description, genre) VALUES (?, ?, ?, ?, ?)"
);

const existsStmt = db.prepare(
  "SELECT id FROM books WHERE title = ? AND author = ?"
);

function titleMatch(searchTitle: string, resultTitle: string): boolean {
  const sig = (s: string) =>
    s.toLowerCase().replace(/-/g, " ").replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(
      (w) => w.length > 2 && !["the", "and", "for", "with", "not"].includes(w)
    );
  const sWords = sig(searchTitle);
  if (sWords.length === 0) return true;
  const rWords = sig(resultTitle);
  return sWords.every((w) => rWords.includes(w));
}

async function fetchCover(title: string, author: string): Promise<string | null> {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=5&fields=key,title,author_name,cover_i`;
    const res = await fetch(url);
    const data = (await res.json()) as { docs: Record<string, unknown>[] };
    const doc = data.docs.find((d: any) =>
      d.author_name && d.cover_i && titleMatch(title, d.title as string)
    ) as Record<string, unknown> | undefined;
    if (doc) {
      const coverId = (doc as any).cover_i;
      return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
    }
  } catch {}
  return null;
}

async function main() {
  console.log(`Adding ${NEW_BOOKS.length} books...`);

  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const book of NEW_BOOKS) {
    const existing = existsStmt.get(book.title, book.author) as { id: number } | undefined;
    if (existing) {
      skipped++;
      continue;
    }

    // Try to fetch a cover, but use a placeholder if it fails.
    let coverUrl = book.cover_url;
    if (!coverUrl) {
      const fetched = await fetchCover(book.title, book.author);
      coverUrl = fetched || `https://placehold.co/400x600/1f2937/d1d5db?text=${encodeURIComponent(book.title.slice(0, 24))}`;
      // Small delay to be polite
      await new Promise((r) => setTimeout(r, 150));
    }

    try {
      insertBook.run(book.title, book.author, coverUrl, book.description, book.genre);
      added++;
      console.log(`  Added: ${book.title} - ${book.author}`);
    } catch (err) {
      failed++;
      console.error(`  Failed: ${book.title} - ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\nDone. Added ${added}, skipped ${skipped} (already exist), failed ${failed}.`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
