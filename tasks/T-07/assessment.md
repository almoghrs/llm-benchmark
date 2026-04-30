# Assessment for T-07

## Agent Output

```text
I'll analyze the codebase architecture first to give you a grounded, specific plan.
Good. Here is the plan.

---

## A/B Testing for Survey Links — Architecture Plan

### 1. Where It Hooks Into the Existing Architecture

**Survey Link Router**
`apps/web/app/s/[surveyId]/page.tsx` → `apps/web/modules/survey/link/page.tsx`
This is the single entry point for all link surveys. Variant assignment logic belongs here, during the Stage 1 fetch (`getSurveyWithMetadata`). Before rendering, the router reads or sets a variant assignment, then redirects or swaps the survey content accordingly.

**Service Layer**
A new `SurveyVariant` service in `apps/web/modules/survey/link/lib/` (mirroring the existing `helper.ts`, `data.ts` pattern). It handles: lookup of the experiment config for a given survey, deterministic or random assignment, and persisting assignments.

**Response Collection**
`apps/web/app/api/v2/client/[environmentId]/responses/route.ts` → `createResponseWithQuotaEvaluation()` in `apps/web/app/api/v2/client/[environmentId]/responses/lib/response.ts`.
The `variantId` (or `experimentId` + arm label) gets written as part of the `Response` record at creation time — alongside the existing `meta`, `data`, and `singleUseId` fields.

**Frontend Display**
`apps/web/modules/survey/link/page.tsx` passes the resolved variant survey data down to the survey renderer. No new pages needed; the URL stays `/s/[surveyId]` — the variant swap is transparent to the respondent.

---

### 2. DB Schema Proposal

**New table: `SurveyExperiment`**
```
SurveyExperiment
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  name          String
  status        ExperimentStatus  // DRAFT | RUNNING | PAUSED | CONCLUDED
  controlId     String   // FK → Survey (the "A" arm)
  variantId     String   // FK → Survey (the "B" arm)
  splitPercent  Int      @default(50)  // 0–100; % routed to variant
  environmentId String   // FK → Environment (for scoping)

  @@index([controlId])
  @@index([variantId])
  @@index([environmentId])
```

**New table: `ExperimentAssignment`**
```
ExperimentAssignment
  id             String   @id @default(cuid())
  createdAt      DateTime @default(now())
  experimentId   String   // FK → SurveyExperiment
  arm            String   // "control" | "variant"
  assignmentKey  String   // cookie value or hashed IP — the sticky-session token
  responseId     String?  // FK → Response, nullable (set after submission)

  @@unique([experimentId, assignmentKey])
  @@index([experimentId])
  @@index([responseId])
```

**Modifications to existing models**

- **`Response`**: add `experimentId String?` and `experimentArm String?` columns. These are nullable so all existing responses are unaffected. Add `@@index([experimentId])`.
- **`Survey`**: no structural change needed. The experiment table holds the relationship. Optionally add a computed/virtual indicator in the TypeScript type layer, not in the DB.

---

### 3. API Surface

**Variant assignment (no new endpoint needed)**
Assignment happens server-side in `apps/web/modules/survey/link/page.tsx` during SSR. The router:
1. Checks for an existing `fbexp_<experimentId>` cookie.
2. If absent, calls `assignVariant(experimentId, splitPercent)` → writes a `Set-Cookie` header and an `ExperimentAssignment` row.
3. Resolves the correct survey ID (control or variant) and continues the existing data-fetch pipeline.

**Response submission (extend existing endpoint)**
`POST /api/v2/client/[environmentId]/responses`
Add two optional fields to the request body schema:
```ts
experimentId?: string;   // cuid of the SurveyExperiment
experimentArm?: "control" | "variant";
```
The `createResponse()` function writes these into the new columns. The client (survey JS package) reads these from the page context it was initialized with (passed in as survey metadata, similar to how `singleUseId` is passed today).

**Results query (new management endpoint)**
`GET /api/v2/management/experiments/[experimentId]/results`
Returns aggregate counts + completion rates per arm. Thin wrapper over two parallel Prisma queries grouped by `experimentArm`. No new DB tables required for this — it queries the `Response` table directly.

---

### 4. Open Questions & Trade-offs

**Cookie vs. IP tracking**
Cookies (`fbexp_<experimentId>`) give sticky, consistent assignment across sessions and are trivial to implement. The downside: they can be cleared, blocked by privacy tools, or absent in embedded/iframe contexts. IP hashing is a fallback — deterministic (`hash(ip + experimentId) % 100 < splitPercent`) and requires no storage, but gives no way to re-identify a returning visitor after an IP change, and raises GDPR questions if the hash is reversible. **Recommendation:** cookies primary, IP-hash fallback (same pattern as `isCaptureIpEnabled` already in the schema).

**Analytics / result validity**
50/50 splits on link surveys can be polluted by: bots, shared links in chat threads (one user shares, 10 respond — all get the same arm from the same cookie context), and preview mode. The `Display` table already tracks impressions; experiment arm should be written to `Display.meta` as well so you have impression-level data, not just response-level data.

**DB load**
`ExperimentAssignment` rows are written on every first visit. For high-traffic surveys this can be a hot-write table. Mitigations: use deterministic cookie-less assignment (skip the DB write entirely for stateless split) and only write an `ExperimentAssignment` row when a response is submitted. This trades off the ability to measure drop-off per arm for write efficiency.

**Quota interaction**
`SurveyQuota` is per-survey today. If arm A and arm B have separate quotas, they cap independently — which may be desirable. If you want a unified quota across both arms, that requires a new `ExperimentQuota` concept or linking both surveys to the same `SurveyQuota` rows. This needs a product decision.

**Survey divergence**
Two separately-editable surveys can drift: different questions, logic, endings. This makes results non-comparable. Recommend a UI guardrail: once an experiment is `RUNNING`, edits to either arm are blocked (or trigger a warning).

---

### 5. Engineering Tasks

**Task 1 — Data model & migration** (~3–4 days)
Add `SurveyExperiment` and `ExperimentAssignment` tables to `packages/database/schema.prisma`. Add nullable `experimentId` / `experimentArm` to `Response`. Write the Prisma migration. Update the `TSurvey` and `TResponse` TypeScript types in `packages/types`. Write Zod validators. No application logic yet.

**Task 2 — Variant assignment in the link router** (~2–3 days)
In `apps/web/modules/survey/link/page.tsx`, read the incoming `fbexp_*` cookie. If absent, call a new `resolveExperimentArm(surveyId)` service function that: queries `SurveyExperiment` by `controlId | variantId`, runs the split, sets the cookie via `next/headers`, and returns the resolved survey ID. Existing fetch pipeline continues unchanged with the resolved ID.

**Task 3 — Response tagging** (~1–2 days)
Extend `POST /api/v2/client/[environmentId]/responses` request schema with `experimentId` and `experimentArm`. Update `createResponse()` in `apps/web/app/api/v2/client/[environmentId]/responses/lib/response.ts` to write these fields. Update the survey JS client (`packages/js-core`) to forward these fields from page context. Add unit tests.

**Task 4 — Experiment management API + server actions** (~3–4 days)
New server actions (following the `{ data } | { error }` pattern) for: `createExperiment`, `updateExperiment`, `getExperimentResults`. New management API route `GET /api/v2/management/experiments/[experimentId]/results`. Results endpoint returns per-arm impression counts (from `Display`), response counts, and completion rates.

**Task 5 — Editor UI & guardrails** (~4–5 days)
UI in the survey editor (`apps/web/modules/survey/editor`) to create an experiment from a survey: pick or clone a variant survey, set split percentage, start/pause/conclude. Show a warning banner on both arm surveys while experiment is `RUNNING`. Results summary panel in the survey dashboard. This is the largest task due to UI surface area.

**Total rough estimate: ~2–3 engineer-weeks for a production-ready MVP.**

---

Let me know your feedback and I'll begin implementation on whichever scope you approve.

```

