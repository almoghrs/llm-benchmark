# Assessment for T-04

## Agent Output

```text
I will start by searching for `environmentId` in `apps/web` to understand how it is handled in API requests and explore the Prisma schema to see how data is structured for multi-tenancy.
I will search for the `middleware.ts` file in `apps/web` and read `apps/web/lib/utils/action-client/action-client-middleware.ts` to understand how environment scoping is handled. Then, I'll examine the Prisma schema to see the data model for multi-tenancy.
I'll continue reading the Prisma schema to understand the `Environment`, `Project`, and `Organization`/`Team` models. I'll also explore `app/api/v3/lib/auth.ts` and search for other API route definitions in `app/api` to see how environment resolution is handled.
I'll examine `apps/web/app/api/v3/lib/workspace-context.ts` to understand how `workspaceId` is resolved. I'm also interested in how data isolation is maintained, so I'll investigate if there's global middleware or if service/action layers filter by `environmentId`. While `checkAuthorizationUpdated` handles permissions, it doesn't appear to inject filters into Prisma queries, so I'll look for where that happens.
In the V3 API, `workspaceId` currently maps to `environmentId`. I'll now investigate how data isolation is enforced by examining the `getSurvey` or `getSurveys` services to see if they filter by `environmentId`.
I'll search for the export of `getSurvey`.
I'll examine `apps/web/lib/survey/service.ts` and also look for the implementation of `getSurveys`, since it typically requires an `environmentId`.
`getSurveys` and other plural getters appear to use `environmentId` for filtering in Prisma. I'll check `apps/web/lib/survey/service.ts` to confirm this for `getSurveys`.
Service functions like `getSurveys` filter by `environmentId`, but `getSurvey(surveyId)` doesn't, relying instead on `cuid` uniqueness. This might not strictly enforce environment access. I'll check how `requireV3WorkspaceAccess` is used in API routes, as server actions and API routes typically handle authorization.
I misread the directory structure; `apps/web/app/api/v3` contains a `surveys` directory. I'll check `apps/web/app/api/v3/surveys/route.ts` or a similar file.
Reading `apps/web/app/api/v3/surveys/route.ts`.
Environment resolution happens via `requireV3WorkspaceAccess`, and data isolation is maintained by passing the `environmentId` to service functions. `workspaceId` is extracted from query parameters. I'll now check `apps/web/app/api/v3/surveys/[surveyId]/route.ts` to see if it also verifies the environment.
Reading `apps/web/app/api/v3/surveys/[surveyId]/route.ts`.
In the `DELETE` route, the survey is retrieved by ID, and then `requireV3WorkspaceAccess` uses its `environmentId` to verify permissions. To modify isolation, I should examine `workspace-context.ts`, `action-client-middleware.ts`, service functions, and the Prisma schema. I'll also check for Prisma extensions used for multi-tenancy by searching for `prisma.$extends`.
Prisma extensions aren't used for row-level security; it's manual. I'll check `packages/database/src/index.ts` to see how the Prisma client is initialized.
Checking `packages/database/src/client.ts`.
Prisma extensions aren't used; isolation is manual in the service layer. In the V3 API, `requireV3WorkspaceAccess` and `resolveV3WorkspaceContext` handle environment resolution, mapping `workspaceId` to internal IDs. For the web app, `environmentId` is typically in the URL, and `checkAuthorizationUpdated` manages access. Data isolation is enforced within each service by including `environmentId` in Prisma queries or by verifying it after fetching by ID. To modify isolation, I'd look at `workspace-context.ts`, `action-client-middleware.ts`, `schema.prisma`, or individual service files. I'll now check `apps/web/app/api/v1` to see if it uses a different approach.
Checking for `apps/web/app/api/v1/management/surveys/route.ts`.
Reading `apps/web/app/api/v1/management/surveys/route.ts`.
V1 uses `authentication.environmentPermissions` from the API key to filter surveys, allowing access to multiple environments. I'll now locate the definition of `withV1ApiWrapper`, which likely manages the initial authentication.
Incoming API requests are resolved differently across versions: V3 uses `resolveV3WorkspaceContext` to map `workspaceId` to internal IDs, V1/V2 uses `handleAuthentication` within `withV1ApiWrapper`, and the Web App typically relies on `environmentId` from URL paths, verified by `checkAuthorizationUpdated`. Data isolation is manually enforced in the service layer by including `environmentId` in Prisma queries, or by verifying it at the handler level after fetching by ID; no global filtering exists. To modify isolation, one should consult `workspace-context.ts`, `with-api-logging.ts`, `action-client-middleware.ts`, `auth.ts`, `schema.prisma`, or individual service files. I'll now briefly check `apps/web/app/api/v3/lib/api-wrapper.ts` for any additional common logic.
Formbricks implements multi-tenancy and environment scoping through a combination of hierarchical data modeling, manual service-level filtering, and centralized authorization helpers.

### 1. Current Environment Resolution
The resolution process depends on the entry point (API vs. Web App):

*   **V3 API:** Resolves a `workspaceId` (which currently maps 1:1 to an `environmentId`) using `resolveV3WorkspaceContext`. This helper derives the `projectId` and `organizationId` required for full authorization.
    *   **File:** [`apps/web/app/api/v3/lib/workspace-context.ts`](apps/web/app/api/v3/lib/workspace-context.ts)
    *   **Code Snippet:**
        ```typescript
        export async function resolveV3WorkspaceContext(workspaceId: string): Promise<V3WorkspaceContext> {
          const environment = await getEnvironment(workspaceId);
          // ... checks and organization lookup
          return { environmentId: workspaceId, projectId: environment.projectId, organizationId };
        }
        ```
*   **Web App & Server Actions:** The `environmentId` is typically part of the URL path (e.g., `/environments/[environmentId]/...`). Authorization is performed using the `checkAuthorizationUpdated` middleware.
    *   **File:** [`apps/web/lib/utils/action-client/action-client-middleware.ts`](apps/web/lib/utils/action-client/action-client-middleware.ts)

### 2. Data Isolation Enforcement
Data isolation is **not** enforced by global Prisma middleware or database-level row security. Instead, it is enforced at the **Service and Handler layers**:

*   **Service Layer (Manual Filtering):** Most service functions (plural getters) require an `environmentId` as a parameter and include it in the Prisma `where` clause.
    *   **File:** [`apps/web/lib/survey/service.ts`](apps/web/lib/survey/service.ts)
    *   **Code Snippet:**
        ```typescript
        export const getSurveys = reactCache(async (environmentId: string, ...): Promise<TSurvey[]> => {
          const surveysPrisma = await prisma.survey.findMany({
            where: { environmentId },
            // ...
          });
        });
        ```
*   **Handler Layer (Verification):** For single-resource access (e.g., `GET /surveys/[surveyId]`), the handler fetches the resource by ID and then verifies that its `environmentId` matches the environment the user is authorized to access.
    *   **File:** [`apps/web/app/api/v3/surveys/[surveyId]/route.ts`](apps/web/app/api/v3/surveys/[surveyId]/route.ts)

### 3. Where to Change Isolation
If you wanted to modify how isolation works (e.g., moving from environment-scoping to workspace-scoping), you would look at:

1.  **Resolution Logic:** [`apps/web/app/api/v3/lib/workspace-context.ts`](apps/web/app/api/v3/lib/workspace-context.ts) — Change how external IDs map to internal resources.
2.  **Authorization Helpers:** [`apps/web/app/api/v3/lib/auth.ts`](apps/web/app/api/v3/lib/auth.ts) and [`apps/web/lib/utils/action-client/action-client-middleware.ts`](apps/web/lib/utils/action-client/action-client-middleware.ts).
3.  **Data Schema:** [`packages/database/schema.prisma`](packages/database/schema.prisma) — Update foreign key relationships (e.g., `Webhook`, `Survey`, `Contact` all currently relate to `Environment`).
4.  **Core Services:** Files under `apps/web/lib/` (e.g., `survey/service.ts`, `response/service.ts`) to update Prisma query filters.

```

