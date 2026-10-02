import { prisma } from '../db/prisma';
import { RequestEngine } from './request-engine';

export class IncidentIntelligenceService {
  private static matchingLocks = new Set<string>();

  /**
   * Deterministic matching for a new Request against active incidents.
   * Runs synchronously or immediately after request creation to preserve accountability.
   */
  static async matchAndLinkNewRequest(requestId: string, actorId: string | null = null): Promise<{ linked: boolean, incidentId?: string, reason?: string }> {
    const request = await prisma.request.findUnique({ where: { id: requestId } });
    if (!request || request.requestType !== 'COMPLAINT' || !request.location || request.incidentId) {
      return { linked: false, reason: 'Request not eligible for incident matching.' };
    }

    const key = `${request.category}|${request.location}`;
    
    // Concurrency safety (in-memory lock)
    if (this.matchingLocks.has(key)) {
      for (let i = 0; i < 5; i++) {
        if (!this.matchingLocks.has(key)) break;
        await new Promise(r => setTimeout(r, 100));
      }
      if (this.matchingLocks.has(key)) return { linked: false, reason: 'Concurrency lock timeout.' };
    }

    this.matchingLocks.add(key);

    try {
      const timeWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);
      // 1. Exact match active incidents
      const activeIncident = await prisma.incident.findFirst({
        where: {
          category: request.category,
          location: request.location,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          createdAt: { gte: timeWindow }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (activeIncident) {
        await RequestEngine.attachToIncident(activeIncident.id, [request.id], actorId);
        await this.calculateImpact(activeIncident.id);
        return { linked: true, incidentId: activeIncident.id, reason: 'Matched existing active incident.' };
      }

      // 2. Check cluster threshold
      const relatedRequests = await prisma.request.findMany({
        where: {
          category: request.category,
          location: request.location,
          requestType: 'COMPLAINT',
          incidentId: null,
          createdAt: { gte: timeWindow },
          status: { notIn: ['RESOLVED', 'VERIFIED', 'CLOSED', 'REJECTED', 'CANCELLED'] }
        }
      });

      if (relatedRequests.length >= 3) {
        const requestIds = relatedRequests.map(r => r.id);
        const title = `Multiple issues reported: ${request.category} at ${request.location}`;
        const description = `Auto-clustered ${requestIds.length} requests for ${request.category} at ${request.location}.`;
        
        const inc = await RequestEngine.clusterIntoIncident(
          requestIds,
          title,
          description,
          request.category,
          request.location,
          request.assignedDepartment || 'General',
          actorId
        );
        
        await prisma.incident.update({
          where: { id: inc.id },
          data: { groupingReason: `Grouped ${requestIds.length} requests sharing category '${request.category}' and location '${request.location}' within 24h.` }
        });
        await this.calculateImpact(inc.id);

        return { linked: true, incidentId: inc.id, reason: 'Created new incident from threshold of related requests.' };
      }

      return { linked: false, reason: 'Insufficient evidence to link to or create an incident.' };
    } finally {
      this.matchingLocks.delete(key);
    }
  }
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

    const previousScore = incident.impactScore || 0;
    const HIGH_IMPACT_THRESHOLD = 30;

    await prisma.incident.update({
      where: { id: incidentId },
      data: { impactScore: score }
    });

    if (score >= HIGH_IMPACT_THRESHOLD && previousScore < HIGH_IMPACT_THRESHOLD) {
      // Just became high impact!
      const admins = await prisma.user.findMany({ where: { role: 'Admin' } });
      const { NotificationService, NotificationType } = await import('./notification');
      
      for (const admin of admins) {
        await NotificationService.create({
          recipientId: admin.id,
          title: 'High-Impact Incident Detected',
          message: `Incident "${incident.title}" has reached a high impact score of ${score}.`,
          type: NotificationType.INCIDENT_HIGH_IMPACT,
          metadata: { incidentId: incident.id, score, previousScore }
        });
      }
    }

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
  private static clusteringLocks = new Set<string>();

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
        if (this.clusteringLocks.has(key)) continue;
        this.clusteringLocks.add(key);

        try {
          const [category, location] = key.split('|');
          const title = `Multiple issues reported: ${category} at ${location}`;
          const description = `Auto-clustered ${requestIds.length} requests for ${category} at ${location}.`;
          const groupingReason = `Grouped ${requestIds.length} requests sharing category '${category}' and location '${location}' within 24h.`;

          const existingIncident = await prisma.incident.findFirst({
            where: { category, location, status: { notIn: ['RESOLVED', 'CLOSED'] } },
            include: { requests: { select: { id: true } } }
          });

          if (existingIncident) {
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
          const { RecurringIssueService } = await import('./recurring-issue');
          await RecurringIssueService.detectRecurring(category, location, actorId).catch(e => console.error(e));
        } finally {
          this.clusteringLocks.delete(key);
        }
      }
    }

    return clustersCreated;
  }
}


