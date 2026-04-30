# Assessment for T-01

## Agent Output

```text
Here is the architecture document based on files actually read in the repository:

---

# Formbricks Architecture Document

## 1. Monorepo Layout

**Config:** `pnpm-workspace.yaml`, `turbo.json`

The repo is a pnpm/Turborepo monorepo with two top-level workspace scopes:

**`apps/`**
| Workspace | Purpose |
|---|---|
| `apps/web` | Main Next.js 16 product (`@formbricks/web`) |
| `apps/storybook` | Component browser for UI review |

**`packages/`**
| Package | Purpose |
|---|---|
| `@formbricks/database` | Prisma schema, migrations, and generated client |
| `@formbricks/surveys` | Pre-compiled survey renderer (Vite → UMD + ESM), copied to `apps/web/public/js/` |
| `@formbricks/survey-ui` | Survey UI React components consumed by the surveys bundle |
| `@formbricks/js-core` | Browser SDK for embedding surveys in third-party sites |
| `@formbricks/types` | Shared TypeScript type definitions |
| `@formbricks/cache` | Redis-backed cache service (`CacheService`, distributed locking) |
| `@formbricks/email` | Email template rendering and Nodemailer delivery |
| `@formbricks/ai` | AI/LLM integration utilities |
| `@formbricks/storage` | File storage abstraction (S3 / local filesystem) |
| `@formbricks/logger` | Structured pino logger |
| `@formbricks/i18n-utils` | i18n helpers |
| `config-eslint/typescript/prettier` | Shared lint and formatting presets |

Survey delivery is fully decoupled: the `@formbricks/surveys` bundle is built separately by Vite and served as a static asset. Any change to it requires a forced rebuild (`pnpm build --filter=@formbricks/surveys... --force`) before it takes effect in the running app.

---

## 2. Backend Architecture

### API Route Organization

**`apps/web/app/api/`**

| Route group | Description |
|---|---|
| `api/(internal)/pipeline/` | Internal server-to-server pipeline — fires webhooks, emails, integrations, billing meters, audit logs after every response event. Protected by `CRON_SECRET` header. |
| `api/v1/`, `api/v2/`, `api/v3/` | Versioned public REST API. `v1/client/` is used by the JS SDK; `v1/management/` and `v2/management/` require API key auth. |
| `api/auth/[...nextauth]/` | NextAuth.js catch-all handler |
| `api/auth/saml/`, `api/auth/sso/` | SAML/SSO via `@boxyhq/saml-jackson` |
| `api/billing/` | Stripe webhook receiver |

There is **no background job queue**. All post-response side effects (webhooks, Slack/Notion/Airtable/Google Sheets integrations, follow-up emails) run synchronously inside the pipeline route — `apps/web/app/api/(internal)/pipeline/route.ts`.

### Data Access Layering

```
API route / Server Action
        ↓
  modules/<feature>/lib/   — feature-level orchestration, server actions
        ↓
  apps/web/lib/<resource>/ — service functions (pure TS, no framework coupling)
        ↓
  @formbricks/database     — Prisma client
```

- **`apps/web/lib/`** contains per-resource service modules (`lib/survey/`, `lib/response/`, `lib/user/`, etc.). Services return `{ data }` or `{ error }` objects and never throw uncaught errors.
- **`apps/web/modules/<feature>/lib/`** orchestrates across services for a specific product feature.
- Server actions are wrapped with `next-safe-action` for type-safe input validation via Zod.

### Authentication

**`apps/web/modules/auth/lib/authOptions.ts`**

- Library: `next-auth@4.24.13` with `@next-auth/prisma-adapter` (database sessions).
- Providers: `CredentialsProvider` (email + bcrypt + TOTP), plus dynamically-loaded OAuth/SSO providers (GitHub, Google, AzureAD, OpenID Connect, SAML — all EE).
- Rate limiting on login attempts via Redis (`applyIPRateLimit`).
- Low-level helpers in `apps/web/lib/auth.ts`: `hashPassword`, `verifyPassword`, `hasOrganizationAccess`, `isManagerOrOwner`, `isOwner`.
- JWT signing for email verification tokens: `apps/web/lib/jwt.ts`.
- AES-256 encryption utilities: `apps/web/lib/crypto.ts`.

---

## 3. Frontend Architecture

### App Router Usage

**`apps/web/app/`** uses Next.js App Router with route groups:

| Group | Purpose |
|---|---|
| `(app)/` | Authenticated product surface; nested under `environments/[environmentId]/` |
| `(auth)/` | Unauthenticated pages (login, signup, invite, email verification) |
| `(redirects)/` | Short-link redirect handlers |
| `p/`, `s/`, `c/` | Public survey link renderer and short-URL handlers |

### Server vs. Client Component Split

- **Server components** handle all data fetching (direct service calls, no `fetch` waterfalls). Route layouts and page components are server-first.
- **Client components** are scoped to interactive pieces: survey editor canvas, drag-and-drop (`@dnd-kit`), rich text (`lexical`), modals, command palette (`cmdk`), and animated transitions (`framer-motion`). They are marked `"use client"`.
- `"server-only"` package (`apps/web/lib/cache/index.ts` and service modules) prevents accidental import into client bundles.

### State Management

- **Server state / data fetching:** `@tanstack/react-query` for client-side data that needs polling or cache invalidation.
- **Form state:** `react-hook-form` + Zod resolvers.
- **Server mutations:** `next-safe-action` server actions — no separate API call needed for most write operations.
- No global client-side state library (no Redux/Zustand). Shared state uses React context, scoped to feature subtrees.

---

## 4. Data Model (Key Prisma Models)

**`packages/database/schema.prisma`** — PostgreSQL with `pgvector` extension.

```
Organization ──< Project ──< Environment ──< Survey ──< Response
                                        └──< Contact ──< ContactAttribute
