# T-12 - Design review — spot the problems

**Category:** Arch
**Difficulty:** ●●●●●

## Prompt

```text
Here's a proposed design for a "bulk-import Contacts from CSV" feature:

"We'll accept the uploaded CSV synchronously in the API route, parse it
in memory, loop over rows, and for each row call contactService.create().
We'll wrap the whole thing in a single DB transaction. On any row error
we abort the entire import. Max file size: unlimited."

Review this design. What will break? What's missing? Rewrite it to be
production-grade, taking this codebase's existing patterns into account.
```

## Expected

- Catches: request timeout, memory blow-up, long transaction holding locks, no partial progress, no idempotency, no dedupe on email.
- Proposes: async processing, streaming parse, chunked inserts, per-row error collection, progress reporting.
- Acknowledges that **this codebase has no existing job-queue infrastructure**. A production-grade rewrite must therefore propose adding one (e.g. BullMQ over the existing Redis instance used for rate-limiting). Proposing a generic queue approach is acceptable; penalise vague "use a background worker" advice only if it ignores the absence of existing infrastructure and offers no concrete starting point.
- Considers: environment-scoping, rate-limits, duplicate-handling, observability.
