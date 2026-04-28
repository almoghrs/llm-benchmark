# T-02 - Explain a single file

**Category:** Explain
**Difficulty:** ●○○○○

## Prompt

```text
Read packages/database/schema.prisma.

In ~200 words explain: what are the main entities in this schema, how
do Survey / Response / Organization / Project relate to each other, and
which entities are environment-scoped vs. global? Point to the specific
fields that tell you.
```

## Expected

- Correctly identifies the hierarchy: `Organization` → `Project` → `Environment` → `Survey`.
- Explains that `Organization` is the top-level entity.
- Explains that `Project` belongs to `Organization` via `organizationId`.
- Explains that `Environment` belongs to `Project` via `projectId`.
- Explains that `Survey` belongs to `Environment` via `environmentId`.
- Explains that `Response` belongs to `Survey` via `surveyId`.
- Identifies that `Organization` and `Project` are "global" in the sense that they don't have an `environmentId`.
- Identifies that `Survey`, `Response`, `Tag`, `Webhook`, `Contact`, etc., are "environment-scoped" because they contain an `environmentId` field.
- Concise and accurate based on the `schema.prisma` file.
