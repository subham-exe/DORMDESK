import { NextResponse } from 'next/server';
import { IncidentService } from '@/lib/server/incident-service';
import { getMockUser } from '@/lib/server/mock-auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const requests = await IncidentService.getIncidentRequests(id);
    return NextResponse.json(requests);
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const user = getMockUser(data.mockRole || 'WARDEN'); 
    
    // Attach request to incident
    const req = await IncidentService.attachRequestToIncident(user, id, data.requestId);
    
    return NextResponse.json(req);
  } catch (e: unknown) {
    const error = e as Error;
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