## Evaluation

The agent's output is an excellent response that thoroughly addresses all components of the rubric with high precision.

### Rubric Assessment:

1.  **Identifies the environment resolution helper / session machinery:**
    *   **Result:** **Pass.** The agent correctly identifies `resolveV3WorkspaceContext` as the primary helper for the V3 API and `checkAuthorizationUpdated` for the Web App/Server Actions. It explains how these functions map external IDs to internal context.

2.  **Correctly describes where the `environmentId` filter is applied:**
    *   **Result:** **Pass.** The agent accurately distinguishes between "Plural Getters" (Service Layer) where `environmentId` is passed into Prisma `where` clauses, and "Single Resource Access" (Handler Layer) where the resource is fetched by ID and then verified against the authorized `environmentId`.

3.  **Points to actual file paths:**
    *   **Result:** **Pass.** The agent provides specific and correct paths such as:
        *   `apps/web/app/api/v3/lib/workspace-context.ts`
        *   `apps/web/lib/utils/action-client/action-client-middleware.ts`
        *   `apps/web/lib/survey/service.ts`
        *   `apps/web/app/api/v3/surveys/[surveyId]/route.ts`

4.  **Short, real code excerpts — not invented:**
    *   **Result:** **Pass.** The agent includes concise, accurate code snippets for `resolveV3WorkspaceContext` and `getSurveys` that reflect the actual implementation patterns in the Formbricks codebase.

### Additional Observations:
The agent went above and beyond by identifying the differences between API versions (V1 vs V3) and explaining the manual nature of the isolation (no global Prisma middleware/extensions). It also correctly noted that in the V3 API, `workspaceId` currently maps 1:1 to `environmentId`, which is a key architectural nuance of the project.

**Final Quality Score: 5/5**

