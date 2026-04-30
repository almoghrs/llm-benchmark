#!/usr/bin/env node
/**
 * summarize.js
 *
 * Reads the latest assessment.md from every tasks/T-* directory,
 * writes a scored summary table to tasks/results/<timestamp>.md,
 * then calls the agent model to produce a qualitative analysis of
 * where the model did well / failed and why.
 *
 * Usage:
 *   node scripts/summarize.js [--agent opencode|gemini] [--model <model>] [--no-analysis]
 *
 * --agent / --model   Which agent+model to use for the analysis call.
 *                     Defaults to whatever is found in the assessment metadata.
 * --no-analysis       Skip the LLM analysis call; just write the score table.
 */

'use strict';

const fs        = require('fs');
const path      = require('path');
const { execSync } = require('child_process');

const TASKS_DIR   = path.join(__dirname, '../tasks');
const RESULTS_DIR = path.join(TASKS_DIR, 'results');

const ANALYSIS_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// --- CLI args ---
const args        = process.argv.slice(2);
const agentIdx    = args.indexOf('--agent');
const modelIdx    = args.indexOf('--model');
const noAnalysis  = args.includes('--no-analysis');
const cliAgent    = agentIdx !== -1 ? args[agentIdx + 1] : null;
const cliModel    = modelIdx !== -1 ? args[modelIdx + 1] : null;

// --- Helpers ---

function makeTimestamp() {
  return new Date().toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, 'Z');
}

function bar(score) {
  if (score === null) return '   n/a';
  const filled = Math.round(score);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled) + `  ${score}/5`;
}

/**
 * Parse the <!-- run-meta: key=value ... --> comment from an assessment file.
 */
function parseRunMeta(content) {
  const match = content.match(/<!--\s*run-meta:(.*?)-->/);
  if (!match) return null;
  const meta = {};
  for (const pair of match[1].trim().split(/\s+/)) {
    const eq = pair.indexOf('=');
    if (eq === -1) continue;
    meta[pair.slice(0, eq)] = pair.slice(eq + 1);
  }
  return meta;
}

/**
 * Extract the ## Evaluation section from an assessment file.
 */
