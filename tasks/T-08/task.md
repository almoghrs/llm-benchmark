# T-08 - Debug a planted bug

**Category:** Debug
**Difficulty:** ●●●○○

## Prompt

```text
Users are reporting that on the responses list page, the most recently-
submitted response is sometimes missing when filtered by today's date.
Investigate and propose a fix.
```

## Expected

- Doesn't immediately patch — reads the filtering code or asks about repro first.
- Finds the *planted* bug, not a plausible-but-wrong one.
- Explains *why* the bug causes the symptom.
- Fix is minimal and targeted.
- Flags if it found the bug but isn't 100% sure that's the one.
