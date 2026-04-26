# LLM Codebase Benchmark

This project is a benchmarking suite designed to evaluate the capability of Large Language Models (LLMs) and autonomous coding agents in a real-world, complex monorepo environment (based on [Formbricks](https://github.com/formbricks/formbricks)).

## Overview

The benchmark consists of a series of realistic engineering tasks (T-01 through T-12) ranging from simple code explanations to complex cross-stack feature implementations and architectural planning.

Each task includes:
- **Prompt:** The exact instruction given to the LLM.
- **Expected:** The rubric used to evaluate the LLM's output.

## How to Run

Use the `runner.js` script to execute a specific task against your agent of choice. The script automatically resets the target repository, injects necessary setup (like planting bugs), runs the agent, and uses the agent itself to evaluate its output against the rubric.

```bash
node scripts/runner.js <TASK_ID> --cmd "<YOUR_AGENT_COMMAND>"
```

### Example

To run Task 1 (Architecture Document) using `opencode` with the `gpt-oss-120b:free` model:

```bash
node scripts/runner.js T-01 --cmd "opencode -m openrouter/openai/gpt-oss-120b:free"
```

## Task Categories

- **Explain:** Code navigation, architecture understanding, component usage.
- **Implement:** Adding UI elements, creating API endpoints, cross-stack features, writing tests.
- **Debug:** Finding and fixing planted bugs without breaking existing functionality.
- **Plan:** Architectural design and trade-off analysis.

## Evaluation

After the agent completes the task, the runner triggers a secondary prompt asking the LLM to act as an expert evaluator. The assessment is saved to `tasks/<TASK_ID>/assessment.md` and includes a breakdown of criteria met and a final quality score out of 5.
