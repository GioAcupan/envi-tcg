# envi-tcg UPDATE-1 rules revision (delta spec)

**Status:** approved, 2026-10-26 (operator: "implement it … orchestrate the iteration"; the rule questions in §9 are relayed to the rule authors in parallel and do not block the build).

**Inputs:** [docs/UPDATE-1.pdf](../docs/UPDATE-1.pdf) (revised rules, replaces [docs/TCG_DRAFT.pdf](../docs/TCG_DRAFT.pdf) as the rules source); operator request for an evolution on/off toggle ("so they establish a baseline"); baseline = current code plus [architecture/envi-tcg-sim-spec.md](envi-tcg-sim-spec.md) (not yet distilled; no module `AGENTS.md` exists, root [AGENTS.md](../AGENTS.md) governs).

**Binding constraints:** throwaway prototype, simplest code that works ([AGENTS.md](../AGENTS.md)); the PDF is the source of truth, gaps are inferred and listed in the in-app Interpretations; delegated agents are GPT 6.1 Sol via Orca or Haiku at medium effort at most, never Sonnet.

## 1. Release boundary and decision

**Ships:** the same app (engine, editor, game screen, Pages link) playing UPDATE-1's rules: the new 36-card deck, producers that grow their own biomass and yield nutrients every round, detritivores that release nutrients from a card's biomass each round, microbes that assist once and return to hand, secondary consumers that eat detritivores, the revised wild events, 50 C / 15 N / 1 P to win, no Fallen Leaves, no Day/Night. A `params.evolutionEnabled` toggle (editor checkbox and game-menu switch) removes every Evolution/Adaptation card from both decks and turns off specialization marks.

**Out:** visual redesign (the tablet layout in [src/ui/DESIGN.md](../src/ui/DESIGN.md) stays); opening old (version 1) ruleset files; Seeds item envi-tcg-99cc (focus trap) stays open and separate.

**Decision:** edit the existing engine in place (same `applyAction` reducer, same ability-handler map), replacing the processing/decompose flow with per-round biomass release. Rejected: a parallel "v2 engine" behind a switch for the old draft rules, because nobody needs to play the old draft and it doubles the code.

## 2. Source ownership and module map

Unchanged ownership from [envi-tcg-sim-spec.md §2](envi-tcg-sim-spec.md). Touched:

| Module | Change |
| --- | --- |
| `src/engine/` | New types (§3), new round flow and abilities (Appendix A). |
| `src/data/` | Cards replaced per Appendix B; params per §3; Interpretations rewritten (§9). |
| `src/ruleset/` | Ruleset `version: 2`; version 1 rejected (§4). |
| `src/ui/game/`, `src/ui/common/`, `src/App.tsx` | Day/Night, shared center, Flood choice and processing UI removed; biomass and worker stacks shown; evolution switch in the game menu. |
| `src/ui/editor/`, `src/ui/interpretations/` | New card fields and params, fractional numbers, deck size 36, evolution checkbox. |
| `tests/` | Engine and ruleset tests rewritten for UPDATE-1. |

## 3. Seams

`src/engine/types.ts` becomes exactly this (comments are part of the contract). `newGame`, `checkAction` and `applyAction` keep their signatures and interface comments, except that the shared center, Day/Night and Flood choice no longer exist.

