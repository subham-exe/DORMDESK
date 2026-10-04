import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { SmsService } from '@/lib/services/sms';

export async function GET(_req?: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== 'Warden') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const outbox = await SmsService.listSmsOutbox(20);
    return NextResponse.json(outbox);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: (error as Error).message === 'FORBIDDEN' ? 403 : 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== 'Warden') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json();
    const sms = await SmsService.simulateSendSms({
      recipientId: body.recipientId,
      phoneNumber: body.phoneNumber || '+91-0000000000', // Default simulated phone if absent
      message: body.message,
      type: body.type || 'GENERAL',
      referenceId: body.referenceId
    }, user.id);

    return NextResponse.json(sms);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: (error as Error).message === 'FORBIDDEN' ? 403 : 400 });
  }
}
