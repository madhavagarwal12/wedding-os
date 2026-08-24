-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Wedding" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_assignedToId_idx" ON "Lead"("assignedToId");

-- CreateIndex
CREATE INDEX "Lead_nextFollowUpDate_idx" ON "Lead"("nextFollowUpDate");

-- CreateIndex
CREATE INDEX "Lead_archivedAt_idx" ON "Lead"("archivedAt");

-- CreateIndex
CREATE INDEX "Client_archivedAt_idx" ON "Client"("archivedAt");

-- CreateIndex
CREATE INDEX "Wedding_status_idx" ON "Wedding"("status");

-- CreateIndex
CREATE INDEX "Wedding_startDate_idx" ON "Wedding"("startDate");

-- CreateIndex
CREATE INDEX "Wedding_archivedAt_idx" ON "Wedding"("archivedAt");

-- CreateIndex
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "ClientPayment_dueDate_idx" ON "ClientPayment"("dueDate");

-- CreateIndex
CREATE INDEX "ClientPayment_status_idx" ON "ClientPayment"("status");

-- CreateIndex
CREATE INDEX "VendorPayment_dueDate_idx" ON "VendorPayment"("dueDate");

-- CreateIndex
CREATE INDEX "VendorPayment_status_idx" ON "VendorPayment"("status");
