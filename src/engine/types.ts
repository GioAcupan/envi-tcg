export type Nutrient = 'C' | 'N' | 'P' | 'O2';
export type Pool = { C: number; N: number; P: number; O2: number };

export type CardKind = 'producer' | 'consumer' | 'detritivore' | 'microbe' | 'adaptation' | 'event' | 'token';

export interface CardDef {
  id: string;                 // stable slug, e.g. 'river-grass'; ability handlers key on it
  name: string;
  kind: CardKind;
  subtype?: string;           // 'plant'|'algae'|'primary'|'secondary'|'tertiary'|'shredder'|'collector'|'grazer'|'fungus'|'bacteria'|...
  trophicLevel?: number;      // producers 1, primary 2, secondary 3, tertiary 4
  cost: { C: number; N: number };   // nutrients paid on play (AP cost comes from params)
  o2Produced?: number;        // producers: O2 per Day round
  o2PerRound?: number;        // non-producers: O2 upkeep per round
  lifespan?: number;          // rounds alive; undefined = no natural death
  tags: string[];             // what this card *is*: e.g. ['plant','aquatic'] — prey matching and event targeting use these
  canEat?: string[];          // consumers/grazers: tags they may eat
  text: string;               // rules text shown on the card
  copies: number;             // copies in each player's deck
  art?: string;               // path under public/art/, optional
}

export interface Params {
  startingPool: Pool;               // 10/3/0/7
  winThreshold: { C: number; N: number; P: number };   // 50/15/2
  startingHand: number;             // 5
  apPerTurn: number;                // 3
  drawPerRound: number;             // 1
  playApCost: number;               // 1
  discardDrawApCost: number;        // 1
  eatApCost: number;                // 1
  maxEatsPerRound: number;          // 1
  detritivoreAssignApCost: number;  // 1
  processRounds: number;            // 2
  decomposeApCost: number;          // 1
  algalBloomPThreshold: number;     // 3
  fallenLeaves: { count: number; stored: Pool };  // 3 shared dead cards at setup
  firstPlayerAlternates: boolean;   // true
  undoEnabled: boolean;             // true
}

export interface Ruleset {
  version: 1;
  name: string;
  cards: CardDef[];
  params: Params;
}

export type PlayerId = 0 | 1;
export type Zone = 'deck' | 'hand' | 'field' | 'center' | 'attached' | 'discard' | 'removed';
export type Status = 'alive' | 'dead' | 'processed';   // organisms only; others undefined

export interface CardInstance {
  uid: string;                 // unique per game, e.g. 'c17'
  defId: string;
  owner: PlayerId | null;      // null for center (shared) cards
  zone: Zone;
  status?: Status;
  lifespanLeft?: number;
  stored: Pool;                // nutrients held in the card (cost paid + eaten + bonuses); returned on decomposition
  attachedTo?: string;         // uid of the card this sits under (eaten prey, adaptation, detritus being worked)
  adaptations: string[];       // defIds of adaptation cards applied (⭐ special)
  marks: number;               // consumer specialization marks
  specialized?: boolean;       // consumer upgraded via Consumer Specialization
  processing?: { by: string; roundsLeft: number };   // detritivore uid working this dead card
  eatsThisRound: number;
  flags: Record<string, boolean | number>;          // ability bookkeeping, e.g. bacterialBonusUsed, droughtShieldUsed
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  pool: Pool;
  ap: number;
  deck: string[];   // uids, top = index 0
  hand: string[];
  discard: string[];
}

export type Phase = 'action' | 'choice' | 'gameOver';

export interface Modifier {           // queued event effects, e.g. "next Night: all organisms +1 O2"
  id: string; source: string;         // source = card defId or 'algal-bloom'
  appliesTo: 'nextDay' | 'nextNight' | 'nextRound' | 'thisRound';
  player?: PlayerId;                  // undefined = both players
  effect: string;                     // handler key, e.g. 'upkeep+1', 'producerO2-1', 'noAquaticPlay', 'noAquaticPhotosynthesis'
}

export interface PendingChoice {      // engine waits for a 'choose' action (e.g. Flood)
  kind: string; player: PlayerId; options: string[];  // uids; empty array means "no valid option" and choose(null) is legal
  prompt: string;
}

export interface LogEntry { round: number; text: string }

export interface GameState {
  ruleset: Ruleset;
  seed: number; rngState: number;
  round: number;            // starts at 1
  isDay: boolean;           // round 1 is Day; alternates each round
  firstPlayer: PlayerId;    // who acts first this round
  activePlayer: PlayerId;
  phase: Phase;
  players: [PlayerState, PlayerState];
  cards: Record<string, CardInstance>;
  center: string[];         // shared zone (Fallen Leaves)
  modifiers: Modifier[];
  pendingChoice?: PendingChoice;
  winner?: PlayerId | 'draw';
  log: LogEntry[];
  lastError?: string;       // set when the last action was illegal; cleared on the next legal action
}

export type Action =
  | { type: 'play'; player: PlayerId; uid: string; targetUid?: string }   // play a hand card; targetUid for adaptations, microbes, detritivore assignment-on-play
  | { type: 'discardDraw'; player: PlayerId; uid: string }                // pay AP, discard a hand card, draw 1
  | { type: 'eat'; player: PlayerId; eaterUid: string; preyUid: string }  // consumer/grazer eats a living organism
  | { type: 'assign'; player: PlayerId; detritivoreUid: string; deadUid: string }  // detritivore starts processing a dead card
  | { type: 'decompose'; player: PlayerId; microbeUid: string; detritusUid: string } // microbe already in play decomposes detritus
  | { type: 'choose'; player: PlayerId; uid: string | null }              // answer pendingChoice
  | { type: 'endTurn'; player: PlayerId }
  | { type: 'referee'; op: RefereeOp };

export type RefereeOp =
  | { kind: 'setPool'; player: PlayerId; pool: Partial<Pool> }
  | { kind: 'setAp'; player: PlayerId; ap: number }
  | { kind: 'setStatus'; uid: string; status: Status }
  | { kind: 'moveCard'; uid: string; zone: Zone; owner?: PlayerId | null }
  | { kind: 'setCardField'; uid: string; field: 'lifespanLeft' | 'marks' | 'stored'; value: number | Pool }
  | { kind: 'draw'; player: PlayerId }
  | { kind: 'setDayNight'; isDay: boolean }
  | { kind: 'setActivePlayer'; player: PlayerId }
  | { kind: 'endRound' };
