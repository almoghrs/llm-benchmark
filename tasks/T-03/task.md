# T-03 - Find usages of a component

**Category:** Explain
**Difficulty:** ●○○○○

## Prompt

```text
Who uses the <Button> component from apps/web/modules/ui/components/button
(or wherever the primary Button lives — find it first)?

List every file that imports it, grouped by feature module. Are there any
cases where it's re-exported under a different name? Flag those.
```

## Expected

- Locates the Button file first (doesn't assume path).
- Uses grep/search tool, not guesses.
- Returns a grouped list by module path.
- Identifies re-exports correctly (or states none exist).
- Flags if results were truncated.
