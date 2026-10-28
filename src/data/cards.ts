import type { CardDef } from '../engine/types';

export const cards: CardDef[] = [
  {
    "id": "emergent-plant",
    "name": "Emergent Plant",
    "kind": "producer",
    "subtype": "plant",
    "cost": {
      "C": 2,
      "N": 0.5
    },
    "lifespan": 3,
    "biomass": {
      "C": 6,
      "N": 2,
      "P": 0,
      "O2": 0
    },
    "growth": {
      "C": 1
    },
    "yield": {
      "O2": 2,
      "C": 1
    },
    "tags": [
      "plant"
    ],
    "text": "Grows 1 C biomass and produces 2 O2 and 1 C each round.",
    "copies": 1,
    "art": "art/emergent-plant.svg"
  },
  {
    "id": "river-grass",
    "name": "River Grass",
    "kind": "producer",
    "subtype": "plant",
    "cost": {
      "C": 2,
      "N": 0.5
    },
    "lifespan": 4,
    "biomass": {
      "C": 6,
      "N": 2,
      "P": 0,
      "O2": 0
    },
    "growth": {
      "C": 1
    },
    "yield": {
      "O2": 2,
      "C": 1
    },
    "tags": [
      "plant"
    ],
    "text": "Grows 1 C biomass and produces 2 O2 and 1 C each round.",
    "copies": 1,
    "art": "art/river-grass.svg"
  },
  {
    "id": "aquatic-plant",
    "name": "Aquatic Plant",
    "kind": "producer",
    "subtype": "plant",
    "cost": {
      "C": 2,
      "N": 0.5
    },
    "lifespan": 4,
    "biomass": {
      "C": 6,
      "N": 2,
      "P": 0,
      "O2": 0
    },
    "growth": {
      "C": 1
    },
    "yield": {
      "O2": 2,
      "C": 1
    },
    "tags": [
      "plant",
      "aquatic"
    ],
    "text": "Grows 1 C biomass and produces 2 O2 and 1 C each round. Cannot photosynthesize during Drought.",
    "copies": 1,
    "art": "art/aquatic-plant.svg"
  },
  {
    "id": "free-floating-plant",
    "name": "Free-floating Plant",
    "kind": "producer",
    "subtype": "plant",
    "cost": {
      "C": 2,
      "N": 0.5
    },
    "lifespan": 3,
    "biomass": {
      "C": 6,
      "N": 2,
      "P": 0,
      "O2": 0
    },
    "growth": {
      "C": 1
    },
    "yield": {
      "O2": 2,
      "C": 1
    },
    "tags": [
      "plant",
      "aquatic"
    ],
    "text": "Grows 1 C biomass and produces 2 O2 and 1 C each round. Cannot photosynthesize during Drought.",
    "copies": 1,
    "art": "art/free-floating-plant.svg"
  },
  {
    "id": "green-algae",
    "name": "Green Algae",
    "kind": "producer",
    "subtype": "algae",
    "cost": {
      "C": 1,
      "N": 0.5
    },
    "lifespan": 2,
    "biomass": {
      "C": 2,
      "N": 0,
      "P": 0,
      "O2": 0
    },
    "growth": {
      "C": 1,
      "N": 1
    },
    "yield": {
      "O2": 3,
      "C": 1
    },
    "tags": [
      "algae",
      "aquatic"
    ],
    "text": "Grows 1 C and 1 N biomass; produces 3 O2 and 1 C each round.",
    "copies": 1,
    "art": "art/green-algae.svg"
  },
  {
    "id": "diatoms",
    "name": "Diatoms",
    "kind": "producer",
    "subtype": "algae",
    "cost": {
      "C": 2,
      "N": 0.5
    },
    "lifespan": 1,
    "biomass": {
      "C": 2,
      "N": 0,
      "P": 0,
      "O2": 0
    },
    "growth": {
      "C": 1,
      "N": 1
    },
    "yield": {
      "O2": 4,
      "C": 1
    },
    "tags": [
      "algae",
      "aquatic"
    ],
    "text": "Grows 1 C and 1 N biomass; produces 4 O2 and 1 C each round.",
    "copies": 1,
    "art": "art/diatoms.svg"
  },
  {
    "id": "cyanobacteria",
    "name": "Cyanobacteria",
    "kind": "producer",
    "subtype": "algae",
    "cost": {
      "C": 1,
      "N": 0.5
    },
    "lifespan": 2,
    "biomass": {
      "C": 2,
      "N": 0,
      "P": 0,
      "O2": 0
    },
    "growth": {
      "C": 1,
      "N": 1
    },
    "yield": {
      "O2": 3,
      "C": 1,
      "N": 1
    },
    "tags": [
      "algae",
      "aquatic"
    ],
    "text": "Grows 1 C and 1 N biomass; produces 3 O2, 1 C and 1 N each round.",
    "copies": 1,
    "art": "art/cyanobacteria.svg"
  },
  {
    "id": "freshwater-shrimp",
    "name": "Freshwater Shrimp",
    "kind": "detritivore",
    "subtype": "shredder",
    "cost": {
      "C": 0,
      "N": 0.5
    },
    "lifespan": 4,
    "biomass": {
      "C": 3,
      "N": 1,
      "P": 0,
      "O2": 0
    },
    "o2PerRound": 1,
    "release": {
      "C": 3
    },
    "tags": [
      "detritivore",
      "animal",
      "aquatic"
    ],
    "canEat": [
      "plant"
    ],
    "text": "Releases 3 C from a dead plant each round it works.",
    "copies": 1,
    "art": "art/freshwater-shrimp.svg"
  },
  {
    "id": "aquatic-worm",
    "name": "Aquatic Worm",
    "kind": "detritivore",
    "subtype": "shredder",
    "cost": {
      "C": 0,
      "N": 0.5
    },
    "lifespan": 3,
    "biomass": {
      "C": 3,
      "N": 1,
      "P": 0,
      "O2": 0
    },
    "o2PerRound": 1,
    "release": {
      "C": 2
    },
    "tags": [
      "detritivore",
      "animal",
      "aquatic"
    ],
    "canEat": [
      "plant"
    ],
    "text": "Releases 2 C from a dead plant each round it works.",
    "copies": 1,
    "art": "art/aquatic-worm.svg"
  },
  {
    "id": "tubifex-worm",
    "name": "Tubifex Worm",
    "kind": "detritivore",
    "subtype": "collector",
    "cost": {
      "C": 0,
      "N": 0.5
    },
    "lifespan": 3,
    "biomass": {
      "C": 3,
      "N": 1,
      "P": 0,
      "O2": 0
    },
    "o2PerRound": 1,
    "release": {
      "C": 1
    },
    "tags": [
      "detritivore",
      "animal",
      "aquatic"
    ],
    "canEat": [
      "plant",
      "algae",
      "animal"
    ],
    "text": "Releases 1 C; with a shredder on the same card, releases 1 extra C and 1 N.",
    "copies": 1,
    "art": "art/tubifex-worm.svg"
  },
  {
    "id": "chironomid-larva",
    "name": "Chironomid Larva",
    "kind": "detritivore",
    "subtype": "collector",
    "cost": {
      "C": 0,
      "N": 0.5
    },
    "lifespan": 3,
    "biomass": {
      "C": 3,
      "N": 1,
      "P": 0,
      "O2": 0
    },
    "o2PerRound": 1,
    "release": {
      "C": 1
    },
    "tags": [
      "detritivore",
      "animal",
      "aquatic"
    ],
    "canEat": [
      "plant",
      "algae",
      "animal"
    ],
    "text": "Releases 1 C; with a shredder on the same card, releases 1 extra C and 1 N.",
    "copies": 1,
    "art": "art/chironomid-larva.svg"
  },
  {
    "id": "caddisfly-larva",
    "name": "Caddisfly Larva",
    "kind": "detritivore",
    "subtype": "collector",
    "cost": {
      "C": 0,
      "N": 0.5
    },
    "lifespan": 3,
    "biomass": {
      "C": 3,
      "N": 1,
      "P": 0,
      "O2": 0
    },
    "o2PerRound": 1,
    "release": {
      "C": 1
    },
    "tags": [
      "detritivore",
      "animal",
      "aquatic"
    ],
    "canEat": [
      "plant",
      "algae",
      "animal"
    ],
    "text": "Releases 1 C; with a shredder on the same card, releases 1 extra C and 1 N.",
    "copies": 1,
    "art": "art/caddisfly-larva.svg"
  },
  {
    "id": "freshwater-snail",
    "name": "Freshwater Snail",
    "kind": "detritivore",
    "subtype": "grazer",
    "cost": {
      "C": 0,
      "N": 0.5
    },
    "lifespan": 4,
    "biomass": {
      "C": 3,
      "N": 1,
      "P": 0,
      "O2": 0
    },
    "o2PerRound": 1,
    "release": {
      "C": 1
    },
    "tags": [
      "detritivore",
      "animal",
      "aquatic"
    ],
    "canEat": [
      "algae"
    ],
    "eatsAlive": true,
    "text": "Releases 1 C from living or dead algae. Prevents Algal Bloom.",
    "copies": 1,
    "art": "art/freshwater-snail.svg"
  },
  {
    "id": "aquatic-grazer",
    "name": "Aquatic Grazer",
    "kind": "detritivore",
    "subtype": "grazer",
    "cost": {
      "C": 0,
      "N": 0.5
    },
    "lifespan": 3,
    "biomass": {
      "C": 3,
      "N": 1,
      "P": 0,
      "O2": 0
    },
    "o2PerRound": 1,
    "release": {
      "C": 1
    },
    "tags": [
      "detritivore",
      "animal",
      "aquatic"
    ],
    "canEat": [
      "algae"
    ],
    "eatsAlive": true,
    "text": "Releases 1 C from living or dead algae and removes 1 P from its owner pool.",
    "copies": 1,
    "art": "art/aquatic-grazer.svg"
  },
  {
    "id": "carbon-bacteria",
    "name": "Carbon Bacteria",
    "kind": "microbe",
    "subtype": "bacteria",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [
      "microbe"
    ],
    "text": "Doubles the C detritivores release from its dead card, without taking extra biomass. Takes 1 C and 0.5 N of what its owner gets. Stays until the card is fully decomposed, then returns to hand.",
    "copies": 3,
    "art": "art/carbon-bacteria.svg",
    "o2PerRound": 1,
    "consumes": {
      "C": 1,
      "N": 0.5
    }
  },
  {
    "id": "nitrifying-bacteria",
    "name": "Nitrifying Bacteria",
    "kind": "microbe",
    "subtype": "bacteria",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [
      "microbe"
    ],
    "text": "Releases all remaining N from its dead card, doubled. Takes 1 C and 0.5 N of what its owner gets. Stays until the card is fully decomposed, then returns to hand.",
    "copies": 3,
    "art": "art/nitrifying-bacteria.svg",
    "o2PerRound": 1,
    "consumes": {
      "C": 1,
      "N": 0.5
    }
  },
  {
    "id": "phosphorus-bacteria",
    "name": "Phosphorus Bacteria",
    "kind": "microbe",
    "subtype": "bacteria",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [
      "microbe"
    ],
    "text": "Gives +1 P each round it assists. Takes 1 C and 0.5 N of what its owner gets. Stays until the card is fully decomposed, then returns to hand.",
    "copies": 2,
    "art": "art/phosphorus-bacteria.svg",
    "o2PerRound": 1,
    "consumes": {
      "C": 1,
      "N": 0.5
    }
  },
  {
    "id": "strong-rainfall",
    "name": "Strong Rainfall",
    "kind": "event",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [],
    "text": "Each player gains 1 P, then checks for Algal Bloom. Shuffled back into its owner's deck when the round ends.",
    "copies": 1,
    "art": "art/strong-rainfall.svg"
  },
  {
    "id": "drought",
    "name": "Drought",
    "kind": "event",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [],
    "text": "This round: producers yield 1 less O2; no aquatic plays; aquatic plants cannot photosynthesize. Shuffled back into its owner's deck when the round ends.",
    "copies": 1,
    "art": "art/drought.svg"
  },
  {
    "id": "heat-wave",
    "name": "Heat Wave",
    "kind": "event",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [],
    "text": "This round all organisms pay 1 extra O2 upkeep, including producers. Shuffled back into its owner's deck when the round ends.",
    "copies": 1,
    "art": "art/heat-wave.svg"
  },
  {
    "id": "flood",
    "name": "Flood",
    "kind": "event",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [],
    "text": "Each player loses a random living organism and gains 1 C; with none, gains 1 P. Shuffled back into its owner's deck when the round ends.",
    "copies": 1,
    "art": "art/flood.svg"
  }
];
