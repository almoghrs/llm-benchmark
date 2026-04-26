# T-07 - Plan a feature — no code

**Category:** Plan
**Difficulty:** ●●●○○

## Prompt

```text
We want to add "A/B Testing" for survey links: allowing users to create
two variations of a survey and split traffic 50/50 between them.

DO NOT WRITE CODE YET. Produce a plan:
- Where in the existing architecture should this hook in? (be specific —
  name the lib/service layer, the response collection, and the frontend router)
- DB schema proposal (new tables, modifications to Survey or Environment, indexes)
- API surface for tracking which variant was shown and collecting responses
- Open questions / trade-offs (cookie vs. IP tracking, analytics, DB load)
- Break into 3–5 concrete engineering tasks with rough effort

Wait for my feedback before any implementation.
```

## Expected

- Respects "no code yet" and "wait for feedback".
- Grounds the plan in the actual repo — names real service layers and the Next.js App router patterns seen in the codebase.
- Schema proposal is sensible (e.g., variant_id, split_percentage, mapping to responses).
- Raises real trade-offs (e.g., how to deterministically assign variants to anonymous respondents without breaking cache).
- Tasks are small enough to estimate.