function extractEvaluation(content) {
  const match = content.match(/^## Evaluation\s*\n([\s\S]*?)(?=\n---\s*\n|$)/m);
  return match ? match[1].trim() : null;
}

/**
 * Build the agent shell command (mirrors runner.js buildAgentCmd, no verbose/json flags).
 */
function buildAgentCmd(agent, model) {
  if (agent === 'gemini') {
    return `gemini -m ${model} -p "$BENCHMARK_PROMPT" -y -o text`;
  }
  return `opencode run "$BENCHMARK_PROMPT" -m ${model}`;
}

/**
 * Call the agent with a prompt and return its output.
 */
function callAgent(agent, model, prompt) {
  const cmd = buildAgentCmd(agent, model);
  try {
    const result = execSync(cmd, {
      cwd: path.join(__dirname, '../formbricks'),
      env: { ...process.env, BENCHMARK_PROMPT: prompt },
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: ANALYSIS_TIMEOUT_MS,
    });
    return result.toString().trim();
  } catch (err) {
    const out = err.stdout ? err.stdout.toString().trim() : '';
    const errOut = err.stderr ? err.stderr.toString().trim() : '';
    console.error(`\n⚠️  Analysis agent call failed: ${err.message}`);
    return out || errOut || '(no output)';
  }
}

// --- Main ---

function summarize() {
  const taskDirs = fs.readdirSync(TASKS_DIR)
    .filter(name => /^T-\d+$/.test(name))
    .sort();

  const rows = [];

  for (const taskId of taskDirs) {
    const assessPath = path.join(TASKS_DIR, taskId, 'assessment.md');
    if (!fs.existsSync(assessPath)) continue;

    const content = fs.readFileSync(assessPath, 'utf-8').trim();
    if (!content) continue;

    const meta = parseRunMeta(content);
    let score, timestamp, agent, model, timeMin;

    if (meta) {
      score     = meta.score === 'n/a' ? null : parseFloat(meta.score);
      timestamp = meta.timestamp ?? '—';
      agent     = meta.agent     ?? '—';
      model     = meta.model     ?? '—';
      timeMin   = meta.timeMin   ?? '—';
    } else {
      score = null; timestamp = agent = model = timeMin = '—';
    }

    const evaluation = extractEvaluation(content);
    rows.push({ taskId, score, timestamp, agent, model, timeMin, evaluation });
  }

  if (rows.length === 0) {
    console.log('No assessments found — nothing to summarize.');
    return;
  }

  // Aggregates
  const scored   = rows.filter(r => r.score !== null);
  const avgScore = scored.length > 0
    ? (scored.reduce((s, r) => s + r.score, 0) / scored.length).toFixed(2)
    : null;

  // Detect single agent/model
  const agents      = [...new Set(rows.map(r => r.agent))];
  const models      = [...new Set(rows.map(r => r.model))];
  const singleAgent = agents.length === 1 && agents[0] !== '—' ? agents[0] : null;
  const singleModel = models.length === 1 && models[0] !== '—' ? models[0] : null;

  // Resolve which agent+model to use for analysis
  const analysisAgent = cliAgent ?? singleAgent ?? 'opencode';
  const analysisModel = cliModel ?? singleModel ?? null;

  // --- Build score table markdown ---
  const now = makeTimestamp();

  const headerLines = [
    `# Benchmark Summary — ${now}`,
    '',
    singleAgent ? `**Agent:** ${singleAgent}  ` : null,
    singleModel ? `**Model:** ${singleModel}  ` : null,
    `**Tasks evaluated:** ${rows.length}  `,
    `**Average score:** ${avgScore !== null ? `${avgScore}/5` : 'n/a'}  `,
    '',
  ].filter(l => l !== null).join('\n');

  const showAgent = !singleAgent;
  const showModel = !singleModel;
  const colHeaders = ['Task', 'Score', 'Duration', 'Timestamp'];
  if (showAgent) colHeaders.splice(2, 0, 'Agent');
  if (showModel) colHeaders.splice(showAgent ? 3 : 2, 0, 'Model');
  const colSep = colHeaders.map(() => '---');

  const tableRows = rows.map(r => {
    const cols = [r.taskId, r.score !== null ? `${r.score}/5` : 'n/a'];
    if (showAgent) cols.push(r.agent);
    if (showModel) cols.push(r.model);
    cols.push(r.timeMin !== '—' ? `~${r.timeMin}m` : '—');
    cols.push(r.timestamp);
    return `| ${cols.join(' | ')} |`;
  });

  const scoreBar = [
    '',
    '## Score Distribution',
    '',
    ...rows.map(r => `- **${r.taskId}** ${bar(r.score)}`),
  ].join('\n');

  const scoreMd = [
    headerLines,
    `| ${colHeaders.join(' | ')} |`,
    `| ${colSep.join(' | ')} |`,
    ...tableRows,
    '',
    avgScore !== null
      ? `**Average: ${avgScore} / 5** (${scored.length} of ${rows.length} tasks scored)`
      : '',
    scoreBar,
  ].join('\n');

  // --- Write initial file ---
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const outPath = path.join(RESULTS_DIR, `${now}.md`);
  fs.writeFileSync(outPath, scoreMd.trim() + '\n', 'utf-8');

  console.log(`\n📊  Summary written to ${outPath}`);
  console.log(`    Tasks: ${rows.length}  |  Average score: ${avgScore !== null ? `${avgScore}/5` : 'n/a'}`);

  // --- LLM Analysis ---
  if (noAnalysis || !analysisModel) {
    if (!analysisModel) console.log('\n⚠️  No model found — skipping analysis. Pass --model to enable it.');
    return outPath;
  }

  console.log(`\n🔍  Generating qualitative analysis with ${analysisAgent}/${analysisModel}...`);

  // Build per-task evaluation blurbs
  const taskBlurbs = rows.map(r => {
    const scoreStr = r.score !== null ? `${r.score}/5` : 'n/a';
    const evalText = r.evaluation ?? '(no evaluation recorded)';
    return `### ${r.taskId} — Score: ${scoreStr}\n\n${evalText}`;
  }).join('\n\n---\n\n');

  const analysisPrompt =
`You are analyzing benchmark results for an LLM coding agent (model: ${analysisModel}).
The agent was evaluated on ${rows.length} software engineering tasks, each scored 0–5.

## Score Summary

${rows.map(r => `- ${r.taskId}: ${r.score !== null ? `${r.score}/5` : 'n/a'}`).join('\n')}

Average: ${avgScore ?? 'n/a'}/5

## Per-Task Evaluations

${taskBlurbs}

---

Based on the above, write a concise but thorough analysis covering:

1. **Where the model performed well** — which task types it handled confidently and why.
2. **Where the model struggled** — which task types it failed on and the likely root causes (e.g., poor tool usage, context window exhaustion, not following instructions, shallow codebase exploration, hallucinating APIs/files, wrong library choices, failing to write actual code vs just describing it).
3. **Recurring failure patterns** — themes that show up across multiple tasks.
4. **Overall takeaway** — a one-paragraph verdict on this model's suitability for autonomous coding tasks.

Be specific and reference task IDs where relevant. Do not re-summarize each task individually — focus on patterns and explanations.`;

  const analysis = callAgent(analysisAgent, analysisModel, analysisPrompt);

  // Append analysis section to the summary file
  const analysisMd = `\n\n## Analysis\n\n${analysis}\n`;
  fs.appendFileSync(outPath, analysisMd, 'utf-8');

  console.log(`✅  Analysis appended to ${outPath}`);
  return outPath;
}

summarize();
