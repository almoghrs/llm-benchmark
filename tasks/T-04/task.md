# T-04 - Answer an architecture question

**Category:** Arch
**Difficulty:** ●●○○○

## Prompt

```text
How does this codebase handle multi-tenancy / environment scoping?
Specifically:
1. How is the current environment resolved on an incoming API request?
2. How is data isolation enforced — is it checked in middleware, in
   each service, or via Prisma's query layer?
3. Where would I look if I wanted to change how isolation works?

Answer with file paths and short code snippets.
```

## Expected

- Identifies the environment resolution helper / session machinery.
- Correctly describes where the `environmentId` filter is applied (typically in service / lib layer).
- Points to actual file paths, not vague "check the auth module".
- Short, real code excerpts — not invented.
