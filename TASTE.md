# TASTE

Cross-cutting design taste for this repository, distilled from John Ousterhout, *A Philosophy of Software Design* (1st ed., 2018), cited as `[§n]`. Alley installed this starting version. Items marked **(Alley)** come from how Alley works, not from the book.

- **Humans own this file.** Agents propose edits through Alley's proposal workflow and never edit it directly. The project's humans accept, reject or adapt each proposal.
- **Everything here is advisory.** Nothing is mechanically enforced. A finding cites a rule and a symptom; it does not block work.
- **Scope.** Judgement that applies across the codebase lives here. Rules for one module live in that module's `AGENTS.md`.
- **Two parts.** Part 1 is the working summary; it fits in a task briefing. Part 2 explains each rule: what the book says, why it matters when agents read and write the code, how to apply it and where it stops. **Before you apply or cite a rule, read its Part 2 section.**
- **Stable IDs.** Keep rule IDs when editing. Mulch records and past reviews cite them. Retire an ID rather than reuse it; append new rules as T18, T19 and so on.

---

# Part 1 — Working summary

## Objective

Complexity is anything in a system's structure that makes it hard to understand and modify [§2.1]. Minimize it for the next reader, who is often an agent:

- **Change amplification:** one decision needs edits in many places.
- **Cognitive load:** how much you must know to make a change safely.
- **Unknown unknowns** (worst): what must change isn't discoverable [§2.2].

The two causes are **dependencies** and **obscurity** [§2.3]. Line count is not the measure: log it if useful, never gate on it [§2.2, §9.8].

## How to apply

1. **Plan:** name the rules that shape the design. For a new interface, sketch two alternatives (T10) and write the interface comment (T11).
2. **Write:** follow the rules; put each fact in its home (below).
3. **Review:** each finding gives `T#`, location, concrete symptom and a suggested fix, e.g. "T3 `orders/export.ts`: CSV column order duplicated here and in `orders/import.ts` → change amplification; move the layout into one codec module." Nothing without a symptom. Style belongs to formatters.
4. **Finish:** scan the diff for stale comments and `AGENTS.md` contracts (T11).

## Rules at a glance

| ID  | Rule                                                                  | Check                                                              |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| T1  | Strategic, not tactical: leave the design better; defer only visibly. | Plan has a design line; deferred work is a proposed Seeds issue.   |
| T2  | Deep modules: interface much simpler than implementation.             | Would callers be worse off without it?                             |
| T3  | Hide each design decision in exactly one module.                      | If this decision changes, how many files change? Does it already exist? |
| T4  | Make the common case simple; default sensibly.                        | Typical call needs no rare option?                                 |
| T5  | Somewhat general-purpose interfaces; no speculative features.         | Simplest interface covering all current uses?                      |
| T6  | Each layer changes the abstraction; no pass-throughs.                 | Does this layer add a new abstraction?                             |
| T7  | Pull complexity down; avoid knobs and punted errors.                  | Could the module decide this itself?                               |
| T8  | Join or split by shared knowledge, never by length.                   | Can each piece be understood alone?                                |
| T9  | Define errors and special cases out of existence.                     | How many places handle this condition?                             |
| T10 | Design new interfaces twice.                                          | Plan names the rejected alternative.                               |
| T11 | Interface comment first; comments say what code can't.                | Short, complete interface comment exists.                          |
| T12 | Precise names, one name per concept.                                  | Can a cold reader guess from the name alone?                       |
| T13 | Follow existing conventions; write shared ones down.                  | Local precedent or `AGENTS.md` convention followed?                |
| T14 | Design for reading, not writing.                                      | Is a fresh reader's first guess right?                             |
| T15 | Increments are abstractions, not features.                            | Interface designed before tests; bug fix has a failing test first. |
| T16 | Dependencies: stdlib → platform → existing → new.                     | New dependency justified.                                          |
| T17 | Performance: naturally efficient; measure before optimizing.          | Optimization cites a measurement.                                  |

## Where knowledge goes

Write each fact once, as close as possible to the reader who needs it. Everywhere else links to it [§16.4]. If the repo lacks one of these homes, say so in the plan; don't invent one.

