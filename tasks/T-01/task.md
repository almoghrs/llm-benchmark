# T-01 - Generate an architecture document

**Category:** Explain
**Difficulty:** ●○○○○

## Prompt

```text
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
6. How enterprise or paid features are separated from the open-source core.

Base everything on files you actually read. Cite file paths. Do not invent.
```

## Expected

- Identifies turborepo with `apps/web` (Next.js) and `packages/*` (database, cache, email, storage, ai, types, etc.).
- Correctly names Next.js App Router, Prisma, and identifies the API v2 structure in `apps/web/modules/api/v2`.
- Points to `apps/web/modules/` as the primary domain-driven organization for feature logic.
- Names core Prisma models: `Organization`, `Project`, `Environment`, `Survey`, `Response`, `Contact`, `Webhook`.
- Mentions the `apps/web/modules/ee/` directory for enterprise features.
- Identifies Redis as the cache provider (via `packages/cache`) and PostgreSQL as the primary DB.
- Cites actual file paths like `packages/database/schema.prisma` or `apps/web/modules/api/v2/auth/authenticate-request.ts`.
- No hallucinations of tech stack (e.g. no mentions of "GraphQL", "TypeORM").
