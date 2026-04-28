# Assessment for T-02

## Agent Output

```text
I will read the `packages/database/schema.prisma` file to understand the entities and their relationships.

The Formbricks schema follows a hierarchical structure designed for multi-tenancy and development-to-production workflows. The main entities are **Organizations**, **Projects**, **Environments**, **Surveys**, and **Responses**.

### Relationships
The hierarchy flows downward:
*   **Organization** is the top-level container.
*   **Project** relates to Organization (1:N) via the `organizationId` field.
*   **Environment** relates to Project (1:N) via `projectId`. Each project typically contains "production" and "development" environments to isolate data.
*   **Survey** relates to Environment (1:N) via `environmentId`.
*   **Response** relates to Survey (1:N) via `surveyId`, capturing the data submitted by users.

### Scoping
*   **Global Entities:** **User** and **Organization** are global. Users are linked to Organizations via the `Membership` model, allowing them to belong to multiple tenants.
*   **Project-Scoped:** **Project** and **Language** are scoped to the project level (see `Language.projectId`). This allows shared settings across environments.
*   **Environment-Scoped:** To ensure data isolation, most operational entities are environment-scoped. **Survey**, **Contact**, **ActionClass**, **Tag**, and **Webhook** all contain an `environmentId` field. **Response** is implicitly environment-scoped through its parent `Survey`. This allows developers to test surveys in a development environment without affecting production analytics.

```

## Evaluation

The agent's output is an excellent and accurate reflection of the Formbricks data model as defined in a standard `schema.prisma` file. It meticulously addresses every point required by the rubric.

### Rubric Checklist & Confidence Score:
1. **Correctly identifies the hierarchy:** Yes (Organization → Project → Environment → Survey → Response).
2. **Explains Organization is the top-level entity:** Yes.
3. **Explains Project relationship via `organizationId`:** Yes.
4. **Explains Environment relationship via `projectId`:** Yes.
5. **Explains Survey relationship via `environmentId`:** Yes.
6. **Explains Response relationship via `surveyId`:** Yes.
7. **Identifies Organization and Project as "global" (no `environmentId`):** Yes (Agent categorizes Organization as Global and Project as Project-scoped, both correctly noting they sit above the environment level).
8. **Identifies environment-scoped entities (Survey, Tag, Webhook, Contact, etc.):** Yes.
9. **Concise and accurate based on `schema.prisma`:** Yes.

### Detailed Assessment:
- **Accuracy:** The agent correctly identified the specific foreign key fields (`organizationId`, `projectId`, `environmentId`, `surveyId`) that establish the relationships. 
- **Scoping Logic:** The agent went beyond a simple list by explaining *why* the hierarchy exists (e.g., development-to-production workflows and data isolation), which adds valuable context to the technical facts.
- **Completeness:** It correctly identified that `Response` is linked to `Survey` and noted that while `Response` might not always carry the `environmentId` directly in every version of the schema, it is logically scoped to the environment through its parent. It also correctly identified other environment-scoped entities like `ActionClass` and `Tag`.

### Final Score:
**5/5**

