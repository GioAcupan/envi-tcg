// Assumptions from architecture/update-1-spec.md section 9, shown in-app for the rule authors to check.
export interface Interpretation { id: string; topic: string; text: string; major: boolean }

export const interpretations: Interpretation[] = [
  {
    "id": "R1",
    "topic": "Day/Night is gone",
    "text": "UPDATE-1 deletes the Day/Night section; every round's Environmental Phase runs production. (\"Per day round\" in the producer section is read as \"per round\".)",
    "major": true
  },
  {
    "id": "R2",
    "topic": "Consumers and Evolution keep first-draft stats",
    "text": "UPDATE-1 lists 3 secondary consumers and 10 evolution cards but no tables. Used: Small Fish, Frog, Predatory Insect at draft costs/upkeep/lifespan, biomass = cost, all eat any living detritivore; the five draft adaptations × 2 copies. Consumer Specialization marks come from any eat (not from special producers, which consumers no longer eat).",
    "major": true
  },
  {
    "id": "R3",
    "topic": "Microbe lifecycle",
    "text": "Played on a dead card (1 AP + 1 O2), it cannot be moved or taken back; at the next Environmental Phase in which a detritivore works that card it applies its ability once, then returns to its owner's hand.",
    "major": true
  },
  {
    "id": "R4",
    "topic": "Decomposition end and dead animals",
    "text": "A worked card is fully decomposed when its stored C reaches 0; leftover N/P is lost with it and it goes to its owner's discard with everything under it. Collectors may also work dead animals (detritivores, consumers), otherwise nothing could recycle them.",
    "major": true
  },
  {
    "id": "R5",
    "topic": "Algal Bloom effect",
    "text": "At each Environmental Phase (and immediately on Strong Rainfall), a player with P > 2 and at least one living algae has each living algae's biomass doubled (C, N, P); a living Freshwater Snail prevents it. No other bloom penalty.",
    "major": true
  },
  {
    "id": "I1",
    "topic": "Wild event deck copies",
    "text": "Each deck holds one of each of the 4 wild events (\"split to 2 decks\" read as one set per player's deck; 36 total confirms 4 per deck).",
    "major": false
  },
  {
    "id": "I2",
    "topic": "Opening and drawn events",
    "text": "Opening-hand wild events are shuffled back and replaced; a drawn event resolves for no AP and a replacement is drawn.",
    "major": false
  },
  {
    "id": "I3",
    "topic": "Event timing",
    "text": "Wild events affect the round in which they are drawn; round-start draws happen after the round number advances.",
    "major": false
  },
  {
    "id": "I4",
    "topic": "Flood outcomes",
    "text": "Flood: for each player, a random living organism of theirs dies and they gain +1 C; with none, +1 P.",
    "major": false
  },
  {
    "id": "I5",
    "topic": "Heat Wave upkeep",
    "text": "Heat Wave's +1 O2 applies to producers too (\"all organisms\").",
    "major": false
  },
  {
    "id": "I6",
    "topic": "Assigning on play",
    "text": "Playing a detritivore with a target costs play AP + assign AP (the PDF's \"separately cost another action point\"); later rounds of work are free.",
    "major": false
  },
  {
    "id": "I7",
    "topic": "Multiple workers",
    "text": "Multiple detritivores may work one card; a detritivore works one card at a time; reassigning costs AP again.",
    "major": false
  },
  {
    "id": "I8",
    "topic": "Collectors paired with shredders",
    "text": "Collector + Shredder pairing: a collector on a card a shredder also works releases an extra 1 C and 1 N.",
    "major": false
  },
  {
    "id": "I9",
    "topic": "Carbon Bacteria bonus",
    "text": "Carbon Bacteria doubles C released that phase; the extra does not come from the card's biomass.",
    "major": false
  },
  {
    "id": "I10",
    "topic": "Aquatic Grazer release",
    "text": "Aquatic Grazer releases 1 C (unstated) and removes 1 P from its owner's pool when it works algae.",
    "major": false
  },
  {
    "id": "I11",
    "topic": "Detritivore lifespan",
    "text": "Detritivore lifespan does not count down in a round it released nutrients.",
    "major": false
  },
  {
    "id": "I12",
    "topic": "Producer adaptations",
    "text": "Nutrient-Rich adds +1 C +1 N to the producer's biomass when attached; Oxygen-Rich +2 O2 yield; P-Accumulator +1 P growth.",
    "major": false
  },
  {
    "id": "I13",
    "topic": "Aquatic tags and Drought",
    "text": "Aquatic tags per Appendix B; Drought blocks playing aquatic cards and stops aquatic plants (not algae) photosynthesizing.",
    "major": false
  },
  {
    "id": "I14",
    "topic": "Deck recycling and turn defaults",
    "text": "Empty deck: reshuffle the discard pile (PDF A); no hand limit; unspent AP is lost; first player alternates; 1 draw per round.",
    "major": false
  }
];
