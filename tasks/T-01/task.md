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

Base everything on files you actually read. Cite file paths. Do not invent.
```

## Expected

- Identifies turborepo with `apps/web` and `packages/*` (database, cache, email, surveys, etc.).
- Correctly names Next.js App Router, Prisma, NextAuth.
- Points to `apps/web/modules/` as the main domain split.
- Names real core models: Survey, Response, Organization, Project, Environment, Contact, Webhook.
- Mentions the `ee/` folder for enterprise-licensed features.
- No hallucinations (e.g. "Drizzle", "tRPC router" — wrong).
