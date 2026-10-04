import { prisma } from '@/lib/db/prisma';

export class EmailQuotaService {
  public static readonly DEFAULT_DAILY_LIMIT = 50;
  public static readonly ABSOLUTE_DAILY_MAX = 70;
  public static readonly ABSOLUTE_MONTHLY_MAX = 2500;

  /**
   * Atomically acquires a quota slot for an email delivery.
   * If the daily or monthly limit is reached, it returns false without permanently consuming quota.
   * If successful, the quota is consumed and the counter is incremented.
   */
  static async acquireQuota(): Promise<boolean> {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const monthStr = dateStr.substring(0, 7);

    try {
      return await prisma.$transaction(async (tx) => {
        // Increment Daily
        const dailyQuota = await tx.emailQuota.upsert({
          where: { id: dateStr },
          create: { id: dateStr, period: 'DAILY', count: 1 },
          update: { count: { increment: 1 } }
        });

        // Increment Monthly
        const monthlyQuota = await tx.emailQuota.upsert({
          where: { id: monthStr },
          create: { id: monthStr, period: 'MONTHLY', count: 1 },
          update: { count: { increment: 1 } }
        });

        // The configured limits can never exceed the absolute maximums
        // In a real system, you might read DEFAULT_DAILY_LIMIT from an ENV var,
        // but it must be clamped to ABSOLUTE_DAILY_MAX.
        const configuredDailyLimit = Math.min(
          Number(process.env.DORMDESK_DAILY_EMAIL_LIMIT) || this.DEFAULT_DAILY_LIMIT,
          this.ABSOLUTE_DAILY_MAX
        );

        if (dailyQuota.count > configuredDailyLimit || monthlyQuota.count > this.ABSOLUTE_MONTHLY_MAX) {
          throw new Error('QUOTA_EXCEEDED');
        }

        return true;
      });
    } catch (e: unknown) {
      if ((e as Error).message === 'QUOTA_EXCEEDED') {
        return false;
      }
      throw e;
    }
  }

  /**
   * Expose quota count for testing
   */
  static async getQuotaStats() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const monthStr = dateStr.substring(0, 7);

    const [daily, monthly] = await Promise.all([
      prisma.emailQuota.findUnique({ where: { id: dateStr } }),
      prisma.emailQuota.findUnique({ where: { id: monthStr } })
    ]);

    return {
      daily: daily?.count || 0,
      monthly: monthly?.count || 0
    };
  }
}
