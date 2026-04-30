# Assessment for T-10

## Agent Output

```text
Now let me look at the key files in detail:
Now I have a thorough understanding of the codebase. Let me look at the Prisma schema to understand its format, then look at how the `[surveyId]/route.ts` works:
Now I have a clear picture. Let me also check the v3 API wrapper for PATCH patterns:
Now let me make all the changes. I'll start with the Prisma schema:
Now create the Prisma migration:
The migration file already exists (perhaps pre-created). Now let me update the relevant type definitions and service layer.
Now update the `TSurvey` type in the list module:
Now update `TSurveyListItem` in survey-overview.ts:
Now add the `toggleSurveyPin` function to the survey list service:
Now add the server action for toggling pin in `actions.ts`:
Now add the `toggleSurveyPinAction` at the bottom of actions.ts:
Now update the sorting logic in `survey-page.ts` to pin `isPinned` surveys to top. The `relevance` sort already has a two-bucket approach (inProgress vs other); I'll add `isPinned` as a priority bucket at the front of all sort modes:
Now update `findRelevanceRows` to handle the `pinned` bucket and add pinned-first logic for standard sorts. Let me read the relevant section:
Now I need to update the sorting to put pinned surveys at the top across all sort modes. The cleanest approach is:

1. For **standard sorts** (name/createdAt/updatedAt): add `isPinned` as first order-by field (desc) so pinned come first within the same sort order.
2. For **relevance sort**: add a `pinned` bucket at the top of the three-bucket chain.

Let me update `getSurveyOrderBy` to always lead with `isPinned desc`:
Now update `findRelevanceRows` to handle the new `pinned` bucket, and add helper functions for the pinned bucket in the relevance sort:
Now update `shouldReadInProgressBucket` and add `shouldReadPinnedBucket`, and update `getRelevanceSurveyListPage` to add the pinned bucket step:
Now update the `buildInProgressOnlyRelevancePage` and the main `getRelevanceSurveyListPage` to add the pinned bucket step:
Now update `getRelevanceSurveyListPage` to include the pinned step first:
Now let me add the optimistic-update hook and wire up the pin icon in the UI. First, add the `usePinSurvey` hook:
Now update `survey-list.tsx` to use the new hook and pass it down:
Now pass `handlePinSurvey` and `isReadOnly` down to `SurveyCard`:
Now update `SurveyCard` to accept and render the pin toggle:
Now I need to add the `common.pin` and `common.unpin` i18n keys. Let me check the locale file:
Now let's verify the TypeScript compiles by running a type check on the affected files:
The full project-wide type check OOMs. Let me run the unit tests for the affected files instead to verify correctness:
Good — 4 test failures in `survey-page.test.ts`. These are snapshot-style tests that now need updating for the new `isPinned` field and bucket logic. Let me look at those tests:
Now I understand the failing tests. I need to update them to reflect the new `isPinned` field in survey rows and the new bucket logic in relevance sorting:

1. **Tests 1 & 2** (updatedAt/name sorts): orderBy now starts with `{ isPinned: "desc" }` — but the tests use `expect.any(Object)` for `select` and match specific `orderBy`. I need to update `orderBy` expectations.
2. **Tests 3 & 4** (relevance): the queries now add `isPinned: false` to the `status`-based where clause, and there's an extra `findMany` call for the pinned bucket at the start.

Let me update the test file:
Now update the relevance tests. The new flow adds a **pinned bucket call** (call 1), then inProgress (call 2), then other (call 3):
Now update "continues relevance pagination from the other bucket cursor" — when cursor is `other`, only the other-bucket call should be made (pinned and inProgress buckets are already exhausted):
Now run the tests again:
All 4296 tests pass. Let me also check the "returns an in-progress next cursor" test still passes (it uses `limit: 1` with no cursor, so pinned bucket will be called first and return empty):

[0m
> build · claude-sonnet-4.6
[0m
[0m# [0mTodos
[ ] Explore codebase structure for surveys (Prisma schema, list UI, server actions)
[ ] Add isPinned boolean field to Survey Prisma schema + migration
[ ] Add toggleSurveyPin server action with auth/env scoping
[ ] Update survey list sorting to pin isPinned surveys to top
[ ] Add pin icon toggle to survey list row with optimistic update
[0m
[0m• [0mExplore survey codebase[90m Explore Agent[0m
[0m✓ [0mExplore survey codebase[90m Explore Agent[0m
[0m→ [0mRead apps/web/modules/survey/list/components/survey-card.tsx
[0m→ [0mRead apps/web/modules/survey/list/lib/survey.ts
[0m→ [0mRead apps/web/modules/survey/list/actions.ts
[0m→ [0mRead apps/web/modules/survey/list/lib/survey-record.ts
[0m→ [0mRead apps/web/modules/survey/list/types/survey-overview.ts
[0m→ [0mRead apps/web/modules/survey/list/components/survey-list.tsx
[0m→ [0mRead apps/web/modules/survey/list/types/surveys.ts
[0m→ [0mRead apps/web/modules/survey/list/hooks/use-surveys.ts
[0m✱ [0mGlob "/Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/hooks/*.ts"[90m 0 matches[0m
[0m
[0m$ [0mls /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/hooks/
use-delete-survey.test.ts
use-delete-survey.ts
use-surveys.test.ts
use-surveys.ts
[0m
[0m→ [0mRead apps/web/modules/survey/list/lib
[0m→ [0mRead apps/web/modules/survey/list/lib/v3-surveys-client.ts
[0m→ [0mRead apps/web/modules/survey/list/hooks/use-delete-survey.ts
[0m→ [0mRead apps/web/modules/survey/list/lib/query.ts
[0m
[0m$ [0mfind /Users/almog/Projects/llm-benchmark/formbricks/apps/web/app/api/v3/surveys -type f | head -20
/Users/almog/Projects/llm-benchmark/formbricks/apps/web/app/api/v3/surveys/parse-v3-surveys-list-query.test.ts
/Users/almog/Projects/llm-benchmark/formbricks/apps/web/app/api/v3/surveys/[surveyId]/route.test.ts
/Users/almog/Projects/llm-benchmark/formbricks/apps/web/app/api/v3/surveys/[surveyId]/route.ts
/Users/almog/Projects/llm-benchmark/formbricks/apps/web/app/api/v3/surveys/route.test.ts
/Users/almog/Projects/llm-benchmark/formbricks/apps/web/app/api/v3/surveys/parse-v3-surveys-list-query.ts
/Users/almog/Projects/llm-benchmark/formbricks/apps/web/app/api/v3/surveys/serializers.ts
/Users/almog/Projects/llm-benchmark/formbricks/apps/web/app/api/v3/surveys/route.ts
[0m
[0m→ [0mRead apps/web/app/api/v3/surveys/route.ts
[0m→ [0mRead apps/web/app/api/v3/surveys/serializers.ts
[0m→ [0mRead apps/web/app/api/v3/surveys/parse-v3-surveys-list-query.ts
[0m→ [0mRead apps/web/modules/survey/list/lib/survey-page.ts
[0m→ [0mRead packages/database/schema.prisma[90m [offset=340, limit=80][0m
[0m→ [0mRead apps/web/app/api/v3/surveys/[surveyId]/route.ts
[0m
[0m$ [0mls /Users/almog/Projects/llm-benchmark/formbricks/apps/web/app/api/v3/lib/
api-wrapper.test.ts
api-wrapper.ts
auth.test.ts
auth.ts
response.test.ts
response.ts
types.ts
workspace-context.test.ts
workspace-context.ts
[0m
[0m→ [0mRead apps/web/app/api/v3/lib/response.ts[90m [limit=50][0m
[0m
[0m# [0mTodos
[x] Explore codebase structure for surveys (Prisma schema, list UI, server actions)
[ ] Add isPinned boolean field to Survey Prisma schema + migration
[ ] Add toggleSurveyPin server action with auth/env scoping
[ ] Update survey list sorting to pin isPinned surveys to top
[ ] Add pin icon toggle to survey list row with optimistic update
[0m
[0m← [0mEdit packages/database/schema.prisma
Index: /Users/almog/Projects/llm-benchmark/formbricks/packages/database/schema.prisma
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/packages/database/schema.prisma
+++ /Users/almog/Projects/llm-benchmark/formbricks/packages/database/schema.prisma
@@ -396,8 +396,9 @@
 isSingleResponsePerEmailEnabled Boolean          @default(false)
 isBackButtonHidden              Boolean          @default(false)
 isAutoProgressingEnabled        Boolean          @default(false)
 isCaptureIpEnabled              Boolean          @default(false)
+isPinned                        Boolean          @default(false)
 pin                             String?
 displayPercentage               Decimal?
 languages                       SurveyLanguage[]
 showLanguageSwitch              Boolean?

[0m
[0m$ [0mcd /Users/almog/Projects/llm-benchmark/formbricks && find packages/database/migrations -name "*.sql" | sort | tail -3
packages/database/migrations/20260330120000_add_password_reset_tokens/migration.sql
packages/database/migrations/20260409120000_add_is_auto_progressing_enabled_to_survey/migration.sql
packages/database/migrations/20260429000000_add_is_pinned_to_survey/migration.sql
[0m
[0m$ [0mcat /Users/almog/Projects/llm-benchmark/formbricks/packages/database/migrations/20260409120000_add_is_auto_progressing_enabled_to_survey/migration.sql
ALTER TABLE "Survey"
ADD COLUMN "isAutoProgressingEnabled" BOOLEAN NOT NULL DEFAULT false;
[0m
[0m$ [0mcat /Users/almog/Projects/llm-benchmark/formbricks/packages/database/migrations/20260429000000_add_is_pinned_to_survey/migration.sql
-- AlterTable
ALTER TABLE "Survey" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;
[0m
[0m← [0mEdit apps/web/modules/survey/list/lib/survey-record.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-record.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-record.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-record.ts
@@ -15,8 +15,9 @@
   },
   status: true,
   singleUse: true,
   environmentId: true,
+  isPinned: true,
 } satisfies Prisma.SurveySelect;
 
 export type TSurveyRow = Prisma.SurveyGetPayload<{ select: typeof surveySelect }>;
 

[0m
[0m← [0mEdit apps/web/modules/survey/list/types/surveys.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/types/surveys.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/types/surveys.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/types/surveys.ts
@@ -10,8 +10,9 @@
 status: ZSurveyStatus,
 createdAt: z.date(),
 updatedAt: z.date(),
 responseCount: z.number(),
+isPinned: z.boolean(),
 creator: z
   .object({
     name: z.string(),
   })

[0m
[0m← [0mEdit apps/web/modules/survey/list/types/survey-overview.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/types/survey-overview.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/types/survey-overview.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/types/survey-overview.ts
@@ -18,8 +18,9 @@
 status: ZSurveyStatus,
 createdAt: z.date(),
 updatedAt: z.date(),
 responseCount: z.number(),
+isPinned: z.boolean(),
 creator: z
   .object({
     name: z.string(),
   })

[0m
[0m← [0mEdit apps/web/modules/survey/list/lib/survey.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey.ts
@@ -537,8 +537,38 @@
     throw error;
   }
 };
 
+export const toggleSurveyPin = async (surveyId: string): Promise<{ id: string; isPinned: boolean }> => {
+  try {
+    const survey = await prisma.survey.findUnique({
+      where: { id: surveyId },
+      select: { id: true, isPinned: true },
+    });
+
+    if (!survey) {
+      throw new ResourceNotFoundError("Survey", surveyId);
+    }
+
+    const updated = await prisma.survey.update({
+      where: { id: surveyId },
+      data: { isPinned: !survey.isPinned },
+      select: { id: true, isPinned: true },
+    });
+
+    return updated;
+  } catch (error) {
+    if (error instanceof ResourceNotFoundError) {
+      throw error;
+    }
+    if (error instanceof Prisma.PrismaClientKnownRequestError) {
+      logger.error(error, "Error toggling survey pin");
+      throw new DatabaseError(error.message);
+    }
+    throw error;
+  }
+};
+
 /** Count surveys in an environment, optionally with the same filter as getSurveys (so total matches list). */
 export const getSurveyCount = reactCache(
   async (environmentId: string, filterCriteria?: TSurveyFilterCriteria): Promise<number> => {
     validateInputs([environmentId, z.cuid2()]);

[0m
[0m← [0mEdit apps/web/modules/survey/list/actions.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/actions.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/actions.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/actions.ts
@@ -12,9 +12,9 @@
 } from "@/lib/utils/helper";
 import { generateSurveySingleUseIds } from "@/lib/utils/single-use-surveys";
 import { withAuditLogging } from "@/modules/ee/audit-logs/lib/handler";
 import { getProjectIdIfEnvironmentExists } from "@/modules/survey/list/lib/environment";
-import { copySurveyToOtherEnvironment } from "@/modules/survey/list/lib/survey";
+import { copySurveyToOtherEnvironment, toggleSurveyPin } from "@/modules/survey/list/lib/survey";
 
 const ZCopySurveyToOtherEnvironmentAction = z.object({
   surveyId: z.cuid2(),
   targetEnvironmentId: z.cuid2(),

[0m
[0m→ [0mRead apps/web/modules/survey/list/actions.ts[90m [offset=95][0m
[0m
[0m← [0mEdit apps/web/modules/survey/list/actions.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/actions.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/actions.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/actions.ts
@@ -119,4 +119,34 @@
     });
 
     return generateSurveySingleUseIds(parsedInput.count, parsedInput.isEncrypted);
   });
+
+const ZToggleSurveyPinAction = z.object({
+  surveyId: z.cuid2(),
+});
+
+export const toggleSurveyPinAction = authenticatedActionClient
+  .inputSchema(ZToggleSurveyPinAction)
+  .action(async ({ ctx, parsedInput }) => {
+    const environmentId = await getEnvironmentIdFromSurveyId(parsedInput.surveyId);
+    const organizationId = await getOrganizationIdFromEnvironmentId(environmentId);
+    const projectId = await getProjectIdFromSurveyId(parsedInput.surveyId);
+
+    await checkAuthorizationUpdated({
+      userId: ctx.user.id,
+      organizationId,
+      access: [
+        {
+          type: "organization",
+          roles: ["owner", "manager"],
+        },
+        {
+          type: "projectTeam",
+          projectId,
+          minPermission: "readWrite",
+        },
+      ],
+    });
+
+    return toggleSurveyPin(parsedInput.surveyId);
+  });

[0m
[0m# [0mTodos
[x] Explore codebase structure for surveys (Prisma schema, list UI, server actions)
[x] Add isPinned boolean field to Survey Prisma schema + migration
[x] Add toggleSurveyPin server action with auth/env scoping
[ ] Update survey list sorting to pin isPinned surveys to top
[ ] Add pin icon toggle to survey list row with optimistic update
[0m
[0m← [0mEdit apps/web/modules/survey/list/lib/survey-page.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
@@ -14,8 +14,9 @@
   surveySelect,
 } from "./survey-record";
 
 const SURVEY_LIST_CURSOR_VERSION = 1 as const;
+const PINNED_BUCKET = "pinned" as const;
 const IN_PROGRESS_BUCKET = "inProgress" as const;
 const OTHER_BUCKET = "other" as const;
 
 const ZDateCursor = z.object({

[0m
[0m← [0mEdit apps/web/modules/survey/list/lib/survey-page.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
@@ -35,9 +35,9 @@
 
 const ZRelevanceCursor = z.object({
   version: z.literal(SURVEY_LIST_CURSOR_VERSION),
   sortBy: z.literal("relevance"),
-  bucket: z.enum([IN_PROGRESS_BUCKET, OTHER_BUCKET]),
+  bucket: z.enum([PINNED_BUCKET, IN_PROGRESS_BUCKET, OTHER_BUCKET]),
   updatedAt: z.iso.datetime(),
   id: z.string().min(1),
 });
 

[0m
[0m← [0mEdit apps/web/modules/survey/list/lib/survey-page.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
@@ -47,9 +47,9 @@
 export type TSurveyListPageCursor = z.infer<typeof ZSurveyListPageCursor>;
 type TStandardSurveyListSort = Exclude<TSurveyListSort, "relevance">;
 type TStandardSurveyListCursor = Extract<TSurveyListPageCursor, { sortBy: TStandardSurveyListSort }>;
 type TRelevanceSurveyListCursor = Extract<TSurveyListPageCursor, { sortBy: "relevance" }>;
-type TRelevanceBucket = typeof IN_PROGRESS_BUCKET | typeof OTHER_BUCKET;
+type TRelevanceBucket = typeof PINNED_BUCKET | typeof IN_PROGRESS_BUCKET | typeof OTHER_BUCKET;
 
 export type TSurveyListPage = {
   surveys: TSurvey[];
   nextCursor: string | null;

[0m
[0m→ [0mRead apps/web/modules/survey/list/lib/survey-page.ts[90m [offset=200, limit=120][0m
[0m→ [0mRead apps/web/modules/survey/list/lib/survey-page.ts[90m [offset=320][0m
[0m
[0m← [0mEdit apps/web/modules/survey/list/lib/survey-page.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
@@ -96,14 +96,14 @@
 
 function getSurveyOrderBy(sortBy: TStandardSurveyListSort): Prisma.SurveyOrderByWithRelationInput[] {
   switch (sortBy) {
     case "name":
-      return [{ name: "asc" }, { id: "asc" }];
+      return [{ isPinned: "desc" }, { name: "asc" }, { id: "asc" }];
     case "createdAt":
-      return [{ createdAt: "desc" }, { id: "desc" }];
+      return [{ isPinned: "desc" }, { createdAt: "desc" }, { id: "desc" }];
     case "updatedAt":
     default:
-      return [{ updatedAt: "desc" }, { id: "desc" }];
+      return [{ isPinned: "desc" }, { updatedAt: "desc" }, { id: "desc" }];
   }
 }
 
 function buildDateCursorWhere(

[0m
[0m← [0mEdit apps/web/modules/survey/list/lib/survey-page.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
@@ -274,17 +274,23 @@
   filterCriteria: TSurveyFilterCriteria | undefined,
   bucket: TRelevanceBucket,
   cursor: TRelevanceSurveyListCursor | null
 ): Promise<TSurveyRow[]> {
-  const statusWhere: Prisma.SurveyWhereInput =
-    bucket === IN_PROGRESS_BUCKET ? { status: "inProgress" } : { status: { not: "inProgress" } };
+  let bucketWhere: Prisma.SurveyWhereInput;
+  if (bucket === PINNED_BUCKET) {
+    bucketWhere = { isPinned: true };
+  } else if (bucket === IN_PROGRESS_BUCKET) {
+    bucketWhere = { isPinned: false, status: "inProgress" };
+  } else {
+    bucketWhere = { isPinned: false, status: { not: "inProgress" } };
+  }
   const cursorWhere = cursor
     ? buildDateCursorWhere("updatedAt", cursor.updatedAt, cursor.id, "desc")
     : undefined;
 
   return prisma.survey.findMany({
     where: buildBaseWhere(environmentId, filterCriteria, {
-      ...statusWhere,
+      ...bucketWhere,
       ...cursorWhere,
     }),
     select: surveySelect,
     orderBy: getSurveyOrderBy("updatedAt"),
@@ -299,8 +305,16 @@
   const otherRows = await findRelevanceRows(environmentId, 1, filterCriteria, OTHER_BUCKET, null);
   return otherRows.length > 0;
 }
 
+async function hasMoreRelevanceRowsInInProgressBucket(
+  environmentId: string,
+  filterCriteria?: TSurveyFilterCriteria
+): Promise<boolean> {
+  const rows = await findRelevanceRows(environmentId, 1, filterCriteria, IN_PROGRESS_BUCKET, null);
+  return rows.length > 0;
+}
+
 function getRelevanceCursor(cursor: TSurveyListPageCursor | null): TRelevanceSurveyListCursor | null {
   if (cursor && cursor.sortBy !== "relevance") {
     throw new InvalidInputError("The cursor does not match the requested sort order.");
   }

[0m
[0m← [0mEdit apps/web/modules/survey/list/lib/survey-page.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
@@ -328,10 +328,14 @@
 ): TRelevanceSurveyListCursor | null {
   return cursor?.bucket === bucket ? cursor : null;
 }
 
+function shouldReadPinnedBucket(cursor: TRelevanceSurveyListCursor | null): boolean {
+  return !cursor || cursor.bucket === PINNED_BUCKET;
+}
+
 function shouldReadInProgressBucket(cursor: TRelevanceSurveyListCursor | null): boolean {
-  return !cursor || cursor.bucket === IN_PROGRESS_BUCKET;
+  return !cursor || cursor.bucket === IN_PROGRESS_BUCKET || cursor.bucket === PINNED_BUCKET;
 }
 
 async function buildRelevancePage(
   rows: TSurveyRow[],

[0m
[0m← [0mEdit apps/web/modules/survey/list/lib/survey-page.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
@@ -375,14 +375,36 @@
   cursor: TRelevanceSurveyListCursor | null
 ): Promise<TSurveyListPage> {
   const hasOtherRows =
     rows.length > 0 &&
-    shouldReadInProgressBucket(cursor) &&
+    shouldReadPinnedBucket(cursor) &&
     (await hasMoreRelevanceRowsInOtherBucket(environmentId, filterCriteria));
 
   return await buildRelevancePage(rows, hasOtherRows ? IN_PROGRESS_BUCKET : null);
 }
 
+async function getPinnedRelevanceStep(
+  environmentId: string,
+  limit: number,
+  filterCriteria: TSurveyFilterCriteria | undefined,
+  cursor: TRelevanceSurveyListCursor | null
+): Promise<{ pageRows: TSurveyRow[]; remaining: number; response: TSurveyListPage | null }> {
+  const pinnedRows = await findRelevanceRows(
+    environmentId,
+    limit,
+    filterCriteria,
+    PINNED_BUCKET,
+    getRelevanceBucketCursor(cursor, PINNED_BUCKET)
+  );
+  const { pageRows, hasMore } = getPageRows(pinnedRows, limit);
+
+  return {
+    pageRows,
+    remaining: limit - pageRows.length,
+    response: hasMore ? await buildRelevancePage(pageRows, PINNED_BUCKET) : null,
+  };
+}
+
 async function getRelevanceSurveyListPage(
   environmentId: string,
   options: TGetSurveyListPageOptions & { sortBy: "relevance" }
 ): Promise<TSurveyListPage> {

[0m
[0m← [0mEdit apps/web/modules/survey/list/lib/survey-page.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.ts
@@ -411,8 +411,32 @@
 const relevanceCursor = getRelevanceCursor(options.cursor);
 const pageRows: TSurveyRow[] = [];
 let remaining = options.limit;
 
+// Step 1: pinned surveys float to the very top
+if (shouldReadPinnedBucket(relevanceCursor)) {
+  const pinnedStep = await getPinnedRelevanceStep(
+    environmentId,
+    remaining,
+    options.filterCriteria,
+    relevanceCursor
+  );
+  pageRows.push(...pinnedStep.pageRows);
+
+  if (pinnedStep.response) {
+    return pinnedStep.response;
+  }
+
+  remaining = pinnedStep.remaining;
+}
+
+if (remaining <= 0) {
+  // Check if there are inProgress rows to signal a next cursor
+  const hasInProgress = await hasMoreRelevanceRowsInInProgressBucket(environmentId, options.filterCriteria);
+  return await buildRelevancePage(pageRows, hasInProgress ? IN_PROGRESS_BUCKET : null);
+}
+
+// Step 2: inProgress surveys
 if (shouldReadInProgressBucket(relevanceCursor)) {
   const inProgressStep = await getInProgressRelevanceStep(
     environmentId,
     remaining,
@@ -436,8 +460,9 @@
     relevanceCursor
   );
 }
 
+// Step 3: everything else
 const otherRows = await findRelevanceRows(
   environmentId,
   remaining,
   options.filterCriteria,

[0m
[0m# [0mTodos
[x] Explore codebase structure for surveys (Prisma schema, list UI, server actions)
[x] Add isPinned boolean field to Survey Prisma schema + migration
[x] Add toggleSurveyPin server action with auth/env scoping
[x] Update survey list sorting to pin isPinned surveys to top
[ ] Add pin icon toggle to survey list row with optimistic update
[0m
[0m← [0mWrite apps/web/modules/survey/list/hooks/use-pin-survey.ts
Wrote file successfully.
[0m
[0m← [0mEdit apps/web/modules/survey/list/components/survey-list.tsx
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/components/survey-list.tsx
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/components/survey-list.tsx
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/components/survey-list.tsx
@@ -9,8 +9,9 @@
 import { TUserLocale } from "@formbricks/types/user";
 import { FORMBRICKS_SURVEYS_FILTERS_KEY_LS } from "@/lib/localStorage";
 import { getV3ApiErrorMessage } from "@/modules/api/lib/v3-client";
 import { useDeleteSurvey } from "@/modules/survey/list/hooks/use-delete-survey";
+import { usePinSurvey } from "@/modules/survey/list/hooks/use-pin-survey";
 import { useSurveys } from "@/modules/survey/list/hooks/use-surveys";
 import { initialFilters } from "@/modules/survey/list/lib/constants";
 import {
   hasActiveSurveyFilters,

[0m
[0m← [0mEdit apps/web/modules/survey/list/components/survey-list.tsx
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/components/survey-list.tsx
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/components/survey-list.tsx
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/components/survey-list.tsx
@@ -105,8 +105,9 @@
   enabled: isFilterInitialized,
 });
 
 const deleteSurveyMutation = useDeleteSurvey({ queryKey });
+const pinSurveyMutation = usePinSurvey({ queryKey });
 
 const hasAppliedFilters = hasActiveSurveyFilters(normalizedFilters);
 const showInitialLoading = !isFilterInitialized || (isLoading && surveys.length === 0);
 const showTemplateEmptyState = !isError && totalCount === 0 && !hasAppliedFilters && !isReadOnly;

[0m
[0m← [0mEdit apps/web/modules/survey/list/components/survey-list.tsx
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/components/survey-list.tsx
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/components/survey-list.tsx
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/components/survey-list.tsx
@@ -116,8 +116,12 @@
 const handleDeleteSurvey = async (surveyId: string) => {
   await deleteSurveyMutation.mutateAsync({ surveyId });
 };
 
+const handlePinSurvey = async (surveyId: string) => {
+  await pinSurveyMutation.mutateAsync({ surveyId });
+};
+
 const createSurveyButton = (
   <Button size="sm" asChild>
     <Link href={`/environments/${environment.id}/surveys/templates`}>
       {t("environments.surveys.new_survey")}

[0m
[0m← [0mEdit apps/web/modules/survey/list/components/survey-list.tsx
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/components/survey-list.tsx
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/components/survey-list.tsx
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/components/survey-list.tsx
@@ -212,8 +212,9 @@
     survey={survey}
     environmentId={environment.id}
     isReadOnly={isReadOnly}
     deleteSurvey={handleDeleteSurvey}
+    pinSurvey={handlePinSurvey}
     publicDomain={publicDomain}
     locale={locale}
   />
 ))}

[0m
[0m← [0mEdit apps/web/modules/survey/list/components/survey-card.tsx
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/components/survey-card.tsx
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/components/survey-card.tsx
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/components/survey-card.tsx
@@ -1,7 +1,8 @@
 "use client";
 
 import Link from "next/link";
+import { PinIcon } from "lucide-react";
 import { useMemo } from "react";
 import { useTranslation } from "react-i18next";
 import { TUserLocale } from "@formbricks/types/user";
 import { cn } from "@/lib/cn";
@@ -17,16 +18,18 @@
   environmentId: string;
   publicDomain: string;
   isReadOnly: boolean;
   deleteSurvey: (surveyId: string) => Promise<void>;
+  pinSurvey: (surveyId: string) => Promise<void>;
   locale: TUserLocale;
 }
 export const SurveyCard = ({
   survey,
   environmentId,
   publicDomain,
   isReadOnly,
   deleteSurvey,
+  pinSurvey,
   locale,
 }: SurveyCardProps) => {
   const { t } = useTranslation();
   const surveyStatusLabel = (() => {
@@ -99,8 +102,26 @@
         <Link href={linkHref} key={survey.id} className="block">
           {CardBody}
         </Link>
       )}
+      {!isReadOnly && (
+        <button
+          type="button"
+          aria-label={survey.isPinned ? t("common.unpin") : t("common.pin")}
+          onClick={(e) => {
+            e.preventDefault();
+            e.stopPropagation();
+            pinSurvey(survey.id);
+          }}
+          className={cn(
+            "absolute left-3 top-3.5 rounded p-0.5 transition-colors",
+            survey.isPinned
+              ? "text-amber-500 hover:text-amber-600"
+              : "text-slate-300 hover:text-slate-500"
+          )}>
+          <PinIcon className="h-4 w-4" fill={survey.isPinned ? "currentColor" : "none"} />
+        </button>
+      )}
       <div className="absolute right-3 top-3.5">
         <SurveyDropDownMenu
           survey={survey}
           key={`surveys-${survey.id}`}

[0m
[0m$ [0mgrep -n '"pin"' /Users/almog/Projects/llm-benchmark/formbricks/apps/web/public/locales/en-US.json | head -5
grep: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/public/locales/en-US.json: No such file or directory
[0m
[0m$ [0mfind /Users/almog/Projects/llm-benchmark/formbricks/apps/web -name "en-US.json" 2>/dev/null | head -3
/Users/almog/Projects/llm-benchmark/formbricks/apps/web/locales/en-US.json
[0m
[0m$ [0mgrep -n '"pin\|unpin\|updated_at\|created_at"' /Users/almog/Projects/llm-benchmark/formbricks/apps/web/locales/en-US.json | head -10
196:    "created_at": "Created at",
467:    "updated_at": "Updated at",
797:      "include_created_at": "Include Created At",
1641:        "pin_can_only_contain_numbers": "PIN can only contain numbers.",
1642:        "pin_must_be_a_four_digit_number": "PIN must be a four digit number.",
[0m
[0m$ [0mgrep -n '"duplicate_copy"' /Users/almog/Projects/llm-benchmark/formbricks/apps/web/locales/en-US.json
221:    "duplicate_copy": "(copy)",
[0m
[0m→ [0mRead apps/web/locales/en-US.json[90m [offset=460, limit=20][0m
[0m
[0m← [0mEdit apps/web/locales/en-US.json
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/locales/en-US.json
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/locales/en-US.json
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/locales/en-US.json
@@ -457,11 +457,13 @@
 "top_right": "Top Right",
 "trial_days_remaining": "{count} days left in your trial",
 "trial_expired": "Your trial has expired",
 "trial_one_day_remaining": "1 day left in your trial",
-"try_again": "Try again",
-"type": "Type",
-"unknown_survey": "Unknown survey",
+ "try_again": "Try again",
+ "type": "Type",
+ "pin": "Pin to top",
+ "unpin": "Unpin",
+ "unknown_survey": "Unknown survey",
 "unlock_more_workspaces_with_a_higher_plan": "Unlock more workspaces with a higher plan.",
 "update": "Update",
 "updated": "Updated",
 "updated_at": "Updated at",

[0m
[0m$ [0mcd /Users/almog/Projects/llm-benchmark/formbricks && pnpm --filter=@formbricks/web exec tsc --noEmit --project apps/web/tsconfig.json 2>&1 | head -60
error TS5058: The specified path does not exist: 'apps/web/tsconfig.json'.
undefined
/Users/almog/Projects/llm-benchmark/formbricks/apps/web:
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1: tsc --noEmit --project apps/web/tsconfig.json
[0m
[0m$ [0mcd /Users/almog/Projects/llm-benchmark/formbricks/apps/web && npx tsc --noEmit 2>&1 | head -80
npm warn Unknown project config "auto-install-peers". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
npm warn Unknown project config "link-workspace-packages". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
npm warn Unknown project config "shamefully-hoist". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
npm warn Unknown project config "shared-workspace-shrinkwrap". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
npm warn Unknown project config "enable-pre-post-scripts". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
npm warn Unknown project config "node-linker". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.

<--- Last few GCs --->

[44858:0x120018000]    21487 ms: Mark-Compact 2045.4 (2053.1) -> 2044.1 (2053.9) MB, pooled: 0 MB, 640.50 / 0.00 ms  (average mu = 0.188, current mu = 0.028) allocation failure; scavenge might not succeed
[44858:0x120018000]    22221 ms: Mark-Compact (reduce) 2044.3 (2053.9) -> 2044.1 (2051.1) MB, pooled: 0 MB, 486.79 / 0.00 ms  (+ 1.8 ms in 3 steps since start of marking, biggest step 1.8 ms, walltime since start of marking 491 ms) (average mu = 0.263, cu
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
----- Native stack trace -----

 1: 0x1022cdaec node::OOMErrorHandler(char const*, v8::OOMDetails const&) [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
 2: 0x102520314 v8::internal::V8::FatalProcessOutOfMemory(v8::internal::Isolate*, char const*, v8::OOMDetails const&) [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
 3: 0x10277f700 v8::internal::Heap::stack() [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
 4: 0x102782ad4 v8::internal::Heap::HasLowYoungGenerationAllocationRate() [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
 5: 0x102793cc8 v8::internal::Heap::CollectGarbage(v8::internal::AllocationSpace, v8::internal::GarbageCollectionReason, v8::GCCallbackFlags)::$_1::operator()() const [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
 6: 0x10279359c void heap::base::Stack::SetMarkerAndCallbackImpl<v8::internal::Heap::CollectGarbage(v8::internal::AllocationSpace, v8::internal::GarbageCollectionReason, v8::GCCallbackFlags)::$_1>(heap::base::Stack*, void*, void const*) [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
 7: 0x103149bf4 PushAllRegistersAndIterateStack [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
 8: 0x10277d404 v8::internal::Heap::CollectGarbage(v8::internal::AllocationSpace, v8::internal::GarbageCollectionReason, v8::GCCallbackFlags) [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
 9: 0x1026f4dc8 v8::internal::StackGuard::HandleInterrupts(v8::internal::StackGuard::InterruptLevel) [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
10: 0x102be30ac v8::internal::Runtime_HandleNoHeapWritesInterrupts(int, unsigned long*, v8::internal::Isolate*) [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
11: 0x10323a234 Builtins_CEntry_Return1_ArgvOnStack_NoBuiltinExit [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
12: 0x13013b744 
13: 0x1303ff0f0 
14: 0x1304d7bc0 
15: 0x1302ae644 
16: 0x1303e06c8 
17: 0x1303d8030 
18: 0x1302b58d0 
19: 0x1302abed4 
20: 0x1300f1144 
21: 0x1303e11dc 
22: 0x1302a1aa4 
23: 0x1304cd690 
24: 0x1303972c4 
25: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
26: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
27: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
28: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
29: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
30: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
31: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
32: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
33: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
34: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
35: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
36: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
37: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
38: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
39: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
40: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
41: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
42: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
43: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
44: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
45: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
46: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
47: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
48: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
49: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
50: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
51: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
52: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
53: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
54: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
55: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
56: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
57: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
58: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
59: 0x10319cbec Builtins_InterpreterEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
60: 0x10319a8cc Builtins_JSEntryTrampoline [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
61: 0x10319a570 Builtins_JSEntry [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
62: 0x1026c38f0 v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams const&) [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
63: 0x1026c3254 v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal::DirectHandle<v8::internal::Object>, v8::base::Vector<v8::internal::DirectHandle<v8::internal::Object> const>) [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
64: 0x102537cd4 v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*) [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
65: 0x10229dce8 node::builtins::BuiltinLoader::CompileAndCall(v8::Local<v8::Context>, char const*, node::Realm*) [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
66: 0x10237d3f0 node::Realm::ExecuteBootstrapper(char const*) [/Users/almog/.nvm/versions/node/v24.15.0/bin/node]
[0m
[0m$ [0mcd /Users/almog/Projects/llm-benchmark/formbricks && NODE_OPTIONS="--max-old-space-size=4096" pnpm test --filter=@formbricks/web -- --reporter=verbose --testPathPattern="survey-page|survey-record|survey\.test|use-delete-survey|v3-surveys-client" 2>&1 | tail -40
@formbricks/surveys:build: dist/index.js                       870.77 kB │ gzip: 198.28 kB
@formbricks/surveys:build: ✓ built in 3.04s
@formbricks/surveys:build: vite v7.3.2 building client environment for production...
@formbricks/surveys:build: transforming...
@formbricks/surveys:build: ✓ 3004 modules transformed.
@formbricks/surveys:build: rendering chunks...
@formbricks/surveys:build: computing gzip size...
@formbricks/surveys:build: Ensured directory exists: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/public/js
@formbricks/surveys:build: Copied 7 files to /Users/almog/Projects/llm-benchmark/formbricks/apps/web/public/js (surveys)
@formbricks/surveys:build: dist/index.umd.cjs  797.67 kB │ gzip: 223.85 kB
@formbricks/surveys:build: ✓ built in 2.12s
@formbricks/web:test: cache miss, executing 7e0fedbd8bef023e
@formbricks/web:test: 
@formbricks/web:test: > @formbricks/web@0.0.0 test /Users/almog/Projects/llm-benchmark/formbricks/apps/web
@formbricks/web:test: > dotenv -e ../../.env -- vitest run --reporter=verbose '--testPathPattern=survey-page|survey-record|survey\.test|use-delete-survey|v3-surveys-client'
@formbricks/web:test: 
@formbricks/web:test: file:///Users/almog/Projects/llm-benchmark/formbricks/node_modules/vitest/dist/chunks/cac.DJJmV0dT.js:406
@formbricks/web:test:           throw new CACError(`Unknown option \`${name.length > 1 ? `--${name}` : `-${name}`}\``);
@formbricks/web:test:                 ^
@formbricks/web:test: 
@formbricks/web:test: CACError: Unknown option `--testPathPattern`
@formbricks/web:test:     at Command.checkUnknownOptions (file:///Users/almog/Projects/llm-benchmark/formbricks/node_modules/vitest/dist/chunks/cac.DJJmV0dT.js:406:17)
@formbricks/web:test:     at CAC.runMatchedCommand (file:///Users/almog/Projects/llm-benchmark/formbricks/node_modules/vitest/dist/chunks/cac.DJJmV0dT.js:606:13)
@formbricks/web:test:     at CAC.parse (file:///Users/almog/Projects/llm-benchmark/formbricks/node_modules/vitest/dist/chunks/cac.DJJmV0dT.js:547:12)
@formbricks/web:test:     at file:///Users/almog/Projects/llm-benchmark/formbricks/node_modules/vitest/dist/cli.js:11:13
@formbricks/web:test:     at ModuleJob.run (node:internal/modules/esm/module_job:437:25)
@formbricks/web:test:     at async node:internal/modules/esm/loader:639:26
@formbricks/web:test:     at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)
@formbricks/web:test: 
@formbricks/web:test: Node.js v24.15.0
@formbricks/web:test:  ELIFECYCLE  Test failed. See above for more details.
 ERROR  @formbricks/web#test: command (/Users/almog/Projects/llm-benchmark/formbricks/apps/web) /Users/almog/.nvm/versions/node/v24.15.0/bin/pnpm run test --reporter=verbose --testPathPattern=survey-page|survey-record|survey\.test|use-delete-survey|v3-surveys-client exited (1)

 Tasks:    8 successful, 9 total
Cached:    0 cached, 9 total
  Time:    15.131s 
Failed:    @formbricks/web#test

 ERROR  run failed: command  exited (1)
 ELIFECYCLE  Test failed. See above for more details.
[0m
[0m$ [0mcd /Users/almog/Projects/llm-benchmark/formbricks/apps/web && pnpm test -- --reporter=verbose "survey-page|survey-record|survey\.test|use-delete-survey|v3-surveys-client" 2>&1 | tail -60
},
        {
          "id": "desc",
        },
      ],
-     "select": Any<Object>,
+     "select": {
+       "createdAt": true,
+       "creator": {
+         "select": {
+           "name": true,
+         },
+       },
+       "environmentId": true,
+       "id": true,
+       "isPinned": true,
+       "name": true,
+       "singleUse": true,
+       "status": true,
+       "type": true,
+       "updatedAt": true,
+     },
      "take": 3,
      "where": {
        "AND": [],
        "OR": [
          {
@@ -24,10 +42,11 @@
            },
            "updatedAt": 2025-01-02T00:00:00.000Z,
          },
        ],
        "environmentId": "env_123",
+       "isPinned": false,
        "status": {
          "not": "inProgress",
        },
      },
    },


Number of calls: 1

 ❯ modules/survey/list/lib/survey-page.test.ts:283:36
    281|
    282|     expect(prisma.survey.findMany).toHaveBeenCalledOnce();
    283|     expect(prisma.survey.findMany).toHaveBeenCalledWith({
       |                                    ^
    284|       where: {
    285|         environmentId,

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/4]⎯


 Test Files  1 failed | 364 passed (365)
      Tests  4 failed | 4292 passed (4296)
   Start at  01:54:58
   Duration  30.33s (transform 14.16s, setup 35.73s, import 83.98s, tests 35.16s, environment 2.47s)

 ELIFECYCLE  Test failed. See above for more details.
[0m
[0m$ [0mcd /Users/almog/Projects/llm-benchmark/formbricks/apps/web && pnpm test -- "survey-page" 2>&1 | grep "FAIL\|●\| ✕\|⎯⎯⎯" | head -30
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 4 ⎯⎯⎯⎯⎯⎯⎯
 FAIL  modules/survey/list/lib/survey-page.test.ts > getSurveyListPage > uses a stable updatedAt order with a next cursor
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/4]⎯
 FAIL  modules/survey/list/lib/survey-page.test.ts > getSurveyListPage > applies a name cursor for forward pagination
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/4]⎯
 FAIL  modules/survey/list/lib/survey-page.test.ts > getSurveyListPage > paginates relevance by exhausting in-progress surveys before others
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/4]⎯
 FAIL  modules/survey/list/lib/survey-page.test.ts > getSurveyListPage > continues relevance pagination from the other bucket cursor
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/4]⎯
[0m
[0m→ [0mRead apps/web/modules/survey/list/lib/survey-page.test.ts
[0m
[0m← [0mEdit apps/web/modules/survey/list/lib/survey-page.test.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.test.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.test.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.test.ts
@@ -41,8 +41,9 @@
     createdAt: new Date("2025-01-01T00:00:00.000Z"),
     updatedAt: new Date("2025-01-02T00:00:00.000Z"),
     creator: { name: "Alice" },
     singleUse: null,
+    isPinned: false,
     ...overrides,
   };
 }
 

[0m
[0m← [0mEdit apps/web/modules/survey/list/lib/survey-page.test.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.test.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.test.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.test.ts
@@ -101,9 +101,9 @@
 expect(buildWhereClause).toHaveBeenCalledWith(undefined);
 expect(prisma.survey.findMany).toHaveBeenCalledWith({
   where: { environmentId, AND: [] },
   select: expect.any(Object),
-  orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
+  orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
   take: 2,
 });
 expect(page.surveys).toHaveLength(1);
 expect(page.surveys[0].responseCount).toBe(3);

[0m
[0m← [0mEdit apps/web/modules/survey/list/lib/survey-page.test.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.test.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.test.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.test.ts
@@ -147,9 +147,9 @@
       AND: [],
       OR: [{ name: { gt: "Bravo" } }, { name: "Bravo", id: { gt: "survey_b" } }],
     },
     select: expect.any(Object),
-    orderBy: [{ name: "asc" }, { id: "asc" }],
+    orderBy: [{ isPinned: "desc" }, { name: "asc" }, { id: "asc" }],
     take: 3,
   });
 });
 

[0m
[0m← [0mEdit apps/web/modules/survey/list/lib/survey-page.test.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.test.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.test.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.test.ts
@@ -154,8 +154,9 @@
 });
 
 test("paginates relevance by exhausting in-progress surveys before others", async () => {
   vi.mocked(prisma.survey.findMany)
+    .mockResolvedValueOnce([] as never) // pinned bucket — empty
     .mockResolvedValueOnce([
       makeSurveyRow({
         id: "survey_in_progress",
         status: "inProgress",
@@ -184,26 +185,41 @@
     cursor: null,
     sortBy: "relevance",
   });
 
+  // call 1: pinned bucket
   expect(prisma.survey.findMany).toHaveBeenNthCalledWith(1, {
     where: {
       environmentId,
       AND: [],
-      status: "inProgress",
+      isPinned: true,
     },
     select: expect.any(Object),
-    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
+    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
     take: 3,
   });
+  // call 2: inProgress bucket
   expect(prisma.survey.findMany).toHaveBeenNthCalledWith(2, {
     where: {
       environmentId,
       AND: [],
+      isPinned: false,
+      status: "inProgress",
+    },
+    select: expect.any(Object),
+    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
+    take: 3,
+  });
+  // call 3: other bucket
+  expect(prisma.survey.findMany).toHaveBeenNthCalledWith(3, {
+    where: {
+      environmentId,
+      AND: [],
+      isPinned: false,
       status: { not: "inProgress" },
     },
     select: expect.any(Object),
-    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
+    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
     take: 2,
   });
   expect(page.surveys.map((survey) => survey.id)).toEqual(["survey_in_progress", "survey_other_1"]);
   expect(decodeSurveyListPageCursor(page.nextCursor as string, "relevance")).toEqual({

[0m
[0m← [0mEdit apps/web/modules/survey/list/lib/survey-page.test.ts
Index: /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.test.ts
===================================================================
--- /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.test.ts
+++ /Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/survey/list/lib/survey-page.test.ts
@@ -300,8 +300,9 @@
 expect(prisma.survey.findMany).toHaveBeenCalledWith({
   where: {
     environmentId,
     AND: [],
+    isPinned: false,
     status: { not: "inProgress" },
     OR: [
       { updatedAt: { lt: new Date("2025-01-02T00:00:00.000Z") } },
       {
@@ -310,9 +311,9 @@
       },
     ],
   },
   select: expect.any(Object),
-  orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
+  orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
   take: 3,
 });
 expect(page.surveys.map((survey) => survey.id)).toEqual(["survey_other_2"]);
 expect(page.nextCursor).toBeNull();

[0m
[0m$ [0mcd /Users/almog/Projects/llm-benchmark/formbricks/apps/web && pnpm test -- "survey-page" 2>&1 | tail -30
"name": "PrismaClientKnownRequestError"
    }
[31mERROR[39m [2026-04-30 01:57:14.672 +0300] (formbricks): [36mSurvey is not a link survey or is not in progress[39m
    [35msurveyId[39m: "survey-123"
    [35msegmentId[39m: "segment-456"
[31mERROR[39m [2026-04-30 01:57:22.632 +0300] (formbricks): [36mFollow-up processing errors[39m
    [35merrors[39m: [
      "FollowUp followup1 failed: Email address is not valid for followup: followup1"
    ]
    [35mmeta[39m: {
      "responseId": "response1",
      "surveyId": "survey1",
      "organizationId": "org1"
    }
Warning: A vi.mock("@formbricks/database") call in "/Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/auth/signup/lib/__tests__/team.test.ts" is not at the top level of the module. Although it appears nested, it will be hoisted and executed before any tests run. Move it to the top level to reflect its actual execution order. This will become an error in a future version.
See: https://vitest.dev/guide/mocking/modules#how-it-works
Warning: A vi.mock("@/lib/constants") call in "/Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/auth/signup/lib/__tests__/team.test.ts" is not at the top level of the module. Although it appears nested, it will be hoisted and executed before any tests run. Move it to the top level to reflect its actual execution order. This will become an error in a future version.
See: https://vitest.dev/guide/mocking/modules#how-it-works
Warning: A vi.mock("@/lib/membership/service") call in "/Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/auth/signup/lib/__tests__/team.test.ts" is not at the top level of the module. Although it appears nested, it will be hoisted and executed before any tests run. Move it to the top level to reflect its actual execution order. This will become an error in a future version.
See: https://vitest.dev/guide/mocking/modules#how-it-works
Warning: A vi.mock("@formbricks/logger") call in "/Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/auth/signup/lib/__tests__/team.test.ts" is not at the top level of the module. Although it appears nested, it will be hoisted and executed before any tests run. Move it to the top level to reflect its actual execution order. This will become an error in a future version.
See: https://vitest.dev/guide/mocking/modules#how-it-works
Warning: A vi.mock("react") call in "/Users/almog/Projects/llm-benchmark/formbricks/apps/web/modules/auth/signup/lib/__tests__/team.test.ts" is not at the top level of the module. Although it appears nested, it will be hoisted and executed before any tests run. Move it to the top level to reflect its actual execution order. This will become an error in a future version.
See: https://vitest.dev/guide/mocking/modules#how-it-works

 Test Files  365 passed (365)
      Tests  4296 passed (4296)
   Start at  01:56:59
   Duration  29.82s (transform 14.21s, setup 36.53s, import 82.17s, tests 34.72s, environment 2.19s)
[0m

```

## Evaluation

## Evaluation

### Rubric Criterion 1: Prisma schema + migration
**PASS**

- `isPinned Boolean @default(false)` added to the `Survey` model in `schema.prisma` ✓
- Migration file `20260429000000_add_is_pinned_to_survey/migration.sql` contains correct SQL: `ALTER TABLE "Survey" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false` ✓
- Reversible (adding a nullable-defaulted column; dropping it reverses it) ✓

### Rubric Criterion 2: Backend action uses existing auth + env helpers
**PASS**

- `toggleSurveyPinAction` uses `authenticatedActionClient` ✓
- Uses `checkAuthorizationUpdated` with `organizationId`, `projectId`, proper roles/permissions ✓
- Uses `getEnvironmentIdFromSurveyId`, `getOrganizationIdFromEnvironmentId`, `getProjectIdFromSurveyId` helper chain ✓

### Rubric Criterion 3: List sort integrates with existing query/sort parameters
**PASS**

- Standard sorts (`updatedAt`, `name`, `createdAt`): `isPinned: "desc"` prepended to `orderBy` ✓
- Relevance sort: new `pinned` bucket added as the first step before `inProgress` ✓
- `findRelevanceRows` correctly scopes each bucket (`isPinned: true` / `isPinned: false, status: "inProgress"` / `isPinned: false, status: { not: "inProgress" }`) ✓

### Rubric Criterion 4: Optimistic update uses TanStack Query `useMutation`
**PASS with minor caveat**

- A `use-pin-survey.ts` hook is created using `useMutation` pattern (matching `use-delete-survey.ts` pattern) ✓
- The hook is wired into `survey-list.tsx` via `usePinSurvey({ queryKey })` ✓
- However, the agent output doesn't show the full content of `use-pin-survey.ts` - we see it was written but the cache update implementation isn't directly visible. Given it follows the `use-delete-survey` pattern which uses TanStack Query cache updates, this is likely correct but not fully verifiable from the output.

### Rubric Criterion 5: No broken types; no TODOs left behind
**PASS**

- `isPinned: z.boolean()` added to both `TSurveyListItem` (survey-overview.ts) and the surveys Zod schema ✓
- `isPinned: true` added to `surveySelect` in `survey-record.ts` ✓
- `TSurveyRow` type automatically includes `isPinned` via Prisma inference ✓
- No TODOs visible in any diffs ✓
- Type check OOMed (too large a project), but all 4296 tests pass after updates ✓

### Rubric Criterion 6: Works end-to-end
**LARGELY PASS**

- All 4296 tests pass after the agent updated the test fixtures ✓
- The full flow from schema → service → action → hook → UI is connected ✓
- i18n keys `common.pin` / `common.unpin` added ✓
- The pin icon is rendered on `SurveyCard` with correct toggle behavior ✓
- Minor: indentation inconsistency in `en-US.json` edit (mixed spaces) is cosmetic and unlikely to break anything

### Summary

The agent produced a complete, well-integrated implementation covering all five rubric criteria. The migration SQL is correct and reversible. The action properly uses the project's auth helpers. Sorting correctly prepends `isPinned: "desc"` for standard sorts and adds a pinned bucket for relevance. The UI uses a TanStack Query `useMutation` hook. Types are updated throughout with no leftover TODOs. All tests pass after appropriate test fixture updates.

**Score: 5/5**

