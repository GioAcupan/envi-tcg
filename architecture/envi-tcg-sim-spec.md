# envi-tcg playtest simulator

**Status:** approved, 2026-10-25 (operator pre-approved: "go ahead with the spec, then proceed with the build. do not wait for my approval").

**Inputs:** decision list from `alley-brainstorm` (§9 below); rules in [docs/TCG_DRAFT.pdf](../docs/TCG_DRAFT.pdf).

**Binding constraints:**
- Throwaway prototype: simplest code that works; no architecture for scale ([AGENTS.md](../AGENTS.md) Work guidance).
- The PDF is the source of truth for game behavior; where it is silent, the app infers and labels the inference (Appendix A, `[I]` lines).
- Implementation agents: Haiku subagents or GPT 6.1 Sol through Orca at medium effort at most; design through Gemini via Orca. No Sonnet.

## 1. Release boundary and decision

**Ships:** one static web app at a GitHub Pages URL where two players play a hotseat match of the PDF's game with the engine doing all bookkeeping, a referee panel overrides anything, an editor tunes every card number and game param, and the edited ruleset is exported/imported as a JSON file. Undo/redo. An in-app Interpretations list. A plain functional UI first, then skinned per a Gemini-made `DESIGN.md`.

**Out:** online multiplayer, accounts, a server, AI opponents or batch simulation (possible later on the same engine seam; no Seeds item now), editing ability *logic* in the app, mobile-first layout (desktop/laptop/projector is the target; phones must not break but need not be pleasant), i18n.

**Architecture:** a pure TypeScript rules engine (`applyAction(state, action) → state`) consumed by a React UI that only dispatches actions and renders state. Card stats and params are plain data in a `Ruleset` object; card *abilities* are small hand-written handlers keyed by card id. Rejected: a free-form tabletop sandbox (no feedback on whether numbers work) and a data-driven effect language (weeks of work for ~30 cards).

## 2. Source ownership and module map

All modules are new. Single package at the repo root.

| Module | Owns | Never owns |
| --- | --- | --- |
| `src/engine/` (new) | Game state shape, `newGame`, `applyAction`, `checkAction`, round/phase flow, all rule logic, ability handlers (`src/engine/abilities.ts`), seeded RNG, the event log. | React, DOM, localStorage, default card data. |
| `src/data/` (new) | Default `Ruleset`: card definitions transcribed from the PDF (`cards.ts`), default params (`params.ts`), the Interpretations list (`interpretations.ts`). | Rule logic. |
| `src/ruleset/` (new) | Ruleset persistence: localStorage load/save, JSON export/import, validation and migration of imported files. | Rule logic, UI. |
| `src/ui/` (new) | All React components and the `useGame` hook (state history for undo/redo); `src/ui/DESIGN.md`. | Rule logic: the UI never computes a game outcome itself, it asks the engine. |
| `public/art/` (new) | Card art and UI assets from the design lane. | Code. |
| `.github/workflows/pages.yml` (new) | Build and deploy to GitHub Pages on push to `main`. | |
| `tests/` (new) | Vitest tests: frozen acceptance tests at the seams in §7, plus lane tests. | |

## 3. Seams

All seam types live in `src/engine/types.ts`. Wave 0 writes this file verbatim and stubs the functions; lanes build against it. A lane that needs a new field adds it as **optional** and notes it in its report.

### 3.1 Ruleset (data ↔ engine ↔ ruleset storage ↔ editor)

```ts
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
```

