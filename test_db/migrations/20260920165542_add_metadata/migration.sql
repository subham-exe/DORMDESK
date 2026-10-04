/*
  Warnings:

  - You are about to drop the column `requestId` on the `AuditLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Request" ADD COLUMN "metadata" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AuditLog" ("action", "actorId", "entity", "entityId", "id", "metadata", "timestamp") SELECT "action", "actorId", "entity", "entityId", "id", "metadata", "timestamp" FROM "AuditLog";
DROP TABLE "AuditLog";
ALTER TABLE "new_AuditLog" RENAME TO "AuditLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
