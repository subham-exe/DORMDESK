-- AlterTable
ALTER TABLE "EmailDeliveryLog" ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "EmailDeliveryLog_idempotencyKey_key" ON "EmailDeliveryLog"("idempotencyKey");