Contract: the engine reads card numbers and params **only** from the `Ruleset` passed to `newGame` (copied into `GameState.ruleset`); it never imports `src/data/`. Ability handlers are looked up by `CardDef.id`; a card id with no handler simply has no special ability (editing a card's numbers never breaks a game; renaming an id drops its ability). Rejected: engine importing defaults directly, because then edited rulesets would not take effect.

### 3.2 Game state and actions (engine ↔ UI)

```ts
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
```

```ts
/** Build a fresh game. Shuffles each player's deck (every CardDef's `copies`, same list for both players) with
 *  the seeded RNG, places params.fallenLeaves.count Fallen Leaf tokens (status 'dead') in `center`, deals
 *  startingHand cards each (wild events drawn in the opening hand are shuffled back and replaced, [I]), sets
 *  pools to startingPool, round 1, Day, player 0 first and active, ap = apPerTurn. Never throws for a valid Ruleset. */
export function newGame(ruleset: Ruleset, seed: number, names?: [string, string]): GameState;

/** Return null when `action` is legal in `state`, otherwise a short human-readable reason
 *  ("Not enough AP", "Caterpillar can't eat Riparian Tree"). Pure. The UI uses it to enable/disable controls. */
export function checkAction(state: GameState, action: Action): string | null;

/** Apply one action and return the new state. Pure: never mutates `state` (structuredClone then mutate is fine).
 *  Illegal action → returns a copy of `state` with `lastError` set and nothing else changed; never throws.
 *  Legal action → applies it, appends log entries, clears `lastError`, runs the win check, and when both players
 *  have ended their turn runs the Environmental Phase (Appendix A §A2) and starts the next round.
 *  Referee actions are always legal (they bypass checks), are logged as "Referee: …", and still run the win check. */
export function applyAction(state: GameState, action: Action): GameState;
```

Contract: the UI holds `GameState[]` history for undo/redo (D4) and never mutates a state object. Rejected: an event-sourced engine with a reducer of events, because the snapshot history is simpler and states are small.

### 3.3 Ruleset storage (ruleset ↔ UI)

```ts
// src/ruleset/index.ts
/** Saved ruleset from localStorage, or the default ruleset when none is saved, storage is unavailable or the saved value is invalid. Never throws. */
export function loadRuleset(): Ruleset;
/** Save to localStorage; silently does nothing when storage is unavailable. */
export function saveRuleset(r: Ruleset): void;
/** Pretty-printed JSON of the ruleset (the share file). */
export function exportRuleset(r: Ruleset): string;
/** Parse a share file. Fills missing params/card fields from the defaults (so older files keep working);
 *  returns { ok: false, error } for non-JSON, wrong version, or a card missing id/name/kind. */
export function importRuleset(json: string): { ok: true; ruleset: Ruleset } | { ok: false; error: string };
/** The built-in default ruleset (from src/data). */
export function defaultRuleset(): Ruleset;
```

### 3.4 Interpretations (data ↔ UI)

```ts
// src/data/interpretations.ts
export interface Interpretation { id: string; topic: string; text: string; major: boolean }  // major = relayed to authors (R1–R5)
export const interpretations: Interpretation[];
```

Contract: every `[I]` and `[R]` line in Appendix A has one entry, same id.

## 4. Data formats and failure behavior

- **Share file:** `Ruleset` as JSON, `version: 1`, file name `<ruleset name>.envi-tcg.json`. Import fills missing fields from defaults, so files from older builds keep working. Unknown fields are kept.
- **Bad import:** the editor shows `importRuleset`'s error and keeps the current ruleset.
- **localStorage unavailable / corrupt:** app silently uses the default ruleset; the editor shows "Changes won't be saved in this browser — export to keep them."
- **Ruleset edited mid-game:** takes effect at the next "New game"; the running game keeps the ruleset copy in its state.
- **Illegal move:** nothing happens to the game; the reason from `checkAction`/`lastError` shows in a toast.
- **Rules gap at the table:** the referee panel fixes it; no failure state.
- **Deck runs out:** drawing from an empty deck does nothing and is logged ([I]).
- **Game state is not persisted** across reloads ([I], cut-safe); reloading starts a new game.

## 5. UI

No `src/ui/DESIGN.md` exists yet. The operator delegated design to Gemini through Orca (D10): the design lane writes `src/ui/DESIGN.md` (status `iterating`) and the assets in `public/art/`, and the skin wave applies it. Until then the UI is plain and functional.

What the UI must expose (function, not look):
- **Board:** each player's field (organisms upright when alive, sideways when dead/processed, attached cards visible beneath their host), the shared center, deck/discard counts, a hand for the active player only (the other hand hidden behind a "pass the device" screen at each turn change).
- **Status bar:** round, Day/Night, active player, both pools (C/N/P/O₂) with progress toward the win threshold, AP left.
- **Actions:** click a hand card to play (then click a target when needed), click a field card for its actions (eat / assign / decompose), End turn, Undo/Redo; disabled controls show `checkAction`'s reason on hover.
- **Referee panel** (toggle): every `RefereeOp`.
- **Log** of the current game.
- **Ruleset editor:** table of cards (all numeric fields, text, copies) and a params form; New game, Export, Import, Reset to defaults.
- **Interpretations** page listing `interpretations`, major ones first.

## 6. Spikes

- **S1 — Gemini through Orca.** Question: can `orca orchestration worker-start --agent antigravity --model <gemini argon id> --effort medium` start a worker that writes files (one SVG/PNG asset and a `DESIGN.md` stub) into a worktree? Test: start it on a tiny task; check files land. Pass → design lane runs on it. Fail → the design lane runs on GPT 6.1 Sol via Orca or Haiku, and card art falls back to per-subtype SVG icons drawn in code. **Gated:** card art, `DESIGN.md` from Gemini.
- **S2 — GPT 6.1 Sol through Orca.** Question: can `--agent codex --model <gpt 6.1 sol id> --effort medium` take a lane brief, implement in its own worktree and commit? Test: run it on the wave 0 scaffold or the first lane and read the commit. Fail → all implementation lanes run as Haiku subagents. **Gated:** which agent runs which lane (not what ships).

## 7. Acceptance trace

| Req | Testing seam | Check |
| --- | --- | --- |
| D1 | `applyAction` / `checkAction` | Vitest: illegal play (not enough AP / nutrients) sets `lastError` and changes nothing; legal play pays AP + C/N and stores the cost in the card; referee `setPool` bypasses checks and is logged. |
| D1 round flow | `applyAction` | Vitest: a producer played in round 1, then both players `endTurn` → its owner gained its O₂ (round 1 was Day), upkeep paid, lifespans ticked; state is round 2, Night, both drew 1, AP reset, player 1 is first and active. |
| D1 food chain | `applyAction` | Vitest: Caterpillar eats Leaf Litter Plant (prey's stored moves into eater, prey attached under eater); Caterpillar can't eat Riparian Tree or algae; Protected organism can't be eaten. |
| D1 decomposition | `applyAction` | Vitest: dead card → assign detritivore → after `processRounds` it is `processed` → microbe decompose returns stored to microbe owner; Super Decomposer works on a dead (unprocessed) card. |
| D1 events | `applyAction` | Vitest: drawing Strong Rainfall gives both +2 P immediately and queues next-Night upkeep +1; Flood creates a pendingChoice for each player. |
| D1 win | `applyAction` | Vitest: a player reaching the threshold after an action sets `winner` and phase `gameOver`. |
| D2 | `npm run build` | Command exits 0 and writes `dist/`. |
| D3 | `applyAction` purity | Vitest: input state deep-equals its pre-call clone after any action. |
| D4 | `useGame` history | Operator observation in smoke run: Undo restores the previous board; disabled when `params.undoEnabled` is false. |
| D5 | `exportRuleset` / `importRuleset` | Vitest: round-trip equals the input; a file missing a param gets the default; invalid JSON returns `ok:false`. |
| D5 defaults | `defaultRuleset()` | Vitest: contains every card from PDF pp.5–13 (ids listed in Appendix B) with the PDF's numbers; `newGame` builds a deck of Σcopies = 40. |
| D6 | `applyAction` on ability cards | Vitest: one test per ability in Appendix B with a non-trivial handler. |
| D7 | `interpretations` | Vitest: every Appendix A `[I]`/`[R]` id is present. |
| D8 | Pages URL | Operator observation: the URL loads and a match can be started. |
| D9 | `npm test` | Command exits 0. |
| D10 | `src/ui/DESIGN.md` | File exists with a status line; the skinned UI uses its tokens (operator observation). |

## 8. Build order and cut order

**Order:** S2 and S1 run with wave 0 (they only pick agents). Wave 0: scaffold (Vite+React+TS+Vitest), `src/engine/types.ts` verbatim from §3, stubbed functions, frozen acceptance tests from §7. Wave 1: engine, data+ruleset storage, design (Gemini). Wave 2: UI (board + referee + undo), editor + interpretations + Pages workflow. Wave 3: skin per DESIGN.md, smoke run of a full match, deploy.

**Estimate:** [INFERRED] about 4 waves; most of the risk is in engine rule details.

**Cut order** (first to go):
1. Card art (falls back to type icons; costs looks only).
2. Skin wave polish/animations (plain UI; costs looks).
3. Redo (keep Undo).
4. Editor table UI (keep Export/Import so the JSON can be hand-edited; costs non-programmer tuning, which is serious).
Never cut: engine rules, referee panel, win check, Pages deploy.

## 9. Decisions recorded

### Brief

- **Outcome:** a browser app where the rule authors' uni group plays full matches of their ecology TCG ([docs/TCG_DRAFT.pdf](../docs/TCG_DRAFT.pdf)) and tunes card stats and game parameters between playtests.
- **Users:** the student group (non-programmers), playing hotseat on one screen.
- **Constraints:** throwaway prototype, speed over architecture (root AGENTS.md); rules are a draft and change often; the operator cannot answer rule questions (relays major ones to the authors).
- **Success:** the group can (1) start a 2-player match with the PDF's cards, (2) play it to a win with bookkeeping done by the app, (3) fix any rules gap on the spot with a manual override, (4) edit card stats/params and share the set with groupmates.

### Assumptions

A1 [operator-confirmed] Two players, hotseat on one device; no online play, no bot. Checked by: operator answer in brainstorm intake.
A2 [operator-confirmed] The group has no deadline that rules out ~3 build waves. Checked by: operator.
A3 [operator-confirmed] Win threshold defaults to 50 C / 15 N / 2 P (PDF p.5 summary, newer than p.4's 80 C); it is a tunable param either way. Checked by: rule authors.
A4 [agent-assumed] Gemini ("gemini4 argon") can be launched as an agent through the Orca CLI on this machine (Orca 1.4.227 lists the `antigravity` agent; `agy` 1.4.7 is installed). Checked by: spike S1.
A5 [operator-confirmed] Hosting on GitHub Pages from github.com/GioAcupan/envi-tcg (repo is public, so Pages is free); the deliverable is one shareable link. Checked by: `gh repo view` reports PUBLIC.
A6 [agent-assumed] GPT 6.1 Sol can be launched through Orca's `codex` agent at medium effort (`codex-cli` 0.164.0 installed). Checked by: spike S2.

### Decisions (all 2026-10-25)

D1 [operator] Rules engine plus manual override: the app enforces the rules the PDF defines (AP, costs, upkeep, lifespan, day/night, eating, decomposition, events, win check), and an always-available referee panel lets players edit any resource, kill/revive/move any card, and skip checks. Why: the rules are a draft with gaps; pure enforcement would block play at every gap, pure sandbox would not test the numbers. Rejected: free-form tabletop sandbox, because it gives no feedback on whether the numbers work.
D2 [operator] Stack: Vite + React + TypeScript, single package, no backend. Why: fastest path to a static, shareable app.
D3 [operator] Engine is a pure module `src/engine/` exposing `applyAction(state, action) -> state` with an event log in state; UI in `src/ui/` only dispatches actions and renders state. Why: one seam the tests and the UI share; enables undo for free. Rejected: rules logic in React components, because it can't be tested or reused by the referee panel.
D4 [operator] Undo/redo via state history, despite the "cannot retract" rule; `params.undoEnabled` turns it off. Why: a playtest tool must recover from misclicks.
D5 [operator] Card definitions and params are data with an in-app editor; the edited ruleset persists in localStorage and exports/imports as JSON. Why: the group tunes numbers constantly; file sharing needs no server.
D6 [operator] Abilities are hand-written handlers keyed by card id; the editor edits numbers and text, not logic. Why: speed. Rejected: data-driven effect language, because it's weeks of work for ~30 cards.
D7 [operator] An in-app Interpretations list states every inferred rule. Why: the operator relays only major questions; minor inferences must stay visible.
D8 [operator] Hosting on GitHub Pages via a GitHub Actions workflow on push to `main`. Why: free, static, shareable link.
D9 [operator] Vitest unit tests for engine and ruleset storage only; one smoke run of a full match before shipping; no component tests. Why: prototype rule.
D10 [operator] Visual design and card art go through Gemini via Orca into `src/ui/DESIGN.md` and `public/art/`; engine and UI work never wait on design. Why: keeps design off the critical path.
D11 [operator] Implementation runs on Haiku subagents or GPT 6.1 Sol via Orca at ≤ medium effort; never Sonnet. Why: operator is conserving Claude usage.

Rejected alternatives beyond §3: none.

### Open

O1 Major rule questions relayed to the authors (Appendix A `[R1]`–`[R5]`); the defaults stand until answered.

Change requests filed: none (no handoff pack).

## Appendix A — Rules as implemented

Source of truth for the engine lane. `[PDF p.n]` = stated in the PDF; `[R*]` = major inference relayed to the authors; `[I*]` = minor inference. Every `[R]`/`[I]` id appears in `src/data/interpretations.ts`.

### A1 Setup
- Each player has an identical deck built from every card's `copies` (default Σ = 40 [PDF p.5]); shuffled with the game seed. Wild events are shuffled into each deck [PDF p.2].
- Starting pool 10 C / 3 N / 0 P / 7 O₂ [PDF p.4]; starting hand 5 [PDF p.2].
- [I1] A wild event dealt into an opening hand is shuffled back and replaced.
- [I2] 3 Fallen Leaf tokens start in the shared center as dead matter, each storing 1 C, usable by either player ("Starting Boost: Fallen Leaves (FFA)" [PDF p.2]).
- [I3] Player 1 (index 0) starts round 1; the first player alternates each round.

### A2 Round structure
- [R1] Round = Environmental Phase, then the first player's action turn (3 AP), then the other player's action turn (3 AP). Rounds alternate Day/Night; round 1 is Day [PDF p.4].
- The Environmental Phase runs when both players have ended their turn, i.e. between rounds. Round 1 starts directly with action turns (Day). Steps 1–4 settle the round that just ended (so producers played on a Day photosynthesize that same Day); steps 5–8 open the next round. In order:
  1. **Photosynthesis (if the ending round was Day)** [PDF p.4]: each alive producer adds its `o2Produced` (+ modifiers, +2 if Oxygen-Rich ⭐) to its owner's O₂, then triggers its "when photosynthesizing" abilities.
  2. **Upkeep:** each alive non-producer costs its owner `o2PerRound` (+ modifiers active this round) O₂. [I4] Organisms are paid in the order they were played; any organism its owner cannot pay for dies (C.1 [PDF p.2]). Producers have 0 upkeep unless a modifier says "all organisms".
  3. **Aging:** each alive organism's `lifespanLeft` −1; at 0 it dies [PDF p.2].
  4. **Processing:** each dead card being processed: `roundsLeft` −1; at 0 it becomes `processed`.
  5. `round` +1, flip Day/Night; drop modifiers whose window has passed; modifiers for `nextDay`/`nextNight`/`nextRound` become active when their window starts (a "next Night" modifier queued during a Night applies to the following Night).
  6. **Draw:** each player draws `drawPerRound` [I5: draw rule not in PDF; part of R1]. A drawn wild event resolves immediately and costs no AP [PDF p.1]; the player then draws a replacement [I6]. (Wild events drawn mid-turn via discard-and-draw resolve the same way.)
  7. Reset each player's AP to `apPerTurn` and every card's `eatsThisRound` to 0.
  8. Set the first player (alternating if `firstPlayerAlternates`) and make them active.
- An organism dying: status `dead`, turned sideways, stays in its owner's field keeping its `stored`; cards attached under it stay attached. [I7] An eaten organism is not dead matter: it sits under its eater (C.3 [PDF p.3]) and leaves the game's nutrient flow except through its eater.

### A3 Action turn
- Spend AP on: play a card (`playApCost`, except wild events [PDF p.2]); discard a hand card and draw (`discardDrawApCost` [PDF p.2]); eat; assign a detritivore; decompose with a microbe already in play. Played cards can't be taken back [PDF p.2] (undo is a tool feature, D4).
- [R2] Playing an organism also pays its `cost.C`/`cost.N` from the player's pool; that amount becomes the card's `stored`. Can't pay → illegal.
- [I8] There is no hand limit. Unspent AP is lost at end of turn.

### A4 Food chain [PDF pp.7–8]
- Consumers have trophic levels 2/3/4 and eat living organisms whose `tags` intersect their `canEat`. Tertiary consumers never eat producers [PDF p.7].
- [R4] Eating costs `eatApCost`, at most `maxEatsPerRound` per eater per round; the prey may belong to either player [PDF p.1]. The prey's `stored` is added to the eater's `stored`; the prey moves to `attached` under the eater. No hunger rule: consumers don't need to eat to live.
- Riparian Tree can't be eaten by primary consumers [PDF p.5]. Protected ⭐ organisms can't be eaten at all [PDF p.12] (still die of age/upkeep).
- Nutrient-Rich ⭐ prey: the eater's **owner** gains +1 C +1 N [PDF p.6, p.12].
- Specialization marks: a consumer gains 1 mark each time it eats a producer with any ⭐ adaptation [PDF p.8]. [I9] The PDF's "opponent's" qualifier is dropped (any ⭐ producer counts).

### A5 Decomposition [PDF pp.3, 9, 11]
- Pipeline: `dead` → assign a detritivore (`assign`, costs `detritivoreAssignApCost` "in the current round but not in succeeding rounds" [PDF p.3]) → after `processRounds` [R5] rounds it is `processed` → a microbe decomposes it (`play` a microbe with the detritus as target, or `decompose` with one already in play; `decomposeApCost`). Each detritivore works on 1 card at a time; it can't fully consume a card in one round [PDF p.1].
- [R2] Decomposition returns the detritus card's `stored` to the **microbe's owner** and moves the detritus to the discard pile of its owner (center tokens: removed).
- [R5] Microbes stay in play after decomposing and may decompose again in later turns, at most once per round each.
- [I10] A detritivore whose dead card finishes processing gives its owner +1 C ("releasing small amounts of nutrients" [PDF p.1]).
- Bacterial +1 N / +1 P bonus only once per bacteria card per game [PDF p.11].
- Super Decomposer can decompose a `dead` card that no detritivore has processed [PDF p.11].
- Processed decomposition by a microbe: returns `stored`; Diatom returns +1 P extra [PDF p.6]; P-Accumulator ⭐ stored P returns too.

### A6 Adaptations [PDF pp.6, 12]
- Producer adaptations (Nutrient-Rich, Oxygen-Rich, P-Accumulator) and Protected: target an alive organism of the right kind **owned by the player** [I11], cost `playApCost` + 2 C + 1 N, attach under the target (target gains the ⭐ adaptation).
- Consumer Specialization: target own alive consumer with ≥ 2 marks; cost 1 AP + [I12] 2 C + 1 N ("required C/N" unspecified). [I13] A specialized consumer gets +2 `lifespanLeft`, may eat twice per round, and its eats also give its owner +1 C.
- P-Accumulator: each photosynthesis adds +1 P to the producer's `stored` [PDF p.12].

### A7 Wild events [PDF p.13]
- Strong Rainfall: both players +2 P; then each player with P ≥ `algalBloomPThreshold` and ≥ 1 alive algae triggers Algal Bloom; queue `nextNight` upkeep +1 for all organisms.
- Drought: queue `nextDay`: producers −1 O₂ (not below 0), aquatic-tagged cards can't be played, aquatic plants don't photosynthesize. Aquatic Plant ignores the first Drought that affects it [PDF p.5].
- Heat Wave: queue `nextNight`: all organisms (producers included) +1 O₂ upkeep; unpaid ones die.
- Flood: each player, starting with the drawer, chooses 1 own alive organism (pendingChoice) → it becomes `processed` and the player gains +1 C; with none, the player gains +1 P instead.
- [R3] Algal Bloom: queue `nextRound` for that player: all their organisms +1 O₂ upkeep; unpaid ones die. Bloom Algae triggers it for its owner at photosynthesis when the owner's P ≥ `algalBloomPThreshold` [PDF p.6]. [I14] A player with an alive Freshwater Snail ignores Algal Bloom ("can prevent algal bloom" [PDF p.9]).

### A8 Card abilities [PDF pp.5–11]
- Leaf Litter Plant: on death, put 1 Fallen Leaf token (dead, stores 1 C) in its owner's field.
- River Grass, Green Algae: +1 C to owner when photosynthesizing.
- Fast-Growing Plant: +1 C to owner when played.
- Freshwater Shrimp (Shred): when it finishes processing a dead **plant**, mark it shredded; the microbe that decomposes it returns +1 C +1 N extra.
- Aquatic Worm (Burrow): cards it processes need 1 fewer round (min 1).
- Tubifex Worm (Filter): +1 C to owner when its card finishes processing.
- Chironomid Larva (Fine Detritus): may be assigned to an already-`processed` or shredded card; when it does, owner gains +1 N and the card stays processed.
- Freshwater Snail, Aquatic Grazer (grazers): may `eat` a living algae ([I15] the PDF's "Algae/Biofilm token" is read as an alive algae card) → owner gains +1 C (snail); Aquatic Grazer also makes the algae's owner lose 1 P (min 0).
- Wild-event and bacterial behavior as in A5/A7.

## Appendix B — Default cards (from PDF pp.5–13)

`copies` are [I16] chosen to total 40 with the PDF's microbe counts and 4 events; the editor changes them.

| id | name | kind/subtype | TL | C | N | O₂ prod | O₂/round | life | tags | canEat | copies |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| leaf-litter-plant | Leaf Litter Plant | producer/plant | 1 | 1 | 1 | 2 | – | 3 | plant | – | 1 |
| river-grass | River Grass | producer/plant | 1 | 2 | 1 | 2 | – | 4 | plant, aquatic | – | 1 |
| aquatic-plant | Aquatic Plant | producer/plant | 1 | 2 | 1 | 3 | – | 4 | plant, aquatic, aquatic-plant | – | 1 |
| riparian-tree | Riparian Tree | producer/plant | 1 | 3 | 2 | 3 | – | 5 | plant, tree | – | 1 |
| fast-growing-plant | Fast-Growing Plant | producer/plant | 1 | 1 | 1 | 1 | – | 2 | plant | – | 1 |
| green-algae | Green Algae | producer/algae | 1 | 1 | 1 | 2 | – | 2 | algae, aquatic | – | 1 |
| diatom | Diatom | producer/algae | 1 | 1 | 1 | 2 | – | 3 | algae, aquatic | – | 1 |
| bloom-algae | Bloom Algae | producer/algae | 1 | 2 | 1 | 3 | – | 2 | algae, aquatic | – | 1 |
| caterpillar | Caterpillar | consumer/primary | 2 | 2 | 1 | – | 1 | 3 | caterpillar, insect | plant | 1 |
| zooplankton | Zooplankton | consumer/primary | 2 | 1 | 1 | – | 1 | 3 | zooplankton, aquatic | algae | 1 |
| snail | Snail | consumer/primary | 2 | 2 | 1 | – | 1 | 4 | snail, aquatic | algae, aquatic-plant | 1 |
| grasshopper | Grasshopper | consumer/primary | 2 | 2 | 1 | – | 1 | 3 | grasshopper, insect | plant | 1 |
| small-fish | Small Fish | consumer/secondary | 3 | 3 | 1 | – | 1 | 4 | fish, small-fish, aquatic | zooplankton, snail | 1 |
| frog | Frog | consumer/secondary | 3 | 3 | 2 | – | 1 | 4 | frog | caterpillar, grasshopper | 1 |
| predatory-insect | Predatory Insect | consumer/secondary | 3 | 2 | 2 | – | 1 | 3 | insect | caterpillar, grasshopper | 1 |
| large-fish | Large Fish | consumer/tertiary | 4 | 4 | 2 | – | 2 | 5 | fish, aquatic | small-fish, frog | 1 |
| water-snake | Water Snake | consumer/tertiary | 4 | 4 | 2 | – | 2 | 5 | snake, aquatic | small-fish, frog | 1 |
| heron | Heron | consumer/tertiary | 4 | 5 | 3 | – | 2 | 5 | bird | fish, frog | 1 |
| freshwater-shrimp | Freshwater Shrimp | detritivore/shredder | – | 2 | 1 | – | 1 | 4 | aquatic | – | 1 |
| aquatic-worm | Aquatic Worm | detritivore/shredder | – | 1 | 1 | – | 1 | 3 | aquatic | – | 1 |
| tubifex-worm | Tubifex Worm | detritivore/collector | – | 1 | 1 | – | 1 | 3 | aquatic | – | 1 |
| chironomid-larva | Chironomid Larva | detritivore/collector | – | 2 | 1 | – | 1 | 3 | aquatic, insect | – | 1 |
| freshwater-snail | Freshwater Snail | detritivore/grazer | – | 2 | 1 | – | 1 | 4 | aquatic | algae | 1 |
| aquatic-grazer | Aquatic Grazer | detritivore/grazer | – | 1 | 1 | – | 1 | 3 | aquatic | algae | 1 |
| decomposer-fungus | Decomposer Fungus | microbe/fungus | – | 0 | 0 | – | – | – | – | – | 2 |
| nitrogen-bacteria | Nitrogen Bacteria | microbe/bacteria | – | 0 | 0 | – | – | – | – | – | 2 |
| phosphorus-bacteria | Phosphorus Bacteria | microbe/bacteria | – | 0 | 0 | – | – | – | – | – | 2 |
| super-decomposer | Super Decomposer | microbe/fungus | – | 0 | 0 | – | – | – | – | – | 1 |
| nutrient-rich-adaptation | Nutrient-Rich Adaptation | adaptation | – | 2 | 1 | – | – | – | – | – | 1 |
| oxygen-rich-adaptation | Oxygen-Rich Adaptation | adaptation | – | 2 | 1 | – | – | – | – | – | 1 |
| p-accumulator-adaptation | Phosphorus-Accumulator Adaptation | adaptation | – | 2 | 1 | – | – | – | – | – | 1 |
| consumer-specialization | Consumer Specialization | adaptation | – | 2 | 1 | – | – | – | – | – | 1 |
| protected-adaptation | Protected Adaptation | adaptation | – | 2 | 1 | – | – | – | – | – | 1 |
| strong-rainfall | Strong Rainfall | event | – | 0 | 0 | – | – | – | – | – | 1 |
| drought | Drought | event | – | 0 | 0 | – | – | – | – | – | 1 |
| heat-wave | Heat Wave | event | – | 0 | 0 | – | – | – | – | – | 1 |
| flood | Flood | event | – | 0 | 0 | – | – | – | – | – | 1 |
| fallen-leaf | Fallen Leaf | token | – | 0 | 0 | – | – | – | plant | – | 0 |

Copies total: producers 8, consumers 10, detritivores 6, microbes 7, adaptations 5, events 4 → 40. Tags for "aquatic" and prey are [I17] inferred from biology where the PDF is silent. Plant/algae `cost` is paid on play [R2]; adaptation `cost` is the PDF's "+ 2 C + 1 N". "Green Algae" appears twice in the PDF (p.5, p.6) with identical stats; it is one card.