- **Interface comment:** how to use it (behavior, arguments, units, errors, side effects, preconditions).
- **Implementation comment:** what a block does and why, when not obvious.
- **Nearest owning `AGENTS.md` (DOX):** a feature's purpose, invariants, implicit requirements, cross-file decisions and the rationale that still holds. Dependent code says `// See <dir>/AGENTS.md: <heading>`.
- **`TASTE.md`:** design judgement across the codebase.
- **Mulch record anchored to files:** rejected alternatives, dated decisions, failures, evidence.
- **Proposed Seeds issue:** design work that doesn't fit this task.
- **Commit message:** never the only home.

## Red flags

Shallow Module (T2) · Information Leakage (T3) · Temporal Decomposition (T3) · Overexposure (T4) · Pass-Through Method (T6) · Repetition (T8) · Special-General Mixture (T8) · Conjoined Methods (T8) · Comment Repeats Code (T11) · Implementation Contaminates Interface (T11) · Hard to Describe (T11) · Vague Name (T12) · Hard to Pick Name (T12) · Nonobvious Code (T14). Definitions are in Part 2.

---

# Part 2 — Rationale and detail

## Why this file exists

In a repo where agents do much of the work, the next reader of any code is often an agent. It starts each session without memory of earlier sessions. It knows only what its briefing and the repository tell it, within a limited context window. Complexity costs an agent more than a human. Each extra interface takes attention it could spend on the task. Each hidden dependency is an unknown unknown it can't discover by asking a colleague. It will edit one place, miss the others, and report success. Agents also write code fast, so small costs accumulate faster than in a human-only team.

Ousterhout says complexity "is more apparent to readers than writers": if others find code complex, it is complex [§2.1]. It is also incremental: no single shortcut matters, but hundreds do. So each change must refuse to add even a little [§2.4].

**Why not line count.** Fewer lines is a tempting target for agent output, and it is the wrong one. Short code can hide unknown unknowns and raise cognitive load. "Sometimes an approach that requires more lines of code is actually simpler, because it reduces cognitive load" [§2.2]. Methods hundreds of lines long are fine if they have a simple signature and read easily [§9.8]. Line counts may be logged as telemetry. They never decide anything.

**Why review is advisory.** Open-ended automated review drifts into style preferences and can stall work over them. A finding therefore has to name a rule and a concrete complexity symptom, and it never blocks by itself. Formatting and lint rules belong to tools. The reader still decides: if a reviewer finds code non-obvious, it is. Clarify it instead of arguing [§13.8, §18].

## T1 — Strategic, not tactical

**Book.** Tactical programming aims to get the current task working as fast as possible. Each shortcut adds a small dependency or obscurity. Because complexity is incremental, the shortcuts compound until every change is slow and risky, and then there is never time to clean up [§3.1]. Strategic programming makes a good design the primary goal; working code is necessary but not enough [§3.2]. It invests continually, about 10–20% of effort by the book's estimate [§3.3]. Some investment is proactive: try alternatives, write documentation. Some is reactive: when you find a design problem, fix it instead of patching around it. When modifying existing code, "the smallest change that does what I need" is the tactical mindset. The goal is a system that looks as if it had been designed with the change in mind: "if you're not making the design better, you are probably making it worse" [§16.1].

**For agents.** The book's "tactical tornado", a prolific programmer who ships features fast and leaves a wake of destruction [§3.1], describes an unconstrained coding agent. The agent is rewarded for finishing the current task and never lives with the result. The humans and the next agent inherit the cost.

**Apply.** Add a design line to the plan: what the change improves, or why the existing design already fits it. Fix small design flaws in the files you touch. When the right fix is bigger than the task, do the cleanest thing that fits. Then propose a Seeds issue for the remainder, so the team can see and schedule it; a TODO in code stays invisible.

**Limits.** Don't widen the scope silently. A refactor beyond the task's target files needs a human's agreement. The book assumes the developer controls the schedule; an agent doesn't.

## T2 — Deep modules

**Book.** A module is anything with an interface and an implementation: a function, class, file, package, CLI command or service [§4.1]. The interface is everything a user must know. That includes informal behavior and ordering constraints, not just signatures [§4.2]. A module's benefit is its functionality; its cost is its interface. A **deep** module hides a lot of functionality behind a simple interface. Unix file I/O is the example: five calls hide an entire file system [§4.4]. A **shallow** module's interface is nearly as complex as its implementation. It adds something to learn while hiding almost nothing, like a method that only wraps `data.put(attribute, null)` [§4.5]. **Classitis**, the belief that more and smaller classes are better, produces many shallow pieces. Their interfaces add up to system-level complexity [§4.6].

