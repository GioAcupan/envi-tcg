// Assumptions where docs/UPDATE-3.pdf is silent or contradicts itself, shown in-app for the rule authors to check.
export interface Interpretation { id: string; topic: string; text: string; major: boolean }

export const interpretations: Interpretation[] = [
  {
    "id": "R1",
    "topic": "Deck size",
    "text": "UPDATE-3 gives copy counts in the tables (\"x2\", \"x3\"); a card with no count has 1 copy. That makes 8 plants, 6 algae, 12 detritivores, 8 microbes (Carbon ×3, Nitrifying ×3, Phosphorus ×2) and 5 wild events (one of each), so 39 cards per deck.",
    "major": true
  },
  {
    "id": "R2",
    "topic": "Microbe lifecycle",
    "text": "Played on a dead card (1 AP), a microbe pays 1 O2 at every Environmental Phase it sits there (\"O Cost per round\") and decomposes that card every round, with or without a detritivore. It returns to its owner's hand when the card is fully decomposed. If its owner cannot pay the O2 it goes to the discard.",
    "major": true
  },
  {
    "id": "R3",
    "topic": "Microbe consumption",
    "text": "\"Biomass consumed from gross released nutrients\" (1 C, 0.5 N) and \"reduces net nutrient gain directly from the dead card\": each round a microbe decomposes, it removes up to 1 C and 0.5 N from its dead card's remaining biomass; nobody gains them. (UPDATE-2 was built taking them from the owner's gains instead; with microbes now decomposing alone, that reading would make Carbon Bacteria alone gain nothing.)",
    "major": true
  },
  {
    "id": "R4",
    "topic": "Microbes alone vs with detritivores",
    "text": "In a round no detritivore releases from the card, a microbe releases its own amount from the card's biomass (Carbon 1 C, Nitrifying 1 N). In a round a detritivore does, it uses its doubling ability instead (Carbon doubles the detritivores' C; Nitrifying releases all remaining N, doubled). Phosphorus Bacteria gives +1 P every round either way: it is the one source of P besides wild events, so its P does not come from the card.",
    "major": true
  },
  {
    "id": "R5",
    "topic": "When effects happen",
    "text": "\"Abilities, effects ... take effect after the round is finished\" is read as the Environmental Phase that already ends each round (production, upkeep, decomposition, aging). Wild events still resolve the moment they are drawn, since Non-native Species kills \"instantly\" and Drought blocks plays during the round.",
    "major": true
  },
  {
    "id": "R6",
    "topic": "Wild events happen once",
    "text": "Every wild event affects only the player who drew it, including Strong Rainfall's +1 P (its table row still says \"all players\"). Drought and Heat Wave last 2 rounds (the one drawn in and the next); the others 1. \"Only happen once and is put to the discarded deck\": the card stays out while its effect lasts, so the same event never stacks, then goes to its owner's discard. Like any discarded card it comes back when the deck runs out and the discard is reshuffled.",
    "major": true
  },
  {
    "id": "R7",
    "topic": "Introduced Non-native Species",
    "text": "\"Two random played cards (except microbes)\" are two of the drawer's living organisms (fewer if they have fewer). The drawer then loses 5 C and 2 N, or 10 C and 4 N if they had no living organism; pools never go below 0.",
    "major": true
  },
  {
    "id": "R8",
    "topic": "Where dead cards go",
    "text": "The summary says dead cards (except microbes) now go to the discard, while C.2 still says a fully decomposed card is reshuffled into the deck. Followed the summary, and only once a card is fully decomposed: a dead card stays on the field as decaying matter until then, otherwise nothing could break it down. Microbes on it return to their owners' hands.",
    "major": true
  },
  {
    "id": "R9",
    "topic": "Which plants are aquatic",
    "text": "Drought stops aquatic plants photosynthesizing and blocks aquatic plays, but the renamed plants do not say which are aquatic. Duck Lettuce and Hydrilla (submerged) and Water Hyacinth and Pond Fern (floating) are aquatic; Indian Lotus, rooted with leaves above the water, is the emergent plant that keeps working through Drought. Algae and detritivores stay aquatic.",
    "major": true
  },
  {
    "id": "I1",
    "topic": "Turn order",
    "text": "\"Rounds are now P1 -> P2 -> P1 -> P2\": Player 1 acts first every round (the first player no longer alternates).",
    "major": false
  },
  {
    "id": "I2",
    "topic": "Mayfly Nymph",
    "text": "\"When consuming dead producers\": the Mayfly Nymph works dead plants and dead algae (not living algae), releases 1 C (unstated) and removes 1 P from its owner's pool.",
    "major": false
  },
  {
    "id": "I3",
    "topic": "Algae P cost",
    "text": "Green Algae and Cyanobacteria cost 1 P to play; Diatoms cost none.",
    "major": false
  },
  {
    "id": "I4",
    "topic": "Renamed cards",
    "text": "The renamed cards keep their old rules: Common Caridina and Red Worm are the shredders, Sludge Worm, Harlequin Fly and Net-spinning Caddisfly the collectors, Susong Pilipit the snail grazer and Mayfly Nymph the P-removing grazer. All plants now store 8 C and 2 N.",
    "major": false
  },
  {
    "id": "I5",
    "topic": "Decomposition end",
    "text": "A worked card is fully decomposed when its stored C reaches 0; leftover N is lost with it. Its detritivores stay on the field, free to work another card.",
    "major": false
  },
  {
    "id": "I6",
    "topic": "Detritivore lifespan",
    "text": "A detritivore's lifespan does not count down in a round it released nutrients, which extends it by the rounds it spent decomposing (C.2).",
    "major": false
  },
  {
    "id": "I7",
    "topic": "Drawing events",
    "text": "Opening-hand events are shuffled back and replaced; a drawn event resolves for no AP, a replacement is drawn, and the game shows who drew which event.",
    "major": false
  },
  {
    "id": "I8",
    "topic": "Assigning detritivores",
    "text": "Playing a detritivore with a target costs play AP + assign AP (the PDF's \"separately cost another action point\"); later rounds of work are free. Several detritivores may work one card; a detritivore works one card at a time; reassigning costs AP again. Collectors may also work dead detritivores, otherwise nothing could recycle them.",
    "major": false
  },
  {
    "id": "I9",
    "topic": "Collectors",
    "text": "All three collectors release 1 C from a dead plant, algae or animal, plus 1 C and 1 N when a shredder works the same card.",
    "major": false
  },
  {
    "id": "I10",
    "topic": "Algal Bloom and events",
    "text": "At each Environmental Phase (and immediately on the drawer's Strong Rainfall), a player with P > 2 and at least one living algae has each living algae's biomass doubled; a living Susong Pilipit prevents it. Flash Flood kills a random living organism of the drawer and gives +1 C, or +1 P with none. Heat Wave's +1 O2 applies to producers and detritivores, not microbes. Drought stops aquatic plants (not algae) photosynthesizing.",
    "major": false
  },
  {
    "id": "I11",
    "topic": "Deck recycling and turn defaults",
    "text": "Empty deck: reshuffle the discard pile (PDF A); no hand limit; unspent AP is lost; 1 draw per player per round.",
    "major": false
  }
];
