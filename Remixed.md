# AI Coding Assistant Benchmark

> **DevSpace R&D · Benchmark Protocol · v1.0**

A repeatable, graded set of developer tasks for evaluating AI coding assistants against a real, small-to-medium TypeScript codebase. Tasks move from trivial ("explain this file") to the kind of messy, context-heavy work that fills an R&D developer's day.

This benchmark serves three purposes simultaneously: **compare** self-hosted models to cloud (Vertex AI, Bedrock), **validate** whether self-hosted is good enough for daily dev work, and **track** model improvements over time. Every task captures the same structured data so runs are comparable across models and across months.

### How to use this doc

- Copy each prompt verbatim — no coaching.
- Fill in the per-task run log.
- Export results to the CSV format (§5).
- Run the full suite per model, quarterly.
- Compare runs in the roll-up scorecard.

### Goals

| # | Goal | Why |
|---|---|---|
| **01** | Head-to-head | Self-hosted (GPT-OSS-120B, Qwen, Llama) vs. cloud (Vertex, Bedrock) on the exact same tasks, same prompts. |
| **02** | "Good enough?" threshold | Can our self-hosted stack handle daily R&D work without constant developer re-prompting? Where does it break? |
| **03** | Baseline over time | Re-run quarterly against the same tasks to track whether model upgrades and infra changes actually improve outcomes. |

---

## §1 · Target Repository

One repo across all tasks so the evaluator's understanding compounds. Sized to fit small-context self-hosted models while still being a real product with real messiness.

### Formbricks

`github.com/formbricks/formbricks`

An open-source alternative to Qualtrics / Typeform. Self-hosted survey and experience-management platform. Turborepo with a Next.js web app, Prisma/Postgres data layer, and a rich domain (surveys, responses, quotas, webhooks, integrations, organizations).

**Why this one:** stack-matched (TS + React + Postgres), right size (~33K LOC of TS/TSX), modular turborepo with clear package boundaries, an `ee/` folder showing real enterprise-vs-community distinctions, active development, AGPL so legal to clone and modify.

| | |
|---|---|
| **Frontend** | Next.js 14 + React |
| **Backend** | Next.js API routes |
| **ORM** | Prisma |
| **Database** | PostgreSQL |
| **Structure** | Turborepo · pnpm |
| **Size** | ~33K LOC TS/TSX |
| **License** | AGPLv3 |
| **Air-gap friendly** | Yes — Docker self-host |

### Size vs. alternatives considered

| Repo | TS/TSX LOC |
|---|---:|
| **Formbricks** ← chosen | **~33K** |
| Documenso | ~90K |
| Twenty CRM | ~140K |
| Papermark | ~198K |

> **Setup — one-time.** Clone the repo, run `pnpm install` + `pnpm db:up` + `pnpm db:migrate:dev`.

---

## §2 · The Task Suite

Twelve tasks in five categories, laddered from easy to hard. Each has a verbatim prompt, an "Expected" bar, and a run-log table for capturing what actually happened.

**Categories:** `Explain` · `Arch` · `Plan` · `Implement` · `Debug`

**Difficulty:** `●○○○○` (trivial) → `●●●●●` (senior-level)

---

### T-01 · Generate an architecture document

`Explain` · `●○○○○`

**Prompt:**

```
You have access to this repository. Produce an architecture document
(Markdown, ~2 pages) covering:
1. The top-level monorepo layout and what each workspace does.
2. The backend architecture: how API routes are organized, how data
   access is layered (lib / modules / services), where auth sits.
3. The frontend architecture: App Router usage, how server vs. client
   components split, state management.
4. The data model at a high level (name the 6–8 most important
   Prisma models and how they relate).
5. External dependencies (DB, cache, queue) and what each is used for.

Base everything on files you actually read. Cite file paths. Do not invent.
```

**Expected:**

- Identifies turborepo with `apps/web` and `packages/*` (database, cache, email, surveys, etc.).
- Correctly names Next.js App Router, Prisma, NextAuth.
- Points to `apps/web/modules/` as the main domain split.
- Names real core models: Survey, Response, Organization, Project, Environment, Contact, Webhook.
- Mentions the `ee/` folder for enterprise-licensed features.
- No hallucinations (e.g. "Drizzle", "tRPC router" — wrong).

**Run Log:**

