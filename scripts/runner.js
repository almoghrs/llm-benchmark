const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REMIXED_PATH = path.join(__dirname, '../Remixed.md');
const FORMBRICKS_DIR = path.join(__dirname, '../formbricks');
const CSV_LOG_PATH = path.join(__dirname, '../benchmark_results.csv');

// Regex to extract tasks from the Remixed.md markdown
// It looks for ### T-XX, then grabs everything until the next ### or end of file
const TASK_REGEX = /###\s+(T-\d{2})\s+·.*?(?=\n###\s+T-|\n##\s+§|$)/gs;
const PROMPT_REGEX = /\*\*Prompt:\*\*\s*```(?:\w+)?\n([\s\S]*?)\n```/s;

function parseTasks() {
  const content = fs.readFileSync(REMIXED_PATH, 'utf-8');
  const tasks = {};
  
  let match;
  while ((match = TASK_REGEX.exec(content)) !== null) {
    const taskId = match[1];
    const taskBlock = match[0];
    
    const promptMatch = PROMPT_REGEX.exec(taskBlock);
    if (promptMatch) {
      tasks[taskId] = promptMatch[1].trim();
    }
  }
  
  return tasks;
}

function resetRepo() {
  console.log(`\n🔄 Resetting ${FORMBRICKS_DIR} to a clean state...`);
  execSync('git restore .', { cwd: FORMBRICKS_DIR, stdio: 'inherit' });
  execSync('git clean -fd', { cwd: FORMBRICKS_DIR, stdio: 'inherit' });
}

function appendToCsv(runId, taskId, category, prompts, timeMin, quality, hallucinations, compiles, verdict, notes) {
  const date = new Date().toISOString().split('T')[0];
  
  if (!fs.existsSync(CSV_LOG_PATH)) {
    fs.writeFileSync(CSV_LOG_PATH, 'run_id,date,model,model_version,infra,evaluator\n', 'utf-8');
    fs.appendFileSync(CSV_LOG_PATH, `run_id,task_id,category,prompts,time_min,quality_5,hallucinations,compiles,verdict,notes\n`);
  }

  const csvLine = `"${runId}","${taskId}","${category}","${prompts}","${timeMin}","${quality}","${hallucinations}","${compiles}","${verdict}","${notes}"\n`;
  fs.appendFileSync(CSV_LOG_PATH, csvLine);
  console.log(`📝 Logged result for ${taskId} to ${CSV_LOG_PATH}`);
}

async function runTask(taskId, modelCmd) {
  const tasks = parseTasks();
  const prompt = tasks[taskId];
  
  if (!prompt) {
    console.error(`❌ Task ${taskId} not found in Remixed.md`);
    process.exit(1);
  }

  console.log(`\n🚀 Starting Benchmark for Task: ${taskId}`);
  console.log(`=========================================`);
  console.log(prompt);
  console.log(`=========================================\n`);

  resetRepo();

  if (taskId === 'T-08') {
    console.log(`🐛 Running pre-setup for T-08: Planting bug...`);
    execSync('node ../scripts/plant-bug.js', { cwd: FORMBRICKS_DIR, stdio: 'inherit' });
  }

  console.log(`🤖 Invoking agent: ${modelCmd}`);
  const startTime = Date.now();

  try {
    // We execute the target model via shell. For example: opencode -c "prompt"
    // To handle quotes in the prompt properly, we pass it via environment variable
    execSync(`${modelCmd} run "$BENCHMARK_PROMPT"`, { 
      cwd: FORMBRICKS_DIR, 
      stdio: 'inherit',
      env: { ...process.env, BENCHMARK_PROMPT: prompt }
    });
  } catch (error) {
    console.error(`\n⚠️ Agent execution exited with error.`);
  }

  const timeMin = Math.round((Date.now() - startTime) / 60000);
  console.log(`\n⏱️  Task execution took ~${timeMin} minutes.`);
  console.log(`\nNext steps:`);
  console.log(`1. Evaluate the agent's output.`);
  console.log(`2. Log the results manually or automate using appendToCsv().`);
}

const args = process.argv.slice(2);
const taskId = args.find(a => a.startsWith('T-'));
const modelCmdIndex = args.indexOf('--cmd');

if (!taskId || modelCmdIndex === -1) {
  console.log('Usage: node runner.js T-01 --cmd "opencode"');
  process.exit(1);
}

const modelCmd = args[modelCmdIndex + 1];
runTask(taskId, modelCmd);
