# Agent Instructions

**Mandatory Isolation:** You MUST NEVER perform the benchmark tasks (T-01, etc.) directly in this
conversation. Doing so exposes the evaluation rubrics to your context, which invalidates the
benchmark. ALWAYS use the runner script to invoke a separate agent instance for the task.

1. **Do not modify the benchmark tasks:** Unless explicitly requested by the user, do not alter
   the `tasks/` directory, task prompts, or rubrics.
2. **Use the Runner Script:** When asked to benchmark a model or run a task, always use
   `scripts/runner.js`. It handles repo state resets, per-task pre-setup, agent invocation, and
   evaluation automatically.
3. **Target Repository:** The tasks are designed to be executed against the `formbricks`
   subdirectory. Do not attempt to execute tasks against the root benchmarking repository itself.
4. **Headless Execution:** Ensure agent commands run non-interactively since I/O is piped.

## Running a Single Task

```bash
node scripts/runner.js <TASK_ID> [--agent opencode|gemini] [--model <model>] [--verbose] [--json]
```

**Defaults:** `--agent opencode`  `--model github-copilot/claude-sonnet-4.6`

Examples:

```bash
# Default (opencode, claude-sonnet-4.6 via GitHub Copilot)
node scripts/runner.js T-01

# Specific model
node scripts/runner.js T-01 --model openrouter/openai/gpt-oss-120b:free

# Gemini agent
node scripts/runner.js T-01 --agent gemini --model gemini-2.0-flash
```

## Running All Tasks

```bash
node scripts/run-all.js [--agent opencode|gemini] [--model <model>] [--verbose] [--json]
```

Runs T-01 through T-12 sequentially. Continues even if individual tasks fail. Prints a full
summary table with per-task scores and an aggregate average at the end.

## Per-Task Pre-Setup

Some tasks require codebase mutations before the agent runs (e.g. planting a bug, removing
existing code to make it a real implementation task). These are handled automatically via
`tasks/<TASK_ID>/setup.sh` — the runner detects and runs this script after the repo reset,
before invoking the agent.

| Task | What setup.sh does |
|------|-------------------|
| T-05 | Removes the existing "Copy Link" button from `SurveyAnalysisCTA.tsx` |
| T-08 | Plants the `lte` → `lt` date-filter bug in `apps/web/lib/response/utils.ts` |

## Assessment

After each task the runner invokes the same agent a second time as an expert evaluator,
comparing the agent's output against the `## Expected` rubric in `tasks/<TASK_ID>/task.md`.
The result (agent output + evaluation text + score) is saved to `tasks/<TASK_ID>/assessment.md`.

**Important:** Benchmark rubrics often require seeing evidence of your work. Always include the
search commands you used and a representative sample of their raw output in your final response.
Do not just provide a summary.
