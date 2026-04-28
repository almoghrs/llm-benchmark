const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../formbricks/apps/web/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/SurveyAnalysisCTA.tsx');

if (!fs.existsSync(targetPath)) {
  console.error(`Target file not found at ${targetPath}`);
  process.exit(1);
}

let content = fs.readFileSync(targetPath, 'utf-8');

// Remove the handleCopyLink function and the Button that uses it
// This makes the task T-05 a real implementation task

// Remove the import of LinkIcon if it's there
content = content.replace(', LinkIcon', '');
content = content.replace('LinkIcon, ', '');

// Remove the handleCopyLink constant
const handleCopyLinkRegex = /const handleCopyLink = \(\) => \{[\s\S]*?\};/g;
content = content.replace(handleCopyLinkRegex, '');

// Remove the Copy Link Button from the JSX
const buttonRegex = /\{survey\.type === "link" && \([\s\S]*?<Button variant="secondary" onClick=\{handleCopyLink\}>[\s\S]*?<\/Button>[\s\S]*?\)\}/g;
content = content.replace(buttonRegex, '');

// Also remove it from IconBar if it's there as a fallback
content = content.replace(/\{[\s\S]*?icon: LinkIcon,[\s\S]*?\},/g, '');

fs.writeFileSync(targetPath, content, 'utf-8');

console.log('✅ Prepared T-05: Removed "Copy Link" functionality from SurveyAnalysisCTA.tsx');
