# Agent Instructions

**Mandatory Isolation:** You MUST NEVER perform the benchmark tasks (T-01, etc.) directly in this conversation. Doing so exposes the evaluation rubrics to your context, which invalidates the benchmark. ALWAYS use the provided runner scripts (`scripts/runner.js` or `scripts/runner-gemini.js`) to invoke a separate agent instance for the task.

1. **Do not modify the benchmark tasks:** Unless explicitly requested by the user, do not alter the `tasks/` directory, task prompts, or rubrics.
2. **Use the Runner Script:** When asked to benchmark a model or run a task, always use the `scripts/runner.js` utility. It handles repo state resets and evaluation automatically.
3. **Target Repository:** The tasks are designed to be executed against the `formbricks` subdirectory. Do not attempt to execute tasks against the root benchmarking repository itself.
4. **Headless Execution:** When running the runner script, ensure your agent commands are formatted to run non-interactively since the I/O is piped.

## Testing and Benchmarking

When asked to run tests or benchmarks, you **must** use `opencode` as the agent. Always execute tasks using the `scripts/runner.js` script with the following command format:

```bash
node scripts/runner.js <TASK_ID> --cmd "opencode run {{PROMPT}} -m openrouter/openai/gpt-oss-120b:free --thinking"
```

Replace `<TASK_ID>` with the specific task ID (e.g., `T-01`, `T-02`, etc.). Run tasks one by one and assess the results after each run.

**Important:** Benchmark rubrics often require seeing "evidence" of your work. Always include the search commands you used and a representative sample of their raw output in your final response. Do not just provide a summary.
