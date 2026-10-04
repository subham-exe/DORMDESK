import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { NotificationPreferencesService } from '@/lib/services/notification-preferences';
import { ConsentLedgerService, ConsentPurpose } from '@/lib/services/consent-ledger';

export async function GET(_req?: Request) {
  try {
    const user = await requireAuth();
    const preferences = await NotificationPreferencesService.getPreferences(user.id);
    return NextResponse.json(preferences);
  } catch (error: unknown) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { purpose, enabled } = body;

    if (!ConsentLedgerService.VALID_PURPOSES.includes(purpose)) {
      return NextResponse.json({ error: 'Invalid purpose' }, { status: 400 });
    }

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (enabled) {
      await ConsentLedgerService.grantConsent({
        userId: user.id,
        purpose: purpose as ConsentPurpose,
        consentVersion: 'v1.0',
        consentText: `User granted ${purpose} via Settings`,
        method: 'WEB',
        source: 'student-portal'
      }, user.id);
    } else {
      await ConsentLedgerService.withdrawConsent({
        userId: user.id,
        purpose: purpose as ConsentPurpose,
        consentVersion: 'v1.0',
        consentText: `User withdrew ${purpose} via Settings`,
        method: 'WEB',
        source: 'student-portal'
      }, user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
