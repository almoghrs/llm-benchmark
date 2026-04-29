# T-09 - Refactor without breaking behavior

**Category:** Implement
**Difficulty:** ●●●●○

## Prompt

```text
Pick a service file in apps/web/modules with more than one method doing
similar DB access + not-found-throw patterns (e.g. repeated
prisma.survey.findUnique + throw-if-null). Extract the duplication into
a private helper. Keep behavior identical and update all callers.

Before making the change, show me: the file, the duplication you see,
and the proposed helper signature. Wait for my confirmation before editing.
```

## Expected

- Respects "show before edit" — does not apply any changes before presenting the analysis.
- Identifies a real, meaningful duplication (not cosmetic whitespace or naming).
- Helper signature is clean; uses TypeScript generics sensibly where warranted.
- Analysis covers all call sites; no call site is overlooked or left unaddressed in the proposal.
- Proposed error messages / types are preserved relative to the originals.

> Note: because the prompt explicitly says "wait for my confirmation before editing", the agent
> should NOT apply the refactor. Full credit applies to the proposal alone if it is correct and
> complete. The "all call sites" criterion is assessed on the analysis, not on executed edits.
