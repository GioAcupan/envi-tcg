# envi-tcg Visual Design System ("Riparian Field Guide")

**Status:** iterating

## 1. Aesthetic Direction & Projector Constraints

**Theme:** *Freshwater & Riparian Naturalist's Field Notebook*.
Designed for a university environmental-science group projecting hotseat playtests in a bright classroom or viewing on laptops. The interface evokes a printed ecological field guide and herbarium ledger: warm archival paper surfaces, crisp botanical ink linework, stamped archetype headers, and high-contrast tabular numerals.

**Core Visual Principles:**
- **Projector-First Legibility:** Classroom projectors wash out subtle grays, dark-mode blacks, and low-contrast pastels. All surfaces remain light and warm (even in Night mode, which uses a cool moonlight slate-wash rather than pitch black) with dark ink text (`>= 7:1` contrast) and bold `1.5px–2px` borders.
- **Readable at `~160px` Card Width:** On a dense board with up to 10–12 cards in play, cards render at `160px` wide (`224px` tall). Cost badges, trophic level markers, O₂ production/upkeep, and lifespan counters use oversized tabular numerals (`14px–18px` bold) that can be read from the back row of a classroom.
- **Colorblind & Projector-Safe Nutrient Coding:** Every nutrient (`C`, `N`, `P`, `O₂`) has both a dedicated pigment and an unmistakable geometric silhouette (`c.svg` hexagon, `n.svg` diamond, `p.svg` triangle prism, `o2.svg` paired bubbles).
- **Anti-Slop Rules:** Zero purple/neon gradients, zero glassmorphism (`backdrop-filter: blur`), zero generic sci-fi glow effects. Depth is communicated via crisp ink borders, paper-stack offsets (`2px 3px 0` solid ink shadows), and physical card orientation.

---

## 2. Design Tokens (CSS Custom Properties)

Wave 3 (`src/index.css`) must define these tokens on `:root` and scope Night overrides to `[data-cycle="night"]` (or `.game-shell--night`).

