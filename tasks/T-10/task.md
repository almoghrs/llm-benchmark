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

- Creates a real Prisma migration via the project's migration tool.
- Backend action/route uses the existing auth + env helpers.
- List sort integrates with the existing query / sort parameters.
- Optimistic update uses the project's data-fetching hook, not raw state.
- No broken types; no TODOs left behind.
- Works end-to-end if you'd actually run it.
