-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "year" INTEGER,
    "branch" TEXT,
    "isResident" BOOLEAN NOT NULL DEFAULT false,
    "hostel" TEXT,
    "block" TEXT,
    "room" TEXT,
    "password" TEXT,
    "phone" TEXT,
    "authorityId" TEXT,
    "collegeId" TEXT,
    "departmentRefId" TEXT,
    "hostelRefId" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "accountStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "User_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "AuthorityLevel" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_departmentRefId_fkey" FOREIGN KEY ("departmentRefId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_hostelRefId_fkey" FOREIGN KEY ("hostelRefId") REFERENCES "Hostel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("accountStatus", "authorityId", "block", "branch", "collegeId", "department", "departmentRefId", "email", "hostel", "hostelRefId", "id", "isResident", "mustChangePassword", "name", "password", "phone", "role", "room", "year") SELECT "accountStatus", "authorityId", "block", "branch", "collegeId", "department", "departmentRefId", "email", "hostel", "hostelRefId", "id", "isResident", "mustChangePassword", "name", "password", "phone", "role", "room", "year" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_userId_createdAt_idx" ON "EmailVerificationToken"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");


-- Restore SYSTEM_ADMIN singularity triggers (lost during User table recreation)
CREATE TRIGGER IF NOT EXISTS "unique_system_admin_user_insert"
BEFORE INSERT ON "User"
WHEN NEW."authorityId" = (SELECT "id" FROM "AuthorityLevel" WHERE "name" = 'SYSTEM_ADMIN')
BEGIN
    SELECT RAISE(ABORT, 'Only one SYSTEM_ADMIN user is allowed')
    WHERE (SELECT COUNT(*) FROM "User" WHERE "authorityId" = NEW."authorityId") > 0;
END;

CREATE TRIGGER IF NOT EXISTS "unique_system_admin_user_update"
BEFORE UPDATE OF "authorityId" ON "User"
WHEN NEW."authorityId" = (SELECT "id" FROM "AuthorityLevel" WHERE "name" = 'SYSTEM_ADMIN') AND OLD."authorityId" != NEW."authorityId"
BEGIN
    SELECT RAISE(ABORT, 'Only one SYSTEM_ADMIN user is allowed')
    WHERE (SELECT COUNT(*) FROM "User" WHERE "authorityId" = NEW."authorityId") > 0;
END;
