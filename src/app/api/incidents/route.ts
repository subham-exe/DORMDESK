import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { IncidentService } from '@/lib/server/incident-service';
import { getMockUser } from '@/lib/server/mock-auth';

export async function GET() {
  try {
    const incidents = await db.incident.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(incidents);
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const user = getMockUser(data.mockRole || 'WARDEN'); // Admin/Staff role usually creates incidents

    const incident = await IncidentService.createIncident(user, {
      title: data.title,
      category: data.category,
      location: data.location,
      severity: data.severity,
      assignedTeam: data.assignedTeam,
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (e: unknown) {
    const error = e as Error;
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
