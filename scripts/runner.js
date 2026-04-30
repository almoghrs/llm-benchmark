const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TASKS_DIR = path.join(__dirname, '../tasks');
const FORMBRICKS_DIR = path.join(__dirname, '../formbricks');

const DEFAULT_AGENT = 'opencode';
const DEFAULT_MODEL = 'github-copilot/claude-sonnet-4.6';

const AGENT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes per agent call
const GIT_TIMEOUT_MS   =      30 * 1000; // 30 seconds for git/setup ops

function resetRepo() {
  console.log(`\n🔄 Resetting ${FORMBRICKS_DIR} to a clean state...`);
  execSync('git restore .', { cwd: FORMBRICKS_DIR, stdio: 'inherit', timeout: GIT_TIMEOUT_MS });
  execSync('git clean -fd', { cwd: FORMBRICKS_DIR, stdio: 'inherit', timeout: GIT_TIMEOUT_MS });
}

function runSetup(taskId) {
  const setupPath = path.join(TASKS_DIR, taskId, 'setup.sh');
  if (fs.existsSync(setupPath)) {
    console.log(`\n⚙️  Running pre-setup for ${taskId}...`);
    execSync(`bash "${setupPath}"`, { cwd: FORMBRICKS_DIR, stdio: 'inherit', timeout: GIT_TIMEOUT_MS });
  }
}