```

| Model | Key relationships |
|---|---|
| **Organization** | Root tenant. Has `memberships` (→ User), `projects`, `billing`, `apiKeys`, `teams` (EE). |
| **Project** | Groups environments. Has `styling`, `languages`, `projectTeams`. |
| **Environment** | `production` or `development`. Scopes surveys, contacts, webhooks, integrations, actionClasses, segments. |
| **Survey** | Full config: `questions` (JSON), `endings`, `hiddenFields`, `variables`, `triggers` (→ ActionClass), `attributeFilters` (→ Segment), `followUps`, `quotas`. `type`: `link` or `app`. |
| **Response** | A submission. Has `data` (JSON), `variables`, `ttc`, `meta`, `tags` (→ Tag via `TagsOnResponses`), `contactAttributes` (JSON snapshot). |
| **Contact** | A tracked person. Has `attributes` (→ ContactAttribute), `responses`, `displays`. |
| **ActionClass** | Survey display triggers (code-based or no-code click/page rules). |
| **Webhook** | Outbound HTTP webhook with `triggers` (enum: `responseCreated/Updated/Finished`) and optional HMAC `secret`. |
| **ApiKey** | Org-scoped API key. Has `organizationAccess` (JSON) and per-environment permissions via `ApiKeyEnvironment`. |
| **Team** (EE) | Sub-group within org. Has `teamUsers` and `projectTeams` with `read/readWrite/manage` roles. |

---

## 5. External Dependencies

| Dependency | Used For |
|---|---|
| **PostgreSQL** | Primary database (all persistent data via Prisma). `pgvector` extension enabled for AI embedding storage. |
| **Redis** | Request-level cache (environment state, org billing), API rate limiting, distributed locks (license fetch, cache stampede prevention). Connection via `REDIS_URL`. Gracefully degraded if absent — `packages/cache/src/client.ts`. |
| **No job queue** | There is no Bull/BullMQ/etc. Post-response side effects run inline in the pipeline API route. |
| **Stripe** | Billing, subscription management, usage metering. Webhook receiver at `api/billing/`. Package: `stripe@20.4.1`. |
| **Nodemailer** | Transactional email delivery. Configured in `@formbricks/email`. |
| **S3 / local filesystem** | File upload storage (survey attachments, images). Abstracted in `@formbricks/storage`. |
| **PostHog** | Product analytics — both client-side (`posthog-js`) and server-side (`posthog-node`). |
| **Sentry** | Error tracking (`@sentry/nextjs@10`). |
| **BoxyHQ SAML Jackson** | SAML 2.0 SSO (EE). `@boxyhq/saml-jackson@26`. |
| **Formbricks License Server** | `https://ee.formbricks.com/api/licenses/check` — validates `ENTERPRISE_LICENSE_KEY` for EE features. |

---

## 6. Enterprise / Paid Feature Separation

**`apps/web/modules/ee/`** — all enterprise features are physically isolated under this directory, governed by a separate `LICENSE` file at `apps/web/modules/ee/LICENSE`.

**EE modules:**

| Module | Feature |
|---|---|
| `billing/` | Stripe plan management, usage metering |
| `contacts/` | Advanced contact management and segmentation |
| `sso/` | OAuth/SAML SSO provider configuration |
| `two-factor-auth/` | TOTP 2FA enforcement |
| `role-management/` | Fine-grained RBAC |
| `teams/` | Team-based project access control |
| `whitelabel/` | Custom branding / remove Formbricks branding |
| `audit-logs/` | Audit event storage |
| `quotas/` | Survey response quota enforcement |
| `license-check/` | Runtime license validation |

