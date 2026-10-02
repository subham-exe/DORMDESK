-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuthorityLevel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "levelNumber" INTEGER,
    "capabilities" TEXT,
    "collegeId" TEXT,
    CONSTRAINT "AuthorityLevel_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AuthorityLevel" ("id", "levelNumber", "name") SELECT "id", "levelNumber", "name" FROM "AuthorityLevel";
DROP TABLE "AuthorityLevel";
ALTER TABLE "new_AuthorityLevel" RENAME TO "AuthorityLevel";
CREATE UNIQUE INDEX "AuthorityLevel_name_key" ON "AuthorityLevel"("name");
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
    "isSerious" BOOLEAN NOT NULL DEFAULT false,
    "seriousCategory" TEXT,
    "seriousDowngradeReason" TEXT,
    "seriousDowngradeActorId" TEXT,
    CONSTRAINT "Request_recurringIssueId_fkey" FOREIGN KEY ("recurringIssueId") REFERENCES "RecurringIssue" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Request_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Request_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Request_assignedAuthorityId_fkey" FOREIGN KEY ("assignedAuthorityId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Request_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Request" ("SLA", "assignedAuthorityId", "assignedDepartment", "category", "createdAt", "description", "dueAt", "exitTime", "id", "idempotencyKey", "incidentId", "location", "metadata", "policyId", "priority", "recurringIssueId", "requestType", "requesterId", "resolvedAt", "status", "ticketNumber", "updatedAt") SELECT "SLA", "assignedAuthorityId", "assignedDepartment", "category", "createdAt", "description", "dueAt", "exitTime", "id", "idempotencyKey", "incidentId", "location", "metadata", "policyId", "priority", "recurringIssueId", "requestType", "requesterId", "resolvedAt", "status", "ticketNumber", "updatedAt" FROM "Request";
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
