export function calculateDueDate(createdAt: Date, slaDurationHours: number | null): Date | null {
  if (!slaDurationHours) return null;
  return new Date(createdAt.getTime() + slaDurationHours * 60 * 60 * 1000);
}

export function getSlaStatus(dueAt: Date | null, resolvedAt: Date | null, simulatedCurrentTime?: Date): 'WITHIN_SLA' | 'APPROACHING' | 'BREACHED' | 'NO_SLA' {
  if (!dueAt) return 'NO_SLA';
  
  const now = simulatedCurrentTime || new Date();
  
  // If already resolved, check if it was resolved before the deadline
  if (resolvedAt) {
    return resolvedAt <= dueAt ? 'WITHIN_SLA' : 'BREACHED';
  }
  
  // If not resolved, check current time
  if (now > dueAt) return 'BREACHED';
  
  // Approaching if less than 20% of SLA time remains
  // For simplicity, let's just say < 2 hours remaining is approaching
  const hoursRemaining = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursRemaining < 2) return 'APPROACHING';
  
  return 'WITHIN_SLA';
}
