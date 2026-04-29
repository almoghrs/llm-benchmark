# T-08 - Debug a planted bug

**Category:** Debug
**Difficulty:** ●●●○○

## Prompt

```text
Users are reporting that on the responses list page, the most recently-
submitted response is sometimes missing when filtered by today's date.
Investigate and propose a fix.
```

## Expected

- Doesn't immediately patch — shows evidence of reading the filtering code before proposing a fix.
- Finds the *planted* bug: `lte` changed to `lt` in `apps/web/lib/response/utils.ts` (the `createdAt` date-filter object and the `createdAt.lte` assignment). This is the only deliberately planted bug — an agent that finds a different bug is likely finding a false positive.
- Explains *why* the bug causes the symptom: `lt` (strict less-than) excludes responses whose timestamp matches the upper boundary exactly, while `lte` (less-than-or-equal) includes them.
- Fix is minimal and targeted: change `lt` back to `lte` (two occurrences in the same file).
- Where the agent finds the bug via investigation, it should express appropriate confidence. Where it cannot reproduce the issue and is reasoning from code alone, it should note that caveat.
