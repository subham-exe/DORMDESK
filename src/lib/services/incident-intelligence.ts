import { prisma } from '../db/prisma';
import { RequestEngine } from './request-engine';

export class IncidentIntelligenceService {
  /**
   * Deterministic incident impact score.
   * Formula: (requestCount * 2) + (uniqueUserCount * 5) + sum(priorityWeights)
   * Priority weights: CRITICAL=10, HIGH=5, MEDIUM=2, LOW=1
   * This is a deterministic heuristic, NOT AI/ML.
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
    const priorityWeights: Record<string, number> = { CRITICAL: 10, HIGH: 5, MEDIUM: 2, LOW: 1 };
    let priorityScore = 0;
    for (const req of incident.requests) {
      priorityScore += priorityWeights[req.priority] || 0;
    }

    // Deterministic impact formula
    const score = (requestCount * 2) + (userCount * 5) + priorityScore;

    await prisma.incident.update({
      where: { id: incidentId },
      data: { impactScore: score }
    });

    return score;
  }

  /**
   * Deterministic auto-clustering of un-incidented COMPLAINT requests.
   * 
   * Grouping signals (exact matching, NOT semantic/AI):
   * - Same category (exact string match)
   * - Same location (exact string match)
   * - Created within last 24 hours
   * - Request type is COMPLAINT
   * - Not in a terminal status
   * - Not already assigned to an incident
   * - Minimum 3 qualifying requests to form a cluster
   * 
   * This operation is idempotent: calling it multiple times with the same
   * data produces the same result. Already-clustered requests are excluded
   * by the incidentId: null filter.
   */
  static async autoClusterIncidents(actorId: string): Promise<number> {
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

    // Group by category + location (exact match)
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
        const [category, location] = key.split('|');
        const title = `Multiple issues reported: ${category} at ${location}`;
        const description = `Auto-clustered ${requestIds.length} requests for ${category} at ${location}.`;
        const groupingReason = `Grouped ${requestIds.length} requests sharing category '${category}' and location '${location}' within 24h.`;

        // Check for existing open incident with same category+location to avoid duplicates
        const existingIncident = await prisma.incident.findFirst({
          where: { category, location, status: { notIn: ['RESOLVED', 'CLOSED'] } },
          include: { requests: { select: { id: true } } }
        });

        if (existingIncident) {
          // Filter out requests that are already in this incident
          const existingRequestIds = new Set(existingIncident.requests.map(r => r.id));
          const newRequestIds = requestIds.filter(id => !existingRequestIds.has(id));

          if (newRequestIds.length > 0) {
            await RequestEngine.attachToIncident(existingIncident.id, newRequestIds, actorId);
            await prisma.incident.update({
              where: { id: existingIncident.id },
              data: { groupingReason }
            });
          }
          await this.calculateImpact(existingIncident.id);
        } else {
          const inc = await RequestEngine.clusterIntoIncident(
            requestIds,
            title,
            description,
            category,
            location,
            'General',
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
