# envi-tcg Visual Design System ("Riparian Field Guide")

**Status:** iterating

## 1. Aesthetic Direction & Projector Constraints

**Theme:** *Freshwater & Riparian Naturalist's Field Notebook*.
Designed for a university environmental-science group playing hotseat playtests, **primarily on a tablet** (the rule author's device, landscape and portrait), also on desktop or a classroom projector, and usable on a phone. The interface evokes a printed ecological field guide and herbarium ledger: warm archival paper surfaces, crisp botanical ink linework, stamped archetype headers, and high-contrast tabular numerals.

**Core Visual Principles:**
- **Cards are the focus.** The whole playmat (both fields, the shared center, the active hand) fits one viewport with no page scroll. Status chrome is a slim dark strip at each edge; everything else (log, referee, undo/redo, new game, other screens) sits in a drawer. See §7.
- **Projector-First Legibility:** Classroom projectors wash out subtle grays, dark-mode blacks, and low-contrast pastels. All surfaces remain light and warm (even in Night mode, which uses a cool moonlight slate-wash rather than pitch black) with dark ink text (`>= 7:1` contrast) and bold `1.5px–2px` borders.
- **Glanceable board faces, readable closeups:** Board and hand cards scale with the screen (about `100–180px` wide on tablets) and show only what you scan for: cost, archetype, name, art, O₂, lifespan and stored nutrients. Rules text, tags and everything else live in the tap-to-open closeup (§7.2), which renders the same face at `~300–400px` wide.
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
  /* --card-width/--card-height and the compact pair are legacy: game cards are sized per zone (§7.1). */
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

**Card type scales with the card.** Every card face (`.cf`) is a `container-type: inline-size` box, so its type is set in `cqi` (percent of the card's own width) and grows or shrinks with the card:
- **Board/hand face:** name `10.5cqi` (min `10px`) bold `--font-display`, max 2 lines; header and stat numerals `8.6–9cqi` (min `9px`), `800` weight, `tabular-nums`. At a typical tablet card width of `~120px` that is a `~12.5px` name.
- **Closeup face (`.cf--full`):** name `8cqi`, stats `5.4cqi`, rules text `5.2cqi` (`~16px` at `300px` wide), `line-height: 1.3`.
- HUD numerals stay in `rem` (`1rem` pools, `0.72rem` win targets).

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

One component, `CardFace` (`src/ui/common/Card.tsx`), draws every card. Upright faces keep a `5 / 7` box with `2px` archetype-colored border, `border-radius: var(--card-radius)` and `box-shadow: var(--shadow-card)`, and fill whatever slot they are given. The board face is the top four bands; the closeup (`full`) adds the last two and a `4 / 3` art window.

```
+----------------------------+
| [C 2][N 1]        [PLANT]  |  <- cost & archetype strip (full: "PLANT · TL1")
| River Grass ⭐             |  <- name, max 2 lines; ⭐ when adapted/specialized
| +------------------------+ |
| |  public/art/<id>.svg   | |  <- art; flexes to fill the remaining height on the board
| +------------------------+ |
| [☀ +2] [⏳ 4]   [C 2 N 1]  |  <- O₂ made (dim at Night) or O₂ upkeep (teal at Night), lifespan left, stored (board only)
| plant • aquatic · Eats: …  |  <- closeup only
| +1 C when photosynthesizing|  <- closeup only
+----------------------------+
```

### Archetype Color Coding (Per PDF p.1)

1. **Organism Cards (`kind: 'producer' | 'consumer' | 'detritivore'`):**
   - **Shared Archetype Frame:** Warm Terracotta Orange header (`--arch-organism-header: #C85A17`), warm cream body (`--arch-organism-bg: #FDF3EB`), `--arch-organism-border: #9E420B`.
   - **Subtype Distinction Pill (top-right of header):**
     - **Producer (`producer`):** Forest green pill (`--arch-producer-badge: #2E6F40`) reading `PLANT` or `ALGAE` on the board; the closeup adds `TL1`. Stat strip shows Day O₂ production and lifespan.
     - **Consumer (`consumer`):** Rust red pill (`--arch-consumer-badge: #B83B2A`) reading `TL2`, `TL3`, or `TL4` on the board; the closeup adds the full subtype. Stat strip shows O₂ upkeep and lifespan. Diet appears on the full face; specialization marks appear in the closeup facts.
     - **Detritivore (`detritivore`):** Benthic umber pill (`--arch-detritivore-badge: #7C4D25`) reading `SHREDDER`, `COLLECTOR`, or `GRAZER`. Stat strip shows `🫁 -X O₂/r` and `⏳ X`.
2. **Microbe Cards (`kind: 'microbe'`):**
   - **Frame:** Spore Rose Pink header (`--arch-microbe-header: #A83868`), pale rose body (`--arch-microbe-bg: #FCF0F5`), `--arch-microbe-border: #7D234A`.
   - **Header Pill:** `FUNGI` or `BACT.` on the board; the closeup spells out `BACTERIA`. Zero-resource cards show the configured play AP cost.
   - **Bonus Fact:** The closeup of field bacteria shows `Bonus: Ready` or `Used` based on `flags.bacterialBonusUsed`.
3. **Wild Event Cards (`kind: 'event'`):**
   - **Frame:** Riparian Moss Green header (`--arch-event-header: #3A7537`), sage-tinted body (`--arch-event-bg: #EFF7EE`), double outer border (`--arch-event-border: #255223`).
   - **Header Pill:** `EVENT` on the board, `WILD EVENT` in the closeup, with `0 AP` cost.
4. **Evolution / Adaptation Cards (`kind: 'adaptation'`):**
   - **Frame:** Verdigris Teal header (`--arch-adaptation-header: #1F6E7A`), pale aqua-ivory body (`--arch-adaptation-bg: #EDF7F8`), `--arch-adaptation-border: #144B54`.
   - **Header Pill:** `ADAPT` on the board, `ADAPTATION` in the closeup, with C/N cost badges. The closeup facts also show AP cost.
5. **Token Cards (`kind: 'token'`, e.g., `fallen-leaf`):**
   - **Frame:** Dry Leaf Kraft (`--arch-token-header: #7A5835`), dashed `2px` border. Fallen Leaves start dead, so in the center they use the sideways face (§6 B) with stored `C 1` upright.

---

## 6. Card States on the Board (Alive, Dead, Processed, Attached)

Per PDF p.3 `(C.2, C.3, C.4)`, physical orientation and stacking communicate ecosystem nutrient flow at a glance:

### A. Alive (`.cf--alive`)
- **Orientation:** Upright, portrait slot.
- **Visuals:** Full-color art, solid archetype border, lifespan pill (`⏳ 3`) and the stored-nutrient pill (`C 2 N 1`, right-aligned) showing `card.stored`.
- **Upgraded (`card.adaptations.length > 0` or `card.specialized`):** Gold `⭐` after the name and a gold inner ring (`--arch-special-star`).

### B. Dead / Decaying Matter (`.cf--dead`) — sideways, text upright
- **Orientation (rule C.2):** The slot turns landscape (`.slot--side`: width = card height, height = card width), so the card reads as turned sideways without overlapping neighbors. It is drawn as its own landscape face (`.cf--side`), **not** a rotated portrait card. Only the archetype band on the left (`.cf__band`, `writing-mode: vertical-rl`) runs sideways; the **name, status stamp and stored nutrients stay upright** (this fixes the earlier unreadable rotated text).
- **Visuals:** `--bg-card-dead` surface, `2px dashed #6B5B45` border, art desaturated (`grayscale(0.65) sepia(0.25) contrast(0.9)`), red **`DEAD`** stamp. While a detritivore works it, the stamp is amber **`PROC 2r`** (full text in the closeup: "Processing by Aquatic Worm, 2 rounds left").
- **Entering:** `@keyframes side-in` turns the face from `rotate(-90deg)` to level (§9).

### C. Processed Detritus (`.cf--processed`)
- Same sideways face on `--bg-card-processed`, `3px double #5C3A21` border, green **`PROCESSED`** stamp. Shredded (`flags.shredded`) shows as a fact in the closeup.

### D. Attached Cards (prey, adaptations; rule C.3/C.4)
- On the board, attached cards peek out as up to three offset slivers behind the host's top-right edge (`.slot__peek`, colored by the attached card's archetype), plus a count badge centered on the top edge (`.slot__badge`: `⭐1` adaptations, `+2` other attached cards). This keeps every slot the same height.
- The closeup lists every attached card (thumbnail, name, stored nutrients). Tapping one opens its own closeup; an attached card's closeup links back to its host ("Under").

---

## 7. Board Layout & Screen Architecture (Spec §5)

Patterns come from mobile digital card games (Hearthstone, Yu-Gi-Oh! Duel Links / Master Duel, Pokémon TCG Pocket, Marvel Snap, LoR): the board fills the screen, chrome sits at the edges, the hand runs along the bottom, and tapping a card opens a large readable view.

The game screen (`.game`) is one `100dvh` grid with no page scroll. The **viewing player** (the active player, or whoever owes a pending choice) is always at the bottom, so the board flips between hotseat turns behind the pass-the-device cover.

```
+------------------------------------------------------------------------+
| [☰] [↶] | Player 2 ●●○  C 11/50  N 4/15  P 0/2  O₂ 6      🂠28 ✋5 🗑3  |  <- .bar--top: menu, undo, opponent HUD
+------------------------------------------------------------------------+
|            opponent field (.zone--opponent, compact)                   |  0.90fr
+------------------+----------------------------------+------------------+
| ☾ Round 2 · Night|  shared center (.zone--center)   | ⚡2 effects       |  0.58fr
| Player 1's turn  |  Fallen Leaves, sideways         | 📜 last log line  |
+------------------+----------------------------------+------------------+
|            my field (.zone--mine)                                      |  1.12fr
+------------------------------------------------------------+-----------+
| Player 1 ●●●  C 14/50  N 5/15  P 1/2  O₂ 9       🂠26 🗑4  | END TURN  |  <- .bar--bottom (thumb zone)
+------------------------------------------------------------+-----------+
|            my hand (.zone--hand): overlapping row, up to 10+ cards      |  1.05fr
+------------------------------------------------------------------------+
```

### 7.1 Card sizing (`src/ui/game/game.css`, "Zones & card sizing")
- Every zone is a CSS size container (`container-type: size`). The zone sets `--n`, `--n-up` and `--n-side` (card counts) inline; each `.slot` computes its card height `--ch` as the smallest of: the zone height minus padding, the height at which all cards fit side by side (never below `--ch-min`), and `--ch-max`. Width is `--ch × 0.714` (5/7), or `--ch` for a sideways slot.
- When cards do not fit even at `--ch-min`, the margin between slots goes negative and cards **overlap** (later cards on top) instead of scrolling. The hand uses a larger minimum (`clamp(110px, 18vw, 150px)`), so a full hand fans out like a held hand rather than shrinking.
- Caps: opponent `190px`, my field `230px`, center `150px`, hand `250px` tall.

### 7.2 Card closeup (`CardCloseup.tsx`)
A sheet over the board, dimmed by a `rgba(20,28,22,.62)` backdrop. Landscape: the large card face on the left, info on the right. Portrait or `< 760px` wide: the card on top, info below, and the sheet scrolls inside itself if needed. Contents:
- the **full card face** (art, name, archetype/subtype, costs, O₂ made or upkeep, lifespan left, stored, tags, diet, rules text, status stamp);
- the card's **actions as large buttons**: hand cards get Play card / Play event, Play on a target…, Discard & draw. Living field cards get Eat…, Assign to dead matter…, Decompose…. The button for each targeted action shows how many valid targets exist. Any action `checkAction` rejects stays visible but disabled, with the engine's reason printed under it (never hover-only). While a pending choice is open, the only action shown is **Choose this organism**, on options;
- a **facts list**: cost incl. AP, O₂, lifespan "3 of 4 rounds left", stored C/N/P/O₂, processing (by whom, rounds left), working on, marks/specialized, bacteria bonus, shredded, "Under" (host link), adaptations ⭐;
- **attached cards**, each opening its own closeup.
Escape, a backdrop tap or the 44px × button closes it; focus returns to the card.

### 7.3 Interaction model
| Input | Normal | While picking a target |
| --- | --- | --- |
| Tap / click a card | Open its closeup | Lit card: perform the action. Unlit card: toast with checkAction's reason. Source card: cancel. Hand card: cancel and open its closeup |
| Long-press (450 ms, touch) | Open its closeup | Open the closeup (inspect only); a lit card's closeup offers "Choose as target for X" |
| Right-click / context-menu key | Open its closeup | Same as long-press |
| Escape | Close the sheet | Cancel targeting |
- **Targeting:** choosing a targeted action closes the closeup and lights the valid targets, i.e. every board card whose action `checkAction` accepts (`.is-target`: green ring, pulse). Everything else dims (`.is-dim`) and the source card gets a gold ring. A prompt replaces the bottom bar ("Eat · Frog: tap its prey (2 lit)") with **Cancel** where End turn was.
- **Pending choices (Flood):** options are lit and the prompt takes over the bottom bar. A tap only opens the closeup, whose primary button commits, because these choices arrive unasked. With no options, the prompt shows a Continue button.
- Hover is decoration only (a small lift in the hand, a deeper shadow on the board) and never raises a card above its neighbors, so overlapped hand strips stay tappable. There are no hover-only controls.
- Touch targets are ≥ 44px (icon buttons, End turn 48px, closeup actions 50px). Cards set `touch-action: manipulation` and disable the iOS callout and text selection so a long-press is not hijacked.

### 7.4 Chrome
1. **HUD strips (`Hud`, `--bg-header`):** name, AP pips (gold, filled = left), one pill per nutrient with its icon, value, `/target` and a 3px progress underline toward `params.winThreshold` (O₂ has no target), then pile counts (deck, opponent hand, discard). A gold inset ring marks the active player. Values pulse with `nutrient-tick` when they change.
2. **Center strip:** turn indicator (day/night emblem, round, whose turn); the shared zone; a log button showing modifier count and the latest log line (draws stay private), which opens the Log tab.
3. **Drawer (`Sheet drawer`, right edge, 440px):** tabs **Match** (round, ruleset, seed, Undo/Redo, environmental effects, New game with seed, links to the other screens), **Log** (newest first) and **Referee** (`RefereePanel`, every `RefereeOp`; logic unchanged). Undo also has a top-bar icon and a button on the pass-device cover.
4. **Pass-the-device cover (`.pass-device`):** full-screen, fixed, dark. Until the viewing player taps "I'm Player N: reveal my hand", the hand, closeups and prompts are not mounted.
5. **Game over:** the hand area shows the result with "Review log" and "New game…".
6. **Toast (`.toast`):** engine errors and targeting hints float under the top bar; they never push the layout.
7. **Screens:** `App.tsx` routes by URL hash (`#editor`, `#interpretations`; no hash = game). The game screen has no app bar and stays mounted (hidden) while another screen is open, so a match survives a trip to the editor. The other screens get a slim app bar with links back.

### 7.5 Responsive breakpoints
| Condition | Changes |
| --- | --- |
| default (tablet landscape 1024–1180 × 768–820, desktop 1440 × 900) | layout above; center columns `minmax(130px, 21%) · 1fr · minmax(90px, 19%)` |
| `orientation: portrait` or `max-width: 760px` | closeup stacks vertically (card `min(64vw, 46dvh × 5/7, 340px)` wide) and hides its duplicate heading |
| `max-width: 640px` (phone portrait) | tighter HUD (win targets hidden, progress underline kept), the log column collapses to a 46px 📜 button, smaller turn text and no emblem |
| `max-height: 560px` (phone landscape) | smaller paddings, `--ch-min: 48px`, 40px HUD rows; usable but cramped |
Verified with no page scroll (`scrollHeight ≤ innerHeight`) at 1180×820, 1024×768, 820×1180, 768×1024, 1440×900, 390×844 and 844×390.

### 7.6 Other screens
- **Ruleset Editor (`EditorScreen`) & Interpretations (`InterpretationsScreen`):** unchanged ordinary scrolling pages under the slim app bar.
   - **Editor:** Ledger-style spreadsheet table of all `CardDef` rows (inline numeric inputs with `tabular-nums`, comma-separated tags/canEat, rules text, copies counter with live `Σ copies = 40` badge) + `Params` form + top action bar (`Export .envi-tcg.json`, `Import`, `Reset to Defaults`) and persistent amber banner `"Changes apply when you start a new game"`.
   - **Interpretations:** Clean two-section reference sheet: **"Questions for the Rule Authors (Major — R1 to R5)"** in highlighted callout cards at top, followed by **"Minor Inferences (I1 to I17)"** below.

---

## 8. Day / Night Visual Treatment

The Day/Night cycle is the heartbeat of the game (Photosynthesis on Day rounds, O₂ upkeep pressure on Night rounds).

| Aspect | Day (`isDay: true`) | Night (`isDay: false`) |
| --- | --- | --- |
| **HUD strips** | Forest Pine `#233127` (`--bg-header`); center strip shows the golden sun (`day.svg`) | Midnight Indigo `#162032`; silver crescent moon (`night.svg`) |
| **Board Paper** | Warm sunlit herbarium parchment (`#F5EFE2` / `#ECE3D0`) | Cool moonlight slate-parchment (`#DCE3EC` / `#CFD8E4`) — stays light for projectors |
| **Producer O₂ pill** | `☀ +O₂` pill with an amber border | Pill dims (`opacity: 0.5`): no photosynthesis this round |
| **Upkeep pill** | Plain `O₂ −n` pill on non-producers | Pill turns solid teal (`--nutrient-o2-bg`) to emphasize Night respiration |

---

## 9. Motion & Micro-Animations (Wave 3 Specification)

All animations use pure CSS keyframes/transitions, keep durations under `450ms` so hotseat play feels snappy, and disable cleanly under `@media (prefers-reduced-motion: reduce)`.

### 1. Card Play Stamp (`@keyframes card-play`)
- **Trigger:** A slot mounts in a field zone (`.zone--field .slot`), e.g. a card played from hand.
- **Timing:** `260ms cubic-bezier(0.22, 1, 0.36, 1)`
- **Effect:** Card scales from `1.08` → `1.0` and translates `Y(-14px)` → `Y(0)` while its ink drop-shadow settles from `6px 10px 0` to `2px 3px 0`, mimicking a field specimen card being stamped onto the table.

### 2. Sideways Turn (`@keyframes side-in`, `game.css`)
- **Trigger:** A sideways face mounts (a card dies or is processed).
- **Timing:** `380ms cubic-bezier(0.34, 1.56, 0.64, 1)`
- **Effect:** The landscape face starts at `rotate(-90deg) scale(0.8)`, i.e. looking like the upright card, and settles level, so the card visibly turns sideways. Its text ends upright. (`card-death-turn` in `index.css` is unused.)

### 2b. Target Pulse (`@keyframes target-pulse`) and sheets (`fade-in`, `slide-in`)
- Lit targets pulse a green ring every `1.1s` (one pulse under reduced motion). The backdrop fades in over `140ms`; the drawer slides in from the right over `180ms`.

### 3. Nutrient Gain Tick (`@keyframes nutrient-tick`)
- **Trigger:** Any value in `player.pool` (`C`, `N`, `P`, `O₂`) changes; the HUD pill replays the tick.
- **Timing:** `320ms cubic-bezier(0.16, 1, 0.3, 1)`
- **Effect:** The changed nutrient pill pulses `scale(1)` → `scale(1.24)` → `scale(1)` with a brief warm gold ring (`box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.45)`), drawing classroom attention to photosynthesis O₂ gains or decomposition payouts.

### 4. Day / Night Cycle Shift (`transition` on `.game`, zones and HUDs)
- **Trigger:** `state.isDay` flips at the start of a new round.
- **Timing:** `450ms ease-in-out`
- **Effect:** Background paper tokens (`--bg-canvas`, `--bg-board`, `--bg-header`) cross-fade smoothly while the center strip's cycle emblem (`day.svg` / `night.svg`) rotates in (`rotate(-45deg) scale(0.7)` → `rotate(0deg) scale(1)` over `360ms cubic-bezier(0.22, 1, 0.36, 1)`).

### 5. Wild Event Reveal (`@keyframes event-reveal`) — defined in `index.css`, not currently used
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
