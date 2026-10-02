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
