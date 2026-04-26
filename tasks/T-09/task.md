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

- Respects "show before edit".
- Identifies a real, meaningful duplication (not cosmetic).
- Helper signature is clean; uses TypeScript generics sensibly.
- All call sites updated; no orphaned imports.
- Error messages / types preserved.