```css
:root {
  /* === Surfaces (Day / Default Archival Paper) === */
  --bg-canvas: #F5EFE2;          /* Warm herbarium sheet background */
  --bg-board: #ECE3D0;           /* Riparian table mat */
  --bg-zone-player: #E4DBC6;     /* Active player field mat */
  --bg-zone-opponent: #DFE5E2;   /* Opponent field mat (subtle cool river tint) */
  --bg-zone-center: #E8DEC8;     /* Shared center (Fallen Leaves FFA) */
  --bg-card: #FCF9F2;            /* Card face ivory paper */
  --bg-card-dead: #EAE3D5;       /* Desaturated decaying card surface */
  --bg-card-processed: #E2D5C1;  /* Humus-tinted processed detritus surface */
  --bg-panel: #FAF5E8;           /* Drawers, editor tables, referee panel */
  --bg-header: #233127;          /* Deep forest ink top status bar */

  /* === Ink & Borders === */
  --ink-primary: #1B221B;        /* Main botanical ink text & linework */
  --ink-secondary: #434E44;      /* Subtitles, tags, secondary labels */
  --ink-muted: #6B766C;          /* Disabled text, empty slot hints */
  --ink-on-dark: #F7F3E8;        /* Text inside dark header / archetype bars */
  --border-ink: #2A332B;         /* Standard 1.5px–2px card & panel border */
  --border-subtle: #C6BCA6;      /* Table grid lines & empty card slots */
  --shadow-card: 2px 3px 0px #2A332B;
  --shadow-card-hover: 4px 6px 0px #1B221B;
  --shadow-modal: 6px 8px 0px #1B221B;

  /* === PDF Archetype Palette (Matches docs/TCG_DRAFT.pdf p.1) === */
  /* 1. Organisms (Producers, Consumers, Detritivores) — Warm Ochre / Terracotta Orange */
  --arch-organism-header: #C85A17;
  --arch-organism-bg: #FDF3EB;
  --arch-organism-border: #9E420B;
  --arch-producer-badge: #2E6F40;    /* Subtype accent: Photosynthetic Leaf Green */
  --arch-consumer-badge: #B83B2A;    /* Subtype accent: Predatory Rust Red */
  --arch-detritivore-badge: #7C4D25; /* Subtype accent: Benthic Umber Brown */

  /* 2. Microbes (Fungi & Bacteria) — Spore Rose / Magenta Pink */
  --arch-microbe-header: #A83868;
  --arch-microbe-bg: #FCF0F5;
  --arch-microbe-border: #7D234A;

  /* 3. Wild Events — Riparian Moss / Sage Green */
  --arch-event-header: #3A7537;
  --arch-event-bg: #EFF7EE;
  --arch-event-border: #255223;

  /* 4. Evolution / Adaptation — Verdigris / Slate Teal */
  --arch-adaptation-header: #1F6E7A;
  --arch-adaptation-bg: #EDF7F8;
  --arch-adaptation-border: #144B54;
  --arch-special-star: #D9820B;      /* Gold ⭐ indicator for upgraded organisms */

  /* 5. Tokens (Fallen Leaf) — Dry Leaf Kraft */
  --arch-token-header: #7A5835;
  --arch-token-bg: #F5EDE0;
  --arch-token-border: #5C4024;

  /* === Nutrient Tokens (Shape + High-Contrast Color) === */
  --nutrient-c-bg: #2E3D30;      /* Carbon (C) — Humic Charcoal Green (Hexagon) */
  --nutrient-c-fg: #FAF6EC;
  --nutrient-n-bg: #1E5AA8;      /* Nitrogen (N) — Cobalt Blue (Diamond) */
  --nutrient-n-fg: #FFFFFF;
  --nutrient-p-bg: #C6690A;      /* Phosphorus (P) — Mineral Amber Ochre (Triangle) */
  --nutrient-p-fg: #FFFFFF;
  --nutrient-o2-bg: #0D7A8A;     /* Oxygen (O₂) — Aerated Cyan-Teal (Double Bubble) */
  --nutrient-o2-fg: #FFFFFF;

  /* === Semantic Status Colors === */
  --status-ok: #2A6F37;
  --status-warn: #B8620A;
  --status-danger: #B42318;
  --status-ap: #C85A17;          /* Action Point pips */

  /* === Layout & Geometry === */
  --card-width: 160px;
  --card-height: 224px;
  --card-width-compact: 136px;
  --card-height-compact: 190px;
  --card-radius: 8px;
  --stack-offset-y: 26px;        /* Vertical peek distance for attached cards */
  --stack-offset-x: 6px;
}

/* === Night Cycle Overrides (Projector-Safe Moonlight Wash) === */
[data-cycle="night"],
.game-shell--night {
  --bg-canvas: #DCE3EC;          /* Cool nocturnal field-station wash */
  --bg-board: #CFD8E4;
  --bg-zone-player: #C5D0DF;
  --bg-zone-opponent: #C9D3E0;
  --bg-zone-center: #D4DCE7;
  --bg-header: #162032;          /* Deep midnight indigo status bar */
  --border-subtle: #9AA8BC;
}
```

---

## 3. Typography & Projector Type Scale

All numeric counters (costs, pools, lifespans, round numbers, editor inputs) **must** set `font-variant-numeric: tabular-nums` so numbers never jitter when incremented or ticked.

```css
:root {
  --font-display: 'Georgia', 'Cambria', 'Times New Roman', serif;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;

  /* Type Scale */
  --text-xs: 0.75rem;    /* 12px — Card tags, subtype labels, log timestamps */
  --text-sm: 0.8125rem;  /* 13px — Card ability rules text (line-height: 1.25) */
  --text-base: 0.9375rem;/* 15px — Card title (bold), buttons, editor table cells */
  --text-lg: 1.125rem;   /* 18px — Card cost numerals, stat strip numerals, zone titles */
  --text-xl: 1.375rem;   /* 22px — Status bar nutrient pool counters, Round/Cycle title */
  --text-2xl: 1.75rem;   /* 28px — Pass-the-device banner, Winner announcement, Event splash */
}
```

**Projector Rules for Card Text (`160px` card width):**
- **Card Name (`.card__title`):** `14px` (`0.875rem`) bold `--font-display`, tight `1.15` line-height, max 2 lines.
- **Card Cost & Stat Numerals (`.card__cost-val`, `.card__stat-val`):** `16px–18px` (`1rem–1.125rem`) `800` weight `--font-sans` with `tabular-nums`.
- **Card Ability Text (`.card__text`):** `12.5px` (`0.78rem`) `--font-sans`, `font-weight: 500`, `line-height: 1.22`, dark `--ink-primary` on high-contrast `--bg-card`. Never smaller than `12px`.

---

