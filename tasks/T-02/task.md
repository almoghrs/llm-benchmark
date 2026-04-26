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

- Gets the Organization → Project → Environment → Survey hierarchy right.
- Correctly identifies Response belongs to Survey.
- Points to the actual FK fields (e.g. `environmentId`).
- Doesn't invent fields that don't exist.
- Concise; no padding.