```ts
export type Nutrient = 'C' | 'N' | 'P' | 'O2';
export type Pool = { C: number; N: number; P: number; O2: number };   // fractions allowed (costs of 0.5 N)

export type CardKind = 'producer' | 'consumer' | 'detritivore' | 'microbe' | 'adaptation' | 'event';

export interface CardDef {
  id: string;                 // stable slug; ability handlers key on it
  name: string;
  kind: CardKind;
  subtype?: string;           // 'plant'|'algae'|'secondary'|'shredder'|'collector'|'grazer'|'bacteria'
  cost: { C: number; N: number; O2?: number };  // paid once from the pool on play (PDF shows these as negatives)
  biomass?: Pool;             // organisms: nutrients stored on the card when it is played
  growth?: Partial<Pool>;     // producers: added to the card's own biomass each round it photosynthesizes
  yield?: Partial<Pool>;      // producers: added to the owner's pool each round it photosynthesizes (O2 included)
  o2PerRound?: number;        // detritivores and consumers: O2 upkeep each round
  release?: Partial<Pool>;    // detritivores: moved from the worked card's biomass to the owner's pool each round
  lifespan?: number;          // rounds alive
  tags: string[];             // what the card is: 'plant','algae','aquatic','detritivore','animal',...
  canEat?: string[];          // consumers: tags of living prey; detritivores: tags of cards they can work
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
  eatApCost: number;                // 1
  maxEatsPerRound: number;          // 1
  detritivoreAssignApCost: number;  // 1
  algalBloomPThreshold: number;     // 2: Algal Bloom when a player's P is greater than this
  firstPlayerAlternates: boolean;   // true
  undoEnabled: boolean;             // true
  evolutionEnabled: boolean;        // true; false = baseline: no adaptation cards in decks, no specialization marks
}

export interface Ruleset { version: 2; name: string; cards: CardDef[]; params: Params }

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
  attachedTo?: string;         // uid this card sits under: eaten prey under its eater, adaptation under its host, microbe on its dead card
  working?: string;            // detritivores: uid of the card it is breaking down (the card stays visible under it)
  adaptations: string[];       // defIds of adaptations applied
  marks: number;               // consumer specialization marks
  specialized?: boolean;
  eatsThisRound: number;
  flags: Record<string, boolean | number>;
}

export interface PlayerState {
  id: PlayerId; name: string; pool: Pool; ap: number;
  deck: string[]; hand: string[]; discard: string[];   // uids, deck top = index 0
}

export type Phase = 'action' | 'gameOver';

export interface Modifier {           // a wild event's effect for one round
  id: string; source: string;         // card defId
  effect: 'producerO2-1' | 'noAquaticPlay' | 'noAquaticPhotosynthesis' | 'upkeep+1';
  player?: PlayerId;                  // undefined = both players
  activeRound: number;                // the round it applies to (its Environmental Phase included)
}

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
  winner?: PlayerId | 'draw';
  log: LogEntry[];
  lastError?: string;
  endedTurns?: PlayerId[];
}

export type Action =
  | { type: 'play'; player: PlayerId; uid: string; targetUid?: string }   // adaptations and microbes need a target; a detritivore may take one (assign on play)
  | { type: 'discardDraw'; player: PlayerId; uid: string }
  | { type: 'eat'; player: PlayerId; eaterUid: string; preyUid: string }  // consumer eats a living organism
  | { type: 'assign'; player: PlayerId; detritivoreUid: string; targetUid: string }  // detritivore starts working a card
  | { type: 'endTurn'; player: PlayerId }
  | { type: 'referee'; op: RefereeOp };

export type RefereeOp =
  | { kind: 'setPool'; player: PlayerId; pool: Partial<Pool> }
  | { kind: 'setAp'; player: PlayerId; ap: number }
  | { kind: 'setStatus'; uid: string; status: Status }
  | { kind: 'moveCard'; uid: string; zone: Zone; owner?: PlayerId }
  | { kind: 'setCardField'; uid: string; field: 'lifespanLeft' | 'marks' | 'stored'; value: number | Pool }
  | { kind: 'draw'; player: PlayerId }
  | { kind: 'setActivePlayer'; player: PlayerId }
  | { kind: 'endRound' };
```

The UI asks `checkAction` for every control and never computes rule outcomes (unchanged). The UI finds a card's workers as `cards` whose `working === uid` and its microbes as `zone === 'attached' && attachedTo === uid`.

## 4. Data formats and failure behavior

- Ruleset files and the localStorage copy carry `version: 2`. `importRuleset` rejects any other version with: "This file was made for an earlier rules version; reset to defaults or import a version 2 file." `loadRuleset` discards a stored version 1 ruleset and returns the defaults, so returning visitors get UPDATE-1 without action.
- Missing fields in a version 2 file are filled from defaults (unchanged behavior).
- An empty deck on draw: the discard pile is shuffled into the deck (seeded RNG); if both are empty the draw is skipped and logged.

## 5. UI

[src/ui/DESIGN.md](../src/ui/DESIGN.md) governs the look; no redesign. The changes the lanes make inside it: remove the Day/Night emblem and the shared center; show each worked card with its detritivores and microbes stacked so the worked card stays visible (PDF C.4); show `stored` as Biomass on cards and in closeups; show producers' growth and yield; label dead cards' remaining biomass; an "Evolution off" chip when `evolutionEnabled` is false. The no-scroll rule from Seeds envi-tcg-9bf9 still holds.

## 6. Spikes

None.

## 7. Acceptance trace