## 4. Nutrient & Cycle Iconography (`public/art/`)

Every resource icon is an SVG in `public/art/` designed with a distinct outer shape AND interior symbol so players can distinguish them without relying on color alone:

| Icon File | Resource | Outer Silhouette | Interior Glyph | Color Token |
| --- | --- | --- | --- | --- |
| `public/art/c.svg` | **Carbon (`C`)** | Hexagon (6-sided organic ring) | Bold `C` + ring bond lines | `--nutrient-c-bg` (`#2E3D30`) |
| `public/art/n.svg` | **Nitrogen (`N`)** | Diamond (rotated 45° square) | Bold `N` + leaf-vein chevrons | `--nutrient-n-bg` (`#1E5AA8`) |
| `public/art/p.svg` | **Phosphorus (`P`)** | Upward Triangle / Mineral Prism | Bold `P` + facet lines | `--nutrient-p-bg` (`#C6690A`) |
| `public/art/o2.svg` | **Oxygen (`O₂`)** | Paired Overlapping Circles (Bubbles) | Bold `O₂` + specular arc | `--nutrient-o2-bg` (`#0D7A8A`) |
| `public/art/day.svg` | **Day Cycle** | 8-ray Botanical Sun Disc | Warm golden disc & rays | `#D97706` / `#F59E0B` |
| `public/art/night.svg` | **Night Cycle** | Crescent Moon + 2 Field Stars | Pale silver-gold crescent | `#E2E8F0` / `#93C5FD` |
| `public/art/card-back.svg` | **Card Back** | Field-Guide Lattice & Compass Rose | River leaf + cycle emblem | `#233127` / `#D6C7A9` |

---

## 5. Card Frame Anatomy & Archetype Variants

All cards share a unified `160px × 224px` (`aspect-ratio: 5 / 7`) outer frame (`.card`) with `2px solid var(--border-ink)`, `border-radius: var(--card-radius)`, and `box-shadow: var(--shadow-card)`.

```
+---------------------------------------+
| [C:2] [N:1]   [PRODUCER • TL1]  [⭐]  |  <- Cost & Archetype/Trophic Strip (26px)
|---------------------------------------|
| River Grass                           |  <- Card Title Bar (24px)
|---------------------------------------|
|                                       |
|        +---------------------+        |
|        |   public/art/       |        |  <- Illustration Viewport (76px tall)
|        |   river-grass.svg   |        |     with subtle paper frame
|        +---------------------+        |
|                                       |
|---------------------------------------|
| [☀️ +2 O₂]   [⏳ 4/4]   [📦 2C 1N]    |  <- Vital Stats Bar (26px, tabular-nums)
|---------------------------------------|
| plant • aquatic                       |  <- Tags & Prey Strip (16px)
| +1 C when photosynthesizing.          |  <- Rules Text Box (56px, crisp ink)
+---------------------------------------+
```

### Archetype Color Coding (Per PDF p.1)

1. **Organism Cards (`kind: 'producer' | 'consumer' | 'detritivore'`):**
   - **Shared Archetype Frame:** Warm Terracotta Orange header (`--arch-organism-header: #C85A17`), warm cream body (`--arch-organism-bg: #FDF3EB`), `--arch-organism-border: #9E420B`.
   - **Subtype Distinction Pill (top-right of header):**
     - **Producer (`producer`):** Forest green pill (`--arch-producer-badge: #2E6F40`) reading `PLANT • TL1` or `ALGAE • TL1`. Stat strip shows `☀️ +X O₂` (Day production) and `⏳ X` (Lifespan).
     - **Consumer (`consumer`):** Rust red pill (`--arch-consumer-badge: #B83B2A`) reading `TL2 PRIMARY`, `TL3 SECONDARY`, or `TL4 TERTIARY`. Stat strip shows `🫁 -X O₂/r` (upkeep), `⏳ X` (Lifespan), and `🍴 Eats: <canEat>`. Shows specialization marks (`✦ 1/2`) when `marks > 0`.
     - **Detritivore (`detritivore`):** Benthic umber pill (`--arch-detritivore-badge: #7C4D25`) reading `SHREDDER`, `COLLECTOR`, or `GRAZER`. Stat strip shows `🫁 -X O₂/r` and `⏳ X`.
