const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TASKS_DIR = path.join(__dirname, '../tasks');
const FORMBRICKS_DIR = path.join(__dirname, '../formbricks');

function resetRepo() {
  console.log(`\n🔄 Resetting ${FORMBRICKS_DIR} to a clean state...`);
  execSync('git restore .', { cwd: FORMBRICKS_DIR, stdio: 'inherit' });
  execSync('git clean -fd', { cwd: FORMBRICKS_DIR, stdio: 'inherit' });
}

function extractPromptAndExpected(taskId) {
  const taskMdPath = path.join(TASKS_DIR, taskId, 'task.md');
  if (!fs.existsSync(taskMdPath)) {
    throw new Error(`Task ${taskId} not found at ${taskMdPath}`);
  }
  
  const content = fs.readFileSync(taskMdPath, 'utf-8');
  
  // Extract prompt
  const promptMatch = content.match(/## Prompt\n\n```text\n([\s\S]*?)\n```/);
  const expectedMatch = content.match(/## Expected\n\n([\s\S]*?)$/);
  
  if (!promptMatch || !expectedMatch) {
    throw new Error(`Could not parse prompt or expected rubric from ${taskMdPath}`);
  }
  
  return {
    prompt: promptMatch[1].trim(),
    expected: expectedMatch[1].trim()
  };
}

async function runTask(taskId, isVerbose) {
  let prompt, expected;
  try {
    const extracted = extractPromptAndExpected(taskId);
    prompt = extracted.prompt;
    expected = extracted.expected;
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }

  console.log(`\n🚀 Starting Benchmark for Task: ${taskId} using Gemini CLI`);
  console.log(`=========================================`);
  console.log(prompt);
  console.log(`=========================================\n`);

  resetRepo();

  if (taskId === 'T-05') {
    console.log(`🧹 Running pre-setup for T-05: Removing existing button...`);
    execSync('node ../scripts/setup-t05.js', { cwd: FORMBRICKS_DIR, stdio: 'inherit' });
  }

  if (taskId === 'T-08') {
    console.log(`🐛 Running pre-setup for T-08: Planting bug...`);
    execSync('node ../scripts/plant-bug.js', { cwd: FORMBRICKS_DIR, stdio: 'inherit' });
  }

  const model = "gemini-3-flash-preview";
  console.log(`🤖 Invoking agent: gemini -m ${model}`);
  const startTime = Date.now();
  let agentOutput = '';

  // Use -o text for simplicity and reliability
  const fullCmd = `gemini -m ${model} -p "$BENCHMARK_PROMPT" -y -o text ${isVerbose ? '--debug' : ''}`;

  try {
    const result = execSync(fullCmd, { 
      cwd: FORMBRICKS_DIR, 
      env: { ...process.env, BENCHMARK_PROMPT: prompt },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    agentOutput = result.toString();
    console.log(agentOutput);
  } catch (error) {
    agentOutput = error.stdout ? error.stdout.toString() : '';
    agentOutput += '\n' + (error.stderr ? error.stderr.toString() : '');
    console.log(agentOutput);
    console.error(`\n⚠️ Agent execution exited with error.`);
  }

  const timeMin = Math.round((Date.now() - startTime) / 60000);
  console.log(`\n⏱️  Task execution took ~${timeMin} minutes.`);

  console.log(`\n⚖️ Generating Assessment...`);
  
  const assessmentPrompt = `
You are an expert evaluator. Compare the following agent output against the expected rubric.

Expected Rubric:
${expected}

Agent Output:
${agentOutput}

Please provide a detailed assessment of whether the agent output meets the expected rubric, and assign a final quality score (0-5).
`;

  let assessmentOutput = '';
  const fullAssessmentCmd = `gemini -m ${model} -p "$ASSESSMENT_PROMPT" -y -o text`;

  try {
    const result = execSync(fullAssessmentCmd, { 
      cwd: FORMBRICKS_DIR, 
      env: { ...process.env, ASSESSMENT_PROMPT: assessmentPrompt },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    assessmentOutput = result.toString();
    console.log(assessmentOutput);
  } catch (error) {
    assessmentOutput = error.stdout ? error.stdout.toString() : '';
    assessmentOutput += '\n' + (error.stderr ? error.stderr.toString() : '');
    console.log(assessmentOutput);
    console.error(`\n⚠️ Assessment execution failed.`);
  }

  const assessmentMdPath = path.join(TASKS_DIR, taskId, 'assessment.md');
  const assessmentContent = `# Assessment for ${taskId}

## Agent Output

\`\`\`text
${agentOutput}
\`\`\`

## Evaluation

${assessmentOutput}
`;

  fs.writeFileSync(assessmentMdPath, assessmentContent, 'utf-8');
  console.log(`\n✅ Saved output and assessment to ${assessmentMdPath}`);
}

const args = process.argv.slice(2);
const taskId = args.find(a => a.startsWith('T-'));
const isVerbose = args.includes('--verbose');

if (!taskId) {
  console.log('Usage: node runner-gemini.js T-01 [--verbose]');
  process.exit(1);
}

runTask(taskId, isVerbose);
