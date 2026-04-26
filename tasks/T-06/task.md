# T-06 - Add a backend endpoint

**Category:** Implement
**Difficulty:** ●●●○○

## Prompt

```text
Add an API endpoint: GET /api/v1/environments/[environmentId]/stats that
returns { surveys: number, responses: number, contacts: number } counted
for the given environment.

Follow the existing conventions: same auth/session helper other v1
endpoints use, same error shape, same response wrapper. Add a minimal
unit test for the service function using the project's existing test
setup. Do not modify unrelated files.
```

## Expected

- Places route under the existing `apps/web/app/api/v1/` tree.
- Reuses existing auth / environment-resolution helpers.
- Service function goes under the right module (surveys or environments).
- Test uses vitest (the repo's existing framework).
- Types are explicit; no `any`.
