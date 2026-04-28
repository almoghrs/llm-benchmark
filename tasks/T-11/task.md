# T-11 - Write tests for existing, untested code

**Category:** Implement
**Difficulty:** ●●●○○

## Prompt

```text
Pick a module under apps/web/modules that currently has NO tests (or
sparse ones). Write a meaningful test suite: happy path, one edge case,
one error case. Use the project's existing vitest setup, mocks, and
fixtures — don't invent a new harness.

Tell me what coverage you're aiming for and what you're deliberately
NOT testing (and why).
```

## Expected

- Picks a module where tests add value. A high-value candidate is `apps/web/modules/organization/settings/api-keys/lib/api-key.ts`, which contains critical security logic (bcrypt verification, v2 format parsing) but has 0 tests.
- Reuses the existing `@formbricks/database` mock and `vitest` patterns seen in other modules (e.g., `survey.test.ts`).
- Correctly tests the "happy path" (e.g., successful API key retrieval or creation).
- Tests at least one meaningful edge case (e.g., v2 vs legacy format, or the fire-and-forget background update logic).
- Tests at least one error case (e.g., invalid key format or database failure).
- Explains why certain parts (like `randomBytes` or actual bcrypt hashing if mocked) are or are not tested.
- All tests actually pass when run with `vitest`.
