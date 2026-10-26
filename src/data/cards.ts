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
      "N": 1,
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
      "N": 1,
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
      "N": 1,
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
      "N": 1,
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
    "id": "small-fish",
    "name": "Small Fish",
    "kind": "consumer",
    "subtype": "secondary",
    "cost": {
      "C": 3,
      "N": 1
    },
    "lifespan": 4,
    "biomass": {
      "C": 3,
      "N": 1,
      "P": 0,
      "O2": 0
    },
    "o2PerRound": 1,
    "tags": [
      "consumer",
      "animal",
      "aquatic"
    ],
    "canEat": [
      "detritivore"
    ],
    "text": "Eats a living detritivore and takes its biomass.",
    "copies": 1,
    "art": "art/small-fish.svg"
  },
  {
    "id": "frog",
    "name": "Frog",
    "kind": "consumer",
    "subtype": "secondary",
    "cost": {
      "C": 3,
      "N": 2
    },
    "lifespan": 4,
    "biomass": {
      "C": 3,
      "N": 2,
      "P": 0,
      "O2": 0
    },
    "o2PerRound": 1,
    "tags": [
      "consumer",
      "animal"
    ],
    "canEat": [
      "detritivore"
    ],
    "text": "Eats a living detritivore and takes its biomass.",
    "copies": 1,
    "art": "art/frog.svg"
  },
  {
    "id": "predatory-insect",
    "name": "Predatory Insect",
    "kind": "consumer",
    "subtype": "secondary",
    "cost": {
      "C": 2,
      "N": 2
    },
    "lifespan": 3,
    "biomass": {
      "C": 2,
      "N": 2,
      "P": 0,
      "O2": 0
    },
    "o2PerRound": 1,
    "tags": [
      "consumer",
      "animal"
    ],
    "canEat": [
      "detritivore"
    ],
    "text": "Eats a living detritivore and takes its biomass.",
    "copies": 1,
    "art": "art/predatory-insect.svg"
  },
  {
    "id": "carbon-bacteria",
    "name": "Carbon Bacteria",
    "kind": "microbe",
    "subtype": "bacteria",
    "cost": {
      "C": 0,
      "N": 0,
      "O2": 1
    },
    "tags": [
      "microbe"
    ],
    "text": "Doubles C released this phase without taking extra biomass. Returns to hand after assisting a worker.",
    "copies": 2,
    "art": "art/carbon-bacteria.svg"
  },
  {
    "id": "nitrifying-bacteria",
    "name": "Nitrifying Bacteria",
    "kind": "microbe",
    "subtype": "bacteria",
    "cost": {
      "C": 0,
      "N": 0,
      "O2": 1
    },
    "tags": [
      "microbe"
    ],
    "text": "Releases all remaining N from the dead card. Returns to hand after assisting a worker.",
    "copies": 2,
    "art": "art/nitrifying-bacteria.svg"
  },
  {
    "id": "phosphorus-bacteria",
    "name": "Phosphorus Bacteria",
    "kind": "microbe",
    "subtype": "bacteria",
    "cost": {
      "C": 0,
      "N": 0,
      "O2": 1
    },
    "tags": [
      "microbe"
    ],
    "text": "Gives +1 P. Returns to hand after assisting a worker.",
    "copies": 2,
    "art": "art/phosphorus-bacteria.svg"
  },
  {
    "id": "nutrient-rich-adaptation",
    "name": "Nutrient-Rich Adaptation",
    "kind": "adaptation",
    "cost": {
      "C": 2,
      "N": 1
    },
    "tags": [],
    "text": "Adds 1 C and 1 N to a producer biomass when attached.",
    "copies": 2,
    "art": "art/nutrient-rich-adaptation.svg"
  },
  {
    "id": "oxygen-rich-adaptation",
    "name": "Oxygen-Rich Adaptation",
    "kind": "adaptation",
    "cost": {
      "C": 2,
      "N": 1
    },
    "tags": [],
    "text": "Producer yields 2 extra O2 each round.",
    "copies": 2,
    "art": "art/oxygen-rich-adaptation.svg"
  },
  {
    "id": "p-accumulator-adaptation",
    "name": "Phosphorus-Accumulator Adaptation",
    "kind": "adaptation",
    "cost": {
      "C": 2,
      "N": 1
    },
    "tags": [],
    "text": "Producer grows 1 extra P biomass each round.",
    "copies": 2,
    "art": "art/p-accumulator-adaptation.svg"
  },
  {
    "id": "consumer-specialization",
    "name": "Consumer Specialization",
    "kind": "adaptation",
    "cost": {
      "C": 2,
      "N": 1
    },
    "tags": [],
    "text": "Consumer with 2 marks gains 2 lifespan, can eat twice per round and gains 1 C per eat.",
    "copies": 2,
    "art": "art/consumer-specialization.svg"
  },
  {
    "id": "protected-adaptation",
    "name": "Protected Adaptation",
    "kind": "adaptation",
    "cost": {
      "C": 2,
      "N": 1
    },
    "tags": [],
    "text": "An organism cannot be eaten. It still ages and pays upkeep.",
    "copies": 2,
    "art": "art/protected-adaptation.svg"
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
    "text": "Each player gains 1 P, then checks for Algal Bloom.",
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
    "text": "This round: producers yield 1 less O2; no aquatic plays; aquatic plants cannot photosynthesize.",
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
    "text": "This round all organisms pay 1 extra O2 upkeep, including producers.",
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
    "text": "Each player loses a random living organism and gains 1 C; with none, gains 1 P.",
    "copies": 1,
    "art": "art/flood.svg"
  }
];
