#!/usr/bin/env node
/**
 * summarize.js
 *
 * Reads the latest assessment.md from every tasks/T-* directory that has one,
 * extracts the run metadata, and writes a summary markdown file to:
 *   tasks/results/<timestamp>.md
 *
 * Usage:
 *   node scripts/summarize.js
 */

const fs = require('fs');
const path = require('path');

const TASKS_DIR = path.join(__dirname, '../tasks');
const RESULTS_DIR = path.join(TASKS_DIR, 'results');

// --- Helpers ---

function makeTimestamp() {
  return new Date().toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, 'Z');
}

function pad(str, len) {
  return String(str).padEnd(len, ' ');
}

function bar(score) {
  if (score === null) return '   n/a';
  const filled = Math.round(score);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled) + `  ${score}/5`;
}

/**
 * Parse the <!-- run-meta: key=value ... --> comment from an assessment file.
 * Returns an object with all key=value pairs, or null if the comment is absent.
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
 * Fall back to extracting the score from the raw text when run-meta is absent
 * (for assessments written before this feature was added).
 */
function extractScoreFallback(content) {
  const m1 = content.match(/\b([0-5])(?:\.\d+)?\s*(?:\/\s*5|out\s+of\s+5)/i);
  if (m1) return parseFloat(m1[1]);
  const m2 = content.match(/(?:score|quality)[^\d]*([0-5])(?:\.\d+)?/i);
  if (m2) return parseFloat(m2[1]);
  return null;
}

// --- Main ---

function summarize() {
  // Discover task directories (T-01, T-02, …)
  const taskDirs = fs.readdirSync(TASKS_DIR)
    .filter(name => /^T-\d+$/.test(name))
    .sort();

  const rows = [];

  for (const taskId of taskDirs) {
    const assessPath = path.join(TASKS_DIR, taskId, 'assessment.md');

    if (!fs.existsSync(assessPath)) continue;

    const content = fs.readFileSync(assessPath, 'utf-8').trim();
    if (!content) continue; // skip empty files

    const meta = parseRunMeta(content);

    let score, timestamp, agent, model, timeMin;

    if (meta) {
      score     = meta.score === 'n/a' ? null : parseFloat(meta.score);
      timestamp = meta.timestamp ?? '—';
      agent     = meta.agent     ?? '—';
      model     = meta.model     ?? '—';
      timeMin   = meta.timeMin   ?? '—';
    } else {
      // Legacy assessment (no run-meta comment)
      score     = extractScoreFallback(content);
      timestamp = '—';
      agent     = '—';
      model     = '—';
      timeMin   = '—';
    }

    rows.push({ taskId, score, timestamp, agent, model, timeMin });
  }

  if (rows.length === 0) {
    console.log('No assessments found — nothing to summarize.');
    return;
  }

  // --- Compute aggregates ---
  const scored  = rows.filter(r => r.score !== null);
  const avgScore = scored.length > 0
    ? (scored.reduce((s, r) => s + r.score, 0) / scored.length).toFixed(2)
    : null;

  // --- Detect whether all rows share the same agent/model (single run) ---
  const agents = [...new Set(rows.map(r => r.agent))];
  const models = [...new Set(rows.map(r => r.model))];
  const singleAgent = agents.length === 1 && agents[0] !== '—' ? agents[0] : null;
  const singleModel = models.length === 1 && models[0] !== '—' ? models[0] : null;

  // --- Build markdown ---
  const now = makeTimestamp();

  const header = [
    `# Benchmark Summary — ${now}`,
    '',
    singleAgent ? `**Agent:** ${singleAgent}  ` : '',
    singleModel ? `**Model:** ${singleModel}  ` : '',
    `**Tasks evaluated:** ${rows.length}  `,
    `**Average score:** ${avgScore !== null ? `${avgScore}/5` : 'n/a'}  `,
    '',
  ].filter(line => line !== '').join('\n');

  // Table — include Agent/Model columns only when they differ across rows
  const showAgent = agents.length > 1 || (agents.length === 1 && agents[0] !== '—' && !singleAgent);
  const showModel = models.length > 1 || (models.length === 1 && models[0] !== '—' && !singleModel);

  const colHeaders = ['Task', 'Score', 'Duration', 'Timestamp'];
  if (showAgent) colHeaders.splice(2, 0, 'Agent');
  if (showModel) colHeaders.splice(showAgent ? 3 : 2, 0, 'Model');

  const colSep = colHeaders.map(() => '---');

  const tableRows = rows.map(r => {
    const cols = [
      r.taskId,
      r.score !== null ? `${r.score}/5` : 'n/a',
    ];
    if (showAgent) cols.push(r.agent);
    if (showModel) cols.push(r.model);
    cols.push(r.timeMin !== '—' ? `~${r.timeMin}m` : '—');
    cols.push(r.timestamp);
    return `| ${cols.join(' | ')} |`;
  });

  const scoreBar = scored.length > 0
    ? [
        '',
        '## Score Distribution',
        '',
        ...rows.map(r =>
          `- **${r.taskId}** ${bar(r.score)}`
        ),
      ].join('\n')
    : '';

  const md = [
    header,
    `| ${colHeaders.join(' | ')} |`,
    `| ${colSep.join(' | ')} |`,
    ...tableRows,
    '',
    avgScore !== null
      ? `**Average: ${avgScore} / 5** (${scored.length} of ${rows.length} tasks scored)`
      : '',
    scoreBar,
  ].join('\n');

  // --- Write output ---
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const outPath = path.join(RESULTS_DIR, `${now}.md`);
  fs.writeFileSync(outPath, md.trim() + '\n', 'utf-8');

  console.log(`\n📊  Summary written to ${outPath}`);
  console.log(`    Tasks: ${rows.length}  |  Average score: ${avgScore !== null ? `${avgScore}/5` : 'n/a'}\n`);
}

summarize();
