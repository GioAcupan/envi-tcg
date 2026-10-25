---
alley-plan: 1
id: sim
spec: architecture/envi-tcg-sim-spec.md
pace: fast
checks:
  - npm run typecheck
  - npm test
  - npm run build
tasks:
  - { id: T1, wave: 0, label: open, budget: 60m, owns: [package.json, package-lock.json, tsconfig.json, vite.config.ts, index.html, .gitignore, src/main.tsx, src/index.css, src/App.tsx, src/engine/types.ts, src/engine/index.ts, src/ruleset/index.ts, src/data/cards.ts, src/data/params.ts, src/data/interpretations.ts, src/ui/game/GameScreen.tsx, src/ui/editor/EditorScreen.tsx, src/ui/interpretations/InterpretationsScreen.tsx, tests/acceptance/engine.test.ts, tests/acceptance/ruleset.test.ts, tests/acceptance/interpretations.test.ts, tests/acceptance/helpers.ts] }
  - { id: T2, wave: 1, label: shaped, budget: 90m, owns: [src/engine/, tests/engine.lane.test.ts], frozen: [tests/acceptance/engine.test.ts, tests/acceptance/helpers.ts], after: [T1] }
  - { id: T3, wave: 1, label: shaped, budget: 30m, owns: [src/ruleset/, src/data/interpretations.ts, tests/ruleset.lane.test.ts], frozen: [tests/acceptance/ruleset.test.ts, tests/acceptance/interpretations.test.ts], after: [T1] }
  - { id: T4, wave: 1, label: open, budget: 45m, owns: [src/ui/DESIGN.md, public/art/] }
  - { id: T5, wave: 2, label: shaped, budget: 90m, owns: [src/ui/game/, src/ui/useGame.ts, src/ui/common/], after: [T2] }
  - { id: T6, wave: 2, label: shaped, budget: 45m, owns: [src/ui/editor/, src/ui/interpretations/], after: [T3] }
  - { id: T7, wave: 2, label: pinned, budget: 15m, owns: [.github/workflows/pages.yml, README.md] }
  - { id: T8, wave: 3, label: open, budget: 60m, owns: [src/ui/, src/index.css], after: [T4, T5, T6] }
---

# envi-tcg playtest simulator

**Spec:** [architecture/envi-tcg-sim-spec.md](../architecture/envi-tcg-sim-spec.md). Rules contract: spec Appendix A; default cards: Appendix B; seams: §3; acceptance trace: §7.

**Agent routing (spec D11):** GPT 6.1 Sol via Orca `codex` at medium effort for T1, T2, T5; Haiku subagents for T3, T6, T7; Gemini via Orca `antigravity` for T4, T8 (fallback per spec §6 S1). No Sonnet.

## Wave 0

### T1 — Scaffold, seam types and stubs, default card data, frozen acceptance tests

**Design line:** turn spec §3 into compiling code so every later lane builds against the same types and the same failing acceptance tests.

