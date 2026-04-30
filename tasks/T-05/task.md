# T-05 - Add a trivial UI element

**Category:** Implement
**Difficulty:** ●●○○○

## Prompt

```text
In the survey summary page, add a "Copy share link" button that copies
the public survey link to the clipboard and shows a brief success
toast using the existing toast system in this codebase.

Do not introduce new libraries. Use existing UI components and the
existing toast hook. Show me the diff.
```

## Expected

- Locates `apps/web/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/SurveyAnalysisCTA.tsx`.
- Uses the existing `<Button>` component with `variant="secondary"`.
- Uses `toast.success` from `react-hot-toast` (which is already imported in the file).
- Gets the share link URL correctly. `getSurveyUrl(survey, publicDomain, "default")` from `@/modules/analysis/utils` is the ideal helper (it exists in the codebase but is NOT pre-imported in this file). A simple template string like `` `${publicDomain}/s/${survey.id}` `` is also acceptable — the file's own `getPreviewUrl` already uses this same pattern. What is not acceptable is constructing a wrong URL (wrong path, wrong domain, etc.).
- Correctly implements the button only for `survey.type === "link"`.
- Uses a semantically appropriate icon from `lucide-react` (e.g. `LinkIcon` or `Copy`).
- Produces a clean diff that compiles and matches the project's styling.
