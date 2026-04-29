# T-10 - Cross-stack feature

**Category:** Implement
**Difficulty:** ●●●●○

## Prompt

```text
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

## Expected

- Adds `isPinned Boolean @default(false)` to the `Survey` model in `packages/database/schema.prisma` and produces a correct, reversible migration SQL (`ALTER TABLE "Survey" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false`). Running `prisma migrate dev` is preferred but manually authoring the SQL file is acceptable — what matters is that the migration is correct and reversible.
- Backend action/route uses the existing auth + env helpers (`authenticatedActionClient`, `checkAuthorizationUpdated`, `hasPermission`).
- List sort integrates with the existing query / sort parameters (prepend `isPinned: "desc"` to `orderBy` for standard sorts; add a `pinned` bucket for relevance sort).
- Optimistic update uses the project's data-fetching hook (TanStack Query `useMutation` with cache update), not raw `useState`.
- No broken types; no TODOs left behind.
- Works end-to-end if you'd actually run it.
