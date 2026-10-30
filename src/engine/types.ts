export type Nutrient = 'C' | 'N' | 'P' | 'O2';
export type Pool = { C: number; N: number; P: number; O2: number };   // fractions allowed (costs of 0.5 N)

export type CardKind = 'producer' | 'detritivore' | 'microbe' | 'event';

export interface CardDef {
  id: string;                 // stable slug; ability handlers key on it
  name: string;
  species?: string;           // scientific name, shown in the closeup
  kind: CardKind;
  subtype?: string;           // 'plant'|'algae'|'shredder'|'collector'|'grazer'|'bacteria'
  cost: { C: number; N: number; P?: number; O2?: number };  // paid once from the pool on play (PDF shows these as negatives)
  biomass?: Pool;             // organisms: nutrients stored on the card when it is played
  growth?: Partial<Pool>;     // producers: added to the card's own biomass each round it photosynthesizes
  yield?: Partial<Pool>;      // producers: added to the owner's pool each round it photosynthesizes (O2 included)
  o2PerRound?: number;        // detritivores and microbes: O2 upkeep each round
  release?: Partial<Pool>;    // detritivores, and microbes working without one: moved from the worked card's biomass to the owner's pool each round
  consumes?: Partial<Pool>;   // microbes: removed from their dead card's biomass (gained by nobody) each round they decompose it
  lifespan?: number;          // rounds alive; events: rounds affected, counting the round drawn
  tags: string[];             // what the card is: 'plant','algae','aquatic','detritivore','animal',...
  canEat?: string[];          // detritivores: tags of cards they can work
  eatsAlive?: boolean;        // detritivores (grazers): may also work living cards that match canEat
  text: string;
  copies: number;             // copies in each player's deck
  art?: string;
}

export interface Params {
  startingPool: Pool;               // 10 C / 3 N / 0 P / 7 O2
  winThreshold: { C: number; N: number; P: number };   // 50 / 15 / 1
  startingHand: number;             // 5
  apPerTurn: number;                // 3
  drawPerRound: number;             // 1
  playApCost: number;               // 1
  discardDrawApCost: number;        // 1
  detritivoreAssignApCost: number;  // 1
  algalBloomPThreshold: number;     // 2: Algal Bloom when a player's P is greater than this
  firstPlayerAlternates: boolean;   // false: Player 1 acts first every round
  undoEnabled: boolean;             // true
}

export interface Ruleset { version: 5; name: string; cards: CardDef[]; params: Params }

export type PlayerId = 0 | 1;
export type Zone = 'deck' | 'hand' | 'field' | 'attached' | 'discard' | 'removed';
export type Status = 'alive' | 'dead';   // organisms only

export interface CardInstance {
  uid: string;
  defId: string;
  owner: PlayerId;
  zone: Zone;
  status?: Status;
  lifespanLeft?: number;
  stored: Pool;                // biomass: what decomposition can release
  attachedTo?: string;         // uid of the dead card a microbe sits on
  working?: string;            // detritivores: uid of the card it is breaking down (the card stays visible under it)
  flags: Record<string, boolean | number>;
}

export interface PlayerState {
  id: PlayerId; name: string; pool: Pool; ap: number;
  deck: string[]; hand: string[]; discard: string[];   // uids, deck top = index 0
}

export type Phase = 'action' | 'gameOver';

export interface Modifier {           // a wild event's effect for one round; a 2-round event queues one per round
  id: string; source: string;         // card defId
  effect: 'producerO2-1' | 'noAquaticPlay' | 'noAquaticPhotosynthesis' | 'upkeep+1';
  player?: PlayerId;                  // undefined = both players; events since UPDATE-2.1 affect only the drawer
  activeRound: number;                // the round it applies to (its Environmental Phase included)
}

/** A wild event drawn (or played) during the game, for the "event drawn" indicator. */
export interface DrawnEvent { round: number; player: PlayerId; uid: string }

export interface LogEntry { round: number; text: string }

export interface GameState {
  ruleset: Ruleset;
  seed: number; rngState: number;
  round: number;            // starts at 1
  firstPlayer: PlayerId;
  activePlayer: PlayerId;
  phase: Phase;
  players: [PlayerState, PlayerState];
  cards: Record<string, CardInstance>;
  modifiers: Modifier[];
  drawnEvents: DrawnEvent[];
  winner?: PlayerId | 'draw';
  log: LogEntry[];
  lastError?: string;
  endedTurns?: PlayerId[];
}

export type Action =
  | { type: 'play'; player: PlayerId; uid: string; targetUid?: string }   // microbes need a target; a detritivore may take one (assign on play)
  | { type: 'discardDraw'; player: PlayerId; uid: string }
  | { type: 'assign'; player: PlayerId; detritivoreUid: string; targetUid: string }  // detritivore starts working a card
  | { type: 'endTurn'; player: PlayerId }
  | { type: 'referee'; op: RefereeOp };

export type RefereeOp =
  | { kind: 'setPool'; player: PlayerId; pool: Partial<Pool> }
  | { kind: 'setAp'; player: PlayerId; ap: number }
  | { kind: 'setStatus'; uid: string; status: Status }
  | { kind: 'moveCard'; uid: string; zone: Zone; owner?: PlayerId }
  | { kind: 'setCardField'; uid: string; field: 'lifespanLeft' | 'stored'; value: number | Pool }
  | { kind: 'draw'; player: PlayerId }
  | { kind: 'setActivePlayer'; player: PlayerId }
  | { kind: 'endRound' };
