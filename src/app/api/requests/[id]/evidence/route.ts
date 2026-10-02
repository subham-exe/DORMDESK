import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { EvidenceService } from '@/lib/services/evidence';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const user = await requireAuth();
    const evidence = await EvidenceService.getEvidenceForRequest(resolvedParams.id, user.id);
    return NextResponse.json({ success: true, data: evidence });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    const status = msg.includes('Not authorized') ? 403 : 400;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { type, description, reference } = body;

    if (!type || !reference) {
      return NextResponse.json({ success: false, error: 'type and reference are required' }, { status: 400 });
    }

    const evidence = await EvidenceService.addEvidence({
      requestId: resolvedParams.id,
      type,
      description,
      reference,
      actorId: user.id
    });

    return NextResponse.json({ success: true, data: evidence }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    const status = msg.includes('Not authorized') ? 403 : msg.includes('not found') ? 404 : 400;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
