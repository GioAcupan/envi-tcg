// Assumptions where docs/UPDATE-2.pdf is silent or contradicts itself, shown in-app for the rule authors to check.
export interface Interpretation { id: string; topic: string; text: string; major: boolean }

export const interpretations: Interpretation[] = [
  {
    "id": "R1",
    "topic": "Deck size and stale counts",
    "text": "UPDATE-2 removes consumers and Evolution cards but its archetype and deck sections still list the old counts (16 organisms, 6 detritivores, 6 microbes, 10 Evolution, 36 cards). Used the tables instead: 7 producers, 7 detritivores (with Caddisfly Larva), 8 microbes (Carbon ×3, Nitrifying ×3, Phosphorus ×2) and 4 wild events, so 26 cards per deck.",
    "major": true
  },
  {
    "id": "R2",
    "topic": "Microbe lifecycle",
    "text": "Played on a dead card (1 AP), a microbe pays 1 O2 at every Environmental Phase it sits there (\"O Cost per round\"). It assists in every round a detritivore releases from that card and returns to its owner's hand when the card is fully decomposed. If its owner cannot pay the O2 it goes to the discard.",
    "major": true
  },
  {
    "id": "R3",
    "topic": "Microbe consumption",
    "text": "\"Biomass consumed from gross released nutrients\" (1 C, 0.5 N): each round a microbe assists, it takes up to 1 C and 0.5 N back from what its owner received from that dead card this round (after its bonus), never from nutrients collected earlier.",
    "major": true
  },
  {
    "id": "R4",
    "topic": "Decomposition end",
    "text": "A worked card is fully decomposed when its stored C reaches 0; leftover N/P is lost with it. It is then shuffled back into its owner's deck (UPDATE-2) and plays again with fresh printed biomass. Its detritivores stay on the field, free to work another card.",
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
    "topic": "Caddisfly Larva ability",
    "text": "The new Caddisfly Larva's ability is blank in UPDATE-2; it plays as the other collectors: releases 1 C from a dead plant, algae or animal, plus 1 C and 1 N when a shredder works the same card.",
    "major": false
  },
  {
    "id": "I2",
    "topic": "Nitrifying Bacteria",
    "text": "\"Doubles and releases all nitrogen\": the owner gains twice the dead card's remaining N, and the card's N becomes 0.",
    "major": false
  },
  {
    "id": "I3",
    "topic": "Phosphorus Bacteria",
    "text": "\"Processed detritus\" is read as a dead card a detritivore released from this round: +1 P to the owner each such round.",
    "major": false
  },
  {
    "id": "I4",
    "topic": "Carbon Bacteria bonus",
    "text": "Carbon Bacteria doubles the C detritivores released from its card that round, for each worker's owner; the extra does not come from the card's biomass.",
    "major": false
  },
  {
    "id": "I5",
    "topic": "Plant nitrogen",
    "text": "Plants store 2 N per the UPDATE-2 table; the worked example's \"7 C, 1 N\" is read as left over from the previous revision.",
    "major": false
  },
  {
    "id": "I6",
    "topic": "Wild events",
    "text": "Each deck holds one of each of the 4 wild events. Opening-hand events are shuffled back and replaced; a drawn event resolves for no AP, a replacement is drawn, and at the end of that round the event is shuffled back into its owner's deck.",
    "major": false
  },
  {
    "id": "I7",
    "topic": "Event timing and targets",
    "text": "Wild events affect the round in which they are drawn; round-start draws happen after the round number advances. Flood: for each player, a random living organism of theirs dies and they gain +1 C; with none, +1 P. Heat Wave's +1 O2 applies to producers and detritivores, not microbes.",
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
    "topic": "Detritivore abilities",
    "text": "A collector on a card a shredder also works releases an extra 1 C and 1 N. Aquatic Grazer releases 1 C (unstated) and removes 1 P from its owner's pool when it works algae. Detritivore lifespan does not count down in a round it released nutrients.",
    "major": false
  },
  {
    "id": "I10",
    "topic": "Aquatic tags and Drought",
    "text": "Algae, aquatic and free-floating plants and all detritivores are aquatic; Drought blocks playing aquatic cards and stops aquatic plants (not algae) photosynthesizing.",
    "major": false
  },
  {
    "id": "I11",
    "topic": "Deck recycling and turn defaults",
    "text": "Empty deck: reshuffle the discard pile (PDF A); no hand limit; unspent AP is lost; first player alternates; 1 draw per round.",
    "major": false
  }
];
