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

- Adds `isPinned Boolean @default(false)` to the `Survey` model in `packages/database/schema.prisma`.
- Updates `getSurveyOrderBy` in `apps/web/modules/survey/list/lib/survey-page.ts` to prepend `{ isPinned: "desc" }` to the sort arrays.
- Implements a new Server Action `toggleSurveyPinAction` in `apps/web/modules/survey/list/actions.ts` using `authenticatedActionClient`.
- Adds the pin toggle UI to `apps/web/modules/survey/list/components/survey-card.tsx` (e.g., next to the survey name).
- Uses `useMutation` (or similar project pattern) with `onMutate` for a real optimistic update that updates the local cache for `useSurveys`.
- Ensures the migration is created using the project's established Prisma workflow.
- No broken types; the `TSurvey` and `TSurveyListItem` types should be updated to include `isPinned`.
