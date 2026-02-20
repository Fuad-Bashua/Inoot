-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "reminderAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "tasks_reminderAt_idx" ON "tasks"("reminderAt");
