const { PrismaClient } = require('@prisma/client');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const prisma = new PrismaClient();

  try {
    const userCount = await prisma.user.count();
    
    if (command === 'check_ready') {
      if (userCount > 0) {
        console.log('READY');
      } else {
        console.log('EMPTY');
      }
    } else if (command === 'verify') {
      if (userCount === 0) {
        console.error('Database is empty');
        process.exit(1);
      }
      console.log('Verified');
    }
  } catch (error) {
    if (command === 'check_ready') {
      console.log('EMPTY');
    } else {
      console.error(error.message);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
