import { NextResponse } from 'next/server';
import { RequestEngine } from '@/lib/server/request-engine';
import { getMockUser } from '@/lib/server/mock-auth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const { action, payload } = await request.json();
    const userRole = payload?.mockRole || 'WARDEN';
    const user = getMockUser(userRole); 

    let result;
    switch (action) {
      case 'CLASSIFY':
        result = await RequestEngine.classifyRequest(user, id, payload.category);
        break;
      case 'ROUTE':
        result = await RequestEngine.routeRequest(user, id, payload.department);
        break;
      case 'ASSIGN':
        result = await RequestEngine.assignRequest(user, id, payload.assignedAuthorityId);
        break;
      case 'ACKNOWLEDGE':
        result = await RequestEngine.acknowledgeRequest(user, id);
        break;
      case 'PROCESS':
        result = await RequestEngine.processRequest(user, id);
        break;
      case 'RESOLVE':
        result = await RequestEngine.resolveRequest(user, id, payload.resolutionNotes);
        break;
      case 'VERIFY':
        result = await RequestEngine.verifyRequest(user, id);
        break;
      case 'CLOSE':
        result = await RequestEngine.closeRequest(user, id);
        break;
      case 'REJECT':
        result = await RequestEngine.rejectRequest(user, id, payload.reason);
        break;
      case 'CANCEL':
        result = await RequestEngine.cancelRequest(user, id);
        break;
      case 'REOPEN':
        result = await RequestEngine.reopenRequest(user, id, payload.reason);
        break;
      case 'ESCALATE':
        result = await RequestEngine.escalateRequest(user, id);
        break;
      case 'AUTO_APPROVE':
        result = await RequestEngine.autoApproveRequest(user, id);
        break;
      default:
        return NextResponse.json({ error: "Invalid transition action" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (e: unknown) {
    const error = e as Error;
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message.includes('Invalid state transition')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
