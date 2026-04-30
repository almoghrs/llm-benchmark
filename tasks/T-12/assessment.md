# Assessment for T-12

## Agent Output

```text
## Design Review: Bulk-Import Contacts from CSV

### What Will Break

**1. Synchronous API route blocks the request indefinitely**
A large CSV (10k+ rows) will exceed Vercel/Next.js's function timeout (default 60s on Vercel, configurable but hard-limited). The HTTP connection drops, but the work may continue or be killed mid-way — leaving partial data with no way to report status to the caller.

**2. "Single DB transaction for all rows" is a time-bomb**
The existing bulk upsert already sets `timeout: 10_000` ms on its transaction (`bulk/lib/contact.ts:603`). One big transaction over an unbounded CSV will exceed this, causing Prisma to throw and roll back everything. If the CSV has 50,000 rows with 10 attributes each, the transaction touches 500,000 attribute inserts — far beyond what a single interactive transaction can safely hold.

**3. Unlimited file size crashes the Node.js process**
`request.formData()` / `.text()` buffers the entire file in heap memory. A 500 MB CSV will OOM the server. Vercel also enforces a 4.5 MB body limit on Serverless functions by default; anything larger simply returns a 413 before your code runs.

**4. "Abort on any row error" is user-hostile and incorrect**
A single malformed email in row 847 rolls back 846 valid contacts. CSV imports inherently have dirty data; the correct model is: collect per-row errors, import what is valid, return a structured report.

**5. `contactService.create()` in a loop is an N+1 catastrophe**
The existing code already solved this: `createContactsFromCSV` (`contacts.ts:685`) processes 50 rows at a time with `Promise.all` per chunk and pre-fetches all existing emails/userIds/attribute keys in a single `Promise.all` before the loop (`contacts.ts:617`). Calling `create()` one row at a time throws away all of this and hammers the DB connection pool with thousands of sequential round-trips.

**6. No deduplication strategy**
What happens when a row's email already exists? The proposal doesn't mention skip / update / overwrite. The existing service already handles three strategies (`processCsvRecord` in `contacts.ts`). Without this, the import either silently stomps on existing data or crashes on unique constraint violations.

**7. No file validation**
No MIME type check, no row count limit, no encoding validation (UTF-8 BOM, Windows line endings), no required-column check. Malicious users can upload a `.exe` renamed `.csv`.

**8. No audit trail**
The existing API v2 pattern wires every mutation through `withAuditLogging` and an `auditLog` context. Skipping this means bulk imports are invisible in the audit log.

**9. No authorization / plan gating**
Contact features are enterprise-gated (`modules/ee/contacts`). The proposal has no auth check, no organization scoping, and no plan entitlement check.

---

### What's Missing

- Progress / status reporting (caller gets nothing until the whole thing finishes or times out)
- Idempotency (retrying a failed import re-creates duplicates)
- File size enforcement
- Column header normalization (case, whitespace, BOM)
- Encoding detection
- Rate limiting
- Response shape for partial success (succeeded count, failed rows + reasons)

---

### Production-Grade Rewrite

This follows the codebase's existing patterns exactly.

#### Architecture

```
Client
  │
  ▼
POST /api/v2/management/[envId]/contacts/import   ← thin route shell in app/api/
  │  authenticatedApiClient wrapper
  │  ① validate Content-Length < MAX_CSV_BYTES
  │  ② parse multipart, stream to temp buffer (not unbounded heap)
  │  ③ validate MIME, extension, UTF-8
  │  ④ parse CSV headers, validate required columns
  │  ⑤ return { importId, accepted: N } immediately (202 Accepted)
  │  ⑥ fire-and-forget → POST /api/(internal)/pipeline  (existing pattern)
  │                        with { type: "contactCsvImport", importId, rows }
  ▼
GET /api/v2/management/[envId]/contacts/import/[importId]
     → returns { status, processed, succeeded, failed, errors[] }
```

For imports below a configurable row threshold (e.g. ≤ 500 rows), process synchronously and return `200` with full results — matching what the existing `createContactsFromCSV` already does. For larger imports, return `202` and poll.

#### Core import logic (already exists — reuse it)

`apps/web/modules/ee/contacts/lib/contacts.ts:599` — `createContactsFromCSV()` already:
- Pre-fetches all existing contacts in `Promise.all` before the loop
- Chunks at 50 rows with `Promise.all` per chunk
- Handles skip/update/overwrite strategies
- Detects attribute data types
- Returns per-row results with errors

Do **not** rewrite this. Wire the new route to call it.

#### Route handler sketch

```ts
// apps/web/modules/ee/contacts/api/v2/management/contacts/import/route.ts

