-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "grantedAt" DATETIME,
    "withdrawnAt" DATETIME,
    "consentVersion" TEXT NOT NULL,
    "consentTextHash" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_purpose_createdAt_idx" ON "ConsentRecord"("userId", "purpose", "createdAt");