**License check architecture** (`apps/web/modules/ee/license-check/lib/license.ts`):

1. `ENTERPRISE_LICENSE_KEY` env var is sent to the Formbricks license server.
2. Result is cached in three layers: **in-process memory** (1 min) → **Redis** (24h on success, 10 min on failure) → **previous-result Redis key** (4 days, grace period).
3. A **3-day grace period** keeps EE features active if the license server is temporarily unreachable and the last successful check was within 4 days.
4. A **distributed lock** (`cache.tryLock`, 90s TTL) ensures only one instance fetches from the license server when the cache is cold.
5. Feature flags returned by the license server: `isMultiOrgEnabled`, `twoFactorAuth`, `sso`, `whitelabel`, `contacts`, `aiSmartTools`, `aiDataAnalysis`, `saml`, `auditLogs`, `accessControl`, `quotas`, and others.

OSS code never imports directly from `modules/ee/`; instead it calls entitlement checks (`modules/entitlements/`) which return booleans, keeping the open-source core free of enterprise coupling.

```

## Evaluation

## Evaluation of Agent Output Against Rubric

### Rubric Criterion Assessment

**1. Identifies turborepo with `apps/web` (Next.js) and `packages/*`**
✅ Fully met. The output clearly identifies the pnpm/Turborepo monorepo structure, lists `apps/web` as "Main Next.js 16 product", and enumerates all major `packages/*` entries including `database`, `cache`, `email`, `storage`, `ai`, `types`, etc. with accurate descriptions.

**2. Correctly names Next.js App Router, Prisma, and identifies the API v2 structure in `apps/web/modules/api/v2`**
⚠️ Partially met. Next.js App Router is correctly identified and described in detail. Prisma is correctly named throughout. However, the API v2 structure is listed as `apps/web/app/api/v2/` rather than `apps/web/modules/api/v2` — this is a structural inaccuracy. The rubric specifically calls out `apps/web/modules/api/v2/auth/authenticate-request.ts` as a path to cite, which is absent.

**3. Points to `apps/web/modules/` as primary domain-driven organization**
✅ Met. The output references `apps/web/modules/<feature>/lib/` as feature-level orchestration and explicitly discusses `apps/web/modules/ee/` for enterprise features. The modules directory is treated as a primary organizational unit throughout.

**4. Names core Prisma models: Organization, Project, Environment, Survey, Response, Contact, Webhook**
✅ Fully met. Section 4 explicitly covers all seven required models in a structured table with relationship descriptions. Also correctly identifies the hierarchy `Organization → Project → Environment → Survey → Response`.

**5. Mentions `apps/web/modules/ee/` for enterprise features**
✅ Fully met. Entire section 6 is dedicated to this, listing specific EE modules and the license check architecture with accurate detail.

**6. Identifies Redis as cache provider (via `packages/cache`) and PostgreSQL as primary DB**
✅ Fully met. Both are explicitly named in sections 4 and 5. `packages/cache` is listed in the monorepo table, Redis use cases are described accurately (rate limiting, distributed locks, cache layers), and PostgreSQL with `pgvector` is correctly identified.

**7. Cites actual file paths**
✅ Largely met. Numerous real paths are cited: `packages/database/schema.prisma`, `apps/web/modules/auth/lib/authOptions.ts`, `apps/web/lib/auth.ts`, `apps/web/lib/jwt.ts`, `apps/web/lib/crypto.ts`, `apps/web/app/api/(internal)/pipeline/route.ts`, `packages/cache/src/client.ts`, `apps/web/modules/ee/license-check/lib/license.ts`. The specific rubric-cited path `apps/web/modules/api/v2/auth/authenticate-request.ts` is absent, which is a minor gap.

**8. No hallucinations of tech stack**
✅ Fully met. No mentions of GraphQL, TypeORM, or other non-existent technologies. The stack described (NextAuth, Prisma, Redis, PostgreSQL, Stripe, Nodemailer, PostHog, Sentry, BoxyHQ) is consistent with a real Formbricks codebase. The claim of "Next.js 16" is slightly suspect (Next.js 16 is not a released version as of the knowledge cutoff; likely Next.js 15), but this is a minor factual imprecision rather than a hallucination of a missing technology.

---

### Summary

The output is exceptional in depth, accuracy, and organization. It goes well beyond the rubric requirements in several areas (license check architecture, pipeline internals, auth layering, state management). The only meaningful gaps are:

- The API v2 module path is mislocated (`apps/web/app/api/v2/` vs. `apps/web/modules/api/v2/`), and the specific file `authenticate-request.ts` is not cited.
- "Next.js 16" is likely a version inaccuracy.

These are minor issues in an otherwise highly accurate, well-structured, and hallucination-free architecture document.

---

**Final Score: 4.5 / 5**

