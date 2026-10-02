import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { authorize } from './rbac';
import { Domain, Permission } from './policies';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';

const getSecretKey = () => {
  const jwtSecretEnv = process.env.JWT_SECRET;
  if (!jwtSecretEnv) {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return 'super-secret-key-for-local-dev-only';
    }
    throw new Error('FATAL: JWT_SECRET environment variable is required in this environment.');
  }
  return jwtSecretEnv;
};

const getEncodedKey = () => new TextEncoder().encode(getSecretKey());

export async function encrypt(payload: JWTPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getEncodedKey());
}

export async function decrypt(session: string | undefined = '') {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, getEncodedKey(), {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({ userId, expiresAt: expiresAt.toISOString() });
  
  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.userId) return null;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId as string },
    });
    if (!user) return null;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function requirePermission(domain: Domain, permission: Permission, resource?: any) {
  const user = await requireAuth();
  const isAllowed = authorize(user, domain, permission, resource);
  if (!isAllowed) {
    throw new Error('FORBIDDEN');
  }
  return user;
}
