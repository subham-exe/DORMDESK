import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const getLogLevels = () => {
  if (process.env.DEBUG_SQL === '1') {
    return ['query', 'info', 'warn', 'error'] as ('query' | 'info' | 'warn' | 'error')[];
  }
  return ['warn', 'error'] as ('query' | 'info' | 'warn' | 'error')[];
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: getLogLevels(),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Initialize SQLite configurations once per process
let initialized = false;
if (!initialized) {
  initialized = true;
  prisma.$queryRawUnsafe(`PRAGMA journal_mode = WAL;`)
    .catch(err => console.error('Failed to set WAL mode:', err));
  prisma.$queryRawUnsafe(`PRAGMA foreign_keys = ON;`)
    .catch(err => console.error('Failed to enable foreign keys:', err));
}
