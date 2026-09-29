import { prisma } from '../db/prisma';
import { RequestEngine } from './request-engine';

export class IncidentIntelligenceService {
  /**
   * Deterministic incident impact score
   */
  static async calculateImpact(incidentId: string): Promise<number> {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: { requests: true }
    });

    if (!incident || incident.requests.length === 0) return 0;

    const requestCount = incident.requests.length;
    
    // Number of unique affected users
    const userIds = new Set(incident.requests.map(r => r.requesterId));
    const userCount = userIds.size;
    
    // Priority weights
    let priorityScore = 0;
    for (const req of incident.requests) {
      if (req.priority === 'CRITICAL') priorityScore += 10;
      if (req.priority === 'HIGH') priorityScore += 5;
      if (req.priority === 'MEDIUM') priorityScore += 2;
      if (req.priority === 'LOW') priorityScore += 1;
    }

    // Impact formula
    const score = (requestCount * 2) + (userCount * 5) + priorityScore;
    
    await prisma.incident.update({
      where: { id: incidentId },
      data: { impactScore: score }
    });

    return score;
  }

  /**
   * Automatically groups un-incidented requests based on category and location
   */
  static async autoClusterIncidents(actorId: string): Promise<number> {
    // Look for requests without an incident, created in the last 24 hours, not closed
    const timeWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const candidates = await prisma.request.findMany({
      where: {
        incidentId: null,
        createdAt: { gte: timeWindow },
        requestType: 'COMPLAINT',
        status: { notIn: ['RESOLVED', 'VERIFIED', 'CLOSED', 'REJECTED', 'APPROVED', 'CANCELLED'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by category + location
    const groups: Record<string, string[]> = {};
    
    for (const req of candidates) {
      if (!req.location) continue;
      const key = `${req.category}|${req.location}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(req.id);
    }

    let clustersCreated = 0;

    for (const [key, requestIds] of Object.entries(groups)) {
      if (requestIds.length >= 3) {
        // Needs clustering!
        const [category, location] = key.split('|');
        const title = `Multiple issues reported: ${category} at ${location}`;
        const description = `Auto-clustered ${requestIds.length} requests for ${category} at ${location}.`;
        
        const existingIncident = await prisma.incident.findFirst({
          where: { category, location, status: { notIn: ['RESOLVED', 'CLOSED'] } }
        });

        const groupingReason = `Grouped ${requestIds.length} requests sharing category '${category}' and location '${location}' within 24h.`;

        if (existingIncident) {
          await RequestEngine.attachToIncident(existingIncident.id, requestIds, actorId);
          await prisma.incident.update({
            where: { id: existingIncident.id },
            data: { groupingReason }
          });
          await this.calculateImpact(existingIncident.id);
        } else {
          const inc = await RequestEngine.clusterIntoIncident(
            requestIds, 
            title, 
            description, 
            category, 
            location, 
            'General', // Fallback department
            actorId
          );
          await prisma.incident.update({
            where: { id: inc.id },
            data: { groupingReason }
          });
          await this.calculateImpact(inc.id);
          clustersCreated++;
        }
      }
    }
    
    return clustersCreated;
  }
}
