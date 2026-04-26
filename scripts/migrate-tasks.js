const fs = require('fs');
const path = require('path');

const REMIXED_PATH = path.join(__dirname, '../Remixed.md');
const TASKS_DIR = path.join(__dirname, '../tasks');

if (!fs.existsSync(TASKS_DIR)) {
  fs.mkdirSync(TASKS_DIR, { recursive: true });
}

const content = fs.readFileSync(REMIXED_PATH, 'utf-8');

// Regex to match task sections
const taskRegex = /###\s+(T-\d{2})\s+·\s+([^\n]+)\n\n`([^`]+)`\s+·\s+`([^`]+)`[\s\S]*?\*\*Prompt:\*\*\n\n```(?:\w+)?\n([\s\S]*?)\n```\n\n\*\*Expected:\*\*\n\n([\s\S]*?)(?=\n\*\*Run Log:\*\*)/g;

let match;
while ((match = taskRegex.exec(content)) !== null) {
  const taskId = match[1];
  const title = match[2];
  const category = match[3];
  const difficulty = match[4];
  const prompt = match[5].trim();
  const expected = match[6].trim();

  const taskDir = path.join(TASKS_DIR, taskId);
  if (!fs.existsSync(taskDir)) {
    fs.mkdirSync(taskDir, { recursive: true });
  }

  const taskMdContent = `# ${taskId} - ${title}

**Category:** ${category}
**Difficulty:** ${difficulty}

## Prompt

\`\`\`text
${prompt}
\`\`\`

## Expected

${expected}
`;

  fs.writeFileSync(path.join(taskDir, 'task.md'), taskMdContent, 'utf-8');

  const assessmentMdContent = `# Assessment for ${taskId}

## Agent Output

<!-- The agent's output will be injected here -->

## Evaluation

<!-- Assessment against the expected rubric will be placed here -->
`;

  fs.writeFileSync(path.join(taskDir, 'assessment.md'), assessmentMdContent, 'utf-8');
  console.log(`Created ${taskId}`);
}