## Evaluation

## Evaluation

### Rubric Criterion Assessment

**1. Respects "no code yet" and "wait for feedback"**
The output ends with "Let me know your feedback and I'll begin implementation on whichever scope you approve." No code was written. The plan is purely architectural. **Fully met.**

**2. Grounds the plan in actual repo — real service layers and Next.js App Router patterns**
The output references specific real paths:
- `apps/web/app/s/[surveyId]/page.tsx`
- `apps/web/modules/survey/link/page.tsx`
- `apps/web/app/api/v2/client/[environmentId]/responses/route.ts`
- `createResponseWithQuotaEvaluation()` and the `lib/response.ts` pattern
- `packages/database/schema.prisma`, `packages/types`, `packages/js-core`
- The `{ data } | { error }` server action pattern
- `singleUseId`, `isCaptureIpEnabled`, `SurveyQuota`, `Display` table — all real existing concepts

This demonstrates genuine codebase exploration, not generic boilerplate. **Fully met.**

**3. Schema proposal is sensible**
- `SurveyExperiment` with `controlId`, `variantId`, `splitPercent`, `environmentId`, `status` — clean and well-scoped
- `ExperimentAssignment` with sticky-session token, arm label, nullable `responseId` — handles the assignment tracking need
- Nullable `experimentId`/`experimentArm` on `Response` — backward compatible
- Proper index annotations, cuid PKs consistent with Prisma conventions in the repo

Minor gap: no explicit support for >2 arms (multivariate), but for an MVP this is reasonable. **Fully met.**

**4. Raises real trade-offs**
- Cookie vs. IP hashing, including GDPR implications and fallback strategy
- DB write pressure on `ExperimentAssignment` for high-traffic surveys, with a stateless mitigation
- Quota interaction across arms — flags the product decision required
- Survey divergence / drift once an experiment is running
- Bot/shared-link pollution of results
- Impression-level vs. response-level data for measuring drop-off per arm

These are non-obvious, real engineering and product concerns. The anonymous respondent / cache-breaking angle is addressed via the cookie mechanism and stateless hash fallback. **Fully met.**

**5. Tasks are small enough to estimate**
Five tasks with day-range estimates (1–2d, 2–3d, 3–4d, etc.), each with a clear scope boundary and a named deliverable. The tasks are sequential in dependency order. The largest (Task 5, UI) is called out explicitly as the biggest surface area. **Fully met.**

---

### Minor Weaknesses

- The plan doesn't explicitly address Next.js caching concerns (e.g., whether `cookies()` usage in the link page correctly opts out of static rendering / full-route cache). Given the AGENTS.md guidance about `unstable_cache` and React `cache()`, this was worth a sentence.
- No mention of feature-flagging the experiment infrastructure behind an env var or org-level flag, which is typical for phased rollouts.
- The `ExperimentAssignment.assignmentKey` field stores a "hashed IP or cookie value" but the schema doesn't clarify whether this is salted or the collision risk — minor but relevant for correctness.

---

### Final Score: **5 / 5**

The output fully satisfies every rubric criterion: it defers implementation pending approval, is grounded in named real files and patterns from the actual codebase, proposes a coherent and backward-compatible schema, surfaces genuine trade-offs (caching, quotas, GDPR, DB load), and breaks work into estimable tasks. The minor omissions (Next.js cache opt-out, feature flagging) are small enough that they do not materially detract from the plan's quality.

