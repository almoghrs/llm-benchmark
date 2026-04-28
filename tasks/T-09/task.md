# T-09 - Refactor without breaking behavior

**Category:** Implement
**Difficulty:** ●●●●○

## Prompt

```text
Pick a service file in apps/web/modules with more than one method doing
similar DB access + not-found-throw patterns (e.g. repeated
prisma.survey.findUnique + throw-if-null). Extract the duplication into
a private helper. Keep behavior identical and update all callers.

Before making the change, show me: the file, the duplication you see,
and the proposed helper signature. Wait for my confirmation before editing.
```

## Expected

- Respects "show before edit".
- Identifies a real, meaningful duplication. A great example is `apps/web/modules/survey/list/lib/survey.ts` where multiple resources (Environment, Project, Survey, Organization) are validated with `if (!resource) throw new ResourceNotFoundError(...)`.
- Proposes a clean helper signature, likely using generics, e.g., `validateResource<T>(resource: T | null, name: string, id: string): T`.
- Correctly updates all occurrences in the chosen file (e.g., in `copySurveyToOtherEnvironment`).
- Behavior remains identical: the same error type (`ResourceNotFoundError`) and arguments are used.
- Types remain strict; no loss of type safety for the validated resources.