2. **Microbe Cards (`kind: 'microbe'`):**
   - **Frame:** Spore Rose Pink header (`--arch-microbe-header: #A83868`), pale rose body (`--arch-microbe-bg: #FCF0F5`), `--arch-microbe-border: #7D234A`.
   - **Header Pill:** `FUNGI` or `BACTERIA` + `1 AP`.
   - **State Badge:** Bacteria cards show a prominent `[+1 N BONUS READY]` or `[BONUS USED]` pill based on `flags.bacterialBonusUsed`.
3. **Wild Event Cards (`kind: 'event'`):**
   - **Frame:** Riparian Moss Green header (`--arch-event-header: #3A7537`), sage-tinted body (`--arch-event-bg: #EFF7EE`), double outer border (`--arch-event-border: #255223`).
   - **Header Pill:** `⚡ WILD EVENT • 0 AP`.
4. **Evolution / Adaptation Cards (`kind: 'adaptation'`):**
   - **Frame:** Verdigris Teal header (`--arch-adaptation-header: #1F6E7A`), pale aqua-ivory body (`--arch-adaptation-bg: #EDF7F8`), `--arch-adaptation-border: #144B54`.
   - **Header Pill:** `⭐ ADAPTATION` + cost badges (`2 C`, `1 N`, `1 AP`).
5. **Token Cards (`kind: 'token'`, e.g., `fallen-leaf`):**
   - **Frame:** Dry Leaf Kraft (`--arch-token-header: #7A5835`), dashed `2px` border, compact `136px × 190px` footprint in the Center zone, showing stored `1 C` clearly.

---

## 6. Card States on the Board (Alive, Dead, Processed, Attached)

Per PDF p.3 `(C.2, C.3, C.4)`, physical orientation and stacking communicate ecosystem nutrient flow at a glance:

### A. Alive (`.card--alive`)
- **Orientation:** Standing upright (`transform: rotate(0deg)`).
- **Visuals:** Full-color SVG illustration, crisp solid ink border, active lifespan pill (`⏳ 3`), and a bottom-right **Stored Biomass Pill** (`📦 2C 1N`) showing the exact `card.stored` nutrients currently locked inside the organism.
- **Upgraded (`card.adaptations.length > 0` or `card.specialized`):** Displays a bright gold star ribbon (`⭐ SPECIAL`) in the top corner and a warm gold inner border (`#D9820B`).

### B. Dead / Decaying Matter (`.card--dead`)
- **Orientation:** Turned sideways (`transform: rotate(90deg)`) inside a reserved square/landscape slot container (`.field-slot--sideways`, `width: 224px; height: 168px`) so rotating the card never overlaps neighbors.
- **Visuals:** Surface shifts to `--bg-card-dead`, artwork receives `filter: grayscale(0.65) sepia(0.25) contrast(0.9)`, border becomes dashed (`2px dashed #6B5B45`), and a high-contrast diagonal stamp across the art reads **`DEAD MATTER`** (or **`PROCESSING: 1r LEFT`** in amber when `card.processing` is active, naming the assigned detritivore).
- **Stored Biomass Pill:** Remains upright/counter-rotated (`transform: rotate(-90deg)` or anchored to the slot corner) so players can read `📦 3C 2N` without tilting their heads.

### C. Processed Detritus (`.card--processed`)
- **Orientation:** Remains sideways (`transform: rotate(90deg)`) in `.field-slot--sideways`.
- **Visuals:** Surface deepens to rich compost humus (`--bg-card-processed: #E2D5C1`), border becomes solid double-line umber (`3px double #5C3A21`), and the stamp across the art changes to a bright moss-green badge: **`✓ PROCESSED — READY FOR MICROBE`**.
- **Shredded Indicator:** If shredded by Freshwater Shrimp (`flags.shredded`), adds a warm gold sub-badge **`+1C +1N SHREDDED`** beside the stored biomass pill.

### D. Attached Card Stacks (`.card-stack` & `.card--attached`)
- **Rule Reference:** PDF p.3 `(C.3)` consumed prey stays below the consumer; `(C.4)` decaying matter / adaptations stay visible underneath the host card for tracking.
- **Layout Implementation:**
  - Every field card is wrapped in a `.card-stack` container (`position: relative; display: flex; flex-direction: column; align-items: center`).
  - Attached cards (`zone === 'attached'`, where `attachedTo === host.uid`) render **beneath** the host card in DOM order with lower `z-index`, shifted down by `--stack-offset-y: 26px` (and `4px` right) per attached card, or tucked above/below with their top header strip (`26px` tall: card name + `⭐` trait or consumed `📦 stored` nutrients) fully exposed.
  - Hovering or clicking a `.card-stack` fans the attached cards out (`--stack-offset-y: 54px`, transition `180ms ease-out`) so players can inspect every eaten prey or adaptation card in the stack.

