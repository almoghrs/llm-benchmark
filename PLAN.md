# Benchmark Restructure Plan

## Goal

Run all 12 benchmark tasks against Claude Sonnet 4.6 (via GitHub Copilot), compare results to
expected rubrics, and refine rubrics where they are not grounded in reality.

---

## Phase 1 — Restructure Scripts

### 1.1 Commit snapshot
Commit the current repo state before any changes.

### 1.2 Delete obsolete scripts
These scripts automated codebase mutations that are now done via per-task `setup.sh` files.
They are no longer needed and clutter the `scripts/` directory.

| File | Reason |
|------|--------|
| `scripts/plant-bug.js` | Replaced by `tasks/T-08/setup.sh` |
| `scripts/setup-t05.js` | Replaced by `tasks/T-05/setup.sh` |
| `scripts/migrate-tasks.js` | One-time migration, already done |
| `scripts/runner-gemini.js` | Merged into unified `scripts/runner.js` |

### 1.3 Unified `scripts/runner.js`

Merge `runner.js` and `runner-gemini.js` into a single script.

**CLI:**
```
node scripts/runner.js <TASK_ID> [--agent opencode|gemini] [--model <model>] [--verbose] [--json]
```

**Defaults:**
- `--agent` → `opencode`
- `--model` → `github-copilot/claude-sonnet-4.6`

**Agent command construction:**
- `opencode`: `opencode run "$BENCHMARK_PROMPT" -m <model>`
- `gemini`: `gemini -m <model> -p "$BENCHMARK_PROMPT" -y -o text` (`--debug` if `--verbose`)

**Pre-setup:** After `resetRepo()`, checks for `tasks/<TASK_ID>/setup.sh`.
If found, runs it with `bash` inside the `formbricks` directory.
This replaces the old hardcoded T-08 block and the gemini runner's T-05 block.

**JSON mode** (`--json`): Only applies to `opencode` agent (parses NDJSON event stream).

**`--cmd` flag:** Removed. Agent and model are now the explicit interface.

### 1.4 Per-task `setup.sh` files

Tasks that require codebase mutations before the agent runs get a `setup.sh` in their task dir.
The runner runs this script (using `bash`) after resetting the repo and before running the agent.

| Task | File | What it does |
|------|------|-------------|
| T-05 | `tasks/T-05/setup.sh` | Removes `handleCopyLink` and the Copy Link `<Button>` from `SurveyAnalysisCTA.tsx`, making it a real implementation task |
| T-08 | `tasks/T-08/setup.sh` | Changes `lte` → `lt` in `apps/web/lib/response/utils.ts` to plant the date-filter bug |

Both scripts use an inline `node -e` invocation so no extra dependencies are required.

### 1.5 `scripts/run-all.js`

Runs T-01 through T-12 sequentially, delegating to `runner.js` via `execSync`.

**CLI:**
```
node scripts/run-all.js [--agent opencode|gemini] [--model <model>] [--verbose] [--json]
```

Behaviour:
- Continues to the next task if one fails (never aborts the whole run)
- Captures per-task exit status and any score extracted from the assessment
- Prints a full summary table at the end:
  - Status (success / failed) per task
  - Quality score (0–5) extracted from the assessment
  - Total tasks run, total passed, average score

---

## Phase 2 — Benchmark Run

### 2.1 Run all tasks
```
node scripts/run-all.js
```
Uses defaults: `opencode`, `github-copilot/claude-sonnet-4.6`.

T-05 and T-08 pre-setup is handled automatically via their `setup.sh` files.

### 2.2 Review results
For each task, open `tasks/T-XX/assessment.md` and compare:
- What the agent actually did
- What the `## Expected` rubric asks for

Identify rubric items that are:
- **Ungrounded** — reference files, functions, or imports that don't exist in the codebase, or
  expect behaviour that's unrealistic
- **Too strict** — penalise valid alternative implementations
- **Too loose** — pass output that clearly missed the point

### 2.3 Refine rubrics
Edit `## Expected` sections in `tasks/T-XX/task.md` where needed.
Keep the task prompts (`## Prompt`) unchanged.

---

## Phase 3 — Docs Update

### 3.1 Update `AGENTS.md`
- Remove reference to deleted `runner-gemini.js`
- Remove old `--cmd` usage example
- Add new `--agent` / `--model` flag documentation
- Add `run-all.js` usage
- Update default model

### 3.2 Update `README.md`
- Update example command to new unified CLI
- Note per-task `setup.sh` mechanism
- Note `run-all.js` for full benchmark runs

---

## Commit Strategy

| Commit | Contents |
|--------|----------|
| `chore: snapshot before benchmark restructure` | Current state, no changes |
| `refactor: unified runner, run-all script, per-task setup` | All restructure changes |

---

## File Map After Changes

```
scripts/
  runner.js         ← unified (opencode + gemini), --agent / --model flags
  run-all.js        ← NEW: runs T-01..T-12 sequentially, prints summary

tasks/
  T-05/
    task.md
    setup.sh        ← NEW: removes Copy Link button
    assessment.md
  T-08/
    task.md
    setup.sh        ← NEW: plants lte→lt bug
    assessment.md
  T-01..T-12/       ← unchanged structure

PLAN.md             ← this file
AGENTS.md           ← updated
README.md           ← updated
```
