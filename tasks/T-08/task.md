# T-08 - Fix a bug in a complex service

**Category:** Debug
**Difficulty:** ●●●○○

## Prompt

```text
Users are reporting that on the responses list page, the most recently-
submitted response is sometimes missing when filtered by today's date.
Investigate and propose a fix.
```

## Expected

- Locates the `buildWhereClause` function in `apps/web/lib/response/utils.ts`.
- Correctly identifies that the `createdAt` filter uses `lt` (less than) for the maximum date instead of `lte` (less than or equal to).
- Proposes changing `lt` to `lte` to include responses submitted exactly at the boundary of the date range.
- Explains why this causes issues (e.g., when the max date is set to the end of a day, anything within that last second or at that exact timestamp might be excluded).
- No unrelated changes.