---

## 7. Board Layout & Screen Architecture (Spec §5)

The application fits comfortably on a `1280×800` or `1920×1080` classroom projector without horizontal scrolling.

```
+--------------------------------------------------------------------------------------------------+
| [envi-tcg]  [Tab: Game] [Tab: Ruleset Editor] [Tab: Interpretations]      [Referee Panel] [Log]  |
+--------------------------------------------------------------------------------------------------+
| ROUND 2 • [☀️ DAY / 🌙 NIGHT]   | Active: Player 1 (3/3 AP ●●●) | Queued: [Heat Wave: Next Night]|
| P1 Pool: [C 14/50] [N 5/15] [P 1/2] [O₂ 9]    ||    P2 Pool: [C 11/50] [N 4/15] [P 0/2] [O₂ 6]  |
+--------------------------------------------------------------------------------------------------+
| OPPONENT FIELD (Player 2)                                          [Deck: 28] [Discard: 3] [Hand]|
|  +------------+   +------------+   +--------------------+                                        |
|  | Riparian   |   | Small Fish |   | [DEAD: Caterpillar]|                                        |
|  | Tree (TL1) |   | +1 prey    |   |  Sideways (90deg)  |                                        |
|  +------------+   +------------+   +--------------------+                                        |
+--------------------------------------------------------------------------------------------------+
| SHARED RIPARIAN CENTER (Fallen Leaves FFA & Active Events)                                       |
|  [🍂 Fallen Leaf (1C)] [🍂 Fallen Leaf (1C)] [🍂 Fallen Leaf (1C)]   ||  [Undo] [Redo] [END TURN]|
+--------------------------------------------------------------------------------------------------+
| ACTIVE PLAYER FIELD (Player 1)                                             [Deck: 26] [Discard: 4]|
|  +------------+   +--------------------+   +------------+                                        |
|  | River Grass|   | [PROCESSED: Leaf]  |   | Decomposer |                                        |
|  | + ⭐ O₂-Rich|   |  Sideways (90deg)  |   | Fungus     |                                        |
|  +------------+   +--------------------+   +------------+                                        |
+--------------------------------------------------------------------------------------------------+
| ACTIVE PLAYER HAND (Player 1) — Click card to play, or [Discard & Draw (1 AP)]                   |
|  +------------+   +------------+   +------------+   +------------+   +------------+              |
|  | Frog (TL3) |   | Aquatic    |   | Nutrient-  |   | Nitrogen   |   | Chironomid |              |
|  |            |   | Worm       |   | Rich ⭐     |   | Bacteria   |   | Larva      |              |
|  +------------+   +------------+   +------------+   +------------+   +------------+              |
+--------------------------------------------------------------------------------------------------+
```

### Key UI Regions (Spec §5 Checklist)
1. **Top Navigation & Status Bar (`.status-bar`):**
   - **Round & Cycle Badge:** Shows `Round N` and large `day.svg` or `night.svg` icon with label `DAY — Photosynthesis Active` or `NIGHT — Respiration Only`.
   - **Active Modifiers Strip:** High-visibility warning pills for any queued or active `state.modifiers` (e.g., `Drought (Next Day)`, `Heat Wave (Next Night: +1 O₂ upkeep)`, `Algal Bloom`).
   - **Dual Nutrient Pool Bars:** Side-by-side P1 and P2 panels showing `C`, `N`, `P`, and `O₂` icons (`c.svg`, `n.svg`, `p.svg`, `o2.svg`), large tabular numerals, and compact horizontal progress bars under `C` (`/50`), `N` (`/15`), and `P` (`/2`) toward `params.winThreshold`.
   - **AP Indicator:** Active player name + filled/empty lantern pips (`● ● ○ 2/3 AP`).
