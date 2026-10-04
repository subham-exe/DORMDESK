-- DropIndex
DROP INDEX "AuditLog_entity_entityId_idx";

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_timestamp_idx" ON "AuditLog"("entity", "entityId", "timestamp");

-- CreateIndex
CREATE INDEX "Escalation_createdAt_idx" ON "Escalation"("createdAt");

-- CreateIndex
CREATE INDEX "Incident_status_createdAt_idx" ON "Incident"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Policy_isActive_updatedAt_idx" ON "Policy"("isActive", "updatedAt");

-- CreateIndex
CREATE INDEX "Request_requesterId_updatedAt_idx" ON "Request"("requesterId", "updatedAt");

-- CreateIndex
CREATE INDEX "Request_status_createdAt_idx" ON "Request"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Request_status_updatedAt_idx" ON "Request"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Request_status_resolvedAt_idx" ON "Request"("status", "resolvedAt");
