import { prisma } from './src/lib/db/prisma';

async function test() {
  const req = await prisma.request.findUnique({ where: { id: 'sanity-req-a' }, include: { requester: { select: { collegeId: true } } } });
  console.log("Req with requester:", req);
}
test().catch(console.error);
