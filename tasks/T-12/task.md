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

- Catches: request timeout (for large files), memory blow-up (parsing unlimited CSV in memory), long transaction holding locks (blocking other DB operations), no partial progress (all-or-nothing failure is bad for UX), no dedupe on email.
- Proposes: async processing (e.g., using `setImmediate` or a real queue), streaming parse (if file is large), chunked inserts (to keep transactions short), per-row error collection, progress reporting.
- References the existing `createContactsFromCSV` implementation in `apps/web/modules/ee/contacts/lib/contacts.ts` as a production-grade reference (it uses metadata extraction, lookup maps, and chunking).
- Considers: environment-scoping (multi-tenancy), duplicate-handling (skip vs update vs overwrite), and performance optimization via lookup maps (to avoid 1 query per row).