| Metric | Value | Metric | Value |
|---|---|---|---|
| Prompts sent | | Time (min) | |
| Correctness /5 | | Quality /5 | |
| Hallucinations | | Verdict | P / F |

---

### T-02 · Explain a single file

`Explain` · `●○○○○`

**Prompt:**

```
Read packages/database/schema.prisma.

In ~200 words explain: what are the main entities in this schema, how
do Survey / Response / Organization / Project relate to each other, and
which entities are workspace-scoped vs. global? Point to the specific
fields that tell you.
```

**Expected:**

- Gets the Organization → Project → Environment → Survey hierarchy right.
- Correctly identifies Response belongs to Survey.
- Points to the actual FK fields (e.g. `environmentId`).
- Doesn't invent fields that don't exist.
- Concise; no padding.

**Run Log:**

| Metric | Value | Metric | Value |
|---|---|---|---|
| Prompts sent | | Time (min) | |
| Correctness /5 | | Quality /5 | |
| Hallucinations | | Verdict | P / F |

---

### T-03 · Find usages of a component

`Explain` · `●○○○○`

**Prompt:**

```
Who uses the <Button> component from apps/web/modules/ui/components/button
(or wherever the primary Button lives — find it first)?

List every file that imports it, grouped by feature module. Are there any
cases where it's re-exported under a different name? Flag those.
```

**Expected:**