**For agents.** Every interface an agent must learn costs context and attention. A deep module can be described in one sentence of a DOX contract. Shallow wrappers are the pattern agents produce most often: a named function around one call. See the exemplar at the end.

**Apply.** Before adding a function, class or file, state its interface in one or two sentences and compare that with what it hides. Prefer deepening an existing module over adding a layer on top of it.

**Limits.** Some small pieces are fine: a helper that hides a tricky calculation or a format earns its interface. Don't merge unrelated code just to look "deep" (T8).

**Red flag — Shallow Module:** the interface isn't much simpler than the implementation. Test: could callers inline the body without learning anything new?

## T3 — Hide each design decision in one module

**Book.** Each module should encapsulate a few design decisions, such as a data format, an algorithm, a protocol or a storage layout, so they appear nowhere in its interface [§5.1]. Declaring something private is not the same as hiding it: a getter still exposes the representation [§5.1, §19.6]. **Information leakage** means one decision is reflected in several modules, so changing it means changing all of them. Back-door leakage is the worst kind, because nothing shows it. Two classes that both know a file format, without either exposing it, are an example [§5.2]. **Temporal decomposition** structures code by execution order (read, then modify, then write). It is a common cause of leakage, because reading and writing both need the format [§5.3]. Returning an internal collection, such as `getParams()` returning the map, exposes the representation and gives callers extra steps [§5.6].

**For agents.** Leakage is the main source of unknown unknowns for an agent. It changes a format in one file and has no way to learn that three other files depend on it. Typical decisions that need exactly one owner: file and wire formats, database schemas, API payload shapes, cache keys, configuration layout, and retry or timeout policy.

**Apply.** When designing a module, list the decisions it owns. Organize by knowledge, not by step. When you find leakage, ask how to reorganize so the knowledge affects a single module [§5.2]. Merge modules that are closely tied to the knowledge, or extract it behind a simple interface. Extraction only helps if the new interface really abstracts; otherwise you have just moved the leak.

**Limits.** Hide only what users don't need. If callers must know or tune something, such as when data reaches disk, it belongs in the interface [§5.9].

**Check.** "If this decision changes, how many files change?" More than one owning module is a finding. If GitNexus is installed and its index is fresh, use its impact analysis to count; otherwise search. **Before creating a function or module, search the graph for an existing one** (or search the code if no graph is available). Duplicated logic is a common symptom of agent-written code, and a second copy of a decision is the leak this rule exists to prevent. Extend or reuse what exists; if it doesn't fit, say why in the plan. **(Alley)**

**Red flags — Information Leakage:** the same knowledge is used in several places. **Temporal Decomposition:** the code structure follows execution order instead of knowledge.

## T4 — Make the common case simple

**Book.** Design interfaces so the most common use is as simple as possible [§4.7]. Modules should "do the right thing" without being asked. Java makes callers wrap a file stream in a separate buffering object. Unix makes sequential access the default and keeps random access out of the way [§4.7, §5.7]. Defaults are partial information hiding: most callers never learn the defaulted item exists [§5.7].

**For agents.** Agents like to produce option bags and flag-heavy functions, and every option is a question each caller must answer. The same applies to command-line tools, HTTP endpoints and components.

**Apply.** Write the typical call first. Every argument the common caller must supply needs a reason the module can't determine it.

**Limits.** Rare needs must stay possible. Put them on a separate path instead of in the common call.

**Red flag — Overexposure:** using a common feature forces you to learn about rare ones.

## T5 — Somewhat general-purpose

**Book.** The sweet spot is "somewhat general-purpose": the functionality reflects today's needs, but the interface is not tied to them [§6.1]. In the text-editor example, `insert(position, text)` and `delete(start, end)` beat `backspace(cursor)` and `deleteSelection(selection)`. They mean fewer and deeper methods, and no UI concepts leak into the text class [§6.2–6.4]. Ask three questions [§6.5]. What is the simplest interface that covers all my current needs? In how many situations will this method be used? (One situation is a warning sign.) Is it easy to use for my current needs? (If callers need a lot of glue, it's too general.)

**For agents.** Two opposite failures are common. One is a method per caller, such as `getUserForInvoicePage()`. The other is a speculative framework nobody asked for. Don't build features nobody requested, but shape each interface you do build so it isn't welded to its first caller.

**Limits.** "Somewhat" matters. Don't build a framework for imagined uses.

## T6 — Different layer, different abstraction

