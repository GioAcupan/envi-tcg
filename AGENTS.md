# envi-tcg

## Purpose

A web app for prototyping a student-designed ecology trading card game: players simulate matches and tune game parameters. The game's rules are authored outside this repository; the current revision is [docs/UPDATE-2.pdf](docs/UPDATE-2.pdf), which replaces [docs/UPDATE-1.pdf](docs/UPDATE-1.pdf) and the first draft [docs/TCG_DRAFT.pdf](docs/TCG_DRAFT.pdf).

## Local contracts

- The game rules in the latest revision ([docs/UPDATE-2.pdf](docs/UPDATE-2.pdf)) are the source of truth for game behavior; the app implements them and never redefines them. Where the latest revision is silent or contradicts itself, the earlier revisions' behavior is carried over and every assumption is listed in [src/data/interpretations.ts](src/data/interpretations.ts), which the app shows on its Interpretations screen.
- The rules are a draft and their numbers change often (costs, lifespans, thresholds); each new revision arrives as a new `docs/UPDATE-<n>.pdf`.
- UPDATE-2 removed consumers and Evolution/Adaptation cards; the app has no eating, adaptations or evolution switch. A ruleset whose cards or params change shape bumps `Ruleset.version` and the localStorage key, so stale saved rulesets fall back to the defaults.

## Work guidance

- This is a throwaway prototype: optimize for a working, playable app as fast as possible. Prefer the simplest code that works over layered architecture, abstractions for future scale, or extensibility nobody asked for. TASTE.md applies only where it keeps the code readable, not where it adds structure.
- Major ambiguities in the rules go to the operator, who relays them to the rule authors; minor gaps are inferred and the inference is recorded.

## Child index

<!-- alley:begin v3 -->
## Alley workflow

This repository uses Alley. These rules apply to every task, whether or not Alley's hooks are running. Run Alley's CLI as the `- CLI:` line of Alley's session note shows, or as `node "<Alley plugin root>/core/alley.mjs" <command>`, where the plugin root is two folders above any `alley-*` skill's `SKILL.md`.

- **Before editing a file,** run `context preview <file>` and follow the rules and lessons it prints.
- **Before changing a file,** run `graph impact <file>` to see what depends on it.
- **Before creating a function, module or helper,** run `graph query "<what it does>"`, and reuse or extend what already exists.
- **Edit AGENTS.md directly when planning or scaffolding;** while coding, record lessons instead.
- **Never edit TASTE.md directly;** propose it with `proposal create TASTE.md --from <new text file> --reason "<why>"`.
- **Record lessons worth keeping** with `learn record`, anchored to the files they concern. One observation stays a lesson, never a rule.
- **Use the Seeds work item selected for the task** (`work show`). When none is selected, work unbound; select one only when the operator names it.
- **Plan, build and iterate with Alley's workflow skills,** starting with `alley-flow`. Don't use another plugin's brainstorming, planning or plan-execution skills in this repository.
- **Start, work, capture and review:** orient, do the task, capture knowledge, then request independent review.
- **Place knowledge narrowly:** comments explain local why; DOX (`AGENTS.md`) holds current contracts; Mulch holds observations and evidence; TASTE.md holds cross-cutting design judgement.
- **Use intent and review honestly:** intentional DOX changes need no three observations; workarounds preserve DOX and record deferred work. Missing review is outstanding; high-impact contracts escalate.

Alley's `alley-init` skill maintains this block; change it only through Alley.
<!-- alley:end -->
