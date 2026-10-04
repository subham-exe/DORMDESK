const fs = require('fs');
const file = 'prisma/schema.prisma';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'accountStatus     String                @default("ACTIVE")',
  'mustChangePassword Boolean @default(false)\n  accountStatus     String                @default("ACTIVE")'
);
fs.writeFileSync(file, content);
console.log('Schema updated');
