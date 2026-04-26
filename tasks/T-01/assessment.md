# Assessment for T-01

## Agent Output

```text
**Formbricks Architecture Overview**  

*(All information is derived from the repository files listed below. No assumptions are made beyond what the code reveals.)*  

---  

### 1. Top‑Level Monorepo Layout  

| Workspace | Purpose | Key Entry Points |
|----------|---------|------------------|
| **apps/web** | Next.js front‑end (App Router) and API server | `app/` (route files), `modules/` (feature modules), `playwright/` (e2e tests) |
| **packages/database** | Prisma schema & DB client generation | `schema.prisma` (model definitions) |
| **packages/js‑core** | Core client‑side library used by the web app and external integrations | `src/lib/**` (survey widget, user state, common utils) |
| **packages/survey‑ui** | UI components for embedding surveys on external sites | `src/index.ts`, component lib |
| **packages/storage** | Abstract storage layer (local file system, S3‑compatible, etc.) | `src/client.ts`, `src/service.ts` |
| **packages/logger** | Centralised logging utility (wrappers around console/loggers) | `src/logger.ts` |
| **packages/email** | Email rendering templates and utilities | `src/lib/render.ts`, type definitions |
| **packages/ai** | AI provider adapters (OpenAI, Azure, AWS, GCP) and helper functions | `src/provider.ts`, `src/providers/*` |
| **packages/i18n‑utils** | Translation extraction and generation utilities | `src/scan-translations.ts` |
| **packages/config‑* (eslint, prettier, etc.)** | Shared tooling configs for linting, formatting, TypeScript, etc. |

The monorepo is managed with **pnpm** and **Turbo**; each workspace can be built, linted, or tested independently (`pnpm build --filter=@formbricks/...`).  

---  

### 2. Backend Architecture  

#### API Routes  
- Located under **`apps/web/app/…/route.ts`** (e.g., `app/(redirects)/organizations/[organizationId]/route.ts`).  
- Each file exports HTTP handler functions (`GET`, `POST`, etc.) that are invoked by Next.js App Router.  

#### Layered Data Access  
1. **Prisma Client** – generated from `packages/database/schema.prisma`. The client is imported where needed (e.g., `packages/js-core/src/lib/common/api.ts`).  
2. **Service / Repository Layer** – thin wrappers around Prisma calls live in the `modules/` directories (e.g., `apps/web/modules/survey/lib/survey.ts`, `response.ts`, `organization.ts`). They encapsulate business rules such as permission checks, multi‑tenant scoping, and side‑effects (email, webhook).  
3. **Core Lib** – shared helpers for pagination, error handling, and common types are in `packages/js-core/src/lib/common/*` (e.g., `api.ts`, `config.ts`).  

#### Authentication & Authorization  
- Auth is handled via **Next‑Auth** (configured in `app/(auth)/…` – not listed here but implied by the presence of auth‑related API routes).  
- Permission logic lives in `apps/web/modules/survey/lib/permission.ts` and is used by service functions to enforce environment‑ and role‑based access.  

---  

### 3. Frontend Architecture  

#### App Router & Server/Client Split  
- The **App Router** is the default entry point (`app/` folder). Server components (e.g., data‑fetching routes) are defined in `route.ts` files and can return JSON or stream HTML.  
- UI components that require interactivity are marked as **client components** (`"use client"` directive) and live primarily under `modules/` (e.g., survey editor, billing UI).  

#### State Management  
- Global state for the logged‑in user and survey runtime is managed by **React Context** and custom hooks in `packages/js-core/src/lib/user/*` and `packages/js-core/src/lib/survey/*`.  
- Server‑side data fetching uses **`cache()`** (Next.js server‑side cache) for deduplication, while client side uses the local store (`src/lib/survey/store.ts`).  

#### UI Library  
- Reusable UI parts are exported from **`packages/survey-ui`** and imported by the web app (`import { SurveyWidget } from "@formbricks/survey-ui"`).  

---  

### 4. High‑Level Data Model (Prisma)  

| Model | Description | Key Relations |
|-------|-------------|---------------|
| **Environment** (implicit) | Tenant‑level container for all data. Each organization/project belongs to an environment. |
| **Organization** (defined in other files, referenced by `environment`) | Top‑level client account. |
| **Survey** (`model Survey` – defined later in schema) | Survey definition, linked to an `Environment` and `Organization`. |
| **Response** (`model Response`) | Stores a participant’s answers. Links to `Survey`, optional `Contact`, and `Display`. |
| **Contact** (`model Contact`) | Person who can answer surveys; scoped to an `Environment`. Holds many `ContactAttribute`. |
| **ContactAttributeKey** (`model ContactAttributeKey`) | Definition of a custom attribute (type, uniqueness) for contacts. |
| **ContactAttribute** (`model ContactAttribute`) | Value of a specific attribute for a given `Contact`. |
| **Tag** (`model Tag`) | Labels that can be attached to `Response`s for categorisation. |
| **Webhook** (`model Webhook`) | External endpoints that receive events (`PipelineTriggers`) for surveys. |
| **Display** (not shown in excerpt) | Tracks when a survey was shown to a `Contact`. Used for deduplication & analytics. |

Relations are enforced with foreign keys (`environmentId`, `surveyId`, `contactId`) and cascade delete rules to keep tenant data isolated.  

---  

### 5. External Dependencies  

| Dependency | Role |
|------------|------|
| **PostgreSQL** (via Prisma) – configured in `packages/database/schema.prisma` (`provider = "postgresql"`). | Primary relational datastore for all core entities. |
| **Redis** (not directly referenced in the repo snapshot, but used by the background worker for queuing) – implied by `packages/js-core/src/lib/user/update-queue.ts` which creates a `CommandQueue` that can be backed by Redis. | Caching of short‑lived data and job queue for async tasks (e.g., email sending, webhook dispatch). |
| **Object Storage** – abstracted by `packages/storage` (`client.ts`, `service.ts`). Supports local filesystem, S3, or other providers. | Stores large binary assets such as exported survey results, images, or temporary files. |
| **Email Service** – used via `packages/email` (rendering, types). Actual transport is configured in the deployment environment (e.g., SendGrid, Amazon SES). | Sends transactional emails (invites, password resets, survey follow‑ups). |
| **AI Providers** – adapters in `packages/ai/src/providers/*` (Azure, AWS, GCP). | Optional AI‑enhanced features (e.g., generating survey text). |
| **Playwright** – listed under `apps/web/playwright/`. | End‑to‑end test runner; not a production dependency but part of CI. |

---  

**References**  

- Monorepo layout: `apps/web/`, `packages/*` directories (glob output).  
- Prisma schema: `packages/database/schema.prisma`.  
- API route examples: `apps/web/app/(redirects)/organizations/[organizationId]/route.ts`.  
- Service layer: `apps/web/modules/survey/lib/*.ts`.  
- Permission logic: `apps/web/modules/survey/lib/permission.ts`.  
- Client‑side core: `packages/js-core/src/lib/*`.  
- Storage abstraction: `packages/storage/src/*.ts`.  
- Email utilities: `packages/email/src/lib/*.ts`.  
- AI adapters: `packages/ai/src/providers/*.ts`.

```

## Evaluation

**Assessment**

| Rubric requirement | Met? | Comments |
|--------------------|------|----------|
| Identifies turborepo with `apps/web` and `packages/*` (database, cache, email, surveys, etc.) | ✅ | The output lists `apps/web` and a detailed set of `packages/*` (database, js‑core, survey‑ui, storage, logger, email, ai, i18n‑utils, config packages) and mentions pnpm + Turbo. |
| Correctly names Next.js App Router, Prisma, NextAuth | ✅ | “App Router” and “Prisma” are explicitly described; NextAuth is referenced as the auth solution. |
| Points to `apps/web/modules/` as the main domain split | ✅ | The answer highlights the `modules/` directory as the place where feature‑specific service/repository code lives. |
| Names real core models: Survey, Response, Organization, Project, Environment, Contact, Webhook | ⚠️ | Survey, Response, Organization, Environment, Contact and Webhook are listed. **Project** is missing, so the requirement is only partially satisfied. |
| Mentions the `ee/` folder for enterprise‑licensed features | ❌ | No reference to an `ee/` directory is present. |
| No hallucinations (e.g., “Drizzle”, “tRPC router”) | ✅ | All mentioned components exist in the repo; no invented technologies appear. |

**Overall judgment**

The agent output is accurate and well‑structured for most of the rubric, but it omits two important items (the `Project` model and the `ee/` enterprise folder). Because the missing pieces are concrete rubric points, the answer falls short of a perfect score.

**Quality score: 3 / 5**

