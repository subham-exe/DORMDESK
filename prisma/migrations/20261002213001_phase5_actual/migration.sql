-- CreateTable
CREATE TABLE "EmailDeliveryLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipientId" TEXT,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailDeliveryLog_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailQuota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "EmailDeliveryLog_recipient_createdAt_idx" ON "EmailDeliveryLog"("recipient", "createdAt");

-- CreateIndex
CREATE INDEX "EmailDeliveryLog_status_createdAt_idx" ON "EmailDeliveryLog"("status", "createdAt");

