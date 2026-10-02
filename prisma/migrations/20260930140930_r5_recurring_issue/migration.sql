-- CreateTable
CREATE TABLE "RecurringIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "detectionReason" TEXT NOT NULL,
    "firstDetectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastDetectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Incident" (
    "recurringIssueId" TEXT,
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedDepartment" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    "groupingReason" TEXT,
    "impactScore" INTEGER DEFAULT 0,
    CONSTRAINT "Incident_recurringIssueId_fkey" FOREIGN KEY ("recurringIssueId") REFERENCES "RecurringIssue" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Incident" ("assignedDepartment", "category", "createdAt", "description", "groupingReason", "id", "impactScore", "location", "resolvedAt", "status", "title", "updatedAt") SELECT "assignedDepartment", "category", "createdAt", "description", "groupingReason", "id", "impactScore", "location", "resolvedAt", "status", "title", "updatedAt" FROM "Incident";
DROP TABLE "Incident";
ALTER TABLE "new_Incident" RENAME TO "Incident";
CREATE INDEX "Incident_impactScore_idx" ON "Incident"("impactScore");
CREATE INDEX "Incident_status_idx" ON "Incident"("status");
CREATE INDEX "Incident_status_createdAt_idx" ON "Incident"("status", "createdAt");
CREATE TABLE "new_Request" (
    "recurringIssueId" TEXT,
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketNumber" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'LOW',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedDepartment" TEXT,
    "assignedAuthorityId" TEXT,
    "SLA" INTEGER,
    "dueAt" DATETIME,
    "incidentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    "exitTime" DATETIME,
    "metadata" TEXT,
    "idempotencyKey" TEXT,
    "policyId" TEXT,
    CONSTRAINT "Request_recurringIssueId_fkey" FOREIGN KEY ("recurringIssueId") REFERENCES "RecurringIssue" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Request_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Request_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Request_assignedAuthorityId_fkey" FOREIGN KEY ("assignedAuthorityId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Request_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Request" ("SLA", "assignedAuthorityId", "assignedDepartment", "category", "createdAt", "description", "dueAt", "exitTime", "id", "idempotencyKey", "incidentId", "location", "metadata", "policyId", "priority", "requestType", "requesterId", "resolvedAt", "status", "ticketNumber", "updatedAt") SELECT "SLA", "assignedAuthorityId", "assignedDepartment", "category", "createdAt", "description", "dueAt", "exitTime", "id", "idempotencyKey", "incidentId", "location", "metadata", "policyId", "priority", "requestType", "requesterId", "resolvedAt", "status", "ticketNumber", "updatedAt" FROM "Request";
DROP TABLE "Request";
ALTER TABLE "new_Request" RENAME TO "Request";
CREATE UNIQUE INDEX "Request_ticketNumber_key" ON "Request"("ticketNumber");
CREATE UNIQUE INDEX "Request_idempotencyKey_key" ON "Request"("idempotencyKey");
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");
CREATE INDEX "Request_dueAt_status_idx" ON "Request"("dueAt", "status");
CREATE INDEX "Request_status_idx" ON "Request"("status");
CREATE INDEX "Request_incidentId_idx" ON "Request"("incidentId");
CREATE INDEX "Request_assignedAuthorityId_status_idx" ON "Request"("assignedAuthorityId", "status");
CREATE INDEX "Request_requesterId_status_idx" ON "Request"("requesterId", "status");
CREATE INDEX "Request_requesterId_updatedAt_idx" ON "Request"("requesterId", "updatedAt");
CREATE INDEX "Request_status_createdAt_idx" ON "Request"("status", "createdAt");
CREATE INDEX "Request_status_updatedAt_idx" ON "Request"("status", "updatedAt");
CREATE INDEX "Request_status_resolvedAt_idx" ON "Request"("status", "resolvedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "RecurringIssue_status_lastDetectedAt_idx" ON "RecurringIssue"("status", "lastDetectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringIssue_category_location_key" ON "RecurringIssue"("category", "location");