**Book.** Adjacent layers should offer different abstractions [§7]. A **pass-through method** does little except call another method with a similar signature. It signals confused responsibility between two classes. Fix it by exposing the lower layer, redistributing the work, or merging the classes [§7.1]. Duplicate signatures are fine when each adds real function: a dispatcher that chooses a handler, or several implementations of one interface [§7.2]. Decorators tend to be shallow. Before writing one, consider adding the feature to the base, merging it with its single use, or making it stand alone [§7.3]. A **pass-through variable** threads a value through methods that don't use it. Prefer a context object that is stored in the objects needing it and passed only to constructors. Keep its fields immutable where possible, and don't let it become a grab-bag [§7.5]. Every new element must remove more complexity than it adds [§7.6].

**For agents.** Layered templates such as controller → service → repository invite thin layers that forward calls unchanged. Agents fill such templates mechanically. Each forwarding layer is one more file to read and one more signature to keep in sync.

**Red flag — Pass-Through Method:** a method does nothing except pass its arguments to another method with a similar signature.

## T7 — Pull complexity down

**Book.** When complexity is unavoidable and belongs to the module's job, handle it inside the module. A module has more users than developers, so it is better for the developers to suffer [§8]. A simple interface matters more than a simple implementation. Throwing an exception or adding a configuration parameter pushes the problem to every caller or administrator. Before exporting a parameter, ask whether callers can pick a better value than the module can. Compute defaults where possible [§8.2].

**For agents.** When unsure, agents tend to add a parameter or throw. Both defer the decision to someone with less context. Every configuration knob is a question each user, deployment and environment must answer and keep in sync.

**Limits.** Pull complexity down only when it is related to the module's existing job, simplifies code elsewhere and simplifies the interface [§8.3]. Otherwise it is just leakage in the other direction.

## T8 — Join or split by knowledge

**Book.** Splitting has costs: more components, more interfaces, code to manage them, pieces far apart, and duplication [§9]. Keep code together when it shares information, is used together in both directions, overlaps conceptually, or can't be understood without the other piece [§9]. Combine code to simplify an interface or to remove duplication [§9.1–9.3]. Separate a general-purpose mechanism from its special-purpose uses, and push the special-purpose code up. The undo history class knows nothing about the actions it replays [§9.4, §9.7]. For methods, length alone is rarely a reason to split. Split only to extract a cleanly separable subtask, or to divide an interface that does unrelated things. If you then flip back and forth between the pieces to understand them, the split was wrong [§9.8].

**For agents.** Agents trained to "keep functions short" over-split. Readers then have to reassemble fragments spread across files, which costs more context than one coherent function.

**Red flags — Repetition:** the same nontrivial code appears repeatedly, so an abstraction is missing [§9.4]. **Special-General Mixture:** a general mechanism contains code for one particular use [§9.5]. **Conjoined Methods:** you can't understand one piece without reading the other [§9.8].

## T9 — Define errors and special cases out of existence

**Book.** Exception handling is one of the worst sources of complexity. It is hard to write, rarely runs and is rarely tested; "code that hasn't been executed doesn't work" [§10.1]. Exceptions are part of an interface, so every added one makes the module shallower [§10.2]. In order of preference:

1. **Define errors out of existence.** "Delete" should mean "ensure it doesn't exist"; substring should clamp out-of-range indexes [§10.3–10.5].
2. **Mask them low.** TCP resends lost packets so callers never see them [§10.6].
3. **Aggregate them high.** One handler at the top of a request loop [§10.7].
4. **Crash** with a clear message on rare errors that can't be recovered [§10.8].

Design special cases away too. An empty selection replaces a separate "no selection" state [§10.9].

**For agents.** Agents over-defend: they wrap every call in try/catch, add null checks for impossible states, and invent error types. Typical fixes: make operations idempotent, so re-running is safe; return an empty collection instead of null; handle request errors once at the boundary.

**Limits.** Never hide information callers need [§10.10]. If a user or operator must act on a failure, such as lost data, a failed payment or a disabled safeguard, surface it clearly. Swallowing it is the book's anti-pattern of a network module that silently discarded every error.

## T10 — Design it twice

**Book.** First ideas are rarely the best. For each major decision, sketch radically different alternatives. Pin down only the most important methods of each. Compare them first on ease of use for callers, then on simplicity, generality and efficiency. The best result may combine them [§11]. Do it for the interface first and the implementation second. It costs hours against days of implementation.

