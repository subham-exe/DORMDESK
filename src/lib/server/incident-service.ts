import { db } from './db';
import { logAudit } from './audit';
import { User } from '@prisma/client';
import { hasAuthority } from './auth';

function generateIncidentNumber(category: string): string {
  const prefix = category.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `INC-${prefix}-${timestamp}`;
}

export class IncidentService {
  
  static async createIncident(actor: User, data: { title: string, category: string, location: string, severity?: string, assignedTeam?: string }) {
    if (!hasAuthority(actor, 'ASSIGN_REQUEST')) throw new Error("Unauthorized to create incidents"); // Using ASSIGN_REQUEST auth as proxy for admin/staff

    const ticketNumber = generateIncidentNumber(data.category);

    const incident = await db.incident.create({
      data: {
        ticketNumber,
        title: data.title,
        category: data.category,
        location: data.location,
        severity: data.severity || 'LOW',
        assignedTeam: data.assignedTeam,
      }
    });

    await logAudit({
      actorId: actor.id,
      action: 'INCIDENT_CREATED',
      entity: 'INCIDENT',
      entityId: incident.id,
      metadata: { ticketNumber }
    });

    return incident;
  }

  static async attachRequestToIncident(actor: User, incidentId: string, requestId: string) {
    if (!hasAuthority(actor, 'ASSIGN_REQUEST')) throw new Error("Unauthorized");

    const req = await db.request.update({
      where: { id: requestId },
      data: { incidentId }
    });

    await logAudit({
      actorId: actor.id,
      action: 'REQUEST_ATTACHED_TO_INCIDENT',
      entity: 'REQUEST',
      entityId: requestId,
      requestId: requestId,
      metadata: { incidentId }
    });

    return req;
  }

  static async getIncidentRequests(incidentId: string) {
    return db.request.findMany({
      where: { incidentId }
    });
  }

  static async resolveIncident(actor: User, incidentId: string) {
    if (!hasAuthority(actor, 'RESOLVE_REQUEST')) throw new Error("Unauthorized");

    const incident = await db.incident.update({
      where: { id: incidentId },
      data: { status: 'RESOLVED', resolvedAt: new Date() }
    });

    await logAudit({
      actorId: actor.id,
      action: 'INCIDENT_RESOLVED',
      entity: 'INCIDENT',
      entityId: incidentId,
    });

    // In a full implementation, this might cascade RESOLVE status to all attached requests
    return incident;
  }
}
