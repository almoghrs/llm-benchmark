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
- References the codebase's existing async/queue or background-job patterns, not generic advice.
- Considers: environment-scoping, rate-limits, duplicate-handling, observability.
