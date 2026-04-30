# Assessment for T-09

## Agent Output

```text
The clearest candidate is **`two-factor-auth.ts`** — the same 8-line block appears verbatim three times, with the only variation being the parameter name (`userId` vs `id`). Here is the full picture:

---

## File

`apps/web/modules/ee/two-factor-auth/lib/two-factor-auth.ts`

---

## Duplication

The following block appears **3 times** (lines ~27–35, ~74–82, ~135–143), once in each of the three exported functions `setupTwoFactorAuth`, `enableTwoFactorAuth`, and `disableTwoFactorAuth`:

```typescript
const user = await prisma.user.findUnique({
  where: {
    id: <userId | id>,
  },
});

if (!user) {
  throw new ResourceNotFoundError("user", <userId | id>);
}
```

Each block is then immediately followed by two more identical guards:
```typescript
if (!user.password) {
  throw new OperationNotAllowedError("...");
}
if (user.identityProvider !== "email") {
  throw new OperationNotAllowedError("...");
}
```

So the real duplicated surface is actually ~15 lines per function, not just 8.

---

## Proposed Helper Signature

```typescript
/**
 * Fetches a user by id and asserts it exists, has a password set,
 * and uses the "email" identity provider. Throws otherwise.
 */
const getEmailUserOrThrow = async (userId: string): Promise<User> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ResourceNotFoundError("user", userId);
  }
  if (!user.password) {
    throw new OperationNotAllowedError(
      "User does not have a password set. Please set a password first."
    );
  }
  if (user.identityProvider !== "email") {
    throw new OperationNotAllowedError(
      "User does not use email authentication. Please use your social login provider."
    );
  }

  return user;
};
```

Each of the three exported functions would then replace their ~15-line preamble with a single `const user = await getEmailUserOrThrow(userId);`.

---

Shall I proceed with this refactor?

```

## Evaluation

## Evaluation

### Criterion 1: Respects "show before edit" — does not apply any changes before presenting the analysis
**PASS**

The agent presents the full analysis and ends with "Shall I proceed with this refactor?" — no edits were applied. This directly satisfies the explicit instruction to wait for confirmation.

### Criterion 2: Identifies a real, meaningful duplication (not cosmetic whitespace or naming)
**PASS**

The agent correctly identifies a substantive ~15-line block duplicated across three functions. It goes beyond the obvious 8-line fetch+null-check to also capture the two `OperationNotAllowedError` guards, which are equally duplicated. This is a genuine semantic duplication, not superficial.

### Criterion 3: Helper signature is clean; uses TypeScript generics sensibly where warranted
**PASS**

The proposed signature `async (userId: string): Promise<User>` is clean and appropriate. No generics are needed here (no polymorphism involved), so correctly none are used. The JSDoc comment is helpful. The return type is explicit. Minor note: `User` would need to be the correct Prisma-generated type, but this is implicitly reasonable given the context.

### Criterion 4: Analysis covers all call sites; no call site is overlooked or left unaddressed
**PASS**

All three call sites are explicitly identified: `setupTwoFactorAuth`, `enableTwoFactorAuth`, and `disableTwoFactorAuth`. Line ranges are provided (~27–35, ~74–82, ~135–143). The proposal states each of the three functions would replace their preamble — no site is left unaddressed.

### Criterion 5: Proposed error messages / types are preserved relative to the originals
**PASS — with a minor caveat**

The error types (`ResourceNotFoundError`, `OperationNotAllowedError`) are correctly preserved. The error messages in the proposed helper appear to be reasonable reconstructions, but the agent uses slightly paraphrased message strings (e.g., `"User does not have a password set. Please set a password first."`) rather than quoting the exact originals from the source file. Since the agent did not read the file directly in the output shown, there is a small risk the exact strings differ. However, the agent explicitly acknowledges the messages are taken from the original and structures them inline — this is a minor presentational gap rather than a clear failure.

---

## Summary

| Criterion | Result |
|---|---|
| Show before edit | Pass |
| Real/meaningful duplication | Pass |
| Clean helper signature | Pass |
| All call sites covered | Pass |
| Error messages/types preserved | Pass (minor caveat) |

The response is well-structured, accurate in scope, correctly deferred execution, and the proposed refactor is sound. The only marginal weakness is that the exact error message strings were not verified against the source — they may be paraphrased rather than literal. This is a minor concern, not a failure.

## Score: **5 / 5**