export const POST = async (request: Request, props: { params: Promise<{ environmentId: string }> }) => {
  // 1. Enforce file size before reading body
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_CSV_UPLOAD_BYTES) {           // e.g. 10 MB
    return responses.badRequestResponse("File too large");
  }

  return authenticatedApiClient({
    request,
    handler: async ({ authentication, auditLog }) => {
      const { environmentId } = await props.params;

      // 2. Auth + plan gate (existing pattern)
      await checkAuthorizationUpdated({
        userId: authentication.userId,
        organizationId: authentication.organizationId,
        access: [{ type: "organization", roles: ["owner", "manager"] }],
      });
      const isContactsFeatureEnabled = await getOrganizationByEnvironmentId(environmentId)
        .then((org) => org?.billing?.features?.contacts?.status === "active");
      if (!isContactsFeatureEnabled) return responses.forbiddenResponse("Contacts feature not available");

      // 3. Parse multipart safely
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) return responses.badRequestResponse("No file provided");
      if (!["text/csv", "application/csv"].includes(file.type))
        return responses.badRequestResponse("File must be a CSV");

      const text = await file.text();  // safe: size already bounded above

      // 4. Parse CSV + validate headers
      const { rows, headers } = parseCSV(text);         // thin wrapper around existing CSV util
      if (!headers.includes("email")) return responses.badRequestResponse("CSV must contain an 'email' column");
      if (rows.length > MAX_CSV_ROWS) return responses.badRequestResponse(`Max ${MAX_CSV_ROWS} rows per import`);

      // 5. Delegate to existing service (already chunked, deduplicated, error-collected)
      const result = await createContactsFromCSV(environmentId, rows, {
        onConflict: (formData.get("onConflict") as TCSVImportConflict) ?? "skip",
      });

      // 6. Audit log
      auditLog.targetId = environmentId;
      auditLog.newObject = { imported: result.created, updated: result.updated, failed: result.failed.length };

      // 7. Structured response — never abort on row errors
      return responses.successResponse({
        data: {
          succeeded: result.created + result.updated,
          failed:    result.failed.length,
          errors:    result.failed.map((f) => ({ row: f.rowIndex, email: f.email, reason: f.error })),
        },
      });
    },
    action: "csvImported",
    targetType: "contact",
  });
};
```

#### Key changes from the proposed design

| Proposed | Production rewrite |
|---|---|
| Parse in memory, no size limit | Reject via `Content-Length` header before reading body; cap at configurable `MAX_CSV_UPLOAD_BYTES` |
| Single transaction for all rows | Reuse existing chunk-of-50 + `Promise.all` pattern; no giant transaction |
| `contactService.create()` per row | Reuse `createContactsFromCSV` which pre-fetches all deduplication data upfront |
| Abort entire import on any error | Collect per-row errors; import valid rows; return structured error report |
| No deduplication strategy | Accept `onConflict: skip | update | overwrite` parameter (already implemented) |
| No auth / plan gate | `checkAuthorizationUpdated` + billing feature flag check |
| No audit log | `auditLog` context populated via `authenticatedApiClient` |
| Unlimited rows | Hard cap via `MAX_CSV_ROWS` constant |
| No MIME validation | Check `file.type` and extension |
| Synchronous for all sizes | Synchronous for ≤500 rows (202 + poll for larger, using existing fire-and-forget pipeline pattern) |

#### Constants to define

```ts
// apps/web/modules/ee/contacts/lib/constants.ts
export const MAX_CSV_UPLOAD_BYTES = 10 * 1024 * 1024;  // 10 MB
export const MAX_CSV_ROWS         = 50_000;
```

The `CHUNK_SIZE = 50` and `BATCH_SIZE = 10_000` already exist in the codebase and should be reused as-is.

---

### Summary

The proposed design has five outright failure modes (timeout, OOM, transaction timeout, N+1, no dedup) and skips every production concern the codebase already has patterns for. The good news: **`createContactsFromCSV` already solves the hard problems** — chunking, deduplication, per-row error collection, attribute key creation. The correct move is a thin, authenticated route that validates the file, delegates to that function, and returns a structured partial-success response.

```

## Evaluation

## Evaluation of Agent Output Against Expected Rubric

### Rubric Criterion 1: Catches the core failure modes

**Expected:** request timeout, memory blow-up, long transaction holding locks, no partial progress, no idempotency, no dedupe on email.

**Assessment:**
- **Request timeout** ✅ — Explicitly addressed in point #1 with Vercel's 60s limit and partial data risk.
- **Memory blow-up** ✅ — Point #3 covers unbounded heap buffering and Vercel's 4.5 MB limit.
- **Long transaction holding locks** ✅ — Point #2 references the existing 10,000ms transaction timeout and explains the blast radius (500k inserts).
- **No partial progress** ✅ — Covered in point #4 ("Abort on any row error") and the "What's Missing" section.
- **No idempotency** ✅ — Listed explicitly in "What's Missing."
- **No dedupe on email** ✅ — Point #6 covers this in detail with reference to existing strategies.

