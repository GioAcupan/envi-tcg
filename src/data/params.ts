import type { Params } from '../engine/types';

export const params: Params = {
  startingPool: { C: 10, N: 3, P: 0, O2: 7 },
  winThreshold: { C: 50, N: 15, P: 1 },
  startingHand: 5,
  apPerTurn: 3,
  drawPerRound: 1,
  playApCost: 1,
  discardDrawApCost: 1,
  eatApCost: 1,
  maxEatsPerRound: 1,
  detritivoreAssignApCost: 1,
  algalBloomPThreshold: 2,
  firstPlayerAlternates: true,
  undoEnabled: true,
  evolutionEnabled: true,
};
