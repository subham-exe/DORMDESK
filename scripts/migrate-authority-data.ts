import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration...');
  
  // 1. Rename/Update OWNER_001 to SYSTEM_ADMIN
  const ownerLevel = await prisma.authorityLevel.findUnique({ where: { name: 'OWNER_001' } });
  let systemAdminLevel = await prisma.authorityLevel.findUnique({ where: { name: 'SYSTEM_ADMIN' } });

  if (ownerLevel && !systemAdminLevel) {
    systemAdminLevel = await prisma.authorityLevel.update({
      where: { id: ownerLevel.id },
      data: { name: 'SYSTEM_ADMIN' }
    });
    console.log('Renamed OWNER_001 to SYSTEM_ADMIN.');
  } else if (ownerLevel && systemAdminLevel) {
    // Both exist, so delete OWNER_001
    await prisma.authorityLevel.delete({ where: { id: ownerLevel.id } });
    console.log('Deleted redundant OWNER_001.');
  } else if (!ownerLevel && systemAdminLevel) {
    console.log('SYSTEM_ADMIN already exists, OWNER_001 not found.');
  } else {
    console.log('Neither SYSTEM_ADMIN nor OWNER_001 found.');
  }

  // 2. Delete ADMIN authority level if it exists
  const adminLevel = await prisma.authorityLevel.findUnique({ where: { name: 'ADMIN' } });
  if (adminLevel) {
    await prisma.authorityLevel.delete({ where: { id: adminLevel.id } });
    console.log('Deleted ADMIN authority level.');
  } else {
    console.log('No ADMIN authority level found.');
  }

  // 3. Update admin@demo.local
  if (systemAdminLevel) {
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@demo.local' } });
    if (adminUser) {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          authorityId: systemAdminLevel.id,
          role: 'SYSTEM_ADMIN'
        }
      });
      console.log('Updated admin@demo.local with SYSTEM_ADMIN authority and role.');
    } else {
      console.log('User admin@demo.local not found.');
    }
  }

  console.log('Migration completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
