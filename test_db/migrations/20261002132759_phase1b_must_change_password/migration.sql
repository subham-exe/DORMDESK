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
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "accountStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "User_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "AuthorityLevel" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_departmentRefId_fkey" FOREIGN KEY ("departmentRefId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_hostelRefId_fkey" FOREIGN KEY ("hostelRefId") REFERENCES "Hostel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("accountStatus", "authorityId", "block", "branch", "collegeId", "department", "departmentRefId", "email", "hostel", "hostelRefId", "id", "isResident", "name", "password", "phone", "role", "room", "year") SELECT "accountStatus", "authorityId", "block", "branch", "collegeId", "department", "departmentRefId", "email", "hostel", "hostelRefId", "id", "isResident", "name", "password", "phone", "role", "room", "year" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
