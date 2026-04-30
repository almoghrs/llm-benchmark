# Assessment for T-02

## Agent Output

```text
## Main Entities & Relationships

**Hierarchy (global → environment-scoped):**

```
Organization → Project → Environment → Survey → Response
```

**Organization** (`Organization`) is the top-level tenant. It owns **Projects** via `Project.organizationId`. Organizations are global — no `environmentId` field anywhere on them.

**Project** (`Project`) groups related apps/products. It holds org-wide config (styling, branding, `recontactDays`) and is global within an org — scoped only by `organizationId`, not by environment.

**Environment** (`Environment`) is the bridge. Each Project gets exactly two environments (`type: production | development`, field: `Environment.projectId`). Almost every operational entity hangs off an environment via `environmentId` with `onDelete: Cascade`.

**Survey** (`Survey`) lives in an environment (`Survey.environmentId`). It collects **Responses** (`Response.surveyId`) which are cascade-deleted with the survey.

**Response** (`Response`) points to its parent survey (`surveyId`) and optionally to a **Contact** (`contactId`). Responses have no direct `environmentId` — environment is implied through the survey.

**Environment-scoped entities** (all carry `environmentId`):
- `Survey`, `Contact`, `ActionClass`, `ContactAttributeKey`, `Webhook`, `Tag`, `Segment`, `Integration`

**Global entities** (no `environmentId`):
- `Organization`, `Project`, `User`, `Team`, `Membership`, `ApiKey`, `Language` (scoped to `projectId`)

The key tell: environment-scoped models have `environmentId String` + `environment Environment @relation(...)` and `@@index([environmentId])`. Global models don't.

```

## Evaluation

## Evaluation

**Rubric item-by-item assessment:**

| Rubric Requirement | Met? | Notes |
|---|---|---|
| Correctly identifies hierarchy: `Organization → Project → Environment → Survey` | Yes | Explicitly stated in the hierarchy block |
| `Organization` is top-level entity | Yes | "top-level tenant" |
| `Project` belongs to `Organization` via `organizationId` | Yes | "owns Projects via `Project.organizationId`" |
| `Environment` belongs to `Project` via `projectId` | Yes | "field: `Environment.projectId`" |
| `Survey` belongs to `Environment` via `environmentId` | Yes | "`Survey.environmentId`" |
| `Response` belongs to `Survey` via `surveyId` | Yes | "`Response.surveyId`" |
| `Organization` and `Project` are "global" (no `environmentId`) | Yes | Explicitly listed under "Global entities" |
| Environment-scoped entities identified (Survey, Response, Tag, Webhook, Contact, etc.) | Mostly | `Survey`, `Contact`, `Webhook`, `Tag` are listed. `Response` is nuanced — the agent correctly notes it has no direct `environmentId` (implied through survey), which is accurate. |
| Concise and accurate based on `schema.prisma` | Yes | Well-structured, adds useful detail without being verbose |

**Strengths:**
- Covers every rubric point cleanly
- Adds genuinely useful extra detail (cascade behavior, `production | development` types, `@@index` pattern)
- The nuanced handling of `Response` (no direct `environmentId`, implied through survey) is a technically accurate observation that goes beyond the rubric in a positive way
- Clean formatting makes the hierarchy immediately readable

**Minor gaps:**
- The rubric specifically calls out `Response` as environment-scoped via `surveyId`, but the agent correctly notes `Response` has no direct `environmentId` — this is accurate and arguably better than the rubric's simplified framing, not a real flaw
- No material inaccuracies detected

## Score: **5/5**

The output fully satisfies every rubric requirement, is technically precise, and adds meaningful context (cascade behavior, environment type enum, index patterns) that strengthens rather than muddies the answer. No inaccuracies or omissions relative to the rubric criteria.

