# LLM Codebase Benchmark

This project is a benchmarking suite designed to evaluate the capability of Large Language Models (LLMs) and autonomous coding agents in a real-world, complex monorepo environment (based on [Formbricks](https://github.com/formbricks/formbricks)).

## Overview

The benchmark consists of a series of realistic engineering tasks (T-01 through T-12) ranging from simple code explanations to complex cross-stack feature implementations and architectural planning.

Each task includes:
- **Prompt:** The exact instruction given to the LLM.
- **Expected:** The rubric used to evaluate the LLM's output.

## How to Run

### Single Task

```bash
node scripts/runner.js <TASK_ID> [--agent opencode|gemini] [--model <model>] [--verbose] [--json]
```

**Defaults:** `--agent opencode`  `--model github-copilot/claude-sonnet-4.6`

```bash
# Default (opencode + claude-sonnet-4.6 via GitHub Copilot)
node scripts/runner.js T-01

# Different model
node scripts/runner.js T-01 --model openrouter/openai/gpt-oss-120b:free

# Gemini agent
node scripts/runner.js T-01 --agent gemini --model gemini-2.0-flash
```

### All Tasks

```bash
node scripts/run-all.js [--agent opencode|gemini] [--model <model>] [--verbose] [--json]
```

Runs T-01 through T-12 sequentially. Continues even if individual tasks fail. Prints a full
summary table with per-task scores and an aggregate average at the end.

## Task Categories

- **Explain:** Code navigation, architecture understanding, component usage.
- **Implement:** Adding UI elements, creating API endpoints, cross-stack features, writing tests.
- **Debug:** Finding and fixing planted bugs without breaking existing functionality.
- **Plan:** Architectural design and trade-off analysis.

## Per-Task Pre-Setup

Some tasks require codebase mutations before the agent runs. These are handled automatically
via `tasks/<TASK_ID>/setup.sh`, which the runner executes after resetting the repo.

| Task | What setup.sh does |
|------|-------------------|
| T-05 | Removes the existing "Copy Link" button, making it a real implementation task |
| T-08 | Plants a `lte` → `lt` date-filter bug for the agent to find and fix |

## Evaluation

After the agent completes a task, the runner triggers a secondary prompt asking the LLM to act
as an expert evaluator. The assessment is saved to `tasks/<TASK_ID>/assessment.md` and includes
a breakdown of criteria met and a final quality score out of 5.

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/runner.js` | Run a single task (unified, supports opencode and gemini) |
| `scripts/run-all.js` | Run all tasks sequentially and print a summary |
