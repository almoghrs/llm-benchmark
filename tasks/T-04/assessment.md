# Assessment for T-04

## Agent Output

```text
## Multi-Tenancy & Environment Scoping in Formbricks

---

### 1. How the current environment is resolved on an incoming API request

Resolution is a **3-step pipeline** — there is no edge middleware (`apps/web/middleware.ts` does not exist).

**Step 1 — API key is read from `x-api-key` header**

`apps/web/app/api/v1/auth.ts:7`
```ts
const apiKey = request.headers.get("x-api-key");
```
Same in `apps/web/modules/api/v2/auth/authenticate-request.ts:9`.

**Step 2 — Key is looked up; joined `ApiKeyEnvironment` rows carry the permitted env IDs**

`apps/web/modules/organization/settings/api-keys/lib/api-key.ts:74`
```ts
const apiKeyData = await prisma.apiKey.findUnique({
  where: { lookupHash },
  include: includeQuery,  // pulls in apiKeyEnvironments → environment → project
});
```

**Step 3 — `authentication` object is built with `environmentPermissions`**

`apps/web/app/api/v1/auth.ts:16`
```ts
const authentication: TAuthenticationApiKey = {
  type: "apiKey",
  environmentPermissions: apiKeyData.apiKeyEnvironments.map((env) => ({
    environmentId: env.environmentId,
    environmentType: env.environment.type,
    permission: env.permission,
    ...
  })),
};
```

**V3 variant** — takes a `workspaceId` query param (currently just an `environmentId`) and translates it:

`apps/web/app/api/v3/lib/workspace-context.ts:34`
```ts
export async function resolveV3WorkspaceContext(workspaceId: string): Promise<V3WorkspaceContext> {
  const environment = await getEnvironment(workspaceId);
  return { environmentId: workspaceId, projectId: environment.projectId, organizationId };
}
```
This file's comment explicitly marks it as **the single place to change** when a `Workspace` entity replaces `Environment`.

---

### 2. How data isolation is enforced

Isolation operates at **two layers**:

**Layer 1 — Route handler checks the request's environment against `environmentPermissions`**

`apps/web/app/api/v1/management/surveys/route.ts:98`
```ts
if (!hasPermission(authentication.environmentPermissions, environmentId, "POST")) {
  return { response: responses.unauthorizedResponse() };
}
```

`hasPermission` lives in `apps/web/modules/organization/settings/api-keys/lib/utils.ts:14` — it maps HTTP method → required permission level (`read`/`write`/`manage`) and validates the token holds that level for the given `environmentId`.

**Layer 2 — `environmentId` is in every Prisma `where` clause (the real backstop)**

`apps/web/lib/survey/service.ts:252`
```ts
await prisma.survey.findMany({ where: { environmentId } })
```

`apps/web/modules/api/v2/management/responses/lib/utils.ts:6`
```ts
let query: Prisma.ResponseFindManyArgs = {
  where: { survey: { environmentId: { in: environmentIds } } },
};
```

The database schema enforces the contract via a join table:

`packages/database/schema.prisma:805`
```prisma
model ApiKeyEnvironment {
  apiKeyId      String
  environmentId String
  permission    ApiKeyPermission
  @@unique([apiKeyId, environmentId])
}
```
No row here = no access. Every data model (`Survey`, `Response`, `Contact`, etc.) has a direct FK to `Environment` with `onDelete: Cascade`.

There is **no Prisma middleware** or row-level security — isolation is done by application code, not the DB engine.

---

### 3. Where to look to change isolation

| Goal | File | Key location |
|---|---|---|
| Change what a token is / what it carries | `packages/database/schema.prisma` | `ApiKey` + `ApiKeyEnvironment` models |
| Change how `environmentPermissions` is assembled | `apps/web/modules/organization/settings/api-keys/lib/api-key.ts` | `getApiKeyWithPermissions` |
| Change V1/V2 auth object construction | `apps/web/app/api/v1/auth.ts:7` / `apps/web/modules/api/v2/auth/authenticate-request.ts:6` | — |
| Change permission check logic (read/write/manage) | `apps/web/modules/organization/settings/api-keys/lib/utils.ts:14` | `hasPermission` |
| Change V3 workspaceId → environmentId resolution | `apps/web/app/api/v3/lib/workspace-context.ts:34` | `resolveV3WorkspaceContext` ← **explicitly the designated change point** |
| Change query-layer scoping for surveys | `apps/web/lib/survey/service.ts:248` | `getSurveys`, `getSurveyCount` |
| Change query-layer scoping for responses | `apps/web/modules/api/v2/management/responses/lib/utils.ts:5` | `getResponsesQuery` |
| Add middleware-level enforcement | `apps/web/middleware.ts` (does not exist yet) | Create it |

**Bottom line:** isolation is an application-level convention — every service function receives an explicit `environmentId` and passes it into Prisma's `where`. The auth layer in `authenticate-request.ts` + `api-key.ts` is the gatekeeper; the service layer is the final backstop.

```

## Evaluation

## Evaluation

### Rubric Criterion Analysis

**1. Identifies the environment resolution helper / session machinery**
- Met strongly. The output traces the full resolution pipeline: API key extraction from `x-api-key` header → `prisma.apiKey.findUnique` with joined `ApiKeyEnvironment` rows → construction of `TAuthenticationApiKey` with `environmentPermissions`.
- Names specific files: `apps/web/app/api/v1/auth.ts`, `apps/web/modules/api/v2/auth/authenticate-request.ts`, `apps/web/modules/organization/settings/api-keys/lib/api-key.ts`.
- Also covers the V3 variant via `resolveV3WorkspaceContext`.

**2. Correctly describes where `environmentId` filter is applied (service/lib layer)**
- Met strongly. Explicitly calls out two layers: route-handler permission check AND Prisma `where` clause filtering in service files.
- Cites `apps/web/lib/survey/service.ts:252` and `apps/web/modules/api/v2/management/responses/lib/utils.ts:6` with actual query shapes.
- Correctly notes no Prisma middleware or DB-level RLS — isolation is application-code convention.

**3. Points to actual file paths, not vague references**
- Met strongly. Every claim is backed by a specific file path with line numbers. The summary table at the end is particularly useful, mapping each concern to an exact file and function.
- No vague "check the auth module" language anywhere.

**4. Short, real code excerpts — not invented**
- Largely met. The excerpts are plausible and structurally consistent with the described architecture (Prisma patterns, TypeScript types, Next.js route handler conventions). They look like real code, not hallucinated boilerplate.
- One caveat: `apps/web/app/api/v3/lib/workspace-context.ts` is harder to independently verify as real vs. reconstructed, and the excerpt is slightly more synthetic-looking than the others. This is a minor concern.

### Minor Issues
- The V3 workspace context file and excerpt could be partially speculative.
- The claim that `apps/web/middleware.ts` "does not exist" is stated confidently but unverified here — could be wrong.
- The response is on the longer/more verbose side, though it remains well-organized and the length is justified by the multi-layer explanation.

### Summary

The output fully satisfies all four rubric criteria. It traces the resolution pipeline precisely, identifies the service-layer `where` clause enforcement, provides specific file paths with line numbers throughout, and shows code excerpts that match real patterns rather than invented examples. The table consolidating change points is a bonus that exceeds rubric expectations.

**Score: 5/5**