| ID | Testing seam | Check |
| --- | --- | --- |
| U1 deck of 36, 5-card hand, evolution off → 26 | `newGame` | engine test counts deck+hand per player, both toggle states |
| U2 play pays cost incl. fractions and O2; card stores its biomass | `applyAction` play | engine test (Emergent Plant: −2 C, −0.5 N, stored 6/1/0) |
| U3 production every round: growth to biomass, yield to pool, Oxygen-Rich and Drought | `applyAction` endTurn ×2 | engine test |
| U4 detritivore release, multi-worker, collector+shredder bonus, lifespan pause, completion to discard | `applyAction` assign + endTurn | engine tests |
| U5 microbes: assist once with a detritivore then return to hand; carbon doubling, nitrifying all N, phosphorus +1 P | `applyAction` | engine tests |
| U6 consumers eat detritivores; biomass transfers; prey attached; Protected blocks | `applyAction` eat | engine test |
| U7 wild events: Rainfall, Drought, Heat Wave, Flood as Appendix A | `applyAction` / `newGame` with forced deck order | engine tests |
| U8 Algal Bloom: P > 2 with algae doubles algae biomass; snail prevents | `applyAction` endTurn | engine test |
| U9 win at 50 C / 15 N / 1 P | `applyAction` referee setPool | engine test |
| U10 version 1 rejected on import, discarded on load | `importRuleset` / `loadRuleset` | ruleset test |
| U11 evolution toggle in editor and game menu; chip visible | UI | Playwright check at tablet size, screenshot |
| U12 game screen still fits without scrolling | UI | existing no-scroll check, tablet landscape and portrait |
| U13 every inference listed in-app | `interpretations` | interpretations test (ids unique, non-empty) |

## 8. Build order and cut order

Wave 1: engine + data + ruleset + tests (one lane; everything else depends on the types). Wave 2: game UI lane and editor/interpretations lane in parallel. Estimate `[INFERRED]`: wave 1 ~90 min, wave 2 ~60 min.

Cut order: (1) growth/yield display polish in closeups; (2) game-menu evolution switch (editor checkbox remains); never cut the rules or the toggle itself.

## 9. Decisions recorded

**Assumptions** (all agent-assumed, 2026-10-26; checked by the rule authors via the operator; each is an Interpretation in the app and editable where it is a number):

Major — relayed to the rule authors:
- **R1 Day/Night is gone.** UPDATE-1 deletes the Day/Night section; every round's Environmental Phase runs production. ("Per day round" in the producer section is read as "per round".)
- **R2 Consumers and Evolution keep first-draft stats.** UPDATE-1 lists 3 secondary consumers and 10 evolution cards but no tables. Used: Small Fish, Frog, Predatory Insect at draft costs/upkeep/lifespan, biomass = cost, all eat any living detritivore; the five draft adaptations × 2 copies. Consumer Specialization marks come from any eat (not from special producers, which consumers no longer eat).
- **R3 Microbe lifecycle.** Played on a dead card (1 AP + 1 O2), it cannot be moved or taken back; at the next Environmental Phase in which a detritivore works that card it applies its ability once, then returns to its owner's hand.
- **R4 Decomposition end and dead animals.** A worked card is fully decomposed when its stored C reaches 0; leftover N/P is lost with it and it goes to its owner's discard with everything under it. Collectors may also work dead animals (detritivores, consumers), otherwise nothing could recycle them.
- **R5 Algal Bloom effect.** At each Environmental Phase (and immediately on Strong Rainfall), a player with P > 2 and at least one living algae has each living algae's biomass doubled (C, N, P); a living Freshwater Snail prevents it. No other bloom penalty.