function extractPromptAndExpected(taskId) {
  const taskMdPath = path.join(TASKS_DIR, taskId, 'task.md');
  if (!fs.existsSync(taskMdPath)) {
    throw new Error(`Task ${taskId} not found at ${taskMdPath}`);
  }

  const content = fs.readFileSync(taskMdPath, 'utf-8');

  const promptMatch = content.match(/## Prompt\n\n```text\n([\s\S]*?)\n```/);
  const expectedMatch = content.match(/## Expected\n\n([\s\S]*?)$/);

  if (!promptMatch || !expectedMatch) {
    throw new Error(`Could not parse prompt or expected rubric from ${taskMdPath}`);
  }

  return {
    prompt: promptMatch[1].trim(),
    expected: expectedMatch[1].trim(),
  };
}

/**
 * Build the shell command for a given agent.
 * The prompt is passed via the BENCHMARK_PROMPT env var in all cases.
 * Returns { cmd, parseJson }
 */
function buildAgentCmd(agent, model, isVerbose, isJson) {
  if (agent === 'gemini') {
    const debugFlag = isVerbose ? ' --debug' : '';
    return {
      cmd: `gemini -m ${model} -p "$BENCHMARK_PROMPT" -y -o text${debugFlag}`,
      parseJson: false,
    };
  }

  // opencode (default)
  const verboseFlag = isVerbose ? '--log-level DEBUG --print-logs ' : '';
  const jsonFlag = isJson ? ' --format json' : '';
  return {
    cmd: `opencode run ${verboseFlag}"$BENCHMARK_PROMPT" -m ${model}${jsonFlag}`,
    parseJson: isJson,
  };
}

function extractTextFromJsonStream(raw) {
  let text = '';
  for (const line of raw.trim().split('\n')) {
    try {
      const event = JSON.parse(line);
      if (event.type === 'text') {
        text += event.part.text;
      } else if (event.type === 'tool_use') {
        text += `\n[TOOL CALL: ${event.part.tool}]\nInput: ${JSON.stringify(event.part.state.input)}\nOutput: ${event.part.state.output}\n`;
      }
    } catch (_) {}
  }
  return text || raw; // fall back to raw if nothing parsed
}

function execAgent(cmd, promptValue, parseJson) {
  let output = '';
  try {
    const result = execSync(cmd, {
      cwd: FORMBRICKS_DIR,
      env: { ...process.env, BENCHMARK_PROMPT: promptValue },
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: AGENT_TIMEOUT_MS,
    });
    const raw = result.toString();
    output = parseJson ? extractTextFromJsonStream(raw) : raw;
  } catch (error) {
    const raw = error.stdout ? error.stdout.toString() : '';
    output = parseJson ? extractTextFromJsonStream(raw) : raw;
    output += '\n' + (error.stderr ? error.stderr.toString() : '');
    console.error(`\n⚠️  Command exited with non-zero status.`);
  }
  return output;
}

function extractScore(text) {
  // "3/5", "3 / 5", "3 out of 5"
  const m1 = text.match(/\b([0-5])(?:\.\d+)?\s*(?:\/\s*5|out\s+of\s+5)/i);
  if (m1) return parseFloat(m1[1]);
  // "Score: 3", "quality score of 3"
  const m2 = text.match(/(?:score|quality)[^\d]*([0-5])(?:\.\d+)?/i);
  if (m2) return parseFloat(m2[1]);
  return null;
}

async function runTask(taskId, agent, model, isVerbose, isJson) {
  let prompt, expected;
  try {
    ({ prompt, expected } = extractPromptAndExpected(taskId));
  } catch (err) {
    console.error(`❌ ${err.message}`);
    return { taskId, status: 'failed', score: null, error: err.message };
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀  ${taskId}  |  agent=${agent}  model=${model}`);
  console.log(`${'='.repeat(50)}`);
  console.log(prompt);
  console.log(`${'='.repeat(50)}\n`);

  resetRepo();
  runSetup(taskId);

  const { cmd, parseJson } = buildAgentCmd(agent, model, isVerbose, isJson);
  console.log(`🤖  Running: ${cmd}\n`);

  const startTime = Date.now();
  const agentOutput = execAgent(cmd, prompt, parseJson);
  console.log(agentOutput);

  const timeMin = Math.round((Date.now() - startTime) / 60000);
  console.log(`\n⏱️   Task execution took ~${timeMin} minutes.`);

  // --- Assessment ---
  console.log(`\n⚖️   Generating Assessment...`);

  const assessmentPrompt = `You are an expert evaluator. Compare the following agent output against the expected rubric.

Expected Rubric:
${expected}

Agent Output:
${agentOutput}

Please provide a detailed assessment of whether the agent output meets the expected rubric, and assign a final quality score (0-5).`;

  // Assessment always uses default (non-verbose, non-json) flags for cleanliness
  const { cmd: assessCmd, parseJson: assessParseJson } = buildAgentCmd(agent, model, false, false);
  const assessmentText = execAgent(assessCmd, assessmentPrompt, assessParseJson);
  console.log(assessmentText);

  const score = extractScore(assessmentText);

  const assessmentMdPath = path.join(TASKS_DIR, taskId, 'assessment.md');
  fs.writeFileSync(assessmentMdPath, `# Assessment for ${taskId}

## Agent Output

\`\`\`text
${agentOutput}
\`\`\`

## Evaluation

${assessmentText}
`, 'utf-8');

  console.log(`\n✅  Saved assessment to ${assessmentMdPath}`);
  if (score !== null) console.log(`   Score: ${score}/5`);

  return { taskId, status: 'success', score, timeMin };
}

// --- CLI (only when executed directly) ---
if (require.main === module) {
  const args = process.argv.slice(2);
  const taskId = args.find(a => /^T-\d+$/.test(a));
  const agentIdx = args.indexOf('--agent');
  const modelIdx = args.indexOf('--model');
  const isVerbose = args.includes('--verbose');
  const isJson = args.includes('--json');

  const agent = agentIdx !== -1 ? args[agentIdx + 1] : DEFAULT_AGENT;
  const model = modelIdx !== -1 ? args[modelIdx + 1] : DEFAULT_MODEL;

  if (!taskId) {
    console.log('Usage: node runner.js <TASK_ID> [--agent opencode|gemini] [--model <model>] [--verbose] [--json]');
    console.log(`Defaults: --agent ${DEFAULT_AGENT}  --model ${DEFAULT_MODEL}`);
    process.exit(1);
  }

  runTask(taskId, agent, model, isVerbose, isJson).then(result => {
    if (result.status === 'failed') process.exit(1);
  });
}

module.exports = { runTask, DEFAULT_AGENT, DEFAULT_MODEL };
