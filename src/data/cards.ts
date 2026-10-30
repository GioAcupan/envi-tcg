import type { CardDef } from '../engine/types';

export const cards: CardDef[] = [
  {
    "id": "duck-lettuce",
    "name": "Duck Lettuce",
    "species": "Ottelia alismoides",
    "kind": "producer",
    "subtype": "plant",
    "cost": {
      "C": 2,
      "N": 0.5
    },
    "lifespan": 3,
    "biomass": {
      "C": 8,
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
    "copies": 2,
    "art": "art/duck-lettuce.svg"
  },
  {
    "id": "hydrilla",
    "name": "Hydrilla",
    "species": "Hydrilla verticillata",
    "kind": "producer",
    "subtype": "plant",
    "cost": {
      "C": 2,
      "N": 0.5
    },
    "lifespan": 4,
    "biomass": {
      "C": 8,
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
    "copies": 2,
    "art": "art/hydrilla.svg"
  },
  {
    "id": "water-hyacinth",
    "name": "Water Hyacinth",
    "species": "Eichhornia crassipes",
    "kind": "producer",
    "subtype": "plant",
    "cost": {
      "C": 2,
      "N": 0.5
    },
    "lifespan": 4,
    "biomass": {
      "C": 8,
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
    "art": "art/water-hyacinth.svg"
  },
  {
    "id": "indian-lotus",
    "name": "Indian Lotus",
    "species": "Nelumbo nucifera",
    "kind": "producer",
    "subtype": "plant",
    "cost": {
      "C": 2,
      "N": 0.5
    },
    "lifespan": 3,
    "biomass": {
      "C": 8,
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
    "art": "art/indian-lotus.svg"
  },
  {
    "id": "pond-fern",
    "name": "Pond Fern",
    "species": "Azolla sp.",
    "kind": "producer",
    "subtype": "plant",
    "cost": {
      "C": 2,
      "N": 0.5
    },
    "lifespan": 3,
    "biomass": {
      "C": 8,
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
    "copies": 2,
    "art": "art/pond-fern.svg"
  },
  {
    "id": "green-algae",
    "name": "Green Algae",
    "species": "Chlorella sp.",
    "kind": "producer",
    "subtype": "algae",
    "cost": {
      "C": 1,
      "N": 0.5,
      "P": 1
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
    "text": "Costs 1 P to play. Grows 1 C and 1 N biomass; produces 3 O2 and 1 C each round.",
    "copies": 2,
    "art": "art/green-algae.svg"
  },
  {
    "id": "diatoms",
    "name": "Diatoms",
    "species": "Nitzschia sp.",
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
    "copies": 3,
    "art": "art/diatoms.svg"
  },
  {
    "id": "cyanobacteria",
    "name": "Cyanobacteria",
    "species": "Anabaena sp.",
    "kind": "producer",
    "subtype": "algae",
    "cost": {
      "C": 1,
      "N": 0.5,
      "P": 1
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
    "text": "Costs 1 P to play. Grows 1 C and 1 N biomass; produces 3 O2, 1 C and 1 N each round.",
    "copies": 1,
    "art": "art/cyanobacteria.svg"
  },
  {
    "id": "freshwater-shrimp",
    "name": "Common Caridina",
    "species": "Caridina nilotica",
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
    "text": "Shred: releases 3 C from a dead plant each round it works.",
    "copies": 1,
    "art": "art/freshwater-shrimp.svg"
  },
  {
    "id": "aquatic-worm",
    "name": "Red Worm",
    "species": "Limnodrilus hoffmeisteri",
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
    "text": "Burrow: releases 2 C from a dead plant each round it works.",
    "copies": 2,
    "art": "art/aquatic-worm.svg"
  },
  {
    "id": "tubifex-worm",
    "name": "Sludge Worm",
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
    "text": "Filter: releases 1 C; with a shredder on the same card, releases 1 extra C and 1 N.",
    "copies": 2,
    "art": "art/tubifex-worm.svg"
  },
  {
    "id": "chironomid-larva",
    "name": "Harlequin Fly",
    "species": "Chironomus riparius",
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
    "text": "Fine Detritus: releases 1 C; with a shredder on the same card, releases 1 extra C and 1 N.",
    "copies": 3,
    "art": "art/chironomid-larva.svg"
  },
  {
    "id": "caddisfly-larva",
    "name": "Net-spinning Caddisfly",
    "species": "Hydropsyche angustipennis",
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
    "text": "Filter: releases 1 C; with a shredder on the same card, releases 1 extra C and 1 N.",
    "copies": 2,
    "art": "art/caddisfly-larva.svg"
  },
  {
    "id": "freshwater-snail",
    "name": "Susong Pilipit",
    "species": "Jagora asperata",
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
    "text": "Graze: releases 1 C from living or dead algae. Prevents Algal Bloom.",
    "copies": 1,
    "art": "art/freshwater-snail.svg"
  },
  {
    "id": "aquatic-grazer",
    "name": "Mayfly Nymph",
    "species": "Baetis rhodani (Large Dark Olive)",
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
      "plant",
      "algae"
    ],
    "text": "Control Algae: releases 1 C from a dead plant or algae and removes 1 P from its owner pool.",
    "copies": 1,
    "art": "art/aquatic-grazer.svg"
  },
  {
    "id": "carbon-bacteria",
    "name": "Carbon Bacteria",
    "species": "Cellulomonas fimi",
    "kind": "microbe",
    "subtype": "bacteria",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [
      "microbe"
    ],
    "text": "Alone: releases 1 C a round from its dead card. With a detritivore: doubles the C the detritivores release instead. Takes 1 C and 0.5 N of its dead card's biomass each round. Returns to hand when the card is fully decomposed.",
    "copies": 3,
    "art": "art/carbon-bacteria.svg",
    "o2PerRound": 1,
    "consumes": {
      "C": 1,
      "N": 0.5
    },
    "release": {
      "C": 1
    }
  },
  {
    "id": "nitrifying-bacteria",
    "name": "Nitrifying Bacteria",
    "species": "Nitrosomonas europaea",
    "kind": "microbe",
    "subtype": "bacteria",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [
      "microbe"
    ],
    "text": "Alone: releases 1 N a round from its dead card. With a detritivore: releases all remaining N, doubled, instead. Takes 1 C and 0.5 N of its dead card's biomass each round. Returns to hand when the card is fully decomposed.",
    "copies": 3,
    "art": "art/nitrifying-bacteria.svg",
    "o2PerRound": 1,
    "consumes": {
      "C": 1,
      "N": 0.5
    },
    "release": {
      "N": 1
    }
  },
  {
    "id": "phosphorus-bacteria",
    "name": "Phosphorus Bacteria",
    "species": "Bacillus megaterium",
    "kind": "microbe",
    "subtype": "bacteria",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [
      "microbe"
    ],
    "text": "Gives +1 P each round it decomposes its dead card, alone or with a detritivore. Takes 1 C and 0.5 N of its dead card's biomass each round. Returns to hand when the card is fully decomposed.",
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
    "text": "You gain 1 P, then check for Algal Bloom. Goes to your discard when it ends.",
    "copies": 1,
    "art": "art/strong-rainfall.svg",
    "lifespan": 1
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
    "text": "This round and next, for you: producers yield 1 less O2; no aquatic plays; aquatic plants cannot photosynthesize. Goes to your discard when it ends.",
    "copies": 1,
    "art": "art/drought.svg",
    "lifespan": 2
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
    "text": "This round and next, your organisms pay 1 extra O2 upkeep, including producers. Goes to your discard when it ends.",
    "copies": 1,
    "art": "art/heat-wave.svg",
    "lifespan": 2
  },
  {
    "id": "flood",
    "name": "Flash Flood",
    "kind": "event",
    "cost": {
      "C": 0,
      "N": 0
    },
    "tags": [],
    "text": "One of your living organisms dies at random and you gain 1 C; with none, you gain 1 P. Goes to your discard when it ends.",
    "copies": 1,
    "art": "art/flood.svg",
    "lifespan": 1
  },
  {
    "id": "introduced-species",
    "name": "Introduced Non-native Species",
    "kind": "event",
    "cost": {
      "C": 0,
      "N": 0
    },
    "lifespan": 1,
    "tags": [],
    "text": "Two of your living organisms die at random and you lose 5 C and 2 N; with no living organism, you lose 10 C and 4 N. Goes to your discard when it ends.",
    "copies": 1,
    "art": "art/introduced-species.svg"
  }
];