Minor — inferred:
- I1 Each deck holds one of each of the 4 wild events ("split to 2 decks" read as one set per player's deck; 36 total confirms 4 per deck).
- I2 Opening-hand wild events are shuffled back and replaced; a drawn event resolves for no AP and a replacement is drawn.
- I3 Wild events affect the round in which they are drawn; round-start draws happen after the round number advances.
- I4 Flood: for each player, a random living organism of theirs dies and they gain +1 C; with none, +1 P.
- I5 Heat Wave's +1 O2 applies to producers too ("all organisms").
- I6 Playing a detritivore with a target costs play AP + assign AP (the PDF's "separately cost another action point"); later rounds of work are free.
- I7 Multiple detritivores may work one card; a detritivore works one card at a time; reassigning costs AP again.
- I8 Collector + Shredder pairing: a collector on a card a shredder also works releases an extra 1 C and 1 N.
- I9 Carbon Bacteria doubles C released that phase; the extra does not come from the card's biomass.
- I10 Aquatic Grazer releases 1 C (unstated) and removes 1 P from its owner's pool when it works algae.
- I11 Detritivore lifespan does not count down in a round it released nutrients.
- I12 Nutrient-Rich adds +1 C +1 N to the producer's biomass when attached; Oxygen-Rich +2 O2 yield; P-Accumulator +1 P growth.
- I13 Aquatic tags per Appendix B; Drought blocks playing aquatic cards and stops aquatic plants (not algae) photosynthesizing.
- I14 Empty deck: reshuffle the discard pile (PDF A); no hand limit; unspent AP is lost; first player alternates; 1 draw per round.

**Decisions:** 2026-10-26, orchestrator: delta in place (§1); Flood choice, shared center and Day/Night removed from state rather than left dormant, to keep the engine honest about the rules; ruleset version bumped so stale saved rules cannot silently override UPDATE-1.

**Change requests:** none (no handoff pack).

## Appendix A — Round flow (engine contract)

**Play.** Organisms: pay `playApCost` + `cost` (C, N, O2); `stored = biomass`; alive; `lifespanLeft = lifespan`. Drought blocks aquatic cards. Microbe: target a dead card in the field; attaches to it. Adaptation: requires `evolutionEnabled`, a target of the right kind owned by the player (producer for Nutrient-Rich, Oxygen-Rich, P-Accumulator; consumer with 2 marks for Consumer Specialization; any organism for Protected). Detritivore with a target: also assigns (I6).

**Assign.** Own alive unemployed detritivore; target on the field matching `canEat`, dead, or alive when `eatsAlive`; costs `detritivoreAssignApCost`.

**Eat.** Own alive consumer; prey alive, matching `canEat`, not Protected; `maxEatsPerRound` (2 if specialized); costs `eatApCost`. Prey's stored adds to the eater's stored; prey moves under the eater; a prey detritivore stops working. Marks +1 when evolution is on; specialized eaters give +1 C.

**Environmental Phase** (after both players end their turn), in order:
1. Production: each living producer, unless Drought stops it (aquatic plant): stored += growth (+1 P with P-Accumulator); owner pool += yield, O2 +2 with Oxygen-Rich and −1 per Drought, floored at 0.
2. Algal Bloom check (R5).
3. Upkeep in play order: each living organism pays `o2PerRound` (0 for producers) + 1 per Heat Wave; unpaid → dies.
4. Decomposition: per worked card, each living worker moves `min(release, stored)` per nutrient to its owner (plus I8, I9, I10); then that card's microbes apply once and return to hand (R3) if any worker acted; a card at stored C ≤ 0 is fully decomposed (R4), its workers freed. A living grazed algae at C ≤ 0 dies and is decomposed.
5. Lifespan: each living organism −1 (I11 exception); at 0 → dies.
6. Next round: round + 1, first player alternates, AP reset, eat counts reset, each player draws `drawPerRound` (events resolve, I2–I3; reshuffle, I14).

**Events.** Strong Rainfall: each player +1 P, then the bloom check. Drought: this round, both players: producers −1 O2, no aquatic plays, aquatic plants do not photosynthesize. Heat Wave: this round, all organisms +1 O2 upkeep. Flood: I4.

**Win.** Unchanged check at 50 / 15 / 1.

## Appendix B — Default cards (one copy unless noted; 36 per deck)

Costs are what is paid (the PDF prints them negative).

| id | Name | Kind/subtype | Cost C/N/O2 | Life | Biomass C/N/P | Growth | Yield | Upkeep | Release / ability | Tags | canEat |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| emergent-plant | Emergent Plant | producer/plant | 2/0.5/– | 3 | 6/1/0 | 1 C | 2 O2, 1 C | – | – | plant | – |
| river-grass | River Grass | producer/plant | 2/0.5/– | 4 | 6/1/0 | 1 C | 2 O2, 1 C | – | – | plant | – |
| aquatic-plant | Aquatic Plant | producer/plant | 2/0.5/– | 4 | 6/1/0 | 1 C | 2 O2, 1 C | – | – | plant, aquatic | – |
| free-floating-plant | Free-floating Plant | producer/plant | 2/0.5/– | 3 | 6/1/0 | 1 C | 2 O2, 1 C | – | – | plant, aquatic | – |
| green-algae | Green Algae | producer/algae | 1/0.5/– | 2 | 2/0/0 | 1 C, 1 N | 3 O2, 1 C | – | – | algae, aquatic | – |
| diatoms | Diatoms | producer/algae | 2/0.5/– | 1 | 2/0/0 | 1 C, 1 N | 4 O2, 1 C | – | – | algae, aquatic | – |
| cyanobacteria | Cyanobacteria | producer/algae | 1/0.5/– | 2 | 2/0/0 | 1 C, 1 N | 3 O2, 1 C, 1 N | – | – | algae, aquatic | – |
| freshwater-shrimp | Freshwater Shrimp | detritivore/shredder | 0/0.5/– | 4 | 3/1/0 | – | – | 1 | 3 C; dead plants only | detritivore, animal, aquatic | plant |
| aquatic-worm | Aquatic Worm | detritivore/shredder | 0/0.5/– | 3 | 3/1/0 | – | – | 1 | 2 C; dead plants only | detritivore, animal, aquatic | plant |
| tubifex-worm | Tubifex Worm | detritivore/collector | 0/0.5/– | 3 | 3/1/0 | – | – | 1 | 1 C; +1 C +1 N with a shredder | detritivore, animal, aquatic | plant, algae, animal |
| chironomid-larva | Chironomid Larva | detritivore/collector | 0/0.5/– | 3 | 3/1/0 | – | – | 1 | 1 C; +1 C +1 N with a shredder | detritivore, animal, aquatic | plant, algae, animal |
| freshwater-snail | Freshwater Snail | detritivore/grazer | 0/0.5/– | 4 | 3/1/0 | – | – | 1 | 1 C; algae alive or dead; prevents Algal Bloom | detritivore, animal, aquatic | algae (eatsAlive) |
| aquatic-grazer | Aquatic Grazer | detritivore/grazer | 0/0.5/– | 3 | 3/1/0 | – | – | 1 | 1 C; −1 P from owner's pool | detritivore, animal, aquatic | algae (eatsAlive) |
| small-fish | Small Fish | consumer/secondary | 3/1/– | 4 | 3/1/0 | – | – | 1 | eats detritivores | consumer, animal, aquatic | detritivore |
| frog | Frog | consumer/secondary | 3/2/– | 4 | 3/2/0 | – | – | 1 | eats detritivores | consumer, animal | detritivore |
| predatory-insect | Predatory Insect | consumer/secondary | 2/2/– | 3 | 2/2/0 | – | – | 1 | eats detritivores | consumer, animal | detritivore |
| carbon-bacteria | Carbon Bacteria ×2 | microbe/bacteria | 0/0/1 | – | – | – | – | – | doubles C released that phase | microbe | – |
| nitrifying-bacteria | Nitrifying Bacteria ×2 | microbe/bacteria | 0/0/1 | – | – | – | – | – | releases all N of the card | microbe | – |
| phosphorus-bacteria | Phosphorus Bacteria ×2 | microbe/bacteria | 0/0/1 | – | – | – | – | – | +1 P | microbe | – |
| nutrient-rich-adaptation | Nutrient-Rich Adaptation ×2 | adaptation | 2/1/– | – | – | – | – | – | I12 | – | – |
| oxygen-rich-adaptation | Oxygen-Rich Adaptation ×2 | adaptation | 2/1/– | – | – | – | – | – | I12 | – | – |
| p-accumulator-adaptation | Phosphorus-Accumulator Adaptation ×2 | adaptation | 2/1/– | – | – | – | – | – | I12 | – | – |
| consumer-specialization | Consumer Specialization ×2 | adaptation | 2/1/– | – | – | – | – | – | needs 2 marks; +2 lifespan, 2 eats, +1 C per eat | – | – |
| protected-adaptation | Protected Adaptation ×2 | adaptation | 2/1/– | – | – | – | – | – | cannot be eaten | – | – |
| strong-rainfall | Strong Rainfall | event | – | – | – | – | – | – | Appendix A | – | – |
| drought | Drought | event | – | – | – | – | – | – | Appendix A | – | – |
| heat-wave | Heat Wave | event | – | – | – | – | – | – | Appendix A | – | – |
| flood | Flood | event | – | – | – | – | – | – | Appendix A | – | – |

Card `text` is the PDF's ability wording, shortened. Art: reuse existing art where the card survives; new cards use the closest existing art or none.
