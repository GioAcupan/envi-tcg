# .alley/

Alley's shared records for this repository. Commit this folder: Alley's hooks act only in repositories that have it.

The agent's normal task ritual is start, work, capture and review. Place durable knowledge in the narrowest home: comments for local rationale, DOX for current contracts, Mulch for observations and evidence, and TASTE.md for cross-cutting design judgement. Intentional DOX changes do not need three Mulch observations; tactical workarounds preserve the existing DOX contract and record deferred work. Independent review must be separate when available, and a missing reviewer is reported as outstanding.

- `proposals/`: proposed changes to TASTE.md, with each operator decision. Only Alley's CLI writes them.
- `evidence/`: the independent attempts behind lessons that may become rules. A promotion needs three.
- `.alley/handoffs/`: committed hand-off records for sessions, lane briefs/reports, escalations and host/person transfers. Use `alley handoff` or the `alley-handoff` skill; records are immutable, and claim/close add transition files. `handoff prune` archives records of closed Seeds items and removes archived records past retention (90 days by default). The folder is created on first write; it needs no union-merge rule.
- `team.json` (optional): maps people to git emails and roles for addressed hand-offs. `ALLEY_OPERATOR` overrides the current person's git identity.

Hand-offs are transit context; capture lasting knowledge in DOX or Mulch. Salvage refs for uncommitted work are local git refs and do not travel with record commits.

Alley's machine-local session state is not kept here. It lives in the Git directory and is never committed.
