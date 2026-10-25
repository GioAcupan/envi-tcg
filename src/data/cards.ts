import type { CardDef } from '../engine/types';

export const cards: CardDef[] = [
  {
    "id": "leaf-litter-plant",
    "name": "Leaf Litter Plant",
    "kind": "producer",
    "subtype": "plant",
    "trophicLevel": 1,
    "cost": {
      "C": 1,
      "N": 1
    },
    "o2Produced": 2,
    "lifespan": 3,
    "tags": [
      "plant"
    ],
    "canEat": [
      "–"
    ],
    "text": "When it dies, creates 1 Fallen Leaf.",
    "copies": 1
  },
  {
    "id": "river-grass",
    "name": "River Grass",
    "kind": "producer",
    "subtype": "plant",
    "trophicLevel": 1,
    "cost": {
      "C": 2,
      "N": 1
    },
    "o2Produced": 2,
    "lifespan": 4,
    "tags": [
      "plant",
      "aquatic"
    ],
    "canEat": [
      "–"
    ],
    "text": "+1 C when successfully photosynthesizing.",
    "copies": 1
  },
  {
    "id": "aquatic-plant",
    "name": "Aquatic Plant",
    "kind": "producer",
    "subtype": "plant",
    "trophicLevel": 1,
    "cost": {
      "C": 2,
      "N": 1
    },
    "o2Produced": 3,
    "lifespan": 4,
    "tags": [
      "plant",
      "aquatic",
      "aquatic-plant"
    ],
    "canEat": [
      "–"
    ],
    "text": "Requires water; unaffected by Drought once.",
    "copies": 1
  },
  {
    "id": "riparian-tree",
    "name": "Riparian Tree",
    "kind": "producer",
    "subtype": "plant",
    "trophicLevel": 1,
    "cost": {
      "C": 3,
      "N": 2
    },
    "o2Produced": 3,
    "lifespan": 5,
    "tags": [
      "plant",
      "tree"
    ],
    "canEat": [
      "–"
    ],
    "text": "Cannot be consumed by Primary Consumers.",
    "copies": 1
  },
  {
    "id": "fast-growing-plant",
    "name": "Fast-Growing Plant",
    "kind": "producer",
    "subtype": "plant",
    "trophicLevel": 1,
    "cost": {
      "C": 1,
      "N": 1
    },
    "o2Produced": 1,
    "lifespan": 2,
    "tags": [
      "plant"
    ],
    "canEat": [
      "–"
    ],
    "text": "Gains +1 C when played.",
    "copies": 1
  },
  {
    "id": "green-algae",
    "name": "Green Algae",
    "kind": "producer",
    "subtype": "algae",
    "trophicLevel": 1,
    "cost": {
      "C": 1,
      "N": 1
    },
    "o2Produced": 2,
    "lifespan": 2,
    "tags": [
      "algae",
      "aquatic"
    ],
    "canEat": [
      "–"
    ],
    "text": "+1 C when photosynthesizing.",
    "copies": 1
  },
  {
    "id": "diatom",
    "name": "Diatom",
    "kind": "producer",
    "subtype": "algae",
    "trophicLevel": 1,
    "cost": {
      "C": 1,
      "N": 1
    },
    "o2Produced": 2,
    "lifespan": 3,
    "tags": [
      "algae",
      "aquatic"
    ],
    "canEat": [
      "–"
    ],
    "text": "When decomposed, returns +1 P.",
    "copies": 1
  },
  {
    "id": "bloom-algae",
    "name": "Bloom Algae",
    "kind": "producer",
    "subtype": "algae",
    "trophicLevel": 1,
    "cost": {
      "C": 2,
      "N": 1
    },
    "o2Produced": 3,
    "lifespan": 2,
    "tags": [
      "algae",
      "aquatic"
    ],
    "canEat": [
      "–"
    ],
    "text": "If P >= 3, triggers Algal Bloom.",
    "copies": 1
  },
  {
    "id": "caterpillar",
    "name": "Caterpillar",
    "kind": "consumer",
    "subtype": "primary",
    "trophicLevel": 2,
    "cost": {
      "C": 2,
      "N": 1
    },
    "o2PerRound": 1,
    "lifespan": 3,
    "tags": [
      "caterpillar",
      "insect"
    ],
    "canEat": [
      "plant"
    ],
    "text": "Can consume plant.",
    "copies": 1
  },
  {
    "id": "zooplankton",
    "name": "Zooplankton",
    "kind": "consumer",
    "subtype": "primary",
    "trophicLevel": 2,
    "cost": {
      "C": 1,
      "N": 1
    },
    "o2PerRound": 1,
    "lifespan": 3,
    "tags": [
      "zooplankton",
      "aquatic"
    ],
    "canEat": [
      "algae"
    ],
    "text": "Can consume algae.",
    "copies": 1
  },
  {
    "id": "snail",
    "name": "Snail",
    "kind": "consumer",
    "subtype": "primary",
    "trophicLevel": 2,
    "cost": {
      "C": 2,
      "N": 1
    },
    "o2PerRound": 1,
    "lifespan": 4,
    "tags": [
      "snail",
      "aquatic"
    ],
    "canEat": [
      "algae",
      "aquatic-plant"
    ],
    "text": "Can consume algae, aquatic-plant.",
    "copies": 1
  },
  {
    "id": "grasshopper",
    "name": "Grasshopper",
    "kind": "consumer",
    "subtype": "primary",
    "trophicLevel": 2,
    "cost": {
      "C": 2,
      "N": 1
    },
    "o2PerRound": 1,
    "lifespan": 3,
    "tags": [
      "grasshopper",
      "insect"
    ],
    "canEat": [
      "plant"
    ],
    "text": "Can consume plant.",
    "copies": 1
  },
  {
    "id": "small-fish",
    "name": "Small Fish",
    "kind": "consumer",
    "subtype": "secondary",
    "trophicLevel": 3,
    "cost": {
      "C": 3,
      "N": 1
    },
    "o2PerRound": 1,
    "lifespan": 4,
    "tags": [
      "fish",
      "small-fish",
      "aquatic"
    ],
    "canEat": [
      "zooplankton",
      "snail"
    ],
    "text": "Can consume zooplankton, snail.",
    "copies": 1
  },
  {
    "id": "frog",
    "name": "Frog",
    "kind": "consumer",
    "subtype": "secondary",
    "trophicLevel": 3,
    "cost": {
      "C": 3,
      "N": 2
    },
    "o2PerRound": 1,
    "lifespan": 4,
    "tags": [
      "frog"
    ],
    "canEat": [
      "caterpillar",
      "grasshopper"
    ],
    "text": "Can consume caterpillar, grasshopper.",
    "copies": 1
  },
  {
    "id": "predatory-insect",
    "name": "Predatory Insect",
    "kind": "consumer",
    "subtype": "secondary",
    "trophicLevel": 3,
    "cost": {
      "C": 2,
      "N": 2
    },
    "o2PerRound": 1,
    "lifespan": 3,
    "tags": [
      "insect"
    ],
    "canEat": [
      "caterpillar",
      "grasshopper"
    ],
    "text": "Can consume caterpillar, grasshopper.",
    "copies": 1
  },
  {
    "id": "large-fish",
    "name": "Large Fish",
    "kind": "consumer",
    "subtype": "tertiary",
    "trophicLevel": 4,
    "cost": {
      "C": 4,
      "N": 2
    },
    "o2PerRound": 2,
    "lifespan": 5,
    "tags": [
      "fish",
      "aquatic"
    ],
    "canEat": [
      "small-fish",
      "frog"
    ],
    "text": "Can consume small-fish, frog.",
    "copies": 1
  },
  {
    "id": "water-snake",
    "name": "Water Snake",
    "kind": "consumer",
    "subtype": "tertiary",
    "trophicLevel": 4,
    "cost": {
      "C": 4,
      "N": 2
    },
    "o2PerRound": 2,
    "lifespan": 5,
    "tags": [
      "snake",
      "aquatic"
    ],
    "canEat": [
      "small-fish",
      "frog"
    ],
    "text": "Can consume small-fish, frog.",
    "copies": 1
  },
  {
    "id": "heron",
    "name": "Heron",
    "kind": "consumer",
    "subtype": "tertiary",
    "trophicLevel": 4,
    "cost": {
      "C": 5,
      "N": 3
    },
    "o2PerRound": 2,
    "lifespan": 5,
    "tags": [
      "bird"
    ],
    "canEat": [
      "fish",
      "frog"
    ],
    "text": "Can consume fish, frog.",
    "copies": 1
  },
  {
    "id": "freshwater-shrimp",
    "name": "Freshwater Shrimp",
    "kind": "detritivore",
    "subtype": "shredder",
    "cost": {
      "C": 2,
      "N": 1
    },
    "o2PerRound": 1,
    "lifespan": 4,
    "tags": [
      "aquatic"
    ],
    "canEat": [
      "–"
    ],
    "text": "Shred: consume 1 Dead Plant. The next Microbe decomposing its Shredded Detritus gets +1 C/N returned.",
    "copies": 1
  },
  {
    "id": "aquatic-worm",
    "name": "Aquatic Worm",
    "kind": "detritivore",
    "subtype": "shredder",
    "cost": {
      "C": 1,
      "N": 1
    },
    "o2PerRound": 1,
    "lifespan": 3,
    "tags": [
      "aquatic"
    ],
    "canEat": [
      "–"
    ],
    "text": "Burrow: reduce processing time for Dead Detritus by 1 round.",
    "copies": 1
  },
  {
    "id": "tubifex-worm",
    "name": "Tubifex Worm",
    "kind": "detritivore",
    "subtype": "collector",
    "cost": {
      "C": 1,
      "N": 1
    },
    "o2PerRound": 1,
    "lifespan": 3,
    "tags": [
      "aquatic"
    ],
    "canEat": [
      "–"
    ],
    "text": "Filter: gain +1 C when collecting the detritus of a decomposing dead organism.",
    "copies": 1
  },
  {
    "id": "chironomid-larva",
    "name": "Chironomid Larva",
    "kind": "detritivore",
    "subtype": "collector",
    "cost": {
      "C": 2,
      "N": 1
    },
    "o2PerRound": 1,
    "lifespan": 3,
    "tags": [
      "aquatic",
      "insect"
    ],
    "canEat": [
      "–"
    ],
    "text": "Fine Detritus: process shredded or partially decomposed detritus; gain +1 N.",
    "copies": 1
  },
  {
    "id": "freshwater-snail",
    "name": "Freshwater Snail",
    "kind": "detritivore",
    "subtype": "grazer",
    "cost": {
      "C": 2,
      "N": 1
    },
    "o2PerRound": 1,
    "lifespan": 4,
    "tags": [
      "aquatic"
    ],
    "canEat": [
      "algae"
    ],
    "text": "Graze: consume 1 Algae/Biofilm token to gain +1 C. Can prevent algal bloom.",
    "copies": 1
  },
  {
    "id": "aquatic-grazer",
    "name": "Aquatic Grazer",
    "kind": "detritivore",
    "subtype": "grazer",
    "cost": {
      "C": 1,
      "N": 1
    },
    "o2PerRound": 1,
    "lifespan": 3,
    "tags": [
      "aquatic"
    ],
    "canEat": [
      "algae"
    ],
    "text": "Control Algae: consuming algae removes 1 excess P associated with it.",
    "copies": 1
  },
  {
    "id": "decomposer-fungus",
    "name": "Decomposer Fungus",
    "kind": "microbe",
    "subtype": "fungus",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [
      "–"
    ],
    "canEat": [
      "–"
    ],
    "text": "Decompose 1 processed dead organism; return stored C/N/P to the nutrient pool.",
    "copies": 2
  },
  {
    "id": "nitrogen-bacteria",
    "name": "Nitrogen Bacteria",
    "kind": "microbe",
    "subtype": "bacteria",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [
      "–"
    ],
    "canEat": [
      "–"
    ],
    "text": "Decompose Processed Detritus; return its N and gain +1 N. Bonus once per card per game.",
    "copies": 2
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
      "–"
    ],
    "canEat": [
      "–"
    ],
    "text": "Decompose Processed Detritus; return its P and gain +1 P. Bonus once per card per game.",
    "copies": 2
  },
  {
    "id": "super-decomposer",
    "name": "Super Decomposer",
    "kind": "microbe",
    "subtype": "fungus",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [
      "–"
    ],
    "canEat": [
      "–"
    ],
    "text": "Decompose detritus and return C/N/P without a previous detritivore action.",
    "copies": 1
  },
  {
    "id": "nutrient-rich-adaptation",
    "name": "Nutrient-Rich Adaptation",
    "kind": "adaptation",
    "cost": {
      "C": 2,
      "N": 1
    },
    "tags": [
      "–"
    ],
    "canEat": [
      "–"
    ],
    "text": "Producer becomes Nutrient-Rich: consumer gains +1 C and +1 N when consuming it.",
    "copies": 1
  },
  {
    "id": "oxygen-rich-adaptation",
    "name": "Oxygen-Rich Adaptation",
    "kind": "adaptation",
    "cost": {
      "C": 2,
      "N": 1
    },
    "tags": [
      "–"
    ],
    "canEat": [
      "–"
    ],
    "text": "Producer becomes Oxygen-Rich: produces +2 additional O2 during the Day.",
    "copies": 1
  },
  {
    "id": "p-accumulator-adaptation",
    "name": "Phosphorus-Accumulator Adaptation",
    "kind": "adaptation",
    "cost": {
      "C": 2,
      "N": 1
    },
    "tags": [
      "–"
    ],
    "canEat": [
      "–"
    ],
    "text": "Producer becomes P-Accumulator: stores +1 P when photosynthesizing, returned on decomposition.",
    "copies": 1
  },
  {
    "id": "consumer-specialization",
    "name": "Consumer Specialization",
    "kind": "adaptation",
    "cost": {
      "C": 2,
      "N": 1
    },
    "tags": [
      "–"
    ],
    "canEat": [
      "–"
    ],
    "text": "Upgrade a living consumer with 2 specialization marks; pay its C/N requirements and 1 AP.",
    "copies": 1
  },
  {
    "id": "protected-adaptation",
    "name": "Protected Adaptation",
    "kind": "adaptation",
    "cost": {
      "C": 2,
      "N": 1
    },
    "tags": [
      "–"
    ],
    "canEat": [
      "–"
    ],
    "text": "A living organism cannot be consumed by higher levels. Not immortal.",
    "copies": 1
  },
  {
    "id": "strong-rainfall",
    "name": "Strong Rainfall",
    "kind": "event",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [
      "–"
    ],
    "canEat": [
      "–"
    ],
    "text": "All players gain +2 P; with P >= 3 and algae, trigger Algal Bloom. Next Night all organisms use +1 O2.",
    "copies": 1
  },
  {
    "id": "drought",
    "name": "Drought",
    "kind": "event",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [
      "–"
    ],
    "canEat": [
      "–"
    ],
    "text": "Next Day producers produce -1 O2; aquatic organisms cannot be played and aquatic plants cannot photosynthesize.",
    "copies": 1
  },
  {
    "id": "heat-wave",
    "name": "Heat Wave",
    "kind": "event",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [
      "–"
    ],
    "canEat": [
      "–"
    ],
    "text": "Next Night all organisms consume +1 O2; those unable to pay die.",
    "copies": 1
  },
  {
    "id": "flood",
    "name": "Flood",
    "kind": "event",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [
      "–"
    ],
    "canEat": [
      "–"
    ],
    "text": "Each player chooses 1 organism to become Processed Detritus and gains +1 C; with none, gain +1 P.",
    "copies": 1
  },
  {
    "id": "fallen-leaf",
    "name": "Fallen Leaf",
    "kind": "token",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [
      "plant"
    ],
    "canEat": [
      "–"
    ],
    "text": "Dead plant matter storing 1 C.",
    "copies": 0
  }
];