**For agents.** Models tend to commit to the first plausible design, and a second sketch is cheap for an agent. Apply this to new modules, public interfaces, data formats and schemas, not to trivial private helpers.

**Apply.** Name the rejected alternative and the reason in the plan. If someone is likely to propose it again later, record it as a Mulch decision record anchored to the module, so the next agent doesn't reopen it. **(Alley)**

## T11 — Interface comment first; comments say what code can't

**Book.** Comments record what code can't express: abstractions, rationale and rules such as "call a before b" [§13]. Rules for writing them:

- Don't repeat the code, and don't reuse the words of the name being described [§13.2].
- Lower-level comments add precision: units, inclusive or exclusive bounds, what null means, who frees a resource, and invariants [§13.3].
- Higher-level comments give intuition: what a block does and why, not how [§13.4, §13.6].
- An interface comment covers the behavior as the caller sees it, each argument and the return value, side effects, errors and preconditions, and no implementation details [§13.5].

Write interface comments before the code. They are a design tool: if a short, complete comment is impossible, the abstraction is wrong [§15.2–15.3]. Keep comments next to the code and out of the commit log. Say each thing once, and check the diff before committing [§16.2–16.5].

**For agents.** An interface comment is what the next agent reads instead of the body, so it is the cheapest way to cut its cognitive load. Agents' most common comment failure is narrating the code line by line; the most useful comment is the one they skip, the *why*. Decisions that span modules need one discoverable home. The book suggests a central design-notes file referenced by "See X" pointers [§13.7]. With Alley, that home is the owning DOX `AGENTS.md`. **(Alley)**

**Red flags — Comment Repeats Code:** the comment says only what the adjacent code shows. **Implementation Contaminates Interface:** an interface comment describes internals the caller doesn't need. **Hard to Describe:** a complete description must be long [§15.3]. A child `AGENTS.md` that keeps outgrowing its size budget is the same signal. Suspect the module boundary before the prose.

## T12 — Precise, consistent names

**Book.** A name should create an image of what the thing is, and of what it is not [§14.2]. Be precise: `numIndexlets`, not `getCount`; `cursorVisible`, not `blinkStatus`. Booleans should read as predicates [§14.3]. Be consistent: a name always means the same thing, is never used for anything else, and names a purpose narrow enough that every variable with that name behaves the same [§14.4]. Ousterhout spent six months finding a bug caused by `block` meaning both a file block and a disk block [§14.1]. The farther a name is used from its declaration, the longer it should be [§14.5].

**For agents.** Agents search and pattern-match on names. A name reused for two concepts produces confident wrong edits. Use the project's domain vocabulary as its `AGENTS.md` and docs define it, and don't coin synonyms. If a term is missing, propose adding it to the owning `AGENTS.md`.

**Red flags — Vague Name:** broad enough to mean many things (`data`, `info`, `manager`, `result`). **Hard to Pick Name:** no precise, short name fits, which suggests the thing itself isn't well defined [§14.3].

## T13 — Follow existing conventions; write shared ones down

**Book.** Consistency means similar things are done in similar ways and dissimilar things differently. Once you learn a pattern, it gives you safe assumptions elsewhere [§17]. Maintain it by documenting conventions, enforcing them with tools and review, and following "when in Rome". Change a convention only with significant new information, and then update every old use [§17.2].

**For agents.** A convention that lives in one person's head doesn't exist for an agent. Agents also import conventions from their training data, so an unwritten local convention loses to the internet's default. Record shared conventions in the owning `AGENTS.md`. Leave mechanical style to formatters and linters.

**Limits.** Don't force dissimilar things into the same shape or pattern [§17.3, §19.5].

## T14 — Design for reading, not writing

**Book.** Code is obvious when a quick reading gives a correct first guess [§18]. Names, consistency, white space and comments help [§18.1]. Several things hurt [§18.2]:

- event-driven code, where it's unclear when a handler runs;
- generic containers such as `Pair`, whose fields say nothing;
- a declared type that differs from the real one;
- code that violates expectations, such as a `main` that returns while threads keep running.

There are three remedies: need less information (abstraction, fewer special cases), reuse information readers already have (conventions), or present it in the code (names, comments) [§18.3].

**For agents.** Callbacks, event handlers, framework hooks, middleware and background jobs are where agents misread control flow most. The interface comment of each such entry point must say when it is invoked, by whom, what it may change, and what happens if it fails.