2. **Board Zones (`.board`):**
   - **Opponent Field (`.zone-field--opponent`)** & **Active Player Field (`.zone-field--active`):** Horizontal flex/grid rows with wrap, displaying upright alive stacks, sideways dead/processed slots, and right-aligned Deck (`card-back.svg` + count badge) and Discard pile counters.
   - **Shared Center (`.zone-center`):** Houses the shared `Fallen Leaf` tokens (`owner: null`) and central turn controls (`End Turn`, `Undo`, `Redo`).
   - **Active Hand Tray (`.zone-hand`):** Docked at the bottom for the active player. Selecting a card highlights valid board targets (`.card--valid-target`) and shows contextual action buttons (`Play (1 AP)`, `Discard & Draw (1 AP)`). Disabled actions remain visible with a dashed border and show `checkAction(state, action)`'s exact reason in a high-contrast tooltip on hover/focus.
   - **Pass-the-Device Privacy Screen (`.pass-device-overlay`):** Full-hand or full-board curtain shown between hotseat turns (`"Pass to Player 2 — Click to Reveal Hand"`) so the next player's hand is never exposed during turn transitions.
   - **Pending Choice Banner (`.choice-banner`):** When `state.phase === 'choice'` (e.g., `Flood`), highlights eligible organisms with a pulsing moss-green ring and presents the prompt (`state.pendingChoice.prompt`) and a `"No valid organism (+1 P)"` button when `options.length === 0`.
3. **Referee Panel (`.referee-drawer`):**
   - Toggleable slide-over or docked side panel exposing every `RefereeOp` without cluttering normal play:
     - **Player Controls:** Edit P1/P2 `C / N / P / O₂` pools (`setPool`), set `AP` (`setAp`), force `Draw 1` (`draw`), set Active Player (`setActivePlayer`).
     - **Environment Controls:** Toggle `Day / Night` (`setDayNight`), trigger `End Round / Environmental Phase` immediately (`endRound`).
     - **Card Inspector / Override:** Select any card by UID/name to change its `status` (`alive | dead | processed`), move it to any `zone` (`deck | hand | field | center | discard | removed`), or edit `lifespanLeft`, `marks`, and `stored` (`C/N/P/O₂`).
4. **Game Log Drawer (`.log-drawer`):**
   - Scrollable field-journal sidebar grouped by `Round N`, rendering every `LogEntry` in crisp monospace/sans text with color-coded round headers.
5. **Ruleset Editor (`EditorScreen`) & Interpretations (`InterpretationsScreen`):**
   - **Editor:** Ledger-style spreadsheet table of all `CardDef` rows (inline numeric inputs with `tabular-nums`, comma-separated tags/canEat, rules text, copies counter with live `Σ copies = 40` badge) + `Params` form + top action bar (`Export .envi-tcg.json`, `Import`, `Reset to Defaults`) and persistent amber banner `"Changes apply when you start a new game"`.
   - **Interpretations:** Clean two-section reference sheet: **"Questions for the Rule Authors (Major — R1 to R5)"** in highlighted callout cards at top, followed by **"Minor Inferences (I1 to I17)"** below.

---

## 8. Day / Night Visual Treatment

The Day/Night cycle is the heartbeat of the game (Photosynthesis on Day rounds, O₂ upkeep pressure on Night rounds).

| Aspect | Day (`isDay: true`) | Night (`isDay: false`) |
| --- | --- | --- |
| **Header Bar** | Forest Pine `#233127` with golden sun emblem (`day.svg`) | Midnight Indigo `#162032` with silver crescent moon (`night.svg`) |
| **Board Paper** | Warm sunlit herbarium parchment (`#F5EFE2` / `#ECE3D0`) | Cool moonlight slate-parchment (`#DCE3EC` / `#CFD8E4`) — stays light for projectors |
| **Producer Highlight** | Alive Producers show a subtle warm amber halo (`0 0 0 2px #EAB308`) on their `☀️ +O₂` badge | Producer `☀️ +O₂` badge dims (`opacity: 0.55`) to signal no photosynthesis this round |
| **Upkeep Emphasis** | Standard `🫁 -O₂/r` pill on non-producers | `🫁 -O₂/r` pill highlights in teal/amber (`#0D7A8A`) to emphasize Night respiration |

---

## 9. Motion & Micro-Animations (Wave 3 Specification)

All animations use pure CSS keyframes/transitions, keep durations under `450ms` so hotseat play feels snappy, and disable cleanly under `@media (prefers-reduced-motion: reduce)`.

