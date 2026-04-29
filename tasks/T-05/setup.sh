#!/usr/bin/env bash
# T-05 pre-setup: remove the existing "Copy Link" button from SurveyAnalysisCTA.tsx
# so the task becomes a real implementation challenge.
set -e

TARGET="apps/web/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/SurveyAnalysisCTA.tsx"

if [ ! -f "$TARGET" ]; then
  echo "ERROR: Target file not found: $TARGET" >&2
  exit 1
fi

node -e "
const fs = require('fs');
const file = '$TARGET';
let content = fs.readFileSync(file, 'utf-8');

// Remove LinkIcon import references
content = content.replace(', LinkIcon', '');
content = content.replace('LinkIcon, ', '');

// Remove the handleCopyLink constant (including its body)
content = content.replace(/const handleCopyLink = \(\) => \{[\s\S]*?\};\n?/g, '');

// Remove the JSX block: {survey.type === \"link\" && ( ... <Button ... onClick={handleCopyLink}> ... </Button> ... )}
content = content.replace(/\{survey\.type === [\"']link[\"'] && \([\s\S]*?<Button[^>]*onClick=\{handleCopyLink\}[\s\S]*?<\/Button>[\s\S]*?\)\}\n?/g, '');

// Fallback: remove any icon bar entry referencing LinkIcon
content = content.replace(/\{[\s\S]*?icon: LinkIcon,[\s\S]*?\},\n?/g, '');

fs.writeFileSync(file, content, 'utf-8');
console.log('✅ T-05 setup: removed Copy Link functionality from SurveyAnalysisCTA.tsx');
"
