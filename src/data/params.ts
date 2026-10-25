import type { Params } from '../engine/types';

export const params: Params = {
  startingPool: { C: 10, N: 3, P: 0, O2: 7 },
  winThreshold: { C: 50, N: 15, P: 2 },
  startingHand: 5,
  apPerTurn: 3,
  drawPerRound: 1,
  playApCost: 1,
  discardDrawApCost: 1,
  eatApCost: 1,
  maxEatsPerRound: 1,
  detritivoreAssignApCost: 1,
  processRounds: 2,
  decomposeApCost: 1,
  algalBloomPThreshold: 3,
  fallenLeaves: { count: 3, stored: { C: 1, N: 0, P: 0, O2: 0 } },
  firstPlayerAlternates: true,
  undoEnabled: true,
};
