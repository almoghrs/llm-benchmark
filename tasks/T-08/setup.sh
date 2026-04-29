#!/usr/bin/env bash
# T-08 pre-setup: plant the date-filter bug in response/utils.ts
# Changes 'lte' (less-than-or-equal) to 'lt' (less-than) so responses
# submitted exactly on the boundary date are silently dropped.
set -e

TARGET="apps/web/lib/response/utils.ts"

if [ ! -f "$TARGET" ]; then
  echo "ERROR: Target file not found: $TARGET" >&2
  exit 1
fi

node -e "
const fs = require('fs');
const file = '$TARGET';
let content = fs.readFileSync(file, 'utf-8');

content = content.replace(
  'const createdAt: { lte?: Date; gte?: Date } = {};',
  'const createdAt: { lt?: Date; gte?: Date } = {};'
);

content = content.replace(
  'createdAt.lte = filterCriteria?.createdAt?.max;',
  'createdAt.lt = filterCriteria?.createdAt?.max;'
);

fs.writeFileSync(file, content, 'utf-8');
console.log('✅ T-08 setup: planted lte→lt date-filter bug in apps/web/lib/response/utils.ts');
"
