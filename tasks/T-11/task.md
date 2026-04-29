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

- Picks a module where tests add value (not trivial getters).
- Reuses existing test utilities (mock-prisma, fixtures).
- Tests are independent; no shared mutable state.
- Explains scoping decisions clearly.
- All tests actually pass when run.
