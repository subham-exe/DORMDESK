-- CreateTable
CREATE TABLE "College" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Department_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Hostel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Hostel_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuthorityLevel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "levelNumber" INTEGER NOT NULL
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
    "accountStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "User_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "AuthorityLevel" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_departmentRefId_fkey" FOREIGN KEY ("departmentRefId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_hostelRefId_fkey" FOREIGN KEY ("hostelRefId") REFERENCES "Hostel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("block", "branch", "department", "email", "hostel", "id", "isResident", "name", "password", "phone", "role", "room", "year") SELECT "block", "branch", "department", "email", "hostel", "id", "isResident", "name", "password", "phone", "role", "room", "year" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "College_name_key" ON "College"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_collegeId_key" ON "Department"("name", "collegeId");

-- CreateIndex
CREATE UNIQUE INDEX "Hostel_name_collegeId_key" ON "Hostel"("name", "collegeId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthorityLevel_name_key" ON "AuthorityLevel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AuthorityLevel_levelNumber_key" ON "AuthorityLevel"("levelNumber");
