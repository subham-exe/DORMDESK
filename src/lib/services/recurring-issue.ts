import { prisma } from '../db/prisma';
import { AuditService } from './audit';

export class RecurringIssueService {
  private static locks = new Set<string>();

  /**
   * Deterministic recurring issue detection.
   * Pattern Identity: category + location
   * Window: Past 30 days
   * Threshold: >= 3 separate occurrences
   * Occurrence definition: A linked Incident OR a standalone COMPLAINT request.
   */
  static async detectRecurring(category: string, location: string, actorId: string | null = null) {
    if (!category || !location) return null;
    
    const lockKey = `${category}|${location}`;
    if (this.locks.has(lockKey)) return null;
    this.locks.add(lockKey);

    try {
      const WINDOW_DAYS = 30;
      const THRESHOLD = 3;
      const timeWindow = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

      // 1. Find occurrences: Incidents in the window
      const incidents = await prisma.incident.findMany({
        where: { category, location, createdAt: { gte: timeWindow } },
        select: { id: true, createdAt: true }
      });

      // 2. Find occurrences: Standalone requests in the window
      const standaloneRequests = await prisma.request.findMany({
        where: {
          category,
          location,
          incidentId: null,
          requestType: 'COMPLAINT',
          createdAt: { gte: timeWindow }
        },
        select: { id: true, createdAt: true }
      });

      const totalOccurrences = incidents.length + standaloneRequests.length;

      if (totalOccurrences >= THRESHOLD) {
        let recurring = await prisma.recurringIssue.findUnique({
          where: { category_location: { category, location } }
        });

        const detectionReason = `Detected ${totalOccurrences} separate occurrences (Incidents and isolated Requests) matching '${category}' at '${location}' within the past ${WINDOW_DAYS} days.`;
        
        const allDates = [...incidents.map(i => i.createdAt), ...standaloneRequests.map(r => r.createdAt)];
        allDates.sort((a, b) => a.getTime() - b.getTime());
        const firstDetectedAt = allDates[0] || new Date();
        const lastDetectedAt = allDates[allDates.length - 1] || new Date();

        if (recurring) {
          recurring = await prisma.recurringIssue.update({
            where: { id: recurring.id },
            data: {
              occurrenceCount: totalOccurrences,
              status: 'ACTIVE', // Automatically reopen if previously resolved
              lastDetectedAt,
              detectionReason,
              updatedAt: new Date()
            }
          });
        } else {
          recurring = await prisma.recurringIssue.create({
            data: {
              category,
              location,
              occurrenceCount: totalOccurrences,
              status: 'ACTIVE',
              firstDetectedAt,
              lastDetectedAt,
              detectionReason
            }
          });
          
          await AuditService.log({
            actorId,
            actorName: actorId === null ? 'System Engine' : undefined,
            action: 'RECURRING_ISSUE_DETECTED',
            domain: 'Incident',
            targetId: recurring.id,
            metadata: { category, location, occurrenceCount: totalOccurrences, windowDays: WINDOW_DAYS }
          });
        }

        // Link occurrences to this Recurring Issue
        if (incidents.length > 0) {
          await prisma.incident.updateMany({
            where: { id: { in: incidents.map(i => i.id) } },
            data: { recurringIssueId: recurring.id }
          });
        }
        if (standaloneRequests.length > 0) {
          await prisma.request.updateMany({
            where: { id: { in: standaloneRequests.map(r => r.id) } },
            data: { recurringIssueId: recurring.id }
          });
        }

        return recurring;
      } else {
        // totalOccurrences < THRESHOLD
        // If an old count remains permanently inflated after occurrences age out, repair it.
        const existing = await prisma.recurringIssue.findUnique({
          where: { category_location: { category, location } }
        });
        
        if (existing) {
          await prisma.recurringIssue.update({
            where: { id: existing.id },
            data: {
              occurrenceCount: totalOccurrences,
              // If it falls below threshold due to aging, we could auto-resolve it,
              // but just fixing the count prevents it from being permanently inflated above threshold.
              updatedAt: new Date()
            }
          });
        }
      }

      return null;
    } catch (err) {
      console.error('Failed to detect recurring issue:', err);
      return null;
    } finally {
      this.locks.delete(lockKey);
    }
  }
}