### 1. Card Play Stamp (`@keyframes card-play`)
- **Trigger:** Card enters `.zone-field` or `.card-stack` from hand.
- **Timing:** `260ms cubic-bezier(0.22, 1, 0.36, 1)`
- **Effect:** Card scales from `1.08` → `1.0` and translates `Y(-14px)` → `Y(0)` while its ink drop-shadow settles from `6px 10px 0` to `2px 3px 0`, mimicking a field specimen card being stamped onto the table.

### 2. Death Flip / Sideways Turn (`@keyframes card-death-turn`)
- **Trigger:** Organism `status` changes from `'alive'` to `'dead'`.
- **Timing:** `380ms cubic-bezier(0.34, 1.56, 0.64, 1)`
- **Effect:** Card pivots smoothly from `rotate(0deg) scale(1.04)` to `rotate(90deg) scale(1)` while transitioning `filter` to desaturated sepia and stamping in the `.card__status-banner` (`DEAD MATTER`).

### 3. Nutrient Gain Tick (`@keyframes nutrient-tick`)
- **Trigger:** Any value in `player.pool` (`C`, `N`, `P`, `O₂`) or `card.stored` changes.
- **Timing:** `320ms cubic-bezier(0.16, 1, 0.3, 1)`
- **Effect:** The changed nutrient pill pulses `scale(1)` → `scale(1.24)` → `scale(1)` with a brief warm gold ring (`box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.45)`), drawing classroom attention to photosynthesis O₂ gains or decomposition payouts.

### 4. Day / Night Cycle Shift (`transition` on `.game-shell`)
- **Trigger:** `state.isDay` flips at the start of a new round.
- **Timing:** `450ms ease-in-out`
- **Effect:** Background paper tokens (`--bg-canvas`, `--bg-board`, `--bg-header`) cross-fade smoothly while the status bar cycle emblem (`day.svg` / `night.svg`) rotates in (`rotate(-45deg) scale(0.7)` → `rotate(0deg) scale(1)` over `360ms cubic-bezier(0.22, 1, 0.36, 1)`).

### 5. Wild Event Reveal (`@keyframes event-reveal`)
- **Trigger:** A Wild Event (`strong-rainfall`, `drought`, `heat-wave`, `flood`) is drawn or queued.
- **Timing:** `420ms cubic-bezier(0.22, 1, 0.36, 1)`
- **Effect:** Event banner/card scales from `0.85` → `1.03` → `1.0` in the center zone with an expanding sage-green ink ring (`0 0 0 0 rgba(58, 117, 55, 0.6)` → `0 0 0 12px rgba(58, 117, 55, 0)`).

### Reduced Motion Fallback
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. Asset Manifest (`public/art/`)

Every `CardDef.id` in Appendix B (38 cards) plus 7 UI/resource icons exists as a self-contained, viewBox-scaled (`viewBox="0 0 160 120"` for card illustrations; `viewBox="0 0 64 64"` for icons; `viewBox="0 0 200 280"` for `card-back.svg`) hand-crafted SVG under `< 6 KB` in `public/art/`:

- **Producers (8):** `leaf-litter-plant.svg`, `river-grass.svg`, `aquatic-plant.svg`, `riparian-tree.svg`, `fast-growing-plant.svg`, `green-algae.svg`, `diatom.svg`, `bloom-algae.svg`
- **Consumers (10):** `caterpillar.svg`, `zooplankton.svg`, `snail.svg`, `grasshopper.svg`, `small-fish.svg`, `frog.svg`, `predatory-insect.svg`, `large-fish.svg`, `water-snake.svg`, `heron.svg`
- **Detritivores (6):** `freshwater-shrimp.svg`, `aquatic-worm.svg`, `tubifex-worm.svg`, `chironomid-larva.svg`, `freshwater-snail.svg`, `aquatic-grazer.svg`
- **Microbes (4):** `decomposer-fungus.svg`, `nitrogen-bacteria.svg`, `phosphorus-bacteria.svg`, `super-decomposer.svg`
- **Adaptations (5):** `nutrient-rich-adaptation.svg`, `oxygen-rich-adaptation.svg`, `p-accumulator-adaptation.svg`, `consumer-specialization.svg`, `protected-adaptation.svg`
- **Wild Events (4):** `strong-rainfall.svg`, `drought.svg`, `heat-wave.svg`, `flood.svg`
- **Tokens (1):** `fallen-leaf.svg`
- **Icons & Cycle Assets (7):** `c.svg`, `n.svg`, `p.svg`, `o2.svg`, `day.svg`, `night.svg`, `card-back.svg`
