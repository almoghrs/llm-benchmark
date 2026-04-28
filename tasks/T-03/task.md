# T-03 - Explain the Button component usage

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

- Correctly identifies the primary Button location (`apps/web/modules/ui/components/button/index.tsx`).
- Identifies that there are over 200 imports (specifically 211 as of the current snapshot) across the `apps/web` directory.
- Groups usages into feature modules like `survey`, `organization`, `ee`, `auth`, `projects`, etc.
- Correctly identifies that it is NOT re-exported under a different name (aliased) in the `apps/web` directory.
- Differentiates between the dashboard button (`apps/web`) and the survey widget button (`packages/survey-ui`).