**Red flag — Nonobvious Code:** meaning or behavior can't be grasped on a quick read.

## T15 — Increments are abstractions, not features

**Book.** Develop incrementally, but make each increment an abstraction rather than a feature [§19.2]. Unit tests are valuable because they make refactoring safe [§19.3]. Test-driven development steers attention to making the next test pass, which is tactical. Once you need an abstraction, design it whole, or at least its core functions. The exception is a bug fix: write a failing test that reproduces the bug first [§19.4].

**For agents.** Agents often run test-first loops, which can grow an interface one test at a time. Tests stay mandatory; only the order changes. First the interface and its comment (T10, T11), then tests against that interface, then the implementation.

## T16 — Dependency hygiene

**Source.** Not from the book **(Alley)**. It fits the book, though: dependencies are one of the two causes of complexity [§2.3].

**For agents.** Agents add packages readily, often for a few lines of functionality. Every dependency is install surface, a security and upgrade burden, and one more API for the next reader to learn.

**Apply.** Prefer, in order: the language's standard library, then the platform or framework already in use, then a dependency already in the project, and only then a new one. State in the plan why the earlier options don't fit. Build no speculative features along the way.

## T17 — Performance

**Book.** Know which operations are fundamentally expensive, such as network round trips, disk I/O, allocation and cache misses. Where it's just as simple, choose the naturally efficient design [§20.1]. If a faster design adds complexity, take it only when the complexity stays hidden, or when you have evidence it's needed. Measure before changing anything, and back out changes that don't measurably help [§20.2]. For hot code, design around the critical path and test special cases once, off that path [§20.3]. Simpler code is usually faster [§20.5].

**For agents.** Agents optimize speculatively, adding caches, memoization and parallelism on intuition, and each such layer adds state and failure modes. Don't add one without a measurement that shows the need, and re-measure afterwards.

## Where knowledge goes: why

- **Distance sets detail.** The farther a note sits from the code, the more abstract it should be, because detailed notes far from the code go stale [§16.2]. So precise facts (units, bounds, errors) stay in comments beside the code. Module purpose and cross-file decisions go in DOX.
- **One home per fact.** Duplicated documentation drifts silently. A pointer to a moved or deleted note fails visibly [§16.4]. So dependent code carries `// See <dir>/AGENTS.md: <heading>`, not a copy.
- **Cross-module decisions need a findable home** [§13.7]. A DOX child `AGENTS.md` is that home, and Alley loads it into the briefing for any file beneath it. Invariants and implicit requirements go under its local contracts, each followed by one sentence of rationale while it still holds. How to work in the module goes under work guidance. **(Alley)**
- **DOX is present tense.** DOX forbids diary entries, and history bloats every briefing. Rejected alternatives, dated decisions, failures and evidence go to Mulch, anchored to the files they concern. Mulch is retrieved only when those files are touched. **(Alley)**
- **Deferred design work goes to Seeds**, so it is shared, visible and schedulable [§16.1]. **(Alley)**
- **Not the commit log.** Future readers won't search it; move anything they need into the code or DOX [§16.3].

## Learning loop (Alley)

Rules that pile up unchecked crowd agents' context and bury the important ones. One failure can also be a coincidence. So this file grows only through evidence and human review:

1. When a red flag is worth remembering, record an observational Mulch record anchored to the files and naming the rule (e.g. "T3") in its text.
2. A pattern corroborated by three or more independent task attempts may be proposed as a new or changed rule here, or as a contract in the owning `AGENTS.md`.
3. A human accepts or rejects the proposal. The accepted change cites its evidence.

## Exemplar: shallow wrapper → deep module (T2, T3, T9)

```ts
// Before: the wrapper adds a name and no abstraction; every caller still knows the file format.
function readIssuesFile(path: string): string { return fs.readFileSync(path, "utf8"); }
const issue = readIssuesFile(p).split("\n").filter(Boolean).map(JSON.parse).find(i => i.id === id);

// After: one module owns location, format and parsing; a missing issue is a normal result.
/** Returns the issue with this id, or undefined if none exists. */
getIssue(id: string): Issue | undefined
```

- `readIssuesFile` is shallow (T2). Its interface is as big as its one-line body, and it hides nothing.
- The JSONL layout leaks into every caller (T3). A change to the format touches each one: change amplification.
- `getIssue` hides location, format and parsing behind a one-sentence interface.
- It returns `undefined` instead of throwing, so the common "not found" case needs no handler (T9).
