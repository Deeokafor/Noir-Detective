// cases.js — Pre-written case library for Noir Detective
// All cases drawn from public-domain sources

window.CASES = [
  {
    id: 'blue-carbuncle',
    title: 'The Blue Carbuncle',
    theme: 'classic',
    difficulty: 2,
    source: 'Arthur Conan Doyle, "The Adventure of the Blue Carbuncle" (1892)',
    summary: 'A priceless gem — the Blue Carbuncle — is found inside a Christmas goose. You must trace it back to the thief before they vanish.',
    briefing: {
      kids: `A very valuable blue gem called the Blue Carbuncle has gone missing from a hotel. It was found inside a Christmas goose that a man named Henry Baker lost on the street. You need to find out who stole the gem and hid it in the goose.\n\nSuspects:\n- Henry Baker: A simple man who lost his goose.\n- James Ryder: A hotel worker who acts very nervous.\n- Catherine Cusack: A maid at the hotel.`,
      general: `The Countess of Morcar's prized Blue Carbuncle — a rare blue gemstone — has been stolen from the Hotel Cosmopolitan. It turned up inside a Christmas goose, which was dropped by one Henry Baker during a street altercation. Someone planted the gem inside the goose to smuggle it out of the hotel. Your job: find the smuggler.\n\nThe hotel's head attendant James Ryder is behaving erratically. The Countess's maid Catherine Cusack has a connection to Ryder. Plumber John Horner was wrongly arrested — your investigation may clear him.`,
      advanced: `The Countess of Morcar's Blue Carbuncle — an exquisite Ceylon sapphire — has been abstracted from Hotel Cosmopolitan's strong-room. Its improbable recovery inside a Christmas goose sold through Covent Garden's poultry chain suggests a carefully premeditated smuggling scheme. A street dispute led to Henry Baker losing the goose before the gem reached its destination.\n\nJames Ryder, the hotel's head attendant, engineered plumber John Horner's wrongful arrest as a decoy. The Countess's attendant Catherine Cusack was Ryder's inside confederate. The question is whether you can reconstruct the chain of custody — and whether justice demands arrest or mercy.`
    },
    suspects: [
      { id: 'ryder',   name: 'James Ryder',      emoji: '🧑‍💼', role: 'Hotel Head Attendant',  intro: 'Nervous and evasive. Has access to the Countess\'s rooms.' },
      { id: 'baker',   name: 'Henry Baker',       emoji: '🧔',   role: 'Lost Goose Owner',      intro: 'Hapless academic. Lost the goose in a street scuffle.' },
      { id: 'cusack',  name: 'Catherine Cusack',  emoji: '👩',   role: "Countess's Maid",        intro: 'Quiet but has an unexplained friendship with Ryder.' },
      { id: 'horner',  name: 'John Horner',       emoji: '🔧',   role: 'Plumber (Arrested)',     intro: 'Has a prior conviction. Currently in custody — but did he do it?' },
    ],
    evidence: [
      { id: 'goose',   name: 'Christmas Goose',   emoji: '🪿',  desc: 'A freshly killed goose — the Blue Carbuncle was found in its crop. A tag reads "For Mrs. Henry Baker."' },
      { id: 'gem',     name: 'Blue Carbuncle',     emoji: '💎',  desc: 'A brilliant blue gemstone, worth thousands. Registered to the Countess of Morcar.' },
      { id: 'receipt', name: 'Goose Club Receipt', emoji: '🧾',  desc: "Ryder's handwriting appears in the Covent Garden goose club register — he arranged the specific goose." },
      { id: 'alibi',   name: 'Ryder\'s Statement', emoji: '📄',  desc: 'Ryder claims he was in the hotel lobby all evening. Yet two kitchen staff say he was absent for nearly an hour.' },
      { id: 'letter',  name: 'Cusack\'s Note',     emoji: '✉️',  desc: 'A crumpled note from Cusack to Ryder: "It\'s in the crop. The goose club is your best route. —C."' },
    ],
    interviews: {
      ryder: {
        opening: '"I — I assure you, I know nothing about any gem. I\'ve been framed, like poor Horner was."',
        questions: [
          { q: 'Where were you the evening the gem disappeared?', a: '"In the lobby, I told you. All evening."', logsAs: 'Ryder: Claims he was in the hotel lobby all evening.' },
          { q: 'Do you know Catherine Cusack well?',              a: '"She\'s a colleague, nothing more."', logsAs: 'Ryder: Says Cusack is merely a colleague.' },
          { q: 'Tell me about the Covent Garden goose club.',     a: 'Ryder\'s eyes dart. "I — yes, I buy a goose there each Christmas. Plenty of people do."', logsAs: 'Ryder: Admits to buying from Covent Garden goose club.' },
          { q: 'Can you explain your handwriting on the register?',a: 'He sweats. "That must be a forgery. Or — someone used my name."', logsAs: 'Ryder: Cannot explain his handwriting in the register.' },
        ]
      },
      baker: {
        opening: '"Dreadful business! I only want my goose back — and my hat."',
        questions: [
          { q: 'How did you lose your goose?',           a: '"A gang of roughs set upon me. I ran — dropped everything."', logsAs: 'Baker: Lost his goose fleeing street ruffians.' },
          { q: 'Did anyone give you the goose directly?', a: '"No, I collected it from the Alpha Inn goose club, as I do every year."', logsAs: 'Baker: Collected goose from the Alpha Inn club, not Covent Garden.' },
          { q: 'Do you know James Ryder?',               a: '"Ryder? The hotel man? Barely. I stayed at the Cosmopolitan once, years ago."', logsAs: 'Baker: Knows Ryder only superficially.' },
        ]
      },
      cusack: {
        opening: '"I really don\'t know what all the fuss is about. I mind my own business."',
        questions: [
          { q: 'Did you know the gem was stolen before the police arrived?', a: 'A long pause. "I may have overheard something. It\'s a big hotel."', logsAs: 'Cusack: Vague about when she learned of the theft.' },
          { q: 'Did you write this note to Ryder?',                         a: 'Her face whitens. "Where did you get that?"', logsAs: 'Cusack: Does not deny writing the note when confronted.' },
          { q: 'What did you get in return for helping Ryder?',             a: '"I want a solicitor before I say another word."', logsAs: 'Cusack: Refuses to answer about her reward without a solicitor.' },
        ]
      },
      horner: {
        opening: '"Thank God someone\'s looking! I never touched that gem. I was fixing a gas bracket, nothing else!"',
        questions: [
          { q: 'Why do you have a prior conviction?',          a: '"A youthful mistake. I\'ve been straight for eight years."', logsAs: 'Horner: Has prior conviction but claims to be reformed.' },
          { q: 'Who had access to the room besides you?',      a: '"Ryder was there. He left twice while I worked. And the maid."', logsAs: 'Horner: Places Ryder in the room twice during repair work.' },
          { q: 'Were you alone in the room at any point?',     a: '"Yes — Ryder left for several minutes near the end."', logsAs: 'Horner: Left alone only briefly; Ryder absent for "several minutes."' },
        ]
      },
    },
    contradictions: [
      { a: 'Ryder: Claims he was in the hotel lobby all evening.', b: 'Ryder: Cannot explain his handwriting in the register.', correct: true,  feedback: 'Correct! Ryder can\'t be in the lobby all evening AND personally arranging the goose.' },
      { a: 'Ryder: Says Cusack is merely a colleague.',            b: 'Cusack: Does not deny writing the note when confronted.', correct: true,  feedback: 'Sharp! The note proves a far deeper collaboration than "colleagues."' },
      { a: 'Baker: Collected goose from the Alpha Inn club, not Covent Garden.', b: 'Ryder: Admits to buying from Covent Garden goose club.', correct: false, feedback: 'These don\'t contradict — they\'re two different clubs and two different geese in the chain.' },
    ],
    culprit: 'ryder',
    keyEvidence: ['receipt', 'letter'],
    debrief: 'James Ryder, tipped off by Catherine Cusack, stole the Blue Carbuncle and hid it in a goose he arranged through the Covent Garden club — planning to retrieve it later. John Horner was wrongly arrested as a decoy. In the original story, Holmes lets Ryder go, reasoning that prison would make him worse, not better.',
  },

  {
    id: 'red-headed-league',
    title: 'The Red-Headed League',
    theme: 'fraud',
    difficulty: 3,
    source: 'Arthur Conan Doyle, "The Red-Headed League" (1891)',
    summary: 'A pawnbroker is paid handsomely to copy an encyclopedia — and suddenly the well-paying job vanishes. The job was a ruse, but for what?',
    briefing: {
      kids: `Jabez Wilson, a pawnbroker with bright red hair, was hired by a mysterious "Red-Headed League" to copy encyclopedia pages for four pounds a week. After two months, the job suddenly ended. Something very sneaky was going on — the job was fake!\n\nSuspects:\n- Vincent Spaulding: Wilson's assistant who told him about the job.\n- John Clay: A criminal known for clever tricks.\n- Archie Mercer: The man who posted the job advertisement.`,
      general: `Jabez Wilson, a London pawnbroker, answered a peculiar ad: the "Red-Headed League" would pay any red-haired man four pounds a week to copy out the encyclopedia at their office. He worked there for two months — then the League dissolved overnight, its offices empty.\n\nThe "job" kept Wilson out of his shop for hours each day. His assistant Vincent Spaulding urged him to apply, and only works mornings. Something was going on in Wilson's cellar while he was away. The banker John Clay is suspected, but he's never been caught.`,
      advanced: `Jabez Wilson received what appeared to be a windfall: a sinecure offered by the fictitious "Red-Headed League," paying four pounds weekly for transcribing encyclopaedias. The scheme evaporated eight weeks later. The elaborate deception's purpose was to vacate Wilson's premises for four hours daily — giving his assistant, the well-bred criminal John Clay, uninterrupted access to tunnel from the cellar into the adjacent City and Suburban Bank.\n\nThe fraud is almost poetically over-engineered. Your task is not just to name the culprit but to reconstruct the scheme and identify every link in the chain.`
    },
    suspects: [
      { id: 'spaulding', name: 'Vincent Spaulding', emoji: '🧑‍🔧', role: "Wilson's Shop Assistant", intro: 'Energetic and helpful. Works only mornings. Has an unusual hobby: photography in the cellar.' },
      { id: 'clay',      name: 'John Clay',         emoji: '🎩',    role: 'Suspected Criminal',    intro: 'A gentleman-criminal who has eluded police for years. Grandiose in style.' },
      { id: 'mercer',    name: 'Archie Mercer',      emoji: '👴',    role: 'League Administrator', intro: 'Placed the ad and ran the "league." Disappeared when the scheme ended.' },
      { id: 'wilson',    name: 'Jabez Wilson',       emoji: '🦰',    role: 'Victim / Pawnbroker',  intro: 'Red-haired, trusting, and completely deceived.' },
    ],
    evidence: [
      { id: 'ad',      name: 'League Advertisement', emoji: '📰', desc: 'A newspaper ad for the Red-Headed League — same handwriting as a letter signed by Spaulding recommending Wilson for the job.' },
      { id: 'cellar',  name: 'Freshly Dug Soil',     emoji: '🪣', desc: 'The cellar of Wilson\'s shop has fresh soil and a tunnel entrance, aimed directly at the City and Suburban Bank vault.' },
      { id: 'knees',   name: 'Spaulding\'s Trousers',emoji: '👖', desc: 'The knees of Spaulding\'s trousers are heavily soiled with reddish clay — consistent with tunnel digging.' },
      { id: 'schedule',name: 'Work Schedule',        emoji: '📅', desc: 'Spaulding works only mornings — exactly when Wilson was away at the League office. Afternoons unaccounted for.' },
      { id: 'bank',    name: 'Bank Manager\'s Note',  emoji: '🏦', desc: 'The City and Suburban Bank reports an unexplained draft of cold air and scraping sounds beneath their floor this past week.' },
    ],
    interviews: {
      spaulding: {
        opening: '"It\'s a rotten shame, Mr. Wilson losing such an easy income. I feel quite bad for recommending it."',
        questions: [
          { q: 'Why do you only work mornings?', a: '"I\'m a photographer. I develop pictures in the cellar afternoons. It\'s a hobby."', logsAs: 'Spaulding: Claims to spend afternoons developing photographs in the cellar.' },
          { q: 'How did you hear about the Red-Headed League?', a: '"Read about it in the paper. Seemed perfect for Mr. Wilson."', logsAs: 'Spaulding: Says he found the League ad in the newspaper.' },
          { q: 'May I see your cellar?', a: '"The cellar? I\'d... rather you didn\'t. It\'s quite a mess with chemicals."', logsAs: 'Spaulding: Refuses access to the cellar, citing chemicals.' },
        ]
      },
      clay: {
        opening: '"I\'ve never heard of any Red-Headed League. You\'re wasting my time."',
        questions: [
          { q: 'Do you know a Vincent Spaulding?', a: '"Can\'t say the name means anything to me."', logsAs: 'Clay: Denies knowing Vincent Spaulding.' },
          { q: 'Where were you this past month on weekday afternoons?', a: '"Traveling. On business. I keep no schedule."', logsAs: 'Clay: Claims to have been traveling; no alibi for afternoons.' },
        ]
      },
      mercer: {
        opening: '"The League was a perfectly legitimate organisation. I can\'t imagine why it closed."',
        questions: [
          { q: 'Who founded the Red-Headed League?', a: 'He hesitates. "A benefactor who wishes to remain anonymous."', logsAs: 'Mercer: Unable to name the League\'s founder.' },
          { q: 'Did you know John Clay or Vincent Spaulding?', a: '"I knew a man called Ross. Reddish hair, well-spoken. Never gave a surname."', logsAs: 'Mercer: Describes a "Ross" — possibly Spaulding under an alias.' },
        ]
      },
      wilson: {
        opening: '"I simply don\'t understand any of it. I did good work — copied out \'Abbots\' all the way to \'Armour\'!"',
        questions: [
          { q: 'What did Spaulding do in the afternoons?', a: '"Photography, he said. Odd fellow, but reliable in the mornings."', logsAs: 'Wilson: Confirms Spaulding spent afternoons in the cellar on "photography."' },
          { q: 'Did you notice anything strange in the cellar?', a: '"Come to think of it — the floor looked disturbed last week. I assumed he\'d reorganised."', logsAs: 'Wilson: Noticed disturbed cellar floor but dismissed it.' },
        ]
      },
    },
    contradictions: [
      { a: 'Spaulding: Says he found the League ad in the newspaper.', b: 'League Advertisement — same handwriting as letter signed by Spaulding.', correct: true, feedback: 'Exactly right. Spaulding wrote the ad himself, then pretended to discover it.' },
      { a: 'Spaulding: Claims to spend afternoons developing photographs in the cellar.', b: 'Spaulding: Refuses access to the cellar, citing chemicals.', correct: true, feedback: 'A photographer who won\'t show his darkroom? The cellar hides the tunnel, not chemistry.' },
      { a: 'Clay: Denies knowing Vincent Spaulding.', b: 'Mercer: Describes a "Ross" — possibly Spaulding under an alias.', correct: false, feedback: 'That\'s suggestive but not a direct contradiction — Clay denies knowing "Spaulding," not "Ross."' },
    ],
    culprit: 'spaulding',
    keyEvidence: ['cellar', 'knees', 'ad'],
    debrief: 'Vincent Spaulding was John Clay in disguise. He invented the Red-Headed League solely to remove Wilson from the shop each morning, giving Clay free afternoon hours to dig a tunnel to the City and Suburban Bank. The Bank\'s gold reserves were to be looted in one night. Holmes foiled the plan at the tunnel entrance.',
  },

  {
    id: 'purloined-letter',
    title: 'The Purloined Letter',
    theme: 'classic',
    difficulty: 2,
    source: 'Edgar Allan Poe, "The Purloined Letter" (1844)',
    summary: 'A compromising letter stolen from a royal personage is hidden by a scheming Minister. The police have searched his rooms three times — and found nothing.',
    briefing: {
      kids: `A very important letter has been stolen from a princess. A clever but sneaky man named Minister D— stole it and is using it to have power over her. The police searched his home many times but couldn't find it. You must figure out where he hid it and why the police missed it.\n\nSuspects:\n- Minister D—: A clever, daring man who stole the letter openly.\n- Monsieur G—: The chief of police who keeps searching.\n- Madame R—: The Minister's housekeeper who acts strangely.`,
      general: `A powerful and compromising letter was stolen from a royal person in plain sight — the Minister D— simply swapped it for another letter while the victim could not protest without exposure. The Minister now uses it as leverage. Prefect Monsieur G— has searched D—'s apartments exhaustively: every book, every cushion, every table leg. Nothing. You must find where the letter is hidden and how D— managed to outwit a thorough police search.`,
      advanced: `The letter was abstracted by Minister D— with the brazen simplicity of a conjuror. G—\'s methodical search missed it precisely because his analytical framework assumed concealment; D—\'s genius lay in inversion — placing the letter in plain view, altered just enough to escape recognition. The deeper question is not merely where the letter is, but why every rigorous analytical method failed to locate it, and what that reveals about the nature of hiding things.`
    },
    suspects: [
      { id: 'minister', name: 'Minister D—',   emoji: '🎩', role: 'Royal Minister / Thief',      intro: 'A poet and mathematician. Bold, daring, and contemptuous of routine police logic.' },
      { id: 'prefect',  name: 'Monsieur G—',   emoji: '🚔', role: 'Prefect of Police',           intro: 'Thorough but unimaginative. Has searched the rooms three times.' },
      { id: 'madame',   name: 'Madame R—',     emoji: '🧹', role: 'Minister\'s Housekeeper',    intro: 'Loyal, tight-lipped, and was seen disposing of letters recently.' },
      { id: 'dupin',    name: 'C. Auguste Dupin', emoji: '🔍', role: 'Private Analyst', intro: 'A brilliant recluse called in to consult. Seems to already know the answer.' },
    ],
    evidence: [
      { id: 'rack',    name: 'Card Rack',           emoji: '📬', desc: 'A cheap card rack on the mantelpiece holds several old letters and cards — one appears crumpled and re-sealed.' },
      { id: 'methods', name: 'Police Search Notes', emoji: '📝', desc: 'G— logged every search technique: probed furniture joints, tested book spines, used a microscope on surfaces. Exhaustive.' },
      { id: 'window',  name: 'Street Incident Log', emoji: '🪟', desc: 'On the morning Dupin visited, a man created a disturbance in the street below. D— went to the window to look — Dupin had a moment alone.' },
      { id: 'wax',     name: 'Broken Wax Seal',     emoji: '🔴', desc: 'The crumpled letter in the rack has a broken seal re-pressed in a different colour, and the handwriting on the outside is a poor imitation.' },
      { id: 'glasses', name: 'D—\'s Green Glasses',  emoji: '🕶',  desc: 'D— wears large green spectacles indoors. Dupin also wore them during his visit — perhaps to inspect something carefully without being noticed.' },
    ],
    interviews: {
      minister: {
        opening: '"What a delightful surprise, Monsieur. Do come in. I am, as always, at leisure."',
        questions: [
          { q: 'Tell me about the letter the Prefect is looking for.', a: '"Letters? I receive dozens. I keep what\'s useful and dispose of the rest."', logsAs: 'D—: Dismissive about letters; admits to keeping "useful" ones.' },
          { q: 'What do you keep in that card rack?', a: '"Old correspondence, circulars, trifles. Nothing of consequence."', logsAs: 'D—: Describes the card rack contents as trifles of no consequence.' },
          { q: 'Why wear spectacles indoors?', a: '"My eyes are weak. The light is harsh."', logsAs: 'D—: Attributes indoor spectacles to eye sensitivity.' },
        ]
      },
      prefect: {
        opening: '"We\'ve been utterly thorough. If that letter were there, we\'d have found it."',
        questions: [
          { q: 'Describe your search method.', a: '"Systematic. Every piece of furniture dismantled, every book shaken, every rug lifted."', logsAs: 'G—: Describes a purely systematic physical search methodology.' },
          { q: 'Could the letter be in plain sight?', a: '"Impossible. No professional thief hides a letter in plain sight."', logsAs: 'G—: Categorically dismisses the possibility of plain-sight concealment.' },
          { q: 'Did you examine the card rack?', a: '"Of course. Three old letters, some circulars. Nothing remotely resembling the stolen letter\'s description."', logsAs: 'G—: Examined card rack; dismissed contents as unrelated.' },
        ]
      },
      madame: {
        opening: '"The Minister is a good employer. I don\'t concern myself with his papers."',
        questions: [
          { q: 'Did you notice a new letter appear in the card rack?', a: '"There\'s always letters. I don\'t read them."', logsAs: 'Madame R—: Claims not to read or notice letters in the rack.' },
          { q: 'What happened when the disturbance occurred in the street?', a: '"The Minister went to the window. The visitor — Monsieur Dupin — stayed inside. I was in the kitchen."', logsAs: 'Madame R—: Confirms Dupin was left alone briefly when D— went to the window.' },
        ]
      },
      dupin: {
        opening: '"I should think the solution quite obvious, if one looks without prejudice."',
        questions: [
          { q: 'Where is the letter?', a: '"In that card rack — re-addressed and re-sealed. D— hid it by not hiding it."', logsAs: 'Dupin: Asserts the letter is in the card rack, disguised.' },
          { q: 'Why couldn\'t the police find it?', a: '"Because they searched for concealment. D— used revelation — the most hidden place is in plain sight."', logsAs: 'Dupin: Explains the failure of systematic search against plain-sight concealment.' },
        ]
      },
    },
    contradictions: [
      { a: 'G—: Categorically dismisses the possibility of plain-sight concealment.', b: 'Dupin: Asserts the letter is in the card rack, disguised.', correct: true, feedback: 'The contradiction is the solution: G—\'s certainty about "professional" hiding is exactly what D— exploited.' },
      { a: 'G—: Examined card rack; dismissed contents as unrelated.', b: 'D—: Describes the card rack contents as trifles of no consequence.', correct: true, feedback: 'Both dismiss the rack — but the evidence points directly to it. Their dismissal is the misdirection.' },
      { a: 'D—: Attributes indoor spectacles to eye sensitivity.', b: 'Madame R—: Confirms Dupin was left alone briefly when D— went to the window.', correct: false, feedback: 'The spectacles and the window incident are both interesting, but they don\'t contradict each other.' },
    ],
    culprit: 'minister',
    keyEvidence: ['rack', 'wax', 'methods'],
    debrief: 'Minister D— hid the letter in plain sight — crumpled, re-addressed and re-sealed in the card rack on his own mantelpiece. G—\'s systematic search failed because it was designed to find hidden things; D— merely disguised the letter as another letter. Dupin retrieved it during a contrived distraction and left a substitute. The original story is Poe\'s meditation on how analytic brilliance can be defeated by its own rigour.',
  },
];
