# Assessment for T-06

## Agent Output

```text
Now I have a thorough understanding of the conventions. Let me also check the specific environment-scoped v1 routes and existing response/contact service count functions.
There's no existing `getContactCount` function. I'll need to look at how responses are counted by environment (via survey join) and create a service function for environment stats. Let me now look at the response service for environment-based counting and check the `__mocks__/database.ts`.
Now I have everything I need. Let me look at the getSurveyCount test to understand the test pattern, then create all the files.
Now I have all the information needed. Let me set up my plan and create the files.
Now let me check how `withV1ApiWrapper` passes the `environmentId` from the URL — whether it uses `props` from route params or parses the URL manually.
The `props` parameter is passed through. Let me look at how an existing environment-scoped route uses `props.params`:
There's already a `[environmentId]` folder. Let me check existing routes there and how `props.params` is used:
Now I understand the `props.params` pattern. Let me update the route handler to use it correctly:
I see there are two different mock styles. The survey test uses `@/lib/__mocks__/database` (mockDeep), while environment test manually mocks. Let me use the mockDeep pattern from the survey test since our service uses `prisma.survey.count`, `prisma.response.count`, and `prisma.contact.count`.
All 5 tests pass. Let me mark the final todo as completed.
All 5 tests pass. Here's a summary of the three files created:

---

### `apps/web/lib/environment/stats.ts`
Service function `getEnvironmentStats(environmentId)` — uses `reactCache()`, `validateInputs()`, runs three Prisma `count` queries in parallel via `Promise.all`, and wraps Prisma known errors in `DatabaseError`. Responses are counted through the `survey.environmentId` relation (since `Response` has no direct `environmentId`).

### `apps/web/app/api/v1/management/environments/[environmentId]/stats/route.ts`
`GET` handler using `withV1ApiWrapper` (same wrapper as all other v1 management routes). Guards with `!("apiKeyId" in authentication)` → `notAuthenticatedResponse`, then `hasPermission(..., "GET")` → `unauthorizedResponse`. Reads `environmentId` from `props.params` (Next.js App Router pattern used by sibling routes). Returns `responses.successResponse(stats)`.

### `apps/web/lib/environment/stats.test.ts`
5 unit tests using `@/lib/__mocks__/database` (vitest-mock-extended deep mock), matching the pattern from `lib/survey/service.test.ts`:
- Happy path: returns correct counts, returns zeros
- Sad path: `testInputValidation` for invalid input, `DatabaseError` on `PrismaClientKnownRequestError`, re-throws unknown errors

```

## Evaluation

## Evaluation

### Rubric Criterion Assessment

**1. Places route under the existing `apps/web/app/api/v1/` tree**
The agent places the route at `apps/web/app/api/v1/management/environments/[environmentId]/stats/route.ts`, which correctly follows the existing v1 management route tree pattern. **Pass.**

**2. Reuses existing auth / environment-resolution helpers**
The agent uses `withV1ApiWrapper` (the same wrapper used by all sibling v1 management routes), checks `"apiKeyId" in authentication` for the not-authenticated guard, and calls `hasPermission` for authorization — all consistent with existing patterns. `props.params` is used for `environmentId` resolution, matching the App Router pattern of sibling routes. **Pass.**

**3. Service function goes under the right module (surveys or environments)**
The service is placed at `apps/web/lib/environment/stats.ts`, under the `environment` module. This is a reasonable location given the function aggregates environment-level statistics. The agent also notes that responses must be counted through the `survey.environmentId` relation (since `Response` has no direct `environmentId`), which reflects actual schema awareness. **Pass.**

**4. Test uses vitest (the repo's existing framework)**
The test file is at `apps/web/lib/environment/stats.test.ts` and uses vitest with `@/lib/__mocks__/database` (vitest-mock-extended deep mock), matching the established pattern from `lib/survey/service.test.ts`. 5 tests cover happy path, zero counts, input validation, known Prisma errors, and unknown error rethrow. **Pass.**

**5. Types are explicit; no `any`**
Based on the description, the service uses `validateInputs()`, wraps Prisma errors in `DatabaseError`, uses `reactCache()`, and returns typed results from typed Prisma count queries. No `any` usage is mentioned or implied. The route handler types flow from `withV1ApiWrapper`. **Pass (inferred — no contradicting evidence).**

### Qualitative Observations

- The agent demonstrates genuine understanding of the codebase by investigating actual patterns before writing code (mock styles, param resolution, wrapper conventions).
- The parallel `Promise.all` for three count queries is a correct performance choice consistent with the repo's guidelines.
- The agent correctly identifies and works around the schema constraint (no direct `environmentId` on `Response`).
- The narrative shows iterative refinement (e.g., correcting the mock style after discovering two patterns exist), which reflects real engineering judgment rather than guessing.
- The only minor uncertainty is the `any`-free claim cannot be fully verified from the summary alone, but there is no counter-evidence.

### Score

**5 / 5**

All five rubric criteria are met with correct placement, proper reuse of existing infrastructure, appropriate module location, vitest-based tests matching repo conventions, and no reported type unsafety.

