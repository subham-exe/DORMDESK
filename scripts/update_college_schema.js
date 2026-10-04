const fs = require('fs');
const file = 'prisma/schema.prisma';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'authorityLevels AuthorityLevel[]\n  createdAt       DateTime         @default(now())',
  'authorityLevels AuthorityLevel[]\n  status          String           @default("ACTIVE")\n  createdAt       DateTime         @default(now())'
);
fs.writeFileSync(file, content);
console.log('College Schema updated');