- Locates the Button file first (doesn't assume path).
- Uses grep/search tool, not guesses.
- Returns a grouped list by module path.
- Identifies re-exports correctly (or states none exist).
- Flags if results were truncated.

**Run Log:**

| Metric | Value | Metric | Value |
|---|---|---|---|
| Prompts sent | | Time (min) | |
| Correctness /5 | | Completeness /5 | |
| Hallucinations | | Verdict | P / F |

---

### T-04 · Answer an architecture question

`Arch` · `●●○○○`

**Prompt:**

```
How does this codebase handle multi-tenancy / environment scoping?
Specifically:
1. How is the current environment resolved on an incoming API request?
2. How is data isolation enforced — is it checked in middleware, in
   each service, or via Prisma's query layer?
3. Where would I look if I wanted to change how isolation works?

Answer with file paths and short code snippets.
```

**Expected:**

- Identifies the environment resolution helper / session machinery.
- Correctly describes where the `environmentId` filter is applied (typically in service / lib layer).
- Points to actual file paths, not vague "check the auth module".
- Short, real code excerpts — not invented.

**Run Log:**

| Metric | Value | Metric | Value |
|---|---|---|---|
| Prompts sent | | Time (min) | |
| Correctness /5 | | Depth /5 | |
| Hallucinations | | Verdict | P / F |

---

### T-05 · Add a trivial UI element

`Implement` · `●●○○○`

**Prompt:**

```
In the survey summary page, add a "Copy share link" button that copies
the public survey link to the clipboard and shows a brief success
toast using the existing toast system in this codebase.

Do not introduce new libraries. Use existing UI components and the
existing toast hook. Show me the diff.
```

**Expected:**

- Locates the correct summary page component.
- Uses the existing `<Button>` component.
- Uses the existing toast system (sonner / custom hook — whichever is in repo).
- Produces a clean diff, no unrelated changes.
- Code compiles; types check.
- Handles the "not published yet" state sensibly (or explicitly notes it).

**Run Log:**

| Metric | Value | Metric | Value |
|---|---|---|---|
| Prompts sent | | Time (min) | |
| Correctness /5 | | Quality /5 | |
| Compiles Y/N | | Verdict | P / F |

---

### T-06 · Add a backend endpoint

`Implement` · `●●●○○`

**Prompt:**

```
Add an API endpoint: GET /api/v1/environments/[environmentId]/stats that
returns { surveys: number, responses: number, contacts: number } counted
for the given environment.

Follow the existing conventions: same auth/session helper other v1
endpoints use, same error shape, same response wrapper. Add a minimal
unit test for the service function using the project's existing test
setup. Do not modify unrelated files.
```

**Expected:**

- Places route under the existing `apps/web/app/api/v1/` tree.
- Reuses existing auth / environment-resolution helpers.
- Service function goes under the right module (surveys or environments).
- Test uses vitest (the repo's existing framework).
- Types are explicit; no `any`.

**Run Log:**

| Metric | Value | Metric | Value |
|---|---|---|---|
| Prompts sent | | Time (min) | |
| Correctness /5 | | Convention-match /5 | |
| Compiles / tests Y/N | | Verdict | P / F |

---

### T-07 · Plan a feature — no code

`Plan` · `●●●○○`

**Prompt:**

```
We want to add "record-level audit logs": every time a Survey or
Organization is created / updated / deleted, record who did it, when,
and what changed.

DO NOT WRITE CODE YET. Produce a plan:
- Where in the existing architecture should this hook in? (be specific —
  name the lib/service layer or the Prisma middleware)
- DB schema proposal (table, columns, indexes)
- API surface for reading audit logs
- Open questions / trade-offs (perf, storage, PII, retention)
- Break into 3–5 concrete engineering tasks with rough effort

Wait for my feedback before any implementation.
```

**Expected:**

- Respects "no code yet" and "wait for feedback".
- Grounds the plan in the actual repo — names real service layers or Prisma middleware patterns seen in the codebase.
- Schema proposal is sensible (actor_id, entity_type, entity_id, diff JSON, timestamp, environment_id, indexes).
- Raises real trade-offs (write amplification, PII in diffs, retention).
- Tasks are small enough to estimate.

**Run Log:**

| Metric | Value | Metric | Value |
|---|---|---|---|
| Prompts sent | | Time (min) | |
| Correctness /5 | | Instruction-follow /5 | |
| Trade-offs called out | | Verdict | P / F |

---

### T-08 · Debug a planted bug

`Debug` · `●●●○○`

> **Evaluator pre-setup:** introduce a subtle bug before the session. E.g. flip a `>` to `>=` in a response-count helper, or off-by-one in a date-range filter used by the analytics page. Keep a small rotation of 3–5 bug variants so the model can't learn them.

**Prompt:**

```
Users are reporting that on the responses list page, the most recently-
submitted response is sometimes missing when filtered by today's date.
Investigate and propose a fix.
```

**Expected:**

- Doesn't immediately patch — reads the filtering code or asks about repro first.
- Finds the *planted* bug, not a plausible-but-wrong one.
- Explains *why* the bug causes the symptom.
- Fix is minimal and targeted.
- Flags if it found the bug but isn't 100% sure that's the one.

**Run Log:**

| Metric | Value | Metric | Value |
|---|---|---|---|
| Prompts sent | | Time (min) | |
| Found real bug? Y/N | | Root-cause /5 | |
| Fix quality /5 | | Verdict | P / F |

---

### T-09 · Refactor without breaking behavior

`Implement` · `●●●●○`

**Prompt:**

```
Pick a service file in apps/web/modules with more than one method doing
similar DB access + not-found-throw patterns (e.g. repeated
prisma.survey.findUnique + throw-if-null). Extract the duplication into
a private helper. Keep behavior identical and update all callers.

Before making the change, show me: the file, the duplication you see,
and the proposed helper signature. Wait for my confirmation before editing.
```

**Expected:**

- Respects "show before edit".
- Identifies a real, meaningful duplication (not cosmetic).
- Helper signature is clean; uses TypeScript generics sensibly.
- All call sites updated; no orphaned imports.
- Error messages / types preserved.

**Run Log:**

| Metric | Value | Metric | Value |
|---|---|---|---|
| Prompts sent | | Time (min) | |
| Followed "ask first"? Y/N | | Refactor /5 | |
| Behavior preserved /5 | | Verdict | P / F |

---

### T-10 · Cross-stack feature

`Implement` · `●●●●○`

**Prompt:**

```
Add a "pin to top" toggle on Surveys:
- Backend: new boolean field `isPinned` on Survey (Prisma migration,
  reversible).
- Backend: action / API to toggle it, respecting environment scoping
  and existing auth checks.
- Frontend: pin icon on the survey list row, optimistic update.
- Frontend: pinned surveys always sort to the top of the list.

Follow existing code-gen / mutation / list-sort patterns. No hand-rolled
bypasses of the existing data layer.
```

**Expected:**

- Creates a real Prisma migration via the project's migration tool.
- Backend action/route uses the existing auth + env helpers.
- List sort integrates with the existing query / sort parameters.
- Optimistic update uses the project's data-fetching hook, not raw state.
- No broken types; no TODOs left behind.
- Works end-to-end if you'd actually run it.

**Run Log:**

| Metric | Value | Metric | Value |
|---|---|---|---|
| Prompts sent | | Time (min) | |
| Correctness /5 | | Completeness /5 | |
| Works in browser? Y/N | | Verdict | P / F |

---

### T-11 · Write tests for existing, untested code

`Implement` · `●●●○○`

**Prompt:**

```
Pick a module under apps/web/modules that currently has NO tests (or
sparse ones). Write a meaningful test suite: happy path, one edge case,
one error case. Use the project's existing vitest setup, mocks, and
fixtures — don't invent a new harness.

Tell me what coverage you're aiming for and what you're deliberately
NOT testing (and why).
```

**Expected:**

- Picks a module where tests add value (not trivial getters).
- Reuses existing test utilities (mock-prisma, fixtures).
- Tests are independent; no shared mutable state.
- Explains scoping decisions clearly.
- All tests actually pass when run.

**Run Log:**

| Metric | Value | Metric | Value |
|---|---|---|---|
| Prompts sent | | Time (min) | |
| Tests pass? Y/N | | Meaningful coverage /5 | |
| Uses existing patterns /5 | | Verdict | P / F |

---

### T-12 · Design review — spot the problems

`Arch` · `●●●●●`

**Prompt:**

```
Here's a proposed design for a "bulk-import Contacts from CSV" feature:

"We'll accept the uploaded CSV synchronously in the API route, parse it
in memory, loop over rows, and for each row call contactService.create().
We'll wrap the whole thing in a single DB transaction. On any row error
we abort the entire import. Max file size: unlimited."

Review this design. What will break? What's missing? Rewrite it to be
production-grade, taking this codebase's existing patterns into account.
```

**Expected:**

- Catches: request timeout, memory blow-up, long transaction holding locks, no partial progress, no idempotency, no dedupe on email.
- Proposes: async processing, streaming parse, chunked inserts, per-row error collection, progress reporting.
- References the codebase's existing async/queue or background-job patterns, not generic advice.
- Considers: environment-scoping, rate-limits, duplicate-handling, observability.

**Run Log:**

| Metric | Value | Metric | Value |
|---|---|---|---|
| Prompts sent | | Time (min) | |
| Problems caught (of ~8) | | Grounded in repo /5 | |
| Depth /5 | | Verdict | P / F |

---

## §3 · How to Evaluate

Three metrics carry the scorecard. Everything else is supporting detail.

### Headline metrics (PRIMARY)

| # | Metric | What it measures | How to capture |
|---|---|---|---|
| **01** | **Prompts sent** | Number of times *you* had to send a message to get acceptable output. Includes the first prompt. The "nudging tax" — the most honest signal of developer effort. | Count user turns in the transcript. 1 = one-shot. 5+ = friction. |
| **02** | **Time to acceptable output** | Wall-clock from first prompt to you accepting the result. Includes model latency and your reading/validating time. | Stopwatch from first prompt; stop when you'd ship it. |
| **03** | **Output correctness & quality** | Does it actually do what was asked, does it match repo conventions, and is it free of hallucinations? 0–5 scale from the rubric below. | Score against the "Expected" block for each task. |

### Supporting signals (capture, don't headline)

| # | Metric | What it measures | How to capture |
|---|---|---|---|
| 04 | Compiles / tests pass | Binary gate for code tasks. No "it would work if…". | Run `pnpm build` / `pnpm test`. |
| 05 | Hallucinations | Invented files, methods, libraries, imports. Count them. | Auto-fail on any hallucination. |
| 06 | Verdict | Pass / Fail per task. A task passes if a real developer would merge the output as-is, with at most one more prompt. | Your judgment call — document the why. |

### Quality rubric — the 0–5 scale

| Score | Meaning | Example |
|:---:|---|---|
| **5** | Ship it as-is. | Exactly what a senior dev on the team would produce. |
| **4** | Ship with minor polish. | Small style nits, variable names, one missing edge case. |
| **3** | Useful, but needs rework. | Right direction, but convention-match is off or one logic flaw. |
| **2** | Partially useful. | Addressed part of the ask; significant gaps. |
| **1** | Wrong or superficial. | Misunderstood the task, generic answer, or shallow. |
| **0** | Hallucinated / dangerous. | Invented files/APIs, confidently false about the repo, or would break prod. |

### Auto-fail triggers

> **Automatic task failure** — regardless of other scores — if the model: invents a file path, imports a library that isn't in `package.json`, silently skips part of the ask, makes a confident false claim about the codebase, produces code that doesn't compile and doesn't notice, or (for "no code yet" tasks) writes code anyway.

### Running the benchmark

1. **Clean slate per task.** Fresh session; no prior context bleeding in.
2. **Copy prompts verbatim.** No coaching, no rewording. The prompt IS the test.
3. **Time honestly.** Include your reading time — a model that's fast but produces unreadable output isn't actually fast.
4. **Blind score where possible.** Strip model names from outputs before scoring to avoid bias (in either direction).
5. **Two-pass scoring.** Score once immediately, once a day later. Your first-impression and considered scores will differ — that gap is useful data.
6. **Cadence.** Full 12-task suite quarterly per model; spot-run 3 tasks monthly for regression checks.

---

## §4 · Roll-up Scorecard

One table per model run. Fill in after all 12 tasks complete. This is the one-pager for leadership / the technical committee.

| Task | Category | Prompts | Time (min) | Quality /5 | Hallucinations | Verdict |
|---|---|---:|---:|---:|---:|:---:|
| T-01 Arch doc | Explain | | | /5 | | P / F |
| T-02 File explain | Explain | | | /5 | | P / F |
| T-03 Find usages | Explain | | | /5 | | P / F |
| T-04 Arch question | Arch | | | /5 | | P / F |
| T-05 UI element | Implement | | | /5 | | P / F |
| T-06 BE endpoint | Implement | | | /5 | | P / F |
| T-07 Feature plan | Plan | | | /5 | | P / F |
| T-08 Debug bug | Debug | | | /5 | | P / F |
| T-09 Refactor | Implement | | | /5 | | P / F |
| T-10 Cross-stack | Implement | | | /5 | | P / F |
| T-11 Write tests | Implement | | | /5 | | P / F |
| T-12 Design review | Arch | | | /5 | | P / F |
| **TOTAL / AVG** | | **Σ** | **Σ** | **/60** | **Σ** | **__ / 12** |

---

## §5 · Logging Format — for over-time tracking

After each run, append one line per task to a shared CSV. This is what makes quarter-over-quarter comparison possible. Store this alongside the Confluence benchmark page.

### Run header (once per run)

```csv
run_id,date,model,model_version,infra,evaluator
2026-Q2-gpt-oss,2026-04-15,GPT-OSS-120B,v2.1,self-hosted,sahar
2026-Q2-vertex-gemini,2026-04-15,gemini-2.5-pro,2026-04,vertex-ai,sahar
2026-Q2-claude-opus,2026-04-15,claude-opus-4.7,2026-03,bedrock,sahar
```

### Task results (one row per task per run)

```csv
run_id,task_id,category,prompts,time_min,quality_5,hallucinations,compiles,verdict,notes
2026-Q2-gpt-oss,T-01,explain,1,8,4,0,n/a,P,"good arch map; missed ee/ folder"
2026-Q2-gpt-oss,T-02,explain,2,4,3,1,n/a,P,"invented 'workspaceId' field"
2026-Q2-gpt-oss,T-05,impl,4,22,3,0,Y,P,"needed 3 nudges to find toast hook"
2026-Q2-gpt-oss,T-10,impl,9,85,2,2,N,F,"never got optimistic update right"
```

> **Why this format matters.** Keeping runs in a flat CSV lets you plot "prompts over time per task" and "quality per model" trivially. When you're making the case to leadership or the technical committee that cloud models reduce developer effort by *X*%, you want that *X* to come from the same 12 tasks on the same repo, across three quarters — not from vibes.

### Suggested visualizations for leadership decks

- **Stacked bar per model:** quality score summed across 12 tasks (0–60).
- **Grouped bar:** avg prompts per task, per model. Lower = less developer friction.
- **Heatmap:** 12 tasks × N models, cell colored by pass/fail. Reveals which categories each model struggles with.
- **Line chart:** same model, quarterly — quality trend and prompt-count trend.

---

*DevSpace · R&D · Benchmark Protocol · v1.0 · Target: Formbricks*
