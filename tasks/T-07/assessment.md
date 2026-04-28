# Assessment for T-07

## Agent Output

```text
I will start by exploring the codebase to understand the current implementation of survey links, response collection, and the survey schema.

I will examine the `apps/web/app/s` directory and the Prisma schema to understand the current survey link handling and database structure.

I'll read the Prisma schema to understand the `Survey` and `Response` models.

I will list the contents of `packages/database` to find the correct path to the Prisma schema.

I will read the `schema.prisma` file, specifically looking for the `Survey` and `Response` models.

I'll read the first 100 lines of `packages/database/schema.prisma` to understand the file structure and how models are defined.

I'll use `grep_search` to find the line numbers for the `Survey` and `Response` models in `packages/database/schema.prisma`.

I'll use `grep_search` to find the line number for the `Response` model in `packages/database/schema.prisma`.

I'll search for `model Response` in `packages/database/schema.prisma` without the curly brace.

I'll read the `Survey` model in `packages/database/schema.prisma` from line 340 to line 420 to understand its current structure.

I'll search for "ABTest" or "Experiment" in the codebase to see if there's any existing logic for A/B testing.

I'll examine the code in `apps/web/app/s/[surveyId]/page.tsx` to understand how survey links are currently handled.

I'll read the contents of `apps/web/app/s/[surveyId]/page.tsx`.

I'll search for the directory `apps/web/modules/survey/link` to find the implementation of the link survey page.

I'll read the contents of `apps/web/modules/survey/link/page.tsx` to understand how survey links are processed.

I'll search for `createResponse` in the `apps/web` directory to identify where survey responses are created.

I'll list the contents of `packages/types` to find where to add the new A/B testing types.

I'll search for the string "Copy Link" in the `apps/web` directory to find the component responsible for generating and displaying survey links.

I'll search for "copy_link" in the `apps/web` directory to find the component that uses this translation key.

I'll search for "publish" in `apps/web/modules/survey/editor/components` to find the relevant component for survey publishing.

I'll read `apps/web/modules/survey/editor/components/survey-menu-bar.tsx` to find the publish button and any related logic.

I'll search for "Publish" in `apps/web/modules/survey/editor/components/survey-menu-bar.tsx` to locate the publish button and understand its functionality.

This is the proposed plan for implementing "A/B Testing" for survey links in Formbricks.

### 1. Architectural Integration
- **Frontend Router:** A new route `apps/web/app/s/ab/[abTestId]/page.tsx` will be created. This serves as the entry point for A/B tests, handling the traffic split logic and using cookies to ensure a user consistently sees the same variant.
- **Lib/Service Layer:** A new `abTest` service will be added to `packages/lib` to manage the lifecycle of experiments, handle traffic distribution logic, and aggregate comparison data.
- **Response Collection:** The existing response submission pipeline will be updated to optionally accept and store an `abTestId`. This allows for direct attribution of responses to a specific experiment without complicating the core survey logic.

### 2. DB Schema Proposal
We will introduce a new `ABTest` model and update `Survey` and `Response` to support linking.
```prisma
model ABTest {
  id            String       @id @default(cuid())
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  name          String
  status        ABTestStatus @default(active)
  environment   Environment  @relation(fields: [environmentId], references: [id], onDelete: Cascade)
  environmentId String
  
  // Variations
  surveyA       Survey       @relation("SurveyA", fields: [surveyAId], references: [id])
  surveyAId     String
  surveyB       Survey       @relation("SurveyB", fields: [surveyBId], references: [id])
  surveyBId     String

  responses     Response[]

  @@index([environmentId])
}

enum ABTestStatus {
  active
  paused
  completed
}

// Modifications to existing models:
model Survey {
  // ... existing fields
  abTestsA ABTest[] @relation("SurveyA")
  abTestsB ABTest[] @relation("SurveyB")
}

model Response {
  // ... existing fields
  abTestId String?
  abTest   ABTest? @relation(fields: [abTestId], references: [id])
}
```

### 3. API Surface
- **Management API:**
  - `POST /api/v1/environments/{envId}/ab-tests`: Create a new A/B test by linking two existing surveys.
  - `GET /api/v1/environments/{envId}/ab-tests/{id}`: Fetch experiment details and comparison analytics (e.g., conversion rates for Variant A vs. Variant B).
- **Client API:**
  - `POST /api/v1/client/{envId}/responses`: Update the payload to include an optional `abTestId` field.

### 4. Open Questions / Trade-offs
- **Persistence (Cookie vs. IP):** We will use cookies (`fb-ab-[abTestId]`) for variant persistence. While IP tracking is more robust against cookie clearing, it is less reliable for shared networks (offices, universities) and more complex to implement within the current architecture.
- **Survey Independence:** By using two separate `Survey` objects, we maintain full compatibility with existing rendering and logic. The "A/B Test" is an overlay that handles distribution and unified reporting.
- **Analytics:** Reporting will focus on "Conversion Rate" (Finishes / Displays). We will need to decide if "Displays" for A/B tests should be tracked separately or derived from existing `Display` records.

### 5. Engineering Tasks
| Task | Description | Effort |
| :--- | :--- | :--- |
| **T1: Schema & Types** | Update Prisma schema, generate types, and define Zod schemas for A/B testing. | 0.5 Day |
| **T2: A/B Service Layer** | Implement backend CRUD and traffic splitting logic in `packages/lib`. | 1.0 Day |
| **T3: Traffic Splitter Route** | Build the `/s/ab/[abTestId]` route with cookie-based persistence. | 1.0 Day |
| **T4: Management UI** | Create the experiment creation flow and a side-by-side comparison dashboard. | 1.5 Days |
| **T5: Tracking & Validation** | Update response submission to include `abTestId` and verify the end-to-end flow. | 0.5 Day |

Wait for my feedback before any implementation.

```

## Evaluation

The agent provided a solid implementation plan that demonstrates a strong understanding of the Formbricks architecture. It followed the primary constraint of providing a plan before code and correctly identified the relevant directory structures and service patterns.

### Rubric Assessment:
*   **Respects "no code yet" and "wait for feedback":** **Pass.** The agent explicitly stopped after the plan and requested feedback.
*   **Grounds the plan in the actual repo:** **Pass.** It correctly identified `apps/web/app/s` for survey link routing, the Prisma schema location, and the use of `packages/lib` for services, which are standard Formbricks patterns.
*   **Schema proposal is sensible:** **Partial Pass.** The proposed model (`ABTest`) correctly links surveys and responses. However, it lacks a `split_percentage` field (as suggested in the rubric), which would be necessary for a configurable A/B test. Additionally, there is a bizarre technical hallucination/glitch in the Prisma code block (`@.github/workflows/docker-build-validation.yml` injected into the `id` field), which is a significant formatting/integrity error.
*   **Raises real trade-offs:** **Pass.** It discussed the choice between Cookies and IP for persistence, which is a critical consideration for anonymous survey respondents in an A/B test.
*   **Tasks are small enough to estimate:** **Pass.** The tasks (T1-T5) are granular, logical, and have reasonable time estimates.

### Technical Notes:
The plan to use a dedicated route (`/s/ab/[abTestId]`) to handle the redirection/split is a clean way to implement this without bloating the core `/s/[surveyId]` logic. The attribution of the `abTestId` directly to the `Response` model ensures that analytics can be easily derived.

Overall, the output is high quality and demonstrates professional-grade planning, marred only by a strange string injection in the schema proposal and the omission of a configurable split ratio.

**Final Quality Score: 4/5**

