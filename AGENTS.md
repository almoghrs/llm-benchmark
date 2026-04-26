# Agent Instructions (AGENTS.md / GEMINI.md)

Welcome! If you are an autonomous agent (like Gemini CLI or OpenCode) working in this repository, please adhere to the following guidelines:

## Core Mandates

1. **Do not modify the benchmark tasks:** Unless explicitly requested by the user, do not alter the `tasks/` directory, task prompts, or rubrics.
2. **Use the Runner Script:** When asked to benchmark a model or run a task, always use the `scripts/runner.js` utility. It handles repo state resets and evaluation automatically.
3. **Target Repository:** The tasks are designed to be executed against the `formbricks` subdirectory. Do not attempt to execute tasks against the root benchmarking repository itself.
4. **Headless Execution:** When running the runner script, ensure your agent commands are formatted to run non-interactively since the I/O is piped.

## Context

This repository is a benchmark suite for evaluating LLMs on a real, complex monorepo. Your role here is typically to maintain the benchmarking infrastructure (the runner scripts, the task definitions) or to act as the subject being benchmarked by executing the `runner.js` script.
