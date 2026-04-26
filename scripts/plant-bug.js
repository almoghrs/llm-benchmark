const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../formbricks/apps/web/lib/response/utils.ts');

if (!fs.existsSync(targetPath)) {
  console.error(`Target file not found at ${targetPath}`);
  process.exit(1);
}

let content = fs.readFileSync(targetPath, 'utf-8');

// The bug we're planting changes the 'lte' (less than or equal) bounds of the date filter 
// to 'lt' (less than), causing responses generated exactly on the boundary or within the 
// same day chunk (if max is set to end of day but we miss the edge) to disappear.
content = content.replace(
  'const createdAt: { lte?: Date; gte?: Date } = {};',
  'const createdAt: { lt?: Date; gte?: Date } = {};'
);

content = content.replace(
  'createdAt.lte = filterCriteria?.createdAt?.max;',
  'createdAt.lt = filterCriteria?.createdAt?.max;'
);

fs.writeFileSync(targetPath, content, 'utf-8');

console.log('✅ Planted date filter bug in apps/web/lib/response/utils.ts');
