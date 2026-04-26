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

- Locates the correct summary page component.
- Uses the existing `<Button>` component.
- Uses the existing toast system (sonner / custom hook — whichever is in repo).
- Produces a clean diff, no unrelated changes.
- Code compiles; types check.
- Handles the "not published yet" state sensibly (or explicitly notes it).
