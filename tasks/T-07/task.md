# T-07 - Plan a feature — no code

**Category:** Plan
**Difficulty:** ●●●○○

## Prompt

```text
We want to add "record-level audit logs": every time a Survey or
Organization is created / updated / deleted, record who did it, when,
and what changed.

DO NOT WRITE CODE YET. Produce a plan:
- Where in the existing architecture should this hook in? (be specific —
  name the lib/service layer or the Prisma middleware)
- DB schema proposal (table, columns, indexes)
- API surface for reading audit logs
- Open questions / trade-offs (perf, storage, PII, retention)
- Break into 3–5 concrete engineering tasks with rough effort

Wait for my feedback before any implementation.
```

## Expected

- Respects "no code yet" and "wait for feedback".
- Grounds the plan in the actual repo — names real service layers or Prisma middleware patterns seen in the codebase.
- Schema proposal is sensible (actor_id, entity_type, entity_id, diff JSON, timestamp, environment_id, indexes).
- Raises real trade-offs (write amplification, PII in diffs, retention).
- Tasks are small enough to estimate.