- Vite + React 18 + TypeScript + Vitest project at the repo root. Scripts: `dev`, `build` (`tsc -b && vite build` or equivalent), `typecheck` (`tsc --noEmit`), `test` (`vitest run`). `vite.config.ts` sets `base: './'` so the build works under the GitHub Pages subpath. `.gitignore` covers `node_modules/`, `dist/`.
- `src/engine/types.ts`: spec §3.1 and §3.2 types **verbatim**.
- `src/engine/index.ts`: exports `newGame`, `checkAction`, `applyAction` with spec §3.2's interface comments; bodies `throw new Error('not implemented')`. Re-exports the types.
- `src/ruleset/index.ts`: spec §3.3 signatures and comments; `defaultRuleset()` already returns `{ version: 1, name: 'PDF defaults', cards, params }` from `src/data`; the other four throw `not implemented`.
- `src/data/cards.ts`: every row of spec Appendix B as `CardDef` (exact numbers, tags, canEat, copies; `text` = the PDF's ability/effect text, short). `src/data/params.ts`: the defaults in §3.1's comments. `src/data/interpretations.ts`: the §3.4 interface and an empty array.
- `src/index.css`: a minimal reset, imported from `src/main.tsx`.
- `src/App.tsx`: three tabs — Game, Ruleset editor, Interpretations. Holds `const [ruleset, setRuleset] = useState(loadRuleset)` (falls back to `defaultRuleset()` if `loadRuleset` throws) and renders `<GameScreen ruleset={ruleset} />`, `<EditorScreen ruleset={ruleset} onChange={r => { setRuleset(r); saveRuleset(r) }} />` (wrap saveRuleset in try/catch), `<InterpretationsScreen />`. The three screen files export placeholder components with exactly those props.
- `tests/acceptance/helpers.ts`: `testRuleset(overrides?)` builds a Ruleset from `src/data` with all event `copies` set to 0 unless overridden (keeps random draws from disturbing tests); `uidOf(state, defId, zone?)`; `give(state, player, defId)` that moves a matching deck card to the player's hand using the referee `moveCard` op.
- Frozen acceptance tests, one `describe` per spec §7 row, at the seams it names:
  - `tests/acceptance/engine.test.ts`: rows D1, D1 round flow, D1 food chain, D1 decomposition, D1 events, D1 win, D3 (purity), D6 (one test each for River Grass photosynthesis +1 C, Fast-Growing +1 C on play, Riparian Tree uneatable by primaries, Leaf Litter death → Fallen Leaf, Nutrient-Rich prey +1C+1N, Super Decomposer on unprocessed dead). Scenarios are arranged only through `newGame` + `referee` ops + actions, never by writing state fields directly.
  - `tests/acceptance/ruleset.test.ts`: rows D5 and D5 defaults (40 cards per deck; every Appendix B id present with its numbers spot-checked for 5 cards).
  - `tests/acceptance/interpretations.test.ts`: row D7 — ids `R1`–`R5`, `I1`–`I17` all present.
- Done when: `npm run typecheck` passes; `npm test` runs and the acceptance tests fail with `not implemented` (not crash on import); `npm run build` passes.

**Rejected:** acceptance tests building `GameState` objects by hand, because they would couple to engine internals instead of the `applyAction` seam.

## Wave 1

### T2 — Rules engine

**Design line:** implement `newGame`, `checkAction` and `applyAction` so the game in spec Appendix A plays correctly through the §3.2 seam.

- Interfaces: produces spec §3.2 exactly; consumes `Ruleset` only from its argument (never imports `src/data`).
- Implement every Appendix A line. `checkAction` and `applyAction` share one validation path so they never disagree. Ability handlers live in `src/engine/abilities.ts` keyed by `CardDef.id` (spec D6). Seeded RNG (e.g. mulberry32) stored in `rngState`.
- Referee `moveCard` keeps `PlayerState.deck/hand/discard` arrays and `GameState.center` consistent with `CardInstance.zone`; `endRound` runs the Environmental Phase immediately.
- Log a readable line for every action and every automatic effect (photosynthesis gains, upkeep payments, deaths, draws, events), e.g. "Round 2 (Night): P1's Caterpillar died — couldn't pay 1 O₂".
- A lane may add **optional** fields to `types.ts`; report them.
- Acceptance: frozen `tests/acceptance/engine.test.ts`; plus own cases in `tests/engine.lane.test.ts` for Drought, Heat Wave death, Flood choice with no organism (+1 P), Algal Bloom and Freshwater Snail prevention, Aquatic Worm processing in 1 round, bacterial bonus once per card per game, Consumer Specialization after 2 marks, Protected adaptation, empty-deck draw is a no-op.
- Edge cases: an illegal action returns state with only `lastError` changed; actions by the non-active player are illegal except `choose` for a pending choice addressed to them and `referee`; any action while `phase === 'gameOver'` except `referee` is illegal.

### T3 — Ruleset storage and the Interpretations list

**Design line:** make rulesets persist and travel as JSON files, and list every inferred rule for the group.

- Interfaces: implements spec §3.3 in `src/ruleset/index.ts` (keep `defaultRuleset` as T1 wrote it) and fills `interpretations` (§3.4) with one entry per Appendix A `[R*]`/`[I*]` tag, text a plain-English sentence a student can check against the PDF, `major: true` for R1–R5.
- localStorage key `envi-tcg.ruleset.v1`. `importRuleset` deep-fills missing params from defaults and missing optional card fields; keeps unknown fields.
- Acceptance: frozen `tests/acceptance/ruleset.test.ts`, `tests/acceptance/interpretations.test.ts`; own cases in `tests/ruleset.lane.test.ts`: `loadRuleset` with corrupt JSON in storage returns defaults; with no `localStorage` global returns defaults and `saveRuleset` doesn't throw; import with `version: 2` → `ok:false`.

### T4 — Visual design and art (Gemini)

**Design line:** give the app a look — design tokens, card frame layouts per card kind, and art — written down so the skin wave can apply it.

- Produces `src/ui/DESIGN.md` with status line `**Status:** iterating`: palette as CSS custom properties (light enough for a projector), type scale, card frame per kind (producer/consumer/detritivore/microbe/adaptation/event, matching the PDF's archetype colors: organisms orange, microbe pink, wild event green, evolution teal), how alive vs dead (sideways) vs processed and attached stacks look, the board layout (spec §5 list), Day/Night treatment, and 3–5 short animations (card play, death flip, nutrient gain tick, day/night transition, event reveal) with durations and easing.
- Art in `public/art/`: one SVG per card id in Appendix B (simple flat illustrations, consistent style, 300×420 viewBox not required — square art area is fine), plus `day.svg`, `night.svg`, `card-back.svg`, and icons `c.svg n.svg p.svg o2.svg`. Filenames `<card-id>.svg`.
- No code outside these paths. Acceptance: files exist; every Appendix B id has an SVG; DESIGN.md covers each bullet above (orchestrator review).

## Wave 2

### T5 — Game screen: board, actions, referee panel, log, undo

**Design line:** a hotseat screen that lets two players play a full match by dispatching engine actions, with a referee panel for every override.

- Interfaces: consumes `newGame`, `checkAction`, `applyAction` and types from `src/engine`; fills `src/ui/game/GameScreen.tsx` (props `{ ruleset: Ruleset }`, as T1 stubbed). `src/ui/useGame.ts`: `useGame(ruleset)` → `{ state, dispatch(action), undo(), redo(), canUndo, canRedo, newGame(seed?) }` holding a `GameState[]` history (undo disabled when `params.undoEnabled` is false). Shared small components (Card view, Pool bar, Toast) go in `src/ui/common/`.
- Everything in spec §5 "Board", "Status bar", "Actions", "Referee panel", "Log". Pass-the-device cover between turns hides the next hand until clicked. Disabled controls show `checkAction`'s reason as a tooltip; `lastError` shows as a toast.
- Plain CSS classes with semantic names (`card`, `card--dead`, `zone-field`, …) so T8 can skin without restructuring; no styling library.
- Acceptance: given a new game, when players play cards, eat, assign detritivores, decompose, and end turns until someone wins, then every step is doable by clicking with no console errors (orchestrator smoke run with Playwright); Undo restores the prior board; every RefereeOp is reachable from the panel.

### T6 — Ruleset editor and Interpretations screen

**Design line:** let non-programmers change every card number and param, and share the result as a file.

- Interfaces: fills `src/ui/editor/EditorScreen.tsx` (props `{ ruleset, onChange(r) }`) and `src/ui/interpretations/InterpretationsScreen.tsx`; consumes `exportRuleset`, `importRuleset`, `defaultRuleset` and `interpretations`.
- Editor: a table of cards (name, all numeric fields, tags and canEat as comma lists, copies, text), a params form (nested `startingPool`, `winThreshold`, `fallenLeaves`), ruleset name, buttons Export (downloads `<name>.envi-tcg.json`), Import (file picker; shows the error on `ok:false`), Reset to defaults (confirm first). Shows the deck total (Σ copies). Banner "Changes apply when you start a new game".
- Interpretations: list with major items first under "Questions for the rule authors", then the rest.
- Acceptance: editing a number calls `onChange` with a ruleset differing only in that field; Export then Import of the same file yields an equal ruleset; importing a bad file shows the error and keeps the current ruleset (orchestrator smoke run).

### T7 — GitHub Pages deploy workflow and README

**Design line:** every push to `main` publishes the app at the repo's Pages URL.

`.github/workflows/pages.yml` exactly:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

`README.md`: one paragraph on what the app is, the play link `https://gioacupan.github.io/envi-tcg/`, how to run locally (`npm install`, `npm run dev`), how to share a tuned ruleset (Export/Import), and that rules come from `docs/TCG_DRAFT.pdf`.

## Wave 3

### T8 — Apply the design skin and animations

**Design line:** make the working UI look and move the way `src/ui/DESIGN.md` describes, without changing behavior.

- Applies DESIGN.md tokens in `src/index.css` (T1 creates it as a minimal reset and imports it from `src/main.tsx`), card frames per kind using `public/art/<id>.svg` (fall back to a kind icon when missing), and the listed animations with CSS transitions/keyframes; respects `prefers-reduced-motion`.
- Must not change any `dispatch` call, engine import, or component prop interface; class names may be added.
- Acceptance: `checks` stay green; orchestrator screenshots the board in Day and Night with alive, dead and attached cards and compares against DESIGN.md; a full match still plays.