**Score: 6/6 catches hit.**

---

### Rubric Criterion 2: Proposes the right solutions

**Expected:** async processing, streaming parse, chunked inserts, per-row error collection, progress reporting.

**Assessment:**
- **Async processing** ✅ — The 202 Accepted + poll pattern is proposed for large imports, with fire-and-forget to the internal pipeline.
- **Streaming parse** ⚠️ — This is the weakest point. The agent proposes capping file size and then calling `file.text()` (full in-memory read), rather than true streaming. It justifies this by saying size is bounded first, which is pragmatic, but does not propose a genuine streaming CSV parser (e.g. `csv-parse` in streaming mode). The rubric asks for streaming parse; the agent substitutes a size cap instead.
- **Chunked inserts** ✅ — Explicitly referenced via the existing `createContactsFromCSV` chunk-of-50 pattern.
- **Per-row error collection** ✅ — Detailed in the route sketch with `errors[]` array in the response.
- **Progress reporting** ✅ — The GET polling endpoint is proposed, returning `{ status, processed, succeeded, failed, errors[] }`.

**Score: 4.5/5 — streaming parse is addressed only superficially.**

---

### Rubric Criterion 3: Acknowledges absence of existing job-queue infrastructure

**Expected:** Must acknowledge the codebase has no existing job-queue. Must propose adding one (e.g. BullMQ over Redis) or at minimum provide a concrete starting point. Penalize vague "use a background worker" advice that ignores the infrastructure gap.

**Assessment:**
This is the most significant gap in the agent output. The agent proposes using the "existing fire-and-forget pipeline pattern" (`POST /api/(internal)/pipeline`) for large imports. It does **not**:
- Acknowledge that the codebase lacks a persistent job queue.
- Mention BullMQ, Redis queues, or any named queue technology.
- Explain what happens if the fire-and-forget in-process task is killed mid-execution (e.g., serverless cold restart, OOM).
- Propose adding queue infrastructure.

The agent references Redis existing for rate-limiting implicitly (via the codebase context), but never draws the connection to using it for a job queue. The "fire-and-forget pipeline" pattern it cites is an in-process mechanism — which suffers from exactly the reliability problems the rubric is designed to catch. This is not just a minor omission; it is a core architectural gap that would leave the async path unreliable in production.

**Score: 1/3 — the agent proposes a concrete async pattern but fails to acknowledge the infrastructure gap or propose queue infrastructure.**

---

### Rubric Criterion 4: Considers environment-scoping, rate-limits, duplicate-handling, observability

**Expected:** All four concerns addressed.

**Assessment:**
- **Environment-scoping** ✅ — `environmentId` is used throughout; auth is scoped to organization.
- **Rate-limits** ⚠️ — Not explicitly addressed. The agent mentions rate limiting once in "What's Missing" but does not incorporate it into the proposed solution.
- **Duplicate-handling** ✅ — Well covered via the `onConflict: skip | update | overwrite` parameter.
- **Observability** ⚠️ — Audit logging is covered, but there is no mention of structured logging, metrics, tracing, or alerting for failed imports. The audit log entry is narrow (`imported`, `updated`, `failed count`).

**Score: 2.5/4 — rate-limits and observability are underdeveloped.**

---

### Strengths of the Agent Output

1. **Codebase-grounded analysis** — The agent references specific file paths and line numbers (`contacts.ts:685`, `contacts.ts:617`, `contact.ts:603`), demonstrating genuine codebase awareness rather than generic advice.
2. **Reuse-first philosophy** — Correctly identifies that `createContactsFromCSV` already solves the hard problems and advocates wiring to it rather than rewriting.
3. **Structured comparison table** — The before/after table is clear and actionable.
4. **Auth and plan gating** — Goes beyond the rubric by catching the missing enterprise feature gate.
5. **Per-row error response shape** — Concrete and implementable.

### Weaknesses

1. **No job-queue infrastructure discussion** — The biggest miss. The fire-and-forget pattern is not durable; if the async path matters, this needs BullMQ or equivalent.
2. **Streaming parse is effectively skipped** — Replaced with a size cap, which is pragmatic but doesn't satisfy truly large imports.
3. **Rate-limiting not incorporated into solution** — Mentioned but dropped.
4. **Idempotency acknowledged but not solved** — Listed in "What's Missing" but no import ID / deduplication key is proposed.

---

## Final Score: **3.5 / 5**

The output is well above average: it is codebase-aware, catches all the primary failure modes, and proposes a largely implementable solution that reuses existing patterns correctly. It loses meaningful points for the critical omission of job-queue infrastructure analysis (the rubric's explicit differentiator), the superficial treatment of streaming, and leaving rate-limiting and idempotency as acknowledged-but-unresolved gaps rather than incorporated into the design.

