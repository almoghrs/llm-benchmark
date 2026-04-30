const path = require('path');
const { execSync } = require('child_process');
const { DEFAULT_AGENT, DEFAULT_MODEL } = require('./runner');

const SCRIPTS_DIR = __dirname;
const TASKS = ['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07', 'T-08', 'T-09', 'T-10', 'T-11', 'T-12'];

// 20 min per task: covers 2× 10-min agent calls (task + evaluator) with no slack.
// If a task hangs past this, run-all kills it and moves on.
const TASK_TIMEOUT_MS = 20 * 60 * 1000;
const SUMMARIZE_TIMEOUT_MS = 5 * 60 * 1000;

// --- Parse CLI args ---
const args = process.argv.slice(2);
const agentIdx = args.indexOf('--agent');
const modelIdx = args.indexOf('--model');
const isVerbose = args.includes('--verbose');
const isJson = args.includes('--json');

const agent = agentIdx !== -1 ? args[agentIdx + 1] : DEFAULT_AGENT;
const model = modelIdx !== -1 ? args[modelIdx + 1] : DEFAULT_MODEL;

// --- Summary helpers ---
function bar(score) {
  if (score === null) return '----';
  const filled = Math.round(score);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled) + `  ${score}/5`;
}

function pad(str, len) {
  return String(str).padEnd(len, ' ');
}

async function runAll() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  LLM Benchmark — Full Run`);
  console.log(`  Agent : ${agent}`);
  console.log(`  Model : ${model}`);
  console.log(`  Tasks : ${TASKS.join(', ')}`);
  console.log(`${'='.repeat(60)}\n`);

  const results = [];

  for (const taskId of TASKS) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  Running ${taskId} (${TASKS.indexOf(taskId) + 1}/${TASKS.length})`);
    console.log(`${'─'.repeat(60)}`);

    const taskStartTime = Date.now();
    let exitCode = 0;

    // Build the sub-command forwarding all flags
    const extraFlags = [
      `--agent ${agent}`,
      `--model ${model}`,
      isVerbose ? '--verbose' : '',
      isJson ? '--json' : '',
    ].filter(Boolean).join(' ');

    const cmd = `node "${path.join(SCRIPTS_DIR, 'runner.js')}" ${taskId} ${extraFlags}`;

    try {
      execSync(cmd, { stdio: 'inherit', timeout: TASK_TIMEOUT_MS });
    } catch (err) {
      if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
        console.error(`\n⏰  ${taskId} timed out after ${TASK_TIMEOUT_MS / 60000} minutes — skipping.`);
      }
      exitCode = err.status || 1;
    }

    const taskTimeMin = Math.round((Date.now() - taskStartTime) / 60000);

    // Read score from run-meta in the assessment file (authoritative)
    let score = null;
    try {
      const assessPath = path.join(__dirname, '../tasks', taskId, 'assessment.md');
      const fs = require('fs');
      if (fs.existsSync(assessPath)) {
        const content = fs.readFileSync(assessPath, 'utf-8');
        const metaMatch = content.match(/<!--\s*run-meta:(.*?)-->/);
        if (metaMatch) {
          const m = metaMatch[1].match(/score=([^\s]+)/);
          if (m && m[1] !== 'n/a') score = parseFloat(m[1]);
        }
      }
    } catch (_) {}

    results.push({
      taskId,
      status: exitCode === 0 ? 'success' : 'failed',
      score,
      timeMin: taskTimeMin,
    });

    const statusIcon = exitCode === 0 ? '✅' : '❌';
    console.log(`\n${statusIcon}  ${taskId} done in ~${taskTimeMin}m  |  Score: ${score !== null ? `${score}/5` : 'n/a'}`);
  }

  // --- Final Summary ---
  const totalTime = results.reduce((s, r) => s + (r.timeMin || 0), 0);
  const successful = results.filter(r => r.status === 'success');
  const scored = results.filter(r => r.score !== null);
  const avgScore = scored.length > 0
    ? (scored.reduce((s, r) => s + r.score, 0) / scored.length).toFixed(2)
    : 'n/a';

  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`  BENCHMARK SUMMARY`);
  console.log(`  Agent : ${agent}   Model : ${model}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  ${pad('Task', 7)}  ${pad('Status', 9)}  ${pad('Time', 7)}  Score`);
  console.log(`  ${'─'.repeat(54)}`);

  for (const r of results) {
    const icon = r.status === 'success' ? '✅' : '❌';
    console.log(`  ${pad(r.taskId, 7)}  ${icon} ${pad(r.status, 7)}  ${pad(`~${r.timeMin}m`, 7)}  ${bar(r.score)}`);
  }

  console.log(`  ${'─'.repeat(54)}`);
  console.log(`  ${pad('TOTAL', 7)}  ${successful.length}/${results.length} ok   ~${totalTime}m   avg ${avgScore}/5`);
  console.log(`${'='.repeat(60)}\n`);

  // --- Generate summary file ---
  try {
    console.log(`\n📊  Generating benchmark summary...`);
    execSync(`node "${path.join(SCRIPTS_DIR, 'summarize.js')}" --agent ${agent} --model ${model}`, {
      stdio: 'inherit',
      timeout: SUMMARIZE_TIMEOUT_MS,
    });
  } catch (err) {
    console.error(`⚠️  summarize.js failed: ${err.message}`);
  }
}

runAll().catch(err => {
  console.error('Fatal error in run-all:', err);
  process.exit(1);
});
